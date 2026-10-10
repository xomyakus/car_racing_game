import type { Entry, Lab } from '../sim/lab';
import { WHY_TEXT } from '../sim/text';
import { progFrac, resultText, shortProg, pctText } from '../sim/score';
import { progressPct } from '../sim/car';

const originText = (e: Entry) =>
  e.label ?? (e.origin === 'child' ? `from #${e.parent}` : e.origin === 'random' ? 'random' : e.origin);

/** Generations of the "one at a time" mode, newest first. */
export function GenTable({ lab }: { lab: Lab }) {
  const gens = lab.gens.slice(-60).reverse();
  return (
    <div className="gens">
      <table>
        <thead><tr><th>Gen</th><th>Parent</th><th>Kids tried</th><th>Kids avg</th><th>New parent</th></tr></thead>
        <tbody>
          {gens.length ? gens.map(g => {
            const cur = g === lab.curGen;
            return (
              <tr key={g.n} className={cur ? 'cur' : ''}>
                <td>{g.n}</td>
                <td>#{g.parent.no}<small>{resultText(g.parent)}</small></td>
                <td>{g.tried}</td>
                <td>{g.tried ? pctText(g.sum / g.tried) : '—'}</td>
                <td>{g.next
                  ? <><span className={g.next.origin === 'child' ? 'ok' : 'rnd'}>#{g.next.no}</span><small>{g.next.origin === 'child' ? 'child' : originText(g.next)}, {resultText(g.next)}</small></>
                  : cur ? 'trying…' : '—'}</td>
              </tr>
            );
          }) : <tr><td colSpan={5}>No generations yet. Test a brain to start.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/** Every brain tested one at a time, newest first. Tap one to watch it again. */
export function TestedList({ lab }: { lab: Lab }) {
  const cur = lab.current, live = lab.car;
  return (
    <ol className="blist">
      {lab.list.map(e => {
        const isCur = e === cur;
        const pct = isCur && live?.alive ? progressPct(live) : e.pct;
        const laps = isCur && live?.alive ? live.laps.length : e.laps;
        const best = e === lab.best;
        const whyCls = e.raceTime != null ? 'ok' : e.why === 'wall' ? 'bad' : '';
        const why = isCur && live?.alive ? 'testing…' : e.why ? WHY_TEXT[e.why] : 'not finished';
        return (
          <li key={e.no}>
            <button className={`brow${isCur ? ' cur' : ''}${best ? ' best' : ''}`} onClick={() => lab.replay(e)} aria-label={`Test brain ${e.no} again`}>
              <span className="no">#{e.no}<small>{originText(e)}</small></span>
              <span className="mbar"><i style={{ width: `${(progFrac(pct, lab.totalLaps) * 100).toFixed(1)}%`, background: laps ? 'var(--good)' : undefined }} /></span>
              <span className="pct">{e.raceTime != null ? `${e.raceTime.toFixed(1)}s` : shortProg(pct, laps)}</span>
              <span className={`why ${whyCls}`}>{why}{best ? <span className="pill">best</span> : e.better ? <span className="pill up">better</span> : null}</span>
            </button>
          </li>
        );
      })}
      {!lab.list.length && <li className="small">No brains tested yet.</li>}
    </ol>
  );
}

/** Notable moments in "20 at once" mode. */
export function PopLog({ lab }: { lab: Lab }) {
  return (
    <ol className="log">
      {lab.popLog.length
        ? lab.popLog.map((e, i) => <li key={i} className={e.big ? 'big' : ''}><b>Gen {e.g}</b><span>{e.text}</span></li>)
        : <li><b>Gen 1</b><span>{lab.best ? '20 nudged copies of your best brain are on the start line.' : '20 random brains are waiting on the start line.'}</span></li>}
    </ol>
  );
}
