import type { LevelDef } from '../levels';

interface Props {
  level: LevelDef;
  total: number;
  onHome: () => void;
  onPrev: () => void;
  onNext: () => void;
  /** replay the level's narration, if it has one */
  onListen?: () => void;
}

export function TopBar({ level, total, onHome, onPrev, onNext, onListen }: Props) {
  const last = level.n === total;
  return (
    <header className="topbar">
      <div className="topbar-in">
        <button className="logo" onClick={onHome} aria-label="Back to all levels">Brain<span>Racers</span></button>
        <div className="where">
          <span className="lvl">Level {level.n} of {total}</span>
          <b>{level.title}</b>
        </div>
        <nav className="topnav">
          {onListen && <button className="btn ghost small" onClick={onListen}>🔊 Listen</button>}
          <button className="btn ghost small" onClick={onHome}>All levels</button>
          {level.n > 1 && <button className="btn ghost small" onClick={onPrev} aria-label="Previous level">←</button>}
          <button className="btn primary small" data-tour="next" onClick={onNext}>{last ? 'Back to levels' : `Next level →`}</button>
        </nav>
      </div>
    </header>
  );
}
