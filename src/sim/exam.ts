import { Brain } from './brain';
import { Car, newCar, progressPct, stepAI } from './car';
import { SensorSpec } from './sensors';
import { TestResult } from './score';
import { Track } from './track';

/** What a finished car achieved. */
export function carResult(c: Car, of: number): TestResult {
  return {
    pct: progressPct(c), raceTime: c.raceTime, of, t: c.t, dist: Math.max(0, c.maxProg),
    wobble: c.steps ? c.wobbleSum / c.steps : 0, lane: c.steps ? c.laneSum / c.steps : 0,
    bestLap: c.laps.length ? Math.min(...c.laps) : null,
  };
}

/** Add up the legs of a race on several tracks into one result. */
export function combine(legs: TestResult[], lapsPerTrack: number): TestResult {
  const all = legs.every(l => l.raceTime != null);
  const t = legs.reduce((s, l) => s + l.t, 0);
  const steps = (l: TestResult) => Math.max(l.t, 1e-6);
  return {
    pct: legs.reduce((s, l) => s + Math.min(lapsPerTrack * 100, l.pct), 0),
    raceTime: all ? legs.reduce((s, l) => s + (l.raceTime ?? 0), 0) : null,
    of: lapsPerTrack * legs.length,
    t,
    dist: legs.reduce((s, l) => s + l.dist, 0),
    wobble: legs.reduce((s, l) => s + l.wobble * steps(l), 0) / Math.max(t, 1e-6),
    lane: legs.reduce((s, l) => s + l.lane * steps(l), 0) / Math.max(t, 1e-6),
    bestLap: legs.reduce<number | null>((m, l) => (l.bestLap != null && (m == null || l.bestLap < m) ? l.bestLap : m), null),
  };
}

/** Race a brain once, off screen, and report how it did. */
export function examine(brain: Brain, spec: SensorSpec, track: Track, laps: number): TestResult {
  const c = newCar(brain, '#000', spec, track);
  while (c.alive) stepAI(c, laps);
  return carResult(c, laps);
}
