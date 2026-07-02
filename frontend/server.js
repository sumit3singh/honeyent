import http from 'node:http';

// Diagnostic startup logging to aid Railway debugging
console.log('Starting frontend server runner');
console.log('NODE_VERSION', process.version);
console.log('CWD', process.cwd());
console.log('ENV PORT', process.env.PORT);

// Dynamically import the built server entry produced by the Vite/TanStack build
let handler;
try {
    const mod = await import('./dist/server/server.js');
    handler = mod.default ?? mod;
} catch (err) {
    console.error('Failed to import built server entry at ./dist/server/server.js');
    console.error(err && err.stack ? err.stack : err);
    // Exit so Railway logs show the error and the container fails fast.
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
