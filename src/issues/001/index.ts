/* Issue 001 · April 2026 · published — a frozen snapshot. */
import type { Issue } from '../../lib/types';
import { meta, ui } from './issue';
import { pages } from './pages';
import { articles } from './articles';
import { ads } from './ads';
import { birthday } from './birthday';
import { entertainment } from './entertainment';

const issue: Issue = { meta, ui, pages, articles, ads, birthday, entertainment };
export default issue;
