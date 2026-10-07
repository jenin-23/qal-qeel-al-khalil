/* Expand / collapse long articles. */
export function initArticleToggles(): void {
  document.querySelectorAll<HTMLButtonElement>('.story-toggle-btn[aria-controls]').forEach((button) => {
    const article = button.closest('.story-card');
    const body = article?.querySelector<HTMLElement>('.story-body');
    if (!article || !body || body.classList.contains('no-collapse')) return;

    button.addEventListener('click', () => {
      const wasCollapsed = body.classList.contains('is-collapsed');
      body.classList.toggle('is-collapsed');
      button.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(wasCollapsed));

      if (!wasCollapsed) article.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
