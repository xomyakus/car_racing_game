// Drawings for the level 4–6 cards.
import { Arrow, Bars, Box, Car, Node, Staircase, Svg } from "./kit";

// ---------- level 4 ----------

/** Numbers → simple ideas → big ideas → gas and steer. */
export function LayersArt() {
  return (
    <Svg label="Numbers go into the first hidden layer, which turns them into simple ideas; the second layer combines those into big ideas; gas and steer act on the big ideas">
      <text x={40} y={18} textAnchor="middle" className="art-xs">numbers</text>
      <text x={150} y={18} textAnchor="middle" className="art-xs">layer 1</text>
      <text x={285} y={18} textAnchor="middle" className="art-xs">layer 2</text>
      <text x={405} y={18} textAnchor="middle" className="art-xs">actions</text>
      {[48, 92, 136, 180].map((y, i) => <Box key={y} x={8} y={y} w={64} text={['left 0.2', 'ahead 0.4', 'right 0.9', 'speed 0.9'][i]} fill="rgba(244,194,28,.35)" />)}
      {[70, 118, 166].map(y => [48, 92, 136, 180].map(s => <line key={`${y}-${s}`} x1={72} y1={s} x2={92} y2={y} stroke="var(--rule)" strokeWidth={1.2} />))}
      <Box x={92} y={70} w={116} text={'"wall close, left"'} fill="#fff3c4" />
      <Box x={92} y={118} w={116} text={'"road opens right"'} fill="#fff3c4" />
      <Box x={92} y={166} w={116} text={'"going fast"'} fill="#fff3c4" />
      {[94, 150].map(y => [70, 118, 166].map(s => <line key={`${y}-${s}`} x1={208} y1={s} x2={226} y2={y} stroke="var(--rule)" strokeWidth={1.2} />))}
      <Box x={226} y={94} w={118} text={'"sharp right bend"'} fill="#ffe0c2" />
      <Box x={226} y={150} w={118} text={'"too fast for it!"'} fill="#ffe0c2" />
      <Arrow x1={346} y1={100} x2={372} y2={70} />
      <Arrow x1={346} y1={146} x2={372} y2={150} />
      <Node x={403} y={64} r={22} label="GAS" small />
      <Node x={403} y={152} r={22} label="STEER" small />
    </Svg>
  );
}

/** 128 + 272 + 34 = 434. */
export function WeightBlocksArt() {
  const parts = [
    { name: 'inputs → layer 1', n: 128, sum: '7 × 16 + 16', color: 'var(--pos)' },
    { name: 'layer 1 → layer 2', n: 272, sum: '16 × 16 + 16', color: 'var(--purple)' },
    { name: 'layer 2 → outputs', n: 34, sum: '16 × 2 + 2', color: 'var(--neg)' },
  ];
  let x = 10;
  return (
    <Svg label="434 weights: 128 between inputs and layer 1, 272 between the two hidden layers, 34 to the outputs">
      <text x={10} y={22} className="art-s">where the 434 weights are</text>
      {parts.map(p => {
        const w = (p.n / 434) * 420, x0 = x;
        x += w;
        return (
          <g key={p.name}>
            <rect x={x0} y={48} width={w - 3} height={54} rx={8} fill={p.color} opacity={0.75} />
            <text x={x0 + (w - 3) / 2} y={81} textAnchor="middle" className="art-m" fill="var(--paper)">{p.n}</text>
          </g>
        );
      })}
      {parts.map((p, i) => (
        <g key={p.sum}>
          <rect x={10} y={124 + i * 26} width={12} height={12} rx={3} fill={p.color} opacity={0.75} />
          <text x={30} y={134 + i * 26} className="art-s">{p.name}: {p.sum} = {p.n}</text>
        </g>
      ))}
    </Svg>
  );
}

