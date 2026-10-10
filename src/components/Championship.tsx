import { useEffect, useState } from 'react';
import { LEVELS } from '../levels';
import { SavedChampion, championBrain, loadSaved } from '../sim/storage';
import { inputLabels } from '../sim/sensors';
import { NetDiagram } from './NetDiagram';
import { RACE_LAPS } from '../sim/constants';
import { REWARDS, pctText, raceScore } from '../sim/score';
import { TRACK_IDS, TrackId, trackInfo } from '../sim/track';
import { archText, weightCount } from '../sim/brain';

type Col = TrackId | 'multi';
const COLS: Col[] = [...TRACK_IDS, 'multi'];
const colName = (c: Col) => (c === 'multi' ? 'Several tracks' : trackInfo(c).name);
const trackOf = (c: SavedChampion): Col => c.track ?? 'classic';
const levelTitle = (n: number) => LEVELS.find(l => l.n === n)?.title ?? '';
const MEDALS = ['🥇', '🥈', '🥉'];

/** Championship popup: a ranked leaderboard per track, and a table of every level on every track. */
export function Championship({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'board' | 'grid'>('board');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const saved = loadSaved();
  const champs = Object.values(saved.champions);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="champ-title" onClick={onClose}>
      <div className="modalbox" onClick={e => e.stopPropagation()}>
        <div className="sectionhead">
          <h2 id="champ-title" className="sectiontitle">🏆 Championship</h2>
          <div className="seg" role="tablist" aria-label="Championship view">
            <button role="tab" aria-pressed={tab === 'board'} onClick={() => setTab('board')}>Leaderboard</button>
            <button role="tab" aria-pressed={tab === 'grid'} onClick={() => setTab('grid')}>All tracks</button>
          </div>
          <button className="btn small" onClick={onClose} autoFocus>Close</button>
        </div>
        {tab === 'board' ? <Leaderboard champs={champs} humanBest={saved.humanBest} /> : <Grid champs={champs} humanBest={saved.humanBest} />}
      </div>
    </div>
  );
}

interface ViewProps { champs: SavedChampion[]; humanBest: Partial<Record<TrackId, number>> }

/** Best first: finished races by time, then unfinished ones by distance. */
const ranked = (list: SavedChampion[]) => [...list].sort((a, b) => raceScore(b) - raceScore(a));

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
/** "found after 312 test drives · generation 18 · 434 weights" */
function statsText(c: SavedChampion): string {
  const parts: string[] = [];
  if (c.epochs != null) parts.push(`copied you in ${plural(c.epochs, 'training round')}`);
  else if (c.tests != null) parts.push(`found after ${plural(c.tests, 'test drive')}`);
  if (c.generation != null) parts.push(`generation ${c.generation}`);
  parts.push(plural(weightCount(c.layers), 'weight'));
  if (c.savedAt) parts.push(new Date(c.savedAt).toLocaleDateString());
  return parts.join(' · ');
}

/** The whole saved network: every layer, every input, how it was judged, and a picture of all its weights. */
function BrainDetails({ c }: { c: SavedChampion }) {
  const labels = inputLabels(c.spec);
  return (
    <details className="braindetails">
      <summary>Show the brain</summary>
      <div className="brainbox">
        <dl>
          <dt>Layers</dt><dd>{archText(c.layers)} ({c.layers.length - 2} hidden)</dd>
          <dt>Inputs</dt><dd>{labels.join(', ')}</dd>
          <dt>Outputs</dt><dd>gas, steer</dd>
          {c.spec.noise > 0 && <><dt>Sensor noise</dt><dd>{c.spec.noise}</dd></>}
          <dt>Judged by</dt><dd>{REWARDS[c.reward ?? 'race'].name}</dd>
          <dt>Weights</dt><dd>{weightCount(c.layers)}, all saved</dd>
        </dl>
        <NetDiagram source={() => ({ brain: championBrain(c) })} labels={labels} wide />
      </div>
    </details>
  );
}

