import { ACC, BRK, CAR_R, DRAG, DT, HW, LAP_LIMIT, RACE_LAPS, RAY_LEN, TURN, VMAX } from './constants';
import { TRACK, Track } from './track';
import { Brain, forward, gauss, makeActs } from './brain';
import { BASIC, BEND_LATER, BEND_SOON, SensorSpec, bendAhead, inputCount } from './sensors';

/** Why a test drive ended. */
export type EndReason = 'wall' | 'stuck' | 'back' | 'race' | 'time';

export interface Car {
  brain: Brain | null;
  spec: SensorSpec;
  track: Track;
  color: string;
  x: number; y: number; h: number; v: number;
  /** nearest centerline sample */
  idx: number;
  lap: number;
  /** distance along the track since the start (can exceed one lap) */
  prog: number;
  maxProg: number;
  /** sideways distance from the centerline, positive = toward the left wall */
  side: number;
  alive: boolean;
  /** ended without crashing (finished the race) */
  done: boolean;
  why: EndReason | null;
  /** seconds since the car started */
  t: number;
  lastT: number; lastP: number;
  lapStart: number;
  /** floor(prog / L) at the last lap check */
  fl: number;
  laps: number[];
  raceTime: number | null;
  rays: Float32Array;
  inp: Float32Array;
  acts: Float32Array[];
  gas: number; steer: number;
  /** driving-style totals, summed every step */
  steps: number; wobbleSum: number; laneSum: number;
  // human-driver extras
  bonks: number; lapBonks: number; crashT: number;
}

export function newCar(brain: Brain | null, color: string, spec: SensorSpec = BASIC, track: Track = TRACK, startIdx = 0, lat = 0): Car {
  const { N, CX, CY, NX, NY, TX, TY, L } = track;
  if (brain && brain.layers[0] !== inputCount(spec)) {
    throw new Error(`brain expects ${brain.layers[0]} inputs but the car feels ${inputCount(spec)}`);
  }
  const i = ((startIdx % N) + N) % N;
  const inp = new Float32Array(inputCount(spec));
  const acts = brain ? makeActs(brain.layers) : [inp];
  acts[0] = inp;
  const c: Car = {
    brain, spec, track, color,
    x: CX[i] + NX[i] * lat, y: CY[i] + NY[i] * lat, h: Math.atan2(TY[i], TX[i]), v: 0,
    idx: i, lap: startIdx < 0 ? -1 : 0, prog: 0, maxProg: 0, side: 0,
    alive: true, done: false, why: null,
    t: 0, lastT: 0, lastP: 0, lapStart: 0, fl: 0, laps: [], raceTime: null,
    rays: new Float32Array(spec.rays.length).fill(RAY_LEN), inp, acts,
    gas: 0, steer: 0, steps: 0, wobbleSum: 0, laneSum: 0, bonks: 0, lapBonks: 0, crashT: 0,
  };
  updateTrack(c);
  c.maxProg = c.lastP = c.prog;
  c.fl = Math.floor(c.prog / L);
  sense(c);
  return c;
}

/** Find the nearest centerline sample, update progress and return the sideways distance from the centerline. */
export function updateTrack(c: Car): number {
  const { N, CX, CY, TX, TY, NX, NY, S, L } = c.track;
  let best = Infinity, bi = c.idx;
  for (let k = -5; k <= 12; k++) {
    const i = (c.idx + k + N) % N, dx = c.x - CX[i], dy = c.y - CY[i], d = dx * dx + dy * dy;
    if (d < best) { best = d; bi = i; }
  }
  if (c.idx > N * 0.75 && bi < N * 0.25) c.lap++;
  else if (c.idx < N * 0.25 && bi > N * 0.75) c.lap--;
  c.idx = bi;
  const dx = c.x - CX[bi], dy = c.y - CY[bi];
  c.prog = c.lap * L + S[bi] + dx * TX[bi] + dy * TY[bi];
  c.side = dx * NX[bi] + dy * NY[bi];
  return Math.abs(c.side);
}

function hit(ox: number, oy: number, dx: number, dy: number, ax: number, ay: number, bx: number, by: number): number {
  const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex;
  if (den > -1e-9 && den < 1e-9) return Infinity;
  const wx = ax - ox, wy = ay - oy, t = (wx * ey - wy * ex) / den, u = (wx * dy - wy * dx) / den;
  return t > 0 && u >= 0 && u <= 1 ? t : Infinity;
}

/** Distance to the nearest wall along a ray, up to `len` (only walls near the car are checked). */
export function castRay(track: Track, ox: number, oy: number, dx: number, dy: number, idx: number, len = RAY_LEN): number {
  const { N, LX, LY, RX, RY } = track;
  const back = 20, ahead = Math.ceil(len / 10) + 14;
  let best = len;
  for (let k = -back; k <= ahead; k++) {
    const i = (idx + k + N) % N, j = (i + 1) % N;
    let t = hit(ox, oy, dx, dy, LX[i], LY[i], LX[j], LY[j]); if (t < best) best = t;
    t = hit(ox, oy, dx, dy, RX[i], RY[i], RX[j], RY[j]); if (t < best) best = t;
  }
  return best;
}

