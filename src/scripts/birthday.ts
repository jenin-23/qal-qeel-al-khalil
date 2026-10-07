/* ------------------------------------------------------------------ *
 * Birthday + horoscope engine (issue-agnostic).
 *
 * - The reader's birthday is stored once in localStorage and shared by
 *   every page and every issue.
 * - Each issue supplies its own month (birthday.month), its 12
 *   predictions and its easter-egg modal; nothing here knows a month.
 * - The month greeting shows when the birthday is entered, and at most
 *   once per browsing session per issue after that.
 * ------------------------------------------------------------------ */
import type { EntertainmentData } from './data';
import { safeStorage } from './data';
import { closeDialog, openDialog, setLocked } from './modal';
import { showToast } from './toast';
import { getZodiac, isValidDate, type Birthday } from './zodiac';
import { BIRTHDAY_STORAGE_KEY, GREETED_SESSION_KEY } from './storage-keys';

const local = safeStorage('local');
const session = safeStorage('session');

export function loadBirthday(): Birthday | null {
  const b = local.read<Birthday>(BIRTHDAY_STORAGE_KEY);
  return b && isValidDate(b.day, b.month, b.year) ? b : null;
}

export function initBirthday(data: EntertainmentData): void {
  const gate = document.getElementById('birthdayModal') as HTMLDialogElement | null;
  const form = document.getElementById('birthdayForm') as HTMLFormElement | null;
  if (!gate || !form || !data.birthday) return;
  const config = data.birthday;

  const signEl = document.getElementById('zodiacName');
  const textEl = document.getElementById('zodiacText');
  const changeWrap = document.querySelector<HTMLElement>('[data-birthday-change-wrap]');
  const changeBtn = document.querySelector<HTMLButtonElement>('[data-birthday-change]');
  const monthModal = document.getElementById('birthdayMonthModal') as HTMLDialogElement | null;
  const field = (id: string) => document.getElementById(id) as HTMLInputElement | null;

  function showHoroscope(b: Birthday) {
    const sign = getZodiac(b.day, b.month);
    const prediction = data.predictions?.[sign];
    if (signEl && textEl && prediction) {
      signEl.textContent = sign;
      textEl.textContent = prediction;
    }
    if (changeWrap) changeWrap.hidden = false;
  }

  function greet(b: Birthday, justEntered: boolean) {
    if (b.month !== config.month) return;
    const greeted = session.read<Record<string, boolean>>(GREETED_SESSION_KEY) ?? {};
    if (!justEntered && greeted[data.issue]) return;
    session.write(GREETED_SESSION_KEY, { ...greeted, [data.issue]: true });
    if (monthModal) openDialog(monthModal);
    else if (config.fallbackToast) showToast(config.fallbackToast);
  }

  const stored = loadBirthday();
  if (stored) {
    setLocked(gate, false);
    closeDialog(gate); // in case storage changed after the inline check
    showHoroscope(stored);
    greet(stored, false);
  } else {
    setLocked(gate, true);
    openDialog(gate); // no-op if the inline script already opened it
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const b: Birthday = {
      day: Number(field('birthDay')?.value),
      month: Number(field('birthMonth')?.value),
      year: Number(field('birthYear')?.value),
    };
    if (!isValidDate(b.day, b.month, b.year)) {
      showToast(config.invalidToast);
      return;
    }
    local.write(BIRTHDAY_STORAGE_KEY, b);
    showHoroscope(b);
    setLocked(gate, false);
    closeDialog(gate);
    greet(b, true);
  });

  // «تغيير تاريخ الميلاد»: reopen the gate, prefilled, dismissible.
  changeBtn?.addEventListener('click', () => {
    const b = loadBirthday();
    if (b) {
      field('birthDay')!.value = String(b.day);
      field('birthMonth')!.value = String(b.month);
      field('birthYear')!.value = String(b.year);
    }
    setLocked(gate, !b);
    openDialog(gate);
  });
}
