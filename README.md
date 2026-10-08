# قال قيل آل خليل

A family newspaper, published issue by issue as a static website.
Live: https://jenin-23.github.io/qal-qeel-al-khalil/

Built with [Astro](https://astro.build) (no React, no Tailwind). Every page is
plain static HTML; small vanilla-TypeScript modules add the interactions.

## Run it

```sh
npm install
npm run setup:hooks     # once per clone: the guard that keeps drafts out of the public repository
npm run dev             # newsroom preview, drafts included, marked DEV: http://localhost:4321/qal-qeel-al-khalil/
npm run build:drafts    # newsroom build → dist-preview/ (never deployed); serve with npm run preview:drafts
npm run build           # PRODUCTION build → dist/ (released issues only) + draft-leak check
npm run preview         # serve the production build locally
```

**Editorial workflow** (private drafts, branches, releasing an issue):
[docs/EDITORIAL_WORKFLOW.md](docs/EDITORIAL_WORKFLOW.md). In short: `main` is
production and is public; unreleased issues live in `src/issues/NNN/edition/`
on the private `develop` branch, and production builds never read them.

## Where things live

| Path | What |
|---|---|
| `src/issues/NNN/` | **Everything written for one issue**: metadata, articles, ads, horoscope, birthday month, fatwa, tickers. |
| `src/issues/NNN/edition/` | **Private**: the full text of an issue that is not released yet (on `develop` only; never in production). |
| `src/universe/` | What stays the same across issues: the paper's name and tagline, navigation, recurring institutions (e.g. الشيخ البحبحاني), the archive page. |
| `src/components/`, `src/layouts/` | The newspaper shell and building blocks. They contain no editorial text. |
| `src/styles/` | The press theme ("an old Arabic newspaper that became interactive"). `tokens.css` holds colours, fonts and the type scale. |
| `src/scripts/` | Interactions: modals, toast, ticker, articles, copy, reactions, birthday/horoscope, coin, quiz, popup ads, press motion. |
| `src/assets/images/issue-NNN/` | Images per issue (optimised at build time; originals untouched). |
| `tests/fixtures/issue-001-original/` | Frozen copy of the original Issue 001 site, the reference for `verify:001`. |
| `tests/visual-baseline/` | Screenshots of every page (desktop / tablet / mobile). |

URLs:

| URL | What |
|---|---|
| `/` | **مكتبة قال قيل**: the library. Every public issue stands on the shelf as a newspaper. |
| `/about.html`, `/contact.html` | من نحن / تواصل معنا: newspaper-level pages (not part of any issue). |
| `/archive.html` | The structured, chronological archive. |
| `/issues/001/…` | Issue 001, permanently. |
| `/issues/002/` | While 002 is in editing: the newsroom proof (unfinished on purpose). |

Old links such as `/news.html#eslam-story` redirect to `/issues/001/news.html#eslam-story`.

## Issue statuses

| status | Library shelf | `/issues/NNN/` |
|---|---|---|
| `draft` | not shown (newsroom builds only) | newsroom builds only |
| `editing` | an unfinished copy (loose sheets, proof marks, «قيد التحرير») | the newsroom proof |
| `published` | a finished newspaper | the full issue |
| `archived` | a finished newspaper | the full issue, forever |

Issue 001 is `published`; Issue 002 is `editing`. Articles and private editions
also carry an editorial status (`draft` · `review` · `published`); see
[docs/EDITORIAL_WORKFLOW.md](docs/EDITORIAL_WORKFLOW.md).

### While an issue is in editing

The proof at `/issues/NNN/` uses newsroom wording only (`src/universe/newsroom.ts`)
and invents nothing. To leak real material gradually, add it to the issue's
`construction` (see `src/issues/002/index.ts`):

- `teasers`: `headline`, `redacted-headline`, `image` (cropped/blurred), `quote`,
  `sections`, `ad`, `classified`, `snippet`
- `progress`: real counts only, e.g. `{ articles: { done: 2, total: 6 } }`

## Starting a new issue

1. The public shell `src/issues/NNN/index.ts` is in `editing` (readers see the
   newsroom proof).
2. The real content is written privately, on `develop`, in
   `src/issues/NNN/edition/`: `index.ts` (pages, headlines, layout),
   `articles/<id>.html` (bodies, verbatim) and `images/`. Every image needs
   Arabic `alt` text (the build fails otherwise). Use `src/issues/001/` as the model.
3. Preview with `npm run dev` at `/issues/NNN/`. The issue reads as a full
   newspaper there, marked DEV.
4. Release only with the editor's approval, following "Releasing an issue" in
   [docs/EDITORIAL_WORKFLOW.md](docs/EDITORIAL_WORKFLOW.md).

The build validates each issue: 12 horoscope predictions, exactly three
reactions per article, known article ids, alt text, popup timing ranges.

### Ads

`src/issues/NNN/ads.ts` has three kinds:

- `sidebar`: classified ads per page (`{ news: [...] }`); optional `layout`:
  `notice` · `banner` · `checklist` · `reverse` · `coupon`.
- `inline`: image ads placed after an article (`after: '<article id>'`).
- `popup`: `{ enabled, firstDelay?, repeatDelay?, minAfterNavigation?, pool }`
  (seconds; defaults in `src/universe/defaults.ts`, about 2-4 minutes). Add image
  ads to `pool` and they start appearing as loose flyers. No code changes needed.

## Tests

```sh
npm run verify:001   # Issue 001's words, attributes, phone numbers, anchors and data are unchanged
npm run test:smoke   # browser tests: every page, dialogs, keyboard, reduced motion, mobile overflow, legacy URLs
npm run check        # TypeScript / Astro
npm run verify:production  # draft-leak check of dist/ (also part of npm run build)
npm test             # build (+ leak check) + verify:001 + smoke
npm run screenshots  # compare every page with tests/visual-baseline (add --update to re-baseline)
```

The browser tests need Chromium once: `npx playwright install chromium`.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: the source check (no
unreleased issue), the production build with its draft-leak check, `verify:001`,
then deploy to GitHub Pages (Pages source: **GitHub Actions**; environment
`github-pages` accepts `main` only; repository variable `DEPLOY_ENABLED=true`).
No other branch and no pull request ever deploys.

## Navigation contexts

- **Library level** (`/`, من نحن, تواصل معنا, the archive):
  المكتبة | الأرشيف | من نحن | تواصل معنا. No issue sections.
- **Inside an issue**: that issue's own section bar, plus the
  «مكتبة قال قيل» reference above the masthead to step back out.

An issue opens only when its newspaper is taken from the shelf or its URL
is opened directly. `verify:001` fails the build if the root ever stops
being the library.

## 107.5 FM (the radio)

One small receiver lives in the world of the paper: on the library's storage
shelf, and at the desk side of every newspaper page (folded to an edge until
opened). It never plays on its own; a fresh visit is always silent.

- Settings: `src/config/radio.ts` (frequency, default volume, wording).
- Programme: 7 Creative Commons (CC BY-SA) oud and qanun recordings in
  `public/audio/radio/` (about 18 minutes, 24.6 MB). They are played as one
  station on a clock, never as a playlist: position = now mod programme length,
  so every page and visitor hears the same moment. Nothing is downloaded until
  the radio is switched on. A file that fails reads «لا توجد إشارة» and the
  station moves on to the next item.
- Licences: `docs/RADIO_MUSIC_LICENSES.md` records the provenance of every file.
  The required attributions are shown on `/broadcast.html` («بيانات البث»,
  linked from every footer), not on the radio.
- To change the programme: use only audio whose licence clearly allows public
  self-hosting. Add the file to `public/audio/radio/`, add an entry with `duration`
  and `credit` to `tracks`, and record it in the licences doc. Then run
  `npm test` and deploy.
