let timer: number | undefined;

export function showToast(message: string): void {
  const toast = document.getElementById('copyToast');
  if (!toast || !message) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}
