/* ------------------------------------------------------------------ *
 * Easter eggs: small rewards for curiosity. Declarative, so they never
 * scatter listeners around the code (runner: src/scripts/eggs.ts).
 *
 * Rules: never block reading, never carry navigation, deadpan only,
 * approved wording only. Library-level eggs run on newspaper-level
 * pages; an issue lists the ids it enables in Issue.eggs.
 * ------------------------------------------------------------------ */
export interface EggDef {
  id: string;
  /** what the reader does */
  trigger: { type: 'clicks'; selector: string; count: number; withinMs: number };
  /** what the paper does */
  effect: { type: 'notice'; lines: string[]; durationMs: number };
  /** run on newspaper-level pages (library, من نحن, …) */
  library?: boolean;
  /** run on every issue page unless the issue sets its own list */
  issues?: boolean;
}

export const eggs: EggDef[] = [
  {
    id: 'masthead-attention',
    trigger: { type: 'clicks', selector: '.brand, .library-brand, .library-title', count: 5, withinMs: 4000 },
    effect: {
      type: 'notice',
      lines: ['لوحظ اهتمام غير اعتيادي بالجريدة.', 'تم تسجيل الملاحظة.'],
      durationMs: 4200,
    },
    library: true,
    issues: true,
  },
];
