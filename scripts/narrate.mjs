// Records every step of src/narration/script.ts with ElevenLabs into src/narration/audio/<clip>.mp3.
// Only new or changed lines cost credits: a hash of each clip's text and voice settings is kept in
// audio/manifest.json, and clips that are no longer in the script are deleted.
//
//   npm run narrate                  record what's missing or changed
//   npm run narrate -- --only L2     only clips whose id starts with "L2"
//   npm run narrate -- --force       record everything again
//   npm run narrate -- --dry         list what would be recorded
//
// Needs ELEVENLABS_API_KEY in .env (or the environment). ELEVENLABS_VOICE_ID picks another voice.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { NARRATIONS, clipId } from '../src/narration/script.ts';

const DIR = 'src/narration/audio';
const MANIFEST = `${DIR}/manifest.json`;

const readEnv = path => existsSync(path)
  ? Object.fromEntries(readFileSync(path, 'utf8').split('\n')
    .map(l => /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l)).filter(Boolean)
    .map(m => [m[1], m[2].replace(/^(['"])(.*)\1$/, '$2')]))
  : {};
const env = { ...readEnv('.env'), ...process.env };

const VOICE = env.ELEVENLABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9'; // "Jessica": bright, warm, playful
const MODEL = env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const FORMAT = 'mp3_44100_64'; // plenty for speech, and keeps the single-file build small
const SETTINGS = { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: 0.95 };

const args = process.argv.slice(2);
const force = args.includes('--force'), dry = args.includes('--dry');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] ?? '' : '';

// neighbouring lines are sent along so each clip flows on from the one before it
const clips = Object.values(NARRATIONS).flatMap(n => n.steps.map((s, i) => ({
  id: clipId(n.id, i), text: s.say, prev: n.steps[i - 1]?.say, next: n.steps[i + 1]?.say,
})));
const hashOf = c => createHash('sha256').update(JSON.stringify([VOICE, MODEL, FORMAT, SETTINGS, c.text])).digest('hex').slice(0, 16);
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const saveManifest = () => writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + '\n');

const ids = new Set(clips.map(c => c.id));
const stale = (existsSync(DIR) ? readdirSync(DIR) : []).filter(f => f.endsWith('.mp3') && !ids.has(f.slice(0, -4)));
const todo = clips.filter(c => c.id.startsWith(only) && (force || manifest[c.id] !== hashOf(c) || !existsSync(`${DIR}/${c.id}.mp3`)));
const chars = todo.reduce((s, c) => s + c.text.length, 0);

console.log(`${clips.length} clips in the script, ${todo.length} to record (${chars} characters), ${stale.length} stale`);
if (dry) {
  for (const c of todo) console.log(`  record  ${c.id}`);
  for (const f of stale) console.log(`  delete  ${f}`);
  process.exit(0);
}

mkdirSync(DIR, { recursive: true });
for (const f of stale) { rmSync(`${DIR}/${f}`); delete manifest[f.slice(0, -4)]; }

const key = env.ELEVENLABS_API_KEY;
if (todo.length && !key) {
  console.error('ELEVENLABS_API_KEY is not set (put it in .env)');
  process.exit(1);
}

for (const c of todo) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=${FORMAT}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: c.text, model_id: MODEL, voice_settings: SETTINGS, previous_text: c.prev, next_text: c.next }),
  });
  if (!res.ok) {
    console.error(`${c.id}: ElevenLabs answered ${res.status} ${await res.text()}`);
    process.exitCode = 1;
    break;
  }
  const mp3 = Buffer.from(await res.arrayBuffer());
  writeFileSync(`${DIR}/${c.id}.mp3`, mp3);
  manifest[c.id] = hashOf(c);
  saveManifest(); // after every clip, so an interrupted run keeps what it already paid for
  console.log(`  ${c.id}  ${Math.round(mp3.length / 1024)} KB`);
}
saveManifest();
