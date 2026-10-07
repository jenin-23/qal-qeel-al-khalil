/* ------------------------------------------------------------------ *
 * Easter-egg runner. Eggs are declared in src/universe/eggs.ts; this
 * module only wires triggers to effects. Never blocks reading, never
 * navigates, never makes a sound.
 * ------------------------------------------------------------------ */
import { eggs, type EggDef } from '../universe/eggs';

const LIBRARY_PAGES = new Set(['library', 'about', 'contact', 'archive']);

function activeEggs(): EggDef[] {
  const page = document.body.dataset.page ?? '';
  const listed = document.body.dataset.eggs?.split(' ').filter(Boolean);
  if (LIBRARY_PAGES.has(page)) return eggs.filter((e) => e.library);
  return eggs.filter((e) => (listed ? listed.includes(e.id) : e.issues));
}

function showNotice(lines: string[], durationMs: number): void {
  document.querySelector('.egg-notice')?.remove();
  const notice = document.createElement('div');
  notice.className = 'egg-notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  for (const line of lines) {
    const p = document.createElement('p');
    p.textContent = line;
    notice.append(p);
  }
  document.body.append(notice);
  requestAnimationFrame(() => notice.classList.add('is-shown'));
  window.setTimeout(() => {
    notice.classList.remove('is-shown');
    notice.addEventListener('transitionend', () => notice.remove(), { once: true });
    window.setTimeout(() => notice.remove(), 800); // reduced motion: no transition event
  }, durationMs);
}

export function initEggs(): void {
  for (const egg of activeEggs()) {
    if (egg.trigger.type !== 'clicks') continue;
    const { selector, count, withinMs } = egg.trigger;
    let clicks: number[] = [];
    document.addEventListener('click', (e) => {
      if (!(e.target as Element).closest?.(selector)) return;
      const now = Date.now();
      clicks = [...clicks.filter((t) => now - t < withinMs), now];
      if (clicks.length < count) return;
      clicks = [];
      if (egg.effect.type === 'notice') showNotice(egg.effect.lines, egg.effect.durationMs);
    });
  }
}
