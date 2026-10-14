import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const clientDir = path.join(distDir, 'client');

if (fs.existsSync(distDir)) {
    if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
        for (const item of fs.readdirSync(distDir)) {
            if (item === 'client' || item === 'server') continue;
            fs.cpSync(path.join(distDir, item), path.join(clientDir, item), { recursive: true });
        }
        console.log('[postbuild] Mirrored dist files to dist/client');
    } else if (fs.existsSync(clientDir) && !fs.existsSync(path.join(distDir, 'assets'))) {
        for (const item of fs.readdirSync(clientDir)) {
            fs.cpSync(path.join(clientDir, item), path.join(distDir, item), { recursive: true });
        }
        console.log('[postbuild] Mirrored dist/client files to dist');
    }
}
