import { useState } from 'react';
import type { Lab } from '../sim/lab';
import { BASIC, withFeatures } from '../sim/sensors';
import { getLab, testCount } from '../sim/labCache';
import { resultText } from '../sim/score';
import { useTick } from '../hooks';
import { SensorBars } from '../components/SensorBars';
import { SteerTrace } from '../components/SteerTrace';
import { Card, Cards, LevelHeader, TrainingSection } from './common';

const MEMORY = withFeatures(BASIC, ['lastGas', 'lastSteer']);
const ON = { key: 'L12:on', config: { layers: [9, 16, 16, 2], spec: MEMORY } };
const OFF = { key: 'L12:off', config: { layers: [7, 16, 16, 2], spec: BASIC } };
/** steering change per step, times 100: lower is smoother */
const wobble = (lab: Lab) => (lab.best ? Math.round(lab.best.wobble * 100) : null);

function Side({ lab }: { lab: Lab }) {
  useTick(10);
  return (
    <div className="panel">
      <h3>Steering, last 3 seconds</h3>
      <SteerTrace car={() => lab.focus()} />
      <h3>What this car feels</h3>
      <SensorBars car={lab.focus()} spec={lab.spec} />
    </div>
  );
}

function Compare() {
  useTick(2);
  const tile = (name: string, lab: Lab) => (
    <div className="tile">
      <span>{name}</span>
      <b>{lab.best ? resultText(lab.best) : '—'}</b>
      <small>{testCount(lab)} test drives · wobble {wobble(lab) ?? '—'}</small>
    </div>
  );
  return (
    <div className="tiles">
      {tile('No memory', getLab(OFF.key, OFF.config))}
      {tile('With memory', getLab(ON.key, ON.config))}
    </div>
  );
}

export function Level12() {
  const [on, setOn] = useState(true);
  const cfg = on ? ON : OFF;
  return (
    <>
      <LevelHeader n={12} title="Memory">
        Every brain so far lives only in this moment: it has no idea what it did a split second ago. Here we feed its last gas and steering back in as two extra inputs.
      </LevelHeader>
      <Cards title="A tiny memory">
        <Card title="Last gas, last steer">
          <p>Each step, the brain gets the 7 usual numbers plus the gas and steering it chose one step earlier. Now it can tell "I'm already turning" from "I'm going straight".</p>
        </Card>
        <Card title="Why it might help">
          <p>Brains without memory often steer in a zig-zag: full left, full right, full left. Knowing its last move lets a brain make gentle, steady turns instead.</p>
        </Card>
        <Card title="Recurrent networks">
          <p>A network that feeds its own outputs back in as inputs is called <b>recurrent</b>. Bigger versions of this idea power speech recognition and translation.</p>
        </Card>
      </Cards>
      <section className="section">
        <h2 className="sectiontitle">The experiment</h2>
        <p className="sectionlead">Same brain shape, same training. Train both versions and compare race results and wobble: how much the steering jumps each step (lower is smoother).</p>
        <div className="controls">
          <div className="seg" role="group" aria-label="Memory">
            <button aria-pressed={on} onClick={() => setOn(true)}>Memory ON (9 inputs)</button>
            <button aria-pressed={!on} onClick={() => setOn(false)}>OFF (7 inputs)</button>
          </div>
        </div>
        <Compare />
      </section>
      <TrainingSection key={cfg.key} n={12} labKey={cfg.key} config={cfg.config} sideTop={lab => <Side lab={lab} />} />
      <Cards title="What to look for">
        <Card title="Watch the steering line">
          <p>The steering chart next to the track shows the last 3 seconds. A calm wave is smooth driving; a spiky saw is wobbling.</p>
        </Card>
        <Card title="Smooth isn't automatic">
          <p>Memory makes smooth driving <i>possible</i>, but evolution only cares about the race result. If wobbling doesn't cost time, the brain may keep doing it. Level 13 changes that.</p>
        </Card>
      </Cards>
    </>
  );
}
