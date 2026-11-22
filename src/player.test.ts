import { afterEach, describe, expect, it, vi } from 'vitest';
import { KNOTS } from './knots';
import { frameAt, MIN_STEP_MS, PAUSE_MS, run, timeline, TIGHT_MS } from './player';

const knot = KNOTS.find((k) => k.id === 'figure8')!;

describe('timeline', () => {
  const { segments, total } = timeline(knot);

  it('has a stretch per step, then pulls tight, with pauses between', () => {
    expect(segments).toHaveLength(knot.steps.length + 1);
    expect(segments.at(-1)).toMatchObject({ tight: true, step: knot.steps.length });
    segments.slice(1).forEach((s, i) => expect(s.start).toBe(segments[i].end + PAUSE_MS));
    expect(total).toBe(segments.at(-1)!.start + TIGHT_MS);
    expect(segments.every((s) => s.end - s.start >= MIN_STEP_MS)).toBe(true);
  });

  it('lays the rope over each step, then pulls it tight', () => {
    expect(frameAt(segments, 0)).toEqual({ progress: 0, tight: 0, step: 0 });
    expect(frameAt(segments, segments[0].end)).toMatchObject({ progress: segments[0].to, step: 0 });
    // In the pause, the step stays finished.
    expect(frameAt(segments, segments[0].end + PAUSE_MS / 2).progress).toBe(segments[0].to);
    expect(frameAt(segments, segments[1].start).step).toBe(1);
    const last = segments.at(-1)!;
    expect(frameAt(segments, last.start + TIGHT_MS / 4).tight).toBeLessThan(0.5);
    expect(frameAt(segments, last.start + (TIGHT_MS * 3) / 4).tight).toBeGreaterThan(0.5);
    expect(frameAt(segments, total)).toEqual({ progress: 1, tight: 1, step: last.step });
  });
});

describe('run', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('animates frame by frame to the end', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', undefined);
    const seen: number[] = [];
    const done = vi.fn();
    run(0, 100, (t) => seen.push(t), done);
    expect(seen).toEqual([0]);
    vi.advanceTimersByTime(50);
    expect(seen.at(-1)).toBeGreaterThan(0);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(seen.at(-1)).toBe(100);
    expect(done).toHaveBeenCalledOnce();
  });

  it('can be stopped', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', undefined);
    const done = vi.fn();
    const stop = run(0, 100, () => {}, done);
    stop();
    vi.advanceTimersByTime(200);
    expect(done).not.toHaveBeenCalled();
  });

  it('uses animation frames when the browser has them', () => {
    const frames: (() => void)[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => frames.push(cb));
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const stop = run(0, 100, () => {}, () => {});
    expect(frames).toHaveLength(1);
    stop();
    expect(cancel).toHaveBeenCalled();
    frames[0](); // a frame already queued does nothing once stopped
    expect(frames).toHaveLength(1);
  });

  it('jumps to the end when the phone asks for less motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
    const draw = vi.fn();
    const done = vi.fn();
    run(0, 100, draw, done)();
    expect(draw.mock.calls).toEqual([[100]]);
    expect(done).toHaveBeenCalledOnce();
  });
});
