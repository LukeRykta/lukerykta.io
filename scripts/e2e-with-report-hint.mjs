import { spawn } from 'node:child_process';

const isWin = process.platform === 'win32';
const pnpmCmd = isWin ? 'pnpm.cmd' : 'pnpm';
const nxArgs = process.argv.slice(2);
const commandArgs = ['exec', 'nx', 'e2e', 'frontend-e2e', ...nxArgs];

const child = spawn(pnpmCmd, commandArgs, {
  stdio: 'inherit',
  shell: isWin
});

child.on('error', (error) => {
  console.error('Failed to launch e2e command:', error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  const status = code === 0 ? 'passed' : 'completed with failures';
  console.log(`\nPlaywright e2e ${status}.`);
  console.log('View HTML report: pnpm run test:e2e:report\n');

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
