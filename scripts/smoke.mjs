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
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(BASE, '') || '/';
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, p);
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
  // byte ranges, as GitHub Pages serves them: audio seeks to the station clock
  const size = fs.statSync(file).size;
  const range = /bytes=(d*)-(d*)/.exec(req.headers.range ?? '');
  if (range) {
    const start = range[1] ? Number(range[1]) : size - Number(range[2]);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': size });
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
// (a click that lands while the page is still settling is retried once)
let opened = false;
for (let i = 0; i < 2 && !opened; i++) {
  await page.locator('.archive-item').first().click({ position: { x: 40, y: 40 } });
  opened = await page.waitForURL(/issues\/001\/$/, { timeout: 10000 }).then(() => true, () => false);
}
check(opened, 'archive card for 001 opens /issues/001/');

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

// --- production edition: unreleased Issue 002 has no reader pages, nothing is marked DEV
{
  const res = await Promise.all(
    ['news.html', 'columns.html', 'entertainment.html', 'print.html'].map((p) => page.request.get(url(`/issues/002/${p}`)).then((r) => `${p}:${r.status()}`)),
  );
  check(res.every((r) => r.endsWith(':404')), `unreleased Issue 002 has no section or print pages (${res.join(', ')})`);
  let marked = 0;
  for (const p of ['/', '/issues/001/', '/issues/002/', '/archive.html', '/broadcast.html']) {
    await page.goto(url(p));
    marked += await page.locator('[data-dev-mark], .dev-article-state, [data-editorial]').count();
    if ((await page.title()).includes('[تطوير]')) marked++;
  }
  check(marked === 0, 'no development marks on the production edition');
}

// --- 107.5 FM: the radio (one station on a broadcast clock)
{
  /** where the programme is at `nowMs` (mirrors stationPosition in src/scripts/radio.ts) */
  const clock = (durations, nowMs) => {
    const total = durations.reduce((a, b) => a + b, 0);
    let t = ((nowMs / 1000) % total + total) % total;
    for (let i = 0; i < durations.length; i++) {
      if (t < durations[i]) return { index: i, offset: t };
      t -= durations[i];
    }
    return { index: 0, offset: 0 };
  };
  const radioState = (p) => p.evaluate(() => {
    const a = document.querySelector('[data-radio-audio]');
    const r = document.querySelector('[data-radio]');
    const cfg = JSON.parse(document.querySelector('[data-radio-config]').textContent);
    const sig = document.querySelector('[data-radio-signal]');
    return {
      state: r.dataset.state, reception: Number(r.dataset.reception), volume: Number(r.dataset.volume),
      src: a.getAttribute('src'), paused: a.paused, time: a.currentTime,
      signal: sig.hidden ? null : sig.textContent, readout: document.querySelector('.radio-freq').textContent,
      durations: cfg.tracks.map((t) => t.duration), srcs: cfg.tracks.map((t) => t.src), now: Date.now(),
    };
  });
  const fileOf = (src) => (src ?? '').split('/').pop();
  const waitState = (p, states, timeout = 15000) =>
    p.waitForFunction((s) => s.includes(document.querySelector('[data-radio]').dataset.state), states, { timeout, polling: 50 }).then(() => true, () => false);

  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const rp = await rctx.newPage();
  const rerrors = [];
  const media = [];
  rp.on('pageerror', (e) => !BENIGN.test(e.message) && rerrors.push(e.message));
  rp.on('request', (r) => /\/audio\/radio\//.test(r.url()) && media.push(r.url()));

  await rp.goto(url('/issues/001/news.html'), { waitUntil: 'networkidle' });
  const r0 = await rp.evaluate(() => {
    const radio = document.querySelectorAll('[data-radio]');
    const a = document.querySelector('[data-radio-audio]');
    return { count: radio.length, state: radio[0]?.dataset.state, label: document.querySelector('.radio-freq')?.textContent, paused: a?.paused, src: a?.getAttribute('src'), controls: a?.hasAttribute('controls'), preload: a?.getAttribute('preload') };
  });
  check(r0.count === 1 && r0.label === '107.5 FM' && r0.state === 'off', 'radio: one set per page, 107.5 FM, starts OFF');
  check(r0.paused && !r0.src && !r0.controls && r0.preload === 'none' && media.length === 0, 'radio: nothing autoplays, no audio is fetched before switch-on, no native player controls');
  const cfg0 = await radioState(rp);
  check(cfg0.srcs.length === 7 && cfg0.durations.every((d) => d > 0) && cfg0.srcs.every((s) => /\/audio\/radio\/radio-0\d\.mp3$/.test(s)), `radio: a programme of ${cfg0.srcs.length} licensed items with known durations`);
  check((await rp.locator('[data-radio] :is(ol, ul, select, [role="listbox"])').count()) === 0, 'radio: no playlist, track list or picker: one station');

  // closed, it sits in the desk margin, clear of the newspaper sheet
  const tab = await rp.locator('.radio-tab').boundingBox();
  const sheet = await rp.locator('.site-shell').boundingBox();
  check(!!tab && tab.x + tab.width <= sheet.x, 'radio: closed, it stays in the desk margin (never over the paper)');

  await rp.locator('.radio-tab').click();
  check((await rp.locator('.radio-tab').getAttribute('aria-expanded')) === 'true' || (await rp.locator('.radio-set').isVisible()), 'radio: the set comes out');

  // 107.5 sits inside the dial window, legible, not clipped, not colliding with the 104 mark
  const dial = await rp.evaluate(() => {
    const win = document.querySelector('.radio-window').getBoundingClientRect();
    const marks = [...document.querySelectorAll('.radio-scale span, .radio-mark')].map((m) => ({ t: m.textContent.trim(), r: m.getBoundingClientRect() }));
    const m1075 = marks.find((m) => m.t === '107.5');
    const m104 = marks.find((m) => m.t === '104');
    return {
      found: !!m1075 && !!m104,
      inside: !!m1075 && m1075.r.left >= win.left - 0.5 && m1075.r.right <= win.right + 0.5,
      apart: !!m1075 && !!m104 && (m1075.r.left >= m104.r.right || m104.r.left >= m1075.r.right),
    };
  });
  check(dial.found && dial.inside && dial.apart, 'radio: «107.5» on the dial is inside the window and clear of «104»');

  await rp.locator('[data-radio-power]').click();
  const joined = await waitState(rp, ['playing']);
  await rp.waitForTimeout(600);
  const r1 = await radioState(rp);
  const want = clock(r1.durations, r1.now);
  const sameItem = fileOf(r1.src) === fileOf(r1.srcs[want.index]);
  check(joined && !r1.paused && (await rp.locator('[data-radio-power]').getAttribute('aria-pressed')) === 'true', 'radio: switched on → playing, lamp on');
  check(sameItem && Math.abs(r1.time - want.offset) < 4, `radio: joins the programme mid-broadcast where the clock says (${fileOf(r1.src)} @ ${r1.time.toFixed(1)}s, clock ${want.offset.toFixed(1)}s)`);
  check(media.length > 0 && media.every((m) => /\/audio\/radio\/radio-0\d\.mp3/.test(m)), 'radio: audio is requested only after switch-on, only from /audio/radio/');
  await rp.waitForTimeout(1500);
  const r2 = await radioState(rp);
  check(r2.time > r1.time + 0.8 && r2.state === 'playing', `radio: the broadcast runs (${r1.time.toFixed(1)}s → ${r2.time.toFixed(1)}s)`);

  // volume: a keyboard slider, remembered, applied
  const vol = rp.locator('[data-radio-volume]');
  const v0 = Number(await vol.getAttribute('aria-valuenow'));
  const lv0 = (await radioState(rp)).volume;
  await vol.focus();
  await rp.keyboard.press('ArrowUp');
  await rp.keyboard.press('ArrowUp');
  const v1 = Number(await vol.getAttribute('aria-valuenow'));
  const lv1 = (await radioState(rp)).volume;
  check(v0 >= 40 && v0 <= 60 && v1 === Math.min(100, v0 + 10) && (await vol.getAttribute('role')) === 'slider', `radio: volume knob is a keyboard slider (default ${v0}, now ${v1})`);
  check(lv1 > lv0, `radio: turning the volume up raises the output (${lv0} → ${lv1})`);
  check((await rp.evaluate(() => localStorage.getItem('qqak:radio-volume'))) === String(v1), 'radio: volume remembered locally');

  // tuning away fades the programme into static; it keeps broadcasting underneath
  const before = await radioState(rp);
  const tune = rp.locator('[data-radio-tune]');
  await tune.focus();
  for (let i = 0; i < 3; i++) await rp.keyboard.press('PageDown');
  const away = await radioState(rp);
  check((await tune.getAttribute('aria-valuetext')) === '104.5 FM' && away.readout === '104.5 FM' && away.signal === null, 'radio: tuning is a keyboard slider; the dial shows 104.5 FM');
  check(away.reception === 0 && (await rp.evaluate(() => document.querySelector('[data-radio]').classList.contains('is-detuned'))), 'radio: off-station, the programme fades out under static (reception 0)');
  await rp.keyboard.press('End');
  await rp.keyboard.press('PageDown'); // 107.0: close to the station, half-received
  const near = await radioState(rp);
  check(near.reception > 0 && near.reception < 1, `radio: near 107.5 reception is partial (${near.reception})`);
  await rp.keyboard.press('Home');
  check((await tune.getAttribute('aria-valuetext')) === '88.0 FM', 'radio: the band runs from 88.0');
  await rp.waitForTimeout(4500);
  const back = await radioState(rp);
  check((await tune.getAttribute('aria-valuetext')) === '107.5 FM' && back.reception === 1, 'radio: left alone, the needle drifts back to 107.5 and the station comes in clear');
  check(back.state === 'playing' && !back.paused && (fileOf(back.src) !== fileOf(before.src) || back.time > before.time + 3), 'radio: returning to 107.5 resumes the broadcast without restarting it');

  // the same session, another page: the station keeps its place on the clock
  await rp.goto(url('/issues/001/columns.html'));
  const cont = await waitState(rp, ['playing', 'standby'], 15000);
  const r3 = await radioState(rp);
  const want3 = clock(r3.durations, r3.now);
  check(cont && (r3.state === 'standby' || (fileOf(r3.src) === fileOf(r3.srcs[want3.index]) && Math.abs(r3.time - want3.offset) < 5)), `radio: same-session navigation → ${r3.state}${r3.state === 'playing' ? ` at the clock position (${fileOf(r3.src)} @ ${r3.time.toFixed(1)}s)` : ' (browser asked for a gesture; one press resumes)'}`);

  await rp.locator('.radio-tab').click().catch(() => {});
  if (!(await rp.locator('.radio-set').isVisible())) await rp.locator('.radio-tab').click();
  // standby: one press resumes the station; the next switches it off
  if ((await radioState(rp)).state === 'standby') {
    await rp.locator('[data-radio-power]').click();
    check(await waitState(rp, ['playing']), 'radio: from standby, one press resumes the broadcast');
  }
  if ((await radioState(rp)).state !== 'off') await rp.locator('[data-radio-power]').click();
  const off = await radioState(rp);
  check(off.state === 'off' && off.paused && (await rp.locator('[data-radio-power]').getAttribute('aria-pressed')) === 'false', 'radio: switching off silences it');
  await rp.locator('[data-radio-tune]').focus();
  await rp.keyboard.press('Escape');
  check(!(await rp.locator('.radio-set').isVisible()), 'radio: Escape folds it back to its edge');

  // print edition carries no radio; the library has its own on the shelf
  await rp.goto(url('/issues/001/print.html'));
  check((await rp.locator('[data-radio]').count()) === 0, 'radio: not part of the printed edition');
  await rp.goto(url('/'));
  check((await rp.locator('[data-radio][data-variant="shelf"]').count()) === 1 && (await rp.locator('[data-radio]').count()) === 1, 'radio: in the library it stands on the shelf (one instance)');
  await rp.emulateMedia({ media: 'print' });
  check(await rp.evaluate(() => [...document.querySelectorAll('[data-radio]')].every((r) => getComputedStyle(r).display === 'none')), 'radio: hidden when a page is printed');
  await rp.emulateMedia({ media: 'screen' });

  // a "returning" visitor with an old on-state from a past session stays silent
  await rp.evaluate(() => sessionStorage.setItem('qqak:radio', JSON.stringify({ on: true, ts: Date.now() - 24 * 3600e3 })));
  const mediaBefore = media.length;
  await rp.goto(url('/issues/002/'), { waitUntil: 'networkidle' });
  check((await radioState(rp)).state === 'off' && media.length === mediaBefore, 'radio: an old "on" never resumes (silent, nothing fetched)');
  check(rerrors.length === 0, `radio: no script errors${rerrors.length ? ': ' + rerrors.join(' | ') : ''}`);
  await rctx.close();

  // a fresh visitor: silent, nothing fetched
  {
    const fctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const fp = await fctx.newPage();
    const fm = [];
    fp.on('request', (r) => /\/audio\/radio\//.test(r.url()) && fm.push(r.url()));
    await fp.goto(url('/issues/001/news.html'), { waitUntil: 'networkidle' });
    await fp.goto(url('/'), { waitUntil: 'networkidle' });
    check((await radioState(fp)).state === 'off' && fm.length === 0, 'radio: fresh visits are silent and download no audio');
    await fctx.close();
  }

  // the end of an item and the end of the programme: radio-07 hands over to radio-01
  {
    const tctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const tp = await tctx.newPage();
    const terr = [];
    tp.on('pageerror', (e) => !BENIGN.test(e.message) && terr.push(e.message));
    const total = cfg0.durations.reduce((a, b) => a + b, 0);
    // shift this visitor's clock so the programme is 5 s from its end
    const shiftMs = (((total - 5) - (Date.now() / 1000) % total + total) % total) * 1000;
    await tctx.addInitScript((ms) => { const now = Date.now.bind(Date); Date.now = () => now() + ms; }, shiftMs);
    await tp.goto(url('/issues/001/news.html'));
    await tp.locator('.radio-tab').click();
    await tp.locator('[data-radio-power]').click();
    await waitState(tp, ['playing']);
    const last = await radioState(tp);
    check(fileOf(last.src) === 'radio-07.mp3' && last.time > last.durations[6] - 8, `radio: the clock places us in the last item (${fileOf(last.src)} @ ${last.time.toFixed(1)}s)`);
    const looped = await tp.waitForFunction(() => /radio-01\.mp3$/.test(document.querySelector('[data-radio-audio]').getAttribute('src') ?? ''), null, { timeout: 15000 }).then(() => true, () => false);
    // the new item is actually sounding: playing, unpaused, and its clock moving
    const sounding = await tp.waitForFunction(() => {
      const a = document.querySelector('[data-radio-audio]');
      return document.querySelector('[data-radio]').dataset.state === 'playing' && !a.paused && a.currentTime > 0.2;
    }, null, { timeout: 15000, polling: 100 }).then(() => true, () => false);
    const first = await radioState(tp);
    check(looped && sounding && first.time < 12, `radio: at the end the programme loops to radio-01 from its start (${fileOf(first.src)} @ ${first.time.toFixed(1)}s, ${first.state}${first.paused ? ', paused' : ''})`);
    check(terr.length === 0, `radio: the hand-over raises no script errors${terr.length ? ': ' + terr.join(' | ') : ''}`);
    await tctx.close();
  }

  // a missing file: «لا توجد إشارة», then the station carries on with the next item
  {
    const ectx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ep = await ectx.newPage();
    const eerr = [];
    ep.on('pageerror', (e) => !BENIGN.test(e.message) && eerr.push(e.message));
    // break whatever is on air now, and the item after it if the boundary is close
    const pos = clock(cfg0.durations, Date.now());
    const dead = new Set([fileOf(cfg0.srcs[pos.index])]);
    if (cfg0.durations[pos.index] - pos.offset < 30) dead.add(fileOf(cfg0.srcs[(pos.index + 1) % 7]));
    await ectx.route(/\/audio\/radio\/radio-0\d\.mp3/, (route) => (dead.has(fileOf(new URL(route.request().url()).pathname)) ? route.fulfill({ status: 404, body: '' }) : route.continue()));
    await ep.goto(url('/issues/001/news.html'));
    await ep.locator('.radio-tab').click();
    await ep.locator('[data-radio-power]').click();
    const lost = await waitState(ep, ['nosignal'], 10000);
    const ns = await radioState(ep);
    check(lost && ns.signal === 'لا توجد إشارة', `radio: an item that will not load → «لا توجد إشارة» (${[...dead].join(', ')} → 404)`);
    // more than one dead item takes more than one retry
    let recovered = false;
    for (let i = 0; i < 3 && !recovered; i++) {
      await waitState(ep, ['playing'], 8000);
      const s = await radioState(ep);
      recovered = s.state === 'playing' && !dead.has(fileOf(s.src));
    }
    const rec = await radioState(ep);
    check(recovered && !rec.paused, `radio: …then the station moves on to the next item (${fileOf(rec.src)})`);
    check(eerr.length === 0, `radio: a missing file is never a crash${eerr.length ? ': ' + eerr.join(' | ') : ''}`);
    await ectx.close();
  }

  // the broadcast credits: every item's attribution, one quiet page, linked from every footer
  {
    const bctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const bp = await bctx.newPage();
    await bp.goto(url('/issues/001/news.html'));
    const href = await bp.locator('footer a', { hasText: 'بيانات البث' }).getAttribute('href');
    check(!!href && href.endsWith('/broadcast.html'), 'broadcast: the issue footer links to «بيانات البث»');
    await bp.goto(url('/'));
    check((await bp.locator('a', { hasText: 'بيانات البث' }).count()) >= 1, 'broadcast: the library links to «بيانات البث»');
    const res = await bp.goto(url('/broadcast.html'));
    const credits = await bp.evaluate(() => [...document.querySelectorAll('.broadcast-credits li')].map((li) => ({
      text: li.textContent.replace(/\s+/g, ' ').trim(),
      license: li.querySelector('a[rel~="license"]')?.getAttribute('href') ?? '',
      source: [...li.querySelectorAll('a')].some((a) => /jamendo\.com|archive\.org|wikimedia\.org/.test(a.href)),
    })));
    check(res.status() === 200 && (await bp.locator('h1').textContent()).trim() === 'بيانات البث', 'broadcast: /broadcast.html is published');
    check(credits.length === 7 && credits.every((c) => /creativecommons\.org\/licenses\/by-sa\/(3\.0|2\.5)\//.test(c.license) && c.source), `broadcast: ${credits.length} credits, each with its licence and source`);
    check(['Dal Studio', 'Andy R. Jordan', 'Ariel Qassis'].every((n) => credits.some((c) => c.text.includes(n))), 'broadcast: every creator is credited by name');
    check((await bp.locator('[data-radio] :text("Dal Studio")').count()) === 0, 'broadcast: credits stay off the radio itself');
    await bctx.close();
  }

  // phones and tablets: a small edge tab; the panel opens and closes; nothing overflows
  for (const [w, h] of [[360, 780], [390, 844], [768, 1024]]) {
    const mctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 700 });
    const mpage = await mctx.newPage();
    await mpage.goto(url('/issues/001/news.html'));
    const mtab = await mpage.locator('.radio-tab').boundingBox();
    if (w < 700) check(!!mtab && mtab.x <= 0.5 && mtab.width <= 40 && mtab.height >= 44, `radio (${w}px): only a ${Math.round(mtab?.width ?? 0)}×${Math.round(mtab?.height ?? 0)} edge at the screen side`);
    await mpage.locator('.radio-tab').tap();
    const panel = await mpage.locator('.radio-set').boundingBox();
    const overflow = await mpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const fits = await mpage.evaluate(() => {
      const win = document.querySelector('.radio-window').getBoundingClientRect();
      const m = [...document.querySelectorAll('.radio-scale span, .radio-mark')].find((x) => x.textContent.trim() === '107.5')?.getBoundingClientRect();
      return !!m && m.left >= win.left - 0.5 && m.right <= win.right + 0.5;
    });
    check(!!panel && panel.x >= 0 && panel.x + panel.width <= w && overflow <= 0 && fits, `radio (${w}px): the panel opens within the screen, 107.5 unclipped, no sideways scroll`);
    await mpage.locator('[data-radio-power]').tap();
    const on = await waitState(mpage, ['playing', 'standby']);
    check(on, `radio (${w}px): a tap on the power switch turns it on (${(await radioState(mpage)).state})`);
    await mpage.locator('[data-radio-power]').tap();
    await mpage.locator('.radio-close').tap();
    check(!(await mpage.locator('.radio-set').isVisible()) && (await mpage.locator('.radio-tab').isVisible()), `radio (${w}px): closes back to its edge`);
    await mctx.close();
  }

  // reduced motion: the needle jumps, nothing sweeps or slides
  const rmctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rmp = await rmctx.newPage();
  await rmp.goto(url('/issues/001/news.html'));
  await rmp.locator('.radio-tab').click();
  const motion = await rmp.evaluate(() => ({
    needle: getComputedStyle(document.querySelector('.radio-needle')).transitionDuration,
    knob: getComputedStyle(document.querySelector('.radio-knob')).transitionDuration,
    set: getComputedStyle(document.querySelector('.radio-set')).animationName,
  }));
  check(motion.needle === '0s' && motion.knob === '0s' && motion.set === 'none', 'radio: reduced motion → no sweeping, rotating or sliding');
  await rmctx.close();
}

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
