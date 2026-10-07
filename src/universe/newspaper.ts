/* ------------------------------------------------------------------ *
 * The newspaper itself: what stays the same from issue to issue.
 *
 * Every issue renders through this identity. If any of it ever changes,
 * `npm run verify:001` will flag Issue 001; pin the old value on that
 * issue (see Issue.identity notes in README) to keep the archive frozen.
 * ------------------------------------------------------------------ */
import type { PageKey } from '../lib/types';

export const newspaper = {
  name: 'قال قيل ال خليل',
  tagline: 'كل ما قيل… وما كان يجب أن يُقال.',
  masthead: {
    issueNumberLabel: 'رقم العدد',
    releaseDateLabel: 'تاريخ الإصدار',
  },
  /**
   * Main navigation. An item links to the issue's page when that issue
   * publishes it; `comingSoon` items without a page open the
   * "coming soon" modal instead, so each issue's nav stays truthful.
   */
  nav: [
    { key: 'home', label: 'الرئيسية' },
    { key: 'news', label: 'الأخبار' },
    { key: 'columns', label: 'الأعمدة' },
    { key: 'entertainment', label: 'المنوعات' },
    { key: 'investigations', label: 'التحقيقات', comingSoon: true },
    { key: 'archive', label: 'الأرشيف' },
  ] as { key: PageKey | 'archive'; label: string; comingSoon?: boolean }[],
  /**
   * Navigation at the newspaper level (library, من نحن, تواصل معنا,
   * archive). Issue sections appear only once an issue is opened.
   */
  paperNav: [
    { key: 'library', label: 'المكتبة' },
    { key: 'archive', label: 'الأرشيف' },
    { key: 'about', label: 'من نحن' },
    { key: 'contact', label: 'تواصل معنا' },
  ] as { key: 'library' | 'archive' | 'about' | 'contact'; label: string }[],
  city: 'عمّان – الأردن',
  /** تواصل معنا: the contact form opens a WhatsApp chat with هيئة التحرير */
  contact: {
    whatsapp: '962791432787',
    greeting: 'مرحباً هيئة تحرير قال قيل،',
  },
  footerLinks: [
    { key: 'about', label: 'من نحن' },
    { key: 'contact', label: 'تواصل معنا' },
    { key: 'archive', label: 'الأرشيف' },
  ] as { key: PageKey | 'archive'; label: string }[],
  archive: {
    enterIssueLabel: 'ادخل العدد',
  },
  features: {
    /**
     * Edition switcher (previous / next / latest issue + archive).
     * The data is computed for every page (see lib/issues.ts → edition);
     * the visual component exists but stays off until it is designed.
     */
    issueSwitcher: false,
  },
};
