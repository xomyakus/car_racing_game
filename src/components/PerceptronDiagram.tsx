export type PerceptronKind = 'gas' | 'steer';

interface Props {
  kind: PerceptronKind;
  /** one weight per input, then the bias */
  weights: ArrayLike<number>;
  /** what the car feels right now; without it only the weights are drawn */
  inputs?: ArrayLike<number>;
  labels: string[];
}

const ENDS: Record<PerceptronKind, [string, string]> = { gas: ['brake', 'gas'], steer: ['left', 'right'] };
const fmt = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1);

/**
 * One perceptron on its own: every input, its weight (line colour = push or pull, thickness = how much),
 * the neuron that adds everything up and squeezes it, and where the answer lands between its two ends.
 */
export function PerceptronDiagram({ kind, weights, inputs, labels }: Props) {
  const n = labels.length;
  const top = 22, gap = Math.min(32, 200 / Math.max(1, n - 1));
  const ys = labels.map((_, i) => top + i * gap);
  const biasY = top + (n - 1) * gap + 40;
  const nx = 290, ny = (top + biasY) / 2, nr = 32;
  let sum = weights[n] ?? 0;
  if (inputs) for (let i = 0; i < n; i++) sum += weights[i] * inputs[i];
  const out = Math.tanh(sum);
  const [lo, hi] = ENDS[kind];
  const line = (y: number, w: number, x: number | null, key: string) => {
    const strength = x == null ? Math.min(1, Math.abs(w) / 2) : Math.min(1, Math.abs(w * x));
    const t = 0.27, lx = 128 + (nx - nr - 128) * t, ly = y + (ny - y) * t;
    return (
      <g key={key}>
        <line x1={128} y1={y} x2={nx - nr + 2} y2={ny} stroke={w >= 0 ? 'var(--pos)' : 'var(--neg)'}
          strokeWidth={0.8 + Math.min(3.5, Math.abs(w) * 1.3)} strokeOpacity={0.2 + 0.8 * strength} strokeLinecap="round" />
        <rect x={lx - 16} y={ly - 8} width={32} height={15} rx={4} fill="var(--paper)" stroke={w >= 0 ? 'var(--pos)' : 'var(--neg)'} strokeWidth={1} />
        <text x={lx} y={ly + 3.5} textAnchor="middle" className="pd-w" fill={w >= 0 ? 'var(--pos)' : 'var(--neg)'}>{fmt(w)}</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 400 ${biasY + 26}`} className="perceptron" role="img"
      aria-label={`${kind} perceptron: ${labels.map((l, i) => `${l} weight ${weights[i].toFixed(1)}`).join(', ')}, bias ${(weights[n] ?? 0).toFixed(1)}`}>
      {labels.map((l, i) => line(ys[i], weights[i], inputs ? inputs[i] : null, l))}
      {line(biasY, weights[n] ?? 0, inputs ? 1 : null, 'bias')}
      {labels.map((l, i) => (
        <g key={l}>
          <text x={104} y={ys[i] + 4} textAnchor="end" className="pd-label">{l}</text>
          <circle cx={118} cy={ys[i]} r={9} fill={inputs ? `rgba(244,194,28,${Math.max(0.08, Math.min(1, Math.abs(inputs[i])))})` : 'var(--paper)'} stroke="var(--ink)" strokeWidth={1.5} />
        </g>
      ))}
      <text x={104} y={biasY + 4} textAnchor="end" className="pd-label">bias (always 1)</text>
      <circle cx={118} cy={biasY} r={9} fill="var(--mat)" stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 2" />
      <circle cx={nx} cy={ny} r={nr} fill={inputs ? (out >= 0 ? 'var(--pos)' : 'var(--neg)') : 'var(--paper)'} fillOpacity={inputs ? 0.15 + 0.85 * Math.abs(out) : 1} stroke="var(--ink)" strokeWidth={2.5} />
      <text x={nx} y={ny + 9} textAnchor="middle" className="pd-sigma">Σ</text>
      <text x={nx} y={ny - nr - 8} textAnchor="middle" className="pd-kind">{kind.toUpperCase()}</text>
      {/* where the answer lands, from −1 to +1 */}
      <g transform={`translate(${nx - 70}, ${ny + nr + 18})`}>
        <rect x={0} y={0} width={140} height={10} rx={5} fill="var(--mat)" stroke="var(--ink)" strokeWidth={1.5} />
        <line x1={70} y1={-3} x2={70} y2={13} stroke="var(--ink)" strokeWidth={1.5} />
        {inputs && <rect x={out >= 0 ? 70 : 70 + out * 70} y={1.5} width={Math.abs(out) * 70} height={7} fill={out >= 0 ? 'var(--pos)' : 'var(--neg)'} />}
        <text x={0} y={26} className="pd-end">{lo}</text>
        <text x={140} y={26} textAnchor="end" className="pd-end">{hi}</text>
        {inputs && <text x={70} y={26} textAnchor="middle" className="pd-out">{(out >= 0 ? '+' : '') + out.toFixed(2)}</text>}
      </g>
    </svg>
  );
}
