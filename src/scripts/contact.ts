import type { IssueData } from './data';
import { showToast } from './toast';

/* ------------------------------------------------------------------ *
 * تواصل معنا: the letter goes to هيئة التحرير on WhatsApp.
 * The message is composed from the form itself (its own labels and
 * the reader's words), then a WhatsApp chat opens in a new tab with it
 * pre-filled; the reader sends it from there. The paper's original
 * acknowledgement still appears.
 * ------------------------------------------------------------------ */
export function composeContactMessage(form: HTMLFormElement, greeting: string): string {
  const lines = [greeting];
  form.querySelectorAll<HTMLElement>('.form-field').forEach((field) => {
    const label = field.querySelector('label')?.textContent?.trim() ?? '';
    const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
    const value = control?.value.trim() ?? '';
    if (!value) return;
    lines.push(control instanceof HTMLTextAreaElement ? `\n${value}` : `${label}: ${value}`);
  });
  return lines.join('\n');
}

export function initContactForm(data: IssueData): void {
  const form = document.querySelector<HTMLFormElement>('.contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const number = form.dataset.whatsapp;
    if (number) {
      const url = `https://wa.me/${number}?text=${encodeURIComponent(composeContactMessage(form, form.dataset.greeting ?? ''))}`;
      const opened = window.open(url, '_blank');
      if (opened) {
        opened.opener = null; // the new tab gets no handle back to this page
      } else {
        // a blocked new tab: fall back to an ordinary external link
        const a = Object.assign(document.createElement('a'), { href: url, target: '_blank', rel: 'noopener noreferrer' });
        document.body.append(a);
        a.click();
        a.remove();
      }
    }
    showToast(data.ui.contactToast);
    form.reset();
  });
}
