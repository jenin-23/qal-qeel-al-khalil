import type { EntertainmentData } from './data';
import { showToast } from './toast';

/* Majority answer wins; result texts come from the issue. */
export function initQuiz(data: EntertainmentData): void {
  const form = document.getElementById('quizForm') as HTMLFormElement | null;
  const result = document.getElementById('quizResult');
  if (!form || !result || !data.quiz) return;
  const quiz = data.quiz;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const counts: Record<string, number> = {};
    for (const [, value] of new FormData(form).entries()) {
      const key = String(value);
      if (key in quiz.results && key !== 'fallback') counts[key] = (counts[key] ?? 0) + 1;
    }

    const answered = Object.values(counts).reduce((sum, n) => sum + n, 0);
    if (answered === 0) {
      showToast(quiz.emptyToast);
      return;
    }

    // ties resolve to the earliest option, as in Issue 001
    const order = Object.keys(quiz.results).filter((k) => k !== 'fallback');
    const dominant = order.reduce((best, k) => ((counts[k] ?? 0) > (counts[best] ?? 0) ? k : best), order[0]);
    result.textContent = quiz.results[dominant] ?? quiz.results.fallback;
    result.classList.add('show-result');
  });
}
