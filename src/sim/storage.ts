import { Brain } from './brain';
import { SensorSpec } from './sensors';
import { RaceResult } from './score';
import type { TrackId } from './track';

/** The best brain a lab has found, kept in this browser so it survives a reload. */
export interface SavedChampion extends RaceResult {
  layers: number[];
  spec: SensorSpec;
  w: number[];
  /** level number it was trained in */
  level: number;
  /** name shown in menus, e.g. "Level 4 · 7 → 16 → 16 → 2" */
  name: string;
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

export function saveChampion(key: string, c: SavedChampion) {
  const s = loadSaved();
  s.champions[key] = c;
  write(s);
}

export const championBrain = (c: SavedChampion): Brain => ({ layers: [...c.layers], w: new Float32Array(c.w) });
