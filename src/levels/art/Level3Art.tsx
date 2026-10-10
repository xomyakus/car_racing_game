// Drawings for the level 3 cards. Plain SVG, coloured with the page's CSS tokens.
import { Arrow } from './Level2Art';

const Bubble = ({ x, y, text, w = 118 }: { x: number; y: number; text: string; w?: number }) => (
  <g>
    <rect x={x} y={y - 11} width={w} height={22} rx={11} fill="#fff3c4" stroke="var(--ink)" strokeWidth={1.5} />
    <path d={`M ${x + 2} ${y + 3} L ${x - 8} ${y + 2} L ${x + 4} ${y - 5}`} fill="#fff3c4" stroke="var(--ink)" strokeWidth={1.5} strokeLinejoin="round" />
    <text x={x + w / 2} y={y + 4} textAnchor="middle" className="art-xs" fill="var(--ink)">{text}</text>
  </g>
);

/** Hidden neurons each notice one situation; gas and steer listen to them. */
export function NoticeArt() {
  const hidden = [
    { y: 34, text: '"wall close, left"' },
    { y: 84, text: '"going fast"' },
    { y: 134, text: '"road turns right"' },
  ];
  return (
    <svg viewBox="0 0 440 200" className="art" role="img" aria-label="Seven inputs feed hidden neurons that each notice one situation, like a wall close on the left or going fast; gas and steer listen to those neurons">
      {Array.from({ length: 7 }, (_, i) => {
        const y = 20 + i * 24;
        return (
          <g key={i}>
            {hidden.map(h => <line key={h.y} x1={28} y1={y} x2={132} y2={h.y} stroke="var(--rule)" strokeWidth={1.2} />)}
            <circle cx={22} cy={y} r={7} fill="rgba(244,194,28,.4)" stroke="var(--ink)" strokeWidth={1.5} />
          </g>
        );
      })}
      <text x={22} y={196} textAnchor="middle" className="art-xs">7 inputs</text>
      {hidden.map(h => (
        <g key={h.y}>
          <line x1={150} y1={h.y} x2={364} y2={70} stroke="var(--pos)" strokeOpacity={0.5} strokeWidth={1.5} />
          <line x1={150} y1={h.y} x2={364} y2={140} stroke="var(--neg)" strokeOpacity={0.5} strokeWidth={1.5} />
        </g>
      ))}
      {hidden.map(h => (
        <g key={h.y}>
          <circle cx={140} cy={h.y} r={12} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} />
          <Bubble x={166} y={h.y - 6} text={h.text} />
        </g>
      ))}
      <text x={140} y={170} textAnchor="middle" className="art-xs">hidden neurons</text>
      <text x={140} y={182} textAnchor="middle" className="art-xs">(8 of them; 3 shown)</text>
      <circle cx={384} cy={70} r={20} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
      <text x={384} y={75} textAnchor="middle" className="art-xs" fill="var(--ink)">GAS</text>
      <circle cx={384} cy={140} r={20} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
      <text x={384} y={145} textAnchor="middle" className="art-xs" fill="var(--ink)">STEER</text>
    </svg>
  );
}

