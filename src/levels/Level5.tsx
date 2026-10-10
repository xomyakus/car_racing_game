import { useMemo, useState } from 'react';
import { archText, randomBrain, weightCount } from '../sim/brain';
import { BASIC, inputLabels } from '../sim/sensors';
import { labsWithPrefix, testCount } from '../sim/labCache';
import { loadSaved, saveBuilder } from '../sim/storage';
import { resultText } from '../sim/score';
import { useTick } from '../hooks';
import { NetDiagram } from '../components/NetDiagram';
import { BottleneckArt, LuckArt } from './art/Level4to6Art';
import { WideDeepArt } from './art/Level3Art';
import { Card, LevelHeader, Outro, TrainingSection } from './common';

const MAX_LAYERS = 4, MAX_N = 32;
const PRESETS: { name: string; hidden: number[] }[] = [
  { name: 'No hidden layer', hidden: [] },
  { name: 'Tiny', hidden: [2] },
  { name: 'Level 3', hidden: [8] },
  { name: 'Level 4', hidden: [16, 16] },
  { name: 'One wide layer', hidden: [32] },
  { name: 'Deep and thin', hidden: [6, 6, 6, 6] },
];

/** Shapes tried so far in this visit, with how they did. */
function Designs({ current, onPick }: { current: string; onPick: (hidden: number[]) => void }) {
  useTick(2);
  const rows = labsWithPrefix('L5:');
  if (!rows.length) return null;
  return (
    <div className="gens">
      <table>
        <thead><tr><th>Shape</th><th>Weights</th><th>Test drives</th><th>Best</th></tr></thead>
        <tbody>
          {rows.map(([k, lab]) => (
            <tr key={k} className={k === current ? 'cur' : ''}>
              <td><button className="linkbtn" onClick={() => onPick(lab.layers.slice(1, -1))}>{archText(lab.layers)}</button><small>{lab.tracks[0].name}</small></td>
              <td>{weightCount(lab.layers)}</td>
              <td>{testCount(lab)}</td>
              <td>{lab.best ? resultText(lab.best) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Level5() {
  const [hidden, setHidden] = useState<number[]>(() => loadSaved().builder ?? [12, 8]);
  const layers = useMemo(() => [7, ...hidden, 2], [hidden]);
  const key = `L5:${layers.join('-')}`;
  const preview = useMemo(() => randomBrain(layers), [layers]);
  const set = (h: number[]) => { setHidden(h); saveBuilder(h); };
  const counts = layers.slice(0, -1).map((n, l) => ({ n, m: layers[l + 1], w: (n + 1) * layers[l + 1] }));

  return (
    <>
      <LevelHeader n={5} title="Build your own">
        You're the designer now. Choose how many hidden layers the brain has and how many neurons each one gets, then train it and compare.
      </LevelHeader>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide" data-tour="builder">
            <h2>Design the brain</h2>
            <div className="builder">
              <div className="buildcol">
                <div className="layerrow fixed"><span>Inputs</span><b>7</b><small>the car's senses</small></div>
                {hidden.map((n, i) => (
                  <div className="layerrow" key={i}>
                    <span>Hidden layer {i + 1}</span>
                    <div className="stepper">
                      <button className="btn small" aria-label={`Fewer neurons in layer ${i + 1}`} disabled={n <= 1} onClick={() => set(hidden.map((v, k) => (k === i ? v - 1 : v)))}>−</button>
                      <b>{n}</b>
                      <button className="btn small" aria-label={`More neurons in layer ${i + 1}`} disabled={n >= MAX_N} onClick={() => set(hidden.map((v, k) => (k === i ? v + 1 : v)))}>+</button>
                    </div>
                    <button className="btn ghost small" onClick={() => set(hidden.filter((_, k) => k !== i))}>Remove</button>
                  </div>
                ))}
                <div className="layerrow fixed"><span>Outputs</span><b>2</b><small>gas and steer</small></div>
                <div className="controls">
                  <button className="btn" disabled={hidden.length >= MAX_LAYERS} onClick={() => set([...hidden, 8])}>Add a layer</button>
                </div>
                <h3>Or start from</h3>
                <div className="controls">
                  {PRESETS.map(p => <button key={p.name} className="btn small" onClick={() => set(p.hidden)}>{p.name}</button>)}
                </div>
              </div>
              <div className="buildcol">
                <NetDiagram source={() => ({ brain: preview })} labels={inputLabels(BASIC)} wide />
                <div className="math">
                  {counts.map((c, i) => <div key={i}>({c.n} + 1) × {c.m} = {c.w}</div>)}
                  <b>{archText(layers)} has {weightCount(layers)} weights</b>
                </div>
              </div>
            </div>
            <p className="small">Each shape trains separately. Switch back to a shape you already tried and its progress is still there (until you reload the page).</p>
            <Designs current={key} onPick={set} />
          </div>
        </div>
      </section>
      <TrainingSection n={5} labKey={key} config={{ layers: layers }} />
      <Outro n={5} title="Experiments to try">
        <Card title="Too small" image={<BottleneckArt />} tour="outro-1">
          <p>Try <b>Tiny</b>: 2 hidden neurons. Can it still finish 10 laps? Every idea the brain has must fit through just 2 neurons.</p>
        </Card>
        <Card title="Wide or deep?" image={<WideDeepArt />} tour="outro-2">
          <p><b>One wide layer</b> (32 neurons) and <b>Deep and thin</b> (four layers of 6) have a similar number of weights. Which learns faster? Which ends up quicker?</p>
        </Card>
        <Card title="Same shape, different luck" image={<LuckArt />} tour="outro-3">
          <p>Press <b>Start over</b> and train the same shape again. Evolution uses random nudges, so results change from run to run. A fair comparison needs a few runs of each shape.</p>
        </Card>
      </Outro>
    </>
  );
}
