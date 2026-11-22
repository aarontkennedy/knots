// Drawing rope: each rope is a smooth curve through hand-placed points (a Catmull-Rom
// spline), drawn as a dark edge with a lighter core so a strand that passes over another
// shows a clear gap either side. Where the rope crosses itself, the knot says which piece
// goes over (drawn last) or under (drawn first); everything else stacks in the order it's
// laid, so the working end goes over what came before unless told otherwise. Pieces marked
// `behind` go behind the post, rail or cleat the knot is tied to (drawn before it).
// Drawing only part of the rope (`progress`, 0 to 1 over all ropes in order) is how the
// steps animate: the rope lays itself down from the standing part to the working end.

export type Point = readonly [number, number];
type Ranges = readonly (readonly [number, number])[];

export interface Rope {
  points: readonly Point[];
  /** Pieces (in point numbers, fractions allowed) that pass over everything else. */
  over?: Ranges;
  /** Pieces that pass under everything else. */
  under?: Ranges;
  /** Pieces hidden behind the thing the knot is tied to. */
  behind?: Ranges;
  /** A second color, for knots that join two ropes. */
  color?: 'a' | 'b';
  /** This rope's own thickness, when it differs from the knot's. */
  width?: number;
  /**
   * Rope folded in two (a bight), drawn as two strands `gap` apart with the fold leading.
   * From point `eye` on, the strands spread to `eyeGap` apart, opening into a loop.
   */
  double?: { gap: number; eye?: number; eyeGap?: number };
}

/** Samples per span between two points: enough for smooth curves. */
const DETAIL = 14;

interface Sample {
  x: number;
  y: number;
  at: number;
}

/** Points along a Catmull-Rom spline through `pts`, with each sample's point number. */
export function sample(pts: readonly Point[]): Sample[] {
  const out: Sample[] = [];
  const p = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    for (let k = 0; k < DETAIL; k++) {
      const t = k / DETAIL;
      const t2 = t * t;
      const t3 = t2 * t;
      const coord = (j: 0 | 1) =>
        0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push({ x: coord(0), y: coord(1), at: i + t });
    }
  }
  const last = pts[pts.length - 1];
  out.push({ x: last[0], y: last[1], at: pts.length - 1 });
  return out;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y);

/** Length of a sampled curve. */
const lengthOf = (s: Sample[]) => s.reduce((t, q, i) => (i ? t + dist(s[i - 1], q) : 0), 0);

const inRange = (at: number, ranges: Ranges | undefined) => !!ranges?.some(([a, b]) => at >= a && at <= b);

/** Where `rope` has reached point `at`, as a share of all the rope (for step `to` values). */
export function progressAt(ropes: readonly Rope[], rope: number, at: number): number {
  const lengths = ropes.map((r) => lengthOf(sample(r.points)));
  const total = lengths.reduce((a, b) => a + b, 0);
  const before = lengths.slice(0, rope).reduce((a, b) => a + b, 0);
  const s = sample(ropes[rope].points).filter((q) => q.at <= at);
  return (before + lengthOf(s)) / total;
}

/** The first `budget` of length along `s`, ending exactly there. */
function cutAt(s: Sample[], budget: number): Sample[] {
  let drawn = 0;
  for (let i = 1; i < s.length; i++) {
    const d = dist(s[i - 1], s[i]);
    if (drawn + d > budget) {
      const a = s[i - 1];
      const b = s[i];
      const f = d ? (budget - drawn) / d : 0;
      return [...s.slice(0, i), { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, at: a.at + (b.at - a.at) * f }];
    }
    drawn += d;
  }
  return s;
}

/** A run of samples drawn as one path, with its stacking order. */
interface Run {
  z: number;
  rope: number;
  order: number;
  pts: { x: number; y: number }[];
  color: 'a' | 'b';
  tip: boolean;
  width: number;
}

/** Longest run, in samples. */
const RUN = 8;

const smooth = (t: number) => t * t * (3 - 2 * t);

