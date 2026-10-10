// What the coach says, step by step. Each step is read aloud (see scripts/narrate.mjs) and shown as a
// caption while the part of the page marked data-tour="<at>" is spotlighted.
// Kept free of imports so the narrate script can load it straight from Node.

export interface Step {
  /** data-tour name of the element to spotlight */
  at: string;
  /** spoken and shown as the caption */
  say: string;
}

export interface Narration {
  id: string;
  title: string;
  steps: Step[];
}

export const introId = (level: number) => `L${level}-intro`;
export const outroId = (level: number) => `L${level}-outro`;
/** File name (without .mp3) of one step's recording. */
export const clipId = (id: string, step: number) => `${id}-${String(step + 1).padStart(2, '0')}`;

const list: Narration[] = [
  {
    id: introId(1),
    title: 'Welcome to Brain Racers',
    steps: [
      { at: 'levelhead', say: "Hi, and welcome to Brain Racers! I'm your coach. In this game you'll build brains for race cars, and watch them learn to drive all by themselves. But first, it's your turn to drive!" },
      { at: 'track', say: 'This is the race track. Click on it, then use the arrow keys. Up is gas, down is brake, and left and right steer. On a tablet or phone, use the big arrow buttons under the track.' },
      { at: 'hud', say: 'Up here you can see your lap time, how many laps you have done, and your bonks. A bonk is when you crash into a wall. Bonks slow you down, so try to avoid them!' },
      { at: 'camera', say: 'These two buttons switch the camera. Top view shows the whole track from above. Chase cam puts you right behind the car. You can also press the C key.' },
      { at: 'feel', say: 'Now look over here. These bars show what the car can feel. The five yellow ones match the yellow lines sticking out of your car. Each line measures how far away the wall is in that direction.' },
      { at: 'feel', say: "The last two bars are your speed, and which way you're pointing compared to the road. Watch them change while you drive!" },
      { at: 'arrow7', say: "Here's the big idea. These seven numbers go into a brain, and two numbers come out: how much gas, and which way to steer. That's everything an AI driver will ever know!" },
      { at: 'laps', say: 'Every lap you finish shows up here. Your best lap is saved, so later on, your AI cars can try to beat you.' },
      { at: 'drive-controls', say: "Down here you can pick another track, even famous Formula One circuits like Monaco and Monza. And once you've trained some AI brains, you can pick one here and race against it." },
      { at: 'think', say: "When you've had enough driving, read these questions. Could you drive with your eyes closed, if someone read you the seven numbers?" },
      { at: 'next', say: "Then press Next level up here, and we'll build your very first car brain. Now click the track, and press up to go!" },
    ],
  },
  {
    id: introId(2),
    title: 'Level 2: Two perceptrons',
    steps: [
      { at: 'levelhead', say: "Welcome to level two! Now we build a real brain for the car. It's the smallest brain that can drive: just two perceptrons. One decides the gas, and the other decides the steering." },
      { at: 'perceptron', say: 'A perceptron is a tiny pretend brain cell. It does three things. It multiplies each number by a weight. It adds them all up, plus one extra number called the bias. Then it squeezes the answer, so it lands between minus one and plus one.' },
      { at: 'weights', say: 'A weight says how much one number matters. Blue weights push: more of this means more output. Orange weights pull the other way. And a weight near zero means: ignore this one.' },
      { at: 'count', say: "Each perceptron has seven weights and one bias. Two perceptrons, so that's sixteen numbers. And that's the whole brain!" },
      { at: 'playground', say: "Let's try one! This gas perceptron only has three inputs. Move the sliders and watch it multiply, add, and squeeze. Can you make it hit the brakes?" },
      { at: 'tuner', say: 'Now the real thing. These sixteen sliders are the whole driving brain. We set them up as an example driver to get you started. Gas likes a long line ahead, and steering turns toward the side with more room.' },
      { at: 'tuner-test', say: 'Press Test drive this brain, and your car races ten laps using your sliders. Change a slider and test again to see what happens!' },
      { at: 'track', say: 'Your brain drives down here. If the car hits a wall, stands still, or turns around, the test drive is over.' },
      { at: 'lab-mode', say: 'Now for the magic: evolution! In One at a time, the computer copies the best brain and changes its weights just a little. If the copy drives better, it becomes the new best. In twenty at once, twenty cars race together, and the winners become parents.' },
      { at: 'lab-buttons', say: 'Press Nudge the best brain to try one copy, or tick Auto and let evolution keep going on its own.' },
      { at: 'lab-speed', say: 'Waiting is boring, so use these buttons to speed things up. Max is the fastest!' },
      { at: 'lab-brain', say: 'Here you can watch the brain think while it drives. Thick lines are big weights, and the circles light up as signals flow through.' },
      { at: 'lab-chart', say: 'This chart shows your brains getting better. First they learn to go further, and then they learn to go faster.' },
      { at: 'lab-list', say: "Every brain you test lands in this list. Tap one to watch it drive again. When you're ready, press Next level, and I'll tell you what two perceptrons can't do." },
    ],
  },
  {
    id: outroId(2),
    title: "What two perceptrons can't do",
    steps: [
      { at: 'outro', say: "Great driving! Before you go, let's look at what two perceptrons can't do." },
      { at: 'outro-1', say: "A perceptron can only think: more of this, less of that. But a good driver thinks: brake hard, but only if I'm going fast and the wall is close. A perceptron can't think 'only if'." },
      { at: 'outro-2', say: "Also, the gas and steering perceptrons never talk to each other. The gas doesn't know a sharp turn is coming, so it can't slow down for the corner." },
      { at: 'lab-best', say: 'So two perceptrons can finish the race, but slowly. In our tests, it took them about ninety seconds. Remember your best time here!' },
      { at: 'levelend', say: "To think 'this and that', the brain needs more neurons in the middle. That's level three. Let's go!" },
    ],
  },
  {
    id: introId(3),
    title: 'Level 3: One hidden layer',
    steps: [
      { at: 'levelhead', say: 'Level three! This time we add eight new neurons between the inputs and the outputs. They are called the hidden layer, because you never see their numbers. Only the car does.' },
      { at: 'notice', say: 'Each hidden neuron is a perceptron too. It looks at all seven numbers, and learns to light up in one situation. Like: wall close on the left. Or: going really fast.' },
      { at: 'and', say: "And now, 'and' is possible! One hidden neuron can light up only when the car is fast and the wall ahead is close. Then the gas learns: when that neuron lights up, brake hard!" },
      { at: 'count', say: 'More neurons means more weights. This brain has eighty-two of them. That is five times more than level two, so evolution has lots more knobs to turn.' },
      { at: 'shape', say: 'Here is what the brain looks like. Seven inputs on the left, eight hidden neurons in the middle, and gas and steering on the right. The weights are random for now.' },
      { at: 'lab-mode', say: 'Training works just like before. Test one brain at a time, or race twenty at once, and let evolution do the rest.' },
      { at: 'lab-speed', say: 'Bigger brains can take longer to learn, so try Max speed if you get impatient.' },
      { at: 'lab-best', say: "Keep an eye on your best brain. Can it beat your time from level two? When you're done, press Next level, and I'll tell you why more layers might help." },
    ],
  },
  {
    id: outroId(3),
    title: 'Why more layers?',
    steps: [
      { at: 'outro', say: 'Nice work! The hidden layer helps a lot. But could more layers help even more?' },
      { at: 'outro-1', say: 'One hidden layer mixes the inputs just once. A second layer could mix those ideas together. Sharp corner coming, plus going fast, becomes: brake hard, right now!' },
      { at: 'outro-2', say: 'One wide layer can learn almost anything, if it has enough neurons. But enough might mean tons of them. Stacking layers often does the same job with fewer.' },
      { at: 'outro-3', say: "But bigger isn't free. Every extra weight is another knob evolution has to get right. So a bigger brain might drive better, but take longer to learn." },
      { at: 'levelend', say: 'In level four, you will try two hidden layers. Compare the race times, and see which brain wins!' },
    ],
  },
];

export const NARRATIONS: Record<string, Narration> = Object.fromEntries(list.map(n => [n.id, n]));