/** A hidden neuron that fires only when fast AND close: only one of four boxes says brake. */
export function AndArt() {
  const cells = [
    { col: 0, row: 0, text: 'gas', hot: false }, { col: 1, row: 0, text: 'gas', hot: false },
    { col: 0, row: 1, text: 'gas', hot: false }, { col: 1, row: 1, text: 'BRAKE!', hot: true },
  ];
  const X = (c: number) => 214 + c * 98, Y = (r: number) => 46 + r * 70;
  return (
    <svg viewBox="0 0 440 210" className="art" role="img" aria-label="Speed and wall-ahead go into one hidden neuron that only fires when the car is fast and the wall is near; then the car brakes">
      <circle cx={30} cy={60} r={18} fill="rgba(42,102,217,.25)" stroke="var(--ink)" strokeWidth={2} />
      <text x={30} y={64} textAnchor="middle" className="art-xs" fill="var(--ink)">speed</text>
      <circle cx={30} cy={140} r={18} fill="rgba(244,194,28,.4)" stroke="var(--ink)" strokeWidth={2} />
      <text x={30} y={144} textAnchor="middle" className="art-xs" fill="var(--ink)">ahead</text>
      <line x1={48} y1={60} x2={96} y2={92} stroke="var(--pos)" strokeWidth={3} />
      <line x1={48} y1={140} x2={96} y2={108} stroke="var(--neg)" strokeWidth={3} />
      <circle cx={126} cy={100} r={32} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
      <text x={126} y={97} textAnchor="middle" className="art-xs" fill="var(--ink)">fast AND</text>
      <text x={126} y={110} textAnchor="middle" className="art-xs" fill="var(--ink)">close?</text>
      <Arrow x1={160} y1={100} x2={184} y2={100} />
      <text x={X(0) + 44} y={22} textAnchor="middle" className="art-s">slow</text>
      <text x={X(1) + 44} y={22} textAnchor="middle" className="art-s">fast</text>
      <text x={X(0) - 8} y={Y(0) + 34} textAnchor="end" className="art-s">far</text>
      <text x={X(0) - 8} y={Y(1) + 34} textAnchor="end" className="art-s">near</text>
      {cells.map(c => (
        <g key={`${c.col}${c.row}`}>
          <rect x={X(c.col)} y={Y(c.row)} width={88} height={60} rx={10} fill={c.hot ? 'var(--neg)' : 'var(--mat)'} fillOpacity={c.hot ? 0.85 : 1} stroke="var(--ink)" strokeWidth={2} />
          <text x={X(c.col) + 44} y={Y(c.row) + 36} textAnchor="middle" className="art-m" fill={c.hot ? 'var(--paper)' : 'var(--pos)'}>{c.text}</text>
        </g>
      ))}
      <text x={X(0) + 93} y={202} textAnchor="middle" className="art-xs">wall ahead ↕ · speed ↔</text>
    </svg>
  );
}

/** 64 + 18 = 82 weights, one dot each. */
export function Count3Art() {
  const dots = (n: number, x0: number, y0: number, cols: number, col: string) =>
    Array.from({ length: n }, (_, i) => <circle key={i} cx={x0 + (i % cols) * 11} cy={y0 + Math.floor(i / cols) * 11} r={4} fill={col} />);
  return (
    <svg viewBox="0 0 440 210" className="art" role="img" aria-label="64 weights between inputs and hidden layer, 18 between hidden layer and outputs: 82 weights">
      <text x={10} y={22} className="art-s">inputs → hidden</text>
      {dots(64, 16, 40, 8, 'var(--pos)')}
      <text x={10} y={150} className="art-m">(7 + 1) × 8 = 64</text>
      <text x={210} y={22} className="art-s">hidden → outputs</text>
      {dots(18, 216, 40, 9, 'var(--neg)')}
      <text x={210} y={92} className="art-m">(8 + 1) × 2 = 18</text>
      <text x={210} y={128} className="art-xs">the +1 is each neuron's bias</text>
      <text x={220} y={192} textAnchor="middle" className="art-m">64 + 18 = 82 weights: 5 times more than level 2</text>
    </svg>
  );
}

/** Raw numbers → simple ideas → a big idea. */
export function IdeasArt() {
  const box = (x: number, y: number, w: number, text: string, fill: string) => (
    <g>
      <rect x={x} y={y - 14} width={w} height={28} rx={8} fill={fill} stroke="var(--ink)" strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 4} textAnchor="middle" className="art-xs" fill="var(--ink)">{text}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 440 210" className="art" role="img" aria-label="Raw numbers become simple ideas in the first layer, and a second layer combines them into a big idea: brake hard now">
      <text x={50} y={20} textAnchor="middle" className="art-s">numbers</text>
      <text x={200} y={20} textAnchor="middle" className="art-s">layer 1: simple ideas</text>
      <text x={370} y={20} textAnchor="middle" className="art-s">layer 2: big idea</text>
      {box(10, 60, 80, 'ahead 0.3', 'rgba(244,194,28,.35)')}
      {box(10, 100, 80, 'far right 0.9', 'rgba(244,194,28,.35)')}
      {box(10, 140, 80, 'speed 0.9', 'rgba(42,102,217,.2)')}
      <Arrow x1={94} y1={80} x2={128} y2={80} />
      <Arrow x1={94} y1={140} x2={128} y2={140} />
      {box(134, 80, 132, '"sharp corner coming"', '#fff3c4')}
      {box(134, 140, 132, '"going fast"', '#fff3c4')}
      <Arrow x1={270} y1={84} x2={306} y2={104} />
      <Arrow x1={270} y1={136} x2={306} y2={116} />
      {box(312, 110, 116, 'BRAKE HARD NOW', 'var(--neg)')}
      <text x={220} y={196} textAnchor="middle" className="art-xs">level 3 has only layer 1; level 4 adds layer 2</text>
    </svg>
  );
}

