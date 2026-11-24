// A knot's picture: its rope part-way laid, or part-way pulled tight, on whatever it's tied to.
import type { Knot, Prop } from './knots';
import { between, ropeSvg, tighten, progressAt } from './rope';

/** The post, rail or cleat, flat-shaded. */
export function propSvg(p: Prop): string {
  if (p.kind === 'ring') {
    // A metal ring: (x, y) its middle, w its radius, h the metal's thickness.
    const c = `cx="${p.x}" cy="${p.y}" r="${p.w}"`;
    return `<circle class="ring-edge" ${c} stroke-width="${p.h + 1.6}"/><circle class="ring" ${c} stroke-width="${p.h}"/>`;
  }
  if (p.kind === 'rope') {
    // Another rope, straight across: (x, y) its left end, w its length, h its thickness.
    const d = `M${p.x} ${p.y}H${p.x + p.w}`;
    return `<path class="rope-edge" d="${d}" stroke-width="${p.h + 1.6}"/><path class="rope-core a" d="${d}" stroke-width="${p.h}"/>`;
  }
  if (p.kind === 'hook') {
    // A fishing hook hanging from its eye: shank, bend, point and barb. Drawn as a dark
    // outline under a light metal line, so rope passing behind it shows.
    const { x, y, w, h } = p;
    const b = y + h;
    const d = `M${x} ${y + w}L${x} ${b}C${x} ${b + 10} ${x + 13} ${b + 10} ${x + 13} ${b - 2}L${x + 13} ${b - 9}L${x + 10} ${b - 5}`;
    const shape = `<circle cx="${x}" cy="${y}" r="${w}"/><path d="${d}"/>`;
    return `<g class="hook-edge">${shape}</g><g class="hook">${shape}</g>`;
  }
  if (p.kind !== 'cleat') return `<rect class="prop" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="2"/>`;
  // A cleat seen from above: a bar with rounded horns, bolted down in the middle.
  const r = p.h / 2;
  const base = p.w * 0.28;
  return (
    `<rect class="prop" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${r}"/>` +
    `<rect class="prop-base" x="${p.x + (p.w - base) / 2}" y="${p.y + 2}" width="${base}" height="${p.h - 4}" rx="2"/>`
  );
}

/** Where each step ends, as a share of the whole rope (0 to 1). */
export function stepEnds(knot: Knot): number[] {
  return knot.steps.map((s) => progressAt(knot.ropes, s.rope ?? 0, s.at));
}

/**
 * The knot's SVG: rope laid to `progress` (0 to 1), then pulled `tight` (0 to 1) once
 * fully laid.
 */
export function knotSvg(knot: Knot, progress: number, tight = 0, extra = ''): string {
  const ropes = tight > 0 ? between(knot.ropes, tighten(knot.ropes, knot.tight), tight) : knot.ropes;
  const body = ropeSvg(ropes, { progress: tight > 0 ? 1 : progress, width: knot.width ?? 4, prop: knot.prop ? propSvg(knot.prop) : '' });
  return `<svg class="knot-art" viewBox="0 0 100 100" aria-hidden="true">${body}${extra}</svg>`;
}
