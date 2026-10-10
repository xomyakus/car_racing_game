// Turns the single-file Vite build into a page body for a claude.ai Artifact:
// the Artifact host adds its own <!doctype>/<html>/<head>/<body>, so we keep only
// the title, font links, styles, the root element and the inlined module script.
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'dist-artifact/index.html';
const out = 'dist-artifact/brain-racers.html';
const html = readFileSync(src, 'utf8');

let head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? '';

// pull scripts out first so a "<style" string inside the bundle can't be mistaken for a tag
const scripts = head.match(/<script\b[\s\S]*?<\/script>/gi) ?? [];
for (const s of scripts) head = head.replace(s, '');
const title = head.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? '<title>Brain Racers</title>';
const links = head.match(/<link\b[^>]*>/gi) ?? [];
const styles = head.match(/<style\b[\s\S]*?<\/style>/gi) ?? [];

writeFileSync(out, [title, ...links, ...styles, body.trim(), ...scripts].join('\n'));
console.log(`wrote ${out} (${Math.round(readFileSync(out).length / 1024)} KB)`);
