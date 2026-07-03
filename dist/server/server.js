import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidates = [
    path.join(__dirname, '..', '..', 'frontend', 'server.js'),
    path.join(process.cwd(), 'frontend', 'server.js'),
    path.join(__dirname, '..', '..', 'frontend', 'dist', 'server', 'server.js')
];

function headersToObject(headers) {
    const obj = {};
    for (const [k, v] of headers) {
        obj[k] = v;
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

let loaded = false;
for (const candidate of candidates) {
    console.log('Wrapper: attempting to load', candidate);
    if (!fs.existsSync(candidate)) {
        console.warn('Wrapper: target does not exist:', candidate);
        continue;
    }

    try {
        const imported = await import(pathToFileURL(candidate).href);
        const mod = imported.default ?? imported;

        if (candidate.endsWith('frontend/server.js')) {
            console.log('Wrapper: imported frontend/server.js successfully. Server should now be listening.');
            loaded = true;
            break;
        }

        if (mod && typeof mod.fetch === 'function') {
            const PORT = Number(process.env.PORT || 3000);

            const server = http.createServer(async (req, res) => {
                try {
                    const url = `http://${req.headers.host}${req.url}`;
                    const init = {
                        method: req.method,
                        headers: headersToObject(Object.entries(req.headers || {})),
                        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req
                    };
                    const request = new Request(url, init);
                    const response = await mod.fetch(request, undefined, undefined);
                    await sendResponse(res, response);
                } catch (err) {
                    console.error('Wrapper server error:', err && err.stack ? err.stack : err);
                    res.statusCode = 500;
                    res.setHeader('content-type', 'text/plain; charset=utf-8');
                    res.end('Internal Server Error');
                }
            });

            server.listen(PORT, () => {
                console.log(`Wrapper: listening on http://0.0.0.0:${PORT}`);
            });

            loaded = true;
            console.log('Wrapper: loaded built server entry and started HTTP server from', candidate);
            break;
        }

        console.warn('Wrapper: loaded module from', candidate, 'but it did not expose a fetch handler.');
    } catch (err) {
        console.error('Wrapper: failed to import', candidate, err && err.stack ? err.stack : err);
    }
}

if (!loaded) {
    console.error('Wrapper: failed to load any server entry. Tried:', candidates);
    process.exit(1);
}
