/* ------------------------------------------------------------------ *
 * 107.5 FM: the newspaper's radio. One station, nothing else.
 *
 * Adding the programme later (no redesign needed):
 *   1. put an MP3 you have the rights to publish in public/audio/
 *      e.g. public/audio/radio-1075.mp3
 *   2. list it below:  tracks: [{ src: 'audio/radio-1075.mp3' }]
 *      (path relative to the site root; `duration` in seconds is optional:
 *       give it for several tracks so the station can keep its schedule
 *       without loading every file)
 *   3. npm test, deploy.
 *
 * With several tracks they all play as ONE station, back to back, on a
 * clock: tuning in joins the programme wherever it is "now", as on a real
 * radio. Readers never see tracks, positions or durations.
 * With no tracks (now), switching on gives «لا توجد إشارة».
 * ------------------------------------------------------------------ */
export interface RadioTrack {
  /** path under public/, without a leading slash */
  src: string;
  /** seconds; optional for a single track */
  duration?: number;
}

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
  tracks: [] as RadioTrack[],
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
