// scripts/gradle.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === 'win32';
const gradleCmd = isWin ? 'gradlew.bat' : './gradlew';
const backendDir = resolve(__dirname, '..', 'backend');

const args = process.argv.slice(2); // pass through e.g. ['bootRun'] or ['build']
const p = spawn(gradleCmd, args, {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true, // allow .bat on Windows
});
p.on('exit', code => process.exit(code));
