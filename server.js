import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Root server runner starting');
console.log('CWD', process.cwd());
console.log('SERVER_PATH', __dirname);
console.log('ENV PORT', process.env.PORT);

const frontendServerPath = path.join(__dirname, 'frontend', 'server.js');

try {
    const mod = await import(frontendServerPath);
    if (mod.default?.listen) {
        console.log('Frontend server imported successfully, exiting root runner');
    } else {
        console.log('Frontend server module imported, default export:', Object.keys(mod));
    }
} catch (err) {
    console.error('Failed to import frontend/server.js from root server.js');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
}
