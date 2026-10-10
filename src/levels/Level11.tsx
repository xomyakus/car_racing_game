import { useMemo, useState } from 'react';
import { getTrack } from '../sim/track';
import { useLevelTrack, withTrack } from './trackChoice';
import { BASIC, SensorSpec } from '../sim/sensors';
import { ExamBatch } from '../sim/examBatch';
import { pctText } from '../sim/score';
import { useFrame, useTick } from '../hooks';
import { LabView } from '../components/LabView';
import { CompareTable } from '../components/CompareTable';
import { Card, Cards, LevelHeader, useLab } from './common';

const LEVELS = [0, 0.05, 0.1, 0.2];
const EXAM_NOISE = [0, 0.05, 0.1, 0.2, 0.3];
const RUNS = 3, LAPS = 3;
const noiseName = (n: number) => (n === 0 ? 'perfect' : n <= 0.05 ? 'a little' : n <= 0.1 ? 'some' : n <= 0.2 ? 'a lot' : 'huge');
const specOf = (noise: number): SensorSpec => ({ ...BASIC, noise });

export function Level11() {
  const [noise, setNoise] = useState(0);
  const [trackId, setTrackId] = useLevelTrack(11);
  const key = withTrack(`L11:${noise}`, trackId);
  const config = useMemo(() => ({ layers: [7, 16, 16, 2], spec: specOf(noise), tracks: [getTrack(trackId)] }), [noise, trackId]);
  const { lab, reset } = useLab(key, config);
  const [exam, setExam] = useState<{ batch: ExamBatch; brainNo: number; key: string } | null>(null);
  useFrame(() => exam?.batch.step(8));
  useTick(4);

  const runExam = () => {
    if (!lab.best) return;
    const brain = lab.best.brain;
    const jobs = EXAM_NOISE.flatMap(n => Array.from({ length: RUNS }, () => ({ key: String(n), brain, spec: specOf(n), track: lab.tracks[0], laps: LAPS })));
    setExam({ key, brainNo: lab.best.no, batch: new ExamBatch(jobs) });
  };
  const ex = exam && exam.key === key ? exam : null;

  return (
    <>
      <LevelHeader n={11} title="Noisy sensors">
        Real sensors are never perfect: a bit of dust, a bump in the road, and the numbers wobble. Here we add a random wobble to every input. Which brains can still drive?
      </LevelHeader>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide">
            <h2>How noisy are the sensors during training?</h2>
            <div className="seg" role="group" aria-label="Training noise">
              {LEVELS.map(n => <button key={n} aria-pressed={noise === n} onClick={() => setNoise(n)}>{noiseName(n)} ({n})</button>)}
            </div>
            <p className="small">The number is how big the wobble usually is. 0.1 means each reading can be off by about 0.1, on a scale where the rays go from 0 to 1. Because the noise is random, the same brain can do a bit better or worse each time it drives.</p>
            <h3>Experiments so far</h3>
            <CompareTable prefix="L11:" current={key} describe={(_, k) => `trained with ${noiseName(+k.slice(4))} noise (${k.slice(4)})`} onPick={k => setNoise(+k.slice(4))} />
          </div>
        </div>
      </section>
      <section className="section">
        <h2 className="sectiontitle">Train with {noiseName(noise)} noise</h2>
        <LabView key={key} lab={lab} level={11} saveKey={key} onReset={reset} trackPick={{ value: trackId, onChange: setTrackId }} />
      </section>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide">
            <div className="sectionhead">
              <h2>Stress test</h2>
              <button className="btn primary" disabled={!lab.best} onClick={runExam}>{lab.best ? `Test brain #${lab.best.no}` : 'Train a brain first'}</button>
            </div>
            <p className="small">The best brain drives {LAPS} laps {RUNS} times at every noise level, off screen.{ex && !ex.batch.done && ` Testing… ${Math.round(ex.batch.progress * 100)}%`}</p>
            <div className="gens tall">
              <table>
                <thead><tr><th>Noise</th><th>Finished</th><th>Average distance</th><th></th></tr></thead>
                <tbody>
                  {EXAM_NOISE.map(n => {
                    const rs = ex?.batch.results.get(String(n)) ?? [];
                    const fin = rs.filter(r => r.raceTime != null).length;
                    const avg = rs.length ? rs.reduce((s, r) => s + r.pct, 0) / rs.length : null;
                    return (
                      <tr key={n} className={n === noise ? 'cur' : ''}>
                        <td>{n}<small>{noiseName(n)}{n === noise ? ', like training' : ''}</small></td>
                        <td>{rs.length ? <span className={fin === rs.length ? 'ok' : fin ? '' : 'bad'}>{fin} of {rs.length}</span> : ex ? '…' : '—'}</td>
                        <td>{avg != null ? pctText(avg) : '—'}</td>
                        <td><button className="btn small" disabled={!lab.best} onClick={() => { lab.watch(`${noiseName(n)} noise`, lab.tracks[0], specOf(n)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Watch</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <Cards title="Why practise with noise?">
        <Card title="Perfect-world brains are fragile">
          <p>A brain trained with perfect sensors can rely on tiny details in the numbers. Add a little noise and those details turn into nonsense.</p>
        </Card>
        <Card title="Training with noise makes it tougher">
          <p>A brain that always practised with wobbly numbers learns to ignore small changes and pay attention to the big picture. It might be a bit slower, but it's harder to break.</p>
        </Card>
        <Card title="Real robots do this">
          <p>Engineers add random noise on purpose when training robots and self-driving cars in simulation, so they still work in the messy real world.</p>
        </Card>
      </Cards>
    </>
  );
}
