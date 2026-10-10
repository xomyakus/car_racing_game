import { useEffect, useRef, useState } from 'react';
import { DT } from '../sim/constants';
import { Drive, Sample } from '../sim/drive';
import { Car, newCar, progressPct, stepAI } from '../sim/car';
import { BASIC, inputLabels } from '../sim/sensors';
import { archText, cloneBrain, weightCount } from '../sim/brain';
import { Copycat } from '../sim/train';
import { loadSaved, saveChampion } from '../sim/storage';
import { resultText } from '../sim/score';
import { WHY_LONG } from '../sim/text';
import { carResult } from '../sim/exam';
import type { SceneState } from '../sim/lab';
import { COL, FONT, rgba } from '../theme';
import { ctx2d, sizeCanvas, useFrame, useTick, useToast } from '../hooks';
import { TrackStage } from '../components/TrackStage';
import { NetDiagram } from '../components/NetDiagram';
import { TouchPad, useDriveKeys } from './Level1';
import { Card, Cards, LevelHeader } from './common';

const SHAPES = [[7, 8, 2], [7, 16, 2], [7, 16, 16, 2]];
const WATCH_LAPS = 3;

/** The copycat brain driving on its own. */
class Watcher {
  car: Car | null = null;
  private acc = 0;
  start(cc: Copycat) { this.car = newCar(cloneBrain(cc.brain), '#1d9a52', BASIC); this.acc = 0; }
  advance(el: number) {
    const c = this.car;
    if (!c?.alive) return;
    this.acc += el;
    while (this.acc >= DT) { stepAI(c, WATCH_LAPS); this.acc -= DT; }
  }
  scene(fallback: SceneState): SceneState {
    const c = this.car;
    if (!c) return { ...fallback, items: [], focus: null, rays: null };
    return { track: c.track, items: [{ car: c, alpha: c.alive || c.done ? 1 : 0.55, wreck: !c.alive && !c.done }], focus: c, rays: c.alive ? c : null, ring: null, look: null };
  }
}

