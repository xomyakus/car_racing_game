// World is 1000 x 640 units. One track sample every 10 units.
export const W = 1000;
export const H = 640;
/** half the road width */
export const HW = 40;
export const CAR_R = 7;
/** how far a sensor ray can see */
export const RAY_LEN = 230;
export const RAY_ANGLES = [-1.05, -0.52, 0, 0.52, 1.05];

export const ACC = 300;
export const BRK = 520;
export const DRAG = 0.9;
export const VMAX = 340;
export const TURN = 3.2;
export const DT = 1 / 60;

/** A test drive is a race of this many laps. */
export const RACE_LAPS = 10;
/** A lap slower than this (seconds) ends the test as "too slow". */
export const LAP_LIMIT = 30;
