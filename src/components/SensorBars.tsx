import type { Car } from '../sim/car';
import { SensorSpec, inputLabels, isSignedInput } from '../sim/sensors';

/** Live bars for each number the car feels. Signed inputs (direction, bends, lane…) grow from the middle. */
export function SensorBars({ car, spec }: { car: Car | null; spec: SensorSpec }) {
  const labels = inputLabels(spec), nr = spec.rays.length;
  return (
    <div className="sensors">
      {labels.map((name, i) => {
        const v = car && car.inp.length === labels.length ? car.inp[i] : 0;
        const signed = isSignedInput(spec, i);
        const feat = spec.features[i - nr];
        const color = i < nr ? 'var(--ray)' : feat === 'speed' ? 'var(--pos)' : feat === 'direction' ? 'var(--neg)' : 'var(--purple)';
        const style = signed
          ? { left: `${v >= 0 ? 50 : 50 - Math.min(1, Math.abs(v)) * 50}%`, width: `${Math.min(1, Math.abs(v)) * 50}%`, background: color }
          : { left: 0, width: `${Math.max(0, Math.min(1, v)) * 100}%`, background: color };
        return (
          <div className="srow" key={`${name}-${i}`}>
            <span>{name}</span>
            <div className={`bar${signed ? ' center' : ''}`}><i style={style} /></div>
            <span className="val">{signed && v >= 0 ? '+' : ''}{v.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}
