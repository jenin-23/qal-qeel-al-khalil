/* ------------------------------------------------------------------ *
 * Issue registry: discovers every src/issues/NNN/index.ts.
 *
 *   draft      → only in `astro dev`
 *   editing    → on the library shelf, opens the newsroom proof
 *   published  → on the shelf, the full newspaper
 *   archived   → on the shelf and in the archive, the full newspaper
 * ------------------------------------------------------------------ */
import type { Issue, IssueStatus, PageKey } from './types';
import { validateIssue } from './validate';
import { issueUrl, archiveUrl } from './url';

const modules = import.meta.glob<{ default: Issue }>('../issues/*/index.ts', { eager: true });

const all: Issue[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.meta.number.localeCompare(b.meta.number));

const includeDrafts = import.meta.env.DEV;
const PUBLIC: IssueStatus[] = ['editing', 'published', 'archived'];

export const isReadable = (issue: Issue) => issue.meta.status === 'published' || issue.meta.status === 'archived';
export const isEditing = (issue: Issue) => issue.meta.status === 'editing';

/** Issues that get pages in this build. */
export const issues: Issue[] = all.filter((i) => PUBLIC.includes(i.meta.status) || includeDrafts);
/** Full newspapers readers can open (published + archived). */
export const readableIssues: Issue[] = issues.filter(isReadable);
/** What stands on the library shelf: every public issue, oldest first. */
export const shelfIssues: Issue[] = all.filter((i) => PUBLIC.includes(i.meta.status));

for (const issue of issues) validateIssue(issue);

export function getIssue(number: string): Issue {
  const found = issues.find((i) => i.meta.number === number);
  if (!found) throw new Error(`Issue ${number} is not part of this build`);
  return found;
}

/** The newest full newspaper (used for the archive page's shell). */
export function latestIssue(): Issue {
  const latest = readableIssues.at(-1);
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
