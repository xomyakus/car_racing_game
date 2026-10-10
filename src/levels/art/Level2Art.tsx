// Drawings for the level 2 cards. Plain SVG, coloured with the page's CSS tokens.

const Arrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8;
  return (
    <g stroke="var(--ink)" strokeWidth={2.5} strokeLinecap="round" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polyline points={`${x2 - h * Math.cos(a - 0.5)},${y2 - h * Math.sin(a - 0.5)} ${x2},${y2} ${x2 - h * Math.cos(a + 0.5)},${y2 - h * Math.sin(a + 0.5)}`} />
    </g>
  );
};

/** A volume-knob style dial: turned right for positive weights, left for negative. */
export function Knob({ x, y, w, r = 17 }: { x: number; y: number; w: number; r?: number }) {
  const a = (Math.max(-3, Math.min(3, w)) / 3) * 135 * (Math.PI / 180);
  const col = Math.abs(w) < 0.05 ? 'var(--muted)' : w > 0 ? 'var(--pos)' : 'var(--neg)';
  return (
    <g>
      <path d={`M ${x - r * 0.7} ${y + r * 0.7} A ${r} ${r} 0 1 1 ${x + r * 0.7} ${y + r * 0.7}`} fill="none" stroke="var(--rule)" strokeWidth={4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r - 5} fill="var(--paper)" stroke={col} strokeWidth={3} />
      <line x1={x} y1={y} x2={x + Math.sin(a) * (r - 7)} y2={y - Math.cos(a) * (r - 7)} stroke={col} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}

const Car = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y})`}>
    {[-1.05, -0.52, 0, 0.52, 1.05].map(a => (
      <line key={a} x1={10} y1={0} x2={10 + Math.cos(a) * 46} y2={Math.sin(a) * 46} stroke="var(--ray)" strokeWidth={3} strokeLinecap="round" />
    ))}
    <rect x={-14} y={-8} width={26} height={16} rx={4} fill="var(--red)" stroke="var(--ink)" strokeWidth={2} />
    <rect x={2} y={-5} width={5} height={10} fill="var(--ink)" opacity={0.7} />
  </g>
);

const Wheel = ({ x, y }: { x: number; y: number }) => (
  <g stroke="var(--ink)" strokeWidth={3} fill="none">
    <circle cx={x} cy={y} r={17} />
    <circle cx={x} cy={y} r={4} fill="var(--ink)" />
    <line x1={x - 16} y1={y} x2={x + 16} y2={y} />
    <line x1={x} y1={y} x2={x} y2={y + 16} />
  </g>
);

const Pedal = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y}) rotate(-18)`}>
    <rect x={-10} y={-18} width={20} height={34} rx={5} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
    {[-9, -2, 5].map(dy => <line key={dy} x1={-5} y1={dy} x2={5} y2={dy} stroke="var(--ink)" strokeWidth={2} />)}
  </g>
);

/** Why: the car only has 7 numbers, and someone has to turn them into gas and steering. */
export function WhyArt() {
  const bars = [0.24, 1, 0.58, 0.26, 0.19, 0.5, 0.5];
  return (
    <svg viewBox="0 0 420 210" className="art" role="img" aria-label="The car's 7 numbers go into a box with a question mark, which has to decide the gas and the steering">
      <Car x={32} y={92} />
      <text x={38} y={150} textAnchor="middle" className="art-s">the car</text>
      <Arrow x1={92} y1={92} x2={112} y2={92} />
      {bars.map((v, i) => (
        <g key={i}>
          <rect x={120} y={46 + i * 14} width={44} height={9} rx={2} fill="var(--mat)" stroke="var(--ink)" strokeWidth={1} />
          <rect x={120} y={46 + i * 14} width={44 * v} height={9} rx={2} fill={i < 5 ? 'var(--ray)' : i === 5 ? 'var(--pos)' : 'var(--neg)'} />
        </g>
      ))}
      <text x={142} y={160} textAnchor="middle" className="art-s">7 numbers</text>
      <Arrow x1={172} y1={92} x2={196} y2={92} />
      <rect x={204} y={58} width={78} height={68} rx={12} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} strokeDasharray="6 4" />
      <text x={243} y={108} textAnchor="middle" className="art-big">?</text>
      <text x={243} y={146} textAnchor="middle" className="art-s">who decides?</text>
      <Arrow x1={286} y1={78} x2={318} y2={52} />
      <Arrow x1={286} y1={106} x2={318} y2={132} />
      <Pedal x={346} y={44} />
      <text x={382} y={50} className="art-m">gas</text>
      <Wheel x={346} y={140} />
      <text x={372} y={146} className="art-m">steer</text>
      <text x={210} y={200} textAnchor="middle" className="art-s">In level 1 that was you. Now it has to be a little machine.</text>
    </svg>
  );
}

