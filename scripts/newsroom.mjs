/* ------------------------------------------------------------------ *
 * The newsroom (private preview) edition of the site, on this computer:
 *   node scripts/newsroom.mjs build    → dist-preview/ (never deployed)
 *   node scripts/newsroom.mjs preview  → serve dist-preview/ locally
 * Unreleased issues are included and every page is marked DEV.
 * (`npm run dev` is always the newsroom edition as well.)
 * ------------------------------------------------------------------ */
import { spawn } from 'node:child_process';

const cmd = process.argv[2];
if (!['build', 'preview'].includes(cmd)) {
  console.error('usage: node scripts/newsroom.mjs build|preview');
  process.exit(2);
}
const child = spawn('npx', ['astro', cmd, ...process.argv.slice(3)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, QQ_EDITION: 'preview' },
});
child.on('exit', (code) => process.exit(code ?? 1));
