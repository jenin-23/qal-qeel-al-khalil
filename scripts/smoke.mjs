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
let lastCheck = '';
const check = (cond, msg) => {
  lastCheck = msg;
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) failed++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
// Chromium reports a skipped optional cross-page View Transition (e.g. a page that was
// backgrounded earlier in this long session) as a page error; navigation is unaffected.
// Only that exact browser message is tolerated; any other error fails the run.
const BENIGN = /^Transition was aborted because of invalid state. ViewTransition opt-in disabled$/;
page.on('pageerror', (e) => { if (BENIGN.test(e.message)) return; errors.push(`${e.message} @ ${page.url()}`); console.log('PAGEERROR after:', lastCheck); });
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

// --- coming soon (inside an issue) and the newspaper-level contact form
await page.goto(url('/issues/001/columns.html'));
await page.click('[data-coming]');
check(await page.locator('#comingModal').evaluate((d) => d.open), 'Issue 001: التحقيقات opens the coming-soon modal');
check((await page.locator('#comingText').textContent()) === 'يزم محنا حكينا قادم، مش حتلاقي اشي.', 'coming-soon shows the original text');
await page.keyboard.press('Escape');
await page.goto(url('/contact.html'));
await page.fill('#contact-field-1', 'قارئ');
await page.fill('#contact-field-3', 'test');
const [contactTab] = await Promise.all([page.context().waitForEvent('page'), page.click('.contact-form button')]);
const contactUrl = new URL(contactTab.url().startsWith('https://wa.me') ? contactTab.url() : await contactTab.evaluate(() => location.href));
await contactTab.close();
check((await page.locator('#copyToast').textContent()) === 'تم استلام الرسالة نظرياً. شكراً على الثقة.', 'Contact: the original acknowledgement still appears');
check(page.url().endsWith('/contact.html') && (await page.context().pages()).length === 1, 'Contact: exactly one new tab, the page stays');
check(/(wa\.me\/962791432787|phone=962791432787)/.test(contactUrl.href), `Contact: «إرسال» opens WhatsApp to 962791432787 (${contactUrl.host})`);

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

