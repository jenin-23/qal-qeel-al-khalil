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

/**
 * Editorial status of unreleased work: an issue's private edition, or
 * one article in it. Unreleased work exists only in development builds
 * (`npm run dev`, `npm run build:drafts`); production never reads it.
 * See docs/EDITORIAL_WORKFLOW.md.
 *
 * draft      being written or laid out
 * review     finished, waiting for the editor's approval
 * published  approved and released (only after an explicit release)
 */
export type EditorialStatus = 'draft' | 'review' | 'published';

export interface IssueMeta {
  /** Zero-padded issue number, also the URL segment: /issues/001/ */
  number: string;
  status: IssueStatus;
  /** Set only in newsroom builds, on an unreleased issue shown from its private edition. */
  preview?: EditorialStatus;
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
  /** How this edition looks as a physical object. Deterministic, never random. */
  appearance?: IssueAppearance;
  /**
   * The release event (editing → published). When `announce` is set, the
   * library may stage the printing sequence once per browser until `until`.
   * Infrastructure only: the sequence itself is added at Issue 002's launch.
   */
  release?: { announce: boolean; until?: string };
}

/**
 * Physical character of a printed edition, all 0-1 unless noted.
 * Used on the library shelf and, very lightly, on the issue's own headlines.
 */
export interface IssueAppearance {
  /** 0 fresh newsprint … 1 decades in a drawer */
  paperAge: number;
  /** strength of the black plate on headlines (0.7-1) */
  printOpacity: number;
  /** ink bleeding into the paper on display type */
  inkSpread: number;
  /** red plate misregistration, in px (0-1.5) */
  registrationOffset: number;
  /** how visible the fold is */
  creaseLevel: number;
  /** sheets visible in the stack on the shelf (1-6) */
  sheets: number;
  /** a proof of loose sheets rather than a folded copy */
  loose?: boolean;
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
  /** Omitted = published. A production build refuses draft/review articles. */
  status?: EditorialStatus;
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
  /** Real contributors (future press credentials). Empty until real. */
  contributors?: Contributor[];
  /** Easter eggs enabled for this issue (ids from src/universe/eggs.ts). */
  eggs?: string[];
}

/**
 * The private, full edition of an unreleased issue
 * (src/issues/NNN/edition/index.ts). Development builds merge it into the
 * issue; production builds never load it (see astro.config.mjs).
 */
export interface IssueEdition {
  status: EditorialStatus;
  /** Masthead details decided for this edition (release date label, …). */
  meta?: Partial<Omit<IssueMeta, 'number' | 'status'>>;
  ui?: Partial<IssueUI>;
  pages: Partial<Record<PageKey, PageDef>>;
  articles: Article[];
  ads?: IssueAds;
  birthday?: BirthdayDef;
  entertainment?: EntertainmentDef;
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
  | { type: 'snippet'; text: string }
  /** a production note pinned to the proof (approved wording only) */
  | { type: 'production-note'; text: string };

/* ---- production states (truthful only) ---------------------------- */

export type ProductionState = 'waiting' | 'received' | 'reviewing' | 'approved' | 'ready';

/**
 * One line on the production board, e.g.
 * { category: 'images', label: 'الصور', state: 'received', stateLabel: 'قيد الاستلام' }.
 * Labels are written by the editors (nothing is generated) and only
 * configured lines are shown.
 */
export interface ProductionLine {
  category: 'articles' | 'images' | 'ads' | 'sections' | 'fatwa' | 'layout' | 'print' | (string & {});
  label: string;
  state: ProductionState;
  stateLabel: string;
}

/**
 * Material that really arrived. Shown as a clipped slip
 * («ورد حديثاً إلى هيئة التحرير»); the material itself stays private
 * unless `teaser` is given.
 */
export interface IncomingItem {
  id: string;
  /** ISO date it arrived */
  receivedAt?: string;
  state: ProductionState;
  /** optional, approved public hint */
  teaser?: Teaser;
}

/** A real contributor to an issue (future press credentials). Never invented. */
export interface Contributor {
  name: string;
  /** e.g. 'مراسل غير متفرغ' */
  role: string;
  credential?: boolean;
}

/**
 * A redaction: permanent, revealable (only if `reveal` is provided) or
 * answered by an editorial response. Never hides invented text.
 */
export interface RedactionDef {
  mode: 'permanent' | 'revealable' | 'response';
  /** approximate length in characters of the blacked-out run */
  length: number;
  reveal?: string;
  response?: string;
}

/** Readers sending material to the newsroom for this issue (WhatsApp click-to-chat). */
export interface SubmissionsDef {
  /** international number, digits only, no + (e.g. '962791432787') */
  whatsapp: string;
  /** pre-filled opening line of the reader's message */
  message: string;
}

export interface ConstructionDef {
  progress?: IssueProgress;
  /** production board lines; nothing is shown until one is configured */
  production?: ProductionLine[];
  /** real arrivals, newest first */
  incoming?: IncomingItem[];
  teasers?: Teaser[];
  submissions?: SubmissionsDef;
  /** the editor's red pencil (annotation layer over the proof) */
  pencil?: boolean;
}
