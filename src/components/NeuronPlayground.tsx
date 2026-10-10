import { useEffect, useRef, useState } from 'react';
import { COL, FONT, rgba } from '../theme';
import { ctx2d, sizeCanvas } from '../hooks';

const INPUTS = [
  { id: 'x0', name: 'Wall ahead', min: 0, max: 1, step: 0.01, value: 0.8 },
  { id: 'x1', name: 'Speed', min: 0, max: 1, step: 0.01, value: 0.6 },
  { id: 'x2', name: 'Direction', min: -1, max: 1, step: 0.01, value: 0 },
];
const WEIGHTS = [2, -1.5, 0.3];

/** One "gas" perceptron with 3 inputs: multiply, add, squeeze. */
export function NeuronPlayground() {
  const [x, setX] = useState(INPUTS.map(i => i.value));
  const [w, setW] = useState(WEIGHTS);
  const [b, setB] = useState(-0.3);
  const ref = useRef<HTMLCanvasElement>(null);
  const sum = x.reduce((s, v, i) => s + v * w[i], b);
  const out = Math.tanh(sum);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !sizeCanvas(cv)) return;
    const { ctx, w: cw, h } = ctx2d(cv);
    const X = (s: number) => cw / 2 + (s / 5) * (cw / 2 - 10), Y = (o: number) => h / 2 - o * (h / 2 - 16);
    ctx.strokeStyle = COL.rule; ctx.lineWidth = 1;
    for (const o of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(0, Y(o)); ctx.lineTo(cw, Y(o)); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();
    ctx.fillStyle = COL.muted; ctx.font = `700 11px ${FONT.mono}`; ctx.textAlign = 'left';
    ctx.fillText('+1', 4, Y(1) - 4); ctx.fillText('−1', 4, Y(-1) + 13);
    ctx.beginPath();
    for (let s = -5; s <= 5.001; s += 0.1) { const xx = X(s), yy = Y(Math.tanh(s)); if (s === -5) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.5; ctx.stroke();
    const sx = X(Math.max(-5, Math.min(5, sum))), sy = Y(out);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx, h); ctx.lineTo(sx, sy); ctx.lineTo(0, sy); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fillStyle = rgba(out >= 0 ? COL.pos : COL.neg, 1); ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.stroke();
    ctx.fillStyle = COL.muted; ctx.textAlign = 'right'; ctx.fillText('the squeeze', cw - 4, h - 6);
  }, [sum, out]);

  const verdict = out > 0.6 ? 'Full gas!' : out > 0.15 ? 'A little gas' : out > -0.15 ? 'Just rolling' : out > -0.6 ? 'Gentle brake' : 'Hard brake!';
  const names = ['wall ahead', 'speed', 'direction'];
  return (
    <div className="play">
      <div className="sensors">
        <h3>Inputs (what the car feels)</h3>
        {INPUTS.map((inp, i) => (
          <div className="sl" key={inp.id}>
            <label htmlFor={`np-${inp.id}`}>{inp.name}</label>
            <input id={`np-${inp.id}`} type="range" min={inp.min} max={inp.max} step={inp.step} value={x[i]}
              onChange={e => setX(x.map((v, k) => (k === i ? +e.target.value : v)))} />
            <output>{x[i].toFixed(2)}</output>
          </div>
        ))}
        <h3>Weights (what the brain learned)</h3>
        {w.map((wt, i) => (
          <div className="sl w" key={i}>
            <label htmlFor={`np-w${i}`}>× weight</label>
            <input id={`np-w${i}`} type="range" min={-3} max={3} step={0.1} value={wt}
              onChange={e => setW(w.map((v, k) => (k === i ? +e.target.value : v)))} />
            <output>{wt.toFixed(2)}</output>
          </div>
        ))}
        <div className="sl w">
          <label htmlFor="np-b">+ bias</label>
          <input id="np-b" type="range" min={-3} max={3} step={0.1} value={b} onChange={e => setB(+e.target.value)} />
          <output>{b.toFixed(2)}</output>
        </div>
      </div>
      <div className="sensors">
        <div className="calc">
          {x.map((v, i) => (
            <div key={i}>{v.toFixed(2)} × {w[i].toFixed(1)} = {(v * w[i]).toFixed(2)} <span className="muted">{names[i]}</span></div>
          ))}
          <div>+ bias = {b.toFixed(2)}</div>
          <div className="sum">add up = {sum.toFixed(2)} → squeeze → <b className={out >= 0 ? 'pos' : 'neg'}>{out >= 0 ? '+' : ''}{out.toFixed(2)}</b></div>
        </div>
        <canvas ref={ref} className="squeeze" aria-label="The squeeze curve" />
        <div className={`verdict ${out >= 0 ? 'pos' : 'neg'}`}>{verdict}</div>
      </div>
    </div>
  );
}
