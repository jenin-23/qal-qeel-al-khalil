/* ------------------------------------------------------------------ *
 * Visual before/after comparison of Issue 001.
 *
 *   before = tests/fixtures/issue-001-original (the site as it was)
 *   after  = dist/ (current build; run `npm run build` first)
 *
 * Renders every page at three widths with animations frozen, then
 * writes before/after/diff PNGs to tests/output/screenshots/ and prints
 * the share of pixels that differ. This complements verify:001: text
 * can be identical while the layout is not, and vice versa.
 *
 *   npm run screenshots              all pages, all widths
 *   npm run screenshots -- news 375  filter by page and/or width
 * ------------------------------------------------------------------ */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINAL = path.join(ROOT, 'tests/fixtures/issue-001-original');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'tests/output/screenshots');
const BASE = '/qal-qeel-al-khalil';

const PAGES = [
  { name: 'home', before: '/index.html', after: `${BASE}/issues/001/` },
  { name: 'news', before: '/news.html', after: `${BASE}/issues/001/news.html` },
  { name: 'columns', before: '/columns.html', after: `${BASE}/issues/001/columns.html` },
  { name: 'entertainment', before: '/entertainment.html', after: `${BASE}/issues/001/entertainment.html` },
  { name: 'entertainment-after-birthday', before: '/entertainment.html', after: `${BASE}/issues/001/entertainment.html`, birthday: true },
  { name: 'about', before: '/about.html', after: `${BASE}/issues/001/about.html` },
  { name: 'contact', before: '/contact.html', after: `${BASE}/issues/001/contact.html` },
  { name: 'archive', before: '/archive.html', after: `${BASE}/archive.html` },
];
const WIDTHS = [1440, 768, 375];

const args = process.argv.slice(2);
const pageFilter = args.filter((a) => !/^\d+$/.test(a));
const widthFilter = args.filter((a) => /^\d+$/.test(a)).map(Number);

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

function serve(dir, prefix = '') {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (prefix && p.startsWith(prefix)) p = p.slice(prefix.length) || '/';
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(dir, p);
    if (!file.startsWith(dir) || !fs.existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const FREEZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;

async function capture(browser, url, width, birthday) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, locale: 'ar' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: FREEZE });
  if (birthday) {
    await page.fill('#birthDay', '15');
    await page.fill('#birthMonth', '6');
    await page.fill('#birthYear', '1990');
    await page.click('#birthdayForm button');
    await page.waitForTimeout(150);
  }
  // load lazy images, then return to the top
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => (img.onload = img.onerror = r)))));
  });
  await page.waitForTimeout(200);
  const buf = await page.screenshot({ fullPage: true });
  await context.close();
  return PNG.sync.read(buf);
}

function pad(img, width, height) {
  if (img.width === width && img.height === height) return img;
  const out = new PNG({ width, height });
  out.data.fill(255);
  PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
  return out;
}

const before = await serve(ORIGINAL);
const after = await serve(DIST, BASE);
const urlOf = (server, p) => `http://localhost:${server.address().port}${p}`;
for (const d of ['before', 'after', 'diff']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const browser = await chromium.launch();
const rows = [];
for (const pg of PAGES) {
  if (pageFilter.length && !pageFilter.some((f) => pg.name.startsWith(f))) continue;
  for (const width of WIDTHS) {
    if (widthFilter.length && !widthFilter.includes(width)) continue;
    const a = await capture(browser, urlOf(before, pg.before), width, pg.birthday);
    const b = await capture(browser, urlOf(after, pg.after), width, pg.birthday);
    const w = Math.max(a.width, b.width);
    const h = Math.max(a.height, b.height);
    const A = pad(a, w, h);
    const B = pad(b, w, h);
    const diff = new PNG({ width: w, height: h });
    const changed = pixelmatch(A.data, B.data, diff.data, w, h, { threshold: 0.1 });
    const name = `${pg.name}-${width}.png`;
    fs.writeFileSync(path.join(OUT, 'before', name), PNG.sync.write(a));
    fs.writeFileSync(path.join(OUT, 'after', name), PNG.sync.write(b));
    fs.writeFileSync(path.join(OUT, 'diff', name), PNG.sync.write(diff));
    const pct = ((changed / (w * h)) * 100).toFixed(2);
    rows.push({ page: pg.name, width, 'before h': a.height, 'after h': b.height, 'changed %': pct });
    console.log(`${pg.name.padEnd(30)} ${String(width).padStart(4)}px  height ${a.height} → ${b.height}  changed ${pct}%`);
  }
}
await browser.close();
before.close();
after.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rows, null, 2));
console.log(`\nImages: ${path.relative(ROOT, OUT)}/{before,after,diff}/`);
