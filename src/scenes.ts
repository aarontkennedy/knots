// "In use": each knot shown zoomed out, where it's actually used: a bundle of firewood, a
// boat at the dock, a tent's guy line, a hook on a fishing line. The knot's own drawing is
// scaled down (and turned if need be) into the scene, and rope leads from it to whatever it
// holds. Scenes are flat drawings in a 100 by 100 space, like the knots.
import type { Knot } from './knots';
import { propSvg } from './draw';
import { between, ropeSvg, tighten, type Point, type Rope } from './rope';

/** One end of a knot's rope, where rope from the scene joins it. */
interface Attach {
  rope?: number;
  /** Which end of that rope: its first point (default) or its last. */
  end?: 'start' | 'end';
  /** For doubled rope, which strand (1 or -1) the scene's rope joins. */
  strand?: 1 | -1;
}

/** Rope in the scene (not part of the knot), through `via`, joining the knot at either end. */
interface Lead {
  from?: Attach;
  via: Point[];
  to?: Attach;
}

export interface Scene {
  /** What the scene shows, in a few words. */
  caption: string;
  /** How big the knot's drawing is in the scene, and how far it's turned (degrees, clockwise). */
  scale: number;
  rotate?: number;
  /** Seen in a mirror (the same knot tied the other way round), to fit the scene. */
  mirror?: boolean;
  /** A point of the knot's drawing and where it goes in the scene. */
  pin: [Point, Point];
  /** Drawn first, in scene coordinates. */
  back: string;
  /** Drawn last, over everything (things the rope goes behind). */
  front?: string;
  /** Replaces the knot's post or rail (in the knot's coordinates), to suit the scene. */
  prop?: string;
  /** Both ropes in one color: two ends of the same rope. */
  oneColor?: boolean;
  leads: Lead[];
  /** After the knot is tight, it moves this far (the knot doing its job). */
  slide?: Point;
}

// --- Drawing helpers (scene colors live in style.css as .s-*) ---

const rect = (cls: string, x: number, y: number, w: number, h: number, r = 0) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const circle = (cls: string, x: number, y: number, r: number) => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;
const path = (cls: string, d: string) => `<path class="${cls}" d="${d}"/>`;
const sky = (to = 100) => rect('s-sky', 0, 0, 100, to);
/** Water from `y` down, with a few ripples. */
const water = (y: number) =>
  rect('s-water', 0, y, 100, 100 - y) + [0, 1, 2].map((i) => path('s-ripple', `M${8 + i * 31} ${y + 12 + i * 9}q4 -2 8 0t8 0`)).join('');
/** A log end: bark ring and growth rings. */
const logEnd = (x: number, y: number, r: number) => circle('s-bark', x, y, r) + circle('s-wood', x, y, r * 0.78) + circle('s-ring', x, y, r * 0.45);

/** A fish, facing left. */
const fish = (x: number, y: number) => path('s-fish', `M${x} ${y}q7 -6 14 0q-7 6 -14 0zM${x + 13} ${y}l5 -4v8z`) + circle('s-eye', x + 3, y - 0.8, 0.7);

const FISHING = (line: Point) =>
  sky(16) +
  rect('s-deep', 0, 16, 100, 84) +
  path('s-surface', 'M0 16q5 -2 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0') +
  path('s-weed', 'M10 100q-4 -10 2 -18t-2 -16M18 100q4 -9 -1 -16M86 100q-5 -12 1 -22t-1 -14') +
  path('s-rod', `M${line[0] - 18} ${line[1] - 14}L${line[0]} ${line[1]}`);

// --- The scenes ---

const SQUARE_LOGS: Point[] = [[50, 62], [32, 62], [68, 62], [41, 46.5], [59, 46.5], [41, 77.5], [59, 77.5]];

