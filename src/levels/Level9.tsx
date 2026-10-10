import { useMemo, useState } from 'react';
import { BASIC, FeatureId, inputCount, withFeatures } from '../sim/sensors';
import { CompareTable } from '../components/CompareTable';
import { CompareClueArt, EngineerArt, TimeMathArt } from './art/Level7to9Art';
import { Card, LevelHeader, Outro, TrainingSection } from './common';

const EXTRAS: { id: FeatureId; name: string; what: string }[] = [
  { id: 'timeToCrash', name: 'Time to crash', what: 'Seconds until you hit the wall ahead if you keep your speed. 0 = right now, 1 = two seconds or more.' },
  { id: 'brakeDist', name: 'Brake distance', what: 'How far the car needs to stop from this speed. Compare it with the "ahead" ray!' },
  { id: 'lane', name: 'Lane position', what: 'Where the car is across the road: −1 = right wall, 0 = middle, +1 = left wall.' },
];
const keyOf = (on: FeatureId[]) => `L9:${on.join('+') || 'none'}`;
const textOf = (k: string) => {
  const ids = k.slice(3).split('+').filter(x => x !== 'none');
  return ids.length ? `basic 7 + ${ids.map(id => EXTRAS.find(e => e.id === id)!.name.toLowerCase()).join(' + ')}` : 'basic 7 only';
};

export function Level9() {
  const [on, setOn] = useState<FeatureId[]>(['timeToCrash']);
  const spec = useMemo(() => withFeatures(BASIC, on), [on]);
  const config = useMemo(() => ({ layers: [inputCount(spec), 16, 16, 2], spec }), [spec]);
  const key = keyOf(on);
  const toggle = (id: FeatureId) => setOn(o => EXTRAS.map(e => e.id).filter(x => (x === id ? !o.includes(x) : o.includes(x))));
  return (
    <>
      <LevelHeader n={9} title="Smarter inputs">
        The rays give raw distances. A human engineer can do a bit of maths first and hand the brain a ready-made clue. Does pre-chewed information help it learn faster?
      </LevelHeader>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide" data-tour="clues">
            <h2>Add clues</h2>
            <div className="sensegrid wide">
              {EXTRAS.map(e => (
                <label key={e.id} className={`sense${on.includes(e.id) ? ' on' : ''}`}>
                  <input type="checkbox" checked={on.includes(e.id)} onChange={() => toggle(e.id)} />
                  <span><b>{e.name}</b><small>{e.what}</small></span>
                </label>
              ))}
            </div>
            <p className="small">The brain gets the basic 7 numbers plus <b>{on.length}</b> clue{on.length === 1 ? '' : 's'}: {inputCount(spec)} inputs, then two hidden layers of 16.</p>
            <h3>Experiments so far</h3>
            <CompareTable prefix="L9:" current={key} describe={(_, k) => textOf(k)}
              onPick={k => setOn(k.slice(3).split('+').filter(x => x !== 'none') as FeatureId[])} />
          </div>
        </div>
      </section>
      <TrainingSection key={key} n={9} labKey={key} config={config} />
      <Outro n={9} title="Why clues can help">
        <Card title="Doing the maths for the brain" image={<TimeMathArt />} tour="outro-1">
          <p>"Time to crash" is the ahead ray divided by the speed. A brain could learn to work that out itself, but division is hard to build from add-and-squeeze neurons. Handing it over can save a lot of training.</p>
        </Card>
        <Card title="Feature engineering" image={<EngineerArt />} tour="outro-2">
          <p>Choosing and building good inputs is called <b>feature engineering</b>. Before deep learning, it was most of the work in machine learning, and it still matters.</p>
        </Card>
        <Card title="Compare with level 4" image={<CompareClueArt />} tour="outro-3">
          <p>Level 4 has the same brain shape with only the basic 7. Is your version faster to finish 10 laps? Does it end up quicker?</p>
        </Card>
      </Outro>
    </>
  );
}
