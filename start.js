import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const backendPort = Number(process.env.BACKEND_PORT || 3000);
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

function waitForPort(port, host, ms, retries) {
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const socket = net.createConnection({ port, host }, () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('error', () => {
                socket.destroy();
                if (retries <= 0) {
                    reject(new Error(`Port ${port} on ${host} did not open in time`));
                } else {
                    retries -= 1;
                    setTimeout(attempt, ms);
                }
            });
        };

        attempt();
    });
}

const env = { ...process.env };
const backendEnv = { ...env, PORT: String(backendPort) };
const frontendEnv = { ...env, PORT: frontendPort };

console.log('Starting backend on port', backendPort);
const backendProcess = spawnProcess(path.join(rootDir, 'backend'), 'npm', ['start'], backendEnv);

waitForPort(backendPort, '127.0.0.1', 1000, 30)
    .then(() => {
        console.log(`Backend is available on port ${backendPort}, starting frontend on port ${frontendPort}`);
        spawnProcess(path.join(rootDir, 'frontend'), 'npm', ['start'], frontendEnv);
    })
    .catch((err) => {
        console.error('Backend failed to become ready:', err);
        backendProcess.kill();
        process.exit(1);
    });

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
