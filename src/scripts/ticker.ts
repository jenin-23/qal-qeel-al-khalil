import { TICKER_PX_PER_SECOND } from '../universe/defaults';

/* Constant reading speed: loop duration = width of one line set / speed. */
export function initTickers(): void {
  const tracks = document.querySelectorAll<HTMLElement>('.ticker-track');
  if (!tracks.length) return;

  const measure = () =>
    tracks.forEach((track) => {
      const group = track.querySelector<HTMLElement>('.ticker-group');
      if (!group) return;
      const width = group.getBoundingClientRect().width;
      if (width > 0) track.style.setProperty('--ticker-duration', `${(width / TICKER_PX_PER_SECOND).toFixed(1)}s`);
    });

  measure();
  document.fonts?.ready.then(measure);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(measure);
    tracks.forEach((t) => ro.observe(t.querySelector('.ticker-group') ?? t));
  }
}
