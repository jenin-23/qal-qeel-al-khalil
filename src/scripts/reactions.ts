import type { IssueData } from './data';
import { showToast } from './toast';

/* "شعورك تجاه المقال؟": one choice per article. */
export function initReactions(data: IssueData): void {
  document.querySelectorAll<HTMLButtonElement>('.reaction-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.closest('.reaction-options');
      if (!group) return;
      group.querySelectorAll<HTMLButtonElement>('.reaction-btn').forEach((btn) => {
        btn.classList.remove('is-selected');
        btn.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
      showToast(data.ui.reactionToast);
    });
  });
}