/** Multiply, add, squeeze, with the same numbers as the playground below. */
export function StepsArt() {
  const xs = [0.8, 0.6, 0], ws = [2, -1.5, 0.3];
  return (
    <svg viewBox="0 0 450 210" className="art" role="img" aria-label="Three inputs are multiplied by their weights, added up, then squeezed into an answer between minus one and plus one">
      {xs.map((x, i) => {
        const y = 40 + i * 52;
        return (
          <g key={i}>
            <circle cx={30} cy={y} r={18} fill="rgba(244,194,28,.35)" stroke="var(--ink)" strokeWidth={2} />
            <text x={30} y={y + 5} textAnchor="middle" className="art-m">{x}</text>
            <line x1={48} y1={y} x2={196} y2={92} stroke={ws[i] >= 0 ? 'var(--pos)' : 'var(--neg)'} strokeWidth={1 + Math.abs(ws[i]) * 1.6} strokeLinecap="round" />
            <rect x={92} y={y + (92 - y) * 0.35 - 11} width={50} height={20} rx={5} fill="var(--paper)" stroke={ws[i] >= 0 ? 'var(--pos)' : 'var(--neg)'} />
            <text x={117} y={y + (92 - y) * 0.35 + 4} textAnchor="middle" className="art-w" fill={ws[i] >= 0 ? 'var(--pos)' : 'var(--neg)'}>× {ws[i]}</text>
          </g>
        );
      })}
      <circle cx={222} cy={92} r={28} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
      <text x={222} y={102} textAnchor="middle" className="art-big2">Σ</text>
      <text x={222} y={136} textAnchor="middle" className="art-s">+ bias</text>
      <Arrow x1={252} y1={92} x2={276} y2={92} />
      <rect x={282} y={62} width={64} height={60} rx={8} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2} />
      <path d="M 290 112 C 310 112, 306 72, 338 72" fill="none" stroke="var(--ink)" strokeWidth={3} />
      <Arrow x1={350} y1={92} x2={372} y2={92} />
      <text x={398} y={88} textAnchor="middle" className="art-m">+0.38</text>
      <text x={398} y={104} textAnchor="middle" className="art-s">a little gas</text>
      <text x={117} y={196} textAnchor="middle" className="art-step">1 multiply</text>
      <text x={222} y={196} textAnchor="middle" className="art-step">2 add</text>
      <text x={314} y={196} textAnchor="middle" className="art-step">3 squeeze</text>
    </svg>
  );
}

