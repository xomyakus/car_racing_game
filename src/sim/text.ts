import type { EndReason } from './car';

export const WHY_TEXT: Record<EndReason, string> = {
  wall: 'hit a wall', stuck: 'stood still', back: 'turned around', race: 'finished the race!', time: 'too slow',
};

export const WHY_LONG: Record<EndReason, string> = {
  wall: 'Crashed into a wall', stuck: 'Stood still', back: 'Turned around',
  race: 'Finished the race', time: 'Too slow: a lap took too long',
};
