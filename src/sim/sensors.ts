import { RAY_ANGLES, RAY_LEN } from './constants';
import type { Track } from './track';

/** Extra numbers a car can feel besides its rays. */
export type FeatureId =
  | 'speed' | 'direction' | 'bendSoon' | 'bendLater'
  | 'timeToCrash' | 'brakeDist' | 'lane'
  | 'lastGas' | 'lastSteer';

export interface Ray {
  /** radians, negative = left */
  angle: number;
  len: number;
}

/** Everything that decides what the brain gets as input. */
export interface SensorSpec {
  rays: Ray[];
  features: FeatureId[];
  /** size of the random wobble added to every input (0 = perfect sensors) */
  noise: number;
}

export const FEATURE_LABEL: Record<FeatureId, string> = {
  speed: 'speed', direction: 'direction', bendSoon: 'bend soon', bendLater: 'bend later',
  timeToCrash: 'time to crash', brakeDist: 'brake distance', lane: 'lane position',
  lastGas: 'last gas', lastSteer: 'last steer',
};
/** Features that go from −1 to +1 instead of 0 to 1. */
export const SIGNED_FEATURES = new Set<FeatureId>(['direction', 'bendSoon', 'bendLater', 'lane', 'lastGas', 'lastSteer']);

export const DEFAULT_RAYS: Ray[] = RAY_ANGLES.map(angle => ({ angle, len: RAY_LEN }));
const DEFAULT_RAY_NAMES = ['far left', 'left', 'ahead', 'right', 'far right'];

export const BASIC: SensorSpec = { rays: DEFAULT_RAYS, features: ['speed', 'direction'], noise: 0 };
export const CORNERS: SensorSpec = { ...BASIC, features: ['speed', 'direction', 'bendSoon', 'bendLater'] };

export const withFeatures = (base: SensorSpec, extra: FeatureId[]): SensorSpec => ({ ...base, features: [...base.features, ...extra] });

export const isDefaultRays = (rays: Ray[]) =>
  rays.length === DEFAULT_RAYS.length && rays.every((r, i) => r.angle === DEFAULT_RAYS[i].angle && r.len === RAY_LEN);

export function rayLabel(r: Ray): string {
  const i = DEFAULT_RAYS.findIndex(d => Math.abs(d.angle - r.angle) < 1e-6);
  if (i >= 0) return DEFAULT_RAY_NAMES[i];
  const deg = Math.round((r.angle * 180) / Math.PI);
  return deg === 0 ? 'ahead' : deg < 0 ? `${-deg}° left` : `${deg}° right`;
}

export function inputLabels(spec: SensorSpec): string[] {
  const rays = isDefaultRays(spec.rays) ? DEFAULT_RAY_NAMES : spec.rays.map(rayLabel);
  return [...rays, ...spec.features.map(f => FEATURE_LABEL[f])];
}
export const inputCount = (spec: SensorSpec) => spec.rays.length + spec.features.length;
export const isSignedInput = (spec: SensorSpec, i: number) =>
  i >= spec.rays.length && SIGNED_FEATURES.has(spec.features[i - spec.rays.length]);
export const hasBends = (spec: SensorSpec) => spec.features.includes('bendSoon') || spec.features.includes('bendLater');

/** A short, stable text for a spec, used to keep labs apart. */
export const specKey = (spec: SensorSpec) =>
  `${spec.rays.map(r => `${Math.round((r.angle * 180) / Math.PI)}@${Math.round(r.len)}`).join(',')}|${spec.features.join(',')}|n${spec.noise}`;

/** Rays spread evenly over `spread` degrees (one ray points straight ahead). */
export function fanRays(count: number, spreadDeg: number, len: number): Ray[] {
  if (count === 1) return [{ angle: 0, len }];
  const spread = (spreadDeg * Math.PI) / 180;
  return Array.from({ length: count }, (_, i) => ({ angle: -spread / 2 + (spread * i) / (count - 1), len }));
}

/** Look-ahead windows in track samples (10 units each): soon = next 120 units, later = 120–300 units ahead. */
export const BEND_SOON: [number, number] = [0, 12];
export const BEND_LATER: [number, number] = [12, 30];

/**
 * How much the road turns between two points ahead of track sample `idx`.
 * −1 = sharp left (90° or more), +1 = sharp right, 0 = straight.
 */
export function bendAhead(track: Track, idx: number, from: number, to: number): number {
  const { N, TX, TY } = track;
  const a = (idx + from) % N, b = (idx + to) % N;
  let d = Math.atan2(TY[b], TX[b]) - Math.atan2(TY[a], TX[a]);
  d = Math.atan2(Math.sin(d), Math.cos(d));
  return Math.max(-1, Math.min(1, d / (Math.PI / 2)));
}

/** A short description of a sensor set-up compared with the basic 7 inputs, e.g. "3 rays over 90° · + time to crash · noise 0.1". */
export function sensorText(spec: SensorSpec): string {
  const parts: string[] = [];
  const basic = inputLabels(BASIC), mine = inputLabels(spec);
  const fanned = !isDefaultRays(spec.rays) && !spec.rays.every(r => DEFAULT_RAYS.some(d => Math.abs(d.angle - r.angle) < 1e-6 && d.len === r.len));
  if (fanned) {
    const a = spec.rays.map(r => r.angle), spread = Math.round(((Math.max(...a) - Math.min(...a)) * 180) / Math.PI);
    parts.push(`${spec.rays.length} ray${spec.rays.length > 1 ? 's' : ''}${spec.rays.length > 1 ? ` over ${spread}°` : ''}, ${Math.round(spec.rays[0].len)} long`);
  } else {
    const missing = basic.filter(l => !mine.includes(l));
    if (missing.length) parts.push(`without ${missing.join(', ')}`);
  }
  const extra = spec.features.filter(f => f !== 'speed' && f !== 'direction').map(f => FEATURE_LABEL[f]);
  if (fanned) {
    const gone = (['speed', 'direction'] as FeatureId[]).filter(f => !spec.features.includes(f));
    if (gone.length) parts.push(`without ${gone.join(', ')}`);
  }
  if (extra.length) parts.push(`+ ${extra.join(', ')}`);
  if (spec.noise > 0) parts.push(`noise ${spec.noise}`);
  return parts.join(' · ');
}
