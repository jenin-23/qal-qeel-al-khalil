/* ------------------------------------------------------------------ *
 * The archive page: newspaper-wide, lists every issue.
 *
 * Published issues describe themselves (meta.archive in their issue.ts).
 * `upcoming` cards announce issues that are not published yet; a
 * published issue with the same number replaces its upcoming card.
 * ------------------------------------------------------------------ */
import type { ArchiveCard, HeroBlock, NoteBlock, TickerDef } from '../lib/types';

export const archivePage = {
  docTitle: "الأرشيف | قال قيل ال خليل",
  ticker: {
    label: "الأرشيف",
    ariaLabel: "شريط الأرشيف",
    items: [
      "الأرشيف ليس مجرد حفظ لما نُشر، بل تهديد مبطن بإمكانية الرجوع إليه لاحقاً",
      "بعض المواد هنا أُغلقت تحريرياً فقط، لا اجتماعياً",
      "العدد المؤجل لا يعني النسيان، بل يعني أن الظروف لم تنضج بما يكفي بعد",
      "هذا الباب وُجد لحماية الذاكرة من التلاعب، ولحماية الجريدة من عبارة: ما صار هيك",
      "يرجى عدم اعتبار غياب بعض الأعداد دليلاً على براءة أحد"
    ]
  } as TickerDef,
  footerTagline: "أرشيف محفوظ لما نُشر، ولما تأجل، ولما يرفض أن ينتهي بشكل محترم.",
  hero: {
    type: "hero",
    kicker: "قسم الأرشيف",
    title: "ما صدر، وما ينتظر الظرف المناسب، وما لم يُغلق فعلياً",
    html: "يحتفظ هذا الباب بالأعداد المنشورة، والمشاريع المؤجلة، والمواد التي قد تعود إلى السطح فور توفر سبب عائلي كافٍ."
  } as HeroBlock,
  listHeading: "سجل الأعداد",
  listSub: "ليس ترتيباً زمنياً فقط، بل ترتيباً لمستويات الاستعداد النفسي للنشر.",
  notes: [
    {
      type: "note",
      title: "ملاحظة أرشيفية",
      html: "لا يعني عدم ظهور عدد جديد أن الحياة هدأت، بل قد يعني فقط أن المادة ما تزال تتخمّر، أو أن هيئة التحرير تفضّل منح الواقع فرصة أخيرة لتفسير نفسه قبل الطباعة."
    },
    {
      type: "note",
      title: "سياسة الحفظ",
      html: "تحتفظ الجريدة بحق إعادة فتح أي ملف سابق، إذا ثبت أن أثره لم ينتهِ، أو أن أحد أطرافه تصرّف لاحقاً بطريقة جعلت النص القديم يبدو تمهيداً لا أكثر."
    }
  ] as NoteBlock[],
};

export const upcoming: (ArchiveCard & { number: string })[] = [
  {
    number: "002",
    title: "العدد الثاني",
    description: "قيد الانتظار إلى حين توافر مادة كافية، أو حدث لا يمكن تركه يمر دون عنوان مناسب.",
    statusLabel: "قيد الترقب",
    statusTone: "pending",
  },
  {
    number: "003",
    title: "عدد خاص",
    description: "يُفتح عند الحاجة فقط، أي عندما يصبح السكوت غير مهني، أو غير كافٍ، أو غير ممتع.",
    statusLabel: "غير مستبعد",
    statusTone: "sensitive",
  },
];
