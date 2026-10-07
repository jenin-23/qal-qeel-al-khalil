# قال قيل آل خليل

A family newspaper, published issue by issue as a static website.
Live: https://jenin-23.github.io/qal-qeel-al-khalil/

Built with [Astro](https://astro.build) (no React, no Tailwind). Every page is
plain static HTML; small vanilla-TypeScript modules add the interactions.

## Run it

```sh
npm install
npm run dev        # http://localhost:4321/qal-qeel-al-khalil/  (drafts visible here)
npm run build      # production site in dist/  (published issues only)
npm run preview    # serve dist/ locally
```

## Where things live

| Path | What |
|---|---|
| `src/issues/NNN/` | **Everything written for one issue**: metadata, articles, ads, horoscope, birthday month, fatwa, tickers. |
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
|  | **مكتبة قال قيل**: the library. Every public issue stands on the shelf as a newspaper. |
|  | The structured, chronological archive. |
|  | Issue 001, permanently. |
|  | While 002 is in editing: the newsroom proof (unfinished on purpose). |

Old links such as  redirect to .

## Issue statuses

| status | Library shelf |  |
|---|---|---|
|  | not shown (only ) | dev preview only |
|  | an unfinished copy (loose sheets, proof marks, «قيد التحرير») | the newsroom proof |
|  | a finished newspaper | the full issue |
|  | a finished newspaper | the full issue, forever |

Issue 001 is ; Issue 002 is .

### While an issue is in editing

The proof at  uses newsroom wording only ()
and invents nothing. To leak real material gradually, add it to the issue's
 (see ):

- : , ,  (cropped/blurred), ,
  , , , - : real counts only, e.g. 
## Starting a new issue

1. `src/issues/002/index.ts` exists in `editing` (it shows as the newsroom proof).
   Use `src/issues/001/` as the model: split it into `issue.ts`, `pages.ts`,
   `articles.ts` + `articles/<id>.html`, `ads.ts`, `birthday.ts`,
   `entertainment.ts`.
2. Put images in `src/assets/images/issue-002/` and import them in the
   issue's files. Every image needs Arabic `alt` text (the build fails otherwise).
3. Preview with `npm run dev` at `/issues/002/`.
4. Publish: set `status: 'published'` and add `meta.archive` (its archive card).
   The unfinished copy on the shelf becomes a finished newspaper; Issue 001
   stays at `/issues/001/` (optionally mark it `archived`).

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
npm test             # build + verify:001 + smoke
npm run screenshots  # compare every page with tests/visual-baseline (add --update to re-baseline)
```

The browser tests need Chromium once: `npx playwright install chromium`.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: build, `verify:001`,
then deploy to GitHub Pages (Pages source: **GitHub Actions**; repository
variable `DEPLOY_ENABLED=true`).
