import { Lab, LabConfig } from './lab';

/** Labs stay alive while the page is open, so leaving a level and coming back keeps its progress. */
const labs = new Map<string, Lab>();

export function getLab(key: string, cfg: LabConfig): Lab {
  let lab = labs.get(key);
  if (!lab) { lab = new Lab(cfg); labs.set(key, lab); }
  return lab;
}

export function resetLab(key: string, cfg: LabConfig): Lab {
  const lab = new Lab(cfg);
  labs.set(key, lab);
  return lab;
}

export function labsWithPrefix(prefix: string): [string, Lab][] {
  return [...labs.entries()].filter(([k]) => k.startsWith(prefix));
}

/** Test drives done in a lab, both modes together. */
export const testCount = (lab: Lab) => lab.hist.length + Math.max(0, lab.popGen - 1) * 20;
