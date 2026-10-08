import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { readIssues, RELEASED } from './scripts/issue-status.mjs';

/* ------------------------------------------------------------------ *
 * Two editions of the site are built from the same source:
 *
 *   production  `npm run build` → dist/          (what readers get)
 *   preview     `npm run dev`, `npm run build:drafts` → dist-preview/
 *               (the newsroom: unreleased issues readable, DEV marked)
 *
 * An unreleased issue keeps its full text in src/issues/NNN/edition/.
 * Production builds never read those files: the edition registry below
 * is empty for them, and loading any file of an unreleased edition makes
 * the production build fail. See docs/EDITORIAL_WORKFLOW.md.
 * ------------------------------------------------------------------ */
const PREVIEW = process.env.QQ_EDITION === 'preview' || process.argv.slice(2).includes('dev');

const ROOT = fileURLToPath(new URL('.', import.meta.url));

/** every issue folder, its public status, and whether it has a private edition */
function scanIssues() {
  const paths = fs
    .readdirSync(path.join(ROOT, 'src', 'issues'), { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(ROOT, path.join(e.parentPath, e.name)).replaceAll('\\', '/'));
  const read = (/** @type {string} */ p) => (fs.existsSync(path.join(ROOT, p)) ? fs.readFileSync(path.join(ROOT, p), 'utf8') : null);
  return readIssues(paths, read).map((i) => ({
    ...i,
    edition: path.join(ROOT, 'src', 'issues', i.number, 'edition', 'index.ts'),
    hasEdition: i.editionFiles.includes(`src/issues/${i.number}/edition/index.ts`),
  }));
}

/** `virtual:qq-editions`: the private editions this build may include */
function editions() {
  const ID = 'virtual:qq-editions';
  return {
    name: 'qq-editions',
    enforce: /** @type {const} */ ('pre'),
    resolveId(/** @type {string} */ id) {
      if (id === ID) return '\0' + ID;
    },
    load(/** @type {string} */ id) {
      if (id === '\0' + ID) {
        const list = scanIssues().filter((i) => i.hasEdition && (PREVIEW || RELEASED.includes(i.status)));
        return [
          ...list.map((i, k) => `import e${k} from ${JSON.stringify(i.edition.replaceAll('\\', '/'))};`),
          `export default { ${list.map((i, k) => `${JSON.stringify(i.number)}: e${k}`).join(', ')} };`,
        ].join('\n');
      }
      // the guard: nothing from an unreleased edition may enter production
      if (!PREVIEW) {
        const file = id.split('?')[0].replaceAll('\\', '/');
        const m = /\/src\/issues\/(\d{3})\/edition\//.exec(file);
        if (m) {
          const status = scanIssues().find((i) => i.number === m[1])?.status;
          if (!RELEASED.includes(status ?? '')) {
            throw new Error(`[qq-editions] Issue ${m[1]} is "${status}": its private edition must never enter a production build (${file})`);
          }
        }
      }
    },
  };
}

// GitHub Pages project site: https://jenin-23.github.io/qal-qeel-al-khalil/
export default defineConfig({
  site: 'https://jenin-23.github.io',
  base: '/qal-qeel-al-khalil',
  trailingSlash: 'ignore',
  // the preview build never lands where production is deployed from
  outDir: PREVIEW ? './dist-preview' : './dist',
  build: {
    // src/pages/issues/[issue]/news.astro -> issues/001/news.html
    format: 'preserve',
  },
  devToolbar: { enabled: false },
  vite: {
    plugins: [editions()],
    define: { __QQ_PREVIEW__: JSON.stringify(PREVIEW) },
  },
});
