// Re-encodes the narration clips as 32 kbps mono, which is plenty for a voice and keeps the
// single-file build (everything inlined) well under the 16 MB limit. Clips already that small are skipped.
// Needs ffmpeg on the PATH; does nothing without it.
//
//   npm run audio:compress
import { execFileSync } from 'node:child_process';
import { readdirSync, renameSync, statSync } from 'node:fs';

const DIR = 'src/narration/audio';
const TARGET = 32000;

const has = cmd => { try { execFileSync(cmd, ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } };
if (!has('ffmpeg') || !has('ffprobe')) {
  console.log('ffmpeg not found, skipping audio compression');
  process.exit(0);
}

let done = 0, before = 0, after = 0;
for (const f of readdirSync(DIR).filter(f => f.endsWith('.mp3'))) {
  const path = `${DIR}/${f}`;
  const rate = +execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=bit_rate', '-of', 'csv=p=0', path]).toString().trim();
  if (rate && rate <= TARGET + 1000) continue;
  before += statSync(path).size;
  const tmp = `${path}.tmp.mp3`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path, '-ac', '1', '-ar', '22050', '-b:a', '32k', tmp]);
  renameSync(tmp, path);
  after += statSync(path).size;
  done++;
}
console.log(done ? `compressed ${done} clips: ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB` : 'all clips already compressed');