/** The two strands of a doubled rope, and the fold joining them at the far end. */
function strands(c: Sample[], d: NonNullable<Rope['double']>) {
  const last = c[c.length - 1].at;
  const gapAt = (at: number) => {
    if (d.eye === undefined || at <= d.eye) return d.gap;
    return d.gap + ((d.eyeGap ?? d.gap) - d.gap) * smooth(Math.min(1, (at - d.eye) / Math.max(1e-6, last - d.eye)));
  };
  const frame = (i: number) => {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(c.length - 1, i + 1)];
    const len = dist(a, b) || 1;
    return { tx: (b.x - a.x) / len, ty: (b.y - a.y) / len };
  };
  const side = (sign: number) =>
    c.map((q, i) => {
      const { tx, ty } = frame(i);
      const g = (gapAt(q.at) / 2) * sign;
      return { x: q.x - ty * g, y: q.y + tx * g, at: q.at };
    });
  const end = c[c.length - 1];
  const { tx, ty } = frame(c.length - 1);
  const r = gapAt(end.at) / 2;
  const fold: Sample[] = [];
  for (let k = 0; k <= 12; k++) {
    const th = (Math.PI * k) / 12;
    // From the first strand's end, out ahead, round to the second strand's end.
    const nx = -ty * Math.cos(th) + tx * Math.sin(th);
    const ny = tx * Math.cos(th) + ty * Math.sin(th);
    fold.push({ x: end.x + nx * r, y: end.y + ny * r, at: end.at });
  }
  return { a: side(1), b: side(-1), fold };
}

export interface DrawOptions {
  /** How much of the rope to draw, 0 to 1 across all ropes in order. */
  progress?: number;
  /** The rope's thickness. */
  width?: number;
  /** SVG for the post, rail or cleat, drawn between the pieces behind it and the rest. */
  prop?: string;
}

