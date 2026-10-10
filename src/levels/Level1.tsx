import { useEffect, useRef, useState } from 'react';
import { Drive, Keys } from '../sim/drive';
import { championBrain, loadSaved, saveHumanBest } from '../sim/storage';
import { BASIC } from '../sim/sensors';
import { fmtTime, resultText } from '../sim/score';
import { TRACK_IDS, TrackId, getTrack, trackInfo } from '../sim/track';
import { useTick, useToast } from '../hooks';
import { TrackStage } from '../components/TrackStage';
import { SensorBars } from '../components/SensorBars';
import { Card, Cards, LevelHeader } from './common';

export const KEYMAP: Record<string, keyof Keys> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
};

/** Arrow keys (and R to restart) drive `d` while the component is mounted. */
export function useDriveKeys(d: Drive) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement) return;
      const k = KEYMAP[e.key];
      if (k) { d.keys[k] = true; e.preventDefault(); } else if (e.key === 'r' || e.key === 'R') d.reset();
    };
    const up = (e: KeyboardEvent) => { const k = KEYMAP[e.key]; if (k) d.keys[k] = false; };
    const blur = () => { d.keys = { up: false, down: false, left: false, right: false }; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [d]);
}

/** On-screen arrows for touch screens. */
export function TouchPad({ d }: { d: Drive }) {
  const pad = (k: keyof Keys, label: string, aria: string) => (
    <button aria-label={aria} className={d.keys[k] ? 'on' : ''}
      onPointerDown={e => { e.preventDefault(); d.keys[k] = true; }}
      onPointerUp={() => { d.keys[k] = false; }} onPointerLeave={() => { d.keys[k] = false; }} onPointerCancel={() => { d.keys[k] = false; }}>
      {label}
    </button>
  );
  return <div className="pad" aria-label="Touch controls">{pad('left', '◀', 'Steer left')}{pad('down', '▼', 'Brake')}{pad('up', '▲', 'Gas')}{pad('right', '▶', 'Steer right')}</div>;
}

export function TrackPicker({ value, onChange, id = 'trackpick' }: { value: TrackId; onChange: (t: TrackId) => void; id?: string }) {
  return (
    <>
      <label className="check" htmlFor={id}>Track</label>
      <select id={id} className="select" value={value} onChange={e => onChange(e.target.value as TrackId)}>
        {TRACK_IDS.map(t => <option key={t} value={t}>{trackInfo(t).name}{t === 'classic' ? '' : ` (${trackInfo(t).country})`}</option>)}
      </select>
    </>
  );
}