export const SCENES: Record<string, Scene> = {
  square: {
    caption: 'Tying up a bundle of firewood.',
    scale: 0.42,
    pin: [[48, 50], [50, 33]],
    oneColor: true,
    back:
      rect('s-floor', 0, 0, 100, 100) +
      path('s-shadow', 'M18 92q32 8 64 0q-32 -5 -64 0z') +
      SQUARE_LOGS.map(([x, y]) => logEnd(x, y, 9.4)).join(''),
    // One rope round the bundle: its two ends are the knot's two ropes.
    leads: [{ from: { rope: 1 }, via: [[80, 44], [81, 60], [76, 78], [62, 90], [50, 93], [38, 90], [24, 78], [19, 60], [20, 42]], to: { rope: 0 } }],
  },
  bowline: {
    caption: 'Dropped over a post on the dock, holding a boat.',
    scale: 0.5,
    pin: [[48, 50], [50, 56]],
    back:
      water(0) +
      rect('s-deck', 0, 64, 100, 36) +
      [72, 80, 88, 96].map((y) => path('s-plank', `M0 ${y}H100`)).join('') +
      path('s-boat', 'M30 -2Q32 14 50 22Q68 14 70 -2Z') +
      circle('s-metal', 50, 17, 1.6) +
      circle('s-post', 50, 66, 5.5) +
      circle('s-ring', 50, 66, 3.3),
    leads: [{ from: {}, via: [[50, 18.5]] }],
  },
  clove: {
    caption: 'A canoe’s line tied to a dock railing for a short stop.',
    scale: 0.45,
    pin: [[50, 50], [50, 36]],
    back:
      sky(70) +
      water(70) +
      rect('s-deck', 0, 62, 100, 8) +
      rect('s-wood-dark', 10, 26, 6, 38) +
      rect('s-wood-dark', 84, 26, 6, 38) +
      path('s-canoe', 'M20 84Q40 76 96 80L100 88Q60 94 26 90Z') +
      circle('s-metal', 26, 84, 1.4),
    prop: rect('s-wood', -100, 42, 300, 16, 2),
    leads: [{ from: {}, via: [[26, 83]] }],
  },
  halfhitches: {
    caption: 'A tarp’s line tied to a tree.',
    scale: 0.55,
    pin: [[15, 50], [16, 52]],
    back:
      sky(80) +
      rect('s-grass', 0, 80, 100, 20) +
      circle('s-leaf', 14, 6, 20) +
      circle('s-leaf', 30, 0, 14) +
      path('s-canvas', 'M64 2L100 2L100 34Z') +
      circle('s-metal', 89, 23.5, 1.2),
    prop: rect('s-trunk', 8, -120, 14, 260) + path('s-bark-line', 'M11 -60v30M18 -10v24M12 90v30M17 130v20'),
    leads: [{ from: {}, via: [[88, 24]] }],
  },
  figure8: {
    caption: 'A stopper on a line through a pulley block: it can’t pull through.',
    scale: 0.5,
    pin: [[33, 40], [48, 50]],
    back: sky() + path('s-sail', 'M0 0L36 0L0 30Z'),
    front: rect('s-block', 16, 41, 14, 18, 4) + circle('s-sheave', 23, 50, 4) + path('s-strop', 'M23 41V34'),
    leads: [{ from: {}, via: [[8, 50], [-2, 46]] }],
    slide: [-15, 0],
  },
  figure8loop: {
    caption: 'A loop clipped to a carabiner, hanging a pack.',
    scale: 0.5,
    rotate: -50,
    pin: [[45, 50], [52, 56]],
    back:
      rect('s-rock', 0, 0, 100, 100) +
      path('s-crack', 'M70 0l-6 20l8 18l-4 30M20 100l6 -24l-8 -16') +
      rect('s-metal', 46, 6, 8, 6, 2) +
      path('s-biner', 'M50 10c-5 0 -6 4 -6 9v6c0 5 3 7 6 7s6 -2 6 -7v-6c0 -5 -1 -9 -6 -9z'),
    leads: [{ from: { strand: 1 }, via: [[24, 85]] }],
    front: rect('s-pack', 14, 84, 22, 16, 4) + rect('s-pack-flap', 14, 84, 22, 6, 3),
  },
  sheetbend: {
    caption: 'A thin line joined to a thicker rope to make it reach.',
    scale: 0.5,
    pin: [[62, 46], [52, 46]],
    back: sky(78) + rect('s-grass', 0, 78, 100, 22) + path('s-wedge', 'M90 72l4 0l-1 12l-2 0z'),
    front: rect('s-trunk', 0, 0, 9, 100),
    leads: [
      { from: { rope: 0 }, via: [[4, 32]] },
      { from: { rope: 1 }, via: [[91, 73]] },
    ],
  },
  tautline: {
    caption: 'A tent’s guy line, tightened round a stake.',
    scale: 0.5,
    rotate: -25,
    pin: [[15, 50], [20, 60]],
    back:
      sky(76) +
      path('s-canvas', 'M58 76L82 18L100 76Z') +
      path('s-canvas-dark', 'M82 18L100 76H94Z') +
      circle('s-metal', 78.5, 27, 1.2),
    prop: path('s-wood', 'M8 14H22V68L15 92L8 68Z'),
    front: rect('s-ground', 0, 76, 100, 24) + path('s-grass-line', 'M0 76H100'),
    leads: [{ from: {}, via: [[78.5, 27]] }],
  },
  trucker: {
    caption: 'A canoe pulled down tight onto a car\u2019s roof rack.',
    scale: 0.4,
    rotate: 238,
    mirror: true,
    pin: [[56, 88], [49, 71]],
    back:
      sky() +
      rect('s-road', 0, 80, 100, 20) +
      // The car and canoe, raised to leave room for the knot below the canoe's bow.
      '<g transform="translate(0 -14)">' +
      path('s-car', 'M50 62H104V90H50Q46 90 46 84V68Q46 62 50 62Z') +
      path('s-car', 'M62 62L70 48H104V62Z') +
      path('s-window', 'M67 61L73 51H86V61Z') +
      path('s-window', 'M89 61V51H104V61Z') +
      circle('s-tire', 62, 92, 6) +
      circle('s-tire', 96, 92, 6) +
      rect('s-metal', 72, 44, 3, 4) +
      rect('s-metal', 96, 44, 3, 4) +
      path('s-canoe', 'M8 36Q50 31 104 35V43Q52 46 12 41Z') +
      rect('s-metal', 46, 82, 6, 6, 1) +
      '</g>',
    prop: rect('s-metal', 44, 84, 30, 8, 3),
    leads: [{ from: {}, via: [[12, 24]] }],
  },
  cleat: {
    caption: 'A boat tied up to a cleat on the dock.',
    scale: 0.55,
    pin: [[50, 50], [52, 32]],
    back:
      rect('s-deck', 0, 0, 100, 62) +
      [12, 24, 36, 48].map((y) => path('s-plank', `M0 ${y}H100`)).join('') +
      water(62) +
      path('s-boat', 'M-2 100Q4 78 16 70Q26 78 30 100Z') +
      circle('s-metal', 16, 76, 1.4),
    leads: [{ from: {}, via: [[16, 75]] }],
  },
  roundturn: {
    caption: 'A canoe’s line tied to a tree on the shore.',
    scale: 0.55,
    pin: [[15, 50], [16, 46]],
    back:
      sky(56) +
      water(56) +
      path('s-grass', 'M0 56H44Q52 78 40 100H0Z') +
      circle('s-leaf', 14, 4, 20) +
      circle('s-leaf', 32, -2, 14) +
      path('s-canoe', 'M58 80Q74 72 104 74V86Q76 90 62 86Z') +
      circle('s-metal', 62, 81, 1.4),
    prop: rect('s-trunk', 8, -120, 14, 260) + path('s-bark-line', 'M11 -60v30M18 -10v24M12 90v30M17 130v20'),
    leads: [{ from: {}, via: [[72, 62], [62, 80]] }],
  },
  anchor: {
    caption: 'An anchor line tied to the anchor’s ring.',
    scale: 0.4,
    rotate: -90,
    pin: [[24, 50], [50, 52]],
    back:
      sky(10) +
      rect('s-deep', 0, 10, 100, 90) +
      path('s-surface', 'M0 10q5 -2 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0') +
      path('s-boat', 'M20 2Q22 12 34 13H58Q66 12 70 2Z') +
      rect('s-sand', 0, 92, 100, 8) +
      path('s-weed', 'M10 100q-4 -10 2 -18t-2 -16M86 100q-5 -12 1 -22t-1 -14'),
    front: rect('s-anchor', 48, 79, 4, 16) + rect('s-anchor', 40, 81, 20, 3, 1.5) + path('s-anchor-arm', 'M34 86Q50 102 66 86'),
    leads: [{ from: {}, via: [[42, 12]] }],
  },
  timber: {
    caption: 'A log lifted on a line: the hitch grips while it pulls.',
    scale: 0.5,
    rotate: -90,
    pin: [[22, 50], [50, 56]],
    back:
      sky(80) +
      rect('s-ground', 0, 80, 100, 20) +
      path('s-grass-line', 'M0 80H100') +
      path('s-branch', 'M-4 6Q40 -2 104 10'),
    prop: rect('s-bark', 8, -20, 14, 140, 6) + path('s-bark-line', 'M12 -6v24M18 24v30M12 70v20M18 96v14'),
    leads: [{ from: {}, via: [[45, 6]] }],
  },
  rolling: {
    caption: 'A tarp line tied to a pole: it holds against the slanting pull.',
    scale: 0.5,
    pin: [[50, 50], [58, 40]],
    back:
      sky(70) +
      rect('s-grass', 0, 70, 100, 30) +
      rect('s-trunk', 92, 0, 10, 100) +
      path('s-canvas', 'M-2 60L22 74L-2 100Z') +
      circle('s-metal', 6, 68, 1.4),
    prop: rect('s-wood', -100, 42, 300, 16, 3),
    leads: [{ from: {}, via: [[16, 60], [7, 67]] }],
  },
  prusik: {
    caption: 'A tarp hung from a ridgeline: slide the prusik to move it, and it stays put.',
    scale: 0.5,
    pin: [[50, 40], [50, 30]],
    back: sky(78) + rect('s-grass', 0, 78, 100, 22) + rect('s-trunk', -4, 0, 9, 100) + rect('s-trunk', 95, 0, 9, 100),
    prop: `<path class="rope-edge" d="M-120 40H220" stroke-width="6"/><path class="rope-core a" d="M-120 40H220" stroke-width="4.4"/>`,
    front: path('s-canvas', 'M50 52L6 92H94Z') + path('s-canvas-dark', 'M50 52L94 92H86Z') + circle('s-metal', 50, 51, 1.6),
    leads: [],
  },
  clinch: {
    caption: 'A hook tied on, ready to fish.',
    scale: 0.55,
    pin: [[50, 40], [50, 54]],
    back: FISHING([46, 8]) + fish(74, 72),
    leads: [{ from: {}, via: [[46, 8]] }],
  },
  palomar: {
    caption: 'A hook on braided line, ready to fish.',
    scale: 0.55,
    pin: [[50, 40], [50, 54]],
    back: FISHING([44, 8]) + fish(14, 80),
    leads: [{ from: { strand: -1 }, via: [[44, 8]] }],
  },
  uni: {
    caption: 'A hook tied on, ready to fish.',
    scale: 0.55,
    pin: [[50, 40], [50, 54]],
    back: FISHING([46, 8]) + fish(76, 78),
    leads: [{ from: {}, via: [[46, 8]] }],
  },
  snell: {
    caption: 'A snelled bait hook: the line pulls straight along the shank.',
    scale: 0.55,
    pin: [[50, 40], [50, 52]],
    back: FISHING([56, 8]) + fish(14, 74),
    leads: [{ from: { end: 'end' }, via: [[56, 8]] }],
  },
};

