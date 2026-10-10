import { NetDiagram } from '../components/NetDiagram';
import { randomBrain } from '../sim/brain';
import { BASIC, inputLabels } from '../sim/sensors';
import { Card, Cards, LevelHeader, TrainingSection } from './common';

const LAYERS = [7, 16, 16, 2];
const sample = randomBrain(LAYERS);

export function Level4() {
  return (
    <>
      <LevelHeader n={4} title="Two hidden layers">
        Two layers of 16 neurons each. This is the brain from the video: 434 weights, and somewhere there's a set of them that drives like a champion.
      </LevelHeader>
      <Cards title="Layers of ideas">
        <Card title="Layer by layer">
          <p>The first hidden layer turns raw numbers into simple ideas: "wall close on the left", "pointing toward the wall".</p>
          <p>The second hidden layer combines those ideas into bigger ones: "a sharp right bend is coming and I'm too fast".</p>
          <p>Gas and steer then act on the big ideas.</p>
        </Card>
        <Card title="Counting the weights">
          <div className="math">7 × 16 + 16 = 128<br />16 × 16 + 16 = 272<br />16 × 2 + 2 &nbsp;= 34<br /><b>total = 434 weights</b></div>
          <p>That's 27 times more than two perceptrons.</p>
        </Card>
        <Card title="The shape: 7 → 16 → 16 → 2" wide>
          <NetDiagram source={() => ({ brain: sample })} labels={inputLabels(BASIC)} wide />
          <p className="small">These weights are random. During training, watch which lines light up: that's where the signal flows.</p>
        </Card>
      </Cards>
      <TrainingSection n={4} labKey="L4" config={{ layers: LAYERS }} />
      <Cards title="What to watch for">
        <Card title="Slower start, higher ceiling">
          <p>With 434 knobs, a random brain is even more lost at first, and each nudge changes a smaller part of it. It can take more brains to finish the first lap than in level 3.</p>
          <p>Once it gets going, it has room to learn finer driving and faster race times.</p>
        </Card>
        <Card title="Try both modes">
          <p><b>One at a time</b> nudges a single parent. <b>20 at once</b> races 20 cars and keeps the 5 best as parents. Which one finds a fast driver sooner?</p>
        </Card>
        <Card title="Is bigger always better?">
          <p>Not always. Sometimes a small brain trains faster and ends up just as quick. In level 5 you decide the shape yourself.</p>
        </Card>
      </Cards>
    </>
  );
}
