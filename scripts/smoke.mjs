/* ------------------------------------------------------------------ *
 * Interaction smoke test against dist/ (run `npm run build` first).
 * Exercises the shared systems in a real browser.
 * ------------------------------------------------------------------ */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const BASE = '/qal-qeel-al-khalil';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(BASE, '') || '/';
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, p);
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = (p) => `http://localhost:${server.address().port}${BASE}${p}`;

let failed = 0;
const check = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) failed++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

// --- entertainment: gate, validation, April greeting, memory
await page.goto(url('/issues/001/entertainment.html'));
check(await page.locator('#birthdayModal').evaluate((d) => d.open), 'birthday gate opens on first visit');
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');
check(await page.locator('#birthdayModal').evaluate((d) => d.open), 'gate survives Escape (twice)');
await page.fill('#birthDay', '31');
await page.fill('#birthMonth', '2');
await page.fill('#birthYear', '1990');
await page.click('#birthdayForm button');
check((await page.locator('#copyToast').textContent()) === 'أدخل تاريخاً معقولاً ثم تابع.', 'invalid date shows the original toast');
await page.fill('#birthDay', '10');
await page.fill('#birthMonth', '4');
await page.click('#birthdayForm button');
check(!(await page.locator('#birthdayModal').evaluate((d) => d.open)), 'valid date closes the gate');
check(await page.locator('#birthdayMonthModal').evaluate((d) => d.open), 'April birthday opens the April modal (issue 001 month)');
check((await page.locator('#zodiacName').textContent()) === 'الحمل', 'horoscope shows the sign (الحمل)');
await page.keyboard.press('Escape');
check(!(await page.locator('#birthdayMonthModal').evaluate((d) => d.open)), 'April modal closes with Escape');
await page.reload();
check(!(await page.locator('#birthdayModal').evaluate((d) => d.open)), 'birthday remembered: no gate on revisit');
check((await page.locator('#zodiacName').textContent()) === 'الحمل', 'remembered birthday restores the horoscope');
check(!(await page.locator('#birthdayMonthModal').evaluate((d) => d.open)), 'April greeting not repeated in the same session');
await page.click('[data-birthday-change]');
check(await page.locator('#birthdayModal').evaluate((d) => d.open), '«تغيير تاريخ الميلاد» reopens the gate');
check((await page.inputValue('#birthMonth')) === '4', 'gate is prefilled with the stored birthday');
await page.keyboard.press('Escape');
check(!(await page.locator('#birthdayModal').evaluate((d) => d.open)), 'gate is dismissible when changing');
await page.click('#flipCoinBtn');
check((await page.locator('#coinResult').textContent()).startsWith('النتيجة:'), 'coin flip works');
await page.click('#quizForm button');
check((await page.locator('#copyToast').textContent()) === 'أجب أولاً، ولو بدافع الفضول فقط.', 'empty quiz shows original toast');
await page.check('input[name=q1][value=c]');
await page.click('#quizForm button');
check((await page.locator('#quizResult').textContent()).startsWith('أنت من فئة الوعي المتعب'), 'quiz result works');

// --- coming soon, from a page that used to lack the modal
await page.goto(url('/issues/001/contact.html'));
await page.click('[data-coming]');
check(await page.locator('#comingModal').evaluate((d) => d.open), 'Contact: التحقيقات opens the coming-soon modal');
check((await page.locator('#comingText').textContent()) === 'يزم محنا حكينا قادم، مش حتلاقي اشي.', 'coming-soon shows the original text');
await page.keyboard.press('Escape');
await page.fill('#contact-field-3', 'test');
await page.click('.contact-form button');
check((await page.locator('#copyToast').textContent()) === 'تم استلام الرسالة نظرياً. شكراً على الثقة.', 'Contact: form toast now appears');

// --- news: toggle, reactions
await page.goto(url('/issues/001/news.html'));
const toggle = page.locator('#tat3eem-story .story-toggle-btn');
await toggle.click();
check((await toggle.getAttribute('aria-expanded')) === 'true', 'article expands (aria-expanded=true)');
await page.locator('#tat3eem-story .reaction-btn').nth(1).click();
check((await page.locator('#tat3eem-story .reaction-btn').nth(1).getAttribute('aria-pressed')) === 'true', 'reaction selected (aria-pressed)');

// --- legacy URL keeps the anchor
await page.goto(url('/columns.html#habbab-story'));
await page.waitForURL(/issues\/001\/columns\.html#habbab-story$/);
check(page.url().endsWith('/issues/001/columns.html#habbab-story'), 'legacy /columns.html#habbab-story → /issues/001/columns.html#habbab-story');

check(errors.length === 0, `no script errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
