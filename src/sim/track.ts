import { HW } from './constants';

/** Track centerline spacing. */
const STEP = 10;
/** Corners are rounded off until no corner is tighter than this radius. */
const R_MIN = 56;
/** Parts of the track that are far apart along the road must be at least this far apart in space. */
export const MIN_SEPARATION = 2 * (HW + 14) + 4;
/** Lap length per real-world kilometre, so circuits keep their relative sizes. */
const UNITS_PER_KM = 650;

export interface Track {
  id: TrackId;
  name: string;
  country: string;
  /** one fun fact about the real circuit */
  fact: string;
  /** number of centerline samples */
  N: number;
  /** total lap length */
  L: number;
  CX: Float32Array; CY: Float32Array;
  /** road height (only bridges are raised) */
  Z: Float32Array;
  /** unit tangent */
  TX: Float32Array; TY: Float32Array;
  /** unit normal, pointing to the left wall */
  NX: Float32Array; NY: Float32Array;
  LX: Float32Array; LY: Float32Array;
  RX: Float32Array; RY: Float32Array;
  /** distance along the centerline from the start line */
  S: Float64Array;
  bounds: { x0: number; y0: number; x1: number; y1: number };
}

export type TrackId =
  | 'classic' | 'monza' | 'monaco' | 'silverstone' | 'spa' | 'suzuka'
  | 'interlagos' | 'montreal' | 'redbullring' | 'hungaroring' | 'zandvoort';

type Pt = [number, number];

interface TrackDef {
  name: string;
  country: string;
  fact: string;
  /** 'world' points are used as they are; 'map' points are a rough sketch on a 100 × 60 grid, scaled to `km` */
  frame: 'world' | 'map';
  km?: number;
  pts: Pt[];
  /** the road passes over itself here (control point index on the upper road) */
  bridge?: { ctrl: number; height: number };
}

/**
 * Simplified shapes inspired by famous Formula 1 circuits. They keep each circuit's overall
 * silhouette and its famous corners, but every corner is rounded so our cars can drive it.
 */
const DEFS: Record<TrackId, TrackDef> = {
  classic: {
    name: 'Brain Racers Ring', country: 'home track', fact: 'Our own track, where every level starts.', frame: 'world',
    pts: [[150, 520], [120, 330], [180, 150], [360, 90], [520, 160], [560, 300], [650, 370], [780, 310],
      [815, 175], [870, 115], [940, 140], [970, 270], [930, 470], [800, 565], [560, 565], [420, 490], [290, 570]],
  },
  monza: {
    name: 'Monza', country: 'Italy', km: 5.793, frame: 'map',
    fact: 'The "Temple of Speed": long straights and the highest average speed of any F1 track.',
    pts: [[20, 52], [45, 53], [66, 53], [72, 49], [80, 48], [88, 40], [91, 28], [88, 17], [80, 10], [70, 10], [60, 16],
      [50, 23], [40, 28], [30, 32], [18, 36], [8, 42], [7, 50], [13, 54]],
  },
  monaco: {
    name: 'Monaco', country: 'Monaco', km: 3.337, frame: 'map',
    fact: 'Raced on city streets. The slowest, twistiest race, with a famous hairpin and a tunnel.',
    pts: [[14, 48], [26, 42], [36, 38], [42, 30], [50, 20], [60, 13], [71, 13], [78, 21], [73, 28], [58, 33], [64, 40],
      [76, 41], [86, 45], [82, 53], [68, 56], [54, 56], [40, 58], [27, 60], [18, 57]],
  },
  silverstone: {
    name: 'Silverstone', country: 'United Kingdom', km: 5.891, frame: 'map',
    fact: 'Hosted the very first Formula 1 World Championship race, in 1950.',
    pts: [[60, 58], [44, 57], [30, 56], [22, 50], [16, 42], [22, 35], [14, 29], [15, 18], [24, 11], [32, 16], [38, 10],
      [52, 6], [60, 10], [66, 6], [73, 10], [92, 30], [93, 40], [84, 48], [72, 56]],
  },
  spa: {
    name: 'Spa-Francorchamps', country: 'Belgium', km: 7.004, frame: 'map',
    fact: 'The longest track in F1, home of the steep Eau Rouge climb.',
    pts: [[10, 24], [11, 12], [18, 7], [24, 13], [30, 20], [36, 15], [56, 8], [72, 6], [80, 12], [74, 20], [64, 24],
      [58, 32], [62, 42], [54, 48], [44, 50], [34, 56], [25, 52], [21, 42], [17, 34], [11, 30]],
  },
  suzuka: {
    name: 'Suzuka', country: 'Japan', km: 5.807, frame: 'map',
    fact: 'A figure-8: the track crosses over itself on a bridge.',
    pts: [[58, 52], [76, 52], [88, 46], [90, 36], [84, 24], [76, 20], [68, 22], [62, 18], [56, 22], [50, 30], [44, 38],
      [36, 46], [28, 52], [20, 47], [14, 40], [8, 30], [10, 20], [20, 14], [32, 16], [42, 22], [50, 30], [58, 38], [56, 46]],
    bridge: { ctrl: 20, height: 24 },
  },
  interlagos: {
    name: 'Interlagos', country: 'Brazil', km: 4.309, frame: 'map',
    fact: 'One of the few tracks raced anticlockwise.',
    pts: [[50, 6], [30, 6], [20, 10], [22, 18], [14, 25], [12, 35], [26, 46], [44, 54], [60, 56], [64, 46], [54, 40],
      [42, 34], [38, 24], [50, 20], [62, 28], [74, 34], [84, 26], [88, 16], [82, 8], [66, 5]],
  },
  montreal: {
    name: 'Montréal', country: 'Canada', km: 4.361, frame: 'map',
    fact: 'Built on an island. The last chicane has a wall nicknamed the "Wall of Champions".',
    pts: [[40, 38], [20, 38], [10, 34], [12, 24], [24, 22], [36, 24], [48, 20], [60, 22], [72, 20], [86, 22], [90, 30],
      [84, 36], [70, 38], [58, 36], [52, 40]],
  },
  redbullring: {
    name: 'Red Bull Ring', country: 'Austria', km: 4.318, frame: 'map',
    fact: 'Only a handful of corners and big hills: one of the shortest laps in F1.',
    pts: [[25, 50], [52, 50], [64, 44], [66, 32], [64, 14], [58, 6], [50, 12], [36, 24], [24, 28], [16, 24], [8, 30],
      [10, 40], [16, 46]],
  },
  hungaroring: {
    name: 'Hungaroring', country: 'Hungary', km: 4.381, frame: 'map',
    fact: 'Twisty and narrow, so overtaking is really hard.',
    pts: [[40, 52], [62, 54], [72, 46], [64, 38], [70, 30], [80, 22], [84, 12], [72, 8], [60, 12], [54, 20], [46, 16],
      [40, 24], [30, 20], [22, 26], [16, 36], [22, 44], [30, 48]],
  },
  zandvoort: {
    name: 'Zandvoort', country: 'Netherlands', km: 4.259, frame: 'map',
    fact: 'Next to the beach, with steeply banked corners.',
    pts: [[20, 50], [50, 50], [62, 48], [64, 36], [50, 36], [44, 30], [50, 20], [42, 12], [30, 12], [22, 18], [14, 26],
      [18, 34], [26, 40], [12, 44]],
  },
};

