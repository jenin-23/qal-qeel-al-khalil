# Editorial workflow: preparing an issue privately, releasing it deliberately

Readers keep reading the published edition while the newsroom prepares the
next one. Nothing unfinished reaches them, and an issue is released only when
the editor explicitly approves it.

Public website: https://jenin-23.github.io/qal-qeel-al-khalil/

---

## 1. The two editions of the site

The same source code builds two different websites.

| | **Production edition** (what readers get) | **Newsroom edition** (private preview) |
|---|---|---|
| Built by | `npm run build` (and GitHub Actions on `main`) | `npm run dev`, `npm run build:drafts` |
| Output | `dist/` → deployed to GitHub Pages | `dist-preview/` or the dev server; **never deployed** |
| Unreleased issues | only their approved public proof (Issue 002: the newsroom proof with the envelope) | readable as a complete newspaper: on the shelf, with sections and print edition |
| Marking | none | a red **DEV · نسخة التطوير · غير منشورة** stamp on every page, `[تطوير]` in the tab title, and a «مسودة» / «قيد المراجعة» label on each unfinished article (none of it is printed) |
| Search engines | indexed | `noindex` on every page |

How the separation works: an unreleased issue keeps its full text in
`src/issues/NNN/edition/`. A production build **never reads that folder**:

- `astro.config.mjs` gives production builds an empty list of private editions;
- if any production code tries to load a file from an unreleased edition, the
  build stops with an error (`[qq-editions] … must never enter a production build`);
- a released issue must have a `published` edition containing only `published`
  articles, or the build stops.

So the protection does not depend on hidden CSS, secret URLs, `noindex` or
passwords. The draft text is simply absent from the production files.

## 2. Where things live

| Path | Public? | What |
|---|---|---|
| `src/issues/001/` | public | Issue 001: published, frozen (`npm run verify:001`) |
| `src/issues/002/index.ts` | public | Issue 002's public shell: status `editing`, the approved proof, the submissions envelope. Only approved, generic material goes here. |
| `src/issues/002/edition/` | **private** | Issue 002's real content: `index.ts` (pages, headlines, layout), `articles/<id>.html` (bodies, verbatim), `images/` |
| `docs/EDITORIAL_WORKFLOW.md` | public | this guide |

Anything written outside an `edition/` folder is public, both on the website
and in the public repository. Never paste unpublished text into public files,
for example as a teaser, unless that teaser itself is approved for readers.

## 3. Branches and the public repository

**The GitHub repository `jenin-23/qal-qeel-al-khalil` is public.** Anyone can
read every branch and every commit pushed to it, whether or not the website
shows it. An unlisted URL or branch is not private. Therefore:

| Branch | Purpose | Where it lives |
|---|---|---|
| `main` | **Production.** Exactly what readers get. Every push deploys. | public repository (`origin`) |
| `develop` | The newsroom: the next issue's private edition, plus site work in progress | **this computer** (and optionally a private backup remote; see below). Never `origin`. |
| `fix/…`, `feature/…` | Larger or separate changes | start from `main` for site fixes, from `develop` for issue work |

Rules:

1. **Never merge `develop` into `main` before the issue is approved for release.**
2. Never push `develop` or feature branches to `origin`.
3. Never bypass the push guard (`git push --no-verify`).

### Safety nets (in order)

1. **Pre-push guard** (`.githooks/pre-push` → `scripts/pre-push.mjs`). It runs
   on every `git push` to the public repository and refuses when:
   - a branch other than `main` (or a tag) is being pushed;
   - any commit being pushed, not only the latest, contains an unreleased
     issue's private edition, or any file of an issue in `draft`.

   Install it once per clone with `npm run setup:hooks`. It is already
   installed on this computer.
2. **Production leak check** (`scripts/verify-production.mjs`), run by every
   `npm run build`. It scans the generated files in `dist/` (HTML, JS, CSS,
   JSON, XML…) and fails on any of these:
   - any sentence or string from an unreleased edition;
   - any private image;
   - any reader page of an unreleased issue other than its approved proof;
   - any development mark.
3. **GitHub Actions** (`.github/workflows/deploy.yml`) repeats the source check
   and the leak check before deploying. It deploys only on a push to `main`;
   pull requests and other branches never deploy.
4. **GitHub settings:** Pages source is *GitHub Actions*; the `github-pages`
   environment accepts deployments from `main` only. A ruleset on `main`
   blocks force-pushes and deletion.

### Backing up `develop`

`develop` currently exists only on this computer. A backup that keeps drafts
private needs **a private remote**, for example a second, private GitHub
repository added as `git remote add newsroom <url>`. The guard allows pushes
to any remote other than the public one. Do not create a public staging site
for previews.

## 4. Statuses

**Issue status** (in the public `src/issues/NNN/index.ts`):

