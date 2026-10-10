// Drawings for the level 10–14 cards.
import { Arrow, Bars, Box, Car, Mark, MiniTrack, Node, Svg, Trace } from './kit';

const OVAL = 'M 20 60 C 20 20, 120 20, 120 60 C 120 100, 20 100, 20 60 Z';
const BEAN = 'M 20 50 C 20 10, 70 30, 90 20 C 130 10, 130 90, 90 90 C 60 90, 20 100, 20 50 Z';
const ZIG = 'M 15 80 L 40 30 L 65 70 L 90 25 L 120 80 C 120 100, 15 100, 15 80 Z';

// ---------- level 10 ----------

/** A memorised trick works on one track and crashes on another. */
export function OverfitArt() {
  return (
    <Svg label="A brain that memorised 'turn right after 2 seconds' drives its training track but crashes on a new track">
      <MiniTrack d={OVAL} x={20} y={30} s={1.3} />
      <Mark x={110} y={168} ok />
      <text x={100} y={196} textAnchor="middle" className="art-xs">training track</text>
      <Box x={130} y={24} w={180} text={'trick: "turn right after 2 s"'} fill="#fff3c4" />
      <MiniTrack d={ZIG} x={250} y={30} s={1.3} />
      <Mark x={340} y={168} ok={false} />
      <text x={340} y={196} textAnchor="middle" className="art-xs">new track</text>
    </Svg>
  );
}

/** Training on varied tracks → passes a new one. */
export function VarietyArt() {
  return (
    <Svg label="Training on three different tracks makes a brain that also drives a new track it has never seen">
      <MiniTrack d={OVAL} x={8} y={10} s={0.8} />
      <MiniTrack d={BEAN} x={8} y={80} s={0.8} />
      <MiniTrack d={ZIG} x={8} y={140} s={0.65} />
      <Arrow x1={130} y1={105} x2={180} y2={105} />
      <Node x={216} y={105} r={30} label="brain" />
      <Arrow x1={250} y1={105} x2={290} y2={105} />
      <MiniTrack d="M 20 70 L 60 20 L 110 50 L 120 95 C 80 110, 30 110, 20 70 Z" x={290} y={50} s={1} />
      <Mark x={410} y={60} ok />
      <text x={350} y={190} textAnchor="middle" className="art-xs">never seen, still drives</text>
    </Svg>
  );
}

/** Two experiments with question marks to fill in. */
export function TryTracksArt() {
  return (
    <Svg label="Experiment one: train on the home track and run the exam. Experiment two: train on four tracks and run it again. Compare how many unseen tracks each finishes">
      <Box x={10} y={60} w={180} text="train on 1 track" cls="art-s" />
      <Arrow x1={196} y1={60} x2={226} y2={60} />
      <Box x={232} y={60} w={180} text="exam: ? of 11 tracks" fill="#fff3c4" cls="art-s" />
      <Box x={10} y={130} w={180} text="train on 4 tracks" cls="art-s" />
      <Arrow x1={196} y1={130} x2={226} y2={130} />
      <Box x={232} y={130} w={180} text="exam: ? of 11 tracks" fill="#fff3c4" cls="art-s" />
      <text x={10} y={194} className="art-xs">which brain finishes more tracks it never trained on?</text>
    </Svg>
  );
}

// ---------- level 11 ----------

/** A clean reading vs the same reading with noise. */
export function NoiseArt() {
  const clean = Array.from({ length: 40 }, (_, i) => 0.5 * Math.sin(i / 6));
  const noisy = clean.map((v, i) => v + 0.35 * Math.sin(i * 7.3) * Math.cos(i * 3.1));
  return (
    <Svg label="The ahead ray as a smooth line with perfect sensors, and as a jumpy line with noisy sensors">
      <Trace x={10} y={20} w={420} h={70} values={clean} label="perfect sensor" />
      <Trace x={10} y={115} w={420} h={70} values={noisy} color="var(--neg)" label="noisy sensor" />
    </Svg>
  );
}

