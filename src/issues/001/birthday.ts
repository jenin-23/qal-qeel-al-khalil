import type { BirthdayDef } from '../../lib/types';

export const birthday: BirthdayDef = {
  month: 4,
  gate: {
    title: "قبل الدخول",
    text: "أدخل تاريخ ميلادك لنقوم بتفسير حياتك بثقة غير مبررة.",
    labels: [
  "اليوم",
  "الشهر",
  "السنة"
],
    submit: "اعتمد البرج",
  },
  monthModal: {
    title: "كل عام وأنت بخير",
    html: "واضح أنك من مواليد أبريل، وهذا يضعك مباشرة ضمن الكتلة البشرية التي قررت هذا الشهر احتلال السجل العائلي بكثافة غير مريحة. نهنئك على ميلادك، وعلى انضمامك الرسمي إلى الموسم الذي تتكرر فيه المعايدات أكثر من التفسيرات المنطقية.",
    buttonMore: "ادخل واحتفل داخلياً",
    buttonLess: "ادخل واحتفل داخلياً"
  },
  fallbackToast: "كل عام وأنت بخير. أبريل مزدحم بما يكفي هذا العام.",
  invalidToast: "أدخل تاريخاً معقولاً ثم تابع.",
  // Added in the multi-issue refactor (approved interface label):
  changeLabel: 'تغيير تاريخ الميلاد',
};
