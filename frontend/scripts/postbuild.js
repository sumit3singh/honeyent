import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const clientDir = path.join(distDir, 'client');

if (fs.existsSync(distDir)) {
    // 1. Ensure frontend/dist/client exists
    if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
        for (const item of fs.readdirSync(distDir)) {
            if (item === 'client' || item === 'server' || item === 'frontend') continue;
            fs.cpSync(path.join(distDir, item), path.join(clientDir, item), { recursive: true });
        }
    }

    // 2. Ensure frontend/dist has assets if they were only in dist/client
    if (fs.existsSync(clientDir) && !fs.existsSync(path.join(distDir, 'assets'))) {
        for (const item of fs.readdirSync(clientDir)) {
            fs.cpSync(path.join(clientDir, item), path.join(distDir, item), { recursive: true });
        }
    }

    // 3. In case Netlify UI configured publish as "frontend/dist/client" relative to base "frontend"
    const doubleNestedClient = path.join(frontendDir, 'frontend', 'dist', 'client');
    if (!fs.existsSync(doubleNestedClient)) {
        fs.mkdirSync(doubleNestedClient, { recursive: true });
        for (const item of fs.readdirSync(clientDir)) {
            fs.cpSync(path.join(clientDir, item), path.join(doubleNestedClient, item), { recursive: true });
        }
    }

    // 4. Also mirror functions if needed
    const functionsInternal = path.join(frontendDir, '.netlify', 'functions-internal');
    const nestedFunctions = path.join(frontendDir, 'frontend', '.netlify', 'functions-internal');
    if (fs.existsSync(functionsInternal) && !fs.existsSync(nestedFunctions)) {
        fs.mkdirSync(nestedFunctions, { recursive: true });
        fs.cpSync(functionsInternal, nestedFunctions, { recursive: true });
    }

    console.log('[postbuild] Successfully ensured dist, dist/client, and nested paths are ready for Netlify.');
}
