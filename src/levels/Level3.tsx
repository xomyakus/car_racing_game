import { NetDiagram } from '../components/NetDiagram';
import { randomBrain } from '../sim/brain';
import { BASIC, inputLabels } from '../sim/sensors';
import { Card, Cards, LevelHeader, Outro, TrainingSection } from './common';

const LAYERS = [7, 8, 2];
const sample = randomBrain(LAYERS);

export function Level3() {
  return (
    <>
      <LevelHeader n={3} title="One hidden layer">
        Put 8 neurons between the inputs and the outputs. They're called hidden because you never see their numbers on the dashboard, only the car does.
      </LevelHeader>
      <Cards title="What the hidden layer does">
        <Card title="Neurons that notice things" tour="notice">
          <p>Each hidden neuron is a perceptron too. It looks at all 7 inputs and fires when it spots one situation. After training, one might mean "wall close on the left", another "going fast".</p>
          <p>Gas and steer don't look at the raw numbers any more. They look at what the hidden neurons noticed.</p>
        </Card>
        <Card title="Now “and” is possible" tour="and">
          <p>One hidden neuron can learn to fire only when the car is fast <b>and</b> the ahead line is short. The gas perceptron gives that neuron a big negative weight: hard brake, but only in that situation.</p>
          <p>Two perceptrons alone could never do that.</p>
        </Card>
        <Card title="Counting the weights" tour="count">
          <div className="math">inputs → hidden: (7 + 1) × 8 = 64<br />hidden → outputs: (8 + 1) × 2 = 18<br /><b>total = 82 weights</b></div>
          <p>The +1 is each neuron's bias. 82 weights is 5 times more than level 2, so evolution has more knobs to nudge.</p>
        </Card>
        <Card title="The shape: 7 → 8 → 2" wide tour="shape">
          <NetDiagram source={() => ({ brain: sample })} labels={inputLabels(BASIC)} wide />
          <p className="small">These weights are random. Line thickness shows how big each weight is.</p>
        </Card>
      </Cards>
      <TrainingSection n={3} labKey="L3" config={{ layers: LAYERS }} />
      <Outro n={3} title="Why we might want more layers">
        <Card title="Ideas built on ideas" tour="outro-1">
          <p>One hidden layer combines inputs once. A second layer could combine the combinations: "sharp corner coming" plus "going fast" becomes "brake hard <b>now</b>".</p>
        </Card>
        <Card title="Doing more with less" tour="outro-2">
          <p>One layer can, in theory, learn almost anything if it's wide enough. But "wide enough" can mean a huge number of neurons. Stacking layers often does the same job with fewer of them.</p>
        </Card>
        <Card title="But bigger isn't free" tour="outro-3">
          <p>Every extra weight is another knob evolution has to find a good value for. More layers can drive better, but finding those weights can take longer. Level 4 tries two hidden layers. Compare the race times.</p>
        </Card>
      </Outro>
    </>
  );
}
