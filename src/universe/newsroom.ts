/* ------------------------------------------------------------------ *
 * The newsroom: wording for issues that are still being made
 * (status 'editing'). These lines describe the PRODUCTION of an issue,
 * never its contents. Shared by every future issue in editing.
 * ------------------------------------------------------------------ */
export const newsroom = {
  stamp: 'قيد التحرير',
  lead: 'تعمل هيئة التحرير حالياً على هذا العدد.',
  /** the production board */
  status: [
    'مواد وصلت إلى هيئة التحرير',
    'مواد ما زالت قيد المراجعة',
    'مساحات إعلانية قيد الحجز',
    'ملفات لم يُحسم أمر نشرها بعد',
  ],
  notForPrint: 'النسخة الحالية غير صالحة للطباعة… ولا للإنكار.',
  release: 'سيصدر عند اكتمال التحقيقات، أو نفاد صبر هيئة التحرير.',
  /** editorial placeholders for empty spaces (use sparingly) */
  placeholders: {
    awaiting: '[بانتظار المادة]',
    noReply: '[لم يصل الرد حتى ساعة الطباعة]',
    reserved: '[مساحة محفوظة بقرار من هيئة التحرير]',
    underReview: '████████ قيد المراجعة ████████',
    imageSearch: 'الصورة قيد البحث',
    headlineDisputed: 'العنوان النهائي موضع خلاف',
  },
  /** revealed when an internal note is opened; followed by nothing useful */
  internalNote: 'ملاحظة داخلية — ليس للنشر',
  /** the contribution notice on an issue in editing (approved wording) */
  submissionNotice: {
    label: 'تنويه من هيئة التحرير',
    vacancy: 'لا تزال بعض المساحات شاغرة لأسباب بعضها تحريري وبعضها يعود إلى عدم إرسالكم شيئاً.',
    heading: 'لديك ما يستحق النشر؟',
    text: 'أرسل ما لديك إلى هيئة التحرير: خبر، صورة، موقف، مقال، إعلان، أو أي مادة ترى أن من الأفضل توثيقها قبل أن ينكرها أصحابها.',
    button: 'أرسل إلى هيئة التحرير',
    channel: 'واتساب — باب المساهمات مفتوح',
  },
  /** labels for real production counts (shown only when provided) */
  progressLabels: {
    articles: 'المواد',
    images: 'الصور',
    ads: 'الإعلانات',
    sections: 'الأقسام',
  },
};
