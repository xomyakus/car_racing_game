import { useMemo, useState } from 'react';
import { BASIC, DEFAULT_RAYS, FeatureId, SensorSpec, inputLabels } from '../sim/sensors';
import { CompareTable } from '../components/CompareTable';
import { CostArt, FairTestArt, HiddenSenseArt } from './art/Level7to9Art';
import { Card, LevelHeader, Outro, TrainingSection } from './common';

const NAMES = inputLabels(BASIC);
const FEATS: FeatureId[] = ['speed', 'direction'];
const ALL = '1111111';
const PRESETS: { name: string; mask: string }[] = [
  { name: 'Everything on', mask: ALL },
  { name: 'No speed', mask: '1111101' },
  { name: 'No direction', mask: '1111110' },
  { name: 'Only the 5 rays', mask: '1111100' },
  { name: 'Only the ahead ray', mask: '0010011' },
  { name: 'Only the far rays', mask: '1000111' },
];
const specOf = (mask: string): SensorSpec => ({
  rays: DEFAULT_RAYS.filter((_, i) => mask[i] === '1'),
  features: FEATS.filter((_, i) => mask[5 + i] === '1'),
  noise: 0,
});
const maskText = (mask: string) => {
  const off = NAMES.filter((_, i) => mask[i] === '0');
  return off.length ? `without ${off.join(', ')}` : 'all 7 senses';
};

export function Level8() {
  const [mask, setMask] = useState(ALL);
  const spec = useMemo(() => specOf(mask), [mask]);
  const on = mask.split('').filter(c => c === '1').length;
  const config = useMemo(() => ({ layers: [on, 16, 16, 2], spec }), [on, spec]);
  const key = `L8:${mask}`;
  const toggle = (i: number) => {
    const next = mask.split('').map((c, k) => (k === i ? (c === '1' ? '0' : '1') : c)).join('');
    if (next.includes('1')) setMask(next);
  };
  return (
    <>
      <LevelHeader n={8} title="Turn off a sense">
        Which of the 7 numbers does a driver really need? Switch some off, train again, and compare. Scientists call this an ablation study.
      </LevelHeader>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide" data-tour="senses">
            <h2>Choose the senses</h2>
            <div className="sensegrid">
              {NAMES.map((name, i) => (
                <label key={name} className={`sense${mask[i] === '1' ? ' on' : ''}`}>
                  <input type="checkbox" checked={mask[i] === '1'} onChange={() => toggle(i)} />
                  <span>{name}</span>
                </label>
              ))}
            </div>
            <div className="controls">
              {PRESETS.map(p => <button key={p.name} className="btn small" onClick={() => setMask(p.mask)}>{p.name}</button>)}
            </div>
            <p className="small">The brain gets <b>{on} input{on > 1 ? 's' : ''}</b>, then two hidden layers of 16. At least one sense has to stay on.</p>
            <h3>Experiments so far</h3>
            <CompareTable prefix="L8:" current={key} describe={(_, k) => maskText(k.slice(3))} onPick={k => setMask(k.slice(3))} />
          </div>
        </div>
      </section>
      <TrainingSection key={key} n={8} labKey={key} config={config} />
      <Outro n={8} title="Reading the results">
        <Card title="A fair test" image={<FairTestArt />} tour="outro-1">
          <p>Change one thing at a time. If you turn off speed <b>and</b> direction together and the car gets worse, you won't know which one mattered.</p>
        </Card>
        <Card title="Some senses hide in others" image={<HiddenSenseArt />} tour="outro-2">
          <p>Without "speed", the brain can still guess it a little: when it's fast, the rays change quickly. A sense that seems important can sometimes be replaced by others.</p>
        </Card>
        <Card title="Why it matters" image={<CostArt />} tour="outro-3">
          <p>Real engineers do this to save money and computing power: if a sensor doesn't help, you don't need to build it into the car.</p>
        </Card>
      </Outro>
    </>
  );
}