/** Small brains climb fast and stop; big brains start slow and climb higher. */
export function CeilingArt() {
  return (
    <Svg label="Chart: the small brain improves quickly then flattens; the big brain starts slower but ends up higher">
      <line x1={40} y1={175} x2={420} y2={175} stroke="var(--ink)" strokeWidth={2} />
      <line x1={40} y1={175} x2={40} y2={20} stroke="var(--ink)" strokeWidth={2} />
      <text x={420} y={194} textAnchor="end" className="art-xs">test drives →</text>
      <text x={46} y={22} className="art-xs">how good</text>
      <path d="M 40 170 C 90 80, 140 70, 420 66" fill="none" stroke="var(--pos)" strokeWidth={3} />
      <path d="M 40 172 C 170 168, 220 60, 420 34" fill="none" stroke="var(--red)" strokeWidth={3} />
      <text x={150} y={62} className="art-s" fill="var(--pos)">level 3: 82 weights</text>
      <text x={250} y={118} className="art-s" fill="var(--red)">level 4: 434 weights</text>
      <text x={300} y={30} className="art-xs">higher ceiling</text>
      <text x={60} y={160} className="art-xs">slower start</text>
    </Svg>
  );
}

/** Most children are worse; now and then one is better and the line steps up. */
export function PatienceArt() {
  const kids = [0.2, 0.1, 0.32, 0.15, 0.3, 0.05, 0.45, 0.2, 0.38, 0.42, 0.1, 0.4, 0.62, 0.3, 0.5, 0.58, 0.2, 0.61, 0.55, 0.78, 0.4, 0.7, 0.6, 0.77];
  let best = 0;
  return (
    <Svg label="Dots for every child: most are worse than their parent, a few are better, and each better one steps the best-so-far line up">
      <text x={10} y={18} className="art-xs">every dot is one test drive</text>
      {kids.map((v, i) => {
        const up = v > best;
        if (up) best = v;
        return <circle key={i} cx={30 + i * 16} cy={180 - v * 150} r={up ? 6 : 4} fill={up ? 'var(--good)' : 'rgba(42,102,217,.45)'} />;
      })}
      <Staircase x={30} y={30} w={23 * 16} h={150} values={kids} />
      <text x={380} y={196} textAnchor="end" className="art-xs">green = a child that beat its parent</text>
    </Svg>
  );
}

/** In our tests, 82 and 434 weights ended up about as fast. */
export function BiggerArt() {
  return (
    <Svg label="In our tests the 82-weight brain and the 434-weight brain both got close to 80 seconds">
      <Bars title="best 10-lap race in our tests" max={100} rows={[
        { name: '82 weights', v: 82, color: 'var(--pos)', text: '≈ 80–85s' },
        { name: '434 weights', v: 80, color: 'var(--red)', text: '≈ 79–81s' },
      ]} top={70} gap={56} />
      <text x={10} y={196} className="art-xs">five times more weights, only a little faster</text>
    </Svg>
  );
}

// ---------- level 5 ----------

/** Every idea has to squeeze through 2 neurons. */
export function BottleneckArt() {
  const ins = [26, 50, 74, 98, 122, 146, 170];
  return (
    <Svg label="Seven inputs squeeze through just two hidden neurons before reaching gas and steer">
      {ins.map(y => [80, 130].map(t => <line key={`${y}-${t}`} x1={60} y1={y} x2={200} y2={t} stroke="var(--rule)" strokeWidth={1.5} />))}
      {ins.map(y => <circle key={y} cx={54} cy={y} r={7} fill="rgba(244,194,28,.4)" stroke="var(--ink)" strokeWidth={1.5} />)}
      <path d="M 120 20 L 196 70 L 196 140 L 120 190" fill="none" stroke="var(--red)" strokeWidth={2} strokeDasharray="6 4" />
      {[80, 130].map(y => [64, 146].map(t => <line key={`${y}-${t}`} x1={214} y1={y} x2={330} y2={t} stroke="var(--rule)" strokeWidth={1.5} />))}
      <Node x={206} y={80} r={12} />
      <Node x={206} y={130} r={12} />
      <Node x={350} y={64} r={20} label="GAS" small />
      <Node x={350} y={146} r={20} label="STEER" small />
      <text x={206} y={182} textAnchor="middle" className="art-s" fill="var(--red)">only 2 neurons</text>
      <text x={54} y={200} textAnchor="middle" className="art-xs">7 inputs</text>
    </Svg>
  );
}