function catmull(ctrl: Pt[]): Pt[] {
  const dense: Pt[] = [], n = ctrl.length;
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return dense;
}

/** Evenly spaced points every STEP units around a closed polyline. */
function resample(line: Pt[]): Pt[] {
  const out: Pt[] = [line[0]];
  let carry = 0;
  for (let i = 1; i <= line.length; i++) {
    const a = line[i - 1], b = line[i % line.length];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let pos = STEP - carry;
    while (pos <= seg) {
      const t = pos / seg;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      pos += STEP;
    }
    carry = seg - (pos - STEP);
  }
  const last = out[out.length - 1];
  if (Math.hypot(last[0] - out[0][0], last[1] - out[0][1]) < STEP * 0.5) out.pop();
  return out;
}

/** Length of a polyline; `closed` adds the segment from the last point back to the first. */
function length(line: Pt[], closed = true) {
  let s = 0;
  for (let i = 0; i < line.length - (closed ? 0 : 1); i++) {
    const a = line[i], b = line[(i + 1) % line.length];
    s += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return s;
}

/** Round off every corner tighter than R_MIN by repeatedly pulling its points toward their neighbours. */
function smoothCorners(P: Pt[]): Pt[] {
  for (let it = 0; it < 600; it++) {
    const n = P.length, bad = new Uint8Array(n);
    let any = false;
    for (let i = 0; i < n; i++) {
      const a = P[(i - 2 + n) % n], b = P[i], c = P[(i + 2) % n];
      let d = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
      d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
      if (d > 1e-9 && (2 * STEP) / d < R_MIN) {
        any = true;
        for (let k = -4; k <= 4; k++) bad[(i + k + n) % n] = 1;
      }
    }
    if (!any) return P;
    const Q = P.map((p, i) => {
      if (!bad[i]) return p;
      const a = P[(i - 1 + n) % n], c = P[(i + 1) % n];
      return [0.5 * p[0] + 0.25 * (a[0] + c[0]), 0.5 * p[1] + 0.25 * (a[1] + c[1])] as Pt;
    });
    P = it % 5 === 4 ? resample(Q) : Q;
  }
  return P;
}

/** Height of the road: a bridge ramps up around `center` (a sample index). */
function bridgeProfile(n: number, center: number, height: number): Float32Array {
  const Z = new Float32Array(n), flat = 8, ramp = 16;
  for (let k = -(flat + ramp); k <= flat + ramp; k++) {
    const i = (center + k + n) % n, d = Math.abs(k);
    const t = d <= flat ? 1 : 1 - (d - flat) / ramp;
    Z[i] = height * t * t * (3 - 2 * t);
  }
  return Z;
}

/** Closest distance between parts of the track far apart along the road (bridges don't count). */
export function minSeparation(P: Pt[] | Track, Z?: Float32Array): number {
  const pts: Pt[] = Array.isArray(P) ? P : Array.from({ length: P.N }, (_, i) => [P.CX[i], P.CY[i]] as Pt);
  const z = Array.isArray(P) ? Z : P.Z;
  const n = pts.length;
  let min = Infinity;
  for (let i = 0; i < n; i += 2) for (let j = i + 1; j < n; j += 2) {
    const along = Math.min(j - i, n - (j - i));
    if (along < 25) continue;
    if (z && Math.abs(z[i] - z[j]) > 8) continue;
    min = Math.min(min, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
  }
  return min;
}

function buildTrack(id: TrackId): Track {
  const def = DEFS[id];
  let P: Pt[] = [];
  let Z = new Float32Array(0);
  if (def.frame === 'world') {
    P = smoothCorners(resample(catmull(def.pts)));
    Z = new Float32Array(P.length);
  } else {
    // scale the sketch so the lap is about the right length, then grow it until nothing overlaps
    const sketch = catmull(def.pts);
    let s = ((def.km ?? 4) * UNITS_PER_KM) / length(sketch);
    const xs = def.pts.map(p => p[0]), ys = def.pts.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const bridgeAt = def.bridge ? length(sketch.slice(0, def.bridge.ctrl * 40 + 1), false) / length(sketch) : 0;
    for (let tries = 0; tries < 15; tries++) {
      const scaled = def.pts.map(([x, y]) => [500 + (x - cx) * s, 320 + (y - cy) * s] as Pt);
      P = smoothCorners(resample(catmull(scaled)));
      Z = def.bridge ? bridgeProfile(P.length, Math.round(bridgeAt * P.length) % P.length, def.bridge.height) : new Float32Array(P.length);
      if (minSeparation(P, Z) > MIN_SEPARATION) break;
      s *= 1.08;
    }
  }
  P = resample(P);
  if (Z.length !== P.length) {
    const old = Z;
    Z = new Float32Array(P.length);
    for (let i = 0; i < P.length; i++) Z[i] = old[Math.min(old.length - 1, Math.round((i * old.length) / P.length))] ?? 0;
  }

  const N = P.length;
  const F = () => new Float32Array(N);
  const t: Track = {
    id, name: def.name, country: def.country, fact: def.fact,
    N, L: 0, CX: F(), CY: F(), Z, TX: F(), TY: F(), NX: F(), NY: F(), LX: F(), LY: F(), RX: F(), RY: F(), S: new Float64Array(N),
    bounds: { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
  };
  for (let i = 0; i < N; i++) { t.CX[i] = P[i][0]; t.CY[i] = P[i][1]; }
  for (let i = 0; i < N; i++) {
    const a = (i - 1 + N) % N, b = (i + 1) % N;
    let tx = t.CX[b] - t.CX[a], ty = t.CY[b] - t.CY[a];
    const m = Math.hypot(tx, ty); tx /= m; ty /= m;
    t.TX[i] = tx; t.TY[i] = ty; t.NX[i] = -ty; t.NY[i] = tx;
    t.LX[i] = t.CX[i] + t.NX[i] * HW; t.LY[i] = t.CY[i] + t.NY[i] * HW;
    t.RX[i] = t.CX[i] - t.NX[i] * HW; t.RY[i] = t.CY[i] - t.NY[i] * HW;
    if (i > 0) t.S[i] = t.S[i - 1] + Math.hypot(t.CX[i] - t.CX[i - 1], t.CY[i] - t.CY[i - 1]);
    const bd = t.bounds;
    bd.x0 = Math.min(bd.x0, t.CX[i] - HW); bd.x1 = Math.max(bd.x1, t.CX[i] + HW);
    bd.y0 = Math.min(bd.y0, t.CY[i] - HW); bd.y1 = Math.max(bd.y1, t.CY[i] + HW);
  }
  t.L = t.S[N - 1] + Math.hypot(t.CX[0] - t.CX[N - 1], t.CY[0] - t.CY[N - 1]);
  return t;
}

const cache = new Map<TrackId, Track>();
/** Tracks are built the first time they're needed. */
export function getTrack(id: TrackId): Track {
  let t = cache.get(id);
  if (!t) { t = buildTrack(id); cache.set(id, t); }
  return t;
}

export const TRACK_IDS = Object.keys(DEFS) as TrackId[];
export const F1_TRACK_IDS = TRACK_IDS.filter(id => id !== 'classic');
export const trackInfo = (id: TrackId) => ({ name: DEFS[id].name, country: DEFS[id].country, fact: DEFS[id].fact, km: DEFS[id].km });
/** The track every level uses unless it says otherwise. */
export const TRACK: Track = getTrack('classic');
