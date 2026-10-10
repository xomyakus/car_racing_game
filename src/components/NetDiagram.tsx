import { useRef } from 'react';
import { Brain, layerOffsets, weightIndex } from '../sim/brain';
import { COL, FONT, rgba } from '../theme';
import { ctx2d, sizeCanvas, useFrame } from '../hooks';

export interface NetSource {
  brain: Brain;
  /** activations per layer (acts[0] = inputs); omit to draw weights only */
  acts?: Float32Array[];
}

interface Props {
  source: () => NetSource | null;
  labels: string[];
  outputs?: string[];
  /** wider aspect ratio for side panels */
  wide?: boolean;
  /** write each weight's value next to its line (only readable for tiny networks) */
  showWeights?: boolean;
}

/**
 * Draws any fully connected network. Line color = weight sign, thickness = weight size,
 * brightness = how much signal flows through it right now. Circle fill = the neuron's output.
 */
export function NetDiagram({ source, labels, outputs = ['GAS', 'STEER'], wide, showWeights }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  useFrame(() => {
    if (frame.current++ % 3) return;
    const cv = ref.current, src = source();
    if (!cv || !src || !sizeCanvas(cv)) return;
    draw(cv, src, labels, outputs, !!showWeights);
  });
  return <canvas ref={ref} className={`net${wide ? ' wide' : ''}`} aria-label="Neural network diagram" />;
}

function draw(cv: HTMLCanvasElement, src: NetSource, labels: string[], outputs: string[], showWeights: boolean) {
  const { ctx, w, h } = ctx2d(cv);
  const { brain } = src, layers = brain.layers, off = layerOffsets(layers), nL = layers.length;
  const acts = src.acts ?? layers.map(n => new Float32Array(n).fill(1));
  const narrow = w < 380, left = narrow ? 70 : 86, right = narrow ? 76 : 92, top = 14, bot = 12, span = h - top - bot;
  const xs = layers.map((_, l) => left + ((w - left - right) * l) / (nL - 1));
  const ys = layers.map((n, l) => Array.from({ length: n }, (_, i) =>
    l === nL - 1 ? h / 2 + (i - (n - 1) / 2) * Math.min(110, span * 0.5) : top + (span * (i + 0.5)) / n));
  const big = off[nL - 1] > 1200;
  for (let l = 0; l < nL - 1; l++) {
    const nI = layers[l], nO = layers[l + 1];
    for (let j = 0; j < nO; j++) for (let i = 0; i < nI; i++) {
      const wt = brain.w[weightIndex(layers, off, l, j, i)];
      const sig = src.acts ? Math.min(1, Math.abs(wt * acts[l][i])) : Math.min(1, Math.abs(wt) / 2);
      ctx.strokeStyle = rgba(wt >= 0 ? COL.pos : COL.neg, (big ? 0.03 : 0.05) + 0.6 * sig);
      ctx.lineWidth = 0.5 + Math.min(2.6, Math.abs(wt) * 0.9) * (big ? 0.5 : 1);
      ctx.beginPath(); ctx.moveTo(xs[l], ys[l][i]); ctx.lineTo(xs[l + 1], ys[l + 1][j]); ctx.stroke();
    }
  }
  if (showWeights && nL === 2) {
    ctx.font = `700 10px ${FONT.mono}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let j = 0; j < layers[1]; j++) for (let i = 0; i < layers[0]; i++) {
      const wt = brain.w[weightIndex(layers, off, 0, j, i)], t = j === 0 ? 0.25 : 0.5;
      const x = xs[0] + (xs[1] - xs[0]) * t, y = ys[0][i] + (ys[1][j] - ys[0][i]) * t;
      ctx.fillStyle = COL.paper; ctx.fillRect(x - 15, y - 7, 30, 13);
      ctx.fillStyle = wt >= 0 ? rgba(COL.pos, 1) : rgba(COL.neg, 1);
      ctx.fillText(wt.toFixed(1), x, y);
    }
  }
  ctx.textBaseline = 'middle';
  for (let l = 0; l < nL; l++) {
    const n = layers[l], r = l === 0 ? 7 : l === nL - 1 ? 12 : Math.max(2.5, Math.min(7, span / n / 2.3));
    for (let i = 0; i < n; i++) {
      const a = src.acts ? acts[l][i] : 0;
      ctx.beginPath(); ctx.arc(xs[l], ys[l][i], r, 0, Math.PI * 2);
      ctx.fillStyle = COL.paper; ctx.fill();
      ctx.fillStyle = rgba(a >= 0 ? COL.pos : COL.neg, Math.min(1, Math.abs(a))); ctx.fill();
      ctx.lineWidth = r < 4 ? 1 : 1.5; ctx.strokeStyle = COL.ink; ctx.stroke();
    }
  }
  ctx.fillStyle = COL.ink; ctx.font = `800 ${narrow ? 11 : 12}px ${FONT.body}`; ctx.textAlign = 'right';
  for (let i = 0; i < layers[0]; i++) ctx.fillText(labels[i] ?? `input ${i + 1}`, xs[0] - 12, ys[0][i]);
  ctx.textAlign = 'left';
  const out = acts[nL - 1];
  for (let i = 0; i < layers[nL - 1]; i++) {
    const y = ys[nL - 1][i];
    ctx.fillStyle = COL.ink;
    ctx.font = `400 ${narrow ? 12 : 14}px ${FONT.display}`; ctx.fillText(outputs[i] ?? `out ${i + 1}`, xs[nL - 1] + 18, y - 8);
    if (src.acts) {
      ctx.font = `700 ${narrow ? 11 : 13}px ${FONT.mono}`;
      ctx.fillText((out[i] >= 0 ? '+' : '') + out[i].toFixed(2), xs[nL - 1] + 18, y + 9);
    }
  }
  ctx.fillStyle = COL.muted; ctx.font = `800 10px ${FONT.body}`; ctx.textAlign = 'center';
  for (let l = 1; l < nL - 1; l++) ctx.fillText(String(layers[l]), xs[l], 6);
}
