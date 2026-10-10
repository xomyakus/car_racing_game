import { RACE_LAPS } from './constants';

export interface RaceResult {
  /** how far the brain got, in % of one lap (100 = one lap); summed over every track it raced on */
  pct: number;
  /** total time for the whole race, or null if it didn't finish */
  raceTime: number | null;
  /** laps in the whole race (all tracks together); defaults to RACE_LAPS */
  of?: number;
  /** fastest single lap, or null if it never finished a lap */
  bestLap?: number | null;
}

/** A race result plus how the brain drove, for rewards that care about style. */
export interface TestResult extends RaceResult {
  /** seconds on track */
  t: number;
  /** distance driven, in world units */
  dist: number;
  /** average change of steering per step (0 = perfectly smooth) */
  wobble: number;
  /** average distance from the middle of the road (0 = middle, 1 = touching the wall) */
  lane: number;
}

export type RewardId = 'race' | 'survive' | 'avgSpeed' | 'smooth';

export const REWARDS: Record<RewardId, { name: string; rule: string }> = {
  race: { name: 'Race result', rule: 'Further is better. Once a brain finishes, faster is better.' },
  survive: { name: 'Longest time on track', rule: 'More seconds driving without ending the test is better.' },
  avgSpeed: { name: 'Fastest average speed', rule: 'Distance divided by time. Higher is better, however short the drive.' },
  smooth: { name: 'Race result, but smooth', rule: 'Race result, minus points for wobbly steering and for driving away from the middle.' },
};

/** A brain's best lap only counts in the championship if it finished the whole race. */
export const countedLap = (r: RaceResult): number | null => (r.raceTime != null ? r.bestLap ?? null : null);

/** Distance first; any brain that finishes the race beats every brain that doesn't, then faster wins. */
export const raceScore = (r: RaceResult) => (r.raceTime != null ? (r.of ?? RACE_LAPS) * 100 + (1000 - r.raceTime) : r.pct);

/** How good a test drive was, under a given reward rule. Higher is better. */
export function rewardScore(reward: RewardId, r: TestResult): number {
  switch (reward) {
    case 'race': return raceScore(r);
    case 'survive': return r.t;
    case 'avgSpeed': return r.dist / Math.max(r.t, 0.5);
    case 'smooth': return raceScore(r) - 300 * r.wobble - 100 * r.lane;
  }
}

export const pctText = (p: number) => (p >= 100 ? `${(p / 100).toFixed(1)} laps` : `${p.toFixed(0)}%`);
export const resultText = (r: RaceResult) => (r.raceTime != null ? `${r.of ?? RACE_LAPS} laps, ${r.raceTime.toFixed(1)}s` : pctText(r.pct));
export const shortProg = (pct: number, laps: number) => (laps ? `${laps} lap${laps > 1 ? 's' : ''}` : `${Math.min(100, pct).toFixed(0)}%`);
/** Square-root scale so the first few % and the last lap both stay visible on one bar. */
export const progFrac = (pct: number, totalLaps = RACE_LAPS) => Math.sqrt(Math.max(0, Math.min(totalLaps * 100, pct)) / (totalLaps * 100));
export const fmtTime = (t: number | null | undefined) => (t == null ? '—' : `${t.toFixed(2)}s`);
