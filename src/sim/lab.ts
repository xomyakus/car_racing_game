import { DT, RACE_LAPS } from './constants';
import { Brain, cloneBrain, mutate, randomBrain } from './brain';
import { Car, EndReason, newCar, stepAI } from './car';
import { BASIC, SensorSpec, hasBends } from './sensors';
import { RewardId, TestResult, rewardScore } from './score';
import { TRACK, Track } from './track';
import { carResult, combine } from './exam';

export type Origin = 'random' | 'child' | 'hand' | 'champion' | 'pop';
export type LabMode = 'single' | 'pop';
export type Speed = 1 | 5 | 20 | 'max';

/** One tested brain in "one at a time" mode. */
export interface Entry extends TestResult {
  no: number;
  brain: Brain;
  parent: number | null;
  origin: Origin;
  label?: string;
  /** the generation this brain was a child in */
  gen: GenRecord | null;
  why: EndReason | null;
  /** laps completed, all tracks together */
  laps: number;
  /** result on each training track */
  legs: TestResult[];
  /** how good the drive was under the lab's reward rule */
  score: number;
  counted: boolean;
  /** beat the best brain so far when it was tested */
  better: boolean;
}

/** One parent plus all children nudged from it; ends when some brain beats the parent. */
export interface GenRecord {
  n: number;
  parent: Entry;
  tried: number;
  /** sum of the children's distance (% of a lap, capped at the race length) */
  sum: number;
  next: Entry | null;
}

/** One dot on the "one at a time" chart. */
export interface HistPoint {
  pct: number;
  best: number;
  time: number | null;
  bestTime: number | null;
  kind: 'rnd' | 'kid' | 'up' | 'hand';
}

/** One generation of the "20 at once" mode. */
export interface PopGen {
  n: number;
  best: number;
  avg: number;
  bestTime: number | null;
  bestEver: number;
  bestEverTime: number | null;
  finished: number;
}

/** A brain driven on purpose under different conditions; never changes the training. */
export interface ExamRun { label: string; result: TestResult | null; why: EndReason | null }

export interface SceneItem { car: Car; alpha: number; wreck: boolean }
export interface SceneState {
  track: Track;
  items: SceneItem[];
  /** car the chase camera follows */
  focus: Car | null;
  /** car whose sensor rays are drawn */
  rays: Car | null;
  /** car marked as the leader */
  ring: Car | null;
  /** car whose corner look-ahead is drawn */
  look: Car | null;
}

export interface LabConfig {
  layers: number[];
  spec?: SensorSpec;
  /** every test drive races on each of these tracks in turn */
  tracks?: Track[];
  /** laps per track */
  raceLaps?: number;
  reward?: RewardId;
}

export const POP = 20;
const PARENTS = 5;
export const ORIGIN_COLOR: Record<Origin, string> = {
  random: '#8a5cf0', child: '#2a66d9', hand: '#e2412a', champion: '#1d9a52', pop: '#2a66d9',
};
const popColor = (i: number) => `hsl(${Math.round((i * 360) / POP + 8) % 360}, 78%, 52%)`;

/**
 * The training lab for one network shape and one set of senses. Brains are only ever
 * improved by evolution: test a brain, keep the best, try nudged copies of it.
 */
export class Lab {
  readonly layers: number[];
  readonly spec: SensorSpec;
  readonly tracks: Track[];
  readonly raceLaps: number;
  readonly reward: RewardId;

  mode: LabMode = 'single';
  /** single: start the next child automatically; pop: keep running generations */
  auto = false;
  /** frozen: nothing moves until resumed */
  paused = false;
  speed: Speed = 1;

  list: Entry[] = [];
  best: Entry | null = null;
  car: Car | null = null;
  /** the brain the current test car is driving with */
  current: Entry | null = null;
  /** which training track the current test is on */
  leg = 0;
  stats = { randoms: 0, early: 0, kids: 0, better: 0, fails: 0, laps: 0, finishers: 0 };
  /** test drives finished so far (each car in a 20-car race counts as one) */
  testsDone = 0;
  gens: GenRecord[] = [];
  curGen: GenRecord | null = null;
  hist: HistPoint[] = [];
  exam: ExamRun | null = null;
  exams: ExamRun[] = [];

  pop: Car[] = [];
  popGen = 0;
  popLeg = 0;
  popHist: PopGen[] = [];
  popLog: { g: number; text: string; big?: boolean }[] = [];

  /** shown as toasts */
  onEvent: ((msg: string, good?: boolean) => void) | null = null;
  /** called whenever a new best brain is found */
  onBest: ((e: Entry) => void) | null = null;
  /** the brain with the fastest single lap so far (not always the best racer) */
  fastestLap: Entry | null = null;
  /** called whenever a brain sets a new fastest lap */
  onFastLap: ((e: Entry) => void) | null = null;

