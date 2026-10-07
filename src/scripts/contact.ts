import type { IssueData } from './data';
import { showToast } from './toast';

/* The contact form sends nothing; it acknowledges and resets. */
export function initContactForm(data: IssueData): void {
  const form = document.querySelector<HTMLFormElement>('.contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast(data.ui.contactToast);
    form.reset();
  });
}
