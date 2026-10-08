/* ------------------------------------------------------------------ *
 * Reads each issue's public status straight from its source files,
 * without running them. Shared by astro.config.mjs (which decides what a
 * build may load), scripts/verify-production.mjs and the pre-push guard
 * (.githooks/pre-push), so they always agree.
 *
 * The status is the first `status: '…'` in src/issues/NNN/index.ts, or
 * in issue.ts (Issue 001 keeps its meta there). Anything unreadable
 * counts as unreleased: the safe answer.
 * ------------------------------------------------------------------ */
export const RELEASED = ['published', 'archived'];

/**
 * @param {string[]} paths every file path (repo-relative, forward slashes)
 * @param {(p: string) => string | null} read file contents, or null
 */
export function readIssues(paths, read) {
  const numbers = [...new Set(paths.map((p) => /^src\/issues\/(\d{3})\//.exec(p)?.[1]).filter(Boolean))].sort();
  return numbers.map((number) => {
    const base = `src/issues/${number}`;
    let status = 'unknown';
    for (const f of ['index.ts', 'issue.ts']) {
      const m = /status:\s*['"](\w+)['"]/.exec(read(`${base}/${f}`) ?? '');
      if (m) { status = m[1]; break; }
    }
    return {
      number,
      status,
      released: RELEASED.includes(status),
      files: paths.filter((p) => p.startsWith(base + '/')),
      editionFiles: paths.filter((p) => p.startsWith(base + '/edition/')),
    };
  });
}
