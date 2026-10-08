/* ------------------------------------------------------------------ *
 * Production draft-leak check. Runs after every production build
 * (`npm run build`) and in the deploy workflow; any finding fails it.
 *
 * It reads the generated files in dist/ (not the dev server) and checks:
 *  1. dist/ is a production build: no newsroom marks anywhere.
 *  2. An unreleased issue has no reader pages: an issue in `editing`
 *     only has its proof (/issues/NNN/index.html), a `draft` issue nothing.
 *  3. No text from unreleased work appears in any generated file
 *     (HTML, JS, CSS, JSON, XML, …): every sentence and every string
 *     literal of each private edition (src/issues/NNN/edition/) and of
 *     each draft issue is searched for.
 *  4. No image or other asset from unreleased work was emitted.
 *
 * Usage: node scripts/verify-production.mjs [distDir]
 * ------------------------------------------------------------------ */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readIssues } from './issue-status.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(ROOT, process.argv[2] ?? 'dist');
const TEXT = /\.(html?|js|mjs|css|json|xml|txt|svg|webmanifest|map|md)$/i;
const MIN = 12; // shortest private string worth searching for

const problems = [];
const fail = (msg) => problems.push(msg);
const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    : [];
const rel = (p) => path.relative(ROOT, p).replaceAll('\\', '/');
const norm = (s) =>
  s
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const sha = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`✗ no build found at ${rel(DIST)}: run the production build first`);
  process.exit(1);
}

/* ---- which work is unreleased ------------------------------------- */
const srcPaths = walk(path.join(ROOT, 'src', 'issues')).map(rel);
const readSrc = (p) => (fs.existsSync(path.join(ROOT, p)) ? fs.readFileSync(path.join(ROOT, p), 'utf8') : null);
const issues = readIssues(srcPaths, readSrc).map((i) => ({
  ...i,
  // a draft issue is private as a whole; an unreleased issue's edition is private
  privateFiles: (i.status === 'draft' || i.status === 'unknown' ? i.files : i.released ? [] : i.editionFiles).map((p) => path.join(ROOT, p)),
}));
const privateSet = new Set(issues.flatMap((i) => i.privateFiles));

/** sentences / string literals of a private file */
function fragments(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = [];
  if (/\.html?$/i.test(file)) {
    for (const part of src.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').split(/<[^>]+>/)) out.push(part);
  } else {
    for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
      const s = m[1] ?? m[2] ?? m[3];
      // markup inside a string (e.g. hero html) is searched as text
      out.push(...s.split(/<[^>]+>/));
    }
  }
  return out
    .map(norm)
    .filter((s) => s.length >= MIN)
    // file paths, ids and other code-like tokens are not editorial text
    .filter((s) => /[؀-ۿ]/.test(s) || /\s/.test(s))
    .filter((s) => !/^(\.{0,2}\/|https?:)/.test(s));
}

/* text that is public anyway (shared phrases, approved teaser) is not a leak */
const publicSource = walk(path.join(ROOT, 'src'))
  .filter((f) => !privateSet.has(f) && /\.(ts|astro|html|md|json|css)$/.test(f))
  .map((f) => norm(fs.readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ')))
  .join('\n');

/* ---- the generated files ------------------------------------------ */
const outFiles = walk(DIST);
const outText = outFiles
  .filter((f) => TEXT.test(f))
  .map((f) => ({ file: f, text: norm(fs.readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ')), raw: fs.readFileSync(f, 'utf8') }));

// 1. production, not the newsroom
const MARKS = ['data-dev-mark', 'dev-article-state', 'data-editorial', '[تطوير]', 'نسخة التطوير'];
for (const { file, raw } of outText) {
  for (const mark of MARKS) if (raw.includes(mark)) fail(`${rel(file)}: newsroom mark «${mark}» in a production build`);
}
for (const f of outFiles) if (/[\\/]edition[\\/]/.test(rel(f))) fail(`${rel(f)}: an edition path was emitted`);

// 2. unreleased issues have no reader pages
for (const i of issues.filter((x) => !x.released)) {
  const dir = path.join(DIST, 'issues', i.number);
  const pages = walk(dir).map((f) => path.relative(dir, f).replaceAll('\\', '/'));
  const allowed = i.status === 'editing' ? ['index.html'] : [];
  for (const p of pages) if (!allowed.includes(p)) fail(`issue ${i.number} is "${i.status}" but dist/issues/${i.number}/${p} was built`);
}

// 3. no private text in any generated file
let searched = 0;
for (const i of issues) {
  const seen = new Set();
  for (const file of i.privateFiles.filter((f) => /\.(ts|js|mjs|json|html?|md|txt)$/i.test(f))) {
    for (const frag of fragments(file)) {
      if (seen.has(frag) || publicSource.includes(frag)) continue;
      seen.add(frag);
      searched++;
      const hit = outText.find((o) => o.text.includes(frag) || o.raw.includes(frag));
      if (hit) fail(`issue ${i.number} (${i.status}): private text from ${rel(file)} appears in ${rel(hit.file)}: «${frag.slice(0, 60)}…»`);
    }
  }
}

// 4. no private asset was emitted (same bytes, or the same file name)
const outHashes = new Map(outFiles.map((f) => [sha(f), f]));
const outNames = outFiles.map((f) => path.basename(f).toLowerCase());
let assets = 0;
const isAsset = (f) => !/\.(ts|js|mjs|json|html?|md|txt)$/i.test(f) && !path.basename(f).startsWith('.') && fs.statSync(f).size > 0;
for (const file of [...privateSet].filter(isAsset)) {
  assets++;
  const same = outHashes.get(sha(file));
  if (same) fail(`private asset ${rel(file)} was emitted as ${rel(same)}`);
  const stem = path.basename(file).replace(/\.[^.]+$/, '').toLowerCase();
  const named = outNames.find((n) => n.startsWith(stem + '.') || n === path.basename(file).toLowerCase());
  if (named) fail(`an asset named like private ${rel(file)} was emitted (${named})`);
}

/* ---- report ------------------------------------------------------- */
const unreleased = issues.filter((i) => !i.released);
console.log(`Production leak check: ${rel(DIST)}/ (${outFiles.length} files)`);
for (const i of issues) {
  console.log(`  issue ${i.number}: ${i.status}${i.released ? '' : `, private files: ${i.privateFiles.length}`}`);
}
console.log(`  searched ${searched} private text fragments and ${assets} private assets in ${outText.length} text files`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\n✗ ${problems.length} problem(s): unreleased material would reach the public site. Do not deploy.`);
  process.exit(1);
}
console.log(`✓ no unreleased material in the production build${unreleased.length ? ` (unreleased: ${unreleased.map((i) => i.number).join(', ')})` : ''}`);