/** Weights as volume knobs: push, pull, or ignore. */
export function KnobsArt() {
  const rows = [
    { w: 2, word: 'pushes', note: 'lots of room → steer right' },
    { w: -2, word: 'pulls', note: 'lots of room → steer left' },
    { w: 0, word: 'ignores it', note: 'room on the right doesn\'t matter' },
  ];
  return (
    <svg viewBox="0 0 420 210" className="art" role="img" aria-label="A weight is like a volume knob: turned up it pushes, turned below zero it pulls, at zero the input is ignored">
      <text x={210} y={18} textAnchor="middle" className="art-m">"far right" ray = 0.8 (lots of room)</text>
      {rows.map((r, i) => {
        const y = 58 + i * 56, p = 0.8 * r.w;
        return (
          <g key={i}>
            <text x={10} y={y + 5} className="art-s">weight {r.w > 0 ? '+' : ''}{r.w}</text>
            <Knob x={98} y={y} w={r.w} />
            <Arrow x1={122} y1={y} x2={146} y2={y} />
            <rect x={154} y={y - 8} width={150} height={16} rx={4} fill="var(--mat)" stroke="var(--ink)" strokeWidth={1} />
            <line x1={229} y1={y - 12} x2={229} y2={y + 12} stroke="var(--ink)" strokeWidth={1.5} />
            {p !== 0 && <rect x={p > 0 ? 229 : 229 + p * 30} y={y - 6} width={Math.abs(p) * 30} height={12} fill={p > 0 ? 'var(--pos)' : 'var(--neg)'} />}
            <text x={312} y={y - 2} className="art-m" fill={p > 0 ? 'var(--pos)' : p < 0 ? 'var(--neg)' : 'var(--muted)'}>{r.word}</text>
            <text x={312} y={y + 13} className="art-s">{p > 0 ? '+' : p < 0 ? '−' : ''}{Math.abs(p).toFixed(1)}</text>
            <text x={229} y={y + 26} textAnchor="middle" className="art-xs">{r.note}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Two perceptrons, 8 numbers each. */
export function CountArt() {
  const one = (cx: number, name: string, col: string) => (
    <g>
      {Array.from({ length: 7 }, (_, i) => {
        const y = 28 + i * 16;
        return <g key={i}><circle cx={cx - 70} cy={y} r={5} fill="var(--paper)" stroke="var(--ink)" /><line x1={cx - 65} y1={y} x2={cx - 22} y2={90} stroke={col} strokeWidth={2} /></g>;
      })}
      <circle cx={cx - 70} cy={150} r={5} fill="var(--mat)" stroke="var(--ink)" strokeDasharray="2 2" />
      <line x1={cx - 65} y1={150} x2={cx - 22} y2={96} stroke={col} strokeWidth={2} strokeDasharray="4 3" />
      <circle cx={cx} cy={92} r={22} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
      <text x={cx} y={97} textAnchor="middle" className="art-s">{name}</text>
      <text x={cx - 30} y={182} textAnchor="middle" className="art-m">7 + 1 = 8</text>
    </g>
  );
  return (
    <svg viewBox="0 0 420 210" className="art" role="img" aria-label="The gas perceptron has 7 weights and a bias, so does the steer perceptron: 16 numbers in total">
      {one(130, 'GAS', 'var(--pos)')}
      {one(330, 'STEER', 'var(--neg)')}
      <text x={210} y={204} textAnchor="middle" className="art-m">8 + 8 = 16 numbers: the whole brain</text>
    </svg>
  );
}

/** A perceptron can only split situations with a straight line; braking needs a curve. */
export function StraightLineArt() {
  const X = (s: number) => 50 + s * 330, Y = (d: number) => 170 - d * 140;
  const curve = Array.from({ length: 21 }, (_, i) => { const s = i / 20; return `${X(s)},${Y(0.08 + 0.85 * s * s)}`; }).join(' ');
  return (
    <svg viewBox="0 0 420 210" className="art" role="img" aria-label="Chart of speed against the distance to the wall ahead: the real braking zone is bounded by a curve, a perceptron can only draw a straight line">
      <polygon points={`${X(0)},${Y(0)} ${curve} ${X(1)},${Y(0)}`} fill="var(--neg)" opacity={0.25} />
      <polyline points={curve} fill="none" stroke="var(--neg)" strokeWidth={3} />
      <line x1={X(0)} y1={Y(-0.05)} x2={X(1)} y2={Y(0.85)} stroke="var(--ink)" strokeWidth={2.5} strokeDasharray="7 5" />
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(0)} stroke="var(--ink)" strokeWidth={2} />
      <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1)} stroke="var(--ink)" strokeWidth={2} />
      <text x={X(1)} y={Y(0) + 20} textAnchor="end" className="art-s">speed → fast</text>
      <text x={X(0) - 8} y={Y(1) + 4} textAnchor="end" className="art-s">far</text>
      <text x={X(0) - 8} y={Y(0)} textAnchor="end" className="art-s">near</text>
      <text x={X(0)} y={14} className="art-s">wall ahead</text>
      <text x={X(0.82)} y={Y(0.25)} textAnchor="middle" className="art-m" fill="var(--neg)">brake!</text>
      <text x={X(0.2)} y={Y(0.72)} className="art-m" fill="var(--pos)">gas</text>
      <text x={X(0.45)} y={Y(0.62)} className="art-xs">perceptron: a straight line</text>
      <text x={X(0.5)} y={Y(0.12)} className="art-xs" fill="var(--neg)">what a driver needs: a curve</text>
    </svg>
  );
}

/** The two perceptrons see the same inputs but never talk to each other. */
export function NoTeamworkArt() {
  return (
    <svg viewBox="0 0 420 210" className="art" role="img" aria-label="The gas and steer perceptrons get the same 7 inputs, but there is no line between them, so they never talk">
      {Array.from({ length: 7 }, (_, i) => {
        const y = 30 + i * 22;
        return (
          <g key={i}>
            <circle cx={50} cy={y} r={7} fill="rgba(244,194,28,.4)" stroke="var(--ink)" strokeWidth={1.5} />
            <line x1={57} y1={y} x2={238} y2={56} stroke="var(--pos)" strokeOpacity={0.5} strokeWidth={1.5} />
            <line x1={57} y1={y} x2={238} y2={152} stroke="var(--neg)" strokeOpacity={0.5} strokeWidth={1.5} />
          </g>
        );
      })}
      <text x={50} y={200} textAnchor="middle" className="art-s">7 inputs</text>
      <circle cx={262} cy={56} r={26} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
      <text x={262} y={61} textAnchor="middle" className="art-s">GAS</text>
      <circle cx={262} cy={152} r={26} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
      <text x={262} y={157} textAnchor="middle" className="art-s">STEER</text>
      <line x1={262} y1={86} x2={262} y2={122} stroke="var(--red)" strokeWidth={3} strokeDasharray="5 4" />
      <g stroke="var(--red)" strokeWidth={4} strokeLinecap="round"><line x1={252} y1={94} x2={272} y2={114} /><line x1={272} y1={94} x2={252} y2={114} /></g>
      <text x={300} y={100} className="art-m" fill="var(--red)">no talking</text>
      <text x={300} y={118} className="art-xs">gas can't know</text>
      <text x={300} y={132} className="art-xs">a sharp turn is coming</text>
    </svg>
  );
}

/** Race times from our own test runs (400 test drives each). */
export function RaceTimesArt() {
  const rows = [
    { name: '7 → 2', t: 92, col: 'var(--red)' },
    { name: '7 → 8 → 2', t: 82, col: 'var(--pos)' },
    { name: '7 → 16 → 16 → 2', t: 80, col: 'var(--pos)' },
  ];
  const X = (t: number) => (t / 100) * 250;
  return (
    <svg viewBox="0 0 420 210" className="art" role="img" aria-label="Best 10-lap race time in our tests: two perceptrons about 92 seconds, one hidden layer about 82, two hidden layers about 80">
      <text x={10} y={20} className="art-s">best 10-lap race time in our tests (shorter = faster)</text>
      {rows.map((r, i) => {
        const y = 52 + i * 46;
        return (
          <g key={r.name}>
            <text x={10} y={y + 5} className="art-m">{r.name}</text>
            <rect x={150} y={y - 12} width={X(r.t)} height={24} rx={5} fill={r.col} opacity={i === 0 ? 1 : 0.55} />
            <text x={156 + X(r.t)} y={y + 5} className="art-m">{r.t}s</text>
          </g>
        );
      })}
      <text x={10} y={196} className="art-xs">two perceptrons can finish, but about 10 seconds slower</text>
    </svg>
  );
}
