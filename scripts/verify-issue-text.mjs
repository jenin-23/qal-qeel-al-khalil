/* ------------------------------------------------------------------ *
 * verify:001: Issue 001 content-integrity check.
 *
 * Compares the built site (dist/) with the frozen original Issue 001
 * (tests/fixtures/issue-001-original, an exact copy of commit 2670d16).
 *
 *  1. Visible text: every original text segment must still exist, in the
 *     same order, on the corresponding page. Extra text must be listed in
 *     ALLOWED_ADDITIONS below with a reason, otherwise the check fails.
 *  2. Attributes: placeholders, aria-labels, phone numbers, element ids
 *     and in-page anchors must survive (image alt text is the one approved
 *     change, listed in ALLOWED_ATTRIBUTE_CHANGES).
 *  3. Script text: every Arabic string the original app.js could show
 *     must be present in that page's data or the bundled scripts.
 *  4. Issue isolation: 001's pages carry 001's data only (birthday month,
 *     horoscope, popup pool, issue number) and old URLs still redirect.
 *
 * A passing run proves the WORDS are unchanged. It says nothing about
 * appearance; compare screenshots for that (npm run screenshots).
 * ------------------------------------------------------------------ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINAL = path.join(ROOT, 'tests/fixtures/issue-001-original');
const DIST = path.join(ROOT, 'dist');

/** original page → built pages that must contain all of its text */
const PAGE_MAP = {
  'index.html': ['issues/001/index.html'],
  'news.html': ['issues/001/news.html'],
  'columns.html': ['issues/001/columns.html'],
  'entertainment.html': ['issues/001/entertainment.html'],
  'about.html': ['issues/001/about.html'],
  'contact.html': ['issues/001/contact.html'],
  'archive.html': ['archive.html'],
};

// While 001 is the newest published issue, "/" is its front page too.
const ROOT_IS_001 = true;
if (ROOT_IS_001) PAGE_MAP['index.html'].push('index.html');

const SHELL_ADDITIONS = {
  toast: ['تم نسخ المقال. استخدمه بحذر.'],
  coming: ['×', 'العدد القادم قادم', 'هذا الباب محفوظ حالياً لحين صدور العدد الأول.'],
  footer: ['قال قيل ال خليل', 'من نحن', 'تواصل معنا', 'الأرشيف', '© 2026 قال قيل ال خليل', 'عمّان – الأردن'],
};

/** Text that may appear in the new build but not in the original, per page. */
const ALLOWED_ADDITIONS = {
  'about.html': { reason: 'shared toast now on every page', text: [...SHELL_ADDITIONS.toast] },
  'archive.html': {
    reason: 'shared toast; archive card shows the issue date + "enter issue" button',
    text: [...SHELL_ADDITIONS.toast, '١-٤-٢٠٢٦', 'ادخل العدد'],
  },
  'contact.html': {
    reason: 'shared coming-soon modal + toast were missing on Contact',
    text: [...SHELL_ADDITIONS.coming, ...SHELL_ADDITIONS.toast],
  },
  'entertainment.html': {
    reason: 'footer, coming-soon modal, toast were missing; approved «تغيير تاريخ الميلاد»; gate close button (shown only when changing)',
    text: [...SHELL_ADDITIONS.footer, ...SHELL_ADDITIONS.coming, ...SHELL_ADDITIONS.toast, 'تغيير تاريخ الميلاد', '×'],
  },
};

/** Approved attribute changes (old value → new value) */
const ALLOWED_ATTRIBUTE_CHANGES = {
  // placeholder alt text replaced by descriptive Arabic alt text (approved)
  alt: ['no image found', 'no image', 'حباب تتلقفك'],
  // internal dialog ids renamed month-neutrally (the month now comes from each issue); not link targets
  id: ['aprilModal', 'closeAprilModal'],
};

/* ------------------------------------------------------------------ */

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const read = (p) => fs.readFileSync(p, 'utf8');

function textSegments(html) {
  const root = parse(html, { comment: false, blockTextElements: { script: false, style: false, noscript: false } });
  // the original entertainment.html never closes .site-shell; browsers cope, the parser loses <body>
  const body = root.querySelector('body') ?? root.querySelector('html') ?? root;
  body.querySelectorAll('head, template, [data-ticker-clone]').forEach((el) => el.remove());
  const out = [];
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const t = norm(child.rawText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'));
        if (t) out.push(t);
      } else if (child.nodeType === 1) walk(child);
    }
  };
  walk(body);
  return out;
}

function attributes(html) {
  const root = parse(html);
  const found = [];
  for (const el of root.querySelectorAll('*')) {
    for (const name of ['alt', 'placeholder', 'aria-label', 'data-phone', 'id', 'title']) {
      const v = el.getAttribute(name);
      if (v != null && v !== '') found.push(`${name}=${norm(v)}`);
    }
    const href = el.getAttribute('href');
    if (href?.startsWith('#') && href.length > 1) found.push(`href=${href}`);
  }
  return found;
}

const decodeJs = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found, run `npm run build` first');
  process.exit(1);
}

