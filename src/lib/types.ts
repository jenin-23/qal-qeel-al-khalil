import type { ImageMetadata } from 'astro';

/* ------------------------------------------------------------------ *
 * Shared types. The newspaper shell (components, scripts, styles)
 * only ever reads data through these shapes; every word a reader
 * sees comes from an issue folder or from src/universe.
 * ------------------------------------------------------------------ */

/** Page keys an issue may publish. New sections only need a new key + blocks. */
export type PageKey = 'home' | 'news' | 'columns' | 'entertainment' | 'about' | 'contact' | (string & {});

/**
 * draft     internal only: built by `npm run dev`, invisible publicly
 * editing   on the library shelf; opens the newsroom proof (/issues/NNN/)
 * published on the shelf; the full newspaper
 * archived  on the shelf and in the archive; the full newspaper, forever
 */
export type IssueStatus = 'draft' | 'editing' | 'published' | 'archived';

export interface IssueMeta {
  /** Zero-padded issue number, also the URL segment: /issues/001/ */
  number: string;
  status: IssueStatus;
  year: number;
  /** Publication month (1-12). */
  month: number;
  /** Machine-readable release date (ISO). */
  releaseDate?: string;
  /** Release date exactly as printed in the masthead. Never recomputed. */
  releaseDateLabel?: string;
  city?: string;
  /** Full masthead price line, e.g. "السعر: حسب". */
  priceLine?: string;
  /** Copyright line in the footer. */
  copyright?: string;
  archive?: ArchiveCard;
}

export interface ArchiveCard {
  title: string;
  description: string;
  statusLabel: string;
  statusTone: 'published' | 'pending' | 'sensitive';
  cover?: ImageMetadata;
  coverAlt?: string;
}

/** Interface microcopy. Every issue pins its own, so old issues never change. */
export interface IssueUI {
  closeLabel: string;
  coming: { title: string; text: string; triggerText: string };
  toastInitial: string;
  copyArticle: { label: string; done: string; toast: string; error: string };
  copyPhone: { done: string; toast: string; error: string };
  reactionToast: string;
  contactToast: string;
  popupAd: { dismiss: string; ariaLabel: string };
  inlineAdLabel: string;
}

export interface TickerDef {
  label: string;
  ariaLabel?: string | null;
  items: string[];
}

export interface PageDef {
  docTitle: string;
  ticker: TickerDef;
  /** Footer description paragraph; omitted when null. */
  footerTagline?: string | null;
  blocks: Block[];
}

/* ---- page blocks ------------------------------------------------- */

export interface HeroBlock { type: 'hero'; kicker: string; title: string; html: string }
export interface NoteBlock { type: 'note'; title: string; html: string }
export interface NoteGridBlock { type: 'note-grid'; notes: NoteBlock[] }
export interface ProseBlock { type: 'prose'; html: string }
export interface ContactField {
  label: string;
  kind: 'text' | 'select' | 'textarea';
  placeholder?: string;
  options?: string[];
  rows?: number;
}
export interface ContactBlock {
  type: 'contact';
  introHtml: string;
  form: { heading: string; subheading: string; fields: ContactField[]; submit: string; note: string };
}
export interface FrontBlock {
  type: 'front';
  lead: { kicker: string; title: string; articleId: string; subtitle: string };
  headlines: { label: string; title: string; articleId: string }[];
}
export interface TocBlock {
  type: 'toc';
  heading: string;
  sub: string;
  items: { title: string; articleId: string }[];
}
export interface ArticlesBlock {
  type: 'articles';
  ids: string[];
  /** Render the classified-ads sidebar (ads.sidebar[pageKey]). */
  sidebar?: boolean;
}
export type EntertainmentModule = 'horoscope' | 'coin' | 'fatwa' | 'quiz';
export interface EntertainmentBlock { type: 'entertainment'; modules: EntertainmentModule[] }

export type Block =
  | HeroBlock
  | NoteBlock
  | NoteGridBlock
  | ProseBlock
  | ContactBlock
  | FrontBlock
  | TocBlock
  | ArticlesBlock
  | EntertainmentBlock;

/* ---- articles ---------------------------------------------------- */

export type ImageRatio = 'fixed' | '16/9' | '4/3' | '3/2' | '1/1' | '4/5';

export interface ArticleImage {
  src: ImageMetadata;
  /** Arabic, purely descriptive. Required. */
  alt: string;
  caption?: string;
  /** 'fixed' keeps the classic 280px newspaper strip (Issue 001). */
  ratio?: ImageRatio;
  /** object-position keyword used by the existing .story-img modifiers. */
  position?: 'top' | 'center' | 'left' | 'right';
  /** Exact focal point (CSS object-position), e.g. '50% 36%'. Overrides position. */
  focus?: string;
  /** Editorial cartoon presentation: whole image on paper, never cropped. */
  variant?: 'photo' | 'cartoon';
}

export interface ArticlePlaceholder {
  /** Label shown inside the striped placeholder box. */
  placeholder: string;
}

export interface Article {
  id: string;
  page: PageKey;
  meta: string;
  title: string;
  /** Body HTML, copied verbatim into the issue folder. */
  body: string;
  image?: ArticleImage | ArticlePlaceholder;
  toggle: { more: string; less: string };
  /** Extra action links rendered next to the copy button. */
  links?: { label: string; page: PageKey }[];
  reactions?: { label: string; options: string[] };
}

