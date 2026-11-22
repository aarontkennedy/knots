// Development sheet (dev.html, not built): every knot with numbered points and its crossings.
import { KNOTS } from './knots';
import { knotSvg } from './draw';
import { crossings, debugSvg } from './rope';

// Development sheet: every knot laid out, with numbered points and its crossings.
const style = `<style>.knot-art{background:#2a6a54;border-radius:8px;display:block}.rope-edge{fill:none;stroke:#3b2410;stroke-linecap:butt;stroke-linejoin:round}.rope-core{fill:none;stroke:#e8b35a;stroke-linecap:round;stroke-linejoin:round}.rope-core.b{stroke:#6aa6d8}.rope-tip{fill:#c47a25}.prop{fill:#8a8f94}.prop-base{fill:#6b7075}</style>`;
const only = new URLSearchParams(location.search).get('k');
document.getElementById('app')!.innerHTML =
  style +
  KNOTS.filter((k) => !only || k.id === only)
    .map((k) => {
      const xs = crossings(k.ropes);
      const marks = xs.map((c) => `<circle cx="${c.x}" cy="${c.y}" r="1.2" fill="none" stroke="#fff" stroke-width=".4"/>`).join('');
      const list = xs.map((c) => `(${c.x.toFixed(0)},${c.y.toFixed(0)}) top r${c.top.rope}@${c.top.at.toFixed(1)} / r${c.bottom.rope}@${c.bottom.at.toFixed(1)}`).join('<br>');
      return `<section style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;font:11px monospace"><div><b style="font-size:16px">${k.name}</b><br>${list}</div>${knotSvg(k, 1, 0, debugSvg(k.ropes) + marks)}${knotSvg(k, 1, 1)}</section>`;
    })
    .join('');
