/** true in the newsroom builds (`npm run dev`, `npm run build:drafts`); false in production */
declare const __QQ_PREVIEW__: boolean;

/** private editions of unreleased issues: empty in production (astro.config.mjs) */
declare module 'virtual:qq-editions' {
  const editions: Record<string, import('./lib/types').IssueEdition>;
  export default editions;
}