/** The SVG for some ropes. */
export function ropeSvg(ropes: readonly Rope[], { progress = 1, width = 4, prop = '' }: DrawOptions = {}): string {
  const sampled = ropes.map((r) => sample(r.points));
  const lengths = sampled.map(lengthOf);
  const total = lengths.reduce((a, b) => a + b, 0);
  let budget = Math.max(0, Math.min(1, progress)) * total;
  const runs: Run[] = [];
  sampled.forEach((s, r) => {
    const rope = ropes[r];
    if (budget <= 0) return;
    const visible = cutAt(s, budget);
    budget -= Math.min(budget, lengths[r]);
    const zOf = (at: number) => (inRange(at, rope.behind) ? -2 : inRange(at, rope.over) ? 1 : inRange(at, rope.under) ? -1 : 0);
    const color = rope.color ?? 'a';
    const w = rope.width ?? width;
    // Split a strand into runs wherever the stacking changes.
    const split = (line: Sample[], tip: boolean) => {
      let start = 0;
      for (let i = 1; i <= line.length; i++) {
        // Short runs too, so a rope crossing itself is never one path (which would hide the gap).
        if (i === line.length || zOf(line[i].at) !== zOf(line[start].at) || i - start >= RUN) {
          // Overlap a sample with the next run, so the rope has no seams.
          const pts = line.slice(Math.max(0, start - 1), Math.min(line.length, i + 1));
          runs.push({ z: zOf(line[start].at), rope: r, order: start, pts, color, tip: tip && i === line.length, width: w });
          start = i;
        }
      }
    };
    if (rope.double) {
      const { a, b, fold } = strands(visible, rope.double);
      split(a, false);
      split(b, false);
      const end = visible[visible.length - 1];
      runs.push({ z: zOf(end.at), rope: r, order: visible.length - 1, pts: [a[a.length - 2], ...fold, b[b.length - 2]], color, tip: false, width: w });
    } else split(visible, true);
  });
  runs.sort((a, b) => a.z - b.z || a.rope - b.rope || a.order - b.order);
  const d = (pts: { x: number; y: number }[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join('');
  const draw = (run: Run) => {
    const path = d(run.pts);
    // Edge first (butt ends, so it never draws a seam across the rope), then the core.
    const tip = run.tip ? run.pts[run.pts.length - 1] : null;
    return (
      `<path class="rope-edge" d="${path}" stroke-width="${run.width + 1.6}"/>` +
      `<path class="rope-core ${run.color}" d="${path}" stroke-width="${run.width}"/>` +
      (tip ? `<circle class="rope-tip ${run.color}" cx="${tip.x.toFixed(2)}" cy="${tip.y.toFixed(2)}" r="${(run.width / 2).toFixed(2)}"/>` : '')
    );
  };
  return runs.filter((r) => r.z < -1).map(draw).join('') + prop + runs.filter((r) => r.z >= -1).map(draw).join('');
}

/** How a knot looks pulled tight: its body squeezed toward a point, the ends left long. */
export interface Tight {
  /** The middle of the knot. */
  at: Point;
  /** How much to squeeze, across and down (1 is not at all). */
  scale: readonly [number, number];
  /** Points left where they are, per rope (default: each rope's two ends). */
  keep?: readonly (readonly number[])[];
}

/** The ropes pulled tight. */
export function tighten(ropes: readonly Rope[], t: Tight): Rope[] {
  return ropes.map((rope, r) => {
    const keep = t.keep?.[r] ?? [0, rope.points.length - 1];
    return {
      ...rope,
      points: rope.points.map((p, i): Point => (keep.includes(i) ? p : [t.at[0] + (p[0] - t.at[0]) * t.scale[0], t.at[1] + (p[1] - t.at[1]) * t.scale[1]])),
    };
  });
}

/** Ropes part-way (`f`, 0 to 1) from one shape to another with the same points. */
export function between(from: readonly Rope[], to: readonly Rope[], f: number): Rope[] {
  return from.map((rope, r) => ({
    ...rope,
    points: rope.points.map((p, i): Point => [p[0] + (to[r].points[i][0] - p[0]) * f, p[1] + (to[r].points[i][1] - p[1]) * f]),
  }));
}

/** Where a rope crosses itself or another: each piece's place, and which is on top. */
export interface Crossing {
  x: number;
  y: number;
  /** The piece on top: rope number and point position. */
  top: { rope: number; at: number };
  bottom: { rope: number; at: number };
}

/** Every crossing (single ropes only; checks the drawing rules in tests and by eye). */
export function crossings(ropes: readonly Rope[]): Crossing[] {
  const segs = ropes.flatMap((rope, r) => {
    const s = sample(rope.points);
    const zOf = (at: number) => (inRange(at, rope.behind) ? -2 : inRange(at, rope.over) ? 1 : inRange(at, rope.under) ? -1 : 0);
    return s.slice(1).map((b, i) => ({ r, i, a: s[i], b, z: zOf(s[i].at) }));
  });
  const out: Crossing[] = [];
  for (let m = 0; m < segs.length; m++) {
    for (let n = m + 1; n < segs.length; n++) {
      const p = segs[m];
      const q = segs[n];
      if (p.r === q.r && Math.abs(p.i - q.i) < 3) continue;
      const dx1 = p.b.x - p.a.x, dy1 = p.b.y - p.a.y, dx2 = q.b.x - q.a.x, dy2 = q.b.y - q.a.y;
      const den = dx1 * dy2 - dy1 * dx2;
      if (!den) continue;
      const t = ((q.a.x - p.a.x) * dy2 - (q.a.y - p.a.y) * dx2) / den;
      const u = ((q.a.x - p.a.x) * dy1 - (q.a.y - p.a.y) * dx1) / den;
      if (t < 0 || t >= 1 || u < 0 || u >= 1) continue;
      const P = { rope: p.r, at: p.a.at + (p.b.at - p.a.at) * t };
      const Q = { rope: q.r, at: q.a.at + (q.b.at - q.a.at) * u };
      // Later in the stacking (z, then rope, then laying order) is on top.
      const qTop = q.z !== p.z ? q.z > p.z : q.r !== p.r ? q.r > p.r : Q.at > P.at;
      out.push({ x: p.a.x + dx1 * t, y: p.a.y + dy1 * t, top: qTop ? Q : P, bottom: qTop ? P : Q });
    }
  }
  return out;
}

/** Numbered points over the rope, for drawing knots by eye (development only). */
export function debugSvg(ropes: readonly Rope[]): string {
  return ropes
    .flatMap((r, k) =>
      r.points.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="0.7" fill="${k ? 'blue' : 'red'}"/><text x="${x + 1}" y="${y - 1}" font-size="2.6" fill="${k ? 'blue' : 'red'}">${i}</text>`),
    )
    .join('');
}
