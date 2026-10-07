import type { EntertainmentData } from './data';

export function initCoin(data: EntertainmentData): void {
  const button = document.getElementById('flipCoinBtn');
  const coin = document.getElementById('coin');
  const result = document.getElementById('coinResult');
  if (!button || !coin || !result || !data.coin) return;
  const texts = data.coin;

  button.addEventListener('click', () => {
    const yes = Math.random() > 0.5;
    coin.classList.toggle('flipped', !yes);
    result.textContent = yes ? texts.yes : texts.no;
  });
}
