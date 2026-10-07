/* ------------------------------------------------------------------ *
 * محفوظات هيئة التحرير: the editors' drawer in the library.
 * A place for real material over time (unused headlines, corrections,
 * old documents, photographs). Nothing here is invented: every folder
 * starts empty and says so with the newsroom's own placeholder.
 * ------------------------------------------------------------------ */
import type { ImageMetadata } from 'astro';

export type ArchiveItem =
  | { type: 'document'; title: string; html: string; date?: string }
  | { type: 'headline'; text: string; note?: string }
  | { type: 'correction'; text: string; issue?: string }
  /** أرشيف الصور: front = photograph, back = date / caption / context */
  | { type: 'photo'; image: ImageMetadata; alt: string; date?: string; caption?: string; context?: string };

export interface ArchiveFolder {
  id: string;
  label: string;
  /** folders that are not yet opened to readers show as sealed */
  sealed?: boolean;
  items: ArchiveItem[];
  /** hidden until it has items (e.g. the photo archive) */
  hiddenWhenEmpty?: boolean;
}

export const drawer = {
  label: 'محفوظات هيئة التحرير',
  folders: [
    { id: 'closed', label: 'ملفات مغلقة', sealed: true, items: [] },
    { id: 'unpublished', label: 'مواد لم تُنشر', items: [] },
    { id: 'corrections', label: 'تصحيحات', items: [] },
    { id: 'records', label: 'محفوظات', items: [] },
    { id: 'from-archive', label: 'من الأرشيف', items: [] },
    { id: 'photos', label: 'أرشيف الصور', items: [], hiddenWhenEmpty: true },
  ] as ArchiveFolder[],
};
