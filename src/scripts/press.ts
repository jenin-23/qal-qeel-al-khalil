/* ------------------------------------------------------------------ *
 * Press theme motion. Purely presentational: every effect is a class
 * toggled on existing elements; nothing here changes text.
 * All motion is disabled by CSS under prefers-reduced-motion.
 * ------------------------------------------------------------------ */

const root = document.documentElement;

// 1. The sheet settles onto the desk once fonts are ready (no flash of
//    unstyled Arabic during the motion).
const settle = () => root.classList.add('press-settled');
if (document.fonts?.status === 'loaded') settle();
else document.fonts?.ready.then(settle);
window.setTimeout(settle, 900); // never wait forever

// 2. Rules draw themselves; photographs are "placed" as they scroll in.
const watched = document.querySelectorAll<HTMLElement>(
  '.section-heading, .toc-card, .story-card, .story-image, .ad-flyer, .site-footer, .news-hero',
);
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  watched.forEach((el) => io.observe(el));
} else {
  watched.forEach((el) => el.classList.add('in-view'));
}

// 3. Article unfold: mark the moment of opening so CSS can play the fold.
document.querySelectorAll<HTMLButtonElement>('.story-toggle-btn[aria-controls]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const body = document.getElementById(btn.getAttribute('aria-controls') ?? '');
    if (!body || body.classList.contains('is-collapsed')) return; // only on open
    body.classList.remove('is-unfolding');
    void body.offsetWidth; // restart the animation
    body.classList.add('is-unfolding');
    window.setTimeout(() => body.classList.remove('is-unfolding'), 900);
  });
});

// 4. Stamps: the toast re-stamps on every message (not just the first).
//    showToast() always rewrites the text, so watching text is enough —
//    and watching our own class changes would loop forever.
const toast = document.getElementById('copyToast');
if (toast) {
  new MutationObserver(() => {
    toast.classList.remove('stamping');
    void toast.offsetWidth;
    toast.classList.add('stamping');
  }).observe(toast, { childList: true, characterData: true, subtree: true });
}
