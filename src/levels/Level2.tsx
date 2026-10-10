import { useState } from 'react';
import { Brain } from '../sim/brain';
import { BASIC, inputLabels } from '../sim/sensors';
import { getLab } from '../sim/labCache';
import { NeuronPlayground } from '../components/NeuronPlayground';
import { PerceptronDiagram, PerceptronKind } from '../components/PerceptronDiagram';
import { Card, Cards, LevelHeader, Outro, TrainingSection } from './common';
import { CountArt, KnobsArt, NoTeamworkArt, RaceTimesArt, StepsArt, StraightLineArt, WhyArt } from './art/Level2Art';

const LAYERS = [7, 2];
const KEY = 'L2';
const LABELS = inputLabels(BASIC);
// [far left, left, ahead, right, far right, speed, direction, bias]
const EXAMPLE = {
  gas: [0, 0, 2.2, 0, 0, -1.6, 0, -0.2],
  steer: [-1.5, -1, 0, 1, 1.5, 0, -1, 0],
};
/** Made-up moments to try the hand-made weights on: [far left, left, ahead, right, far right, speed, direction]. */
const SITUATIONS: { name: string; inp: number[] }[] = [
  { name: 'Straight road, going fast', inp: [0.2, 0.35, 1, 0.35, 0.2, 0.8, 0] },
  { name: 'Wall ahead, going fast', inp: [0.2, 0.35, 0.25, 0.4, 0.3, 0.9, 0] },
  { name: 'Road bends right', inp: [0.15, 0.25, 0.6, 1, 0.8, 0.6, 0] },
  { name: 'Road bends left', inp: [0.8, 1, 0.6, 0.25, 0.15, 0.6, 0] },
];