for (const legacy of ['news.html#tat3eem-story', 'news.html#eslam-story', 'entertainment.html']) {
  await page.goto(url(`/${legacy}`));
  const [file, hash] = legacy.split('#');
  await page.waitForURL(new RegExp(`issues/001/${file.replace('.', '\\.')}${hash ? '#' + hash : ''}$`));
  check(true, `legacy /${legacy} → /issues/001/${legacy}`);
}
await page.goto(url('/issues/001/about.html#x'));
await page.waitForURL(/qal-qeel-al-khalil\/about\.html#x$/);
check(true, 'briefly-live /issues/001/about.html → newspaper-level /about.html (keeps #anchor)');
await page.goto(url('/issues/001/news.html#eslam-story'));
check(page.url().endsWith('/issues/001/news.html#eslam-story') && (await page.evaluate(() => document.body.dataset.issue)) === '001', 'direct/shared Issue 001 link with anchor opens Issue 001');

// --- every issue page: loads, has the issue shell, no script errors
const ISSUE_PAGES = ['/issues/001/', '/issues/001/news.html', '/issues/001/columns.html', '/issues/001/entertainment.html'];
const PAPER_PAGES = ['/about.html', '/contact.html', '/archive.html'];
const PAGES = ['/', ...ISSUE_PAGES, ...PAPER_PAGES, '/issues/002/'];
for (const p of ISSUE_PAGES) {
  const before = errors.length;
  const res = await page.goto(url(p));
  const shell = await page.evaluate(() => ['.masthead', '.site-nav', '.ticker', '.site-footer', '#copyToast', '.library-ref'].every((s) => document.querySelector(s)));
  check(res.ok() && shell && errors.length === before, `${p} loads with masthead, nav, ticker, footer, toast, library reference`);
}

// --- newspaper-level pages: library navigation only, no issue sections
const LIBRARY_NAV = ['المكتبة', 'الأرشيف', 'من نحن', 'تواصل معنا'];
const ISSUE_SECTIONS = ['الأخبار', 'الأعمدة', 'المنوعات', 'التحقيقات'];
const navOf = () => page.evaluate(() => [...document.querySelectorAll('.nav-link, .library-nav-link')].map((a) => a.textContent.trim()));
for (const p of PAPER_PAGES) {
  const before = errors.length;
  const res = await page.goto(url(p));
  const nav = await navOf();
  const issueBits = await page.evaluate(() => !!document.querySelector('.meta-box, [data-coming]'));
  check(res.ok() && errors.length === before && JSON.stringify(nav) === JSON.stringify(LIBRARY_NAV) && !issueBits, `${p}: newspaper-level page, nav = ${LIBRARY_NAV.join(' | ')}`);
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
const libNav = await navOf();
const libLinks = await page.evaluate(() => [...document.querySelectorAll('a')].map((a) => a.textContent.trim()));
check(JSON.stringify(libNav) === JSON.stringify(LIBRARY_NAV) && !ISSUE_SECTIONS.some((s) => libLinks.includes(s)), `library navigation = ${LIBRARY_NAV.join(' | ')}; no issue sections`);

// --- the root never moves on by itself: fresh and returning visitors
const FRESH_WAIT = 4000;
const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } }); // no storage, cookies, cache, SW
const fp = await fresh.newPage();
const navigations = [];
fp.on('framenavigated', (f) => f === fp.mainFrame() && navigations.push(f.url()));
await fp.goto(url('/'), { waitUntil: 'networkidle' });
await fp.waitForTimeout(FRESH_WAIT);
const freshState = await fp.evaluate(() => ({ page: document.body.dataset.page, title: document.title, sw: !!navigator.serviceWorker?.controller }));
check(freshState.page === 'library' && freshState.title.startsWith('مكتبة قال قيل') && !freshState.sw, 'fresh visit to / shows مكتبة قال قيل (no service worker)');
check(navigations.length === 1 && /qal-qeel-al-khalil\/$/.test(fp.url()), `/ never navigates by itself (stayed ${FRESH_WAIT / 1000}s on ${new URL(fp.url()).pathname})`);
// returning visitor: has read Issue 001, has storage set, comes back to /
await fp.goto(url('/issues/001/entertainment.html'));
await fp.fill('#birthDay', '3');
await fp.fill('#birthMonth', '4');
await fp.fill('#birthYear', '1991');
await fp.click('#birthdayForm button');
await fp.goto(url('/'));
await fp.locator('a[data-take][href$="/issues/001/"]').click();
await fp.waitForURL(/issues\/001\/$/);
await fp.goBack();
await fp.waitForTimeout(800);
check((await fp.evaluate(() => document.body.dataset.page)) === 'library', 'returning via Back: still the library, paper back on the shelf');
const navCount = navigations.length;
await fp.goto(url('/'), { waitUntil: 'networkidle' });
await fp.waitForTimeout(FRESH_WAIT);
check((await fp.evaluate(() => document.body.dataset.page)) === 'library' && navigations.length === navCount + 1, 'returning visitor (storage set, history) stays in the library');
await fresh.close();

// the shelf→issue transition, in its own fresh browser (a long session can
// leave the tab backgrounded, and browsers skip transitions for hidden pages)
{
  const tctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const tp = await tctx.newPage();
  await tp.goto(url('/'), { waitUntil: 'networkidle' });
  const t0 = Date.now();
  await tp.locator('a[data-take][href$="/issues/001/"]').click();
  await tp.waitForURL(/issues\/001\/$/);
  const took = Date.now() - t0;
  const arrived = await tp.evaluate(() => { const h = document.documentElement.classList; return h.contains('arrive-from-library') || h.contains('vt-active'); });
  check(arrived && took < 1500, `taking 001 off the shelf opens it as the opened copy (${took}ms; View Transition or fallback)`);
  await tctx.close();
}
await page.bringToFront(); // an earlier test opened (and closed) a WhatsApp tab
await page.locator('a[data-take][href$="/issues/001/"]').click();
await page.waitForURL(/issues\/001\/$/);
await page.locator('[data-to-library]').click();
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

