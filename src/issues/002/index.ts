/* ------------------------------------------------------------------ *
 * Issue 002 · December 2026 · EDITING: no editorial content yet.
 *
 * While status is 'editing' the issue stands on the library shelf as an
 * unfinished copy and /issues/002/ shows the newsroom proof. Nothing
 * here is invented: the proof only uses newsroom wording
 * (src/universe/newsroom.ts) plus whatever is added to `construction`.
 *
 * To leak something real while the issue is being made, add it to
 * construction.teasers (types in src/lib/types.ts → Teaser):
 *   { type: 'headline', headline: '…' }        a headline, article hidden
 *   { type: 'redacted-headline', visible: […], hiddenWords: n }
 *   { type: 'image', image, alt, crop?, blur? } a cropped/blurred image
 *   { type: 'quote', quote: '…' }              a quote without context
 *   { type: 'sections', names: [...] }         upcoming section names
 *   { type: 'ad', ad: {...} }                  a finished advertisement
 *   { type: 'classified', text: '…' }          a cryptic classified
 *   { type: 'snippet', text: '…' }             a fragment of an article
 * and real counts to construction.progress, e.g. { articles: { done: 2, total: 6 } }.
 *
 * To publish: write the issue like src/issues/001, then set status to
 * 'published' (Issue 001 can then become 'archived').
 * ------------------------------------------------------------------ */
import type { Issue } from '../../lib/types';

const issue: Issue = {
  meta: {
    number: '002',
    status: 'editing',
    year: 2026,
    month: 12,
  },
  construction: {
    // progress: {},  ← only real numbers, once there are some
    teasers: [],
  },
  // Interface microcopy is written when the issue is published
  // (Issue 001's values are in src/issues/001/issue.ts).
  ui: {
    closeLabel: '',
    coming: { title: '', text: '', triggerText: '' },
    toastInitial: '',
    copyArticle: { label: '', done: '', toast: '', error: '' },
    copyPhone: { done: '', toast: '', error: '' },
    reactionToast: '',
    contactToast: '',
    popupAd: { dismiss: '', ariaLabel: '' },
    inlineAdLabel: '',
  },
  pages: {},
  articles: [],
  ads: {
    sidebar: {},
    inline: [],
    popup: { enabled: true, pool: [] },
  },
};
export default issue;
