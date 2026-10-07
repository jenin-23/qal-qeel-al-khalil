import type { Article } from '../../lib/types';
import { loadBodies } from '../../lib/bodies';
import tat3eemStory from '../../assets/images/issue-001/tat3eem-story.jpg';
import eslamStory from '../../assets/images/issue-001/eslam-story.jpeg';
import ghadaAnat from '../../assets/images/issue-001/ghada-anat.jpeg';
import habbabStory from '../../assets/images/issue-001/habbab-story.jpeg';
import tanweer from '../../assets/images/issue-001/tanweer.jpg';

const bodies = loadBodies(import.meta.glob('./articles/*.html', { query: '?raw', import: 'default', eager: true }));

export const articles: Article[] = [
  {
    id: "ziad-story",
    page: "news",
    meta: "حي المنصور – قال قيل آل خليل",
    title: "رمضان بلا غضب: زياد أبو سل ينجح في ضبط النفس",
    body: bodies["ziad-story"],
    image: { placeholder: "صورة الخبر" },
    toggle: {
      more: "تابع رغم وضوح الأمور",
      less: "كفى هذا القدر"
    },
    reactions: {
      label: "شعورك تجاه المقال؟",
      options: [
        "متوقَّع للأسف",
        "شهدت ما هو شبيه",
        "لا أريد فتح هذا الملف"
      ]
    },
  },
  {
    id: "tat3eem-story",
    page: "news",
    meta: "عمّان – قال قيل آل خليل",
    title: "التطعيم: عادة رمضانية يلتزم بها الأردنيون أثناء القيادة",
    body: bodies["tat3eem-story"],
    image: { src: tat3eemStory, alt: "رجل يصرخ ويرفع يده وهو يقود سيارة", ratio: 'fixed', position: "center" },
    toggle: {
      more: "افتح الملف المروري",
      less: "يكفي هذا الزحام"
    },
    reactions: {
      label: "شعورك تجاه المقال؟",
      options: [
        "مرّيت بشي مشابه",
        "الطريق مسؤول أيضاً",
        "هذا يفسّر كثيراً"
      ]
    },
  },
  {
    id: "eslam-story",
    page: "news",
    meta: "حي المنصور – قال قيل آل خليل",
    title: "وسام الامتناع: إسلام خليل تُكرَّم لالتزامها التاريخي بعدم التدخين",
    body: bodies["eslam-story"],
    image: { src: eslamStory, alt: "لافتة ورقية معلّقة بين نباتات مزينة بأضواء صغيرة، مكتوب عليها «٥ شهور» و«سلوم بدون دخان»", ratio: 'fixed', position: "center" },
    toggle: {
      more: "افتح ملف الوسام",
      less: "تم الاكتفاء بالتكريم"
    },
    reactions: {
      label: "شعورك تجاه المقال؟",
      options: [
        "إنجاز محترم",
        "الرسالة وصلت",
        "لا داعي للمقارنة"
      ]
    },
  },
  {
    id: "ghada-anat-story",
    page: "columns",
    meta: "قال قيل ال خليل – عمود / ملف وجودي",
    title: "غادة خليل ترفع مستوى الوعي العام… وأنات العلاّن تحمّل القمر المسؤولية",
    body: bodies["ghada-anat-story"],
    image: { src: ghadaAnat, alt: "رسم مقسوم إلى نصفين: في جهة دائرة أبراج وقمر هادئ وشموع وأوراق تاروت قرب بحيرة، وفي الجهة الأخرى قمر بوجه غاضب فوق مدينة مشتعلة", ratio: 'fixed', position: "center" },
    toggle: {
      more: "تابع رغم الغموض",
      less: "أغلق الملف الوجودي"
    },
    links: [
      {
        label: "اذهب إلى الأبراج",
        page: "entertainment"
      }
    ],
    reactions: {
      label: "شعورك تجاه المقال؟",
      options: [
        "أفهم… نظرياً",
        "القمر مسؤول جزئياً",
        "هذا النص لا يساعد"
      ]
    },
  },
  {
    id: "habbab-story",
    page: "columns",
    meta: "قال و قيل آل خليل – قسم اللغة والسلوكيات العائلية",
    title: "مصطلحات آل خليل “حباب تتلقفك”: من تعجّب جدّة إلى نظام تعبير متكامل",
    body: bodies["habbab-story"],
    image: { src: habbabStory, alt: "تصميم بخلفية حمراء ليد تمسك وردة فاتحة اللون، مع عبارة «حباب تتلقفك»", ratio: 'fixed', position: "center", focus: '50% 37%' },
    toggle: {
      more: "افتح ملف المصطلح",
      less: "يكفي هذا القدر من التوثيق"
    },
    reactions: {
      label: "شعورك تجاه المقال؟",
      options: [
        "أعرف الاستعمال جيداً",
        "يوصل الفكرة فعلاً",
        "لا يحتاج شرحاً أصلاً"
      ]
    },
  },
  {
    id: "tanweer-story",
    page: "columns",
    meta: "قال و قيل آل خليل – القسم الروحي",
    title: "دليل روحي “رحلة التنوير”: برنامج غير رسمي لإعادة ضبط الإنسان… بإشراف أنات",
    body: bodies["tanweer-story"],
    image: { src: tanweer, alt: "رسم لشخص يجلس في وضعية التأمل وسط سحب ملونة ونجوم", ratio: 'fixed', position: "center" },
    toggle: {
      more: "ادخل الرحلة",
      less: "يكفي هذا القدر من التنوير"
    },
    reactions: {
      label: "شعورك تجاه المقال؟",
      options: [
        "أحتاج جلسة بعد هذا",
        "أعرف من تقصدون",
        "سأؤجل فهمه"
      ]
    },
  },
];
