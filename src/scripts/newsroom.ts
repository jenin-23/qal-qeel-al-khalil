/* ------------------------------------------------------------------ *
 * Newsroom proof: small things to discover, none of which reveals
 * anything that the issue's data does not explicitly provide.
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

  // the notice's reference opens the envelope (without JS: it scrolls to it)
  document.querySelectorAll<HTMLAnchorElement>('[data-open-envelope]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const envelope = document.getElementById('submission-envelope') as HTMLDetailsElement | null;
      if (!envelope) return;
      e.preventDefault();
      envelope.open = true;
      envelope.scrollIntoView({ behavior: 'smooth', block: 'center' });
      envelope.querySelector('summary')?.focus({ preventScroll: true });
    });
  });

  // redactions with an explicit reveal/response from the data
  document.querySelectorAll<HTMLButtonElement>('[data-redaction]').forEach((r) => {
    r.addEventListener('click', () => r.setAttribute('aria-expanded', String(r.getAttribute('aria-expanded') !== 'true')));
  });
}
