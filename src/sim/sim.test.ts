import { describe, expect, it } from 'vitest';
import { forward, layerOffsets, makeActs, mutate, randomBrain, weightCount, weightIndex } from './brain';
import { TRACK } from './track';
import { CORNERS, bendAhead, inputCount } from './sensors';
import { newCar, progressPct, stepAI } from './car';
import { raceScore, resultText, pctText } from './score';
import { Lab } from './lab';
import { RACE_LAPS } from './constants';

// a seeded random generator so tests are repeatable
function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

describe('brain', () => {
  it('counts weights including one bias per neuron', () => {
    expect(weightCount([7, 2])).toBe(16);
    expect(weightCount([7, 8, 2])).toBe(82);
    expect(weightCount([7, 16, 16, 2])).toBe(434);
    expect(weightCount([9, 16, 16, 2])).toBe(466);
  });

  it('computes a perceptron as tanh(weights · inputs + bias)', () => {
    const b = { layers: [2, 1], w: new Float32Array([0.5, -1, 0.25]) };
    const acts = makeActs(b.layers);
    acts[0].set([1, 0.5]);
    expect(forward(b, acts)[0]).toBeCloseTo(Math.tanh(0.5 - 0.5 + 0.25), 6);
  });

  it('indexes weights neuron by neuron with the bias last', () => {
    const layers = [3, 2], off = layerOffsets(layers);
    expect(weightIndex(layers, off, 0, 0, 3)).toBe(3);
    expect(weightIndex(layers, off, 0, 1, 0)).toBe(4);
  });

  it('keeps every output between -1 and +1', () => {
    const b = randomBrain([7, 16, 16, 2], rng(1));
    const acts = makeActs(b.layers);
    acts[0].set([1, 1, 1, 1, 1, 1, 1]);
    for (const v of forward(b, acts)) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });

  it('mutates a copy and leaves the parent alone', () => {
    const p = randomBrain([7, 8, 2], rng(2));
    const before = Array.from(p.w);
    const c = mutate(p, 0.35, 0.5, rng(3));
    expect(Array.from(p.w)).toEqual(before);
    expect(Array.from(c.w)).not.toEqual(before);
  });
});

describe('track', () => {
  it('is a closed loop sampled about every 10 units', () => {
    expect(TRACK.N).toBeGreaterThan(200);
    expect(TRACK.L / TRACK.N).toBeGreaterThan(9.5);
    expect(TRACK.L / TRACK.N).toBeLessThan(10.5);
  });

  it('measures bends ahead as numbers between -1 and +1', () => {
    for (let i = 0; i < TRACK.N; i += 7) {
      const b = bendAhead(TRACK, i, 0, 12);
      expect(b).toBeGreaterThanOrEqual(-1);
      expect(b).toBeLessThanOrEqual(1);
    }
    expect(inputCount(CORNERS)).toBe(9);
  });
});

describe('race rules', () => {
  it('ends a test when the car stands still', () => {
    // a brain that always brakes: every weight 0, gas bias -2
    const w = new Float32Array(16); w[7] = -2;
    const c = newCar({ layers: [7, 2], w }, 'x');
    while (c.alive) stepAI(c);
    expect(c.why).toBe('stuck');
    expect(progressPct(c)).toBeLessThan(1);
  });

  it('lets the hand-made example perceptrons finish all laps', () => {
    const gas = [0, 0, 2.2, 0, 0, -1.6, 0, -0.2], steer = [-1.5, -1, 0, 1, 1.5, 0, -1, 0];
    const c = newCar({ layers: [7, 2], w: new Float32Array([...gas, ...steer]) }, 'x');
    while (c.alive) stepAI(c);
    expect(c.why).toBe('race');
    expect(c.laps.length).toBe(RACE_LAPS);
    expect(c.raceTime).toBeGreaterThan(0);
  });

  it('ranks by distance first, then by race time', () => {
    const slowFinish = { pct: 1000, raceTime: 150 }, fastFinish = { pct: 1000, raceTime: 90 }, nearly = { pct: 990, raceTime: null };
    expect(raceScore(fastFinish)).toBeGreaterThan(raceScore(slowFinish));
    expect(raceScore(slowFinish)).toBeGreaterThan(raceScore(nearly));
    expect(raceScore({ pct: 40, raceTime: null })).toBeGreaterThan(raceScore({ pct: 30, raceTime: null }));
    expect(resultText(fastFinish)).toBe('10 laps, 90.0s');
    expect(pctText(34)).toBe('34%');
    expect(pctText(340)).toBe('3.4 laps');
  });
});

describe('lab', () => {
  it('starts a new generation whenever a better brain is found', () => {
    const lab = new Lab({ layers: [7, 2] });
    lab.auto = true;
    for (let i = 0; i < 20000; i++) (lab as unknown as { stepSingle(): void }).stepSingle();
    expect(lab.best).not.toBeNull();
    expect(lab.gens.length).toBeGreaterThan(0);
    // each generation's parent is better than the one before
    for (let g = 1; g < lab.gens.length; g++) expect(lab.gens[g].parent.score).toBeGreaterThan(lab.gens[g - 1].parent.score);
    // every finished test drive is counted, for the championship
    expect(lab.testsDone).toBe(lab.hist.length);
  });

  it('runs a population generation of 20 cars', () => {
    const lab = new Lab({ layers: [7, 8, 2] });
    lab.setMode('pop');
    expect(lab.pop.length).toBe(20);
    lab.auto = true;
    for (let i = 0; i < 200000 && lab.popGen < 2; i++) (lab as unknown as { stepPop(): void }).stepPop();
    expect(lab.popGen).toBe(2);
    expect(lab.popHist.length).toBe(1);
  });
});

