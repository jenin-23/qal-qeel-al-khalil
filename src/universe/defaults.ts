/* ------------------------------------------------------------------ *
 * Technical defaults for issues that do not override them.
 * (Editorial text is never defaulted: each issue writes its own.)
 * ------------------------------------------------------------------ */
import type { DelayRange } from '../lib/types';

export const popupDefaults = {
  /** First popup of a browsing session: 2-4 minutes in. */
  firstDelay: [120, 240] as DelayRange,
  /** Between popups: 2-4 minutes. */
  repeatDelay: [120, 240] as DelayRange,
  /** Never right after a navigation, even if one is overdue. */
  minAfterNavigation: 45,
};

/** Reading speed of the ticker, in CSS pixels per second. */
export const TICKER_PX_PER_SECOND = 40;
