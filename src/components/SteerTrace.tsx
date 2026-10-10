import { useRef } from 'react';
import type { Car } from '../sim/car';
import { COL, FONT, rgba } from '../theme';
import { ctx2d, sizeCanvas, useFrame } from '../hooks';

/** The last few seconds of a car's steering: smooth driving is a calm line, wobbly driving zig-zags. */
export function SteerTrace({ car }: { car: () => Car | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const buf = useRef<number[]>([]);
  const last = useRef<{ c: Car | null; t: number }>({ c: null, t: -1 });
  useFrame(() => {
    const c = car(), cv = ref.current;
    if (c && c.alive && (c !== last.current.c || c.t !== last.current.t)) {
      if (c !== last.current.c) buf.current = [];
      buf.current.push(c.steer);
      if (buf.current.length > 180) buf.current.shift();
      last.current = { c, t: c.t };
    }
    if (!cv || !sizeCanvas(cv)) return;
    const { ctx, w, h } = ctx2d(cv);
    const y = (v: number) => h / 2 - v * (h / 2 - 8);
    ctx.strokeStyle = COL.rule; ctx.lineWidth = 1;
    for (const v of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(0, y(v)); ctx.lineTo(w, y(v)); ctx.stroke(); }
    ctx.fillStyle = COL.muted; ctx.font = `700 10px ${FONT.mono}`;
    ctx.fillText('right', 4, y(1) + 12); ctx.fillText('left', 4, y(-1) - 4);
    const b = buf.current;
    ctx.beginPath();
    b.forEach((v, i) => { const x = (w * i) / 179; if (i) ctx.lineTo(x, y(v)); else ctx.moveTo(x, y(v)); });
    ctx.strokeStyle = rgba(COL.pos, 1); ctx.lineWidth = 2; ctx.stroke();
  });
  return <canvas ref={ref} className="trace" aria-label="Steering over the last three seconds" />;
}
