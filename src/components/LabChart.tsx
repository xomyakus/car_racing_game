import { useRef } from 'react';
import type { Lab } from '../sim/lab';
import { progFrac } from '../sim/score';
import { COL, FONT, rgba } from '../theme';
import { ctx2d, sizeCanvas, useFrame } from '../hooks';

interface Pt {
  /** one test drive (dot) — "one at a time" mode */
  dot?: number; kind?: string;
  /** generation best and average (lines) — "20 at once" mode */
  gen?: number; avg?: number;
  best: number; time: number | null; bestTime: number | null;
}

/** Top: how far brains got (square-root scale). Bottom, once someone finishes: total race time, faster = higher. */
export function LabChart({ lab }: { lab: Lab }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  useFrame(() => {
    if (frame.current++ % 12) return;
    const cv = ref.current;
    if (!cv || !sizeCanvas(cv)) return;
    const pts: Pt[] = lab.mode === 'single'
      ? lab.hist.map(p => ({ dot: p.pct, kind: p.kind, best: p.best, time: p.time, bestTime: p.bestTime }))
      : lab.popHist.map(g => ({ gen: g.best, avg: g.avg, best: g.bestEver, time: g.bestTime, bestTime: g.bestEverTime }));
    draw(cv, pts, lab.mode === 'single' ? 'brains tested' : 'generations', lab.totalLaps);
  });
  return <canvas ref={ref} className="bchart" aria-label="Chart of how far the brains got" />;
}

function draw(cv: HTMLCanvasElement, P: Pt[], xName: string, total: number) {
  const { ctx, w, h } = ctx2d(cv);
  const n = P.length, pl = 50, pr = 8, pt = 16, pb = 16;
  const raced = n > 0 && P[n - 1].bestTime != null;
  const h1 = raced ? (h - pt - pb) * 0.56 : h - pt - pb, top2 = pt + h1 + 30, h2 = h - pb - top2;
  const x = (i: number) => pl + (n <= 1 ? (w - pl - pr) / 2 : ((w - pl - pr) * i) / (n - 1));
  const y = (v: number) => pt + (1 - progFrac(v, total)) * h1;
  const dotCol = (k?: string) => (k === 'up' ? COL.good : k === 'rnd' ? 'rgba(138,92,240,.85)' : k === 'hand' ? COL.red : rgba(COL.pos, 0.45));
  const r = n > 400 ? 1.6 : n > 120 ? 2.2 : 3;
  ctx.lineWidth = 1;
  ctx.font = `900 10px ${FONT.body}`; ctx.textAlign = 'left'; ctx.fillStyle = COL.muted;
  ctx.fillText('HOW FAR THE BRAINS GOT', pl, 10);
  ctx.font = `700 10px ${FONT.mono}`; ctx.textAlign = 'right';
  for (const [v, lab] of ([[0, 'start'], [100, '1 lap'], [300, '3 laps'], [total * 100, `${total} laps`]] as [number, string][]).filter(([v]) => v <= total * 100)) {
    ctx.strokeStyle = COL.rule; ctx.beginPath(); ctx.moveTo(pl, y(v)); ctx.lineTo(w - pr, y(v)); ctx.stroke();
    ctx.fillStyle = COL.muted; ctx.fillText(lab, pl - 6, y(v) + 3);
  }
  if (!n) {
    ctx.textAlign = 'center'; ctx.fillStyle = COL.ink; ctx.font = `800 13px ${FONT.body}`;
    ctx.fillText('Test drives show up here', (w + pl) / 2, pt + h1 / 2);
    return;
  }
  ctx.textAlign = 'left'; ctx.fillStyle = COL.muted;
  ctx.fillText(`${n} ${xName} →`, pl, h - 3);
  const line = (val: (p: Pt) => number | null | undefined, yf: (v: number) => number, color: string, lw: number, step: boolean) => {
    ctx.beginPath();
    let on = false, lastY = 0;
    P.forEach((p, i) => {
      const v = val(p);
      if (v == null) return;
      const yy = yf(v);
      if (!on) { ctx.moveTo(x(i), yy); on = true; } else { if (step) ctx.lineTo(x(i), lastY); ctx.lineTo(x(i), yy); }
      lastY = yy;
    });
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(); ctx.lineWidth = 1;
  };
  P.forEach((p, i) => {
    if (p.dot == null) return;
    ctx.fillStyle = dotCol(p.kind);
    ctx.beginPath(); ctx.arc(x(i), y(p.dot), p.kind === 'up' ? r + 1.2 : r, 0, Math.PI * 2); ctx.fill();
  });
  line(p => p.avg, y, COL.muted, 1.5, false);
  line(p => p.gen, y, rgba(COL.pos, 0.8), 1.5, false);
  line(p => p.best, y, COL.ink, 2, true);
  if (!raced) return;
  const times = P.flatMap(p => (p.time != null ? [p.time] : []));
  let lo = Math.floor(Math.min(...times) - 1), hi = Math.ceil(Math.max(...times) + 1);
  if (hi - lo < 2) hi = lo + 2;
  const yt = (t: number) => top2 + ((t - lo) / (hi - lo)) * h2;
  ctx.font = `900 10px ${FONT.body}`; ctx.textAlign = 'left'; ctx.fillStyle = COL.muted;
  ctx.fillText(`${total}-LAP RACE TIME (UP = FASTER)`, pl, top2 - 8);
  ctx.font = `700 10px ${FONT.mono}`; ctx.textAlign = 'right';
  for (const v of [lo, hi]) {
    ctx.strokeStyle = COL.rule; ctx.beginPath(); ctx.moveTo(pl, yt(v)); ctx.lineTo(w - pr, yt(v)); ctx.stroke();
    ctx.fillStyle = COL.muted; ctx.fillText(`${v}s`, pl - 6, yt(v) + 3);
  }
  P.forEach((p, i) => {
    if (p.time == null || p.dot == null) return;
    ctx.fillStyle = dotCol(p.kind);
    ctx.beginPath(); ctx.arc(x(i), yt(p.time), p.kind === 'up' ? r + 1.2 : r, 0, Math.PI * 2); ctx.fill();
  });
  if (P.some(p => p.gen != null)) line(p => p.time, yt, rgba(COL.pos, 0.8), 1.5, false);
  line(p => p.bestTime, yt, COL.ink, 2, true);
}
