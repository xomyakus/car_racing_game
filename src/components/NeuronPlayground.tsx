import { useEffect, useRef, useState } from 'react';
import { COL, FONT, rgba } from '../theme';
import { ctx2d, sizeCanvas } from '../hooks';
import { Knob } from '../levels/art/Level2Art';

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
  return (
    <div className="play">
      <div className="sensors">
        {INPUTS.map((inp, i) => (
          <div className="pairbox" key={inp.id}>
            <div className="sl">
              <label htmlFor={`np-${inp.id}`}>{inp.name}</label>
              <input id={`np-${inp.id}`} type="range" min={inp.min} max={inp.max} step={inp.step} value={x[i]}
                onChange={e => setX(x.map((v, k) => (k === i ? +e.target.value : v)))} />
              <output>{x[i].toFixed(2)}</output>
            </div>
            <div className="sl w">
              <label htmlFor={`np-w${i}`}>its weight</label>
              <input id={`np-w${i}`} type="range" min={-3} max={3} step={0.1} value={w[i]}
                onChange={e => setW(w.map((v, k) => (k === i ? +e.target.value : v)))} />
              <output>{w[i].toFixed(1)}</output>
            </div>
          </div>
        ))}
        <div className="pairbox">
          <div className="sl w">
            <label htmlFor="np-b">bias</label>
            <input id="np-b" type="range" min={-3} max={3} step={0.1} value={b} onChange={e => setB(+e.target.value)} />
            <output>{b.toFixed(1)}</output>
          </div>
          <p className="small">The bias is the perceptron's own nudge, added no matter what the inputs say.</p>
        </div>
      </div>
      <div className="sensors">
        <WeightMath x={x} w={w} b={b} />
        <canvas ref={ref} className="squeeze" aria-label="The squeeze curve" />
        <div className={`verdict ${out >= 0 ? 'pos' : 'neg'}`}>{sum.toFixed(2)} → squeeze → {out >= 0 ? '+' : ''}{out.toFixed(2)}: {verdict}</div>
      </div>
    </div>
  );
}

const NAMES = ['wall ahead', 'speed', 'direction'];

/** Each input × its weight (a knob) = how hard it pushes or pulls; all of them plus the bias add up to the total. */
function WeightMath({ x, w, b }: { x: number[]; w: number[]; b: number }) {
  const C = 290, S = 34;
  const bar = (v: number, y: number, h = 12) => (
    <rect x={v >= 0 ? C : C + Math.max(-3.2, v) * S} y={y - h / 2} width={Math.min(3.2, Math.abs(v)) * S} height={h} rx={3}
      fill={v >= 0 ? 'var(--pos)' : 'var(--neg)'} />
  );
  const rows = [...x.map((v, i) => ({ name: NAMES[i], v, wt: w[i] })), { name: 'bias', v: 1, wt: b }];
  const sum = rows.reduce((s, r) => s + r.v * r.wt, 0);
  return (
    <svg viewBox="0 0 420 270" className="art" role="img" aria-label="Each input times its weight gives a push or a pull; they add up to the total">
      <text x={0} y={12} className="art-xs">input</text>
      <text x={140} y={12} textAnchor="middle" className="art-xs">× weight</text>
      <text x={C} y={12} textAnchor="middle" className="art-xs">= pull ← → push</text>
      <line x1={C} y1={20} x2={C} y2={212} stroke="var(--rule)" strokeWidth={1.5} />
      {rows.map((r, i) => {
        const y = 44 + i * 44, p = r.v * r.wt;
        return (
          <g key={r.name}>
            <text x={0} y={y - 12} className="art-s">{r.name}</text>
            <rect x={0} y={y - 6} width={90} height={12} rx={3} fill="var(--mat)" stroke="var(--ink)" strokeWidth={1} />
            {r.name === 'bias'
              ? <text x={45} y={y + 4} textAnchor="middle" className="art-xs">always 1</text>
              : r.v >= 0
                ? <rect x={0} y={y - 6} width={90 * Math.min(1, r.v)} height={12} rx={3} fill="var(--ray)" />
                : <rect x={45 + 45 * r.v} y={y - 6} width={-45 * r.v} height={12} rx={3} fill="var(--ray)" />}
            <text x={110} y={y + 5} className="art-m">×</text>
            <Knob x={140} y={y} w={r.wt} r={16} />
            <text x={162} y={y + 5} className="art-m">=</text>
            {bar(p, y)}
            <text x={p >= 0 ? C + Math.min(3.2, p) * S + 4 : C + Math.max(-3.2, p) * S - 4} y={y + 4} textAnchor={p >= 0 ? 'start' : 'end'} className="art-w">
              {p >= 0 ? '+' : '−'}{Math.abs(p).toFixed(2)}
            </text>
          </g>
        );
      })}
      <line x1={180} y1={222} x2={410} y2={222} stroke="var(--ink)" strokeWidth={2} />
      <text x={0} y={250} className="art-m">add them all up</text>
      {bar(sum, 246, 16)}
      <text x={sum >= 0 ? C + Math.min(3.2, sum) * S + 4 : C + Math.max(-3.2, sum) * S - 4} y={251} textAnchor={sum >= 0 ? 'start' : 'end'} className="art-m">
        {sum >= 0 ? '+' : '−'}{Math.abs(sum).toFixed(2)}
      </text>
    </svg>
  );
}
