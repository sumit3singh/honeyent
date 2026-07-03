const path = require('path');
const fs = require('fs');

const target = path.join(__dirname, '..', '..', 'frontend', 'dist', 'server', 'server.js');
console.log('Wrapper: attempting to load', target);
if (!fs.existsSync(target)) {
    console.error('Wrapper: target does not exist:', target);
    process.exit(1);
}
try {
    require(target);
} catch (err) {
    console.error('Wrapper: failed to require target', err && err.stack ? err.stack : err);
    process.exit(1);
}
