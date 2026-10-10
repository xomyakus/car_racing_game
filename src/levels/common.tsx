import { ReactNode, useMemo, useState } from 'react';
import { getLab, resetLab } from '../sim/labCache';
import type { Lab, LabConfig } from '../sim/lab';
import { LabView } from '../components/LabView';
import { getTrack } from '../sim/track';
import { useLevelTrack, withTrack } from './trackChoice';
import { useNarration } from '../narration/Narrator';
import { outroId } from '../narration/script';
import { LEVELS } from '../levels';

export function LevelHeader({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <header className="levelhead" data-tour="levelhead">
      <span className="bignum">{n}</span>
      <div>
        <h1>{title}</h1>
        <p className="lead">{children}</p>
      </div>
    </header>
  );
}

/** The cached lab for `key`, plus a way to throw it away and start over. */
export function useLab(key: string, cfg: LabConfig) {
  const [ver, setVer] = useState(0);
  // the config is fixed for a given key, so the key alone decides which lab to use
  const lab = useMemo(() => getLab(key, cfg), [key, ver]);
  const reset = () => { resetLab(key, cfg); setVer(v => v + 1); };
  return { lab, reset };
}

interface TrainingProps {
  n: number;
  labKey: string;
  config: LabConfig;
  /** extra panel at the top of the side column, given the lab being trained */
  sideTop?: (lab: Lab) => ReactNode;
  showWeights?: boolean;
  lead?: ReactNode;
  title?: string;
}

/** The "Train it" section every network level shares. */
export function TrainingSection({ n, labKey, config, sideTop, showWeights, lead, title = 'Test drives and evolution' }: TrainingProps) {
  const [trackId, setTrackId] = useLevelTrack(n);
  const key = withTrack(labKey, trackId);
  const { lab, reset } = useLab(key, { ...config, tracks: [getTrack(trackId)] });
  return (
    <section className="section">
      <h2 className="sectiontitle">{title}</h2>
      <p className="sectionlead">
        {lead ?? <>Press <b>Start evolution</b>: the first brain is random, then every next brain is the best one so far with a few weights nudged.
        Every test drive is a {lab.raceLaps}-lap race: first the brains learn to get further, then to get faster.</>}
      </p>
      <LabView key={key} lab={lab} level={n} saveKey={key} onReset={reset} sideTop={sideTop?.(lab)} showWeights={showWeights}
        trackPick={{ value: trackId, onChange: setTrackId }} />
    </section>
  );
}

export function Cards({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section className="section">
      {title && <h2 className="sectiontitle">{title}</h2>}
      <div className="lessons">{children}</div>
    </section>
  );
}

/**
 * `tour` names the card for the narrator's spotlight (see narration/script.ts).
 * With an `image`, the card spans the full width: text on the left, the picture on the right.
 */
export function Card({ title, children, wide, tour, image }: { title: string; children: ReactNode; wide?: boolean; tour?: string; image?: ReactNode }) {
  return (
    <div className={`panel lesson${wide || image ? ' wide' : ''}`} data-tour={tour}>
      {image
        ? <div className="cardsplit">
            <div className="cardtext"><h2>{title}</h2>{children}</div>
            <div className="cardimg">{image}</div>
          </div>
        : <><h2>{title}</h2>{children}</>}
    </div>
  );
}

/**
 * The cards that close a level: what this brain still can't do. "Next level" reads them aloud first
 * (see App), and the button here does the same; "Listen" plays them again.
 */
export function Outro({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  const { play, nextLevel } = useNarration();
  return (
    <section className="section">
      <div className="sectionhead">
        <h2 className="sectiontitle">{title}</h2>
        <button className="btn small" onClick={() => play(outroId(n))}>🔊 Listen</button>
      </div>
      <div className="lessons" data-tour="outro">{children}</div>
      <div className="levelend">
        <button className="btn primary" data-tour="levelend" onClick={nextLevel}>{n < LEVELS.length ? `On to level ${n + 1} →` : 'Back to all levels'}</button>
      </div>
    </section>
  );
}
