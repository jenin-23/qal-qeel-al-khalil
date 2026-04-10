document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('comingModal');
  const modalTitle = document.getElementById('comingTitle');
  const modalText = document.getElementById('comingText');
  const closeBtn = document.getElementById('closeModal');
  const triggers = document.querySelectorAll('[data-coming]');
  const toast = document.getElementById('copyToast');

  const defaultTitle = 'العدد القادم قادم';
  const defaultText = 'هذا الباب محفوظ حالياً لحين صدور العدد الأول.';

  function openModal(title = defaultTitle, text = defaultText) {
    if (!modal || !modalTitle || !modalText) return;
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

  const toggleButtons = document.querySelectorAll('.story-toggle-btn');

  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const article = button.closest('.story-card');
      const body = article.querySelector('.story-body');
      if (!body) return;

      const collapsed = body.classList.contains('is-collapsed');
      body.classList.toggle('is-collapsed');
      button.classList.toggle('is-open');

      if (!collapsed) {
        article.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const copyButtons = document.querySelectorAll('.copy-btn');

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

  copyButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const article = button.closest('.story-card');
      if (!article) return;

      const title = article.querySelector('.story-title')?.innerText?.trim() || '';
      const meta = article.querySelector('.story-meta')?.innerText?.trim() || '';
      const body = article.querySelector('.story-body')?.innerText?.trim() || '';

      const fullText = `${title}\n${meta}\n\n${body}`;

      try {
        await navigator.clipboard.writeText(fullText);
        button.classList.add('copied');
        button.textContent = 'تم النسخ';
        showToast('تم نسخ المقال. استخدمه بحذر.');
        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = 'انسخ المقال';
        }, 1800);
      } catch (error) {
        showToast('تعذّر النسخ حالياً.');
      }
    });
  });
});