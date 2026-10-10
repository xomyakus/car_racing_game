import { Brain, forward, layerOffsets, makeActs, randomBrain } from './brain';
import type { Sample } from './drive';

/** Targets a little inside ±1, because tanh can only reach ±1 with infinite weights. */
const TARGET = 0.9;

/**
 * Supervised learning: nudge the weights so the brain's gas and steer match what the person did.
 * Uses backpropagation (gradient descent) on the squared error, with momentum.
 */
export class Copycat {
  brain: Brain;
  epochs = 0;
  /** average error per epoch, newest last */
  lossHist: number[] = [];
  lr = 0.05;
  private vel: Float32Array;
  private grad: Float32Array;
  private acts: Float32Array[];
  private deltas: Float32Array[];
  private off: number[];

  constructor(readonly layers: number[]) {
    // small starting weights so the first answers aren't extreme
    this.brain = randomBrain(layers);
    for (let i = 0; i < this.brain.w.length; i++) this.brain.w[i] *= 0.5;
    this.vel = new Float32Array(this.brain.w.length);
    this.grad = new Float32Array(this.brain.w.length);
    this.acts = makeActs(layers);
    this.deltas = makeActs(layers);
    this.off = layerOffsets(layers);
  }

  /** One pass over all the samples in random order. Returns the average squared error. */
  epoch(data: Sample[], batch = 32): number {
    if (!data.length) return 0;
    const order = data.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let loss = 0;
    for (let b = 0; b < order.length; b += batch) {
      this.grad.fill(0);
      const end = Math.min(order.length, b + batch);
      for (let k = b; k < end; k++) loss += this.backprop(data[order[k]]);
      const n = end - b, w = this.brain.w;
      for (let i = 0; i < w.length; i++) {
        this.vel[i] = 0.9 * this.vel[i] - (this.lr * this.grad[i]) / n;
        w[i] += this.vel[i];
      }
    }
    this.epochs++;
    const avg = loss / data.length;
    this.lossHist.push(avg);
    if (this.lossHist.length > 2000) this.lossHist.shift();
    return avg;
  }

  /** Add one sample's gradient to `grad`; returns its squared error. */
  private backprop(s: Sample): number {
    const { layers, w } = this.brain, acts = this.acts, deltas = this.deltas, last = layers.length - 1;
    acts[0].set(s.inp);
    const out = forward(this.brain, acts);
    const t = [s.gas * TARGET, s.steer * TARGET];
    let err = 0;
    for (let j = 0; j < layers[last]; j++) {
      const e = out[j] - t[j];
      err += e * e;
      deltas[last][j] = e * (1 - out[j] * out[j]);
    }
    for (let l = last - 1; l >= 0; l--) {
      const nI = layers[l], nO = layers[l + 1], a = acts[l], dOut = deltas[l + 1], dIn = deltas[l];
      if (l > 0) dIn.fill(0);
      for (let j = 0; j < nO; j++) {
        const base = this.off[l] + j * (nI + 1), dj = dOut[j];
        for (let i = 0; i < nI; i++) {
          this.grad[base + i] += dj * a[i];
          if (l > 0) dIn[i] += w[base + i] * dj;
        }
        this.grad[base + nI] += dj;
      }
      if (l > 0) for (let i = 0; i < nI; i++) dIn[i] *= 1 - a[i] * a[i];
    }
    return err / 2;
  }

  /** How often the brain makes the same choice as the person (gas / brake / coast and left / straight / right). */
  agreement(data: Sample[]): number {
    if (!data.length) return 0;
    const pick = (v: number) => (v > 0.33 ? 1 : v < -0.33 ? -1 : 0);
    let same = 0;
    for (const s of data) {
      this.acts[0].set(s.inp);
      const out = forward(this.brain, this.acts);
      if (pick(out[0]) === s.gas) same++;
      if (pick(out[1]) === s.steer) same++;
    }
    return same / (2 * data.length);
  }
}