function LossChart({ cc }: { cc: Copycat }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  useFrame(() => {
    if (frame.current++ % 10) return;
    const cv = ref.current;
    if (!cv || !sizeCanvas(cv)) return;
    const { ctx, w, h } = ctx2d(cv);
    const L = cc.lossHist, pl = 8, pt = 16;
    ctx.fillStyle = COL.muted; ctx.font = `900 10px ${FONT.body}`;
    ctx.fillText('MISTAKES (LOWER = COPIES YOU BETTER)', pl, 10);
    if (L.length < 2) { ctx.fillStyle = COL.ink; ctx.font = `800 13px ${FONT.body}`; ctx.fillText('Press "Train" to start learning', pl, h / 2); return; }
    const hi = Math.max(...L);
    ctx.beginPath();
    L.forEach((v, i) => { const x = pl + ((w - 2 * pl) * i) / (L.length - 1), y = pt + (h - pt - 16) * (1 - v / hi); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.strokeStyle = rgba(COL.pos, 1); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = COL.muted; ctx.font = `700 10px ${FONT.mono}`; ctx.textAlign = 'right';
    ctx.fillText(`${cc.epochs} rounds`, w - pl, h - 4); ctx.textAlign = 'left';
  });
  return <canvas ref={ref} className="trace" aria-label="Training mistakes over time" />;
}

export function Level14() {
  const [d] = useState(() => new Drive(loadSaved().humanBest.classic ?? null));
  const [data] = useState<Sample[]>(() => []);
  const [w] = useState(() => new Watcher());
  const [shape, setShape] = useState(1);
  const [cc, setCc] = useState(() => new Copycat(SHAPES[1]));
  const [mode, setMode] = useState<'drive' | 'watch'>('drive');
  const [recording, setRecording] = useState(false);
  const [training, setTraining] = useState(false);
  const [agree, setAgree] = useState<number | null>(null);
  const [toast, showToast] = useToast();
  useTick(8);
  useDriveKeys(d);

  useEffect(() => { d.onEvent = showToast; }, [d, showToast]);
  useEffect(() => { d.recording = recording && mode === 'drive' ? data : null; }, [d, data, recording, mode]);

  // train a little every frame while "Train" is on
  const lastAgree = useRef(0);
  useFrame(() => {
    if (!training || data.length < 60) return;
    const t0 = performance.now();
    while (performance.now() - t0 < 10) cc.epoch(data);
    if (performance.now() - lastAgree.current > 800) { setAgree(cc.agreement(data)); lastAgree.current = performance.now(); }
  });

  const changeShape = (i: number) => { setShape(i); setCc(new Copycat(SHAPES[i])); setAgree(null); };
  const watch = () => {
    setMode('watch'); w.start(cc);
    saveChampion('L14', { layers: cc.layers, spec: BASIC, w: Array.from(cc.brain.w), pct: 0, raceTime: null, of: WATCH_LAPS, level: 14, name: `Level 14 · your copycat (${archText(cc.layers)})` });
  };
  const seconds = (data.length * DT).toFixed(0);
  const wc = w.car;
  const watchResult = wc && !wc.alive ? carResult(wc, WATCH_LAPS) : null;

  const hud = mode === 'drive' ? <>
    <span className={`chip${recording ? ' red' : ''}`}>{recording ? '● Recording' : 'Not recording'}</span>
    <span className="chip">{seconds}s recorded</span>
    <span className="chip">Laps {d.human.laps.length}</span>
    {!d.started && <span className="chip good">Press ↑ to go</span>}
  </> : <>
    <span className="chip blue">Copycat brain</span>
    {wc && <span className="chip">{progressPct(wc) >= 100 ? `lap ${Math.min(WATCH_LAPS, wc.laps.length + (wc.alive ? 1 : 0))} of ${WATCH_LAPS}` : `${progressPct(wc).toFixed(0)}% of lap 1`}</span>}
    {wc && !wc.alive && wc.why && <span className={`chip ${wc.done ? 'good' : 'red'}`}>{WHY_LONG[wc.why]}</span>}
  </>;

  return (
    <>
      <LevelHeader n={14} title="Learn from you">
        Evolution learns by trying and keeping what works. There's another way: show the brain lots of examples of a good driver, and have it copy them. The good driver is you!
      </LevelHeader>
      <div className="stage">
        <div className="board">
          <TrackStage label="Race track" defaultCam={mode === 'drive' ? 'chase' : 'top'} toast={toast} hud={hud}
            advance={el => (mode === 'drive' ? d.advance(el) : w.advance(el))}
            scene={() => (mode === 'drive' ? d.sceneState() : w.scene(d.sceneState()))} />
          <div className="controls">
            <div className="seg" role="group" aria-label="What happens on the track">
              <button aria-pressed={mode === 'drive'} onClick={() => setMode('drive')}>1. You drive</button>
              <button aria-pressed={mode === 'watch'} onClick={watch} disabled={!cc.epochs}>3. Watch the copycat</button>
            </div>
            {mode === 'drive' ? <>
              <button className={`btn${recording ? '' : ' primary'}`} onClick={() => setRecording(r => !r)}>{recording ? 'Stop recording' : '● Start recording'}</button>
              <button className="btn ghost" onClick={() => { data.length = 0; setAgree(null); }}>Clear recording</button>
              <button className="btn ghost" onClick={() => d.reset()}>Restart lap</button>
            </> : <button className="btn" onClick={watch}>Drive again</button>}
          </div>
          {mode === 'drive' && <TouchPad d={d} />}
          <p className="hint">Drive 2 or 3 clean laps while recording. Drive the way you want the brain to drive: it will copy your mistakes too!</p>
        </div>
        <aside className="side">
          <div className="panel">
            <h2>2. Train the copycat</h2>
            <p className="small">You recorded <b>{data.length}</b> moments ({seconds} seconds). Each one is an example: "the car felt <i>these 7 numbers</i>, and you pressed <i>these keys</i>".</p>
            <div className="seg" role="group" aria-label="Brain shape">
              {SHAPES.map((s, i) => <button key={i} aria-pressed={shape === i} onClick={() => changeShape(i)}>{archText(s)}</button>)}
            </div>
            <div className="controls">
              <button className="btn primary" disabled={data.length < 60} onClick={() => setTraining(t => !t)}>{training ? 'Pause training' : data.length < 60 ? 'Record some driving first' : 'Train'}</button>
              <button className="btn ghost" onClick={() => changeShape(shape)}>Start fresh</button>
            </div>
            <LossChart cc={cc} />
            <div className="tiles">
              <div className="tile"><span>Copies you</span><b>{agree != null ? `${Math.round(agree * 100)}%` : '—'}</b><small>same choice as you</small></div>
              <div className="tile"><span>Last drive</span><b>{watchResult ? resultText(watchResult) : '—'}</b><small>{weightCount(cc.layers)} weights</small></div>
            </div>
          </div>
          <div className="panel">
            <h3>The copycat brain</h3>
            <NetDiagram source={() => (mode === 'watch' && wc?.brain ? { brain: wc.brain, acts: wc.acts } : { brain: cc.brain })} labels={inputLabels(BASIC)} wide />
          </div>
        </aside>
      </div>
      <Cards title="Two ways to learn">
        <Card title="Evolution (levels 2–13)">
          <p>Try a brain, give it a score, keep the best, nudge it at random. Nobody tells the brain what the right move was, only how well it did in the end.</p>
        </Card>
        <Card title="Copying (supervised learning)">
          <p>For every moment you recorded, the brain knows the right answer: what you pressed. <b>Backpropagation</b> works out exactly which way to change every weight to make its answer a bit closer to yours, thousands of times a second.</p>
        </Card>
        <Card title="Why copycats crash">
          <p>If the copycat drifts somewhere you never drove, like too close to a wall, it has no examples for that and doesn't know what to do. Try recording a few "rescues", where you steer away from a wall, and train again.</p>
        </Card>
        <Card title="Can it beat you?">
          <p>A perfect copycat drives exactly like you, mistakes included. To get <i>better</i> than its teacher, a brain needs a score to improve on, like evolution in the other levels.</p>
        </Card>
      </Cards>
    </>
  );
}
