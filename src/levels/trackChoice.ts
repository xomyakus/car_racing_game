import { useEffect, useState } from 'react';
import type { TrackId } from '../sim/track';

// Which track each level is testing on. Kept outside React so every part of a level
// (the lab, comparison tables) sees the same choice, and it survives leaving the level.
const choice = new Map<number, TrackId>();
const listeners = new Set<() => void>();

export function useLevelTrack(level: number): [TrackId, (t: TrackId) => void] {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force(x => x + 1);
    listeners.add(f);
    return () => { listeners.delete(f); };
  }, []);
  const set = (t: TrackId) => { choice.set(level, t); listeners.forEach(f => f()); };
  return [choice.get(level) ?? 'classic', set];
}

/** Lab key for a set-up on a track; the home track keeps the plain key. */
export const withTrack = (key: string, t: TrackId) => (t === 'classic' ? key : `${key}@${t}`);
/** The set-up part of a lab key, without the track. */
export const baseKey = (key: string) => key.split('@')[0];
