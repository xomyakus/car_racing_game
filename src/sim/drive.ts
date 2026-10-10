import { DT } from './constants';
import { TRACK, Track } from './track';
import { Brain } from './brain';
import { Car, lapCheck, newCar, physics, sense, stepAI } from './car';
import { BASIC, SensorSpec } from './sensors';
import type { SceneItem, SceneState } from './lab';

export interface Keys { up: boolean; down: boolean; left: boolean; right: boolean }
export interface HumanLap { t: number; bonks: number }
/** What the car felt and what the driver did at one moment. */
export interface Sample { inp: number[]; gas: number; steer: number }

/** A person drives with the arrow keys, optionally against a trained brain, optionally recording. */
export class Drive {
  keys: Keys = { up: false, down: false, left: false, right: false };
  human: Car;
  /** the lap clock starts on the first key press */
  started = false;
  rival: Car | null = null;
  laps: HumanLap[] = [];
  /** when set, every moment of driving is added here (for learning by copying) */
  recording: Sample[] | null = null;
  onEvent: ((msg: string, good?: boolean) => void) | null = null;
  onLap: ((t: number) => void) | null = null;
  private rivalBrain: { brain: Brain; spec: SensorSpec } | null = null;
  private acc = 0;

  constructor(public best: number | null, public track: Track = TRACK) {
    this.human = newCar(null, '#e2412a', BASIC, track);
  }

  setRival(r: { brain: Brain; spec: SensorSpec } | null) { this.rivalBrain = r; this.reset(); }
  setTrack(t: Track) { this.track = t; this.laps = []; this.reset(); }

  reset() {
    this.human = newCar(null, '#e2412a', BASIC, this.track);
    this.started = false;
    this.rival = this.rivalBrain ? newCar(this.rivalBrain.brain, '#2a66d9', this.rivalBrain.spec, this.track) : null;
  }

  advance(el: number) {
    this.acc += el;
    while (this.acc >= DT) { this.step(); this.acc -= DT; }
  }

  private step() {
    const h = this.human, k = this.keys, T = this.track;
    if (!this.started) {
      if (!(k.up || k.down || k.left || k.right)) { sense(h); return; }
      this.started = true;
    }
    if (this.rival) stepAI(this.rival, Infinity);
    if (h.crashT > 0) {
      // after a bonk the car waits a moment, then is put back on the road facing forward
      h.crashT -= DT; h.t += DT;
      if (h.crashT <= 0) {
        const i = h.idx;
        h.x = T.CX[i]; h.y = T.CY[i]; h.h = Math.atan2(T.TY[i], T.TX[i]); h.v = 0;
      }
      sense(h);
      return;
    }
    const gas = k.up ? 1 : k.down ? -1 : 0;
    const steer = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    this.recording?.push({ inp: Array.from(h.inp), gas, steer });
    h.gas = gas; h.steer = steer;
    const crashed = physics(h, gas, steer);
    sense(h);
    if (crashed) {
      h.bonks++; h.lapBonks++; h.crashT = 0.7; h.v = 0;
      this.onEvent?.('Bonk!');
      return;
    }
    const lt = lapCheck(h);
    if (lt !== null) {
      this.laps.unshift({ t: lt, bonks: h.lapBonks });
      if (this.laps.length > 6) this.laps.pop();
      h.lapBonks = 0;
      if (this.best === null || lt < this.best) { this.best = lt; this.onEvent?.(`New best lap! ${lt.toFixed(2)}s`, true); }
      else this.onEvent?.(`Lap ${lt.toFixed(2)}s`, true);
      this.onLap?.(lt);
    }
  }

  lapTime() { return this.started ? this.human.t - this.human.lapStart : 0; }

  sceneState(): SceneState {
    const items: SceneItem[] = [];
    if (this.rival) items.push({ car: this.rival, alpha: this.rival.alive ? 0.95 : 0.35, wreck: !this.rival.alive });
    const blink = this.human.crashT > 0 && Math.floor(this.human.crashT * 12) % 2 === 1;
    items.push({ car: this.human, alpha: blink ? 0.35 : 1, wreck: false });
    return { track: this.track, items, focus: this.human, rays: this.human, ring: null, look: null };
  }
}
