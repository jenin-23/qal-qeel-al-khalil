/* قلم هيئة التحرير: the editor's red pencil shows (or hides) the
   proofreading layer. It reveals the editing process, never content.
   Its ruqʿa hand is fetched only when the pencil is first taken up, so
   it never delays the page (or its View Transition). */
const RUQAA = 'https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&display=swap';

function loadPencilHand(): void {
  if (document.querySelector('link[data-pencil-font]')) return;
  const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: RUQAA });
  link.dataset.pencilFont = '';
  document.head.append(link);
}

export function initPencil(): void {
  const pencil = document.querySelector<HTMLButtonElement>('[data-pencil]');
  const proof = document.querySelector<HTMLElement>('.site-shell.is-proof');
  if (!pencil || !proof) return;
  pencil.addEventListener('pointerenter', loadPencilHand, { once: true });
  pencil.addEventListener('focus', loadPencilHand, { once: true });
  pencil.addEventListener('click', () => {
    loadPencilHand();
    const on = pencil.getAttribute('aria-pressed') !== 'true';
    pencil.setAttribute('aria-pressed', String(on));
    proof.classList.toggle('pencil-on', on);
  });
}
