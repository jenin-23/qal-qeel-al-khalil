/* ------------------------------------------------------------------ *
 * Issue registry: discovers every src/issues/NNN/index.ts.
 *
 *   draft      → only in the newsroom builds (dev / build:drafts)
 *   editing    → on the library shelf, opens the newsroom proof
 *   published  → on the shelf, the full newspaper
 *   archived   → on the shelf and in the archive, the full newspaper
 *
 * An unreleased issue's full text lives in src/issues/NNN/edition/.
 * The newsroom builds merge it in, so the issue reads like a finished
 * newspaper there; production builds never load it (astro.config.mjs).
 * ------------------------------------------------------------------ */
import type { Issue, IssueEdition, IssueStatus, PageKey } from './types';
import { validateIssue } from './validate';
import { issueUrl, archiveUrl } from './url';
import editions from 'virtual:qq-editions';

const modules = import.meta.glob<{ default: Issue }>('../issues/*/index.ts', { eager: true });

/** Newsroom build (dev / build:drafts): unreleased work is visible. Never true in production. */
export const PREVIEW = __QQ_PREVIEW__;

const RELEASED: IssueStatus[] = ['published', 'archived'];

/** the issue as the newsroom sees it: its private edition laid into it */
function withEdition(issue: Issue, edition: IssueEdition | undefined): Issue {
  if (!edition) return issue;
  const released = RELEASED.includes(issue.meta.status);
  if (!PREVIEW && (!released || edition.status !== 'published')) {
    throw new Error(`Issue ${issue.meta.number}: its edition is "${edition.status}"; production only carries published editions`);
  }
  // until it has a front page it stays a proof, even in the newsroom
  const readable = released || Boolean(edition.pages.home);
  return {
    ...issue,
    meta: {
      ...issue.meta,
      ...edition.meta,
      number: issue.meta.number,
      status: readable && !released ? 'published' : issue.meta.status,
      preview: released ? undefined : edition.status,
    },
    ui: { ...issue.ui, ...edition.ui },
    pages: edition.pages,
    articles: edition.articles,
    ads: edition.ads ?? issue.ads,
    birthday: edition.birthday ?? issue.birthday,
    entertainment: edition.entertainment ?? issue.entertainment,
  };
}

const all: Issue[] = Object.values(modules)
  .map((m) => withEdition(m.default, editions[m.default.meta.number]))
  .sort((a, b) => a.meta.number.localeCompare(b.meta.number));

const includeDrafts = PREVIEW;
const PUBLIC: IssueStatus[] = ['editing', 'published', 'archived'];

export const isReadable = (issue: Issue) => issue.meta.status === 'published' || issue.meta.status === 'archived';
export const isEditing = (issue: Issue) => issue.meta.status === 'editing';

/** Issues that get pages in this build. */
export const issues: Issue[] = all.filter((i) => PUBLIC.includes(i.meta.status) || includeDrafts);
/** Full newspapers readers can open (published + archived). */
export const readableIssues: Issue[] = issues.filter(isReadable);
/** What stands on the library shelf: every public issue, oldest first. */
export const shelfIssues: Issue[] = all.filter((i) => PUBLIC.includes(i.meta.status));

for (const issue of issues) {
  // work in progress may be incomplete: the newsroom warns, production refuses
  if (issue.meta.preview) {
    try {
      validateIssue(issue);
    } catch (err) {
      console.warn(`[newsroom] ${(err as Error).message}`);
    }
  } else validateIssue(issue);
}

export function getIssue(number: string): Issue {
  const found = issues.find((i) => i.meta.number === number);
  if (!found) throw new Error(`Issue ${number} is not part of this build`);
  return found;
}

export function hasPage(issue: Issue, page: PageKey): boolean {
  return Boolean(issue.pages[page]);
}

/**
 * Where a reader is, in edition terms. Feeds the (future) issue switcher
 * and <link rel="prev|next">; computed from the registry so old issues
 * learn about newer ones without being edited.
 */
export interface Edition {
  current: string;
  isLatest: boolean;
  previous?: { number: string; url: string };
  next?: { number: string; url: string };
  latest: { number: string; url: string };
  archiveUrl: string;
}

export function editionOf(issue: Issue): Edition {
  const list = shelfIssues.includes(issue) ? shelfIssues : issues;
  const idx = list.indexOf(issue);
  const link = (i?: Issue) => (i ? { number: i.meta.number, url: issueUrl(i.meta.number) } : undefined);
  const latest = list.at(-1) ?? issue;
  return {
    current: issue.meta.number,
    isLatest: latest === issue,
    previous: link(list[idx - 1]),
    next: link(list[idx + 1]),
    latest: link(latest)!,
    archiveUrl: archiveUrl(),
  };
}
