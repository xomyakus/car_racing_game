import { useCallback, useEffect, useRef, useState } from 'react';

/** Call `cb(elapsedSeconds)` on every animation frame while mounted. */
export function useFrame(cb: (el: number) => void) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    let id = 0, last = performance.now();
    const loop = (now: number) => {
      const el = Math.min(0.1, (now - last) / 1000);
      last = now;
      ref.current(el);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
}

/** Re-render the component `hz` times a second (for panels that read mutable simulation state). */
export function useTick(hz = 8) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set(x => x + 1), 1000 / hz);
    return () => clearInterval(id);
  }, [hz]);
}

export interface ToastState { msg: string; good: boolean; show: boolean }

/** A short message popping up over the track. */
export function useToast(): [ToastState, (msg: string, good?: boolean) => void] {
  const [t, setT] = useState<ToastState>({ msg: '', good: false, show: false });
  const timer = useRef(0);
  const show = useCallback((msg: string, good = false) => {
    setT({ msg, good, show: true });
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setT(s => ({ ...s, show: false })), 1100);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [t, show];
}

/** Size a canvas's backing store to its CSS size; returns false while it is hidden. */
export function sizeCanvas(cv: HTMLCanvasElement): boolean {
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return false;
  const d = Math.min(2, window.devicePixelRatio || 1), W2 = Math.round(w * d), H2 = Math.round(h * d);
  if (cv.width !== W2 || cv.height !== H2) { cv.width = W2; cv.height = H2; }
  return true;
}

/** 2D context scaled so drawing uses CSS pixels. */
export function ctx2d(cv: HTMLCanvasElement) {
  const ctx = cv.getContext('2d')!;
  const w = cv.clientWidth, h = cv.clientHeight, d = cv.width / w;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}
