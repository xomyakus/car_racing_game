import { ReactNode, useEffect } from 'react';
import type { Lab, Speed } from '../sim/lab';
import { POP } from '../sim/lab';
import { archText, weightCount } from '../sim/brain';
import { progressPct } from '../sim/car';
import { inputLabels } from '../sim/sensors';
import { REWARDS, resultText } from '../sim/score';
import { WHY_LONG } from '../sim/text';
import { saveChampion } from '../sim/storage';
import { useTick, useToast } from '../hooks';
import { TrackStage } from './TrackStage';
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
}

const SPEEDS: Speed[] = [1, 5, 20, 'max'];

/** Track + controls + live network + stats for training one network shape by evolution. */
export function LabView({ lab, level, saveKey, onReset, sideTop, showWeights }: Props) {
  useTick(6);
  const [toast, showToast] = useToast();
  const labels = inputLabels(lab.spec);

  useEffect(() => {
    lab.onEvent = showToast;
    lab.onBest = e => saveChampion(saveKey, {
      layers: lab.layers, spec: lab.spec, w: Array.from(e.brain.w), pct: e.pct, raceTime: e.raceTime, of: e.of,
      level, name: `Level ${level} · ${archText(lab.layers)}`,
    });
    return () => { lab.onEvent = null; lab.onBest = null; };
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
  const goal = lab.reward === 'race'
    ? <>Goal: finish all <b>{lab.raceLaps} laps</b>{multi ? <> on each of the <b>{lab.tracks.length} tracks</b></> : null}, then finish faster.</>
    : <>Reward rule: <b>{REWARDS[lab.reward].name}</b>. {REWARDS[lab.reward].rule}</>;
  return (
    <>
      <div className="stage">
        <div className="board">
          <TrackStage label="Race track" advance={el => lab.advance(el)} scene={() => lab.sceneState()} hud={hud} toast={toast} />
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
          <div className="panel" data-tour="lab-brain">
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
          <div className="panel" data-tour="lab-best">
            <div className="tiles">
              <div className="tile"><span>Best brain</span><b>{best ? `#${best.no}` : '—'}</b><small>{best ? resultText(best) : 'nothing tested yet'}</small></div>
              {single
                ? <div className="tile"><span>Generation</span><b>{lab.curGen?.n ?? 0}</b><small>{lab.stats.kids} children tried</small></div>
                : <div className="tile"><span>Generation</span><b>{lab.popGen}</b><small>{POP} cars per race</small></div>}
            </div>
            <p className="small">
              {goal}{' '}
              {single
                ? <>Each child is a copy of the best brain with some weights nudged by about <b>{lab.nudgeSize().toFixed(2)}</b>{lab.stats.fails >= 5 ? `, growing after ${lab.stats.fails} misses in a row` : ''}.</>
                : <>The 5 best cars become parents; the winner also races again unchanged.</>}
            </p>
          </div>
        </aside>
      </div>
      <div className="labgrid">
        <div className="panel" data-tour="lab-chart">
          <h2>{single ? 'Generations' : 'Race diary'}</h2>
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
        </div>
        <div className="panel" data-tour="lab-list">
          <h2>Tested brains</h2>
          <TestedList lab={lab} />
          <p className="small">Tap a brain to watch it drive again. Same weights, same drive, every time{lab.spec.noise > 0 ? ' (except for the sensor noise)' : ''}.</p>
        </div>
      </div>
    </>
  );
}
