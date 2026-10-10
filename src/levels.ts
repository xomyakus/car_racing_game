export interface LevelDef {
  n: number;
  title: string;
  /** one line for the level card */
  blurb: string;
  /** network shape or idea shown on the card */
  arch: string;
  part: 1 | 2;
}

export const PARTS: Record<1 | 2, { title: string; blurb: string }> = {
  1: { title: 'Part 1 · Build a brain', blurb: 'From one neuron to deep networks that learn to race.' },
  2: { title: 'Part 2 · Senses, tracks and learning', blurb: 'Choose what the car feels, test it on famous F1 tracks, and try new ways to learn.' },
};

export const LEVELS: LevelDef[] = [
  { n: 1, part: 1, title: 'You drive', blurb: 'Drive the track yourself, including famous F1 circuits, and see the 7 numbers a car can feel.', arch: 'your brain' },
  { n: 2, part: 1, title: 'Two perceptrons', blurb: 'One neuron for gas, one for steering. Tune 16 weights by hand, then let evolution try.', arch: '7 → 2' },
  { n: 3, part: 1, title: 'One hidden layer', blurb: 'Add 8 hidden neurons that can notice things like "fast and close to a wall".', arch: '7 → 8 → 2' },
  { n: 4, part: 1, title: 'Two hidden layers', blurb: 'Ideas built on ideas: the 434-weight brain from the video.', arch: '7 → 16 → 16 → 2' },
  { n: 5, part: 1, title: 'Build your own', blurb: 'Pick how many layers and neurons. Find out what shape learns best.', arch: 'you decide' },
  { n: 6, part: 1, title: 'Corner sense', blurb: 'Teach the car to feel the bends ahead. Does knowing more beat thinking harder?', arch: '9 → 16 → 16 → 2' },
  { n: 7, part: 2, title: 'Ray designer', blurb: 'How many sensor rays, pointing where, how long? Design the car\'s eyes.', arch: 'rays' },
  { n: 8, part: 2, title: 'Turn off a sense', blurb: 'Switch inputs off one by one to find out which ones really matter.', arch: 'fewer inputs' },
  { n: 9, part: 2, title: 'Smarter inputs', blurb: 'Hand the brain ready-made clues: time to crash, braking distance, lane position.', arch: 'new features' },
  { n: 10, part: 2, title: 'New tracks', blurb: 'Train on one track, race on famous F1 circuits it has never seen. Memorising or understanding?', arch: 'F1 circuits' },
  { n: 11, part: 2, title: 'Noisy sensors', blurb: 'Real sensors wobble. Which brains still drive when the numbers are a bit wrong?', arch: 'noise' },
  { n: 12, part: 2, title: 'Memory', blurb: 'Let the brain remember what it just did, and see if it drives more smoothly.', arch: '+ last move' },
  { n: 13, part: 2, title: 'Reward design', blurb: 'Change what counts as "best" and watch evolution find funny shortcuts.', arch: 'rewards' },
  { n: 14, part: 2, title: 'Learn from you', blurb: 'Record your own driving and train a copycat brain with backpropagation.', arch: 'copy you' },
];