/* 1 + 2: per page ------------------------------------------------------- */
for (const [orig, targets] of Object.entries(PAGE_MAP)) {
  const origHtml = read(path.join(ORIGINAL, orig));
  const base = textSegments(origHtml);
  const origTitle = norm(parse(origHtml).querySelector('title').text);
  const allowed = new Set(ALLOWED_ADDITIONS[orig]?.text ?? []);

  for (const target of targets) {
    console.log(`\n${orig}  →  dist/${target}`);
    const file = path.join(DIST, target);
    if (!fs.existsSync(file)) {
      fail('page missing');
      continue;
    }
    const html = read(file);
    const built = textSegments(html);

    const title = norm(parse(html).querySelector('title').text);
    title === origTitle ? ok(`<title> unchanged`) : fail(`<title> "${origTitle}" became "${title}"`);

    // ordered subsequence match
    let i = 0;
    const extra = [];
    for (const seg of built) {
      if (i < base.length && seg === base[i]) i++;
      else extra.push(seg);
    }
    if (i === base.length) ok(`all ${base.length} original text segments present, in order`);
    else {
      fail(`original text missing or changed at segment ${i + 1}/${base.length}:`);
      console.error(`      expected: "${base[i]}"`);
      const near = built.filter((s) => s.includes(base[i].slice(0, 12)));
      if (near.length) console.error(`      similar in build: "${near[0]}"`);
    }
    const unexpected = extra.filter((s) => !allowed.has(s));
    if (unexpected.length) unexpected.forEach((s) => fail(`unexpected new text: "${s}"`));
    else if (extra.length) ok(`${extra.length} added segments, all allow-listed (${ALLOWED_ADDITIONS[orig].reason})`);
    else ok('no added text');

    // attributes
    const builtAttrs = new Set(attributes(html));
    const missing = attributes(origHtml).filter((a) => {
      if (builtAttrs.has(a)) return false;
      const [name, ...rest] = a.split('=');
      return !(ALLOWED_ATTRIBUTE_CHANGES[name] ?? []).includes(rest.join('='));
    });
    missing.length ? missing.forEach((a) => fail(`attribute lost: ${a}`)) : ok('placeholders, labels, phone numbers, ids and anchors preserved');
  }
}

/* 3: script strings ----------------------------------------------------- */
console.log('\napp.js strings');
{
  const js = read(path.join(ORIGINAL, 'assets/js/app.js'));
  const strings = [...new Set([...js.matchAll(/'([^'\n]*[؀-ۿ][^'\n]*)'/g)].map((m) => m[1]))];
  const bundles = fs.existsSync(path.join(DIST, '_astro'))
    ? fs.readdirSync(path.join(DIST, '_astro')).filter((f) => f.endsWith('.js')).map((f) => decodeJs(read(path.join(DIST, '_astro', f))))
    : [];
  const pages001 = fs.readdirSync(path.join(DIST, 'issues/001')).map((f) => read(path.join(DIST, 'issues/001', f)));
  const haystack = [...pages001, ...bundles].join('\n');
  const lost = strings.filter((s) => !haystack.includes(s));
  lost.length ? lost.forEach((s) => fail(`app.js string not found: "${s}"`)) : ok(`all ${strings.length} Arabic strings from app.js present`);
}

/* 4: isolation + redirects ---------------------------------------------- */
console.log('\nIssue 001 isolation');
{
  const ent = parse(read(path.join(DIST, 'issues/001/entertainment.html')));
  const data = JSON.parse(ent.querySelector('#entertainment-data').text);
  const issueData = JSON.parse(ent.querySelector('#issue-data').text);
  data.issue === '001' && issueData.issue === '001' ? ok('pages identify as issue 001') : fail('issue number mismatch');
  data.birthday?.month === 4 ? ok('birthday month is April (4)') : fail(`birthday month is ${data.birthday?.month}`);

  const js = read(path.join(ORIGINAL, 'assets/js/app.js'));
  const predictions = new Function('return ' + js.match(/const zodiacPredictions = (\{[\s\S]*?\n {4}\});/)[1])();
  JSON.stringify(predictions) === JSON.stringify(data.predictions)
    ? ok('12 horoscope predictions identical to the original')
    : fail('horoscope predictions differ from the original');

  for (const f of fs.readdirSync(path.join(DIST, 'issues/001'))) {
    const d = JSON.parse(parse(read(path.join(DIST, 'issues/001', f))).querySelector('#issue-data').text);
    if (d.issue !== '001') fail(`${f} carries data of issue ${d.issue}`);
  }
  ok('every 001 page carries only issue 001 data (ads pool: ' + JSON.stringify(issueData.popup.ids) + ')');

  for (const page of ['news', 'columns', 'entertainment', 'about', 'contact']) {
    const html = read(path.join(DIST, `${page}.html`));
    const target = `/issues/001/${page}.html`;
    html.includes(target) && html.includes('location.hash')
      ? ok(`/${page}.html → ${target} (keeps #anchor)`)
      : fail(`/${page}.html does not redirect to ${target} with its hash`);
  }
}

console.log(failures ? `\n✗ ${failures} problem(s): Issue 001 content changed.` : '\n✓ Issue 001 text, attributes and data are intact.');
process.exit(failures ? 1 : 0);
