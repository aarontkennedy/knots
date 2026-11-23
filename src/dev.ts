// Development sheet (dev.html, not built): every knot with numbered points and its crossings,
// or with ?scene=<id>, a knot's "in use" scene at several moments (?scene=all: every scene).
import './style.css';
import { KNOTS } from './knots';
import { knotSvg } from './draw';
import { crossings, debugSvg } from './rope';
import { SCENES, sceneSvg } from './scenes';

const params = new URLSearchParams(location.search);
const only = params.get('k');
const scene = params.get('scene');
const app = document.getElementById('app')!;
if (scene === 'all') {
  // Every scene finished, for checking them together.
  app.innerHTML = `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;font:14px system-ui">${KNOTS.map(
    (k) => `<figure style="margin:0">${sceneSvg(k, SCENES[k.id], 1, 1, 1)}<figcaption>${k.name}</figcaption></figure>`,
  ).join('')}</div>`;
} else if (scene) {
  const k = KNOTS.find((x) => x.id === scene)!;
  const s = SCENES[scene];
  const frames: [number, number, number][] = [[0.35, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]];
  app.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font:16px system-ui"><b style="grid-column:1/-1">${k.name}: ${s.caption}</b>${frames
    .map(([p, t, sl]) => sceneSvg(k, s, p, t, sl))
    .join('')}</div>`;
} else {
  app.innerHTML = KNOTS.filter((k) => !only || k.id === only)
    .map((k) => {
      const xs = crossings(k.ropes);
      const marks = xs.map((c) => `<circle cx="${c.x}" cy="${c.y}" r="1.2" fill="none" stroke="#fff" stroke-width=".4"/>`).join('');
      const list = xs.map((c) => `(${c.x.toFixed(0)},${c.y.toFixed(0)}) top r${c.top.rope}@${c.top.at.toFixed(1)} / r${c.bottom.rope}@${c.bottom.at.toFixed(1)}`).join('<br>');
      return `<section style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;font:11px monospace"><div><b style="font-size:16px">${k.name}</b><br>${list}</div>${knotSvg(k, 1, 0, debugSvg(k.ropes) + marks)}${knotSvg(k, 1, 1)}</section>`;
    })
    .join('');
}
