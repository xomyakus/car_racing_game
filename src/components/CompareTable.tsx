import { ReactNode } from 'react';
import type { Lab } from '../sim/lab';
import { labsWithPrefix, testCount } from '../sim/labCache';
import { weightCount } from '../sim/brain';
import { resultText } from '../sim/score';
import { useTick } from '../hooks';
import { baseKey } from '../levels/trackChoice';

export interface ExtraColumn { title: string; value: (lab: Lab) => ReactNode }

interface Props {
  /** labs whose cache key starts with this are listed */
  prefix: string;
  current: string;
  /** what to call each lab's set-up, e.g. "5 rays over 120°" */
  describe: (lab: Lab, key: string) => ReactNode;
  onPick: (key: string, lab: Lab) => void;
  extra?: ExtraColumn[];
  empty?: string;
}

/** Every set-up tried in this level, with how far its best brain got. Tap one to go back to it. */
export function CompareTable({ prefix, current, describe, onPick, extra = [], empty = 'Train a set-up and it shows up here.' }: Props) {
  useTick(2);
  const rows = labsWithPrefix(prefix);
  return (
    <div className="gens">
      <table>
        <thead><tr><th>Set-up</th><th>Track</th><th>Weights</th><th>Test drives</th><th>Best</th>{extra.map(c => <th key={c.title}>{c.title}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map(([k, lab]) => (
            <tr key={k} className={k === current ? 'cur' : ''}>
              <td><button className="linkbtn" onClick={() => onPick(baseKey(k), lab)}>{describe(lab, baseKey(k))}</button></td>
              <td>{lab.tracks.map(t => t.name).join(' + ')}</td>
              <td>{weightCount(lab.layers)}</td>
              <td>{testCount(lab)}</td>
              <td>{lab.best ? resultText(lab.best) : '—'}</td>
              {extra.map(c => <td key={c.title}>{c.value(lab)}</td>)}
            </tr>
          )) : <tr><td colSpan={5 + extra.length}>{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
