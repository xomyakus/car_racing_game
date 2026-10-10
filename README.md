# Brain Racers

A kids' game about neural networks. Drive a race car yourself, then build brains that learn to drive by evolution, level by level.

| Level | What you learn | Network |
|---|---|---|
| 1. You drive | The 7 numbers a car can feel | your brain |
| 2. Two perceptrons | Weights, bias, the "squeeze"; tune a brain by hand | 7 → 2 |
| 3. One hidden layer | Hidden neurons make "this **and** that" possible | 7 → 8 → 2 |
| 4. Two hidden layers | Ideas built on ideas; 434 weights | 7 → 16 → 16 → 2 |
| 5. Build your own | Pick layers and neurons, compare shapes | you decide |
| 6. Corner sense | Feature engineering: give the car new inputs | 9 → 16 → 16 → 2 |
| 7. Ray designer | How many sensor rays, at what angles, how long | rays + 2 → 16 → 16 → 2 |
| 8. Turn off a sense | Ablation: which inputs really matter | fewer inputs |
| 9. Smarter inputs | Derived features: time to crash, brake distance, lane | 7 + clues |
| 10. New tracks | Overfitting vs generalising, on famous F1 circuits | train on 1–4 tracks, exam on all |
| 11. Noisy sensors | Robustness: training with noise | 7 → 16 → 16 → 2 |
| 12. Memory | Feeding the last outputs back in (recurrence) | 9 → 16 → 16 → 2 |
| 13. Reward design | What "best" means, and reward hacking | 7 → 16 → 16 → 2 |
| 14. Learn from you | Supervised learning with backpropagation | 7 → 16 → 2 (copycat) |

Tracks: a home track plus simplified shapes inspired by Monza, Monaco, Silverstone, Spa-Francorchamps, Suzuka (with its bridge), Interlagos, Montréal, Red Bull Ring, Hungaroring and Zandvoort. Each sketch in `src/sim/track.ts` is scaled to roughly the real lap length, then smoothed and grown until no corner is too tight and the road never overlaps (checked in `track.test.ts`).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # simulation unit tests
npm run build      # static site in dist/ (works from any folder, e.g. GitHub Pages)
npm run build:artifact   # one self-contained HTML file in dist-artifact/
npm run narrate    # record new or changed narration lines with ElevenLabs (needs ELEVENLABS_API_KEY in .env)
```

## How it's organized

- `src/sim/` is the simulation, with no React or three.js: track, car physics and sensors, the neural network, race scoring, and the evolution `Lab` (one brain at a time, or 20 at once).
- `src/render/Track3D.ts` draws the 3D track with three.js from a `SceneState`.
- `src/components/` holds the shared UI: track stage, network diagram, lab panels, charts.
- `src/levels/` has one file per level; `src/levels.ts` lists them for the home screen.
- `src/narration/` is the coach: `script.ts` holds what it says (an intro per level, and a wrap-up that plays before "Next level"), each line spotlighting an element marked `data-tour="..."`. `audio/` holds one mp3 per line, recorded by `scripts/narrate.mjs`.

Every test drive is a 10-lap race. Brains are ranked by distance until they finish all 10 laps, then by total race time.
