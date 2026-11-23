// One timeline per knot drives both ways of watching it. Each step lays more rope (or, last,
// pulls the knot tight), with a pause after it when playing straight through. Step by step
// plays one step's stretch of the timeline; playing through runs it end to end.
import type { Knot } from './knots';
import { stepEnds } from './draw';

/** Milliseconds to lay the whole rope, the pull tight, and the pause between steps. */
export const LAY_MS = 7000;
export const MIN_STEP_MS = 900;
export const TIGHT_MS = 1400;
export const PAUSE_MS = 900;
/** The "in use" scenes' last beat (such as a stopper sliding up to a block). */
export const SLIDE_MS = 1400;

export interface Segment {
  step: number;
  start: number;
  /** When the step's drawing is done; the pause runs from here to the next step's start. */
  end: number;
  from: number;
  to: number;
  tight: boolean;
  /** The scene's last beat, after the knot is tight. */
  slide?: boolean;
}

/** The knot's steps laid out in time. The last step pulls it tight; then, if `slide`, one more beat. */
export function timeline(knot: Knot, slide = false): { segments: Segment[]; total: number } {
  const ends = stepEnds(knot);
  const segments: Segment[] = [];
  let t = 0;
  ends.forEach((to, step) => {
    const from = step ? ends[step - 1] : 0;
    const dur = Math.max(MIN_STEP_MS, (to - from) * LAY_MS);
    segments.push({ step, start: t, end: t + dur, from, to, tight: false });
    t += dur + PAUSE_MS;
  });
  segments.push({ step: ends.length, start: t, end: t + TIGHT_MS, from: 1, to: 1, tight: true });
  t += TIGHT_MS;
  if (slide) {
    t += PAUSE_MS / 2;
    segments.push({ step: ends.length, start: t, end: t + SLIDE_MS, from: 1, to: 1, tight: true, slide: true });
    t += SLIDE_MS;
  }
  return { segments, total: t };
}

const ease = (f: number) => (f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2);

/** What to draw at time `t`: rope laid, how tight, and which step it's on. */
export function frameAt(segments: readonly Segment[], t: number): { progress: number; tight: number; step: number; slide: number } {
  let seg = segments[0];
  for (const s of segments) if (t >= s.start) seg = s;
  const f = Math.max(0, Math.min(1, (t - seg.start) / (seg.end - seg.start)));
  if (seg.slide) return { progress: 1, tight: 1, step: seg.step, slide: ease(f) };
  if (seg.tight) return { progress: 1, tight: ease(f), step: seg.step, slide: 0 };
  return { progress: seg.from + (seg.to - seg.from) * f, tight: 0, step: seg.step, slide: 0 };
}

/** Whether the phone asks for less motion: then steps show finished, without animating. */
export const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const nextFrame = (cb: () => void): (() => void) => {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(cb);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(cb, 16);
  return () => clearTimeout(id);
};

/**
 * Runs time from `from` to `to`, calling `draw` each frame and `done` at the end. Returns a
 * stop function. With reduced motion it jumps straight to the end.
 */
export function run(from: number, to: number, draw: (t: number) => void, done: () => void): () => void {
  if (reducedMotion() || to <= from) {
    draw(to);
    done();
    return () => {};
  }
  const start = performance.now();
  let cancel = () => {};
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const t = Math.min(to, from + performance.now() - start);
    draw(t);
    if (t >= to) done();
    else cancel = nextFrame(tick);
  };
  draw(from);
  cancel = nextFrame(tick);
  return () => {
    stopped = true;
    cancel();
  };
}
