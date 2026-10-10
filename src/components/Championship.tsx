import { useEffect, useState } from 'react';
import { LEVELS } from '../levels';
import { SavedChampion, betterChampion, championBrain, loadSaved } from '../sim/storage';
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

/** Total race time, or how far it got: "10 laps in 87.8s" / "4.2 of 10 laps". */
const totalText = (c: SavedChampion) => {
  const of = c.of ?? RACE_LAPS;
  return c.raceTime != null ? `all ${of} laps in ${c.raceTime.toFixed(1)}s` : `${pctText(c.pct)} of ${of} laps`;
};

/** Every saved brain (and you) on one track, fastest single lap first. */
function Leaderboard({ champs, humanBest }: ViewProps) {
  const counts = new Map<Col, number>();
  for (const c of champs) counts.set(trackOf(c), (counts.get(trackOf(c)) ?? 0) + 1);
  for (const t of Object.keys(humanBest) as TrackId[]) counts.set(t, (counts.get(t) ?? 0) + 1);
  const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const [track, setTrack] = useState<Col>(busiest ?? 'classic');
  const you = track === 'multi' ? undefined : humanBest[track];
  type Row = { kind: 'brain'; c: SavedChampion } | { kind: 'you'; lap: number };
  const rows: Row[] = [...ranked(champs.filter(c => trackOf(c) === track)).map(c => ({ kind: 'brain' as const, c }))];
  if (you != null) rows.push({ kind: 'you', lap: you });
  const lapOf = (r: Row) => (r.kind === 'you' ? r.lap : r.c.bestLap ?? null);
  rows.sort((a, b) => {
    const la = lapOf(a), lb = lapOf(b);
    if (la != null && lb != null) return la - lb;
    if (la != null || lb != null) return la != null ? -1 : 1;
    return a.kind === 'brain' && b.kind === 'brain' ? raceScore(b.c) - raceScore(a.c) : 0;
  });
  return (
    <>
      <div className="controls">
        <label className="check" htmlFor="champtrack">Track</label>
        <select id="champtrack" className="select" value={track} onChange={e => setTrack(e.target.value as Col)}>
          {COLS.map(c => <option key={c} value={c}>{colName(c)}{counts.get(c) ? ` (${counts.get(c)})` : ''}</option>)}
        </select>
        {track !== 'multi' && <span className="hint">{trackInfo(track).fact}</span>}
      </div>
      <p className="small">Ranked by <b>fastest single lap</b>, so races of any length (and your own driving) can be compared. The total race time is shown too.</p>
      {!rows.length && <p><b>Nobody has raced here yet.</b> Drive it in level 1, or pick this track with the track menu over any level's track view and start evolution.</p>}
      <ol className="leaderboard">
        {rows.map((r, i) => {
          const lap = lapOf(r);
          return (
            <li key={r.kind === 'you' ? 'you' : `${r.c.level}-${r.c.setup}-${i}`} className={`${i === 0 && lap != null ? 'first' : ''}${r.kind === 'you' ? ' you' : ''}`}>
              <span className="rank">{lap == null ? '–' : MEDALS[i] ?? i + 1}</span>
              <span className="result">
                <b>{lap != null ? `${lap.toFixed(2)}s` : r.kind === 'brain' ? pctText(r.c.pct) : '—'}</b>
                <small>{lap != null ? 'best lap' : r.kind === 'brain' && r.c.bestLap === undefined ? 'lap time not recorded' : 'no full lap'}</small>
              </span>
              {r.kind === 'you'
                ? <span className="who"><b>You · Level 1</b><small>your own driving, with the arrow keys</small></span>
                : <span className="who">
                    <b>Level {r.c.level} · {levelTitle(r.c.level)}</b>
                    <small>{r.c.setup ?? archText(r.c.layers)}</small>
                    {r.c.tracks && r.c.tracks.length > 1 && <small>raced on {r.c.tracks.map(t => trackInfo(t).name).join(' + ')}</small>}
                    <small className="stats">{totalText(r.c)} · {statsText(r.c)}</small>
                  </span>}
              {r.kind === 'brain' && <BrainDetails c={r.c} />}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** One row per level, one column per track: each level's best result everywhere. */
function Grid({ champs, humanBest }: ViewProps) {
  const cell = (level: number, col: Col): SavedChampion | null => {
    const mine = champs.filter(c => c.level === level && trackOf(c) === col);
    return mine.length ? mine.reduce((a, b) => (betterChampion(b, a) ? b : a)) : null;
  };
  // the fastest single lap on each track gets the trophy, you included
  const fastest = new Map<Col, number>();
  for (const col of COLS) {
    const laps = LEVELS.map(l => (l.n === 1 ? (col === 'multi' ? undefined : humanBest[col]) : cell(l.n, col)?.bestLap)).filter((x): x is number => x != null);
    if (laps.length) fastest.set(col, Math.min(...laps));
  }
  return (
    <>
      <p className="small">
        Each level's fastest single lap on every track, with its total race time underneath. The fastest lap on each track gets the trophy, your own laps from level 1 included.
        Where a level lets you try different brains or senses, the winning set-up is shown too.
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
                    const top = t != null && fastest.get(col) === t;
                    return <td key={col} className={top ? 'gold' : ''}>{t != null ? <><b>{top && '🏆 '}{t.toFixed(2)}s</b><small>best lap · you</small></> : <span className="muted">—</span>}</td>;
                  }
                  const c = cell(l.n, col);
                  if (!c) return <td key={col}><span className="muted">—</span></td>;
                  const top = c.bestLap != null && fastest.get(col) === c.bestLap;
                  return (
                    <td key={col} className={top ? 'gold' : ''} title={c.tracks && c.tracks.length > 1 ? c.tracks.map(t => trackInfo(t).name).join(' + ') : undefined}>
                      <b>{top && '🏆 '}{c.bestLap != null ? `${c.bestLap.toFixed(2)}s` : pctText(c.pct)}</b>
                      <small>{c.bestLap != null ? 'best lap' : c.bestLap === undefined ? 'lap not recorded' : 'no full lap'}</small>
                      <small>{totalText(c)}</small>
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
