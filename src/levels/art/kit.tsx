// Small building blocks shared by the level drawings. Plain SVG, coloured with the page's CSS tokens.
import { ReactNode } from 'react';
export { Arrow, Knob } from './Level2Art';

/** A 440 × 210 drawing with a description for screen readers. */
export const Svg = ({ label, children, h = 210 }: { label: string; children: ReactNode; h?: number }) => (
  <svg viewBox={`0 0 440 ${h}`} className="art" role="img" aria-label={label}>{children}</svg>
);

/** A car seen from above, pointing along `angle` (degrees, 0 = right), with optional sensor rays. */
export function Car({ x, y, angle = 0, rays = [], color = 'var(--red)', ghost }: {
  x: number; y: number; angle?: number; rays?: { a: number; len: number; hit?: boolean }[]; color?: string; ghost?: boolean;
}) {
  return (
    <g transform={`translate(${x},${y}) rotate(${angle})`} opacity={ghost ? 0.45 : 1}>
      {rays.map((r, i) => {
        const a = (r.a * Math.PI) / 180, ex = Math.cos(a) * r.len, ey = Math.sin(a) * r.len;
        return (
          <g key={i}>
            <line x1={6} y1={0} x2={ex} y2={ey} stroke="var(--ray)" strokeWidth={3} strokeLinecap="round" />
            {r.hit && <circle cx={ex} cy={ey} r={4} fill="var(--ray)" />}
          </g>
        );
      })}
      <rect x={-13} y={-7} width={26} height={14} rx={4} fill={color} stroke="var(--ink)" strokeWidth={2} />
      <rect x={3} y={-4.5} width={5} height={9} fill="var(--ink)" opacity={0.7} />
    </g>
  );
}

/** A neuron: a circle with an optional label inside. */
export const Node = ({ x, y, r = 16, label, fill = 'var(--paper)', small }: { x: number; y: number; r?: number; label?: string; fill?: string; small?: boolean }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={fill} stroke="var(--ink)" strokeWidth={r > 10 ? 2.5 : 1.5} />
    {label && <text x={x} y={y + 4} textAnchor="middle" className={small ? 'art-xs' : 'art-s'} fill="var(--ink)">{label}</text>}
  </g>
);

/** A rounded label box. */
export const Box = ({ x, y, w, text, fill = 'var(--paper)', h = 26, cls = 'art-xs', color = 'var(--ink)' }: {
  x: number; y: number; w: number; text: string; fill?: string; h?: number; cls?: string; color?: string;
}) => (
  <g>
    <rect x={x} y={y - h / 2} width={w} height={h} rx={8} fill={fill} stroke="var(--ink)" strokeWidth={1.5} />
    <text x={x + w / 2} y={y + 4} textAnchor="middle" className={cls} fill={color}>{text}</text>
  </g>
);

/** Horizontal bars with a label on the left and a value at the end. */
export function Bars({ rows, max, x0 = 150, width = 230, top = 50, gap = 46, title, unit = '' }: {
  rows: { name: string; v: number; color?: string; text?: string; faded?: boolean }[]; max: number;
  x0?: number; width?: number; top?: number; gap?: number; title?: string; unit?: string;
}) {
  return (
    <g>
      {title && <text x={10} y={20} className="art-s">{title}</text>}
      {rows.map((r, i) => {
        const y = top + i * gap, w = Math.max(3, (r.v / max) * width);
        return (
          <g key={r.name}>
            <text x={10} y={y + 5} className="art-s">{r.name}</text>
            <rect x={x0} y={y - 11} width={w} height={22} rx={5} fill={r.color ?? 'var(--pos)'} opacity={r.faded ? 0.5 : 1} />
            <text x={x0 + w + 6} y={y + 5} className="art-m">{r.text ?? `${r.v}${unit}`}</text>
          </g>
        );
      })}
    </g>
  );
}

/** A steering trace between −1 and +1 inside a box. */
export function Trace({ x, y, w, h, values, color = 'var(--pos)', label }: {
  x: number; y: number; w: number; h: number; values: number[]; color?: string; label?: string;
}) {
  const pts = values.map((v, i) => `${x + (w * i) / (values.length - 1)},${y + h / 2 - (v * (h / 2 - 4))}`).join(' ');
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="var(--paper)" stroke="var(--rule)" strokeWidth={1.5} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="var(--rule)" strokeWidth={1} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {label && <text x={x + w / 2} y={y + h + 14} textAnchor="middle" className="art-xs">{label}</text>}
    </g>
  );
}

/** A closed track drawn from a few points, as a thick grey road with a white edge. */
export function MiniTrack({ d, label, x = 0, y = 0, s = 1 }: { d: string; label?: string; x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={d} fill="none" stroke="#d8cda6" strokeWidth={22} strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#4c5359" strokeWidth={16} strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#fff" strokeWidth={1} strokeDasharray="4 5" strokeLinejoin="round" />
      {label && <text x={0} y={0} className="art-xs">{label}</text>}
    </g>
  );
}

/** A tick or a cross. */
export const Mark = ({ x, y, ok }: { x: number; y: number; ok: boolean }) => (ok
  ? <polyline points={`${x - 8},${y} ${x - 2},${y + 7} ${x + 9},${y - 8}`} fill="none" stroke="var(--good)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  : <g stroke="var(--red)" strokeWidth={4} strokeLinecap="round"><line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} /><line x1={x + 7} y1={y - 7} x2={x - 7} y2={y + 7} /></g>);

/** A best-so-far staircase line through `values` (0..1 = how good). */
export function Staircase({ x, y, w, h, values, color = 'var(--ink)', dashed }: { x: number; y: number; w: number; h: number; values: number[]; color?: string; dashed?: boolean }) {
  let best = 0, last = y + h;
  const d = values.map((v, i) => {
    best = Math.max(best, v);
    const px = x + (w * i) / (values.length - 1), py = y + h - best * h;
    const seg = i === 0 ? `M ${px} ${py}` : `L ${px} ${last} L ${px} ${py}`;
    last = py;
    return seg;
  }).join(' ');
  return <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={dashed ? '6 4' : undefined} />;
}
