import { ReactNode, useEffect, useRef, useState } from 'react';
import { CamMode, Track3D } from '../render/Track3D';
import type { SceneState } from '../sim/lab';
import { ToastState, useFrame } from '../hooks';
import { TRACK_IDS, TrackId, trackInfo } from '../sim/track';

interface Props {
  /** advance the simulation by `el` real seconds */
  advance: (el: number) => void;
  scene: () => SceneState;
  hud?: ReactNode;
  toast?: ToastState;
  defaultCam?: CamMode;
  label: string;
  /** when set, a small track menu sits over the top-right corner of the view */
  trackPick?: TrackPick;
}

export interface TrackPick { value: TrackId; onChange: (t: TrackId) => void }

/** The 3D track with its HUD chips, camera switch and toast. Runs the frame loop for its page. */
export function TrackStage({ advance, scene, hud, toast, defaultCam = 'top', label, trackPick }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<Track3D | null>(null);
  const [cam, setCam] = useState<CamMode>(defaultCam);
  const [failed, setFailed] = useState(false);

  // a fresh canvas per mount: a canvas whose WebGL context was released can't be reused
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.className = 'track3d';
    holderRef.current!.appendChild(canvas);
    try {
      trackRef.current = new Track3D(canvas);
    } catch {
      setFailed(true);
    }
    return () => { trackRef.current?.dispose(); trackRef.current = null; canvas.remove(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'c' || e.key === 'C') && !(e.target instanceof HTMLInputElement)) setCam(c => (c === 'top' ? 'chase' : 'top'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useFrame(el => {
    advance(el);
    trackRef.current?.render(scene(), cam, el);
  });

  return (
    <div className="trackwrap" data-tour="track" ref={wrapRef} tabIndex={0} aria-label={label} onPointerDown={() => wrapRef.current?.focus()}>
      <div ref={holderRef} className="trackholder" />
      {failed && <div className="nogl">This device can't show the 3D track. Try a newer browser.</div>}
      <div className={`hud${trackPick ? ' withpick' : ''}`} data-tour="hud">{hud}</div>
      {trackPick && (
        <label className="trackpick" data-tour="trackpick" title="Choose the track to test on">
          <span>Track</span>
          <select value={trackPick.value} onChange={e => trackPick.onChange(e.target.value as TrackId)} aria-label="Track to test on">
            {TRACK_IDS.map(t => <option key={t} value={t}>{trackInfo(t).name}</option>)}
          </select>
        </label>
      )}
      <div className="seg camsw" data-tour="camera" role="group" aria-label="Camera">
        <button aria-pressed={cam === 'top'} onClick={() => setCam('top')}>Top view</button>
        <button aria-pressed={cam === 'chase'} onClick={() => setCam('chase')}>Chase cam</button>
      </div>
      {toast && <div className={`toast${toast.show ? ' show' : ''}${toast.good ? ' good' : ''}`}>{toast.msg}</div>}
    </div>
  );
}
