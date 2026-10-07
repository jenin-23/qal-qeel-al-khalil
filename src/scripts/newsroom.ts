/* ------------------------------------------------------------------ *
 * Newsroom proof: small things to discover, none of which reveals
 * anything (there is nothing to reveal yet).
 * ------------------------------------------------------------------ */
export function initNewsroom(): void {
  // an empty photo frame takes an editorial stamp when pressed
  document.querySelectorAll<HTMLButtonElement>('[data-proof-frame]').forEach((frame) => {
    frame.addEventListener('click', () => {
      frame.classList.remove('is-stamped');
      void frame.offsetWidth; // replay
      frame.classList.add('is-stamped');
    });
  });

  // the pinned internal note unfolds… to say nothing useful
  document.querySelectorAll<HTMLButtonElement>('[data-proof-note]').forEach((note) => {
    note.addEventListener('click', () => {
      note.setAttribute('aria-expanded', String(note.getAttribute('aria-expanded') !== 'true'));
    });
  });
}
