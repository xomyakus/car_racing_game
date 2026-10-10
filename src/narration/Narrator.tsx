import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { clipId, Narration } from './script';
import './narrator.css';

/** One recording per step, made by `npm run narrate`. A step without one shows its caption for a while instead. */
const CLIPS = import.meta.glob<string>('./audio/*.mp3', { eager: true, query: '?url', import: 'default' });
const clipUrl = (n: Narration, i: number): string | undefined => CLIPS[`./audio/${clipId(n.id, i)}.mp3`];
const readMs = (text: string) => Math.max(2500, text.split(/\s+/).length * 400);
const PAD = 8;

// one audio element for every narration: once a tap has let it play, browsers keep letting it
let shared: HTMLAudioElement | null = null;
const getAudio = () => (shared ??= new Audio());
const absUrl = (u: string) => new URL(u, location.href).href;

// which narrations this browser has already heard, so they only start by themselves once
const HEARD_KEY = 'brainracers.heard';
const loadHeard = (): string[] => {
  try { return JSON.parse(localStorage.getItem(HEARD_KEY) ?? '[]'); } catch { return []; }
};
export const hasHeard = (id: string) => loadHeard().includes(id);
export function markHeard(id: string) {
  const h = loadHeard();
  if (h.includes(id)) return;
  try { localStorage.setItem(HEARD_KEY, JSON.stringify([...h, id])); } catch { /* ignore */ }
}

interface NarrationApi {
  /** start a narration by id (see script.ts) */
  play: (id: string) => void;
  /** go to the next level, playing this level's wrap-up first if it hasn't been heard */
  nextLevel: () => void;
}
export const NarrationCtx = createContext<NarrationApi>({ play: () => {}, nextLevel: () => {} });
export const useNarration = () => useContext(NarrationCtx);

/** A big button at the end of a narration, e.g. "Go to level 3". */
export interface Finish { label: string; go: () => void }

interface Props {
  narration: Narration;
  finish?: Finish;
  onClose: () => void;
}

