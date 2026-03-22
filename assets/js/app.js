document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('comingModal');
  const modalTitle = document.getElementById('comingTitle');
  const modalText = document.getElementById('comingText');
  const closeBtn = document.getElementById('closeModal');
  const triggers = document.querySelectorAll('[data-coming]');

  const defaultTitle = 'العدد القادم قادم';
  const defaultText = 'هذا الباب محفوظ حالياً لحين صدور العدد الأول.';

  function openModal(title = defaultTitle, text = defaultText) {
    if (!modal) return;
    modalTitle.textContent = title;
    modalText.textContent = text;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  triggers.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const title = item.getAttribute('data-title') || defaultTitle;
      const text = item.getAttribute('data-text') || defaultText;
      openModal(title, text);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
});