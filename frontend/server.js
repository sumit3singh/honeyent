import http from 'node:http';

// Diagnostic startup logging to aid Railway debugging
console.log('Starting frontend server runner');
console.log('NODE_VERSION', process.version);
console.log('CWD', process.cwd());
console.log('ENV PORT', process.env.PORT);

// Dynamically import the built server entry produced by the Vite/TanStack build
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidates = [
    // relative to this file (normal dev layout)
    path.join(__dirname, 'dist', 'server', 'server.js'),
    // if process.cwd() is repo root
    path.join(process.cwd(), 'dist', 'server', 'server.js'),
    // if build output is under frontend/dist when started from repo root
    path.join(process.cwd(), 'frontend', 'dist', 'server', 'server.js'),
    // one level up from this file
    path.join(__dirname, '..', 'dist', 'server', 'server.js'),
];

let handler;
let lastError;
for (const candidate of candidates) {
    try {
        console.log('Trying server entry at', candidate);
        const mod = await import(pathToFileURL(candidate).href);
        handler = mod.default ?? mod;
        console.log('Loaded server entry from', candidate);
        break;
    } catch (err) {
        lastError = err;
        console.warn('Import failed for', candidate, err && err.code ? err.code : 'error');
    }
}

if (!handler) {
    console.error('Failed to import built server entry. Tried candidates:', candidates);
    console.error('Last error:', lastError && (lastError.stack || lastError));
    process.exit(1);
}

const PORT = Number(process.env.PORT || 3000);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 3000);
const clientDist = path.join(__dirname, 'dist', 'client');

console.log('Frontend runner backend port:', BACKEND_PORT, 'clientDist:', clientDist);

async function fetchWithRetries(url, init, retries = 4, delayMs = 150) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fetch(url, init);
        } catch (err) {
            lastError = err;
            const code = err && err.code ? err.code : undefined;
            console.warn(`fetchWithRetries attempt ${attempt + 1}/${retries + 1} failed`, { url, code, message: String(err) });
            if (attempt < retries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError;
}

async function proxyApiRequest(req, res) {
    await proxyBackendRequest(req, res, '/api');
}

async function proxyHealthRequest(req, res) {
    await proxyBackendRequest(req, res, '/health');
}

async function proxyBackendRequest(req, res, basePath) {
    const hostHeader = req.headers.host || `127.0.0.1:${PORT}`;
    const url = new URL(req.url, `http://${hostHeader}`);
    const backendUrl = `http://127.0.0.1:${BACKEND_PORT}${url.pathname}${url.search}`;
    console.log('proxyBackendRequest:', req.method, backendUrl, 'path=', basePath, 'requestHost=', hostHeader);

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const headers = headersToObject(req.headers || {});
    delete headers.host;
    delete headers.connection;
    delete headers['keep-alive'];
    delete headers['transfer-encoding'];
    delete headers['upgrade'];
    delete headers['content-length'];
    delete headers.expect;
    const init = {
        method: req.method,
        headers,
        ...(hasBody ? { body: req, duplex: 'half' } : {}),
    };

    try {
        const response = await fetchWithRetries(backendUrl, init);
        res.statusCode = response.status;
        for (const [k, v] of response.headers) {
            if (k.toLowerCase() === 'transfer-encoding') continue;
            res.setHeader(k, v);
        }

        if (!response.body) return res.end();
        const reader = response.body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(Buffer.from(value));
            }
        } finally {
            res.end();
        }
    } catch (err) {
        const code = err && err.code ? err.code : 'UNKNOWN';
        console.error('proxyBackendRequest final error:', err, 'code=', code);
        res.statusCode = 502;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Bad Gateway', message: String(err), code }));
    }
}

function inferContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return {
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/manifest+json; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
        '.map': 'application/json; charset=utf-8',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.ttf': 'font/ttf',
    }[ext] ?? 'application/octet-stream';
}

function resolveStaticFile(urlPath) {
    if (urlPath === '/manifest.webmanifest' || urlPath === '/favicon.ico' || urlPath === '/icon-192.png' || urlPath === '/icon-512.png') {
        return path.join(clientDist, urlPath.replace(/^\//, ''));
    }

    if (urlPath.startsWith('/assets/')) {
        return path.join(clientDist, urlPath.replace(/^\/assets\//, 'assets/'));
    }

    return undefined;
}

async function serveStatic(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePath = resolveStaticFile(url.pathname);
    console.log('serveStatic: request', url.pathname, 'resolved->', filePath);
    if (!filePath) return false;
    const exists = fs.existsSync(filePath);
    console.log('serveStatic: exists?', exists, filePath);
    if (!exists) {
        return false;
    }

    res.statusCode = 200;
    res.setHeader('content-type', inferContentType(filePath));
    try {
        const stream = fs.createReadStream(filePath);
        stream.on('open', () => console.log('serveStatic: streaming', filePath));
        stream.pipe(res);
        stream.on('error', (error) => {
            console.error('Static file stream error:', error, filePath);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain; charset=utf-8');
            }
            res.end('Internal Server Error');
        });
    } catch (err) {
        console.error('serveStatic caught error:', err, filePath);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('content-type', 'text/plain; charset=utf-8');
        }
        res.end('Internal Server Error');
    }
    return true;
}

function headersToObject(headers) {
    const obj = {};
    for (const [k, v] of Object.entries(headers)) {
        if (v === undefined) continue;
        obj[k] = Array.isArray(v) ? v.join(', ') : String(v);
    }
    return obj;
}

async function sendResponse(nodeRes, res) {
    nodeRes.statusCode = res.status;
    for (const [k, v] of res.headers) {
        nodeRes.setHeader(k, v);
    }

    if (!res.body) return nodeRes.end();

    const reader = res.body.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            nodeRes.write(Buffer.from(value));
        }
    } finally {
        nodeRes.end();
    }
}

const server = http.createServer(async (req, res) => {
    try {
        if (await serveStatic(req, res)) {
            return;
        }

        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        if (urlObj.pathname === '/health' || urlObj.pathname.startsWith('/health/')) {
            await proxyHealthRequest(req, res);
            return;
        }

        if (urlObj.pathname.startsWith('/api/')) {
            await proxyApiRequest(req, res);
            return;
        }

        const url = `http://${req.headers.host}${req.url}`;

        const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
        const init = {
            method: req.method,
            headers: headersToObject(Object.entries(req.headers || {})),
            ...(hasBody ? { body: req, duplex: 'half' } : {}),
        };

        const request = new Request(url, init);

        const response = await handler.fetch(request, undefined, undefined);
        await sendResponse(res, response);
    } catch (err) {
        console.error('Server runner error:', err);
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end('Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

export default server;