/** Every saved brain that raced on one track, in finishing order. */
function Leaderboard({ champs, humanBest }: ViewProps) {
  const counts = new Map<Col, number>();
  for (const c of champs) counts.set(trackOf(c), (counts.get(trackOf(c)) ?? 0) + 1);
  const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const [track, setTrack] = useState<Col>(busiest ?? 'classic');
  const here = champs.filter(c => trackOf(c) === track);
  // only races of the same length can be compared, so each length gets its own list
  const lengths = [...new Set(here.map(c => c.of ?? RACE_LAPS))].sort((a, b) => b - a);
  const you = track === 'multi' ? undefined : humanBest[track];
  return (
    <>
      <div className="controls">
        <label className="check" htmlFor="champtrack">Track</label>
        <select id="champtrack" className="select" value={track} onChange={e => setTrack(e.target.value as Col)}>
          {COLS.map(c => <option key={c} value={c}>{colName(c)}{counts.get(c) ? ` (${counts.get(c)})` : ''}</option>)}
        </select>
        {track !== 'multi' && <span className="hint">{trackInfo(track).fact}</span>}
      </div>
      {you != null && <p className="small">Your own best single lap here: <b>{you.toFixed(2)}s</b>. Brains are timed over whole races, so they are ranked separately.</p>}
      {!here.length && <p><b>No brains have raced here yet.</b> Pick this track with the track menu over any level's track view and start evolution.</p>}
      {lengths.map(len => {
        const list = ranked(here.filter(c => (c.of ?? RACE_LAPS) === len));
        return (
          <div key={len} className="board">
            <h3>{len}-lap race{len === RACE_LAPS ? '' : 's'}</h3>
            <ol className="leaderboard">
              {list.map((c, i) => (
                <li key={`${c.level}-${c.setup}-${i}`} className={i === 0 ? 'first' : ''}>
                  <span className="rank">{MEDALS[i] ?? i + 1}</span>
                  <span className="result">
                    <b>{c.raceTime != null ? `${c.raceTime.toFixed(1)}s` : pctText(c.pct)}</b>
                    <small>{c.raceTime != null ? 'finished' : `didn't finish ${len} laps`}</small>
                  </span>
                  <span className="who">
                    <b>Level {c.level} · {levelTitle(c.level)}</b>
                    <small>{c.setup ?? archText(c.layers)}</small>
                    {c.tracks && c.tracks.length > 1 && <small>raced on {c.tracks.map(t => trackInfo(t).name).join(' + ')}</small>}
                    <small className="stats">{statsText(c)}</small>
                  </span>
                  <BrainDetails c={c} />
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </>
  );
}

/** One row per level, one column per track: each level's best result everywhere. */
function Grid({ champs, humanBest }: ViewProps) {
  const cell = (level: number, col: Col): SavedChampion | null => {
    const mine = champs.filter(c => c.level === level && trackOf(c) === col);
    return mine.length ? ranked(mine)[0] : null;
  };
  // the fastest full 10-lap race on each track gets the trophy
  const winner = new Map<Col, SavedChampion>();
  for (const col of COLS) {
    for (const l of LEVELS) {
      const c = cell(l.n, col);
      if (!c || c.raceTime == null || (c.of ?? RACE_LAPS) !== RACE_LAPS) continue;
      const w = winner.get(col);
      if (!w || raceScore(c) > raceScore(w)) winner.set(col, c);
    }
  }
  return (
    <>
      <p className="small">
        The best result of every level on every track. Brains race {RACE_LAPS} laps; the fastest full race on each track gets the trophy.
        Your own times from level 1 are single laps. Where a level lets you try different brains or senses, the winning set-up is shown under the time.
      </p>
      <div className="champwrap">
        <table className="champ">
          <thead>
            <tr><th className="lvlcol">Level</th>{COLS.map(c => <th key={c}>{colName(c)}{c !== 'multi' && <small>{trackInfo(c).country}</small>}</th>)}</tr>
          </thead>
          <tbody>
            {LEVELS.map(l => (
              <tr key={l.n}>
                <th className="lvlcol"><span className="lvlnum">{l.n}</span>{l.title}</th>
                {COLS.map(col => {
                  if (l.n === 1) {
                    const t = col === 'multi' ? undefined : humanBest[col];
                    return <td key={col}>{t != null ? <><b>{t.toFixed(2)}s</b><small>1 lap · you</small></> : <span className="muted">—</span>}</td>;
                  }
                  const c = cell(l.n, col);
                  if (!c) return <td key={col}><span className="muted">—</span></td>;
                  const of = c.of ?? RACE_LAPS, top = winner.get(col) === c;
                  return (
                    <td key={col} className={top ? 'gold' : ''} title={c.tracks && c.tracks.length > 1 ? c.tracks.map(t => trackInfo(t).name).join(' + ') : undefined}>
                      <b>{top && '🏆 '}{c.raceTime != null ? `${c.raceTime.toFixed(1)}s` : pctText(c.pct)}</b>
                      <small>{c.raceTime != null ? `${of} laps` : `of ${of} laps`}</small>
                      {l.setups && c.setup && <span className="setup">{c.setup}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
