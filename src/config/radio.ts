/* ------------------------------------------------------------------ *
 * 107.5 FM: the newspaper's radio. One station, nothing else.
 *
 * The programme (`tracks`) plays as ONE station, back to back, on a
 * clock: tuning in joins the programme wherever it is "now", as on a real
 * radio. Readers never see tracks, positions or durations.
 *
 * Changing the programme (no redesign needed):
 *   1. only audio you can verify is licensed for public hosting; record
 *      its provenance in docs/RADIO_MUSIC_LICENSES.md
 *   2. put the file in public/audio/radio/ and list it below with its
 *      exact `duration` (seconds) and, if the licence asks, its `credit`
 *   3. npm test, deploy.
 *
 * With no tracks, switching on gives «لا توجد إشارة».
 * ------------------------------------------------------------------ */
export interface RadioTrack {
  /** path under public/, without a leading slash */
  src: string;
  /** seconds; optional for a single track */
  duration?: number;
  /**
   * Licence credit, shown only on بيانات البث (/broadcast.html), never on
   * the radio. Full provenance: docs/RADIO_MUSIC_LICENSES.md
   */
  credit?: {
    title: string;
    creator: string;
    source: string;
    sourceUrl: string;
    license: string;
    licenseUrl: string;
  };
}

const BY_SA_3 = { license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' };

export const radio = {
  enabled: true,
  /** where the needle lives */
  frequency: 107.5,
  label: '107.5 FM',
  /** the printed scale */
  band: { min: 88, max: 108, marks: [88, 92, 96, 100, 104, 107.5] },
  /** how close counts as "on the station" (MHz) */
  capture: 0.3,
  /** after wandering off, the needle drifts home (ms of no tuning) */
  returnAfterMs: 1800,
  /** 0-100; never starts loud */
  defaultVolume: 45,
  /** a remembered "on" only resumes within the same browsing moment */
  resumeWindowMs: 10 * 60 * 1000,
  /**
   * The programme, in broadcast order (18 min 22 s, then it starts again).
   * Every file is licensed for this use; see docs/RADIO_MUSIC_LICENSES.md.
   */
  tracks: [
    {
      src: 'audio/radio/radio-01.mp3',
      duration: 223.65,
      credit: { title: 'Song of the Heart', creator: 'Dal Studio', source: 'Jamendo', sourceUrl: 'https://www.jamendo.com/album/495078', ...BY_SA_3 },
    },
    {
      src: 'audio/radio/radio-02.mp3',
      duration: 68.33,
      credit: { title: 'Oud music (1V2 long)', creator: 'Andy R. Jordan', source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Oud_music_by_Andy_R._Jordan_1V2_long.mp3', ...BY_SA_3 },
    },
    {
      src: 'audio/radio/radio-03.mp3',
      duration: 219.61,
      credit: { title: 'Eastern duet', creator: 'Dal Studio', source: 'Jamendo', sourceUrl: 'https://www.jamendo.com/album/495077', ...BY_SA_3 },
    },
    {
      src: 'audio/radio/radio-04.mp3',
      duration: 77.91,
      credit: { title: 'Arabic qanun sample', creator: 'Ariel Qassis', source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:ArabicQanunSample.ogg', license: 'CC BY-SA 2.5', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.5/' },
    },
    {
      src: 'audio/radio/radio-05.mp3',
      duration: 240.14,
      credit: { title: 'Me and the east', creator: 'Dal Studio', source: 'Jamendo', sourceUrl: 'https://www.jamendo.com/album/484663', ...BY_SA_3 },
    },
    {
      src: 'audio/radio/radio-06.mp3',
      duration: 63.34,
      credit: { title: 'Oud music (2v2)', creator: 'Andy R. Jordan', source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Oud_music_by_Andy_R._Jordan_2v2.mp3', ...BY_SA_3 },
    },
    {
      src: 'audio/radio/radio-07.mp3',
      duration: 208.9,
      credit: { title: 'Land', creator: 'Dal Studio', source: 'Jamendo', sourceUrl: 'https://www.jamendo.com/album/470005', ...BY_SA_3 },
    },
  ] as RadioTrack[],
  /** visible wording (approved) */
  text: {
    on: 'تشغيل',
    off: 'إيقاف',
    volume: 'الصوت',
    noSignal: 'لا توجد إشارة',
  },
  /** accessible names only (not printed on the radio) */
  a11y: {
    radio: '107.5 FM',
    tuning: 'التردد',
    close: 'إغلاق',
  },
};