/** One very wide layer vs two smaller stacked layers. */
export function WideDeepArt() {
  const column = (n: number, top: number, gap: number) => Array.from({ length: n }, (_, i) => top + i * gap);
  const wide = column(14, 22, 11.5), deepA = column(6, 50, 20), deepB = column(6, 50, 20);
  return (
    <svg viewBox="0 0 440 210" className="art" role="img" aria-label="One wide layer needs many neurons; two smaller stacked layers can do the same job with fewer">
      {wide.map(y => <circle key={y} cx={110} cy={y} r={4.5} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />)}
      {[40, 100, 160].map(y => wide.map(w => <line key={`${y}-${w}`} x1={40} y1={y} x2={105} y2={w} stroke="var(--rule)" strokeWidth={0.8} />))}
      {[40, 100, 160].map(y => <circle key={y} cx={36} cy={y} r={6} fill="rgba(244,194,28,.4)" stroke="var(--ink)" strokeWidth={1.5} />)}
      <text x={80} y={196} textAnchor="middle" className="art-s">one wide layer</text>
      <text x={80} y={208} textAnchor="middle" className="art-xs">lots of neurons</text>
      {[60, 110, 160].map(y => deepA.map(a => <line key={`${y}-${a}`} x1={262} y1={y - 10} x2={308} y2={a} stroke="var(--rule)" strokeWidth={0.8} />))}
      {deepA.map(a => deepB.map(b => <line key={`${a}-${b}`} x1={316} y1={a} x2={368} y2={b} stroke="var(--rule)" strokeWidth={0.8} />))}
      {[50, 100, 150].map(y => <circle key={y} cx={258} cy={y} r={6} fill="rgba(244,194,28,.4)" stroke="var(--ink)" strokeWidth={1.5} />)}
      {deepA.map(y => <circle key={`a${y}`} cx={312} cy={y} r={5} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />)}
      {deepB.map(y => <circle key={`b${y}`} cx={372} cy={y} r={5} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />)}
      <text x={315} y={196} textAnchor="middle" className="art-s">two smaller layers</text>
      <text x={315} y={208} textAnchor="middle" className="art-xs">often the same job, fewer neurons</text>
      <line x1={200} y1={20} x2={200} y2={185} stroke="var(--rule)" strokeWidth={2} strokeDasharray="5 5" />
    </svg>
  );
}

/** More layers, more knobs for evolution to tune. */
export function KnobCountArt() {
  const rows = [
    { name: 'level 2 · 7 → 2', n: 16 },
    { name: 'level 3 · 7 → 8 → 2', n: 82 },
    { name: 'level 4 · 7 → 16 → 16 → 2', n: 434 },
  ];
  return (
    <svg viewBox="0 0 440 210" className="art" role="img" aria-label="Weights to tune: 16 in level 2, 82 in level 3, 434 in level 4">
      <text x={10} y={20} className="art-s">weights evolution has to tune</text>
      {rows.map((r, i) => {
        const y = 54 + i * 50, w = Math.max(4, (r.n / 434) * 230);
        return (
          <g key={r.n}>
            <text x={10} y={y - 8} className="art-xs" fill="var(--ink)">{r.name}</text>
            <rect x={10} y={y} width={w} height={20} rx={5} fill={i === 1 ? 'var(--red)' : 'var(--pos)'} opacity={i === 1 ? 1 : 0.55} />
            <text x={18 + w} y={y + 15} className="art-m">{r.n}</text>
          </g>
        );
      })}
      <text x={10} y={204} className="art-xs">more knobs can drive better, but take longer to get right</text>
    </svg>
  );
}
