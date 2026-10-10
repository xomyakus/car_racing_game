import { Brain } from './brain';
import { Car, newCar, stepAI } from './car';
import { carResult } from './exam';
import { SensorSpec } from './sensors';
import { TestResult } from './score';
import { Track } from './track';

export interface ExamJob { key: string; brain: Brain; spec: SensorSpec; track: Track; laps: number }

/**
 * Races a list of brains off screen, a little each frame so the page stays responsive.
 * Results are grouped by job key (several jobs can share a key, e.g. 3 runs with noisy sensors).
 */
export class ExamBatch {
  results = new Map<string, TestResult[]>();
  private i = 0;
  private car: Car | null = null;

  constructor(readonly jobs: ExamJob[]) {}

  get done() { return this.i >= this.jobs.length; }
  get progress() { return this.jobs.length ? this.i / this.jobs.length : 1; }

  /** Simulate for about `budgetMs` milliseconds. */
  step(budgetMs = 8) {
    const t0 = performance.now();
    while (!this.done && performance.now() - t0 < budgetMs) {
      const job = this.jobs[this.i];
      if (!this.car) this.car = newCar(job.brain, '#000', job.spec, job.track);
      for (let k = 0; k < 60 && this.car.alive; k++) stepAI(this.car, job.laps);
      if (!this.car.alive) {
        const list = this.results.get(job.key) ?? [];
        list.push(carResult(this.car, job.laps));
        this.results.set(job.key, list);
        this.car = null;
        this.i++;
      }
    }
  }
}