| status | Production | Newsroom |
|---|---|---|
| `draft` | nothing at all | readable |
| `editing` | on the shelf as an unfinished proof; `/issues/NNN/` shows the newsroom proof | readable as a full newspaper once its edition has a front page |
| `published` | full newspaper (needs a `published` edition) | same |
| `archived` | full newspaper, in the archive | same |

**Editorial status** (`draft` · `review` · `published`), on the private
edition (`edition/index.ts` → `status`) and on each article (`status`):

- `draft`: being written or laid out
- `review`: complete, waiting for the editor's approval
- `published`: approved; set only as part of a release

## 5. Commands

```sh
npm run dev             # newsroom, live-reloading: http://localhost:4321/qal-qeel-al-khalil/
npm run build:drafts    # newsroom build → dist-preview/   (production-like, drafts included, DEV-marked)
npm run preview:drafts  # serve dist-preview/ on this computer
npm run build           # PRODUCTION build → dist/ + leak check
npm run preview         # serve the production build on this computer
npm test                # production build + leak check + verify:001 + browser suite
npm run check           # TypeScript / Astro
npm run setup:hooks     # install the pre-push guard (once per clone)
node scripts/pre-push.mjs --check HEAD   # does this commit contain unreleased material?
```

Which one to use:

- **Writing and laying out:** `npm run dev`.
- **Reading the issue as a reader would, with drafts:** `npm run build:drafts` then `npm run preview:drafts`.
- **Checking exactly what the public will get:** `npm run build` then `npm run preview`.

## 6. Day to day

### Adding Issue 002 articles (on `develop`)

```sh
git switch develop
npm run dev
```

For each article:

1. The body goes into `src/issues/002/edition/articles/<id>.html`, **verbatim**.
2. The headline, subheadline/meta line, image, section (`news`, `columns`,
   `entertainment`…) and `status: 'draft'` go into `edition/index.ts` → `articles`.
3. Its place in the layout goes into `edition/index.ts` → `pages`: front-page
   lead, headlines, table of contents, article lists.
4. Review it at `/issues/002/<section>.html`. Its label shows «مسودة».
5. Once it is approved, set the article's `status: 'review'` (ready) and later
   `'published'` (only during a release).
6. Commit on `develop`.

### Fixing or improving the live site while an issue is in progress

Site fixes (not Issue 002 content) go to production without the drafts:

```sh
git switch main
git switch -c fix/short-name          # branch from main, not from develop
# … change, then:
npm test
git switch main && git merge fix/short-name
git push origin main                  # guard checks, Actions builds and deploys
git switch develop && git merge main  # bring the fix into the newsroom
```

If the fix was already made on `develop`, copy only that commit to `main`
(`git cherry-pick <commit>`), never the whole branch, and make sure the commit
does not touch any `edition/` folder.

## 7. Releasing an issue (only with the editor's explicit approval)

Nothing is released because files exist or because a branch was pushed.
Release is a deliberate, separate step.

1. **Approval.** The editor has read the complete issue in the newsroom
   (`npm run build:drafts`, `npm run preview:drafts`) on desktop, on a phone
   and in print, and has said: release Issue NNN.
2. **Final edits on `develop`:**
   - every article in `edition/index.ts`: `status: 'published'` (or remove the field);
   - `edition.status: 'published'`;
   - `edition.meta`: `releaseDate`, `releaseDateLabel`, `archive` card,
     `city`, `priceLine`, `copyright` (as approved);
   - `edition.ui`: the issue's interface wording;
   - public `src/issues/NNN/index.ts`: `status: 'published'`
     (optionally the previous issue → `archived`);
   - remove or update any `construction` teasers that no longer apply.
3. **Checks on `develop`:** `npm run check`, `npm test` (the production build
   now includes the issue, and the leak check passes because the issue is
   released), and `npm run screenshots -- --update`, then review the new baseline.
4. **Merge as one release commit**, so that draft revisions do not become
   public history:
   ```sh
   git switch main
   git merge --squash develop
   git commit -m "Release Issue NNN"
   git push origin main        # the guard re-checks; Actions builds, checks and deploys
   git switch develop && git merge main
   ```
5. **Live verification:** `SITE_URL=https://jenin-23.github.io npm run test:smoke`
   and a read-through on the live site.

The next issue then starts the same way: a public shell in `editing`, and a
private `edition/` on `develop`.

## 8. If something goes wrong

- **The build says `[qq-editions] … must never enter a production build`:**
  public code imports an unreleased edition. Remove that import.
- **The leak check fails:** do not deploy. It names the file and the text that
  leaked.
- **The push guard refuses:** it lists the commits and the issue. Do not use
  `--no-verify`. Move the work to `develop`, or finish the release procedure.
- **Something private reached the public repository:** stop and tell the
  editor. Removing it from history needs a careful, deliberate rewrite.
  Deleting the file in a new commit is not enough.
