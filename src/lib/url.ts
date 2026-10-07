/** Base-aware URLs (the site lives under /qal-qeel-al-khalil/ on GitHub Pages). */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path = ''): string {
  return `${BASE}/${path.replace(/^\//, '')}`;
}

export function issueUrl(number: string, page = 'home', hash?: string): string {
  const file = page === 'home' ? '' : `${page}.html`;
  return url(`issues/${number}/${file}`) + (hash ? `#${hash}` : '');
}

export const archiveUrl = () => url('archive.html');
/** The library (مكتبة قال قيل): the site's front door. */
export const libraryUrl = () => url('');

/** Newspaper-level pages (not part of any issue). */
export const aboutUrl = () => url('about.html');
export const contactUrl = () => url('contact.html');

export function paperUrl(key: 'library' | 'archive' | 'about' | 'contact'): string {
  return { library: libraryUrl, archive: archiveUrl, about: aboutUrl, contact: contactUrl }[key]();
}
