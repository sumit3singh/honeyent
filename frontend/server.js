import http from 'node:http';

// Diagnostic startup logging to aid Railway debugging
console.log('Starting frontend server runner');
console.log('NODE_VERSION', process.version);
console.log('CWD', process.cwd());
console.log('ENV PORT', process.env.PORT);

// Dynamically import the built server entry produced by the Vite/TanStack build
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

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

function headersToObject(headers) {
    const obj = {};
    for (const [k, v] of headers) obj[k] = v;
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
        const url = `http://${req.headers.host}${req.url}`;

        const init = {
            method: req.method,
            headers: headersToObject(Object.entries(req.headers || {})),
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
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
