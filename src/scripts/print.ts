/* نسخة للطباعة: the print edition's own control sends it to the printer. */
export function initPrint(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-print-now]').forEach((btn) =>
    btn.addEventListener('click', () => window.print()),
  );
}
