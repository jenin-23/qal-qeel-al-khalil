/* An issue's physical character as CSS custom properties (deterministic). */
import type { IssueAppearance } from './types';

export const DEFAULT_APPEARANCE: IssueAppearance = {
  paperAge: 0.3,
  printOpacity: 0.95,
  inkSpread: 0.4,
  registrationOffset: 0.4,
  creaseLevel: 0.5,
  sheets: 3,
};

export function appearanceVars(a: IssueAppearance = DEFAULT_APPEARANCE): string {
  return [
    `--paper-age:${a.paperAge}`,
    `--print-opacity:${a.printOpacity}`,
    `--ink-spread:${a.inkSpread}`,
    `--reg-offset:${a.registrationOffset}px`,
    `--crease:${a.creaseLevel}`,
  ].join(';');
}

/** Sheets visible under a copy on the shelf: an offset stack, 1-2px apart. */
export function stackShadow(a: IssueAppearance = DEFAULT_APPEARANCE): string {
  const layers: string[] = [];
  const n = Math.max(1, Math.min(6, Math.round(a.sheets)));
  for (let i = 1; i < n; i++) {
    const dx = -(i * 2 + (i % 2)); // 2-3px apart, never perfectly even
    const dy = i * 2;
    const shade = i % 2 ? '#e3d8bc' : '#d8ccad';
    layers.push(`${dx}px ${dy}px 0 -1px ${shade}`, `${dx}px ${dy}px 0 0 rgba(33, 29, 24, ${0.3 - i * 0.03})`);
  }
  layers.push('inset 0 0 26px rgba(150, 118, 62, .22)');
  return layers.join(', ');
}
