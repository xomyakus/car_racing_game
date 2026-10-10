import { useState } from 'react';
import { Brain } from '../sim/brain';
import { BASIC, inputLabels } from '../sim/sensors';
import { getLab } from '../sim/labCache';
import { NeuronPlayground } from '../components/NeuronPlayground';
import { NetDiagram } from '../components/NetDiagram';
import { Card, Cards, LevelHeader, Outro, TrainingSection } from './common';

const LAYERS = [7, 2];
const KEY = 'L2';
// [far left, left, ahead, right, far right, speed, direction, bias]
const EXAMPLE = {
  gas: [0, 0, 2.2, 0, 0, -1.6, 0, -0.2],
  steer: [-1.5, -1, 0, 1, 1.5, 0, -1, 0],
};
const ROWS = [...inputLabels(BASIC), 'bias'];

/** 16 sliders: the whole brain, set by hand. */
function Tuner() {
  const [gas, setGas] = useState(EXAMPLE.gas);
  const [steer, setSteer] = useState(EXAMPLE.steer);
  const brain: Brain = { layers: LAYERS, w: new Float32Array([...gas, ...steer]) };
  const test = () => {
    getLab(KEY, { layers: LAYERS }).testBrain(brain, 'hand', 'hand-made');
    document.getElementById('train')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const col = (name: string, vals: number[], set: (v: number[]) => void, id: string) => (
    <div className="tunecol">
      <h3>{name} perceptron</h3>
      {ROWS.map((r, i) => (
        <div className={`sl${i < 7 ? ' w' : ''}`} key={r}>
          <label htmlFor={`${id}${i}`}>{i < 7 ? `× ${r}` : '+ bias'}</label>
          <input id={`${id}${i}`} type="range" min={-3} max={3} step={0.1} value={vals[i]}
            onChange={e => set(vals.map((v, k) => (k === i ? +e.target.value : v)))} />
          <output>{vals[i].toFixed(1)}</output>
        </div>
      ))}
    </div>
  );
  return (
    <div className="panel lesson wide" data-tour="tuner">
      <h2>Build a driver by hand</h2>
      <p>These 16 sliders are the entire brain. The sliders start on an example driver we made: the gas perceptron likes a long "ahead" line and dislikes speed, and the steering perceptron turns toward whichever side has more room.</p>
      <div className="tuner">
        {col('Gas', gas, setGas, 'tg')}
        {col('Steer', steer, setSteer, 'ts')}
        <div className="tunecol">
          <h3>Your brain</h3>
          <NetDiagram source={() => ({ brain })} labels={inputLabels(BASIC)} showWeights />
        </div>
      </div>
      <div className="controls">
        <button className="btn primary" data-tour="tuner-test" onClick={test}>Test drive this brain</button>
        <button className="btn" onClick={() => { setGas(EXAMPLE.gas); setSteer(EXAMPLE.steer); }}>Back to the example</button>
        <button className="btn ghost" onClick={() => { setGas(gas.map(() => 0)); setSteer(steer.map(() => 0)); }}>Set all to zero</button>
      </div>
      <p className="small">The example finishes all 10 laps, slowly. Can you make it faster? After a test drive, press <b>Nudge the best brain</b> and let evolution improve your design.</p>
    </div>
  );
}

export function Level2() {
  return (
    <>
      <LevelHeader n={2} title="Two perceptrons">
        The smallest brain that can drive: one perceptron decides the gas, another decides the steering. Both look at the same 7 numbers you saw in level 1.
      </LevelHeader>
      <Cards title="How a perceptron thinks">
        <Card title="One perceptron = one decision" tour="perceptron">
          <p>A perceptron is the simplest artificial neuron. It does three things:</p>
          <ol>
            <li><b>Multiply</b> each number coming in by its own weight.</li>
            <li><b>Add</b> them all up, plus one extra number called the bias.</li>
            <li><b>Squeeze</b> the answer so it lands between −1 and +1.</li>
          </ol>
          <p>For gas, +1 is full gas and −1 is full brake. For steering, +1 is full right and −1 is full left.</p>
        </Card>
        <Card title="Reading the weights" tour="weights">
          <p>A weight says how much one input matters, and in which direction.</p>
          <ul>
            <li>A <b className="pos">positive</b> weight pushes: more of this input, more output.</li>
            <li>A <b className="neg">negative</b> weight pulls: more of this input, less output.</li>
            <li>A weight near <b>zero</b> means "ignore this input".</li>
          </ul>
          <p>So a big positive weight on "far right" in the steering perceptron means: lots of room on the right, steer right.</p>
        </Card>
        <Card title="Counting the numbers" tour="count">
          <p>Each perceptron has 7 weights and 1 bias.</p>
          <div className="math">gas: 7 + 1 = 8<br />steer: 7 + 1 = 8<br /><b>total = 16 numbers</b></div>
          <p>That's the whole brain. Different numbers make a different driver.</p>
        </Card>
        <Card title="One perceptron up close" wide tour="playground">
          <p className="small">This gas perceptron only has 3 inputs. Move the sliders and watch it multiply, add and squeeze.</p>
          <NeuronPlayground />
        </Card>
      </Cards>
      <section className="section"><div className="lessons"><Tuner /></div></section>
      <div id="train" />
      <TrainingSection n={2} labKey={KEY} config={{ layers: LAYERS }} showWeights />
      <Outro n={2} title="What two perceptrons can't do">
        <Card title="Only straight-line thinking" tour="outro-1">
          <p>A perceptron can only say "more of this, less of that". It can't say "this matters only when that is true".</p>
          <p>A good driver thinks: <i>brake hard, but only if I'm fast <b>and</b> the wall ahead is close</i>. To a perceptron, speed always counts the same amount, whatever the rays say.</p>
        </Card>
        <Card title="No teamwork" tour="outro-2">
          <p>The gas perceptron and the steering perceptron never talk. The gas doesn't know the car is about to turn sharply, so it can't ease off for the corner.</p>
        </Card>
        <Card title="What you'll notice" tour="outro-3">
          <p>Two perceptrons can learn to finish all 10 laps. In our tests they ended up around 90 seconds, while bigger brains got close to 80. Compare the best race time here with level 3.</p>
          <p>To think "if this <b>and</b> that", the brain needs neurons in between. That's the next level.</p>
        </Card>
      </Outro>
    </>
  );
}