/** Practising with noise → steady driving anyway. */
export function TougherArt() {
  const noisy = Array.from({ length: 30 }, (_, i) => 0.6 * Math.sin(i * 5.7) * Math.cos(i * 2.3));
  const steady = Array.from({ length: 30 }, (_, i) => 0.3 * Math.sin(i / 5));
  return (
    <Svg label="Noisy inputs go into a brain that practised with noise; its steering stays steady">
      <Trace x={10} y={60} w={130} h={70} values={noisy} color="var(--neg)" label="wobbly inputs" />
      <Arrow x1={148} y1={95} x2={178} y2={95} />
      <path d="M 220 50 L 260 64 L 260 106 C 260 130, 240 142, 220 150 C 200 142, 180 130, 180 106 L 180 64 Z" fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
      <text x={220} y={104} textAnchor="middle" className="art-s">brain</text>
      <Arrow x1={266} y1={95} x2={296} y2={95} />
      <Trace x={300} y={60} w={130} h={70} values={steady} label="steady steering" />
      <text x={220} y={176} textAnchor="middle" className="art-xs">practised with noise</text>
    </Svg>
  );
}

/** Train in a simulator with noise, then drive the real road. */
export function RobotsArt() {
  return (
    <Svg label="A car trains in a simulator with added noise, then drives on a real road">
      <rect x={10} y={30} width={180} height={130} rx={10} fill="#1e2a24" />
      <MiniTrack d={BEAN} x={36} y={50} s={1} />
      {[[40, 40], [160, 60], [70, 140], [170, 130], [120, 44]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={2.5} fill="var(--ray)" />)}
      <text x={100} y={182} textAnchor="middle" className="art-s">simulator + noise</text>
      <Arrow x1={200} y1={95} x2={240} y2={95} />
      <rect x={250} y={30} width={180} height={130} rx={10} fill="#bfe3f2" />
      <rect x={250} y={110} width={180} height={50} fill="#86bf62" />
      <path d="M 300 160 L 330 110 L 350 110 L 380 160 Z" fill="#4c5359" />
      <Car x={340} y={140} angle={-90} />
      <text x={340} y={182} textAnchor="middle" className="art-s">real road</text>
    </Svg>
  );
}

// ---------- level 12 ----------

/** Gas and steer loop back in as inputs. */
export function LoopArt() {
  return (
    <Svg label="The brain's gas and steer come out on the right and loop back to the left as two extra inputs for the next moment">
      {[40, 64, 88, 112, 136].map(y => <circle key={y} cx={40} cy={y} r={7} fill="rgba(244,194,28,.4)" stroke="var(--ink)" strokeWidth={1.5} />)}
      <text x={40} y={20} textAnchor="middle" className="art-xs">7 inputs</text>
      <circle cx={40} cy={160} r={7} fill="#ffe0c2" stroke="var(--ink)" strokeWidth={1.5} />
      <circle cx={40} cy={184} r={7} fill="#ffe0c2" stroke="var(--ink)" strokeWidth={1.5} />
      <text x={56} y={164} className="art-xs">last gas</text>
      <text x={56} y={188} className="art-xs">last steer</text>
      <Arrow x1={120} y1={100} x2={170} y2={100} />
      <Node x={215} y={100} r={36} label="brain" />
      <Arrow x1={255} y1={100} x2={300} y2={100} />
      <Node x={330} y={74} r={20} label="GAS" small />
      <Node x={330} y={126} r={20} label="STEER" small />
      <path d="M 352 126 C 420 126, 420 200, 300 200 L 52 200 L 52 188" fill="none" stroke="var(--red)" strokeWidth={2.5} strokeDasharray="6 4" />
      <path d="M 352 74 C 432 74, 432 206, 300 206 L 48 206 L 48 168" fill="none" stroke="var(--red)" strokeWidth={2.5} strokeDasharray="6 4" />
      <text x={368} y={160} className="art-xs" fill="var(--red)">next moment</text>
    </Svg>
  );
}

/** Zig-zag steering vs calm steering. */
export function ZigzagArt({ labels = ['no memory: zig-zag', 'with memory: steady turn'] }: { labels?: [string, string] }) {
  const zig = Array.from({ length: 30 }, (_, i) => (i % 2 ? 0.9 : -0.8) * (i % 5 === 0 ? 0.4 : 1));
  const calm = Array.from({ length: 30 }, (_, i) => 0.6 * Math.sin(i / 7));
  return (
    <Svg label={`Two steering traces: ${labels[0]} and ${labels[1]}`}>
      <Trace x={10} y={20} w={420} h={66} values={zig} color="var(--neg)" label={labels[0]} />
      <Trace x={10} y={115} w={420} h={66} values={calm} label={labels[1]} />
    </Svg>
  );
}

