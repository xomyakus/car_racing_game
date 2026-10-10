import { ReactNode, useEffect, useState } from 'react';
import type { Lab, Speed } from '../sim/lab';
import { POP } from '../sim/lab';
import { archText, weightCount } from '../sim/brain';
import { progressPct } from '../sim/car';
import { inputLabels, sensorText } from '../sim/sensors';
import { REWARDS, resultText } from '../sim/score';
import { WHY_LONG } from '../sim/text';
import { saveChampion } from '../sim/storage';
import { useTick, useToast } from '../hooks';
import { TrackPick, TrackStage } from './TrackStage';
import { ordinal, useTrackRecords } from './trackRecords';
import { NetDiagram } from './NetDiagram';
import { PerceptronDiagram } from './PerceptronDiagram';
import { LabChart } from './LabChart';
import { GenTable, PopLog, TestedList } from './LabTables';

interface Props {
  lab: Lab;
  /** level number, for saving the champion */
  level: number;
  /** key the champion is saved under */
  saveKey: string;
  onReset: () => void;
  /** extra panel shown at the top of the side column */
  sideTop?: ReactNode;
  showWeights?: boolean;
  /** small track menu over the track view */
  trackPick?: TrackPick;
}

/** Brain shape plus anything special about its senses or reward, e.g. "7 → 16 → 16 → 2 · noise 0.1". */
export function setupText(lab: Lab): string {
  return [archText(lab.layers), sensorText(lab.spec), lab.reward !== 'race' ? `reward: ${REWARDS[lab.reward].name}` : '']
    .filter(Boolean).join(' · ');
}

const SPEEDS: Speed[] = [1, 5, 20, 'max'];

