import { Brain } from './brain';
import { SensorSpec } from './sensors';
import { RaceResult, RewardId, raceScore } from './score';
import { RACE_LAPS } from './constants';
import type { TrackId } from './track';

/** The best brain a lab has found, kept in this browser so it survives a reload. */
export interface SavedChampion extends RaceResult {
  layers: number[];
  spec: SensorSpec;
  w: number[];
  /** level number it was trained in */
  level: number;
  /** name shown in menus, e.g. "Level 4 · 7 → 16 → 16 → 2 · Monza" */
  name: string;
  /** track it raced on, or 'multi' when every test drive covered several tracks */
  track?: TrackId | 'multi';
  /** the tracks of a 'multi' race */
  tracks?: TrackId[];
  /** brain shape and senses, e.g. "7 → 12 → 8 → 2 · + time to crash" */
  setup?: string;
  /** test drives it took to find this brain */
  tests?: number;
  /** generation it came from (how many times the best brain improved) */
  generation?: number;
  /** how it was judged while training */
  reward?: RewardId;
  /** copycat only: rounds of backpropagation */
  epochs?: number;
  /** when it was saved (ms since 1970) */
  savedAt?: number;
}

interface Saved {
  /** best human lap per track */
  humanBest: Partial<Record<TrackId, number>>;
  champions: Record<string, SavedChampion>;
  builder: number[] | null;
}

const KEY = 'brainracers.v3';
const empty = (): Saved => ({ humanBest: {}, champions: {}, builder: null });

// storage can be missing or blocked (private windows, previews), so every access is guarded
export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

function write(s: Saved) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function saveHumanBest(track: TrackId, t: number) { const s = loadSaved(); s.humanBest[track] = t; write(s); }
export function saveBuilder(hidden: number[]) { const s = loadSaved(); s.builder = hidden; write(s); }

/** Keep `c` as the champion for `key` unless an equally long race was already done better. */
export function saveChampion(key: string, c: SavedChampion) {
  const s = loadSaved(), old = s.champions[key];
  if (old && (old.of ?? RACE_LAPS) === (c.of ?? RACE_LAPS) && raceScore(old) >= raceScore(c)) return;
  s.champions[key] = c;
  write(s);
}

export const championBrain = (c: SavedChampion): Brain => ({ layers: [...c.layers], w: new Float32Array(c.w) });