/** The same brain, step after step: each step passes its last move to the next. */
export function UnrollArt() {
  return (
    <Svg label="The same brain at three moments in a row; each moment passes its last move on to the next one">
      {[0, 1, 2].map(i => {
        const x = 70 + i * 145;
        return (
          <g key={i}>
            <Node x={x} y={100} r={32} label="brain" />
            <text x={x} y={160} textAnchor="middle" className="art-s">moment {i + 1}</text>
            <Arrow x1={x} y1={34} x2={x} y2={64} />
            <text x={x} y={26} textAnchor="middle" className="art-xs">rays, speed…</text>
            {i < 2 && <Arrow x1={x + 36} y1={100} x2={x + 108} y2={100} />}
            {i < 2 && <text x={x + 72} y={90} textAnchor="middle" className="art-xs" fill="var(--red)">last move</text>}
          </g>
        );
      })}
      <text x={220} y={196} textAnchor="middle" className="art-xs">a network that feeds itself is called recurrent</text>
    </Svg>
  );
}

/** Two drivers, same time, very different steering: the race score can't tell them apart. */
export function SameScoreArt() {
  const zig = Array.from({ length: 24 }, (_, i) => (i % 2 ? 0.8 : -0.8));
  const calm = Array.from({ length: 24 }, (_, i) => 0.6 * Math.sin(i / 6));
  return (
    <Svg label="A wobbly driver and a smooth driver finish in the same time, so the race score gives them the same points">
      <Trace x={10} y={30} w={220} h={56} values={zig} color="var(--neg)" />
      <Box x={250} y={58} w={170} text="80.1s → same score" fill="#fff3c4" cls="art-s" />
      <Trace x={10} y={120} w={220} h={56} values={calm} />
      <Box x={250} y={148} w={170} text="80.1s → same score" fill="#fff3c4" cls="art-s" />
      <text x={10} y={204} className="art-xs">the race result doesn't care how smooth you steer</text>
    </Svg>
  );
}

// ---------- level 13 ----------

/** What you asked for vs what you meant. */
export function AskedArt() {
  return (
    <Svg label="You meant 'drive well', but you asked for 'stay on track as long as possible', and evolution finds a crawling car">
      <Box x={10} y={44} w={190} text="you meant: drive well" fill="#e3f4ea" cls="art-s" />
      <Box x={10} y={100} w={190} text="you asked: time on track" fill="#fff3c4" cls="art-s" />
      <Arrow x1={206} y1={100} x2={246} y2={100} />
      <text x={330} y={70} textAnchor="middle" className="art-s">evolution finds…</text>
      <Car x={330} y={110} />
      <text x={330} y={150} textAnchor="middle" className="art-m" fill="var(--red)">a crawling car</text>
      <text x={220} y={196} textAnchor="middle" className="art-xs">it only knows the score, not what you meant</text>
    </Svg>
  );
}

/** A snail-pace car with a very long timer. */
export function SnailArt() {
  return (
    <Svg label="A car creeping around the track as slowly as the rules allow, with a timer showing a very long time on track">
      <MiniTrack d="M 30 150 L 300 150 C 380 150, 380 50, 300 50 L 140 50 C 60 50, 30 90, 30 150 Z" />
      <Car x={170} y={150} />
      <text x={150} y={176} className="art-xs">so slow…</text>
      <rect x={250} y={86} width={140} height={44} rx={10} fill="#1e2a24" />
      <text x={320} y={115} textAnchor="middle" className="art-m" fill="var(--ray)">⏱ 299.0s</text>
      <text x={220} y={204} textAnchor="middle" className="art-xs">longest time on track = crawl as slowly as allowed</text>
    </Svg>
  );
}

