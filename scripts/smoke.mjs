/* ------------------------------------------------------------------ *
 * Interaction smoke test against dist/ (run `npm run build` first),
 * or against the live site: SITE_URL=https://jenin-23.github.io npm run test:smoke
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
const ORIGIN = process.env.SITE_URL?.replace(/\/$/, '') ?? `http://localhost:${server.address().port}`;
const url = (p) => `${ORIGIN}${BASE}${p}`;
console.log(`testing ${ORIGIN}${BASE}/`);

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
// every asset (fonts, images, scripts, styles) must load
const broken = [];
page.on('response', (r) => {
  const t = r.request().resourceType();
  if (['stylesheet', 'script', 'image', 'font'].includes(t) && r.status() >= 400) broken.push(`${r.status()} ${r.url()}`);
});
page.on('requestfailed', (r) => {
  // cancelled by navigating away (e.g. taking a paper off the shelf) is not broken
  if (r.url().startsWith('data:') || /ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i.test(r.failure()?.errorText ?? '')) return;
  broken.push(`failed ${r.url()} (${r.failure()?.errorText})`);
});

// --- entertainment: gate, validation, April greeting, memory
await page.goto(url('/issues/001/entertainment.html'));
check(await page.locator('#birthdayModal').evaluate((d) => d.open), 'birthday gate opens on first visit');
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');
await page.waitForTimeout(150); // a force-closed gate would have reopened or stayed shut by now
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

// --- every newspaper page: loads, has the shell, no script errors
const ISSUE_PAGES = ['/issues/001/', '/issues/001/news.html', '/issues/001/columns.html', '/issues/001/entertainment.html', '/issues/001/about.html', '/issues/001/contact.html', '/archive.html'];
const PAGES = ['/', ...ISSUE_PAGES, '/issues/002/'];
for (const p of ISSUE_PAGES) {
  const before = errors.length;
  const res = await page.goto(url(p));
  const shell = await page.evaluate(() => ['.masthead', '.site-nav', '.ticker', '.site-footer', '#copyToast', '.library-ref'].every((s) => document.querySelector(s)));
  check(res.ok() && shell && errors.length === before, `${p} loads with masthead, nav, ticker, footer, toast, library reference`);
}

// --- the library (/)
await page.goto(url('/'));
const lib = await page.evaluate(() => ({
  page: document.body.dataset.page,
  issueData: !!document.getElementById('issue-data'),
  papers: [...document.querySelectorAll('a[data-take]')].map((a) => ({ href: a.getAttribute('href'), status: a.dataset.status })),
}));
check(lib.page === 'library' && !lib.issueData, '/ opens the library (مكتبة قال قيل), not Issue 001');
check(lib.papers.every((p) => p.status !== 'draft'), 'no draft issue stands on the shelf');
check(lib.papers.some((p) => p.href.endsWith('/issues/001/') && ['published', 'archived'].includes(p.status)), 'Issue 001 is on the shelf as a finished newspaper');
check(lib.papers.some((p) => p.href.endsWith('/issues/002/') && p.status === 'editing'), 'Issue 002 is on the shelf as an unfinished copy (editing)');
check(lib.papers.length === 2, `exactly the public issues are shelved (${lib.papers.length})`);

await page.locator('a[data-take][href$="/issues/001/"]').click();
await page.waitForURL(/issues\/001\/$/);
check(await page.evaluate(() => document.documentElement.classList.contains('arrive-from-library')), 'taking 001 off the shelf opens /issues/001/ (as an opened copy)');
await page.locator('.library-ref').click();
await page.waitForURL(/qal-qeel-al-khalil\/$/);
check(true, 'the masthead reference leads back to the library');
await page.locator('a[data-take][href$="/issues/002/"]').click();
await page.waitForURL(/issues\/002\/$/);
check((await page.evaluate(() => document.body.dataset.page)) === 'newsroom', 'Issue 002 opens its newsroom proof');

// --- the newsroom proof (Issue 002, editing)
const proof = await page.evaluate(() => ({
  nav: [...document.querySelectorAll('.nav-link')].map((a) => a.textContent.trim()),
  articles: document.querySelectorAll('.story-card').length,
}));
check(proof.articles === 0 && !proof.nav.includes('الأخبار') && !proof.nav.includes('المنوعات'), 'the proof exposes no news/columns/entertainment sections');
check((await page.goto(url('/issues/002/news.html'))).status() === 404, '/issues/002/news.html does not exist');
await page.goto(url('/issues/002/'));
await page.locator('[data-proof-frame]').click();
check(await page.locator('[data-proof-frame]').evaluate((b) => b.classList.contains('is-stamped')), 'empty photo frame takes a stamp when pressed');
await page.locator('[data-proof-note]').focus();
await page.keyboard.press('Enter');
check((await page.locator('[data-proof-note]').getAttribute('aria-expanded')) === 'true', 'internal note unfolds (keyboard)');
check((await page.locator('.proof-note-text').textContent()) === 'ملاحظة داخلية — ليس للنشر', '…and says nothing useful');

// --- archive: the folded copy opens its edition
await page.goto(url('/archive.html'));
await page.locator('.archive-item').first().click({ position: { x: 40, y: 40 } });
await page.waitForURL(/issues\/001\/$/);
check(true, 'archive card for 001 opens /issues/001/');

// --- keyboard: focus is visible, dialogs trap and return focus
const focused = () =>
  page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { cls: el.className, href: el.getAttribute('href'), ring: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' };
  });
await page.goto(url('/'));
await page.keyboard.press('Tab');
const shelfFocus = await focused();
check(shelfFocus.cls.includes('shelf-paper') && shelfFocus.ring, 'library: Tab reaches the first newspaper with a visible focus ring');
await page.keyboard.press('Enter');
await page.waitForURL(/issues\/001\/$/);
check(true, 'library: Enter takes the newspaper and opens it');

await page.goto(url('/issues/001/news.html'));
await page.keyboard.press('Tab');
const refFocus = await focused();
await page.keyboard.press('Tab');
const navFocus = await focused();
check(refFocus.cls.includes('library-ref') && refFocus.ring && navFocus.cls.includes('nav-link') && navFocus.ring, 'issue: Tab order is library reference, then section bar, with focus rings');
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

check(broken.length === 0, `all fonts, images, scripts and styles loaded${broken.length ? ': ' + broken.slice(0, 5).join(' | ') : ''}`);
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
await rp.goto(url('/'));
await rp.locator('a[data-take][href$="/issues/001/"]').click();
await rp.waitForURL(/issues\/001\/$/);
check(await rp.evaluate(() => getComputedStyle(document.querySelector('.site-shell')).opacity === '1'), 'prefers-reduced-motion: library opens the issue at once, no take/arrival motion');
await reduced.close();

// --- library + proof at tablet width
const tablet = await browser.newContext({ viewport: { width: 820, height: 1180 } });
const tp = await tablet.newPage();
for (const p of ['/', '/issues/002/', '/issues/001/news.html']) {
  await tp.goto(url(p));
  await tp.waitForTimeout(400);
  const overflow = await tp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `${p} at 820px: no horizontal overflow`);
}
await tablet.close();

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