// --- «أرسل إلى هيئة التحرير»: WhatsApp submissions for Issue 002
const SUBMIT_MESSAGE = 'مرحباً هيئة تحرير قال قيل، لدي مادة أود إرسالها للعدد 002:';
const cta = page.locator('a[data-submit-whatsapp]');
check((await cta.count()) === 1 && (await cta.textContent()).trim() === 'أرسل إلى هيئة التحرير', 'Issue 002 has one submission notice with «أرسل إلى هيئة التحرير»');
check(!(await cta.isVisible()), 'the submission waits inside the closed envelope');
await page.locator('[data-open-envelope]').click();
check(await page.locator('#submission-envelope').evaluate((d) => d.open), 'the editors notice opens the envelope «إلى هيئة التحرير»');
check(await cta.isVisible(), 'the opened letter shows «أرسل إلى هيئة التحرير»');
const href = await cta.getAttribute('href');
const wa = new URL(href);
check(wa.origin === 'https://wa.me' && wa.pathname === '/962791432787', `WhatsApp click-to-chat targets 962791432787 (${wa.origin}${wa.pathname})`);
check(wa.searchParams.get('text') === SUBMIT_MESSAGE && href.includes(encodeURIComponent(SUBMIT_MESSAGE)), 'pre-filled Arabic message is exactly right and URL-encoded');
check((await cta.getAttribute('target')) === '_blank' && /noopener/.test(await cta.getAttribute('rel')) && /noreferrer/.test(await cta.getAttribute('rel')), 'opens in a new tab with rel="noopener noreferrer"');
const [popup] = await Promise.all([page.context().waitForEvent('page'), cta.click({ modifiers: [] })]);
check(/^https:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|www\.whatsapp\.com)/.test(popup.url()) || popup.url() === 'about:blank', `click opens a new window toward WhatsApp (${popup.url().slice(0, 40)}…)`);
await popup.close();
check(page.url().endsWith('/issues/002/'), 'the proof stays open behind it');
check((await page.locator('a[href^="https://wa.me"]').count()) === 1 && !(await page.goto(url('/contact.html')), await page.locator('a[href*="wa.me"]').count()), 'تواصل معنا stays the normal contact page (no WhatsApp there)');

// --- archive: the folded copy opens its edition
await page.goto(url('/archive.html'));
await page.locator('.archive-item').first().click({ position: { x: 40, y: 40 } });
await page.waitForURL(/issues\/001\/$/);
check(true, 'archive card for 001 opens /issues/001/');

// --- the red pencil (Issue 002): reveals the editing process only
await page.goto(url('/issues/002/'));
const pencil = page.locator('[data-pencil]');
check((await page.locator('.pencil-note').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length)) === 0, 'pencil marks hidden until the pencil is taken up');
await pencil.focus();
await page.keyboard.press('Enter');
const marks = await page.locator('.pencil-note').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.textContent.trim()));
const APPROVED_MARKS = ['راجع', '؟', 'مصدر؟', 'ننتظر الصورة', 'تأكيد', 'هل يُنشر؟', '↓ هنا', 'قيد المراجعة'];
check((await pencil.getAttribute('aria-pressed')) === 'true' && marks.length >= 5 && marks.every((m) => APPROVED_MARKS.includes(m)), `قلم هيئة التحرير works from the keyboard; ${marks.length} approved marks appear`);
await page.keyboard.press('Enter');
check((await pencil.getAttribute('aria-pressed')) === 'false', 'putting the pencil down hides the marks again');
check((await page.locator('.proof-teasers, .incoming-slip, .proof-production').count()) === 0, 'no teasers, incoming slips or production lines are shown (none configured)');

// --- محفوظات هيئة التحرير: the library drawer
await page.goto(url('/'));
await page.locator('[data-drawer-open]').click();
check(await page.locator('#archiveDrawer').evaluate((d) => d.open), 'the editors drawer opens');
const tabs = await page.locator('[data-folder-tab]').allTextContents();
check(tabs.join('|') === 'ملفات مغلقة|مواد لم تُنشر|تصحيحات|محفوظات|من الأرشيف', 'drawer folders as approved (photo archive hidden while empty)');
await page.locator('[data-folder-tab]').first().focus();
await page.keyboard.press('ArrowLeft');
check((await page.locator('[data-folder-tab]').nth(1).getAttribute('aria-selected')) === 'true', 'folders are keyboard tabs (arrow keys)');
check((await page.locator('.drawer-folder:not([hidden]) .drawer-empty').textContent()) === '[بانتظار المادة]', 'empty folders say so; nothing invented');
await page.keyboard.press('Escape');
check(!(await page.locator('#archiveDrawer').evaluate((d) => d.open)), 'Escape closes the drawer');

