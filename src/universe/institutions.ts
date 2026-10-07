/* ------------------------------------------------------------------ *
 * Recurring institutions and personalities of the newspaper universe.
 *
 * Issues reference these by key instead of copying names around:
 * the fatwa *text* belongs to an issue, the mufti belongs here.
 * ------------------------------------------------------------------ */

export const people = {
  bahbahani: { name: 'فضيلة الشيخ البحبحاني' },
} satisfies Record<string, { name: string }>;

export type PersonKey = keyof typeof people;

export const institutions = {
  /** The fatwa column and its resident mufti. */
  'fatwa-desk': {
    title: 'فتاوى قال قيل ال خليل',
    resident: 'bahbahani' as PersonKey,
  },
} satisfies Record<string, { title: string; resident?: PersonKey }>;

export type InstitutionKey = keyof typeof institutions;

export function institution(key: string) {
  const found = (institutions as Record<string, { title: string; resident?: PersonKey }>)[key];
  if (!found) throw new Error(`Unknown institution "${key}" (see src/universe/institutions.ts)`);
  return found;
}

export function person(key: string) {
  const found = (people as Record<string, { name: string }>)[key];
  if (!found) throw new Error(`Unknown person "${key}" (see src/universe/institutions.ts)`);
  return found;
}