/** Check the score AND watch the driving. */
export function DesignRewardArt() {
  return (
    <Svg label="Good reward design: check the score and also watch what the AI actually does">
      <Box x={10} y={60} w={180} text="1. pick a rule" cls="art-s" />
      <Box x={10} y={110} w={180} text="2. look at the score" cls="art-s" />
      <Box x={10} y={160} w={180} text="3. WATCH the driving" fill="#fff3c4" cls="art-s" />
      <g transform="translate(320,110)">
        <path d="M -70 0 C -40 -40, 40 -40, 70 0 C 40 40, -40 40, -70 0 Z" fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
        <circle r={22} fill="var(--pos)" />
        <circle r={9} fill="var(--ink)" />
      </g>
    </Svg>
  );
}

// ---------- level 14 ----------

/** Try → score → keep best → nudge, round and round. */
export function CycleArt() {
  const steps = ['try a brain', 'give it a score', 'keep the best', 'nudge a copy'];
  const pos = [[220, 34], [380, 105], [220, 176], [60, 105]];
  return (
    <Svg label="The evolution loop: try a brain, give it a score, keep the best, nudge a copy, and repeat">
      <circle cx={220} cy={105} r={70} fill="none" stroke="var(--rule)" strokeWidth={3} strokeDasharray="8 6" />
      {steps.map((s, i) => <Box key={s} x={pos[i][0] - 62} y={pos[i][1]} w={124} text={s} fill={i === 1 ? '#fff3c4' : 'var(--paper)'} cls="art-s" />)}
      <text x={220} y={110} textAnchor="middle" className="art-s">repeat</text>
    </Svg>
  );
}

/** Examples of "felt this → you pressed that" teach the weights directly. */
export function CopyArt() {
  return (
    <Svg label="Recorded examples, each the 7 numbers the car felt plus the keys you pressed, train the brain's weights with backpropagation">
      {[40, 84, 128].map((y, i) => (
        <g key={y}>
          <Box x={10} y={y} w={120} text="7 numbers" fill="rgba(244,194,28,.3)" />
          <Arrow x1={134} y1={y} x2={152} y2={y} />
          <Box x={156} y={y} w={84} text={['↑ gas', '↑ + →', '↓ brake'][i]} fill="#ffe0c2" cls="art-s" />
        </g>
      ))}
      <text x={125} y={172} textAnchor="middle" className="art-xs">your recorded examples</text>
      <Arrow x1={250} y1={84} x2={290} y2={84} />
      <Node x={340} y={84} r={38} label="brain" />
      <path d="M 340 136 C 340 170, 250 170, 250 128" fill="none" stroke="var(--red)" strokeWidth={2.5} strokeDasharray="6 4" />
      <text x={340} y={196} textAnchor="middle" className="art-xs" fill="var(--red)">backpropagation fixes every weight a bit</text>
    </Svg>
  );
}

/** The copycat drifts where you never drove and has no examples. */
export function DriftArt() {
  return (
    <Svg label="Your path stays in the middle of the road; the copycat drifts towards the wall, into a place with no examples, and crashes">
      <path d="M 20 110 L 420 110" stroke="#4c5359" strokeWidth={90} />
      <rect x={250} y={65} width={170} height={22} fill="var(--red)" opacity={0.25} />
      <text x={335} y={60} textAnchor="middle" className="art-xs" fill="var(--red)">no examples here</text>
      <path d="M 20 110 L 420 110" stroke="var(--good)" strokeWidth={4} strokeDasharray="8 5" />
      <path d="M 20 110 C 150 110, 220 104, 290 76" fill="none" stroke="var(--pos)" strokeWidth={4} />
      <Car x={290} y={78} angle={-20} color="var(--good)" />
      <text x={100} y={180} className="art-xs" fill="var(--good)">your path</text>
      <text x={200} y={180} className="art-xs" fill="var(--pos)">copycat drifts…</text>
    </Svg>
  );
}

/** A copy can only match its teacher; evolution can go further. */
export function BeatYouArt() {
  return (
    <Svg label="The copycat drives about as fast as you; evolution, which chases a score, can get faster than you">
      <Bars title="best lap (shorter = faster, made-up example)" max={10} rows={[
        { name: 'you', v: 8.2, color: 'var(--red)', text: '8.2s' },
        { name: 'copycat', v: 8.4, color: 'var(--good)', text: '≈ like you' },
        { name: 'evolution', v: 7.4, color: 'var(--pos)', text: 'can beat you' },
      ]} x0={110} width={220} />
    </Svg>
  );
}
