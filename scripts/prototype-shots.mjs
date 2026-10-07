/* Screenshots of the press-theme prototype (dist/prototype/news.html). */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'tests/output/prototype');
const BASE = '/qal-qeel-al-khalil';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp' };
fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(BASE, '') || '/';
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, p);
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}${BASE}/prototype/news.html`;

const browser = await chromium.launch();

async function open(width, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' }); // automation only
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}

async function settleAll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2200);
  // freeze the ticker for a stable picture
  await page.addStyleTag({ content: '.ticker-group{animation-play-state:paused!important}' });
}

for (const [name, width] of [['desktop-1440', 1440], ['mobile-390', 390]]) {
  const { ctx, page } = await open(width, width > 800 ? 900 : 844);
  await settleAll(page);
  await page.screenshot({ path: path.join(OUT, `${name}-full.png`), fullPage: true });
  await page.screenshot({ path: path.join(OUT, `${name}-first-screen.png`) });
  await ctx.close();
}

// interactions (desktop)
{
  const { ctx, page } = await open(1440, 1000);
  await settleAll(page);
  const art = page.locator('#tat3eem-story');
  await art.locator('.story-toggle-btn').click();
  await page.waitForTimeout(900);
  await art.locator('.reaction-btn').nth(2).click();
  await art.locator('.copy-btn').click();
  await page.waitForTimeout(500);
  await art.screenshot({ path: path.join(OUT, 'interaction-article-open-stamped.png') });
  await page.screenshot({ path: path.join(OUT, 'interaction-toast-viewport.png') });
  await page.waitForTimeout(2200);

  await page.locator('#eslam-story .story-toggle-btn').hover();
  await page.waitForTimeout(300);
  await page.locator('#eslam-story .story-actions').screenshot({ path: path.join(OUT, 'interaction-stamp-hover.png') });

  await page.locator('.left-ads-sidebar .copy-phone-btn').first().click();
  await page.waitForTimeout(400);
  await page.locator('.left-ads-sidebar').screenshot({ path: path.join(OUT, 'ads-column.png') });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('[data-coming]').click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'interaction-notice-modal.png') });
  await ctx.close();
}

// the entrance, caught mid-settle
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(260);
  await page.screenshot({ path: path.join(OUT, 'motion-entrance-mid.png') });
  await ctx.close();
}

await browser.close();
server.close();
console.log('saved to', path.relative(ROOT, OUT));
