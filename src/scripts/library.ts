/* ------------------------------------------------------------------ *
 * Library: taking a newspaper off the shelf (and putting it back).
 *
 * Browsers with cross-document View Transitions: the chosen copy is
 * named `issue-sheet`; on the issue page the sheet carries the same
 * name, so the browser carries the copy forward and opens it into the
 * page (≈0.65s, no waiting before navigation). The return trip does
 * the reverse, folding the sheet back to its place on the shelf.
 * Other browsers: a short lift, then the issue opens with a matching
 * arrival. Modified clicks and reduced motion just navigate.
 *
 * The library remembers what was read, as a quiet mark, never as a
 * destination: nothing here ever navigates on its own.
 * ------------------------------------------------------------------ */
import { safeStorage } from './data';

export const ARRIVE_KEY = 'qqak:arrive';
export const RETURN_KEY = 'qqak:return';
export const LAST_READ_KEY = 'qqak:last-read';
const FALLBACK_TAKE_MS = 260;

const local = safeStorage('local');
const session = safeStorage('session');
export const supportsCrossDocumentVT = () => 'onpagereveal' in window && 'CSSViewTransitionRule' in window;

export function initLibrary(): void {
  const papers = document.querySelectorAll<HTMLAnchorElement>('a[data-take]');
  if (!papers.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // visual memory only
  const last = local.read<string>(LAST_READ_KEY);
  if (last) {
    const slot = document.querySelector<HTMLElement>(`[data-issue-slot="${CSS.escape(last)}"]`);
    if (slot) {
      slot.classList.add('is-recent');
      slot.querySelector<HTMLElement>('.shelf-recent')?.removeAttribute('hidden');
    }
  }

  papers.forEach((paper) => {
    paper.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduced.matches) return; // plain navigation
      session.write(ARRIVE_KEY, paper.dataset.issue ?? 'library');

      if (supportsCrossDocumentVT()) {
        // the browser carries this copy into the next page
        paper.style.viewTransitionName = 'issue-sheet';
        return;
      }
      e.preventDefault();
      document.body.classList.add('is-taking');
      paper.closest('.shelf-slot')?.classList.add('is-taken');
      window.setTimeout(() => {
        window.location.href = paper.href;
      }, FALLBACK_TAKE_MS);
    });
  });

  // returning from an issue: its copy goes back onto the shelf
  window.addEventListener('pagereveal', (e) => {
    const vt = (e as Event & { viewTransition?: ViewTransition }).viewTransition;
    const from = session.read<string>(RETURN_KEY);
    session.write(RETURN_KEY, null);
    if (vt) {
      const quiet = () => {};
      vt.ready.catch(quiet);
      vt.finished.catch(quiet);
    }
    if (!vt || !from) return;
    const paper = document.querySelector<HTMLElement>(`a[data-take][data-issue="${CSS.escape(from)}"]`);
    if (!paper) return;
    paper.style.viewTransitionName = 'issue-sheet';
    const clear = () => (paper.style.viewTransitionName = '');
    vt.finished.then(clear, clear); // an aborted transition rejects: no noise
  });

  // back/forward cache: put the paper back on the shelf
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.body.classList.remove('is-taking');
    document.querySelectorAll('.is-taken').forEach((el) => el.classList.remove('is-taken'));
    papers.forEach((p) => (p.style.viewTransitionName = ''));
  });

  initDrawer();
}

/** Inside an issue: remember it (as a mark) and fold back to the library. */
export function initIssueSide(): void {
  const issue = document.body.dataset.issue;
  if (!issue) return;
  local.write(LAST_READ_KEY, issue);

  document.querySelectorAll<HTMLAnchorElement>('[data-to-library]').forEach((a) =>
    a.addEventListener('click', () => {
      session.write(ARRIVE_KEY, null);
      if (supportsCrossDocumentVT() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        session.write(RETURN_KEY, issue);
        document.querySelector<HTMLElement>('.site-shell')?.style.setProperty('view-transition-name', 'issue-sheet');
      }
    }),
  );
}

/* محفوظات هيئة التحرير: open the drawer, move between folders (tabs) */
function initDrawer(): void {
  const opener = document.querySelector<HTMLButtonElement>('[data-drawer-open]');
  const dialog = document.getElementById('archiveDrawer') as HTMLDialogElement | null;
  if (!opener || !dialog) return;

  opener.addEventListener('click', () => {
    opener.classList.add('is-open');
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
  dialog.addEventListener('close', () => {
    opener.classList.remove('is-open');
    document.body.style.overflow = '';
  });

  const tabs = [...dialog.querySelectorAll<HTMLButtonElement>('[data-folder-tab]')];
  const select = (tab: HTMLButtonElement, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      // RTL tab list: ArrowLeft moves forward, ArrowRight back
      const step = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (step) {
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        select(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true);
      }
    });
  });
}
