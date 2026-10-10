/** Colors used when drawing on canvases; they match the CSS tokens in styles.css. */
export const COL = {
  ink: '#1e2a24', paper: '#fffdf6', muted: '#55665c', rule: '#c3d4ba', mat: '#e3eddb',
  red: '#e2412a', ray: '#f4c21c', good: '#1d9a52', purple: '#8a5cf0',
  pos: [42, 102, 217] as [number, number, number],
  neg: [239, 125, 26] as [number, number, number],
};
export const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
export const FONT = {
  display: 'Bungee, "Arial Black", sans-serif',
  body: 'Nunito, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};