describe('copycat (supervised learning)', () => {
  it('learns to copy a simple rule from examples', async () => {
    const { Copycat } = await import('./train');
    const r = rng(9);
    // rule: steer toward the side with more room, gas when the road ahead is open
    const data = Array.from({ length: 400 }, () => {
      const inp = Array.from({ length: 7 }, () => r());
      return { inp, gas: inp[2] > 0.5 ? 1 : -1, steer: inp[4] > inp[0] ? 1 : -1 };
    });
    const cc = new Copycat([7, 8, 2]);
    for (let e = 0; e < 40; e++) cc.epoch(data);
    expect(cc.lossHist[cc.lossHist.length - 1]).toBeLessThan(cc.lossHist[0]);
    expect(cc.agreement(data)).toBeGreaterThan(0.85);
  });
});

describe('part 2 set-ups', () => {
  it('races every training track in turn and adds the results up', async () => {
    const { getTrack } = await import('./track');
    const lab = new Lab({ layers: [7, 2], tracks: [getTrack('monaco'), getTrack('monza')], raceLaps: 1 });
    const gas = [0, 0, 2.2, 0, 0, -2.2, 0, -0.3], steer = [-1.5, -1, 0, 1, 1.5, 0, -1, 0];
    lab.testBrain({ layers: [7, 2], w: new Float32Array([...gas, ...steer]) }, 'hand', 'careful');
    for (let i = 0; i < 100000 && lab.car?.alive; i++) (lab as unknown as { stepSingle(): void }).stepSingle();
    const e = lab.list[0];
    expect(e.legs.length).toBe(2);
    expect(e.of).toBe(2);
    expect(e.raceTime).toBeCloseTo(e.legs[0].raceTime! + e.legs[1].raceTime!, 6);
  });

  it('scores the same drive differently under different rewards', async () => {
    const { rewardScore } = await import('./score');
    const slowCrawl = { pct: 300, raceTime: null, of: 10, t: 120, dist: 8000, wobble: 0.02, lane: 0.1 };
    const kamikaze = { pct: 8, raceTime: null, of: 10, t: 0.9, dist: 220, wobble: 0.5, lane: 0.6 };
    expect(rewardScore('survive', slowCrawl)).toBeGreaterThan(rewardScore('survive', kamikaze));
    expect(rewardScore('avgSpeed', kamikaze)).toBeGreaterThan(rewardScore('avgSpeed', slowCrawl));
    expect(rewardScore('smooth', slowCrawl)).toBeLessThan(rewardScore('race', slowCrawl));
  });

  it('builds inputs from any sensor set-up', async () => {
    const { fanRays, withFeatures, BASIC } = await import('./sensors');
    const spec = { rays: fanRays(3, 90, 300), features: ['speed', 'timeToCrash', 'lane', 'lastSteer'] as const, noise: 0 };
    const c = newCar(randomBrain([7, 4, 2], rng(4)), 'x', { ...spec, features: [...spec.features] });
    stepAI(c);
    expect(c.inp.length).toBe(7);
    for (const v of c.inp) expect(Number.isFinite(v)).toBe(true);
    expect(withFeatures(BASIC, ['lastGas']).features).toEqual(['speed', 'direction', 'lastGas']);
  });
});

describe('championship set-up text', () => {
  it('describes how senses differ from the basic 7', async () => {
    const { sensorText, fanRays, withFeatures, BASIC, DEFAULT_RAYS } = await import('./sensors');
    expect(sensorText(BASIC)).toBe('');
    expect(sensorText({ rays: fanRays(3, 40, 230), features: ['speed', 'direction'], noise: 0 })).toBe('3 rays over 40°, 230 long');
    expect(sensorText({ rays: DEFAULT_RAYS.slice(1), features: ['direction'], noise: 0 })).toBe('without far left, speed');
    expect(sensorText({ ...withFeatures(BASIC, ['timeToCrash']), noise: 0.1 })).toBe('+ time to crash · noise 0.1');
  });
});

describe('championship by best lap', () => {
  it('ranks the fastest single lap first, whatever the race length', async () => {
    const { betterChampion } = await import('./storage');
    const tenLaps = { pct: 1000, raceTime: 85, of: 10, bestLap: 8.1 };
    const threeLaps = { pct: 300, raceTime: 25, of: 3, bestLap: 7.9 };
    const crashed = { pct: 160, raceTime: null, of: 10, bestLap: 8.0 };
    const noLap = { pct: 90, raceTime: null, of: 10, bestLap: null };
    expect(betterChampion(threeLaps, tenLaps)).toBe(true);
    expect(betterChampion(crashed, tenLaps)).toBe(true);
    expect(betterChampion(tenLaps, noLap)).toBe(true);
    expect(betterChampion({ ...noLap, pct: 95 }, noLap)).toBe(true);
  });

  it('records the fastest lap of a drive', async () => {
    const { carResult } = await import('./exam');
    const gas = [0, 0, 2.2, 0, 0, -1.6, 0, -0.2], steer = [-1.5, -1, 0, 1, 1.5, 0, -1, 0];
    const c = newCar({ layers: [7, 2], w: new Float32Array([...gas, ...steer]) }, 'x');
    while (c.alive) stepAI(c, 3);
    const r = carResult(c, 3);
    expect(r.bestLap).toBe(Math.min(...c.laps));
    expect(r.bestLap!).toBeLessThan(r.raceTime! / 2);
  });
});
