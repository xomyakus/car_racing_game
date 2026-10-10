import { describe, expect, it } from 'vitest';
import { HW } from './constants';
import { MIN_SEPARATION, TRACK_IDS, getTrack, minSeparation } from './track';
import { newCar, stepAI } from './car';

/** Tightest corner radius, measured over 20 units of road. */
function minRadius(id: (typeof TRACK_IDS)[number]) {
  const t = getTrack(id);
  let min = Infinity;
  for (let i = 0; i < t.N; i++) {
    const a = (i - 1 + t.N) % t.N, b = (i + 1) % t.N;
    let d = Math.atan2(t.TY[b], t.TX[b]) - Math.atan2(t.TY[a], t.TX[a]);
    d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
    if (d > 1e-6) min = Math.min(min, 20 / d);
  }
  return min;
}

describe('tracks', () => {
  for (const id of TRACK_IDS) {
    it(`${id}: road never overlaps itself, gravel included (bridges excepted)`, () => {
      expect(minSeparation(getTrack(id))).toBeGreaterThan(MIN_SEPARATION);
    });
    it(`${id}: corners are wider than half the road plus the curb, so the walls don't fold`, () => {
      expect(minRadius(id)).toBeGreaterThan(HW + 8);
    });
    it(`${id}: a careful hand-made driver can get round`, () => {
      const gas = [0, 0, 2.2, 0, 0, -2.2, 0, -0.3], steer = [-1.5, -1, 0, 1, 1.5, 0, -1, 0];
      const c = newCar({ layers: [7, 2], w: new Float32Array([...gas, ...steer]) }, 'x', undefined, getTrack(id));
      while (c.alive) stepAI(c, 1);
      expect(c.why).toBe('race');
    });
  }
});