/** Track + controls + live network + stats for training one network shape by evolution. */
export function LabView({ lab, level, saveKey, onReset, sideTop, showWeights, trackPick }: Props) {
  useTick(6);
  const [toast, showToast] = useToast();
  const labels = inputLabels(lab.spec);
  // championship records for this track (multi-track training has no single track)
  const records = useTrackRecords(lab.tracks.length === 1 ? lab.tracks[0].id : null, saveKey);

  useEffect(() => {
    lab.onEvent = showToast;
    const multiTrack = lab.tracks.length > 1;
    const where = multiTrack ? lab.tracks.map(t => t.name).join(' + ') : lab.tracks[0].name;
    // the championship keeps whichever is better: a new best racer or a new fastest lap
    lab.onBest = lab.onFastLap = e => saveChampion(saveKey, {
      layers: lab.layers, spec: lab.spec, w: Array.from(e.brain.w), pct: e.pct, raceTime: e.raceTime, of: e.of, bestLap: e.bestLap,
      level, name: `Level ${level} · ${archText(lab.layers)} · ${where}`,
      track: multiTrack ? 'multi' : lab.tracks[0].id, tracks: lab.tracks.map(t => t.id), setup: setupText(lab),
      tests: lab.testsDone, generation: lab.mode === 'pop' ? lab.popGen : lab.gens.length, reward: lab.reward, savedAt: Date.now(),
    });
    return () => { lab.onEvent = null; lab.onBest = null; lab.onFastLap = null; };
  }, [lab, saveKey, level, showToast]);

  const single = lab.mode === 'single';
  const multi = lab.tracks.length > 1;
  const c = lab.car, cur = lab.current;
  const lapChip = (car: NonNullable<typeof c>) => {
    const pct = (car.maxProg / car.track.L) * 100;
    return pct >= 100 ? `lap ${Math.min(lab.raceLaps, car.laps.length + (car.alive ? 1 : 0))} of ${lab.raceLaps}` : `${Math.max(0, pct).toFixed(0)}% of lap 1`;
  };
  let hud: ReactNode = null;
  if (single && c && (cur || lab.exam || lab.exams.length)) {
    const name = lab.exam ? `Exam: ${lab.exam.label}` : !cur ? `Exam: ${lab.exams[0]?.label ?? ''}`
      : cur.origin === 'child' ? `Brain #${cur.no}, child of #${cur.parent}` : cur.label ? `Brain #${cur.no}: ${cur.label}` : `Random brain #${cur.no}`;
    hud = <>
      <span className={`chip${lab.exam || !cur ? ' blue' : ''}`}>{name}</span>
      {(multi || c.track.id !== 'classic') && <span className="chip">{c.track.name}{multi && cur && !lab.exam ? ` (${lab.leg + 1} of ${lab.tracks.length})` : ''}</span>}
      <span className="chip">{lapChip(c)}</span>
      <span className="chip">{c.t.toFixed(1)}s</span>
      {lab.auto && <span className="chip good">{lab.paused ? 'Paused' : `Evolving ${lab.speed === 'max' ? 'Max' : `${lab.speed}×`}`}</span>}
      {!c.alive && c.why && <span className={`chip ${c.done ? 'good' : 'red'}`}>{WHY_LONG[c.why]}{c.done ? ` in ${c.t.toFixed(1)}s` : ''}{lab.auto ? ' · next brain…' : ''}</span>}
    </>;
  } else if (single) {
    hud = <span className="chip good">Press “Start evolution”</span>;
  } else {
    const alive = lab.pop.filter(x => x.alive).length, fin = lab.pop.filter(x => x.done).length;
    const lead = lab.focus();
    hud = <>
      <span className="chip">Gen {lab.popGen}</span>
      {multi && <span className="chip">{lab.tracks[lab.popLeg].name} ({lab.popLeg + 1} of {lab.tracks.length})</span>}
      <span className="chip">{alive} racing</span>
      {lead && <span className="chip">leader: {lead.laps.length ? `lap ${Math.min(lab.raceLaps, lead.laps.length + 1)}` : `${progressPct(lead).toFixed(0)}%`}</span>}
      {fin > 0 && <span className="chip good">{fin} finished</span>}
      {!lab.auto && <span className="chip good">Press “Start evolving”</span>}
    </>;
  }

  const focus = lab.focus();
  const best = lab.best;
  // this level's place in this track's championship
  const place = records?.place;
  const placeLine = place && <small className="record place">championship: {ordinal(place)}{place <= 3 ? ` ${['🥇', '🥈', '🥉'][place - 1]}` : ''}</small>;
  const goal = lab.reward === 'race'
    ? <>Goal: finish all <b>{lab.raceLaps} laps</b>{multi ? <> on each of the <b>{lab.tracks.length} tracks</b></> : null}, then finish faster.</>
    : <>Reward rule: <b>{REWARDS[lab.reward].name}</b>. {REWARDS[lab.reward].rule}</>;
  return (
    <>
      {/* level 2's two perceptron pictures need their full size, so that side panel may be taller than the track */}
      <div className={`stage labstage${showWeights && lab.layers.length === 2 ? ' tallside' : ''}`}>
        <div className="board">
          <TrackStage label="Race track" advance={el => lab.advance(el)} scene={() => lab.sceneState()} hud={hud} toast={toast} trackPick={trackPick} />
          <div className="controls" data-tour="lab-buttons">
            <button className="btn primary" data-tour="lab-mode"
              onClick={() => { if (lab.auto) lab.paused = !lab.paused; else lab.startEvolution(); }}>
              {lab.auto ? (lab.paused ? '▶ Resume' : '❚❚ Pause') : best ? '▶ Keep evolving' : '▶ Start evolution'}
            </button>
            <button className="btn" disabled={(lab.auto && !lab.paused) || (!lab.paused && !!lab.car?.alive)} onClick={() => lab.oneStep()}>One step</button>
            <span className="seglabel">Speed</span>
            <div className="seg" data-tour="lab-speed" role="group" aria-label="Simulation speed">
              {SPEEDS.map(s => (
                <button key={s} aria-pressed={lab.speed === s} onClick={() => { lab.speed = s; }}>{s === 'max' ? 'Max' : `${s}×`}</button>
              ))}
            </div>
            <button className="btn ghost small" onClick={onReset}>Start over</button>
          </div>
        </div>
        <aside className="side">
          {sideTop}
          <div className="panel brainpanel" data-tour="lab-brain">
            <h3>{single ? 'Brain on the track' : 'Brain of the car in front'} · {archText(lab.layers)} · {weightCount(lab.layers)} weights</h3>
            {showWeights && lab.layers.length === 2 && (focus?.brain ?? best?.brain)
              // no hidden layer: each output is its own perceptron, so draw them as two separate pictures
              ? (['gas', 'steer'] as const).map((kind, j) => {
                  const brain = (focus?.brain ?? best!.brain), n = lab.layers[0];
                  return <PerceptronDiagram key={kind} kind={kind} labels={labels} weights={brain.w.subarray(j * (n + 1), (j + 1) * (n + 1))} inputs={focus?.brain ? focus.inp : undefined} />;
                })
              : <NetDiagram source={() => (focus?.brain ? { brain: focus.brain, acts: focus.acts } : best ? { brain: best.brain } : null)}
                  labels={labels} wide showWeights={showWeights} />}
            <div className="legend">
              <span><i style={{ background: 'var(--pos)' }} />positive weight (push)</span>
              <span><i style={{ background: 'var(--neg)' }} />negative weight (pull)</span>
            </div>
          </div>
        </aside>
      </div>
      <div className="panel statrow" data-tour="lab-best">
        <div className="tiles">
          <div className="tile"><span>Best brain</span><b>{best ? `#${best.no}` : '—'}</b><small>{best ? resultText(best) : 'nothing tested yet'}</small>
            {records && <small className="record">{records.race ? `track champion: ${records.race.time.toFixed(1)}s, level ${records.race.level}` : 'no track champion yet'}</small>}
            {placeLine}</div>
          {single
            ? <div className="tile"><span>Generation</span><b>{lab.curGen?.n ?? 0}</b><small>{lab.stats.kids} children tried</small></div>
            : <div className="tile"><span>Generation</span><b>{lab.popGen}</b><small>{POP} cars per race</small></div>}
          <div className="tile"><span>Fastest lap</span><b>{lab.fastestLap?.bestLap != null ? `${lab.fastestLap.bestLap.toFixed(2)}s` : '—'}</b>
            <small>{lab.fastestLap ? `brain #${lab.fastestLap.no}${lab.fastestLap === best ? ', the best brain' : ''}` : 'counts once a brain finishes the race'}</small>
            {records && <small className="record">{records.lap ? `track record: ${records.lap.time.toFixed(2)}s, ${records.lap.who}` : 'no lap record yet'}</small>}
            {placeLine}</div>
          <div className="tile"><span>Test drives</span><b>{lab.testsDone}</b><small>{lab.tracks.length > 1 ? `${lab.tracks.length} tracks each` : lab.tracks[0].name}</small></div>
        </div>
        <p className="small">
          {goal}{' '}
          {single
            ? <>Each child is a copy of the best brain with some weights nudged by about <b>{lab.nudgeSize().toFixed(2)}</b>{lab.stats.fails >= 5 ? `, growing after ${lab.stats.fails} misses in a row` : ''}.</>
            : <>The 5 best cars become parents; the winner also races again unchanged.</>}
        </p>
      </div>
      <div className="labgrid">
        <Fold tour="lab-chart" title={single ? 'Generations' : 'Race diary'}
          summary={single
            ? `${lab.gens.length} generation${lab.gens.length === 1 ? '' : 's'} · ${lab.stats.kids} children tried · ${lab.stats.better} beat their parent`
            : `${lab.popGen} races of ${POP} cars`}>
          <LabChart lab={lab} />
          <div className="legend">
            {single ? <>
              <span><i style={{ background: 'var(--ink)' }} />best so far</span>
              <span><i className="dot" style={{ background: 'var(--pos)' }} />child</span>
              <span><i className="dot" style={{ background: 'var(--good)' }} />child that beat its parent</span>
              <span><i className="dot" style={{ background: 'var(--purple)' }} />random</span>
              <span><i className="dot" style={{ background: 'var(--red)' }} />hand-made</span>
            </> : <>
              <span><i style={{ background: 'var(--ink)' }} />best ever</span>
              <span><i style={{ background: 'var(--pos)' }} />best of each race</span>
              <span><i style={{ background: 'var(--muted)' }} />average of all {POP}</span>
            </>}
          </div>
          {single ? <GenTable lab={lab} /> : <PopLog lab={lab} />}
        </Fold>
        <Fold tour="lab-list" title="Tested brains"
          summary={`${lab.testsDone} test drive${lab.testsDone === 1 ? '' : 's'}${best ? ` · best #${best.no}: ${resultText(best)}` : ''}`}>
          <TestedList lab={lab} />
          <p className="small">Tap a brain to watch it drive again. Same weights, same drive, every time{lab.spec.noise > 0 ? ' (except for the sensor noise)' : ''}.</p>
        </Fold>
      </div>
    </>
  );
}

/** A panel that starts folded to one line; its contents are only built while it is open. */
function Fold({ title, summary, tour, children }: { title: string; summary: string; tour: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="panel fold" data-tour={tour} open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>
        <h2>{title}</h2>
        <span className="foldsum">{summary}</span>
        <span className="foldhint">{open ? 'hide' : 'show'}</span>
      </summary>
      {open && <div className="foldbody">{children}</div>}
    </details>
  );
}