export function Level1() {
  const saved = useRef(loadSaved()).current;
  const [trackId, setTrackId] = useState<TrackId>('classic');
  const [d] = useState(() => new Drive(saved.humanBest.classic ?? null));
  const [toast, showToast] = useToast();
  const [rival, setRival] = useState('');
  useTick(10);
  useDriveKeys(d);

  useEffect(() => {
    d.onEvent = showToast;
    d.onLap = () => { if (d.best != null) saveHumanBest(d.track.id, d.best); };
  }, [d, showToast]);

  const pickTrack = (t: TrackId) => {
    setTrackId(t);
    d.best = loadSaved().humanBest[t] ?? null;
    d.setTrack(getTrack(t));
  };
  const champs = Object.entries(saved.champions);
  const pickRival = (key: string) => {
    setRival(key);
    const c = saved.champions[key];
    d.setRival(c ? { brain: championBrain(c), spec: c.spec } : null);
  };

  const h = d.human, info = trackInfo(trackId);
  const hud = <>
    <span className="chip">Lap time {d.lapTime().toFixed(2)}s</span>
    <span className="chip">Laps {h.laps.length}</span>
    <span className={`chip${h.bonks ? ' red' : ''}`}>Bonks {h.bonks}</span>
    {d.rival && <span className="chip blue">AI {d.rival.alive ? (d.rival.laps.length ? `last lap ${fmtTime(d.rival.laps[d.rival.laps.length - 1])}` : 'racing') : 'crashed'}</span>}
    {!d.started && <span className="chip good">Press ↑ to go</span>}
  </>;

  return (
    <>
      <LevelHeader n={1} title="You drive">
        Drive one lap around the track. Then look at what the car can actually feel. Those numbers are everything an AI driver will ever know.
      </LevelHeader>
      <div className="stage">
        <div className="board">
          <TrackStage label="Race track. Use the arrow keys to drive." defaultCam="chase" advance={el => d.advance(el)} scene={() => d.sceneState()} hud={hud} toast={toast} trackPick={{ value: trackId, onChange: pickTrack }} />
          <div className="controls" data-tour="drive-controls">
            <button className="btn primary" onClick={() => d.reset()}>Restart lap</button>
            <label className="check" htmlFor="rival">Race against</label>
            <select id="rival" className="select" value={rival} onChange={e => pickRival(e.target.value)}>
              <option value="">nobody</option>
              {champs.map(([k, c]) => <option key={k} value={k}>{c.name} ({resultText(c)})</option>)}
            </select>
          </div>
          <p className="hint">Click the track, then <kbd>↑</kbd> gas <kbd>↓</kbd> brake <kbd>←</kbd> <kbd>→</kbd> steer. <kbd>C</kbd> switches camera, <kbd>R</kbd> restarts.
            {trackId !== 'classic' && <> <b>{info.name}:</b> {info.fact}</>}</p>
          <TouchPad d={d} />
          {!champs.length && <p className="hint">Train a brain in the later levels and it shows up here as a rival.</p>}
        </div>
        <aside className="side">
          <div className="panel" data-tour="feel">
            <h2>What the car feels</h2>
            <p className="small">The car can't see the track like you do. It only gets these 7 numbers, sixty times a second.</p>
            <SensorBars car={h} spec={BASIC} />
            <div className="arrow7" data-tour="arrow7">7 numbers go into a brain → 2 numbers come out: gas and steer</div>
          </div>
          <div className="panel" data-tour="laps">
            <h2>Your laps</h2>
            <div className="tiles">
              <div className="tile me"><span>Your best lap here</span><b>{fmtTime(d.best)}</b></div>
              <div className="tile"><span>Bonks this lap</span><b>{h.lapBonks}</b></div>
            </div>
            <ol className="log">
              {d.laps.length
                ? d.laps.map((l, i) => <li key={i}><b>{fmtTime(l.t)}</b><span>{l.t === d.best ? 'Best lap so far' : 'Lap'}{l.bonks ? ` · ${l.bonks} bonk${l.bonks > 1 ? 's' : ''}` : ' · clean!'}</span></li>)
                : <li><b>—</b><span>No laps yet. Drive across the checkered line to finish one.</span></li>}
            </ol>
          </div>
        </aside>
      </div>
      <Cards>
        <Card title="Be the driver">
          <p>Hitting a wall is a <b>bonk</b>: you stop and lose time. Your best lap on each track is saved, and later the AI will try to beat it.</p>
          <p>Look at the <mark>yellow lines</mark> sticking out of your car. Each one measures how far away the wall is. Those 5 distances, your speed and your direction are the 7 numbers on the right.</p>
        </Card>
        <Card title="Famous tracks">
          <p>The track menu has simplified versions of famous Formula 1 circuits: Monza, Monaco, Silverstone, Spa, Suzuka and more. Their shapes and lengths follow the real ones, with the corners rounded so our little cars can make it.</p>
        </Card>
        <Card title="Think about it" tour="think">
          <ol>
            <li>When the "ahead" line gets short, what should you do?</li>
            <li>If "far left" is long and "far right" is short, which way is the road bending?</li>
            <li>Could you drive with your eyes closed if someone read you the 7 numbers?</li>
          </ol>
        </Card>
      </Cards>
    </>
  );
}
