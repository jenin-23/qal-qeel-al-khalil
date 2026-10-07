/* ------------------------------------------------------------------ *
 * Popup image ads.
 *
 * - Pool and timing come from the current issue only (ads.popup).
 * - One timer per browsing session (sessionStorage), so navigating
 *   between pages neither resets it nor triggers an immediate popup.
 * - Never the same ad twice in a row; never over another dialog;
 *   waits while the tab is hidden.
 * - Close with ×, «تجاهل الإعلان», Escape, or a click outside.
 * ------------------------------------------------------------------ */
import type { IssueData } from './data';
import { safeStorage } from './data';
import { anyDialogOpen, openDialog } from './modal';
import { POPUP_SESSION_KEY } from './storage-keys';

interface PopupState {
  /** epoch ms when the next popup is due */
  nextDueAt?: number;
  /** last ad shown, per issue */
  last?: Record<string, string>;
}

const session = safeStorage('session');
const RETRY_WHEN_BUSY_MS = 15_000;

const randomBetween = ([min, max]: [number, number]) => (min + Math.random() * (max - min)) * 1000;

export function initPopupAds(data: IssueData): void {
  const cfg = data.popup;
  const dialog = document.getElementById('popupAd') as HTMLDialogElement | null;
  const slot = dialog?.querySelector<HTMLElement>('.popup-ad-slot');
  if (!cfg.enabled || !cfg.ids.length || !dialog || !slot) return;

  const loadedAt = Date.now();
  const state = session.read<PopupState>(POPUP_SESSION_KEY) ?? {};
  if (!state.nextDueAt) {
    state.nextDueAt = loadedAt + randomBetween(cfg.firstDelay);
    session.write(POPUP_SESSION_KEY, state);
  }

  let timer: number | undefined;
  const schedule = (at: number) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(attempt, Math.max(0, at - Date.now()));
  };

  function pick(): string {
    const last = state.last?.[data.issue ?? ''];
    const choices = cfg.ids.length > 1 ? cfg.ids.filter((id) => id !== last) : cfg.ids;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function attempt() {
    if (document.hidden) {
      document.addEventListener('visibilitychange', () => schedule(Date.now() + 5_000), { once: true });
      return;
    }
    if (anyDialogOpen()) {
      schedule(Date.now() + RETRY_WHEN_BUSY_MS);
      return;
    }

    const id = pick();
    const template = document.querySelector<HTMLTemplateElement>(`template[data-popup-ad="${CSS.escape(id)}"]`);
    if (!template) return;
    slot!.replaceChildren(template.content.cloneNode(true));

    state.last = { ...state.last, [data.issue ?? '']: id };
    state.nextDueAt = Date.now() + randomBetween(cfg.repeatDelay);
    session.write(POPUP_SESSION_KEY, state);
    openDialog(dialog!);
  }

  dialog.addEventListener('dialog:closed', () => {
    slot.replaceChildren();
    schedule(state.nextDueAt!);
  });

  schedule(Math.max(state.nextDueAt, loadedAt + cfg.minAfterNavigation * 1000));
}