/** Same shape, different random nudges, different results. */
export function LuckArt() {
  const runs = [
    { v: [0.05, 0.1, 0.1, 0.3, 0.32, 0.6, 0.62, 0.8, 0.85, 0.86], c: 'var(--pos)' },
    { v: [0.02, 0.05, 0.2, 0.22, 0.24, 0.4, 0.42, 0.5, 0.6, 0.62], c: 'var(--neg)' },
    { v: [0.1, 0.15, 0.18, 0.2, 0.5, 0.52, 0.7, 0.72, 0.73, 0.74], c: 'var(--purple)' },
  ];
  return (
    <Svg label="Three training runs of the same brain shape end up at different heights because evolution's nudges are random">
      <rect x={18} y={24} width={44} height={44} rx={9} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2.5} />
      {[[30, 36], [50, 56], [40, 46], [30, 56], [50, 36]].map(([cx, cy]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={3.5} fill="var(--ink)" />)}
      <text x={40} y={88} textAnchor="middle" className="art-xs">random</text>
      <text x={40} y={100} textAnchor="middle" className="art-xs">nudges</text>
      <line x1={100} y1={185} x2={425} y2={185} stroke="var(--ink)" strokeWidth={2} />
      <line x1={100} y1={185} x2={100} y2={20} stroke="var(--ink)" strokeWidth={2} />
      {runs.map((r, i) => <Staircase key={i} x={100} y={30} w={320} h={150} values={r.v} color={r.c} />)}
      <text x={420} y={202} textAnchor="end" className="art-xs">run 1, run 2, run 3 of the same shape</text>
    </Svg>
  );
}

// ---------- level 6 ----------

/** Dots ahead on the road: amber = bend soon, purple = bend later. */
export function BendArt() {
  const road = 'M 40 170 L 170 170 C 250 170, 290 150, 320 100 C 340 66, 360 40, 410 34';
  const dots = [[70, 170], [100, 170], [130, 170], [160, 170], [205, 168], [245, 160], [278, 140], [305, 116], [326, 88], [350, 58], [384, 38]];
  return (
    <Svg label="A car on the road with dots ahead: amber dots for the next 120 units, purple dots up to 300 units; the road bends left ahead">
      <path d={road} fill="none" stroke="#4c5359" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill={i < 4 ? '#f4a21c' : 'var(--purple)'} />)}
      <Car x={42} y={170} />
      <text x={100} y={204} textAnchor="middle" className="art-s" fill="#c98200">bend soon: straight, 0</text>
      <text x={300} y={30} textAnchor="end" className="art-s" fill="var(--purple)">bend later: left, −0.6</text>
    </Svg>
  );
}

/** The rays only reach so far; the corner beyond them is invisible until it's close. */
export function LookAheadArt() {
  return (
    <Svg label="A fast car on a straight: its rays end before the corner far ahead, so only bend-later can warn it">
      <path d="M 20 150 L 300 150 C 360 150, 380 120, 380 60 L 380 20" fill="none" stroke="#4c5359" strokeWidth={40} strokeLinejoin="round" />
      <Car x={60} y={150} rays={[{ a: 0, len: 120 }, { a: -28, len: 46, hit: true }, { a: 28, len: 46, hit: true }]} />
      <text x={190} y={120} textAnchor="middle" className="art-xs">rays stop here</text>
      <line x1={186} y1={130} x2={186} y2={170} stroke="var(--ray)" strokeWidth={2} strokeDasharray="4 3" />
      <text x={330} y={200} textAnchor="middle" className="art-s" fill="var(--purple)">corner: only "bend later" knows</text>
      <circle cx={360} cy={120} r={26} fill="none" stroke="var(--purple)" strokeWidth={3} strokeDasharray="5 4" />
    </Svg>
  );
}