  private no = 0;
  private wait = 0;
  private acc = 0;
  private legResults: TestResult[] = [];
  private legWhys: EndReason[] = [];
  private legLaps = 0;
  private popBrains: Brain[] = [];
  private popResults: { r: TestResult[]; why: EndReason[]; laps: number }[] = [];

  constructor(cfg: LabConfig) {
    this.layers = cfg.layers;
    this.spec = cfg.spec ?? BASIC;
    this.tracks = cfg.tracks?.length ? cfg.tracks : [TRACK];
    this.raceLaps = cfg.raceLaps ?? RACE_LAPS;
    this.reward = cfg.reward ?? 'race';
  }

  /** laps in a whole test drive, all tracks together */
  get totalLaps() { return this.raceLaps * this.tracks.length; }
  private cap(p: number) { return Math.min(this.totalLaps * 100, p); }
  private score(r: TestResult) { return rewardScore(this.reward, r); }

  /** Nudges grow while children keep failing to beat the parent. */
  nudgeSize() { return 0.35 * Math.min(3, 1 + 0.2 * this.stats.fails); }

  // ---------- one at a time ----------
  newRandom() { this.setMode('single'); this.start(this.addEntry(randomBrain(this.layers), 'random', null)); }
  nudgeBest() {
    this.setMode('single');
    if (!this.best) return this.newRandom();
    this.start(this.addEntry(mutate(this.best.brain, this.nudgeSize()), 'child', this.best));
  }
  testBrain(brain: Brain, origin: 'hand' | 'champion', label: string) {
    this.setMode('single');
    this.start(this.addEntry(cloneBrain(brain), origin, null, label));
  }
  replay(e: Entry) { this.setMode('single'); e.why = null; this.start(e); }

  /** Drive the best brain once under other conditions (another track, noisier sensors). Training is not affected. */
  watch(label: string, track: Track, spec: SensorSpec = this.spec) {
    if (!this.best) return;
    this.setMode('single');
    this.auto = false;
    this.paused = false;
    this.current = null;
    this.exam = { label, result: null, why: null };
    this.car = newCar(this.best.brain, ORIGIN_COLOR.champion, spec, track);
  }

  private addEntry(brain: Brain, origin: Origin, parent: Entry | null, label?: string): Entry {
    const e: Entry = {
      no: ++this.no, brain, parent: parent ? parent.no : null, origin, label,
      gen: parent ? this.curGen : null, pct: 0, raceTime: null, of: this.totalLaps, t: 0, dist: 0, wobble: 0, lane: 0,
      why: null, laps: 0, legs: [], score: 0, counted: false, better: false,
    };
    this.list.unshift(e);
    if (this.list.length > 150) this.list.pop();
    return e;
  }
  private start(e: Entry) {
    this.paused = false;
    this.current = e;
    this.exam = null;
    this.leg = 0;
    this.legResults = []; this.legWhys = []; this.legLaps = 0;
    this.wait = 0;
    this.startLeg();
  }
  private startLeg() {
    this.car = newCar(this.current!.brain, ORIGIN_COLOR[this.current!.origin], this.spec, this.tracks[this.leg]);
  }
  /** The current test car stopped: next track, or score the whole test. */
  private legDone(c: Car) {
    if (this.exam) {
      this.exam.result = carResult(c, this.raceLaps);
      this.exam.why = c.why;
      this.exams.unshift(this.exam);
      if (this.exams.length > 12) this.exams.pop();
      this.exam = null;
      return;
    }
    this.legResults.push(carResult(c, this.raceLaps));
    this.legWhys.push(c.why!);
    this.legLaps += c.laps.length;
    if (this.leg + 1 < this.tracks.length) { this.leg++; this.startLeg(); return; }
    this.finishTest();
  }
  private finishTest() {
    const e = this.current;
    if (!e) return;
    Object.assign(e, combine(this.legResults, this.raceLaps));
    e.legs = this.legResults;
    e.why = this.legWhys.find(w => w !== 'race') ?? 'race';
    e.laps = this.legLaps;
    e.score = this.score(e);
    if (!e.counted) {
      e.counted = true;
      this.testsDone++;
      const s = this.stats;
      if (e.origin === 'child') {
        s.kids++;
        if (this.best && e.score > this.best.score) { e.better = true; s.better++; s.fails = 0; } else s.fails++;
      } else if (e.origin === 'random') { s.randoms++; if (e.pct < 10) s.early++; }
      if (e.laps && !s.laps) this.onEvent?.('First full lap!', true);
      if (e.laps) s.laps++;
      if (e.raceTime != null && !s.finishers++) this.onEvent?.('Finished the whole race!', true);
      if (e.gen) { e.gen.tried++; e.gen.sum += this.cap(e.pct); }
    }
    this.considerBest(e);
    this.considerLap(e);
    if (this.hist.length < 5000) {
      this.hist.push({
        pct: this.cap(e.pct), best: this.cap(this.best!.pct), time: e.raceTime, bestTime: this.best!.raceTime,
        kind: e.origin === 'child' ? (e.better ? 'up' : 'kid') : e.origin === 'random' ? 'rnd' : 'hand',
      });
    }
  }
  private considerLap(e: Entry) {
    if (e.bestLap == null || (this.fastestLap?.bestLap != null && e.bestLap >= this.fastestLap.bestLap)) return;
    this.fastestLap = e;
    this.onFastLap?.(e);
  }
  /** A new best brain becomes the parent and starts a new generation. */
  private considerBest(e: Entry) {
    if (this.best && e.score <= this.best.score) return;
    if (this.curGen) this.curGen.next = e;
    this.best = e;
    this.curGen = { n: this.gens.length + 1, parent: e, tried: 0, sum: 0, next: null };
    this.gens.push(this.curGen);
    this.onBest?.(e);
  }
  private stepSingle() {
    const c = this.car;
    if (!c) { if (this.auto) this.nudgeBest(); return; }
    if (!c.alive) {
      if (this.auto) { this.wait += DT; if (this.wait > 0.7) this.nudgeBest(); }
      return;
    }
    stepAI(c, this.raceLaps);
    if (!c.alive) this.legDone(c);
  }

