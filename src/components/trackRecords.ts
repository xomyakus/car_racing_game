import { useEffect, useState } from 'react';
import { betterChampion, loadSaved } from '../sim/storage';
import { countedLap, raceScore } from '../sim/score';
import { RACE_LAPS } from '../sim/constants';
import type { TrackId } from '../sim/track';

export interface TrackRecords {
  /** best finished brain race on this track (standard race length) */
  race: { time: number; level: number } | null;
  /** fastest counted lap on this track: brains that finished, or you */
  lap: { time: number; who: string } | null;
  /** where this level's saved brain stands in the track's championship, if it has one */
  place: number | null;
}

function read(track: TrackId, key: string | null): TrackRecords {
  const s = loadSaved();
  const here = Object.values(s.champions).filter(c => (c.track ?? 'classic') === track);
  const races = here.filter(c => c.raceTime != null && (c.of ?? RACE_LAPS) === RACE_LAPS).sort((a, b) => raceScore(b) - raceScore(a));
  let lap: TrackRecords['lap'] = null;
  for (const c of here) {
    const l = countedLap(c);
    if (l != null && (!lap || l < lap.time)) lap = { time: l, who: `level ${c.level}` };
  }
  const you = s.humanBest[track];
  if (you != null && (!lap || you < lap.time)) lap = { time: you, who: 'you' };
  // same order as the championship leaderboard: fastest counted lap, then how far it got; your laps count too
  const mine = key ? s.champions[key] : undefined;
  let place: TrackRecords['place'] = null;
  if (mine && (mine.track ?? 'classic') === track) {
    const myLap = countedLap(mine);
    const ahead = here.filter(c => c !== mine && betterChampion(c, mine)).length
      + (you != null && (myLap == null || you < myLap) ? 1 : 0);
    place = ahead + 1;
  }
  return { race: races[0] ? { time: races[0].raceTime!, level: races[0].level } : null, lap, place };
}

/** "1st", "2nd", "3rd", "11th", "22nd"… */
export function ordinal(n: number): string {
  const t = n % 100, o = n % 10;
  return `${n}${t >= 11 && t <= 13 ? 'th' : o === 1 ? 'st' : o === 2 ? 'nd' : o === 3 ? 'rd' : 'th'}`;
}

/**
 * The championship records for one track, re-read every couple of seconds while training saves new ones.
 * `key` is the champion saved by this level, to find its place.
 */
export function useTrackRecords(track: TrackId | null, key: string | null = null): TrackRecords | null {
  const [rec, setRec] = useState<TrackRecords | null>(() => (track ? read(track, key) : null));
  useEffect(() => {
    if (!track) { setRec(null); return; }
    setRec(read(track, key));
    const id = setInterval(() => setRec(read(track, key)), 2000);
    return () => clearInterval(id);
  }, [track, key]);
  return rec;
}