/** Choosing inputs: two new cards join the 7 old ones. */
export function FeatureArt() {
  const chips = ['far left', 'left', 'ahead', 'right', 'far right', 'speed', 'direction'];
  return (
    <Svg label="The seven usual inputs plus two new ones, bend soon and bend later, all go into the brain">
      {chips.map((c, i) => <Box key={c} x={10 + (i % 4) * 88} y={34 + Math.floor(i / 4) * 36} w={80} text={c} fill="rgba(244,194,28,.3)" />)}
      <Box x={10} y={124} w={100} text="+ bend soon" fill="#ffe0c2" cls="art-s" />
      <Box x={118} y={124} w={100} text="+ bend later" fill="#ede3ff" cls="art-s" />
      <Arrow x1={240} y1={124} x2={300} y2={110} />
      <Node x={340} y={104} r={34} label="brain" />
      <text x={340} y={160} textAnchor="middle" className="art-xs">9 inputs, 466 weights</text>
      <text x={10} y={196} className="art-xs">feature engineering = choosing what the brain gets to know</text>
    </Svg>
  );
}

/** In our tests, with and without corner sense ended up about the same. */
export function MightNotWinArt() {
  return (
    <Svg label="In our tests, brains with and without corner sense both got about 79 to 81 seconds">
      <Bars title="best 10-lap race in our tests" max={100} rows={[
        { name: 'without', v: 80, color: 'var(--pos)', text: '≈ 79–81s' },
        { name: 'with corner sense', v: 79.5, color: 'var(--purple)', text: '≈ 79–80s' },
      ]} x0={170} width={200} top={70} gap={56} />
      <text x={10} y={196} className="art-xs">about the same, on this one track</text>
    </Svg>
  );
}

/** A long straight, then a surprise hairpin on a track the brain never saw. */
export function ShineArt() {
  return (
    <Svg label="On a new track, a car speeds down a long straight towards a sudden hairpin; knowing the bend ahead would help most here">
      <path d="M 20 160 L 330 160 C 410 160, 410 70, 330 70 L 240 70" fill="none" stroke="#4c5359" strokeWidth={36} strokeLinejoin="round" />
      <Car x={90} y={160} />
      {[0, 1, 2].map(i => <line key={i} x1={50 - i * 14} y1={154 + i * 6} x2={66 - i * 14} y2={154 + i * 6} stroke="var(--muted)" strokeWidth={2} />)}
      <text x={190} y={196} textAnchor="middle" className="art-s">fast, new track, long straight…</text>
      <text x={330} y={40} textAnchor="middle" className="art-m" fill="var(--red)">…surprise hairpin!</text>
    </Svg>
  );
}

/** A light bulb of ideas for new inputs. */
export function BulbArt() {
  const ideas = ['distance to the next corner?', 'how fast am I turning?', 'width of the road?'];
  return (
    <Svg label="A light bulb with ideas for new inputs: distance to the next corner, how fast the car is turning, the width of the road">
      <circle cx={70} cy={86} r={42} fill="#fff3c4" stroke="var(--ink)" strokeWidth={3} />
      <rect x={52} y={126} width={36} height={22} rx={4} fill="var(--mat)" stroke="var(--ink)" strokeWidth={2} />
      <path d="M 58 96 L 70 76 L 82 96" fill="none" stroke="var(--ink)" strokeWidth={2.5} />
      {ideas.map((t, i) => <Box key={t} x={150} y={54 + i * 48} w={250} text={t} fill="var(--paper)" cls="art-s" />)}
      {ideas.map((t, i) => <line key={t} x1={114} y1={86} x2={148} y2={54 + i * 48} stroke="var(--rule)" strokeWidth={2} />)}
    </Svg>
  );
}

