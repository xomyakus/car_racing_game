// Drawings for the level 7–9 cards.
import { Arrow, Bars, Box, Car, Mark, Node, Svg } from './kit';

// ---------- level 7 ----------

/** Long narrow rays vs short wide rays. */
export function FarWideArt() {
  return (
    <Svg label="Left: a car with long rays close together sees far ahead. Right: a car with short rays spread wide sees the walls beside it">
      <Car x={30} y={100} rays={[-10, -5, 0, 5, 10].map(a => ({ a, len: 160 }))} />
      <text x={110} y={160} textAnchor="middle" className="art-s">seeing far</text>
      <text x={110} y={176} textAnchor="middle" className="art-xs">corners show up early</text>
      <line x1={220} y1={20} x2={220} y2={190} stroke="var(--rule)" strokeWidth={2} strokeDasharray="5 5" />
      <Car x={330} y={100} rays={[-100, -50, 0, 50, 100].map(a => ({ a, len: 60, hit: Math.abs(a) > 60 }))} />
      <text x={330} y={176} textAnchor="middle" className="art-s">seeing wide</text>
      <text x={330} y={192} textAnchor="middle" className="art-xs">walls beside the car</text>
    </Svg>
  );
}

/** Each extra ray adds 16 weights to the first layer. */
export function EyesWeightsArt() {
  return (
    <Svg label="With two hidden layers of 16: 1 ray gives 370 weights, 5 rays 434, 9 rays 498">
      <Bars title="weights in the brain (two hidden layers of 16)" max={520} rows={[
        { name: '1 ray', v: 370, color: 'var(--pos)' },
        { name: '5 rays', v: 434, color: 'var(--pos)' },
        { name: '9 rays', v: 498, color: 'var(--pos)' },
      ]} x0={90} width={280} />
      <text x={10} y={196} className="art-xs">every ray is one more input, with 16 more weights</text>
    </Svg>
  );
}

/** One ray straight ahead: a wall is coming, but which way to turn? */
export function OneEyeArt() {
  return (
    <Svg label="A car with one ray straight ahead sees the wall coming at a corner but cannot tell whether to turn left or right">
      <path d="M 30 150 L 260 150 L 260 40" fill="none" stroke="#4c5359" strokeWidth={50} strokeLinejoin="miter" />
      <line x1={310} y1={10} x2={310} y2={200} stroke="var(--red)" strokeWidth={6} />
      <Car x={120} y={150} rays={[{ a: 0, len: 168, hit: true }]} />
      <text x={330} y={110} className="art-big2" fill="var(--red)">?</text>
      <text x={160} y={200} textAnchor="middle" className="art-s">wall ahead… left or right?</text>
    </Svg>
  );
}

// ---------- level 8 ----------

/** Change one thing at a time. */
export function FairTestArt() {
  const row = (y: number, a: string, b: string, ok: boolean, note: string) => (
    <g>
      <Box x={10} y={y} w={110} text={a} fill="var(--paper)" />
      <Arrow x1={126} y1={y} x2={150} y2={y} />
      <Box x={156} y={y} w={150} text={b} fill={ok ? '#e3f4ea' : '#fde3dd'} />
      <Mark x={330} y={y} ok={ok} />
      <text x={350} y={y + 4} className="art-xs">{note}</text>
    </g>
  );
  return (
    <Svg label="A fair test changes one thing: turning off speed only. Turning off speed and direction together hides which one mattered">
      <text x={10} y={22} className="art-s">all 7 senses → …</text>
      {row(64, 'all 7 senses', 'without speed', true, 'clear answer')}
      {row(124, 'all 7 senses', 'without speed AND direction', false, 'which one?')}
      <text x={10} y={186} className="art-xs">change one thing, compare, then change the next</text>
    </Svg>
  );
}

/** Speed can be guessed from how fast the rays change. */
export function HiddenSenseArt() {
  return (
    <Svg label="Without a speed input, the brain can still notice speed: when the car is fast, the ahead ray shrinks quickly between moments">
      <text x={110} y={20} textAnchor="middle" className="art-s">now</text>
      <text x={330} y={20} textAnchor="middle" className="art-s">a moment later</text>
      <line x1={200} y1={30} x2={200} y2={150} stroke="var(--ink)" strokeWidth={6} />
      <Car x={30} y={90} rays={[{ a: 0, len: 160, hit: true }]} />
      <line x1={420} y1={30} x2={420} y2={150} stroke="var(--ink)" strokeWidth={6} />
      <Car x={330} y={90} rays={[{ a: 0, len: 80, hit: true }]} />
      <text x={110} y={120} textAnchor="middle" className="art-xs">ahead = 0.70</text>
      <text x={370} y={120} textAnchor="middle" className="art-xs">ahead = 0.35</text>
      <text x={220} y={190} textAnchor="middle" className="art-s">shrinking fast = going fast</text>
    </Svg>
  );
}

