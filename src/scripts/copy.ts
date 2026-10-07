import type { IssueData } from './data';
import { showToast } from './toast';

function flash(button: HTMLElement, text: string, restore: string, ms: number): void {
  button.classList.add('copied');
  button.textContent = text;
  window.setTimeout(() => {
    button.classList.remove('copied');
    button.textContent = restore;
  }, ms);
}

/* "انسخ المقال" and the ad phone-number buttons. */
export function initCopy(data: IssueData): void {
  const { copyArticle, copyPhone } = data.ui;

  document.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const article = button.closest('.story-card');
      if (!article) return;
      const read = (sel: string) => article.querySelector<HTMLElement>(sel)?.innerText?.trim() || '';
      const fullText = `${read('.story-title')}\n${read('.story-meta')}\n\n${read('.story-body')}`;
      try {
        await navigator.clipboard.writeText(fullText);
        flash(button, copyArticle.done, button.textContent || copyArticle.label, 1800);
        showToast(copyArticle.toast);
      } catch {
        showToast(copyArticle.error);
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.copy-phone-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const phone = button.dataset.phone || button.textContent?.trim() || '';
      try {
        await navigator.clipboard.writeText(phone);
        flash(button, copyPhone.done, button.textContent || '', 1600);
        showToast(copyPhone.toast);
      } catch {
        showToast(copyPhone.error);
      }
    });
  });
}