/* ---- ads --------------------------------------------------------- */

/** Classified-ad compositions (press theme). Defaults rotate by position. */
export type AdLayout = 'notice' | 'banner' | 'checklist' | 'reverse' | 'coupon';

export interface SidebarAd {
  /** Optional print composition; omitted → chosen by position. */
  layout?: AdLayout;
  brand: string;
  html: string;
  cta: string;
  phones: { label: string; phone: string }[];
}

export interface ImageAd {
  id: string;
  image: ImageMetadata;
  alt: string;
  href?: string;
}

export interface InlineAd extends ImageAd {
  page: PageKey;
  /** Article id this ad follows. */
  after: string;
  caption?: string;
}

/** Seconds; a random value inside [min, max] is used each time. */
export type DelayRange = [min: number, max: number];

export interface PopupSettings {
  enabled: boolean;
  /** Delay before the first popup of a browsing session. */
  firstDelay?: DelayRange;
  /** Delay between popups. */
  repeatDelay?: DelayRange;
  /** Minimum quiet time after any page load/navigation. */
  minAfterNavigation?: number;
  pool: ImageAd[];
}

export interface IssueAds {
  sidebar: Partial<Record<PageKey, SidebarAd[]>>;
  inline: InlineAd[];
  popup: PopupSettings;
}

/* ---- entertainment ----------------------------------------------- */

export const ZODIAC_SIGNS = [
  'الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء',
  'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت',
] as const;
export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export interface HoroscopeDef {
  heading: string;
  sub: string;
  initialSign: string;
  initialText: string;
  /** Exactly one prediction per sign. */
  predictions: Record<ZodiacSign, string>;
}

export interface BirthdayDef {
  /** Month (1-12) this issue celebrates. */
  month: number;
  gate: { title: string; text: string; labels: [day: string, month: string, year: string]; submit: string };
  /** The easter-egg popup for readers born in `month`. */
  monthModal?: { title: string; html: string; buttonMore: string; buttonLess: string };
  /** Shown instead when no monthModal is defined. */
  fallbackToast?: string;
  invalidToast: string;
  changeLabel: string;
}

export interface CoinDef {
  heading: string;
  sub: string;
  button: string;
  faces: [yes: string, no: string];
  initialResult: string;
  results: { yes: string; no: string };
}

export interface FatwaDef {
  /** Key into src/universe/institutions.ts */
  desk: string;
  /** Key into the desk's people; defaults to the desk's resident mufti. */
  author?: string;
  question: string;
  html: string;
}

export interface QuizDef {
  heading: string;
  sub: string;
  questions: { title: string; name: string; options: { value: string; label: string }[] }[];
  submit: string;
  initialResult: string;
  results: Record<string, string> & { fallback: string };
  emptyToast: string;
}

export interface EntertainmentDef {
  horoscope?: HoroscopeDef;
  coin?: CoinDef;
  fatwa?: FatwaDef;
  quiz?: QuizDef;
}

/* ---- the whole issue --------------------------------------------- */

export interface Issue {
  meta: IssueMeta;
  ui: IssueUI;
  pages: Partial<Record<PageKey, PageDef>>;
  articles: Article[];
  ads: IssueAds;
  birthday?: BirthdayDef;
  entertainment?: EntertainmentDef;
  /** While status is 'editing': what the newsroom proof may show. */
  construction?: ConstructionDef;
}

/* ---- an issue in the newsroom (status: 'editing') ----------------- */

/**
 * Real production progress. Nothing is shown until a value is provided;
 * never fill these in with guesses.
 */
export interface ProgressItem {
  done: number;
  total?: number;
}

export interface IssueProgress {
  articles?: ProgressItem;
  images?: ProgressItem;
  ads?: ProgressItem;
  sections?: ProgressItem;
}

/**
 * Things the editors may choose to leak from an unfinished issue.
 * Each type is rendered by components/newsroom/Teaser.astro.
 * Only add a teaser when the material actually exists.
 */
export type Teaser =
  /** a real headline whose article stays hidden */
  | { type: 'headline'; headline: string; section?: string }
  /** a headline shown mostly blacked out; only `visible` words show */
  | { type: 'redacted-headline'; visible: string[]; hiddenWords: number }
  /** a real image, shown cropped and/or blurred */
  | { type: 'image'; image: ImageMetadata; alt: string; crop?: string; blur?: boolean }
  /** one quote without its context */
  | { type: 'quote'; quote: string }
  /** names of sections planned for the issue */
  | { type: 'sections'; names: string[] }
  /** a finished advertisement from the issue */
  | { type: 'ad'; ad: SidebarAd }
  /** a short cryptic classified line */
  | { type: 'classified'; text: string }
  /** a small fragment of a future article */
  | { type: 'snippet'; text: string };

/** Readers sending material to the newsroom for this issue (WhatsApp click-to-chat). */
export interface SubmissionsDef {
  /** international number, digits only, no + (e.g. '962791432787') */
  whatsapp: string;
  /** pre-filled opening line of the reader's message */
  message: string;
}

export interface ConstructionDef {
  progress?: IssueProgress;
  teasers?: Teaser[];
  submissions?: SubmissionsDef;
}
