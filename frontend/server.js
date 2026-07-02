import http from 'node:http';

// Import the built server entry produced by the Vite/TanStack build
import handler from './dist/server/server.js';

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
