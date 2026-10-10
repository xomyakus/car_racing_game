import { useMemo, useState } from 'react';
import { F1_TRACK_IDS, TRACK_IDS, TrackId, getTrack, trackInfo } from '../sim/track';
import { BASIC } from '../sim/sensors';
import { ExamBatch } from '../sim/examBatch';
import { resultText } from '../sim/score';
import { useFrame, useTick } from '../hooks';
import { LabView } from '../components/LabView';
import { Card, Cards, LevelHeader, useLab } from './common';

const LAPS = 3, MAX_TRAIN = 4;
const keyOf = (ids: TrackId[]) => `L10:${ids.join('+')}`;

export function Level10() {
  const [train, setTrain] = useState<TrackId[]>(['classic']);
  const key = keyOf(train);
  const config = useMemo(() => ({ layers: [7, 16, 16, 2], spec: BASIC, tracks: train.map(getTrack), raceLaps: LAPS }), [train]);
  const { lab, reset } = useLab(key, config);
  const [exam, setExam] = useState<{ batch: ExamBatch; brainNo: number; key: string } | null>(null);
  useFrame(() => exam?.batch.step(8));
  useTick(4);

  const toggle = (id: TrackId) => setTrain(t => {
    if (t.includes(id)) return t.length > 1 ? t.filter(x => x !== id) : t;
    return t.length < MAX_TRAIN ? [...t, id] : t;
  });
  const runExam = () => {
    if (!lab.best) return;
    const brain = lab.best.brain;
    setExam({ key, brainNo: lab.best.no, batch: new ExamBatch(TRACK_IDS.map(id => ({ key: id, brain, spec: lab.spec, track: getTrack(id), laps: LAPS }))) });
  };
  const ex = exam && exam.key === key ? exam : null;
  const passed = ex ? TRACK_IDS.filter(id => ex.batch.results.get(id)?.[0]?.raceTime != null).length : 0;
  const unseen = TRACK_IDS.filter(id => !train.includes(id));
  const passedUnseen = ex ? unseen.filter(id => ex.batch.results.get(id)?.[0]?.raceTime != null).length : 0;

  return (
    <>
      <LevelHeader n={10} title="New tracks">
        A brain trained on one track might just memorise it, like learning the answers to one test by heart. The real question: can it drive a track it has never seen?
      </LevelHeader>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide">
            <h2>Training tracks</h2>
            <p className="small">Pick up to {MAX_TRAIN} tracks. Every test drive races {LAPS} laps on each one, and the brain is judged on all of them together. The tracks are simplified versions of real Formula 1 circuits.</p>
            <div className="trackchips">
              {TRACK_IDS.map(id => {
                const info = trackInfo(id), on = train.includes(id);
                return (
                  <button key={id} className={`trackchip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggle(id)} title={info.fact}>
                    <b>{info.name}</b><small>{info.country}{info.km ? ` · ${info.km} km` : ''}</small>
                  </button>
                );
              })}
            </div>
            <div className="controls">
              <button className="btn small" onClick={() => setTrain(['classic'])}>Just the home track</button>
              <button className="btn small" onClick={() => setTrain(['monza', 'monaco', 'silverstone'])}>Fast, slow and flowing</button>
              <button className="btn small" onClick={() => setTrain(['classic', 'hungaroring', 'spa', 'suzuka'])}>Four very different tracks</button>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <h2 className="sectiontitle">Train on {train.map(id => trackInfo(id).name).join(' + ')}</h2>
        <LabView key={key} lab={lab} level={10} saveKey={key} onReset={reset} trackPick={{ value: train[0], onChange: t => setTrain([t]) }} />
      </section>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide">
            <div className="sectionhead">
              <h2>The final exam: every track</h2>
              <button className="btn primary" disabled={!lab.best} onClick={runExam}>{lab.best ? `Run the exam with brain #${lab.best.no}` : 'Train a brain first'}</button>
            </div>
            <p className="small">The best brain races {LAPS} laps on all {TRACK_IDS.length} tracks, off screen. Tracks it trained on are marked. Press <b>Watch</b> to see any one of them on the big track above.</p>
            {ex && <p><b>Brain #{ex.brainNo}</b> finished <b>{passed} of {TRACK_IDS.length}</b> tracks{unseen.length ? <>, and <b>{passedUnseen} of {unseen.length}</b> it never trained on</> : null}.{!ex.batch.done && ` Testing… ${Math.round(ex.batch.progress * 100)}%`}</p>}
            <div className="gens tall">
              <table>
                <thead><tr><th>Track</th><th>Trained on it?</th><th>Result</th><th></th></tr></thead>
                <tbody>
                  {TRACK_IDS.map(id => {
                    const r = ex?.batch.results.get(id)?.[0];
                    return (
                      <tr key={id}>
                        <td>{trackInfo(id).name}<small>{trackInfo(id).country}</small></td>
                        <td>{train.includes(id) ? 'yes' : <span className="muted">never seen</span>}</td>
                        <td>{r ? <span className={r.raceTime != null ? 'ok' : 'bad'}>{resultText(r)}</span> : ex ? '…' : '—'}</td>
                        <td><button className="btn small" disabled={!lab.best} onClick={() => { lab.watch(trackInfo(id).name, getTrack(id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Watch</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <Cards title="Memorising or understanding?">
        <Card title="Overfitting">
          <p>A brain that only ever saw one track can learn tricks that only work there: "turn right after 2 seconds". That's called <b>overfitting</b>. On a new track those tricks crash the car.</p>
        </Card>
        <Card title="More variety, better driver">
          <p>Train on several different tracks and the only way to do well is to really use the rays. Brains trained like that usually pass more of the exam, even on tracks they never saw.</p>
        </Card>
        <Card title="Try this">
          <p>Train on the home track only and run the exam. Then train on {F1_TRACK_IDS.length > 3 ? 'three or four F1 tracks' : 'several tracks'} and run it again. How many unseen tracks does each brain finish?</p>
        </Card>
      </Cards>
    </>
  );
}