/** Sensors cost money: drop the ones you don't need. */
export function CostArt() {
  const items = [{ n: 'front sensor', p: '$40', keep: true }, { n: 'side sensors', p: '$80', keep: true }, { n: 'speed sensor', p: '$30', keep: false }];
  return (
    <Svg label="A price list of sensors; one that didn't help is crossed out, so the car can be built cheaper">
      {items.map((it, i) => {
        const y = 44 + i * 46;
        return (
          <g key={it.n} opacity={it.keep ? 1 : 0.6}>
            <Box x={10} y={y} w={190} text={it.n} cls="art-s" />
            <Box x={210} y={y} w={70} text={it.p} fill="#fff3c4" cls="art-s" />
            {!it.keep && <line x1={10} y1={y} x2={280} y2={y} stroke="var(--red)" strokeWidth={4} />}
            <Mark x={310} y={y} ok={it.keep} />
          </g>
        );
      })}
      <text x={10} y={196} className="art-s">if a sensor doesn't help, don't build it</text>
    </Svg>
  );
}

// ---------- level 9 ----------

/** Time to crash = distance ahead ÷ speed. */
export function TimeMathArt() {
  return (
    <Svg label="Time to crash is the distance to the wall ahead divided by the speed: 150 divided by 300 is half a second">
      <line x1={410} y1={30} x2={410} y2={110} stroke="var(--ink)" strokeWidth={6} />
      <Car x={40} y={70} rays={[{ a: 0, len: 360, hit: true }]} />
      <text x={220} y={58} textAnchor="middle" className="art-s">150 to the wall</text>
      <text x={40} y={104} textAnchor="middle" className="art-s">speed 300</text>
      <rect x={60} y={132} width={320} height={54} rx={12} fill="#fff3c4" stroke="var(--ink)" strokeWidth={2} />
      <text x={220} y={166} textAnchor="middle" className="art-m">150 ÷ 300 = 0.5 seconds to crash</text>
    </Svg>
  );
}

/** Raw numbers → an engineer's formula → a ready-made clue → brain. */
export function EngineerArt() {
  return (
    <Svg label="Raw numbers go through a formula made by a person and come out as a ready-made clue for the brain">
      <Box x={10} y={70} w={90} text="ahead 0.65" fill="rgba(244,194,28,.35)" />
      <Box x={10} y={120} w={90} text="speed 0.88" fill="rgba(42,102,217,.2)" />
      <Arrow x1={104} y1={95} x2={134} y2={95} />
      <g transform="translate(176,95)">
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={-5} y={-36} width={10} height={14} rx={2} fill="var(--muted)" transform={`rotate(${i * 45})`} />)}
        <circle r={26} fill="var(--muted)" stroke="var(--ink)" strokeWidth={2} />
        <circle r={10} fill="var(--paper)" />
      </g>
      <text x={176} y={156} textAnchor="middle" className="art-xs">a person's formula</text>
      <Arrow x1={218} y1={95} x2={248} y2={95} />
      <Box x={254} y={95} w={98} text="time to crash" fill="#ffe0c2" cls="art-s" />
      <Arrow x1={356} y1={95} x2={378} y2={95} />
      <Node x={404} y={95} r={22} label="brain" small />
    </Svg>
  );
}

/** Your result vs level 4: to be found out. */
export function CompareClueArt() {
  return (
    <Svg label="Compare: level 4's brain with the basic 7 inputs against your brain with extra clues; your result is still a question mark">
      <Bars title="best 10-lap race (shorter = faster)" max={100} rows={[
        { name: 'level 4 · basic 7', v: 80, color: 'var(--pos)', text: '≈ 80s in our tests' },
        { name: 'level 9 · + clues', v: 50, color: 'var(--rule)', text: '? your turn' },
      ]} x0={150} width={190} top={70} gap={56} />
      <text x={10} y={196} className="art-xs">also compare how many test drives each needed</text>
    </Svg>
  );
}
