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

for (const legacy of ['news.html#tat3eem-story', 'news.html#eslam-story', 'entertainment.html', 'about.html', 'contact.html']) {
  await page.goto(url(`/${legacy}`));
  const [file, hash] = legacy.split('#');
  await page.waitForURL(new RegExp(`issues/001/${file.replace('.', '\\.')}${hash ? '#' + hash : ''}$`));
  check(true, `legacy /${legacy} → /issues/001/${legacy}`);
}

// --- every page: loads, has the shell, no script errors
const PAGES = ['/', '/issues/001/', '/issues/001/news.html', '/issues/001/columns.html', '/issues/001/entertainment.html', '/issues/001/about.html', '/issues/001/contact.html', '/archive.html'];
for (const p of PAGES) {
  const before = errors.length;
  const res = await page.goto(url(p));
  const shell = await page.evaluate(() => ['.masthead', '.site-nav', '.ticker', '.site-footer', '#copyToast'].every((s) => document.querySelector(s)));
  check(res.ok() && shell && errors.length === before, `${p} loads with masthead, nav, ticker, footer, toast`);
}
check((await page.goto(url('/'), { waitUntil: 'load' }), (await page.locator('.meta-box strong').first().textContent()) === '001'), '/ shows the latest published issue (001)');
check((await page.goto(url('/issues/002/'))).status() === 404, 'draft issue 002 is not published');

// --- archive: the folded copy opens its edition
await page.goto(url('/archive.html'));
await page.locator('.archive-item').first().click({ position: { x: 40, y: 40 } });
await page.waitForURL(/issues\/001\/$/);
check(true, 'archive card for 001 opens /issues/001/');

// --- keyboard: focus is visible, dialogs trap and return focus
await page.goto(url('/issues/001/news.html'));
await page.keyboard.press('Tab');
const firstFocus = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return { cls: el.className, ring: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' };
});
check(firstFocus.cls.includes('nav-link') && firstFocus.ring, 'first Tab lands on the section bar with a visible focus ring');
const coming = page.locator('[data-coming]');
await coming.focus();
await page.keyboard.press('Enter');
check(await page.locator('#comingModal').evaluate((d) => d.open), 'coming-soon opens from the keyboard');
check(await page.evaluate(() => document.getElementById('comingModal').contains(document.activeElement)), 'focus moves into the dialog');
await page.keyboard.press('Escape');
check(await page.evaluate(() => document.activeElement?.hasAttribute('data-coming')), 'Escape closes and focus returns to the opener');
await page.locator('#ziad-story .story-toggle-btn').focus();
await page.keyboard.press('Enter');
check((await page.locator('#ziad-story .story-toggle-btn').getAttribute('aria-expanded')) === 'true', 'article stamp works from the keyboard');

// --- toast stamps repeatedly without locking the page (press effect)
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
for (let i = 0; i < 3; i++) await page.locator('#tat3eem-story .reaction-btn').nth(i).click();
check((await page.locator('#copyToast').textContent()) === 'تم تسجيل انطباعك التحريري.', 'repeated toasts stay responsive');

check(errors.length === 0, `no script errors${errors.length ? ': ' + errors.join(' | ') : ''}`);

// --- reduced motion: no entrance motion, no ticker movement, all content visible
const reduced = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const rp = await reduced.newPage();
await rp.goto(url('/issues/001/news.html'));
const motion = await rp.evaluate(() => ({
  shell: getComputedStyle(document.querySelector('.site-shell')).opacity,
  ticker: getComputedStyle(document.querySelector('.ticker-group')).animationName,
  img: getComputedStyle(document.querySelector('.story-img')).opacity,
}));
check(motion.shell === '1' && motion.ticker === 'none' && motion.img === '1', 'prefers-reduced-motion: page static and fully visible');
await reduced.close();

// --- mobile: no sideways scrolling on any page
const mobile = await browser.newContext({ viewport: { width: 360, height: 780 } });
const mp = await mobile.newPage();
for (const p of PAGES) {
  await mp.goto(url(p));
  await mp.waitForTimeout(400);
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `${p} at 360px: no horizontal overflow`);
}
await mobile.close();

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
