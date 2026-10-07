/* ------------------------------------------------------------------ *
 * Browser entry point. Every system checks for its own elements and
 * quietly does nothing when they are not on the page.
 * ------------------------------------------------------------------ */
import { readJSON, type EntertainmentData, type IssueData } from './data';
import { initModals } from './modal';
import { initComingSoon } from './coming-soon';
import { initTickers } from './ticker';
import { initArticleToggles } from './articles';
import { initCopy } from './copy';
import { initReactions } from './reactions';
import { initContactForm } from './contact';
import { initBirthday } from './birthday';
import { initCoin } from './coin';
import { initQuiz } from './quiz';
import { initPopupAds } from './popup-ads';
import { initLibrary, initIssueSide } from './library';
import { initEggs } from './eggs';
import { initPencil } from './pencil';
import { initPrint } from './print';
import { initNewsroom } from './newsroom';

const issue = readJSON<IssueData>('issue-data');
const entertainment = readJSON<EntertainmentData>('entertainment-data');

initModals();
initLibrary();
initIssueSide();
initNewsroom();
initPencil();
initPrint();
initEggs();
initTickers();
initArticleToggles();

if (issue) {
  initComingSoon(issue);
  initCopy(issue);
  initReactions(issue);
  initContactForm(issue);
}

if (entertainment) {
  initBirthday(entertainment);
  initCoin(entertainment);
  initQuiz(entertainment);
}

if (issue) initPopupAds(issue);
