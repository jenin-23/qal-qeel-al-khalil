/* ------------------------------------------------------------------ *
 * Visual baseline of the newspaper.
 *
 *   npm run screenshots              capture dist/ and compare with the
 *                                    committed baseline (tests/visual-baseline)
 *   npm run screenshots -- --update  overwrite the baseline
 *   npm run screenshots -- news 390  filter by page and/or width
 *
 * Pages are captured in their settled state (entrance motion skipped,
 * ticker frozen) so runs are comparable. Run `npm run build` first.
 * Text integrity is checked separately by verify:001; this is for looks.
 * ------------------------------------------------------------------ */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const BASELINE = path.join(ROOT, 'tests/visual-baseline');
const CURRENT = path.join(ROOT, 'tests/output/screenshots');
const BASE = '/qal-qeel-al-khalil';

const PAGES = [
  { name: 'library', path: '/' },
  { name: 'issue-002-proof', path: '/issues/002/' },
  { name: 'home', path: '/issues/001/' },
  { name: 'news', path: '/issues/001/news.html' },
  { name: 'columns', path: '/issues/001/columns.html' },
  { name: 'entertainment-gate', path: '/issues/001/entertainment.html' },
  { name: 'entertainment', path: '/issues/001/entertainment.html', birthday: { day: '15', month: '6', year: '1990' } },
  { name: 'about', path: '/issues/001/about.html' },
  { name: 'contact', path: '/issues/001/contact.html' },
  { name: 'archive', path: '/archive.html' },
];
const WIDTHS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'tablet', width: 820, height: 1180 },
  { label: 'mobile', width: 390, height: 844 },
];

const args = process.argv.slice(2);
const update = args.includes('--update');
const filters = args.filter((a) => !a.startsWith('--'));
const pageFilter = filters.filter((a) => !/^\d+$/.test(a));
const widthFilter = filters.filter((a) => /^\d+$/.test(a)).map(Number);

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith(BASE)) p = p.slice(BASE.length) || '/';
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, p);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = (p) => `http://localhost:${server.address().port}${BASE}${p}`;

// settled state: no entrance motion, nothing mid-animation
const SETTLE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}html{scroll-behavior:auto!important}`;

const out = update ? BASELINE : CURRENT;
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(CURRENT, 'diff'), { recursive: true });

const browser = await chromium.launch();
const rows = [];
for (const pg of PAGES) {
  if (pageFilter.length && !pageFilter.some((f) => pg.name.startsWith(f))) continue;
  for (const vp of WIDTHS) {
    if (widthFilter.length && !widthFilter.includes(vp.width)) continue;
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(url(pg.path), { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: SETTLE });
    await page.evaluate(() => document.documentElement.classList.remove('press-js'));
    if (pg.birthday) {
      await page.fill('#birthDay', pg.birthday.day);
      await page.fill('#birthMonth', pg.birthday.month);
      await page.fill('#birthYear', pg.birthday.year);
      await page.click('#birthdayForm button');
    }
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 25));
      }
      window.scrollTo(0, 0);
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
    });
    await page.waitForTimeout(150);
    const name = `${pg.name}-${vp.label}`;
    const jpg = path.join(out, `${name}.jpg`);
    await page.screenshot({ path: jpg, fullPage: true, type: 'jpeg', quality: 72 });

    // compare against the baseline using lossless captures of both
    let note = update ? 'baseline updated' : 'no baseline';
    const basePath = path.join(BASELINE, `${name}.jpg`);
    if (!update && fs.existsSync(basePath)) {
      const cur = PNG.sync.read(await page.screenshot({ fullPage: true }));
      const basePage = await ctx.newPage();
      await basePage.setContent(`<img src="data:image/jpeg;base64,${fs.readFileSync(basePath).toString('base64')}" style="display:block">`);
      await basePage.setViewportSize({ width: cur.width, height: Math.min(cur.height, 16000) });
      const ref = PNG.sync.read(await basePage.locator('img').screenshot());
      const w = Math.max(cur.width, ref.width);
      const h = Math.max(cur.height, ref.height);
      const pad = (img) => {
        if (img.width === w && img.height === h) return img;
        const o = new PNG({ width: w, height: h });
        o.data.fill(255);
        PNG.bitblt(img, o, 0, 0, img.width, img.height, 0, 0);
        return o;
      };
      const diff = new PNG({ width: w, height: h });
      const changed = pixelmatch(pad(ref).data, pad(cur).data, diff.data, w, h, { threshold: 0.25 });
      fs.writeFileSync(path.join(CURRENT, 'diff', `${name}.png`), PNG.sync.write(diff));
      note = `${((changed / (w * h)) * 100).toFixed(2)}% changed vs baseline (height ${ref.height} → ${cur.height})`;
    }
    rows.push({ name, note });
    console.log(`${name.padEnd(32)} ${note}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(`\n${update ? 'Baseline' : 'Screenshots'}: ${path.relative(ROOT, out)}`);