/** Maps the knot's drawing into the scene. */
function placement(scene: Scene, slide: number) {
  const a = ((scene.rotate ?? 0) * Math.PI) / 180;
  const [cos, sin] = [Math.cos(a), Math.sin(a)];
  const s = scene.scale;
  const m = scene.mirror ? -1 : 1;
  const turn = ([x0, y]: Point): Point => {
    const x = x0 * m;
    return [s * (x * cos - y * sin), s * (x * sin + y * cos)];
  };
  const [px, py] = turn(scene.pin[0]);
  const [sx, sy] = scene.slide ?? [0, 0];
  const tx = scene.pin[1][0] - px + sx * slide;
  const ty = scene.pin[1][1] - py + sy * slide;
  return {
    map: (p: Point): Point => {
      const [x, y] = turn(p);
      return [tx + x, ty + y];
    },
    transform: `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${scene.rotate ?? 0}) scale(${s * m} ${s})`,
  };
}

/** Where the scene's rope joins the knot, and the way out of the knot from there (in the knot's drawing). */
function attachPoint(knot: Knot, ropes: readonly Rope[], at: Attach): { p: Point; out: Point } {
  const rope = ropes[at.rope ?? 0];
  const pts = rope.points;
  const [p0, p1] = at.end === 'end' ? [pts[pts.length - 1], pts[pts.length - 2]] : [pts[0], pts[1]];
  const len = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1;
  const out: Point = [(p0[0] - p1[0]) / len, (p0[1] - p1[1]) / len];
  const d = knot.ropes[at.rope ?? 0].double;
  if (!d || !at.strand) return { p: p0, out };
  // A doubled rope's strands sit either side of its middle line (as rope.ts draws them).
  const [tx, ty] = [-out[0], -out[1]];
  const g = (d.gap / 2) * at.strand;
  return { p: [p0[0] - ty * g, p0[1] + tx * g], out };
}

