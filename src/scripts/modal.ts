/* ------------------------------------------------------------------ *
 * Modal system on native <dialog>: focus is trapped inside, the page
 * behind is inert, Escape closes, focus returns to the opener.
 *   data-locked  → cannot be dismissed (Escape / backdrop): birthday gate
 *   [data-close] → any element that closes its dialog
 * ------------------------------------------------------------------ */

const openers = new WeakMap<HTMLDialogElement, Element | null>();

export function anyDialogOpen(): boolean {
  return document.querySelector('dialog[open]') !== null;
}

function syncScrollLock(): void {
  document.body.style.overflow = anyDialogOpen() ? 'hidden' : '';
}

export function openDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) return;
  openers.set(dialog, document.activeElement);
  dialog.showModal();
  syncScrollLock();
}

export function closeDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) dialog.close();
}

export function setLocked(dialog: HTMLDialogElement, locked: boolean): void {
  dialog.toggleAttribute('data-locked', locked);
  // closedby="none": the browser itself refuses Escape (even a repeated one)
  dialog.setAttribute('closedby', locked ? 'none' : 'any');
  dialog.querySelectorAll<HTMLElement>('.modal-close[data-close]').forEach((btn) => {
    btn.hidden = locked;
  });
}

function wire(dialog: HTMLDialogElement): void {
  if (dialog.dataset.wired) return;
  dialog.dataset.wired = '1';

  // Escape
  dialog.addEventListener('cancel', (e) => {
    if (dialog.hasAttribute('data-locked')) e.preventDefault();
  });

  dialog.addEventListener('click', (e) => {
    const target = e.target as Element;
    // click on the dim overlay (outside the card) closes, like the original modal
    if (target === dialog) {
      if (!dialog.hasAttribute('data-locked')) closeDialog(dialog);
      return;
    }
    const closer = target.closest('[data-close]');
    if (closer && dialog.contains(closer)) closeDialog(dialog);
  });

  dialog.addEventListener('close', () => {
    // Browsers without closedby may force-close on a repeated Escape;
    // a locked gate reopens.
    if (dialog.hasAttribute('data-locked')) {
      dialog.showModal();
      return;
    }
    syncScrollLock();
    const opener = openers.get(dialog);
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    dialog.dispatchEvent(new CustomEvent('dialog:closed'));
  });
}

export function initModals(): void {
  document.querySelectorAll<HTMLDialogElement>('dialog.modal').forEach(wire);
  syncScrollLock();
}