  // ---------- 20 at once ----------
  setMode(m: LabMode) {
    if (this.mode === m) return;
    this.mode = m;
    this.auto = false;
    if (m === 'pop' && !this.pop.length) this.seedPop();
  }
  /** Start from the best brain so far if there is one, otherwise from 20 random brains. */
  seedPop() {
    const b = this.best?.brain;
    this.startPopGen(Array.from({ length: POP }, (_, i) => (b ? (i === 0 ? cloneBrain(b) : mutate(b, 0.35)) : randomBrain(this.layers))));
  }
  private startPopGen(brains: Brain[]) {
    this.popBrains = brains;
    this.popResults = brains.map(() => ({ r: [], why: [], laps: 0 }));
    this.popLeg = 0;
    this.popGen++;
    this.startPopLeg();
  }
  private startPopLeg() {
    this.pop = this.popBrains.map((b, i) => newCar(b, popColor(i), this.spec, this.tracks[this.popLeg]));
  }
  private stepPop() {
    let any = false;
    for (const c of this.pop) if (c.alive) { stepAI(c, this.raceLaps); if (c.alive) any = true; }
    if (any) return;
    this.pop.forEach((c, i) => {
      const pr = this.popResults[i];
      pr.r.push(carResult(c, this.raceLaps)); pr.why.push(c.why!); pr.laps += c.laps.length;
    });
    if (this.popLeg + 1 < this.tracks.length) { this.popLeg++; this.startPopLeg(); return; }
    this.endPopGen();
  }
  private endPopGen() {
    this.testsDone += this.popBrains.length;
    const res = this.popBrains.map((b, i) => {
      const pr = this.popResults[i], r = combine(pr.r, this.raceLaps);
      return { b, r, legs: pr.r, why: pr.why.find(w => w !== 'race') ?? 'race', laps: pr.laps, s: this.score(r) };
    });
    res.sort((a, b) => b.s - a.s);
    const top = res[0];
    const fin = res.filter(x => x.r.raceTime != null);
    const avg = res.reduce((s, x) => s + this.cap(x.r.pct), 0) / res.length;
    const prevBest = this.best;
    if (!this.best || top.s > this.best.score) {
      const e = this.addEntry(cloneBrain(top.b), 'pop', null, `gen ${this.popGen} winner`);
      Object.assign(e, top.r, { legs: top.legs, why: top.why, laps: top.laps, score: top.s, counted: true });
      this.considerBest(e);
    }
    const quick = res.filter(x => x.r.bestLap != null).sort((a, b) => a.r.bestLap! - b.r.bestLap!)[0];
    if (quick && (this.fastestLap?.bestLap == null || quick.r.bestLap! < this.fastestLap.bestLap)) {
      const e = this.addEntry(cloneBrain(quick.b), 'pop', null, `gen ${this.popGen} fastest lap`);
      Object.assign(e, quick.r, { legs: quick.legs, why: quick.why, laps: quick.laps, score: quick.s, counted: true });
      this.considerLap(e);
    }
    const g = this.popGen, best = this.best!;
    if (g === 1) this.log(`Most crashed right away. The best one got ${Math.min(100, top.r.pct).toFixed(0)}% of a lap.`);
    if (top.laps && !this.popHist.some(p => p.best >= 100)) this.log('First full lap!', true);
    if (fin.length && !this.popHist.some(p => p.finished > 0)) { this.log('First car to finish the whole race!', true); this.onEvent?.('Finished the whole race!', true); }
    else if (best !== prevBest && best.raceTime != null && prevBest?.raceTime != null) this.log(`New record: ${best.raceTime.toFixed(1)}s (${fin.length} of ${POP} finished)`);
    else if (best !== prevBest && best.raceTime == null && g > 1) this.log(`Got further: ${this.cap(top.r.pct).toFixed(0)}% of a lap`);
    this.popHist.push({
      n: g, best: this.cap(top.r.pct), avg, bestTime: fin.length ? Math.min(...fin.map(x => x.r.raceTime!)) : null,
      bestEver: this.cap(best.pct), bestEverTime: best.raceTime, finished: fin.length,
    });
    if (this.popHist.length > 3000) this.popHist.shift();
    // the winner races again unchanged; the other 19 are nudged copies of the top 5 (better parents get more children)
    const parents = res.slice(0, PARENTS).map(x => x.b);
    const next: Brain[] = [cloneBrain(parents[0])];
    const wsum = (PARENTS * (PARENTS + 1)) / 2;
    while (next.length < POP) {
      let r = Math.random() * wsum, k = 0;
      while (r > PARENTS - k) { r -= PARENTS - k; k++; }
      next.push(mutate(parents[Math.min(k, PARENTS - 1)], 0.35));
    }
    this.startPopGen(next);
  }
  private log(text: string, big?: boolean) {
    this.popLog.unshift({ g: this.popGen, text, big });
    if (this.popLog.length > 8) this.popLog.pop();
  }

