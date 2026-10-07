/* ------------------------------------------------------------------ *
 * Issue 002 · December 2026 · DRAFT — empty editorial skeleton.
 *
 * Drafts are only built by `npm run dev` (preview at /issues/002/),
 * never in production. To publish: fill in the content, then set
 * status to 'published'. Use src/issues/001 as the reference shape.
 * ------------------------------------------------------------------ */
import type { Issue } from '../../lib/types';

const issue: Issue = {
  meta: {
    number: '002',
    status: 'draft',
    year: 2026,
    month: 12,
  },
  // Interface microcopy must be written for this issue before publishing
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
  // birthday: { month: 12, ... }  — see src/issues/001/birthday.ts
  // entertainment: { horoscope, coin, fatwa, quiz } — see src/issues/001/entertainment.ts
};
export default issue;
