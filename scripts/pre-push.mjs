/* ------------------------------------------------------------------ *
 * Guard for the PUBLIC repository (github.com/jenin-23/qal-qeel-al-khalil).
 * The repository is public: anything pushed there can be read by anyone,
 * whether or not the website shows it. So, towards the public remote:
 *
 *  - only `main` (and tags) may be pushed; develop and feature branches
 *    carry unreleased work and are never pushed there;
 *  - no commit being pushed may contain unreleased material: a private
 *    edition (src/issues/NNN/edition/) of an issue that is not yet
 *    published, or any file of an issue in `draft`.
 *
 * Every commit in the push is checked, not only the last one, because
 * history is public too.
 *
 * Installed by `npm run setup:hooks` (git config core.hooksPath .githooks).
 * Also usable directly:  node scripts/pre-push.mjs --check <commit>
 * ------------------------------------------------------------------ */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { readIssues } from './issue-status.mjs';

const PUBLIC = /github\.com[:/]jenin-23\/qal-qeel-al-khalil(\.git)?\/?$/i;
const ZERO = /^0+$/;
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** unreleased material in one commit's tree */
export function unreleasedIn(commit) {
  const paths = git('ls-tree', '-r', '--name-only', commit, '--', 'src/issues').split('\n').filter(Boolean);
  const read = (p) => {
    try {
      return git('show', `${commit}:${p}`);
    } catch {
      return null;
    }
  };
  const found = [];
  for (const i of readIssues(paths, read)) {
    if (i.released) continue;
    if (i.status === 'draft' || i.status === 'unknown') {
      if (i.files.length) found.push(`issue ${i.number} is "${i.status}" (${i.files.length} files)`);
    } else if (i.editionFiles.length) {
      found.push(`issue ${i.number} is "${i.status}" but its private edition is included (${i.editionFiles.length} files)`);
    }
  }
  return found;
}

const [arg1, arg2] = process.argv.slice(2);

if (arg1 === '--check') {
  const commit = arg2 ?? 'HEAD';
  const found = unreleasedIn(commit);
  if (found.length) {
    for (const f of found) console.error(`✗ ${commit}: ${f}`);
    process.exit(1);
  }
  console.log(`✓ ${commit}: no unreleased material`);
  process.exit(0);
}

// git pre-push: argv = [remote name, remote url]; stdin = "<local ref> <local sha> <remote ref> <remote sha>" lines
const remote = arg1;
const url = arg2 ?? '';
if (!PUBLIC.test(url)) process.exit(0); // private remotes may receive drafts

const lines = fs.readFileSync(0, 'utf8').split('\n').filter(Boolean);
const problems = [];
for (const line of lines) {
  const [localRef, localSha, remoteRef] = line.split(' ');
  if (ZERO.test(localSha)) continue; // deleting a ref sends no content
  if (remoteRef !== 'refs/heads/main' && !remoteRef.startsWith('refs/tags/')) {
    problems.push(`${localRef} → ${remoteRef}: only main is published to the public repository (keep develop and feature branches private)`);
    continue;
  }
  const commits = git('rev-list', localSha, '--not', `--remotes=${remote}`).split('\n').filter(Boolean);
  for (const c of commits) for (const f of unreleasedIn(c)) problems.push(`${c.slice(0, 7)}: ${f}`);
}

if (problems.length) {
  console.error('\n✗ Push to the PUBLIC repository refused: unreleased material would become readable by anyone.\n');
  for (const p of [...new Set(problems)]) console.error(`  - ${p}`);
  console.error('\nSee docs/EDITORIAL_WORKFLOW.md. Do not bypass this check (--no-verify).\n');
  process.exit(1);
}
