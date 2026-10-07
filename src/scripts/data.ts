/* Page data embedded by the build (<script type="application/json">). */
import type { DelayRange, IssueUI } from '../lib/types';

export interface IssueData {
  /** null on newspaper-level pages */
  issue: string | null;
  ui: IssueUI;
  popup: {
    enabled: boolean;
    firstDelay: DelayRange;
    repeatDelay: DelayRange;
    minAfterNavigation: number;
    ids: string[];
  };
}

export interface EntertainmentData {
  issue: string;
  birthday: { month: number; invalidToast: string; fallbackToast: string | null } | null;
  predictions: Record<string, string> | null;
  coin: { yes: string; no: string } | null;
  quiz: { results: Record<string, string> & { fallback: string }; emptyToast: string } | null;
}

export function readJSON<T>(id: string): T | null {
  const el = document.getElementById(id);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as T;
  } catch {
    return null;
  }
}

/** Storage that never throws (private mode, blocked site data, …). */
export function safeStorage(kind: 'local' | 'session') {
  const get = () => (kind === 'local' ? window.localStorage : window.sessionStorage);
  return {
    read<T>(key: string): T | null {
      try {
        const raw = get().getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    write(key: string, value: unknown): void {
      try {
        get().setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable: behave as if nothing was remembered */
      }
    },
  };
}
