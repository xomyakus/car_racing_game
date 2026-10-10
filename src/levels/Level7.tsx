import { useMemo, useState } from 'react';
import { RAY_LEN } from '../sim/constants';
import { SensorSpec, fanRays, inputCount } from '../sim/sensors';
import { CompareTable } from '../components/CompareTable';
import { Card, Cards, LevelHeader, TrainingSection } from './common';

interface Eyes { count: number; spread: number; len: number }
const PRESETS: { name: string; eyes: Eyes }[] = [
  { name: 'Standard', eyes: { count: 5, spread: 120, len: RAY_LEN } },
  { name: 'One eye', eyes: { count: 1, spread: 0, len: RAY_LEN } },
  { name: 'Narrow', eyes: { count: 3, spread: 40, len: RAY_LEN } },
  { name: 'Wide', eyes: { count: 5, spread: 220, len: RAY_LEN } },
  { name: 'Lots of eyes', eyes: { count: 9, spread: 180, len: RAY_LEN } },
  { name: 'Short-sighted', eyes: { count: 5, spread: 120, len: 100 } },
  { name: 'Long-sighted', eyes: { count: 5, spread: 120, len: 400 } },
];
const keyOf = (e: Eyes) => `L7:${e.count}-${e.spread}-${e.len}`;
const specOf = (e: Eyes): SensorSpec => ({ rays: fanRays(e.count, e.spread, e.len), features: ['speed', 'direction'], noise: 0 });
const eyesText = (e: Eyes) => `${e.count} ray${e.count > 1 ? 's' : ''}${e.count > 1 ? ` over ${e.spread}°` : ''}, ${e.len} long`;
const parseKey = (k: string): Eyes => { const [count, spread, len] = k.slice(3).split('-').map(Number); return { count, spread, len }; };

/** Top-down sketch of the car and its rays. */
function RayPreview({ eyes }: { eyes: Eyes }) {
  const rays = fanRays(eyes.count, eyes.spread, eyes.len), s = 0.38;
  return (
    <svg viewBox="-170 -170 340 340" className="raypreview" role="img" aria-label={`Car with ${eyesText(eyes)}`}>
      <circle r={RAY_LEN * s} fill="none" stroke="var(--rule)" strokeDasharray="4 5" />
      {rays.map((r, i) => {
        const x = Math.sin(r.angle) * r.len * s, y = -Math.cos(r.angle) * r.len * s;
        return <g key={i}><line x1={0} y1={0} x2={x} y2={y} stroke="var(--ray)" strokeWidth={4} strokeLinecap="round" /><circle cx={x} cy={y} r={5} fill="var(--ray)" /></g>;
      })}
      <rect x={-7} y={-12} width={14} height={24} rx={4} fill="var(--red)" stroke="var(--ink)" strokeWidth={2} />
      <text x={0} y={160} textAnchor="middle" className="svglabel">dashed circle = standard ray length</text>
    </svg>
  );
}

export function Level7() {
  const [eyes, setEyes] = useState<Eyes>(PRESETS[0].eyes);
  const spec = useMemo(() => specOf(eyes), [eyes]);
  const n = inputCount(spec);
  const config = useMemo(() => ({ layers: [n, 16, 16, 2], spec }), [n, spec]);
  const key = keyOf(eyes);
  const set = (patch: Partial<Eyes>) => setEyes(e => ({ ...e, ...patch }));
  return (
    <>
      <LevelHeader n={7} title="Ray designer">
        The yellow rays are the car's eyes. So far every car had the same 5. Now you design them: how many, how far apart, and how far they can see.
      </LevelHeader>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide">
            <h2>Design the eyes</h2>
            <div className="builder">
              <div className="buildcol">
                <div className="sl"><label htmlFor="rc">Rays</label>
                  <input id="rc" type="range" min={1} max={9} step={1} value={eyes.count} onChange={e => set({ count: +e.target.value })} /><output>{eyes.count}</output></div>
                <div className="sl"><label htmlFor="rs">Spread</label>
                  <input id="rs" type="range" min={0} max={240} step={10} value={eyes.spread} disabled={eyes.count === 1} onChange={e => set({ spread: +e.target.value })} /><output>{eyes.spread}°</output></div>
                <div className="sl"><label htmlFor="rl">Length</label>
                  <input id="rl" type="range" min={80} max={400} step={10} value={eyes.len} onChange={e => set({ len: +e.target.value })} /><output>{eyes.len}</output></div>
                <h3>Or try</h3>
                <div className="controls">
                  {PRESETS.map(p => <button key={p.name} className="btn small" onClick={() => setEyes(p.eyes)}>{p.name}</button>)}
                </div>
                <p className="small">The brain gets {eyes.count} ray{eyes.count > 1 ? 's' : ''} + speed + direction = <b>{n} inputs</b>, then two hidden layers of 16. Each design trains separately.</p>
              </div>
              <div className="buildcol"><RayPreview eyes={eyes} /></div>
            </div>
            <h3>Designs you tried</h3>
            <CompareTable prefix="L7:" current={key} describe={(_, k) => eyesText(parseKey(k))} onPick={k => setEyes(parseKey(k))} />
          </div>
        </div>
      </section>
      <TrainingSection key={key} n={7} labKey={key} config={config} />
      <Cards title="What to look for">
        <Card title="Seeing far vs seeing wide">
          <p>Long rays warn about corners early, so a fast car has time to brake. Wide rays see the walls beside the car, which helps it stay in the middle.</p>
        </Card>
        <Card title="More eyes, more weights">
          <p>Every extra ray is another input, with 16 more weights to the first hidden layer. More information, but more to learn.</p>
        </Card>
        <Card title="Can one eye drive?">
          <p>With a single ray straight ahead, the car knows a wall is coming but not which way to turn. Try it, and watch how it fails.</p>
        </Card>
      </Cards>
    </>
  );
}