/** 16 sliders: the whole brain, set by hand, one row per perceptron. */
function Tuner() {
  const [gas, setGas] = useState(EXAMPLE.gas);
  const [steer, setSteer] = useState(EXAMPLE.steer);
  const [sit, setSit] = useState(0);
  const brain: Brain = { layers: LAYERS, w: new Float32Array([...gas, ...steer]) };
  const test = () => {
    getLab(KEY, { layers: LAYERS }).testBrain(brain, 'hand', 'hand-made');
    document.getElementById('train')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const row = (kind: PerceptronKind, vals: number[], set: (v: number[]) => void) => (
    <div className="tunerow">
      <div className="tunecol">
        <h3>{kind === 'gas' ? 'Gas perceptron: +1 full gas, −1 full brake' : 'Steer perceptron: +1 full right, −1 full left'}</h3>
        {[...LABELS, 'bias'].map((r, i) => (
          <div className={`sl${i < 7 ? ' w' : ''}`} key={r}>
            <label htmlFor={`${kind}${i}`}>{i < 7 ? `× ${r}` : '+ bias'}</label>
            <input id={`${kind}${i}`} type="range" min={-3} max={3} step={0.1} value={vals[i]}
              onChange={e => set(vals.map((v, k) => (k === i ? +e.target.value : v)))} />
            <output>{vals[i].toFixed(1)}</output>
          </div>
        ))}
      </div>
      <PerceptronDiagram kind={kind} weights={vals} inputs={SITUATIONS[sit].inp} labels={LABELS} />
    </div>
  );
  return (
    <div className="panel lesson wide" data-tour="tuner">
      <h2>Build a driver by hand</h2>
      <p>These 16 sliders are the entire brain. They start on an example driver we made: the gas perceptron likes a long "ahead" line and dislikes speed, and the steering perceptron turns toward whichever side has more room.</p>
      <div className="controls">
        <span className="seglabel">Try it on:</span>
        <div className="seg" role="group" aria-label="Example situation">
          {SITUATIONS.map((s, i) => <button key={s.name} aria-pressed={sit === i} onClick={() => setSit(i)}>{s.name}</button>)}
        </div>
      </div>
      {row('gas', gas, setGas)}
      {row('steer', steer, setSteer)}
      <div className="controls">
        <button className="btn primary" data-tour="tuner-test" onClick={test}>Test drive this brain</button>
        <button className="btn" onClick={() => { setGas(EXAMPLE.gas); setSteer(EXAMPLE.steer); }}>Back to the example</button>
        <button className="btn ghost" onClick={() => { setGas(gas.map(() => 0)); setSteer(steer.map(() => 0)); }}>Set all to zero</button>
      </div>
      <p className="small">The example finishes all 10 laps, slowly. Can you make it faster? After a test drive, press <b>Start evolution</b> and let evolution improve your design.</p>
    </div>
  );
}

export function Level2() {
  return (
    <>
      <LevelHeader n={2} title="Two perceptrons">
        The smallest brain that can drive: one perceptron decides the gas, another decides the steering. Both look at the same 7 numbers you saw in level 1.
      </LevelHeader>
      <Cards title="Why a perceptron?">
        <Card title="Someone has to decide" tour="why" image={<WhyArt />}>
          <p>In level 1, <b>you</b> were the brain. You looked at the road and pressed the keys.</p>
          <p>A computer car has no eyes and no hands. All it gets is the 7 numbers: five wall distances, its speed and its direction. Sixty times a second, something has to turn those 7 numbers into 2 decisions: <b>how much gas</b> and <b>which way to steer</b>.</p>
          <p>The simplest machine that can do that is a <b>perceptron</b>: a tiny calculator, inspired by the nerve cells in our brains, that looks at some numbers and makes one decision. It was invented in 1958. We need 2 decisions, so we use 2 perceptrons.</p>
        </Card>
      </Cards>
      <Cards title="How a perceptron thinks">
        <Card title="One perceptron = one decision" tour="perceptron" image={<StepsArt />}>
          <p>A perceptron does three things:</p>
          <ol>
            <li><b>Multiply</b> each number coming in by its own weight.</li>
            <li><b>Add</b> them all up, plus one extra number called the bias.</li>
            <li><b>Squeeze</b> the answer so it lands between −1 and +1.</li>
          </ol>
          <p>For gas, +1 is full gas and −1 is full brake. For steering, +1 is full right and −1 is full left.</p>
        </Card>
        <Card title="Reading the weights" tour="weights" image={<KnobsArt />}>
          <p>Think of each weight as a <b>volume knob</b> for one input. It says how much that input matters, and in which direction.</p>
          <ul>
            <li>A <b className="pos">positive</b> weight pushes: more of this input, more output.</li>
            <li>A <b className="neg">negative</b> weight pulls: more of this input, less output.</li>
            <li>A weight near <b>zero</b> means "ignore this input".</li>
          </ul>
          <p>So a big positive weight on "far right" in the steering perceptron means: lots of room on the right, steer right.</p>
        </Card>
        <Card title="Counting the numbers" tour="count" image={<CountArt />}>
          <p>Each perceptron has 7 weights, one for each input, and 1 bias.</p>
          <div className="math">gas: 7 + 1 = 8<br />steer: 7 + 1 = 8<br /><b>total = 16 numbers</b></div>
          <p>That's the whole brain. Different numbers make a different driver.</p>
        </Card>
        <Card title="One perceptron up close" wide tour="playground">
          <p>Here is a gas perceptron with only 3 inputs. Each input has <b>its own weight</b> right under it. Move the sliders and watch the picture: every input is multiplied by its weight, which turns it into a push (blue) or a pull (orange). Then all the pushes and pulls are added up and squeezed into the answer.</p>
          <p className="small">Try it: make the "wall ahead" weight negative. Now a far-away wall makes the car brake, which is the opposite of what we want! The weights decide what the driver does.</p>
          <NeuronPlayground />
        </Card>
      </Cards>
      <section className="section"><div className="lessons"><Tuner /></div></section>
      <div id="train" />
      <TrainingSection n={2} labKey={KEY} config={{ layers: LAYERS }} showWeights />
      <Outro n={2} title="What two perceptrons can't do">
        <Card title="Only straight-line thinking" tour="outro-1" image={<StraightLineArt />}>
          <p>A perceptron can only say "more of this, less of that". It can't say "this matters only when that is true".</p>
          <p>A good driver thinks: <i>brake hard, but only if I'm fast <b>and</b> the wall ahead is close</i>. The faster you go, the earlier you must brake, so the line between "gas" and "brake" is a curve. A perceptron can only draw a straight line.</p>
        </Card>
        <Card title="No teamwork" tour="outro-2" image={<NoTeamworkArt />}>
          <p>The gas perceptron and the steering perceptron never talk. The gas doesn't know the car is about to turn sharply, so it can't ease off for the corner.</p>
        </Card>
        <Card title="What you'll notice" tour="outro-3" image={<RaceTimesArt />}>
          <p>Two perceptrons can learn to finish all 10 laps. In our tests they ended up around 90 seconds, while bigger brains got close to 80. Compare the best race time here with level 3.</p>
          <p>To think "if this <b>and</b> that", the brain needs neurons in between. That's the next level.</p>
        </Card>
      </Outro>
    </>
  );
}
