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
      { at: 'why', say: "But first: why do we need one? In level one, you were the brain. A computer car only has seven numbers, and sixty times a second something has to turn them into two decisions: how much gas, and which way to steer. That something is a perceptron." },
      { at: 'perceptron', say: 'A perceptron is a tiny pretend brain cell. It does three things. It multiplies each number by a weight. It adds them all up, plus one extra number called the bias. Then it squeezes the answer, so it lands between minus one and plus one.' },
      { at: 'weights', say: 'A weight says how much one number matters. Blue weights push: more of this means more output. Orange weights pull the other way. And a weight near zero means: ignore this one.' },
      { at: 'count', say: "Each perceptron has seven weights and one bias. Two perceptrons, so that's sixteen numbers. And that's the whole brain!" },
      { at: 'playground', say: "Let's try one! This gas perceptron only has three inputs. Move the sliders and watch it multiply, add, and squeeze. Can you make it hit the brakes?" },
      { at: 'tuner', say: 'Now the real thing. These sixteen sliders are the whole driving brain. We set them up as an example driver to get you started. Gas likes a long line ahead, and steering turns toward the side with more room.' },
      { at: 'tuner-test', say: 'Press Test drive this brain, and your car races ten laps using your sliders. Change a slider and test again to see what happens!' },
      { at: 'track', say: 'Your brain drives down here. If the car hits a wall, stands still, or turns around, the test drive is over.' },
      { at: 'lab-mode', say: 'Now for the magic: evolution! Press Start evolution. The computer copies the best brain and nudges its weights just a little. If the copy drives better, it becomes the new best. Then it does it again, and again.' },
      { at: 'lab-buttons', say: 'Pause stops everything so you can look. One step tests just one more brain. And the small Start over button throws all the brains away.' },
      { at: 'lab-speed', say: 'Waiting is boring, so use these buttons to speed things up. Max is the fastest!' },
      { at: 'lab-brain', say: 'Here you can watch the brain think while it drives. Thick lines are big weights, and the circles light up as signals flow through.' },
      { at: 'lab-chart', say: 'Open Generations to see a chart of your brains getting better. First they learn to go further, and then they learn to go faster.' },
      { at: 'lab-list', say: "Open Tested brains to see every brain you tried. Tap one to watch it drive again. When you're ready, press Next level, and I'll tell you what two perceptrons can't do." },
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
      { at: 'lab-mode', say: 'Training works just like before. Press Start evolution, and let it do the rest.' },
      { at: 'trackpick', say: 'Want a challenge? Use this track menu to train on a famous Formula one track, like Monza or Monaco.' },
      { at: 'lab-speed', say: 'Bigger brains can take longer to learn, so try Max speed if you get impatient.' },
      { at: 'lab-best', say: "Keep an eye on your best brain. The red writing shows the champion of this track. Can you beat it? When you're done, press Next level, and I'll tell you why more layers might help." },
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
  // ---------- levels 4 to 14 ----------
  {
    id: introId(4),
    title: 'Level 4: Two hidden layers',
    steps: [
      { at: 'levelhead', say: "Level four! This brain has two hidden layers, with sixteen neurons each. It's the brain from the video that started this whole game." },
      { at: 'layers', say: 'The first hidden layer turns the raw numbers into simple ideas, like: wall close on the left. The second layer mixes those into bigger ideas, like: a sharp right bend is coming, and I am too fast!' },
      { at: 'count', say: 'That makes four hundred and thirty four weights. Most of them sit between the two hidden layers. That is twenty seven times more than two perceptrons!' },
      { at: 'shape', say: "Here's the whole brain. During training, watch which lines light up. That's where the signals flow." },
      { at: 'lab-mode', say: 'Press Start evolution. Big brains often start slowly, so turn the speed up to Max and give it some time.' },
      { at: 'lab-best', say: 'Down here you can see your best brain and its fastest lap. The red writing shows the current champion of this track.' },
      { at: 'championship', say: 'Every best brain goes into the Championship. Open it up here to see who is fastest on each track.' },
    ],
  },
  {
    id: outroId(4),
    title: 'What happened with the big brain?',
    steps: [
      { at: 'outro', say: "Let's look at what happened." },
      { at: 'outro-1', say: 'With four hundred and thirty four knobs, a big brain is more lost at first. But once it gets going, it can learn finer driving.' },
      { at: 'outro-2', say: 'Most children are worse than their parent. Only now and then is one better. That is why evolution needs patience.' },
      { at: 'outro-3', say: 'And bigger is not always better. In our tests, the smaller brain from level three was almost as fast!' },
      { at: 'levelend', say: "In level five, you design the brain yourself. Let's go!" },
    ],
  },
  {
    id: introId(5),
    title: 'Level 5: Build your own',
    steps: [
      { at: 'levelhead', say: "Level five: you're the designer! You choose how many hidden layers the brain has, and how many neurons go in each one." },
      { at: 'builder', say: 'Use the plus and minus buttons, add or remove layers, or start from a preset. The number of weights changes as you go. Each shape trains on its own, and the table compares all the shapes you tried.' },
      { at: 'lab-mode', say: 'Then press Start evolution, and see how your design does.' },
      { at: 'lab-best', say: 'Your best design goes into the Championship, with its shape written underneath.' },
    ],
  },
  {
    id: outroId(5),
    title: 'Experiments to try',
    steps: [
      { at: 'outro', say: 'Time for some experiments!' },
      { at: 'outro-1', say: 'Try a tiny brain, with just two hidden neurons. Every idea has to squeeze through those two. Can it still finish ten laps?' },
      { at: 'outro-2', say: 'Compare one wide layer with four thin ones. They have about the same number of weights. Which one learns faster?' },
      { at: 'outro-3', say: "And remember: evolution uses random nudges. Train the same shape again, and you'll get a different result. A fair comparison needs a few tries." },
      { at: 'levelend', say: 'Next, we give the car a brand new sense!' },
    ],
  },
  {
    id: introId(6),
    title: 'Level 6: Corner sense',
    steps: [
      { at: 'levelhead', say: 'Level six: corner sense! We give the brain two new numbers about the road ahead, like a driver who already knows the track.' },
      { at: 'bends', say: 'Bend soon says how much the road turns just ahead. Bend later looks even further. Minus one is a sharp left, and plus one a sharp right. You will see them as orange and purple dots on the road.' },
      { at: 'help', say: 'Why might that help? The rays only see walls that are already close. Bend later can warn about a corner while the road still looks straight.' },
      { at: 'features', say: 'Choosing what a brain gets to know is called feature engineering. A good feature can matter more than a bigger brain.' },
      { at: 'experiment', say: 'Here is the experiment. Train with corner sense on, then switch it off and train again. The boxes underneath compare the two.' },
    ],
  },
  {
    id: outroId(6),
    title: 'Did corner sense help?',
    steps: [
      { at: 'outro', say: 'So, did corner sense help?' },
      { at: 'outro-1', say: 'Maybe not much! In our tests, both versions were about equally fast. On one track, the brain can learn the corners from its rays. A new idea always needs testing.' },
      { at: 'outro-2', say: 'Knowing the road ahead helps most on a new track, or when a surprise hairpin comes after a long straight.' },
      { at: 'outro-3', say: 'What else would help a driver? That is what the next levels are all about.' },
      { at: 'levelend', say: "Part two starts now. Let's design the car's eyes!" },
    ],
  },
  {
    id: introId(7),
    title: 'Level 7: Ray designer',
    steps: [
      { at: 'levelhead', say: "Level seven: the ray designer! The yellow rays are the car's eyes. Now you decide how many there are, how far apart, and how far they can see." },
      { at: 'eyes', say: 'Move the sliders, or try a preset like One eye, or Long-sighted. The picture shows your design. Every design trains on its own, and the table compares them.' },
      { at: 'lab-brain', say: 'More rays means more inputs. Count the circles on the left side of the brain!' },
      { at: 'lab-mode', say: 'Press Start evolution to train your design.' },
    ],
  },
  {
    id: outroId(7),
    title: 'What the designs teach',
    steps: [
      { at: 'outro', say: 'What did your designs teach you?' },
      { at: 'outro-1', say: 'Long rays see corners early, so a fast car has time to brake. Wide rays see the walls beside the car.' },
      { at: 'outro-2', say: 'Every extra ray is another input, with sixteen more weights. More information, but more to learn.' },
      { at: 'outro-3', say: "With only one ray, the car sees the wall coming, but can't tell which way to turn. Did your one-eyed car crash?" },
      { at: 'levelend', say: 'Next: what happens if we switch senses off?' },
    ],
  },
  {
    id: introId(8),
    title: 'Level 8: Turn off a sense',
    steps: [
      { at: 'levelhead', say: "Level eight. Which of the seven numbers does a driver really need? Let's switch some off and find out." },
      { at: 'senses', say: 'Tick or untick the senses, or use a preset like No speed. Each set-up trains on its own, and the table compares them. Scientists call this an ablation study.' },
      { at: 'lab-mode', say: 'Pick a set-up, and press Start evolution.' },
    ],
  },
  {
    id: outroId(8),
    title: 'Reading the results',
    steps: [
      { at: 'outro', say: "Let's read the results." },
      { at: 'outro-1', say: "A fair test changes only one thing at a time. Switch off two senses together, and you won't know which one mattered." },
      { at: 'outro-2', say: 'Some senses hide in others. Without speed, the brain can still guess it, because the rays shrink faster when the car is fast.' },
      { at: 'outro-3', say: "Real engineers do this to save money. If a sensor doesn't help, you don't need to build it." },
      { at: 'levelend', say: 'Next, we hand the brain some clever clues.' },
    ],
  },
  {
    id: introId(9),
    title: 'Level 9: Smarter inputs',
    steps: [
      { at: 'levelhead', say: 'Level nine: smarter inputs. Instead of raw numbers, we can do a bit of maths first, and hand the brain a ready-made clue.' },
      { at: 'clues', say: 'Pick your clues. Time to crash says how many seconds until you hit the wall ahead. Brake distance says how far you need to stop. And lane position says where you are across the road.' },
      { at: 'lab-mode', say: 'Press Start evolution, and compare with level four, which only had the basic seven.' },
    ],
  },
  {
    id: outroId(9),
    title: 'Did the clues help?',
    steps: [
      { at: 'outro', say: 'Did the clues help?' },
      { at: 'outro-1', say: 'Time to crash is the distance ahead divided by the speed. Dividing is hard for add and squeeze neurons, so doing it for them can save a lot of training.' },
      { at: 'outro-2', say: 'Building good inputs like this is called feature engineering. It used to be most of the work in machine learning.' },
      { at: 'outro-3', say: 'Compare your result with level four. Did your brain finish ten laps sooner? Is it faster?' },
      { at: 'levelend', say: 'Next up: famous Formula one tracks!' },
    ],
  },
  {
    id: introId(10),
    title: 'Level 10: New tracks',
    steps: [
      { at: 'levelhead', say: 'Level ten: new tracks! A brain that trained on one track might just memorise it. But can it drive a track it has never seen?' },
      { at: 'trainchips', say: 'Pick up to four training tracks. They are simplified versions of real Formula one circuits, like Monza, Monaco and Suzuka. Every test drive races three laps on each one.' },
      { at: 'lab-mode', say: 'Press Start evolution to train on your tracks.' },
      { at: 'exam', say: 'Then run the final exam. Your best brain races every single track, and the table shows which ones it finished. Press Watch to see any of them.' },
    ],
  },
  {
    id: outroId(10),
    title: 'Memorising or understanding?',
    steps: [
      { at: 'outro', say: 'Memorising, or understanding?' },
      { at: 'outro-1', say: 'A brain that only saw one track can learn tricks that only work there, like: turn right after two seconds. That is called overfitting.' },
      { at: 'outro-2', say: 'Train on lots of different tracks, and the only way to do well is to really use the rays. Those brains usually pass more of the exam.' },
      { at: 'outro-3', say: 'Try it! Train on one track and run the exam. Then train on four tracks and run it again. Which brain does better on tracks it never saw?' },
      { at: 'levelend', say: "Next: what if the sensors aren't perfect?" },
    ],
  },
  {
    id: introId(11),
    title: 'Level 11: Noisy sensors',
    steps: [
      { at: 'levelhead', say: 'Level eleven: noisy sensors. Real sensors are never perfect. A bit of dust, a bump in the road, and the numbers wobble.' },
      { at: 'noise', say: 'Choose how noisy the sensors are while the brain trains. The number shows how big the wobble usually is.' },
      { at: 'lab-mode', say: 'Press Start evolution. With noise, the same brain can do a bit better or worse every time.' },
      { at: 'stress', say: 'Then run the stress test. Your best brain drives three times at every noise level, and you see how often it finishes.' },
    ],
  },
  {
    id: outroId(11),
    title: 'Why practise with noise?',
    steps: [
      { at: 'outro', say: 'Why practise with noise?' },
      { at: 'outro-1', say: 'A brain trained with perfect sensors can rely on tiny details. Add a little noise, and those details turn into nonsense.' },
      { at: 'outro-2', say: "A brain that always practised with wobbly numbers learns to look at the big picture. It's much harder to break." },
      { at: 'outro-3', say: 'Engineers do exactly this when they train robots and self-driving cars in a simulator, so they still work in the real world.' },
      { at: 'levelend', say: 'Next, we give the brain a tiny memory.' },
    ],
  },
  {
    id: introId(12),
    title: 'Level 12: Memory',
    steps: [
      { at: 'levelhead', say: 'Level twelve: memory! So far, every brain lives only in this moment. Now we feed its last gas and steering back in, as two extra inputs.' },
      { at: 'memory', say: "Each moment, the brain gets the usual seven numbers, plus what it did one step ago. Now it knows: I'm already turning." },
      { at: 'zigzag', say: 'Brains without memory often zig-zag: full left, full right, full left. Memory makes a smooth, steady turn possible.' },
      { at: 'recurrent', say: 'A network that feeds its own answers back in is called recurrent. Bigger versions of this help computers understand speech.' },
      { at: 'experiment', say: 'Train with memory on, then off, and compare the race times and the wobble.' },
    ],
  },
  {
    id: outroId(12),
    title: 'What did memory do?',
    steps: [
      { at: 'outro', say: 'What did you see?' },
      { at: 'outro-1', say: 'Watch the steering line next to the track. A calm wave is smooth driving. A spiky saw is wobbling.' },
      { at: 'outro-2', say: "Memory makes smooth driving possible, but evolution only cares about the race result. If wobbling doesn't cost time, the brain might keep wobbling. Level thirteen changes that!" },
      { at: 'levelend', say: "Let's change the rules!" },
    ],
  },
  {
    id: introId(13),
    title: 'Level 13: Reward design',
    steps: [
      { at: 'levelhead', say: 'Level thirteen: reward design. Evolution keeps whichever brain scores best. But you get to decide what best means!' },
      { at: 'rules', say: 'Pick a rule. Race result is the one we always used. Longest time on track, fastest average speed, and smooth driving each reward something different. Watch what the brains learn to do. It might surprise you!' },
      { at: 'lab-mode', say: 'Press Start evolution, and watch the driving, not just the score.' },
    ],
  },
  {
    id: outroId(13),
    title: 'Reward hacking',
    steps: [
      { at: 'outro', say: 'Did the brains do what you wanted?' },
      { at: 'outro-1', say: "Evolution doesn't know what you meant. It only knows the score. If a silly trick gets a higher score, evolution will find it. That is called reward hacking." },
      { at: 'outro-2', say: "With longest time on track, the best plan is to crawl round as slowly as the rules allow. The car isn't broken. It's doing exactly what it was rewarded for!" },
      { at: 'outro-3', say: 'People who build AI spend lots of time choosing rewards carefully, and they always check what the AI really does.' },
      { at: 'levelend', say: 'One more level: a brain that learns from you!' },
    ],
  },
  {
    id: introId(14),
    title: 'Level 14: Learn from you',
    steps: [
      { at: 'levelhead', say: "Level fourteen, the last one! This time the brain doesn't learn by evolution. It learns by copying you!" },
      { at: 'record', say: 'First, press Start recording, and drive two or three clean laps. Every moment, the game saves what the car felt, and which keys you pressed.' },
      { at: 'copytrain', say: 'Then press Train. The brain uses backpropagation to change its weights, so its answers get closer to yours. Watch the mistakes go down, and see how often it copies you.' },
      { at: 'copywatch', say: 'Finally, press Watch the copycat, and see your brain drive all by itself!' },
    ],
  },
  {
    id: outroId(14),
    title: 'Two ways to learn',
    steps: [
      { at: 'outro', say: 'Two ways to learn!' },
      { at: 'outro-1', say: 'Evolution tries brains, gives them a score, and keeps the best. Nobody tells it the right move, only how well it did.' },
      { at: 'outro-2', say: 'Copying is different. For every moment, the brain knows the right answer: what you pressed. Backpropagation fixes every weight a little, thousands of times a second.' },
      { at: 'outro-3', say: "If the copycat drifts somewhere you never drove, it has no examples, and it doesn't know what to do. Try recording some rescues!" },
      { at: 'outro-4', say: 'A perfect copycat drives exactly like you, mistakes and all. To get better than its teacher, a brain needs a score to improve on, like evolution.' },
      { at: 'levelend', say: "You finished every level! You built brains, designed senses, raced Formula one tracks, and taught a car to copy you. Check the Championship, and keep racing!" },
    ],
  },
];

export const NARRATIONS: Record<string, Narration> = Object.fromEntries(list.map(n => [n.id, n]));
