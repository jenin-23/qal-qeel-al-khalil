import type { IssueData } from './data';
import { openDialog } from './modal';

/* Links marked [data-coming] open the issue's "coming soon" modal. */
export function initComingSoon(data: IssueData): void {
  const dialog = document.getElementById('comingModal') as HTMLDialogElement | null;
  const title = document.getElementById('comingTitle');
  const text = document.getElementById('comingText');
  if (!dialog || !title || !text) return;

  document.querySelectorAll<HTMLElement>('[data-coming]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      title.textContent = trigger.getAttribute('data-title') || data.ui.coming.title;
      text.textContent = trigger.getAttribute('data-text') || data.ui.coming.triggerText;
      openDialog(dialog);
    });
  });
}
