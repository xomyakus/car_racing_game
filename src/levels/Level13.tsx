import { useMemo, useState } from 'react';
import type { Lab } from '../sim/lab';
import { REWARDS, RewardId, rewardScore } from '../sim/score';
import { CompareTable } from '../components/CompareTable';
import { SteerTrace } from '../components/SteerTrace';
import { useTick } from '../hooks';
import { AskedArt, DesignRewardArt, SnailArt } from './art/Level10to14Art';
import { Card, LevelHeader, Outro, TrainingSection } from './common';

const ORDER: RewardId[] = ['race', 'survive', 'avgSpeed', 'smooth'];
const EXPECT: Record<RewardId, string> = {
  race: 'The rule all the other levels used. Brains learn to get round, then to get round faster.',
  survive: 'Watch closely. Is driving well really the best way to stay on the track for a long time?',
  avgSpeed: 'A car that floors it and crashes after one second can have a great average speed. Will evolution get stuck on kamikaze drivers?',
  smooth: 'Same as the race result, but wobbly steering and hugging the walls lose points. Does the driving look calmer?',
};
const speed = (lab: Lab) => (lab.best ? `${Math.round(lab.best.dist / Math.max(lab.best.t, 0.5))}` : '—');

function Side({ lab }: { lab: Lab }) {
  useTick(4);
  const b = lab.best;
  return (
    <div className="panel">
      <h3>How the best brain drives</h3>
      <div className="tiles">
        <div className="tile"><span>Time on track</span><b>{b ? `${b.t.toFixed(1)}s` : '—'}</b></div>
        <div className="tile"><span>Average speed</span><b>{speed(lab)}</b></div>
        <div className="tile"><span>Wobble</span><b>{b ? Math.round(b.wobble * 100) : '—'}</b></div>
        <div className="tile"><span>Score</span><b>{b ? Math.round(rewardScore(lab.reward, b)) : '—'}</b></div>
      </div>
      <h3>Steering, last 3 seconds</h3>
      <SteerTrace car={() => lab.focus()} />
    </div>
  );
}

export function Level13() {
  const [reward, setReward] = useState<RewardId>('race');
  const key = `L13:${reward}`;
  const config = useMemo(() => ({ layers: [7, 16, 16, 2], reward }), [reward]);
  return (
    <>
      <LevelHeader n={13} title="Reward design">
        Evolution keeps whichever brain scores best. But who decides what "best" means? You do. Change the rule and see what the brains learn to do. Sometimes it's not what you wanted!
      </LevelHeader>
      <section className="section">
        <div className="lessons">
          <div className="panel lesson wide" data-tour="rules">
            <h2>Pick the rule</h2>
            <div className="rewardgrid">
              {ORDER.map(r => (
                <button key={r} className={`rewardcard${reward === r ? ' on' : ''}`} aria-pressed={reward === r} onClick={() => setReward(r)}>
                  <b>{REWARDS[r].name}</b>
                  <span>{REWARDS[r].rule}</span>
                  <small>{EXPECT[r]}</small>
                </button>
              ))}
            </div>
            <h3>Rules you tried</h3>
            <CompareTable prefix="L13:" current={key} describe={lab => REWARDS[lab.reward].name}
              onPick={(_, lab) => setReward(lab.reward)}
              extra={[
                { title: 'Time on track', value: lab => (lab.best ? `${lab.best.t.toFixed(1)}s` : '—') },
                { title: 'Avg speed', value: speed },
                { title: 'Wobble', value: lab => (lab.best ? Math.round(lab.best.wobble * 100) : '—') },
              ]} />
          </div>
        </div>
      </section>
      <TrainingSection key={key} n={13} labKey={key} config={config} sideTop={lab => <Side lab={lab} />}
        lead={<>Rule: <b>{REWARDS[reward].name}</b>. Every brain is scored by this rule only. The chart still shows how far the brains got, so you can see what the rule really rewards.</>} />
      <Outro n={13} title="Reward hacking">
        <Card title="Getting what you asked for" image={<AskedArt />} tour="outro-1">
          <p>Evolution doesn't know what you <i>meant</i>. It only knows the score. If a silly trick gets a higher score, evolution will find it. This is called <b>reward hacking</b>.</p>
        </Card>
        <Card title="The slow-poke trick" image={<SnailArt />} tour="outro-2">
          <p>With "longest time on track", the best plan is to crawl round as slowly as the rules allow. The car isn't broken: it's doing exactly what it was rewarded for.</p>
        </Card>
        <Card title="Designing good rewards" image={<DesignRewardArt />} tour="outro-3">
          <p>People who build AI spend a lot of time choosing rewards carefully, and checking what the AI actually does, not just its score.</p>
        </Card>
      </Outro>
    </>
  );
}
