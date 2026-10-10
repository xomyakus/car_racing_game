import { useState } from 'react';
import { LEVELS, PARTS } from '../levels';
import { Championship } from './Championship';
import { loadSaved } from '../sim/storage';
import { fmtTime, raceScore, resultText } from '../sim/score';

/** Entry screen: one card per level, in two parts. */
export function Home({ onOpen }: { onOpen: (n: number) => void }) {
  const saved = loadSaved();
  const [champ, setChamp] = useState(false);
  const bestFor = (n: number): string | null => {
    if (n === 1) return saved.humanBest.classic != null ? `Your best lap: ${fmtTime(saved.humanBest.classic)}` : null;
    const champs = Object.values(saved.champions).filter(c => c.level === n);
    if (!champs.length) return null;
    const top = champs.reduce((a, b) => (raceScore(b) > raceScore(a) ? b : a));
    return `Best brain: ${resultText(top)}`;
  };
  return (
    <main className="wrap home">
      <header className="hero">
        <h1>Brain<span>Racers</span></h1>
        <p>A race car, a track, and a brain made of numbers. Drive it yourself, then build brains that learn to drive with nobody teaching them. Each level makes the brain a little smarter.</p>
        <button className="btn" onClick={() => setChamp(true)}>🏆 Championship</button>
      </header>
      {champ && <Championship onClose={() => setChamp(false)} />}
      {([1, 2] as const).map(part => (
      <section className="section" key={part}>
      <div>
        <h2 className="sectiontitle">{PARTS[part].title}</h2>
        <p className="sectionlead">{PARTS[part].blurb}</p>
      </div>
      <ol className="levels">
        {LEVELS.filter(l => l.part === part).map(l => {
          const best = bestFor(l.n);
          return (
            <li key={l.n}>
              <button className="levelcard" onClick={() => onOpen(l.n)}>
                <span className="num">{l.n}</span>
                <span className="body">
                  <b>{l.title}</b>
                  <span>{l.blurb}</span>
                  <span className="meta"><code>{l.arch}</code>{best ? <em>{best}</em> : <em className="muted">Not played yet</em>}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      </section>
      ))}
      <p className="small center">Progress is saved in this browser only.</p>
    </main>
  );
}
