import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = path.join(__dirname, '..', '..', 'frontend', 'dist', 'server', 'server.js');
console.log('Wrapper: attempting to load', target);
if (!fs.existsSync(target)) {
    console.error('Wrapper: target does not exist:', target);
    process.exit(1);
}
try {
    await import(pathToFileURL(target).href);
} catch (err) {
    console.error('Wrapper: failed to import target', err && err.stack ? err.stack : err);
    process.exit(1);
}
