/* ------------------------------------------------------------------ *
 * Interface wording on newspaper-level pages (library, من نحن,
 * تواصل معنا, archive): the paper's own voice, as first printed in
 * Issue 001. Issue 001 keeps its own pinned copy in its issue.ts.
 * ------------------------------------------------------------------ */
import type { IssueUI } from '../lib/types';

export const paperUi: IssueUI = {
  closeLabel: "إغلاق",
  coming: {
    title: "العدد القادم قادم",
    text: "هذا الباب محفوظ حالياً لحين صدور العدد الأول.",
    triggerText: "يزم محنا حكينا قادم، مش حتلاقي اشي.",
  },
  toastInitial: "تم نسخ المقال. استخدمه بحذر.",
  copyArticle: {
    label: "انسخ المقال",
    done: "تم النسخ",
    toast: "تم نسخ المقال. استخدمه بحذر.",
    error: "تعذّر النسخ حالياً.",
  },
  copyPhone: {
    done: "تم نسخ الرقم",
    toast: "تم نسخ الرقم.",
    error: "تعذّر نسخ الرقم حالياً.",
  },
  reactionToast: "تم تسجيل انطباعك التحريري.",
  contactToast: "تم استلام الرسالة نظرياً. شكراً على الثقة.",
  // Added in the multi-issue refactor (approved interface labels):
  popupAd: { dismiss: 'تجاهل الإعلان', ariaLabel: 'إعلان' },
  inlineAdLabel: 'إعلان',
};
