import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const backendPort = process.env.BACKEND_PORT || '3000';
const frontendPort = process.env.PORT || '8080';

function spawnProcess(cwd, command, args, env) {
    const child = spawn(command, args, {
        cwd,
        env,
        shell: true,
        stdio: 'inherit',
    });

    child.on('exit', (code) => {
        console.log(`${command} ${args.join(' ')} exited with code ${code}`);
        process.exit(code ?? 0);
    });

    child.on('error', (err) => {
        console.error(`Failed to start ${command} ${args.join(' ')}:`, err);
        process.exit(1);
    });

    return child;
}

const env = { ...process.env };
const backendEnv = { ...env, PORT: backendPort };
const frontendEnv = { ...env, PORT: frontendPort };

console.log('Starting backend on port', backendPort);
console.log('Starting frontend on port', frontendPort);

spawnProcess(path.join(rootDir, 'backend'), 'npm', ['start'], backendEnv);
spawnProcess(path.join(rootDir, 'frontend'), 'npm', ['start'], frontendEnv);

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
