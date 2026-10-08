/* Build-time checks: a broken issue fails the build instead of the page. */
import { ZODIAC_SIGNS, type Issue } from './types';

export function validateIssue(issue: Issue): void {
  const n = issue.meta.number;
  const fail = (msg: string) => {
    throw new Error(`[issue ${n}] ${msg}`);
  };

  if (!/^\d{3,}$/.test(n)) fail('meta.number must be zero-padded digits, e.g. "002"');
  if (issue.meta.month < 1 || issue.meta.month > 12) fail('meta.month must be 1-12');

  const ids = new Set<string>();
  for (const a of issue.articles) {
    if (ids.has(a.id)) fail(`duplicate article id "${a.id}"`);
    ids.add(a.id);
    if (!a.body) fail(`article "${a.id}" has no body (articles/${a.id}.html)`);
    if (a.image && 'src' in a.image && !a.image.alt?.trim()) fail(`article "${a.id}" image needs Arabic alt text`);
    if (a.reactions && a.reactions.options.length !== 3) fail(`article "${a.id}" needs exactly 3 reactions`);
  }

  for (const [page, def] of Object.entries(issue.pages)) {
    for (const block of def?.blocks ?? []) {
      const refs =
        block.type === 'articles' ? block.ids
        : block.type === 'toc' ? block.items.map((i) => i.articleId)
        : block.type === 'front' ? [block.lead.articleId, ...block.headlines.map((h) => h.articleId)]
        : [];
      for (const id of refs) if (!ids.has(id)) fail(`page "${page}" references unknown article "${id}"`);
      if (block.type === 'entertainment') {
        for (const mod of block.modules) if (!issue.entertainment?.[mod]) fail(`entertainment module "${mod}" has no content`);
        if (block.modules.includes('horoscope') && !issue.birthday) fail('horoscope needs a birthday definition');
      }
    }
  }

  const horoscope = issue.entertainment?.horoscope;
  if (horoscope) {
    for (const sign of ZODIAC_SIGNS) if (!horoscope.predictions[sign]?.trim()) fail(`horoscope is missing "${sign}"`);
    if (Object.keys(horoscope.predictions).length !== 12) fail('horoscope must have exactly 12 predictions');
  }

  if (issue.birthday && (issue.birthday.month < 1 || issue.birthday.month > 12)) fail('birthday.month must be 1-12');

  const all = [...issue.ads.inline, ...issue.ads.popup.pool];
  const adIds = new Set<string>();
  for (const ad of all) {
    if (adIds.has(ad.id)) fail(`duplicate ad id "${ad.id}"`);
    adIds.add(ad.id);
    if (!ad.alt?.trim()) fail(`ad "${ad.id}" needs Arabic alt text`);
  }
  for (const ad of issue.ads.inline) if (!ids.has(ad.after)) fail(`inline ad "${ad.id}" follows unknown article "${ad.after}"`);
  for (const key of ['firstDelay', 'repeatDelay'] as const) {
    const r = issue.ads.popup[key];
    if (r && (r[0] > r[1] || r[0] < 0)) fail(`ads.popup.${key} must be [min, max] seconds`);
  }

  if (issue.meta.status === 'editing' && Object.keys(issue.pages).length) {
    fail('an issue in editing has no reader pages yet; publish it to open its sections');
  }
  const sub = issue.construction?.submissions;
  if (sub && !/^[1-9]\d{7,14}$/.test(sub.whatsapp)) fail('construction.submissions.whatsapp must be digits only, international format, no +');

  if (issue.meta.status === 'editing') {
    for (const [key, item] of Object.entries(issue.construction?.progress ?? {})) {
      if (item && (item.done < 0 || (item.total !== undefined && item.done > item.total))) fail(`progress.${key} is not a real count`);
    }
  }

  if (issue.meta.status === 'published' || issue.meta.status === 'archived') {
    // a released issue carries released articles only
    const unreleased = issue.articles.filter((a) => a.status && a.status !== 'published');
    if (unreleased.length && !issue.meta.preview) {
      fail(`articles not approved for release: ${unreleased.map((a) => `${a.id} (${a.status})`).join(', ')}`);
    }
    if (!issue.pages.home) fail('a published issue needs a home page');
    if (!issue.meta.archive) fail('a published issue needs meta.archive for the archive card');
    if (!issue.meta.releaseDateLabel) fail('a published issue needs meta.releaseDateLabel');
    const empty = Object.entries(issue.ui).filter(([, v]) => typeof v === 'string' && !v);
    if (empty.length) fail(`ui strings missing: ${empty.map(([k]) => k).join(', ')}`);
  }
}