/** Reads a narration aloud one step at a time, shows each line as a caption and spotlights what it talks about. */
export function Narrator({ narration: n, finish, onClose }: Props) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  // the browser wouldn't play sound before the page was tapped
  const [blocked, setBlocked] = useState(false);
  const spotRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // where the spotlight is drawn now, kept between steps so it glides to the next target
  const spot = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const step = n.steps[i], last = i === n.steps.length - 1;
  const audio = getAudio();

  useEffect(() => {
    document.documentElement.classList.add('narrating');
    return () => { document.documentElement.classList.remove('narrating'); getAudio().pause(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // load this step's clip
  useEffect(() => {
    const url = clipUrl(n, i);
    if (!url) audio.removeAttribute('src');
    else if (audio.src !== absUrl(url)) audio.src = url;
  }, [audio, n, i]);

  // play it, then move on to the next step
  useEffect(() => {
    if (paused || ended) return;
    let t = 0;
    const advance = () => (last ? setEnded(true) : setI(i + 1));
    if (!clipUrl(n, i)) {
      t = window.setTimeout(advance, readMs(step.say));
      return () => clearTimeout(t);
    }
    const onEnd = () => { t = window.setTimeout(advance, 450); };
    audio.addEventListener('ended', onEnd);
    audio.play().then(() => setBlocked(false), (e: unknown) => {
      if (e instanceof DOMException && e.name === 'NotAllowedError') { setBlocked(true); setPaused(true); }
    });
    return () => { clearTimeout(t); audio.removeEventListener('ended', onEnd); audio.pause(); };
  }, [audio, n, i, paused, ended, last, step]);

  // an intro steps aside by itself when it's done; a wrap-up waits for its "next level" button
  useEffect(() => {
    if (!ended || finish) return;
    const t = setTimeout(onClose, 1500);
    return () => clearTimeout(t);
  }, [ended, finish, onClose]);

  // spotlight the step's target, scrolling it into view between the top bar and the caption
  useEffect(() => {
    const sel = `[data-tour="${step.at}"]`;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let el: HTMLElement | null = null, scrolled = false, id = 0;
    const frame = () => {
      id = requestAnimationFrame(frame);
      const s = spotRef.current;
      if (!s) return;
      if (!el?.isConnected) el = document.querySelector<HTMLElement>(sel);
      const r = el?.getBoundingClientRect();
      if (!el || !r || !r.width || !r.height) { s.classList.remove('on'); return; }
      if (!scrolled) { scrolled = true; bringIntoView(el, r, boxRef.current, reduce); }
      const want = { x: r.left - PAD, y: r.top - PAD, w: r.width + 2 * PAD, h: r.height + 2 * PAD };
      const c = spot.current, k = 0.22;
      const now = c && !reduce
        ? { x: c.x + (want.x - c.x) * k, y: c.y + (want.y - c.y) * k, w: c.w + (want.w - c.w) * k, h: c.h + (want.h - c.h) * k }
        : want;
      spot.current = now;
      s.style.transform = `translate(${now.x}px, ${now.y}px)`;
      s.style.width = `${now.w}px`;
      s.style.height = `${now.h}px`;
      s.classList.add('on');
    };
    // a rotated phone or resized window may push the target out of view again
    const onResize = () => { scrolled = false; };
    window.addEventListener('resize', onResize);
    frame();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize); };
  }, [n, i, step.at]);

  const goTo = (k: number) => { setI(k); setEnded(false); setPaused(false); };
  const toggle = () => {
    if (ended) return goTo(0);
    // start playing inside the tap itself: some browsers only allow sound that way
    if (paused && clipUrl(n, i)) audio.play().catch(() => {});
    setPaused(!paused);
  };
  const quiet = paused || ended;

  return (
    <>
      <div className="spot" ref={spotRef} aria-hidden="true" />
      <div className={`narr${quiet ? ' quiet' : ''}`} ref={boxRef} role="region" aria-label={`Narrator: ${n.title}`}>
        <div className="narr-face" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="narr-main">
          <div className="narr-top">
            <b>{n.title}</b>
            <span className="narr-dots">
              {n.steps.map((_, k) => (
                <button key={k} className={k === i ? 'on' : k < i ? 'done' : ''} onClick={() => goTo(k)} aria-label={`Step ${k + 1} of ${n.steps.length}`} aria-current={k === i ? 'step' : undefined} />
              ))}
            </span>
          </div>
          <p className="narr-text" aria-live="polite">{step.say}</p>
          <div className="narr-ctl">
            <button className="btn small ghost" disabled={i === 0} onClick={() => goTo(i - 1)}>‹ Back</button>
            <button className={`btn small${blocked && paused ? ' primary pulse' : ''}`} onClick={toggle}>
              {ended ? '↺ Again' : paused ? (blocked ? '▶ Tap to hear me' : '▶ Play') : '❚❚ Pause'}
            </button>
            <button className="btn small ghost" disabled={last} onClick={() => goTo(i + 1)}>Next ›</button>
            <span className="grow" />
            {finish
              ? <button className={`btn small primary${ended ? ' pulse' : ''}`} onClick={finish.go}>{finish.label}</button>
              : <button className="btn small primary" onClick={onClose}>{ended || last ? "Let's go!" : 'Skip'}</button>}
          </div>
        </div>
        <button className="narr-x" onClick={onClose} aria-label="Close the narrator">✕</button>
      </div>
    </>
  );
}

/** Scroll so `el` sits in the free space between the sticky top bar and the caption, if it isn't there already. */
function bringIntoView(el: HTMLElement, r: DOMRect, box: HTMLElement | null, reduce: boolean) {
  if (el.closest('.topbar')) return; // always on screen
  const top = (document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0) + 12;
  const bottom = (box?.getBoundingClientRect().top ?? innerHeight) - 12;
  if (r.top >= top && r.bottom <= bottom) return;
  const room = bottom - top;
  const dy = r.height <= room ? r.top - (top + (room - r.height) / 2) : r.top - top;
  window.scrollBy({ top: dy, behavior: reduce ? 'auto' : 'smooth' });
}