/** The scene's rope, as ropes in scene coordinates. */
export function leadRopes(knot: Knot, scene: Scene, ropes: readonly Rope[], map: (p: Point) => Point): Rope[] {
  // Leaves the knot straight along the rope's own direction, a share of the way to the next
  // point, so the curve through them joins without a kink.
  const join = (at: Attach, next: Point): Point[] => {
    const { p, out } = attachPoint(knot, ropes, at);
    const a = map(p);
    const b = map([p[0] + out[0], p[1] + out[1]]);
    const unit = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = (Math.hypot(next[0] - a[0], next[1] - a[1]) * 0.4) / unit;
    return [a, [a[0] + (b[0] - a[0]) * d, a[1] + (b[1] - a[1]) * d]];
  };
  return scene.leads.map((lead) => {
    const at = lead.from ?? lead.to!;
    const rope = knot.ropes[at.rope ?? 0];
    const { via } = lead;
    const points = [...(lead.from ? join(lead.from, via[0]) : []), ...via, ...(lead.to ? join(lead.to, via[via.length - 1]).reverse() : [])];
    return {
      points,
      width: (rope.width ?? knot.width ?? 4) * scene.scale,
      color: scene.oneColor ? 'a' : rope.color,
      plainEnd: true,
    };
  });
}

