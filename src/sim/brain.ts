/**
 * A brain is a fully connected neural network with tanh on every neuron.
 * `layers` lists the neuron count per layer, inputs first and outputs last,
 * e.g. [7, 2] is two perceptrons and [7, 16, 16, 2] has two hidden layers.
 *
 * Weights are stored flat, layer by layer; for each neuron j of layer l+1
 * come its weights from every neuron of layer l, then its bias.
 */
export interface Brain {
  layers: number[];
  w: Float32Array;
}

export type Rng = () => number;

export function weightCount(layers: number[]): number {
  let n = 0;
  for (let l = 0; l < layers.length - 1; l++) n += (layers[l] + 1) * layers[l + 1];
  return n;
}

/** Start index of each layer's weights in `Brain.w`. */
export function layerOffsets(layers: number[]): number[] {
  const off = [0];
  for (let l = 0; l < layers.length - 1; l++) off.push(off[l] + (layers[l] + 1) * layers[l + 1]);
  return off;
}

/** Index of the weight from neuron i (layer l) into neuron j (layer l+1); i === layers[l] is the bias. */
export function weightIndex(layers: number[], off: number[], l: number, j: number, i: number): number {
  return off[l] + j * (layers[l] + 1) + i;
}

export function randomBrain(layers: number[], rnd: Rng = Math.random): Brain {
  const w = new Float32Array(weightCount(layers));
  for (let i = 0; i < w.length; i++) w[i] = rnd() * 2 - 1;
  return { layers: [...layers], w };
}

export function cloneBrain(b: Brain): Brain {
  return { layers: [...b.layers], w: new Float32Array(b.w) };
}

export function gauss(rnd: Rng = Math.random): number {
  let u = 0;
  while (!u) u = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

/** Copy the brain and nudge roughly `rate` of its weights by a random amount of about `size`. */
export function mutate(b: Brain, size = 0.35, rate = 0.12, rnd: Rng = Math.random): Brain {
  const c = cloneBrain(b);
  for (let i = 0; i < c.w.length; i++) if (rnd() < rate) c.w[i] += gauss(rnd) * size;
  return c;
}

/** One activation array per layer; acts[0] holds the inputs. */
export function makeActs(layers: number[]): Float32Array[] {
  return layers.map(n => new Float32Array(n));
}

/** Run the network. Reads acts[0] as inputs, fills every later layer, returns the outputs. */
export function forward(b: Brain, acts: Float32Array[]): Float32Array {
  const { layers, w } = b;
  let o = 0;
  for (let l = 0; l < layers.length - 1; l++) {
    const nI = layers[l], nO = layers[l + 1], a = acts[l], out = acts[l + 1];
    for (let j = 0; j < nO; j++) {
      let s = 0;
      for (let i = 0; i < nI; i++) s += a[i] * w[o++];
      s += w[o++];
      out[j] = Math.tanh(s);
    }
  }
  return acts[layers.length - 1];
}

export const archText = (layers: number[]) => layers.join(' → ');
