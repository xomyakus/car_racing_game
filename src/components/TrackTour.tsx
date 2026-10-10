import { useMemo, useRef, useState } from 'react';
import { LEVELS } from '../levels';
import { useTick } from '../hooks';
import { DT, RACE_LAPS } from '../sim/constants';
import { Car, EndReason, newCar, progressPct, stepAI } from '../sim/car';
import { carResult } from '../sim/exam';
import type { SceneState } from '../sim/lab';
import { TestResult, countedLap, fmtTime, pctText, raceScore } from '../sim/score';
import { SavedChampion, championBrain, loadSaved } from '../sim/storage';
import { TRACK_IDS, TrackId, getTrack, trackInfo } from '../sim/track';
import { archText } from '../sim/brain';
import { WHY_TEXT } from '../sim/text';
import { TrackStage } from './TrackStage';

type Speed = 1 | 5 | 20 | 'max';
const SPEEDS: Speed[] = [1, 5, 20, 'max'];
const LAP_CHOICES = [1, 3, RACE_LAPS];
/** seconds the finished car stays on screen before the next track starts */
const PAUSE = 1.2;
/** a car that hits a wall gets this many tries on a track; the best one counts */
const MAX_TRIES = 5;
/**
 * Where each try starts, sideways from the middle of the road. A brain drives the same way every time
 * from the same spot, so a retry starts a little to one side to give it a genuinely different run.
 */
const TRY_LAT = [0, 6, -6, 12, -12];

interface Leg { track: TrackId; result: TestResult | null; why: EndReason | null; tries: number }
const freshLegs = (): Leg[] => TRACK_IDS.map(track => ({ track, result: null, why: null, tries: 0 }));

/** One brain racing every track in turn. Mutable, like the labs; the screen re-reads it a few times a second. */
class Tour {
  legs: Leg[];
  i = 0;
  car: Car | null = null;
  /** tries already used on the current track */
  tries = 0;
  running = false;
  private best: { result: TestResult; why: EndReason | null } | null = null;
  private acc = 0;
  private wait = 0;

  constructor(readonly champ: SavedChampion, readonly laps: number) {
    this.legs = freshLegs();
  }

  get done() { return this.i >= this.legs.length; }

  start() {
    this.legs = freshLegs();
    this.i = 0; this.acc = 0; this.wait = 0; this.tries = 0; this.best = null;
    this.running = true;
    this.car = this.newLegCar();
  }

  stop() { this.running = false; }

  private newLegCar() {
    return newCar(championBrain(this.champ), '#e2412a', this.champ.spec, getTrack(this.legs[this.i].track), 0, TRY_LAT[this.tries]);
  }

  /** The car stopped: try again after a wall hit, otherwise close the leg and move on to the next track. */
  private finishLeg() {
    const c = this.car!;
    const result = carResult(c, this.laps);
    if (!this.best || raceScore(result) > raceScore(this.best.result)) this.best = { result, why: c.why };
    this.tries++;
    if (c.why === 'wall' && this.tries < MAX_TRIES) { this.car = this.newLegCar(); return; }
    this.legs[this.i] = { track: this.legs[this.i].track, ...this.best, tries: this.tries };
    this.best = null;
    this.tries = 0;
    this.i++;
    if (this.done) { this.running = false; return; }
    this.car = this.newLegCar();
  }

  advance(el: number, speed: Speed) {
    if (!this.running || !this.car) return;
    if (speed === 'max') {
      // race flat out for a few milliseconds a frame so the page stays responsive
      const t0 = performance.now();
      while (this.running && performance.now() - t0 < 10) {
        for (let k = 0; k < 120 && this.car.alive; k++) stepAI(this.car, this.laps);
        if (!this.car.alive) this.finishLeg();
      }
      return;
    }
    if (!this.car.alive) {
      // let the result show for a moment before the next track
      this.wait += el;
      if (this.wait >= PAUSE) { this.wait = 0; this.finishLeg(); }
      return;
    }
    this.acc += el;
    while (this.acc >= DT && this.car.alive) {
      for (let k = 0; k < speed && this.car.alive; k++) stepAI(this.car, this.laps);
      this.acc -= DT;
    }
    if (!this.car.alive) this.acc = 0;
  }

