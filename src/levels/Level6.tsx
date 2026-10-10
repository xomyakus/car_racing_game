import { useState } from 'react';
import type { Lab } from '../sim/lab';
import { BASIC, CORNERS } from '../sim/sensors';
import { getLab, testCount } from '../sim/labCache';
import { getTrack } from '../sim/track';
import { useLevelTrack, withTrack } from './trackChoice';
import { resultText } from '../sim/score';
import { useTick } from '../hooks';
import { SensorBars } from '../components/SensorBars';
import { Card, Cards, LevelHeader, TrainingSection } from './common';

const ON = { key: 'L6:corners', config: { layers: [9, 16, 16, 2], spec: CORNERS } };
const OFF = { key: 'L6:basic', config: { layers: [7, 16, 16, 2], spec: BASIC } };

function LiveSenses({ lab }: { lab: Lab }) {
  useTick(10);
  return (
    <div className="panel">
      <h3>What this car feels</h3>
      <SensorBars car={lab.focus()} spec={lab.spec} />
      {lab.spec.features.includes('bendSoon') && <p className="small">Bends: −1 is a sharp left, +1 a sharp right. The amber dots on the road are "soon", the purple ones "later".</p>}
    </div>
  );
}

function Compare() {
  useTick(2);
  const [t] = useLevelTrack(6);
  const row = (name: string, lab: Lab) => (
    <div className="tile">
      <span>{name}</span>
      <b>{lab.best ? resultText(lab.best) : '—'}</b>
      <small>{testCount(lab)} test drives</small>
    </div>
  );
  return (
    <div className="tiles">
      {row('Without corner sense', getLab(withTrack(OFF.key, t), { ...OFF.config, tracks: [getTrack(t)] }))}
      {row('With corner sense', getLab(withTrack(ON.key, t), { ...ON.config, tracks: [getTrack(t)] }))}
    </div>
  );
}

export function Level6() {
  const [on, setOn] = useState(true);
  const cfg = on ? ON : OFF;
  return (
    <>
      <LevelHeader n={6} title="Corner sense">
        So far the brain only felt walls, speed and direction. Now we give it two new numbers about the road ahead, like a driver who has learned the track.
      </LevelHeader>
      <Cards title="A new sense">
        <Card title="Bend soon, bend later">
          <p><b>Bend soon</b> says how much the road turns in the next 120 units. <b>Bend later</b> says how much it turns after that, up to 300 units ahead.</p>
          <p>Both go from −1 (sharp left) through 0 (straight) to +1 (sharp right).</p>
        </Card>
        <Card title="Why it might help">
          <p>The rays only see walls that are already close. By the time the "ahead" ray gets short, a fast car may be too late to brake.</p>
          <p>"Bend later" warns about a corner while the road in front still looks straight.</p>
        </Card>
        <Card title="Feature development">
          <p>Choosing what the brain gets to know is called <b>feature engineering</b>. A good feature can matter more than a bigger brain. A useless one just adds weights to search.</p>
          <p>The brain grows from 7 to 9 inputs: 466 weights instead of 434.</p>
        </Card>
      </Cards>
      <section className="section">
        <h2 className="sectiontitle">The experiment</h2>
        <p className="sectionlead">Same brain shape, same training. Train both versions and compare. Each one keeps its own progress when you switch.</p>
        <div className="controls">
          <div className="seg" role="group" aria-label="Corner sense">
            <button aria-pressed={on} onClick={() => setOn(true)}>Corner sense ON (9 inputs)</button>
            <button aria-pressed={!on} onClick={() => setOn(false)}>OFF (7 inputs)</button>
          </div>
        </div>
        <Compare />
      </section>
      <TrainingSection key={cfg.key} n={6} labKey={cfg.key} config={cfg.config} sideTop={lab => <LiveSenses lab={lab} />} />
      <Cards title="Reading the result">
        <Card title="It might not win">
          <p>In our own tests, corner sense didn't clearly beat the plain version after a few hundred test drives. On this one track, the brain can already learn the corners from the rays alone.</p>
          <p>That's a real lesson: a new feature has to be tested, not just assumed to help.</p>
        </Card>
        <Card title="When it should shine">
          <p>Knowing the road ahead matters most when the car goes fast or the corners are a surprise: a new track, a hairpin after a long straight.</p>
        </Card>
        <Card title="Your turn">
          <p>Which other numbers would help a driver? Distance to the next corner? How fast the car is turning? The ideas for the next levels start here.</p>
        </Card>
      </Cards>
    </>
  );
}
