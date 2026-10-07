/* Month names as the paper prints them (Issue 001 already says «أبريل»). */
export const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** "ديسمبر 2026" */
export const monthLabel = (month: number, year: number) => `${MONTHS[month - 1]} ${year}`;