  scene(): SceneState {
    const c = this.car;
    if (!c) return { track: getTrack(this.legs[0].track), items: [], focus: null, rays: null, ring: null, look: null };
    const ok = c.alive || c.done;
    return { track: c.track, items: [{ car: c, alpha: ok ? 1 : 0.55, wreck: !ok }], focus: c, rays: c.alive ? c : null, ring: null, look: null };
  }
}

const levelTitle = (n: number) => LEVELS.find(l => l.n === n)?.title ?? '';
const brainLabel = (c: SavedChampion) =>
  `Level ${c.level} · ${levelTitle(c.level)} · ${c.setup ?? archText(c.layers)} · trained on ${c.track === 'multi' ? 'several tracks' : trackInfo(c.track ?? 'classic').name}`;

/** Fastest lap that counts in the championship on each track (brains that finished, or you). */
function trackRecords(): Partial<Record<TrackId, number>> {
  const s = loadSaved();
  const out: Partial<Record<TrackId, number>> = { ...s.humanBest };
  for (const c of Object.values(s.champions)) {
    const t = c.track ?? 'classic', lap = countedLap(c);
    if (t !== 'multi' && lap != null && (out[t] == null || lap < out[t]!)) out[t] = lap;
  }
  return out;
}

/** Separate screen: pick a saved brain and race it on every track, one after another, to score it everywhere. */
export function TrackTour() {
  useTick(6);
  const saved = useMemo(() => loadSaved(), []);
  const records = useMemo(trackRecords, []);
  const brains = useMemo(
    () => Object.entries(saved.champions).sort(([, a], [, b]) => a.level - b.level || brainLabel(a).localeCompare(brainLabel(b))),
    [saved],
  );
  const [key, setKey] = useState(brains[0]?.[0] ?? '');
  const [laps, setLaps] = useState(RACE_LAPS);
  const [speed, setSpeed] = useState<Speed>(5);
  const tourRef = useRef<Tour | null>(null);
  const champ = saved.champions[key];
  if (champ && (!tourRef.current || tourRef.current.champ !== champ || tourRef.current.laps !== laps)) {
    tourRef.current = new Tour(champ, laps);
  }
  const tour = tourRef.current;

  if (!brains.length || !champ || !tour) {
    return (
      <div className="panel">
        <h2>Track tour</h2>
        <p><b>No saved brains yet.</b> Train a brain in any level from level 2 on; the best one is saved automatically and shows up here.</p>
      </div>
    );
  }

  const legs = tour.legs;
  const doneLegs = legs.filter(l => l.result);
  const finished = doneLegs.filter(l => l.result!.raceTime != null);
  const allFinished = finished.length === legs.length;
  const totalTime = finished.reduce((s, l) => s + l.result!.raceTime!, 0);
  const totalLaps = doneLegs.reduce((s, l) => s + Math.min(laps * 100, l.result!.pct), 0) / 100;
  const c = tour.car;
  const busy = tour.running;

  const hud = c ? <>
    <span className="chip blue">{trackInfo(legs[Math.min(tour.i, legs.length - 1)].track).name} ({Math.min(tour.i + 1, legs.length)} of {legs.length})</span>
    {busy && <span className="chip">try {tour.tries + 1} of {MAX_TRIES}</span>}
    {c.alive && <span className="chip">{c.laps.length ? `lap ${Math.min(laps, c.laps.length + 1)} of ${laps}` : `${progressPct(c).toFixed(0)}%`}</span>}
    {c.alive && <span className="chip">{c.t.toFixed(1)}s</span>}
    {!c.alive && c.why && <span className={`chip ${c.done ? 'good' : 'red'}`}>{WHY_TEXT[c.why]}{c.done ? ` in ${c.t.toFixed(1)}s` : ''}</span>}
    {!busy && tour.done && <span className="chip good">Tour done</span>}
  </> : <span className="chip good">Press “Race every track”</span>;

  return (
    <>
      <div className="panel">
        <h2>Track tour</h2>
        <p className="small">Pick a saved brain and race it on every track, one after another, to see how well it drives on circuits it may never have seen. Nothing here changes the brain or the championship.</p>
        <div className="controls">
          <label className="check" htmlFor="tourbrain">Brain</label>
          <select id="tourbrain" className="select" value={key} disabled={busy} onChange={e => setKey(e.target.value)}>
            {brains.map(([k, b]) => <option key={k} value={k}>{brainLabel(b)}</option>)}
          </select>
        </div>
        <div className="controls">
          <span className="check">Laps per track</span>
          <div className="seg" role="group" aria-label="Laps per track">
            {LAP_CHOICES.map(n => <button key={n} aria-pressed={laps === n} disabled={busy} onClick={() => setLaps(n)}>{n}</button>)}
          </div>
          <span className="check">Speed</span>
          <div className="seg" role="group" aria-label="Speed">
            {SPEEDS.map(s => <button key={s} aria-pressed={speed === s} onClick={() => setSpeed(s)}>{s === 'max' ? 'Instant' : `${s}×`}</button>)}
          </div>
          {busy
            ? <button className="btn" onClick={() => tour.stop()}>Stop</button>
            : <button className="btn primary" onClick={() => tour.start()}>{doneLegs.length ? 'Race again' : 'Race every track'}</button>}
        </div>
      </div>

      <TrackStage label="Track tour" advance={el => tour.advance(el, speed)} scene={() => tour.scene()} hud={hud} defaultCam="top" />

      <div className="panel">
        <h2>Results</h2>
        <p className="small">
          {doneLegs.length
            ? <>Finished <b>{finished.length} of {legs.length}</b> tracks · drove <b>{totalLaps.toFixed(1)}</b> of {laps * legs.length} laps
                {allFinished ? <> · total time <b>{totalTime.toFixed(1)}s</b></> : finished.length ? <> · {totalTime.toFixed(1)}s on the tracks it finished</> : null}</>
            : <>Each track is a race of {laps} lap{laps > 1 ? 's' : ''}, with the same rules as training: it ends on a wall, standing still, turning around or a lap that is too slow. A brain that hits a wall gets up to {MAX_TRIES} tries, each starting a little to the side, and its best try counts.</>}
        </p>
        <div className="champwrap">
          <table className="champ tour">
            <thead>
              <tr><th className="lvlcol">Track</th><th>Result</th><th>Race time</th><th>Best lap</th><th>Record lap</th></tr>
            </thead>
            <tbody>
              {legs.map((l, n) => {
                const r = l.result, rec = records[l.track];
                const lap = r?.bestLap ?? null;
                const now = busy && n === tour.i;
                const home = champ.track === l.track || champ.tracks?.includes(l.track);
                return (
                  <tr key={l.track} className={now ? 'now' : ''}>
                    <th className="lvlcol">{trackInfo(l.track).name}{home && <small>trained here</small>}</th>
                    <td>{r
                      ? <><b className={r.raceTime != null ? 'ok' : 'bad'}>{r.raceTime != null ? 'Finished' : pctText(r.pct)}</b><small>{l.why ? WHY_TEXT[l.why] : ''}</small>{l.tries > 1 && <small>best of {l.tries} tries</small>}</>
                      : <span className="muted">{now ? `racing… try ${tour.tries + 1}` : '—'}</span>}</td>
                    <td>{r ? <b>{fmtTime(r.raceTime)}</b> : <span className="muted">—</span>}</td>
                    <td>{r ? <b>{fmtTime(lap)}</b> : <span className="muted">—</span>}</td>
                    <td className={r && lap != null && r.raceTime != null && rec != null && lap <= rec ? 'gold' : ''}>
                      {rec != null ? <b>{fmtTime(rec)}</b> : <span className="muted">—</span>}
                      {r && lap != null && r.raceTime != null && rec != null && <small>{lap <= rec ? '🏆 beats the record' : `+${(lap - rec).toFixed(2)}s`}</small>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
