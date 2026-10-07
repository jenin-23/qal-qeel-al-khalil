/* Pure date → sign mapping. The words of each prediction live in issues. */
import type { ZodiacSign } from '../lib/types';

export interface Birthday {
  day: number;
  month: number;
  year: number;
}

export function isValidDate(day: number, month: number, year: number): boolean {
  if (!day || !month || !year) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

export function getZodiac(day: number, month: number): ZodiacSign {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'الحمل';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'الثور';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'الجوزاء';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'السرطان';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'الأسد';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'العذراء';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'الميزان';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'العقرب';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'القوس';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'الجدي';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'الدلو';
  return 'الحوت';
}
