/* ------------------------------------------------------------------ *
 * Library: taking a newspaper off the shelf.
 * The chosen copy comes forward, then the issue opens; the issue page
 * plays the matching "opened newspaper" arrival (see PressEffects).
 * Modified clicks (new tab etc.) and reduced motion navigate at once.
 * ------------------------------------------------------------------ */
export const ARRIVE_KEY = 'qqak:arrive';
const TAKE_MS = 420;

export function initLibrary(): void {
  const papers = document.querySelectorAll<HTMLAnchorElement>('a[data-take]');
  if (!papers.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  papers.forEach((paper) => {
    paper.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      try {
        sessionStorage.setItem(ARRIVE_KEY, 'library');
      } catch {
        /* no arrival animation then */
      }
      if (reduced.matches) return;

      e.preventDefault();
      document.body.classList.add('is-taking');
      paper.closest('.shelf-slot')?.classList.add('is-taken');
      window.setTimeout(() => {
        window.location.href = paper.href;
      }, TAKE_MS);
    });
  });

  // back/forward cache: put the paper back on the shelf
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.body.classList.remove('is-taking');
    document.querySelectorAll('.is-taken').forEach((el) => el.classList.remove('is-taken'));
  });

  // the way back marks the return trip, so the shelf greets it gently
  document.querySelectorAll('[data-to-library]').forEach((a) =>
    a.addEventListener('click', () => {
      try {
        sessionStorage.removeItem(ARRIVE_KEY);
      } catch {
        /* ignore */
      }
    }),
  );
}
