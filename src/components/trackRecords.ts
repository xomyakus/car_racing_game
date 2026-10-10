import { useEffect, useState } from 'react';
import { loadSaved } from '../sim/storage';
import { countedLap, raceScore } from '../sim/score';
import { RACE_LAPS } from '../sim/constants';
import type { TrackId } from '../sim/track';

export interface TrackRecords {
  /** best finished brain race on this track (standard race length) */
  race: { time: number; level: number } | null;
  /** fastest counted lap on this track: brains that finished, or you */
  lap: { time: number; who: string } | null;
}

function read(track: TrackId): TrackRecords {
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
  return { race: races[0] ? { time: races[0].raceTime!, level: races[0].level } : null, lap };
}

/** The championship records for one track, re-read every couple of seconds while training saves new ones. */
export function useTrackRecords(track: TrackId | null): TrackRecords | null {
  const [rec, setRec] = useState<TrackRecords | null>(() => (track ? read(track) : null));
  useEffect(() => {
    if (!track) { setRec(null); return; }
    setRec(read(track));
    const id = setInterval(() => setRec(read(track)), 2000);
    return () => clearInterval(id);
  }, [track]);
  return rec;
}