/** Fill c.inp with what the car feels right now (rays first, then the spec's features). */
export function sense(c: Car): void {
  const { spec, track } = c;
  const nr = spec.rays.length;
  let ahead = -1;
  for (let r = 0; r < nr; r++) {
    const ray = spec.rays[r], a = c.h + ray.angle;
    c.rays[r] = castRay(track, c.x, c.y, Math.cos(a), Math.sin(a), c.idx, ray.len);
    c.inp[r] = c.rays[r] / ray.len;
    if (Math.abs(ray.angle) < 1e-6) ahead = c.rays[r];
  }
  let k = nr;
  for (const f of spec.features) {
    let v = 0;
    switch (f) {
      case 'speed': v = c.v / VMAX; break;
      case 'direction': {
        let da = c.h - Math.atan2(track.TY[c.idx], track.TX[c.idx]);
        da = Math.atan2(Math.sin(da), Math.cos(da));
        v = Math.max(-1, Math.min(1, da / (Math.PI / 2)));
        break;
      }
      case 'bendSoon': v = bendAhead(track, c.idx, ...BEND_SOON); break;
      case 'bendLater': v = bendAhead(track, c.idx, ...BEND_LATER); break;
      case 'timeToCrash': {
        // seconds until the wall ahead at the current speed, 0..2 s scaled to 0..1 (1 = safe)
        const d = ahead >= 0 ? ahead : castRay(track, c.x, c.y, Math.cos(c.h), Math.sin(c.h), c.idx);
        v = Math.min(2, d / Math.max(c.v, 1)) / 2;
        break;
      }
      case 'brakeDist': v = Math.min(1, (c.v * c.v) / (2 * BRK) / RAY_LEN); break;
      case 'lane': v = Math.max(-1, Math.min(1, c.side / HW)); break;
      case 'lastGas': v = c.gas; break;
      case 'lastSteer': v = c.steer; break;
    }
    c.inp[k++] = v;
  }
  if (spec.noise > 0) for (let i = 0; i < c.inp.length; i++) c.inp[i] += gauss() * spec.noise;
}

export function think(c: Car): void {
  if (!c.brain) return;
  const prevSteer = c.steer;
  const out = forward(c.brain, c.acts);
  c.gas = out[0]; c.steer = out[1];
  c.wobbleSum += Math.abs(c.steer - prevSteer);
}

/** Move the car one time step. Returns true when it hit a wall. */
export function physics(c: Car, gas: number, steer: number): boolean {
  c.v += (gas >= 0 ? gas * ACC : gas * BRK) * DT;
  c.v -= c.v * DRAG * DT;
  if (c.v < 0) c.v = 0;
  if (c.v > VMAX) c.v = VMAX;
  c.h += steer * TURN * Math.min(1, c.v / 90) * DT;
  c.x += Math.cos(c.h) * c.v * DT;
  c.y += Math.sin(c.h) * c.v * DT;
  c.t += DT;
  const off = updateTrack(c);
  c.steps++; c.laneSum += off / HW;
  return off > HW - CAR_R;
}

/** Returns the lap time when the car just completed a lap, otherwise null. */
export function lapCheck(c: Car): number | null {
  const f = Math.floor(c.prog / c.track.L);
  if (f > c.fl) {
    let done: number | null = null;
    if (c.fl >= 0) { done = c.t - c.lapStart; c.laps.push(done); }
    c.lapStart = c.t;
    c.fl = f;
    return done;
  }
  return null;
}

/**
 * One time step for an AI car, including the race rules: a test ends on a wall hit,
 * standing still, turning around, a lap slower than LAP_LIMIT, or finishing `raceLaps` laps.
 */
export function stepAI(c: Car, raceLaps = RACE_LAPS): void {
  if (!c.alive) return;
  sense(c);
  think(c);
  const crashed = physics(c, c.gas, c.steer);
  if (c.prog > c.maxProg) c.maxProg = c.prog;
  if (crashed) return end(c, 'wall');
  if (c.prog > c.lastP + 10) { c.lastP = c.prog; c.lastT = c.t; }
  if (c.prog < c.maxProg - 60) return end(c, 'back');
  if (c.t - c.lastT > 1.5) return end(c, 'stuck');
  lapCheck(c);
  if (c.laps.length >= raceLaps) { c.raceTime = c.t; c.done = true; return end(c, 'race'); }
  if (c.t - c.lapStart > lapLimit(c.track)) return end(c, 'time');
}

function end(c: Car, why: EndReason) { c.alive = false; c.why = why; }

/** Slowest allowed lap: LAP_LIMIT seconds, or longer on long tracks (at least 100 units a second). */
export const lapLimit = (track: Track) => Math.max(LAP_LIMIT, track.L / 100);

/** How far the car got, in % of one lap (100 = one lap). */
export const progressPct = (c: Car) => Math.max(0, (c.maxProg / c.track.L) * 100);