/** The scene with the knot laid to `progress`, pulled `tight`, then moved `slide` (each 0 to 1). */
export function sceneSvg(knot: Knot, scene: Scene, progress: number, tight = 0, slide = 0): string {
  let ropes: Rope[] = tight > 0 ? between(knot.ropes, tighten(knot.ropes, knot.tight), tight) : [...knot.ropes];
  if (scene.oneColor) ropes = ropes.map((r) => ({ ...r, color: 'a' }));
  // Where the scene's rope carries on from a knot rope's last point, that's no working end.
  const joinedAtEnd = new Set(scene.leads.flatMap((l) => [l.from, l.to]).filter((a) => a?.end === 'end').map((a) => a!.rope ?? 0));
  ropes = ropes.map((r, i) => (joinedAtEnd.has(i) ? { ...r, plainEnd: true } : r));
  const { map, transform } = placement(scene, slide);
  // Drawn at the knot's scale, so the rope's outline is as thick as the knot's.
  const k = scene.scale;
  const leads = leadRopes(knot, scene, ropes, map).map((r) => ({ ...r, width: r.width! / k, points: r.points.map(([x, y]): Point => [x / k, y / k]) }));
  const leadSvg = `<g transform="scale(${k})">${ropeSvg(leads, { width: knot.width ?? 4 })}</g>`;
  const prop = scene.prop ?? (knot.prop ? propSvg(knot.prop) : '');
  const body = ropeSvg(ropes, { progress: tight > 0 ? 1 : progress, width: knot.width ?? 4, prop });
  return `<svg class="knot-art scene-art" viewBox="0 0 100 100" aria-hidden="true"><g class="scene-back">${scene.back}</g>${leadSvg}<g transform="${transform}">${body}</g>${scene.front ?? ''}</svg>`;
}