// --- the masthead Easter egg: five presses, a deadpan notice
for (let i = 0; i < 5; i++) await page.locator('.library-title').click();
await page.waitForTimeout(200);
check((await page.locator('.egg-notice').textContent()) === 'لوحظ اهتمام غير اعتيادي بالجريدة.تم تسجيل الملاحظة.', 'masthead ×5: «لوحظ اهتمام غير اعتيادي بالجريدة.» then it goes away');

// --- the printed edition
const printRes = await page.goto(url('/issues/001/print.html'));
const printed = await page.evaluate(() => ({
  articles: document.querySelectorAll('.print-article').length,
  signs: document.querySelectorAll('.print-horoscope dt').length,
  collapsed: document.querySelectorAll('.is-collapsed').length,
}));
check(printRes.ok() && printed.articles >= 7 && printed.signs === 12 && printed.collapsed === 0, `print edition: ${printed.articles} articles in full, 12 horoscopes, nothing collapsed`);
await page.emulateMedia({ media: 'print' });
const printHidden = await page.evaluate(() => ['.print-controls', '.masthead-refs'].every((s) => !document.querySelector(s) || getComputedStyle(document.querySelector(s)).display === 'none'));
check(printHidden, 'on paper: controls and references are not printed');
await page.emulateMedia({ media: 'screen' });

// --- the library without JavaScript: still a library, papers still open
const nojs = await browser.newContext({ javaScriptEnabled: false });
const np = await nojs.newPage();
await np.goto(url('/'));
const njs = await np.evaluate(() => ({ page: document.body.dataset.page, papers: document.querySelectorAll('a[data-take]').length }));
await np.locator('a[data-take]').first().click();
await np.waitForURL(/issues\/001\/$/);
check(njs.page === 'library' && njs.papers === 2, 'without JavaScript: the library renders and a newspaper opens as a plain link');
await nojs.close();

// --- keyboard: focus is visible, dialogs trap and return focus
const focused = () =>
  page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { cls: el.className, href: el.getAttribute('href'), ring: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' };
  });
await page.goto(url('/'));
const tabbed = [];
let shelfFocus;
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Tab');
  shelfFocus = await focused();
  tabbed.push(shelfFocus.cls);
  if (shelfFocus.cls.includes('shelf-paper')) break;
}
check(tabbed[0].includes('library-nav-link') && shelfFocus.cls.includes('shelf-paper') && shelfFocus.ring, `library: Tab goes through the library navigation (${tabbed.length - 1} links) to the first newspaper, focus ring visible`);
await page.keyboard.press('Enter');
await page.waitForURL(/issues\/001\/$/);
check(true, 'library: Enter takes the newspaper and opens it');

await page.goto(url('/issues/001/news.html'));
await page.keyboard.press('Tab');
const refFocus = await focused();
await page.keyboard.press('Tab');
const printFocus = await focused();
await page.keyboard.press('Tab');
const navFocus = await focused();
check(refFocus.cls.includes('library-ref') && refFocus.ring && printFocus.cls.includes('print-ref') && navFocus.cls.includes('nav-link') && navFocus.ring, 'issue: Tab order is library reference, print edition, then section bar, with focus rings');
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
await mp.goto(url('/issues/002/'));
await mp.locator('#submission-envelope summary').click();
const ctaBox = await mp.locator('a[data-submit-whatsapp]').boundingBox();
check(!!ctaBox && ctaBox.x >= 0 && ctaBox.x + ctaBox.width <= 360 && ctaBox.width > 120, 'mobile: «أرسل إلى هيئة التحرير» fully on screen and tappable');
await mp.goto(url('/'));
const libNavBox = await mp.locator('.library-nav').boundingBox();
check(!!libNavBox && libNavBox.x >= 0 && libNavBox.x + libNavBox.width <= 360, 'mobile: library navigation fits');
await mobile.close();

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
