import type { IssueMeta, IssueUI } from '../../lib/types';

export const meta: IssueMeta = {
  number: "001",
  status: 'published',
  year: 2026,
  month: 4,
  releaseDate: '2026-04-01',
  releaseDateLabel: "١-٤-٢٠٢٦",
  city: "عمّان – الأردن",
  priceLine: "السعر: حسب",
  copyright: "© 2026 قال قيل ال خليل",
  archive: {
    title: "العدد الأول",
    description: "العدد التأسيسي الذي بدأ منه كل شيء، أو على الأقل بدأ منه التوثيق بصيغته الرسمية.",
    statusLabel: "مفتوح",
    statusTone: 'published',
  },
  // the archived copy: older paper, a fold, a few copies stacked
  appearance: { paperAge: 0.55, printOpacity: 0.93, inkSpread: 0.6, registrationOffset: 0.6, creaseLevel: 0.7, sheets: 4 },
};

export const ui: IssueUI = {
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
