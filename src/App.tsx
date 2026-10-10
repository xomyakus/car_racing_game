import { useCallback, useEffect, useState } from 'react';
import { LEVELS } from './levels';
import { NARRATIONS, introId, outroId } from './narration/script';
import { NarrationCtx, Narrator, hasHeard, markHeard } from './narration/Narrator';
import { Home } from './components/Home';
import { TopBar } from './components/TopBar';
import { Level1 } from './levels/Level1';
import { Level2 } from './levels/Level2';
import { Level3 } from './levels/Level3';
import { Level4 } from './levels/Level4';
import { Level5 } from './levels/Level5';
import { Level6 } from './levels/Level6';
import { Level7 } from './levels/Level7';
import { Level8 } from './levels/Level8';
import { Level9 } from './levels/Level9';
import { Level10 } from './levels/Level10';
import { Level11 } from './levels/Level11';
import { Level12 } from './levels/Level12';
import { Level13 } from './levels/Level13';
import { Level14 } from './levels/Level14';

const PAGES = [Level1, Level2, Level3, Level4, Level5, Level6, Level7, Level8, Level9, Level10, Level11, Level12, Level13, Level14];

// #level-3 style anchors (no slashes) so links into a level also work inside an Artifact
const fromHash = () => {
  const m = /^#level-(\d+)$/.exec(location.hash);
  const n = m ? +m[1] : 0;
  return n >= 1 && n <= LEVELS.length ? n : 0;
};

export function App() {
  const [level, setLevel] = useState(fromHash);
  // the coach's narration that is playing, if any; it stops whenever the level changes
  const [talk, setTalk] = useState<{ id: string; at: number } | null>(null);

  useEffect(() => {
    const onHash = () => { setLevel(fromHash()); setTalk(null); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (n: number) => {
    setLevel(n);
    setTalk(null);
    try { history.replaceState(null, '', n ? `#level-${n}` : location.pathname + location.search); } catch { /* sandboxed */ }
    window.scrollTo({ top: 0 });
  };

  const play = useCallback((id: string) => {
    if (!NARRATIONS[id]) return;
    markHeard(id);
    setTalk({ id, at: Date.now() });
  }, []);
  // a level's intro plays by itself the first time the level opens
  useEffect(() => {
    const id = introId(level);
    if (!level || !NARRATIONS[id] || hasHeard(id)) return;
    const t = setTimeout(() => play(id), 500);
    return () => clearTimeout(t);
  }, [level, play]);
  const closeTalk = useCallback(() => setTalk(null), []);

  if (!level) return <Home onOpen={go} />;
  const Page = PAGES[level - 1];
  const after = level < LEVELS.length ? level + 1 : 0;
  // "next level" plays the level's wrap-up first, the first time; it ends with the button that moves on
  const nextLevel = () => {
    const id = outroId(level);
    if (NARRATIONS[id] && !hasHeard(id)) play(id);
    else go(after);
  };
  const finish = talk?.id === outroId(level) ? { label: after ? `Go to level ${after} →` : 'Back to levels', go: () => go(after) } : undefined;
  return (
    <NarrationCtx.Provider value={{ play, nextLevel }}>
      <TopBar level={LEVELS[level - 1]} total={LEVELS.length} onHome={() => go(0)} onPrev={() => go(level - 1)} onNext={nextLevel}
        onListen={NARRATIONS[introId(level)] ? () => play(introId(level)) : undefined} />
      <main className="wrap" key={level}>
        <Page />
      </main>
      {talk && <Narrator key={talk.at} narration={NARRATIONS[talk.id]} finish={finish} onClose={closeTalk} />}
    </NarrationCtx.Provider>
  );
}
