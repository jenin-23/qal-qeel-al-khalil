/* ------------------------------------------------------------------ *
 * Issue registry: discovers every src/issues/NNN/index.ts.
 * Drafts exist only in `astro dev`; production builds publish
 * `status: 'published'` issues only.
 * ------------------------------------------------------------------ */
import type { Issue, PageKey } from './types';
import { validateIssue } from './validate';
import { issueUrl, archiveUrl } from './url';

const modules = import.meta.glob<{ default: Issue }>('../issues/*/index.ts', { eager: true });

const all: Issue[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.meta.number.localeCompare(b.meta.number));

const includeDrafts = import.meta.env.DEV;

/** Issues that get pages in this build. */
export const issues: Issue[] = all.filter((i) => i.meta.status === 'published' || includeDrafts);
/** Issues readers can see in the archive / on the homepage. */
export const publishedIssues: Issue[] = all.filter((i) => i.meta.status === 'published');

for (const issue of issues) validateIssue(issue);

export function getIssue(number: string): Issue {
  const found = issues.find((i) => i.meta.number === number);
  if (!found) throw new Error(`Issue ${number} is not part of this build`);
  return found;
}

/** The homepage (/) always shows the newest published issue. */
export function latestIssue(): Issue {
  const latest = publishedIssues.at(-1);
  if (!latest) throw new Error('No published issue');
  return latest;
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
  const list = publishedIssues.includes(issue) ? publishedIssues : issues;
  const idx = list.indexOf(issue);
  const link = (i?: Issue) => (i ? { number: i.meta.number, url: issueUrl(i.meta.number) } : undefined);
  const latest = latestIssue();
  return {
    current: issue.meta.number,
    isLatest: latest === issue,
    previous: link(list[idx - 1]),
    next: link(list[idx + 1]),
    latest: link(latest)!,
    archiveUrl: archiveUrl(),
  };
}