  // ---------- running ----------
  /** Is there anything to simulate right now? */
  busy() { return !this.paused && (this.mode === 'pop' ? this.auto : this.auto || !!this.car?.alive); }

  /** Evolution: keep testing nudged copies of the best brain. */
  startEvolution() { this.setMode('single'); this.auto = true; this.paused = false; }
  /** Test exactly one more brain, then stop. */
  oneStep() { this.auto = false; this.nudgeBest(); }

  advance(el: number) {
    if (!this.busy()) { this.acc = 0; return; }
    const step = this.mode === 'pop' ? () => this.stepPop() : () => this.stepSingle();
    if (this.speed === 'max') {
      const t0 = performance.now();
      do step(); while (performance.now() - t0 < 12 && this.busy());
      this.acc = 0;
    } else {
      this.acc += el;
      while (this.acc >= DT) { for (let k = 0; k < this.speed; k++) step(); this.acc -= DT; }
    }
  }

  focus(): Car | null {
    if (this.mode === 'single') return this.car;
    return leader(this.pop);
  }

  sceneState(): SceneState {
    const look = (c: Car | null) => (c && c.alive && hasBends(c.spec) ? c : null);
    if (this.mode === 'single') {
      const c = this.car;
      if (!c) return { track: this.tracks[0], items: [], focus: null, rays: null, ring: null, look: null };
      const ok = c.alive || c.done;
      return { track: c.track, items: [{ car: c, alpha: ok ? 1 : 0.55, wreck: !ok }], focus: c, rays: c.alive ? c : null, ring: null, look: look(c) };
    }
    const lead = leader(this.pop);
    const items: SceneItem[] = [];
    for (const c of this.pop) if (c !== lead) items.push({ car: c, alpha: c.alive ? 0.95 : c.done ? 0.6 : 0.25, wreck: !c.alive && !c.done });
    if (lead) items.push({ car: lead, alpha: 1, wreck: !lead.alive && !lead.done });
    return { track: this.tracks[this.popLeg] ?? this.tracks[0], items, focus: lead, rays: lead?.alive ? lead : null, ring: lead, look: look(lead) };
  }
}

/** The car furthest along that is still driving, or the one that got furthest if all have stopped. */
export function leader(cars: Car[]): Car | null {
  let best: Car | null = null;
  for (const c of cars) if (c.alive && (!best || c.prog > best.prog)) best = c;
  if (!best) {
    for (const c of cars) {
      const score = (x: Car) => (x.raceTime != null ? 1e6 - x.raceTime : x.maxProg);
      if (!best || score(c) > score(best)) best = c;
    }
  }
  return best;
}
