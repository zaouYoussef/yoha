/**
 * Lance Django (8000) + Next.js (3002) en dev.
 * Usage : npm run dev:all  (depuis YoHa/)
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const backend = path.resolve(root, '..', 'backend');

const py = process.platform === 'win32' ? 'python' : 'python3';

const django = spawn(py, ['manage.py', 'runserver', '8000'], {
  cwd: backend,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const next = spawn('npm', ['run', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

function shutdown() {
  django.kill();
  next.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

django.on('exit', (code) => {
  if (code) shutdown();
});
next.on('exit', (code) => {
  if (code) shutdown();
});
