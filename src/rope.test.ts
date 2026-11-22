import { describe, expect, it } from 'vitest';
import { between, crossings, debugSvg, progressAt, ropeSvg, sample, tighten, type Rope } from './rope';

const LINE: Rope = { points: [[0, 50], [50, 50], [100, 50]] };
// A loop that crosses itself once: down, round, and back across.
const LOOP: Rope = { points: [[10, 50], [50, 50], [70, 30], [50, 10], [30, 30], [50, 50], [90, 90]] };

describe('sample', () => {
  it('passes through the first and last points, numbering samples by point', () => {
    const s = sample(LINE.points);
    expect(s[0]).toMatchObject({ x: 0, y: 50, at: 0 });
    expect(s.at(-1)).toMatchObject({ x: 100, y: 50, at: 2 });
    expect(s.every((q, i) => !i || q.at > s[i - 1].at)).toBe(true);
  });
});

describe('ropeSvg', () => {
  const count = (svg: string, cls: string) => svg.split(`class="${cls}`).length - 1;

  it('draws nothing at progress 0 and the whole rope with its end at 1', () => {
    expect(ropeSvg([LINE], { progress: 0 })).toBe('');
    const svg = ropeSvg([LINE]);
    expect(count(svg, 'rope-tip')).toBe(1);
    expect(svg).toContain('cx="100.00" cy="50.00"');
  });

  it('stops part-way along for partial progress', () => {
    expect(ropeSvg([LINE], { progress: 0.5 })).toContain('cx="50.00" cy="50.00"');
  });

  it('draws each piece as an edge then a core, so crossings show a gap', () => {
    const svg = ropeSvg([LINE]);
    expect(count(svg, 'rope-edge')).toBe(count(svg, 'rope-core'));
    expect(svg.indexOf('rope-edge')).toBeLessThan(svg.indexOf('rope-core'));
  });

  it('uses the rope’s own thickness and color when it has them', () => {
    const svg = ropeSvg([{ ...LINE, width: 6, color: 'b' }], { width: 3 });
    expect(svg).toContain('stroke-width="6"');
    expect(svg).toContain('rope-core b');
    expect(svg).not.toContain('stroke-width="3"');
  });

  it('only starts the second rope once the first is laid', () => {
    const two = [LINE, { ...LINE, color: 'b' as const }];
    expect(ropeSvg(two, { progress: 0.5 })).not.toContain('rope-core b');
    expect(ropeSvg(two, { progress: 0.75 })).toContain('rope-core b');
  });

  it('draws pieces behind the prop before it, the rest after', () => {
    const svg = ropeSvg([{ ...LINE, behind: [[0, 1]] }], { prop: '<rect id="post"/>' });
    const prop = svg.indexOf('id="post"');
    expect(svg.indexOf('rope-edge')).toBeLessThan(prop);
    expect(svg.lastIndexOf('rope-core')).toBeGreaterThan(prop);
  });

  it('stacks under, plain and over pieces in that order', () => {
    const svg = ropeSvg([{ ...LINE, under: [[1.5, 2]], over: [[0, 0.5]] }]);
    const firstRun = svg.slice(0, svg.indexOf('/>'));
    expect(firstRun).toContain('L100.00 50.00'); // the under piece, at the far end, drawn first
    const lastEdge = svg.slice(svg.lastIndexOf('rope-edge'));
    expect(lastEdge).toContain('M0.00 50.00'); // the over piece, drawn last
  });

  it('draws a doubled rope as two strands joined by a fold', () => {
    const svg = ropeSvg([{ ...LINE, double: { gap: 4, eye: 1, eyeGap: 20 } }]);
    expect(svg).not.toContain('rope-tip');
    // Strands 2 apart at the start, opening to 10 either side at the end.
    expect(svg).toContain('M0.00 52.00');
    expect(svg).toContain('M0.00 48.00');
    expect(svg).toMatch(/L100\.00 (40|60)\.00/);
    // The fold reaches out ahead of the end.
    expect(svg).toContain('110.00 50.00');
  });
});

describe('progressAt', () => {
  it('measures along the ropes in order', () => {
    expect(progressAt([LINE], 0, 1)).toBeCloseTo(0.5);
    expect(progressAt([LINE, LINE], 1, 0)).toBeCloseTo(0.5);
    expect(progressAt([LINE, LINE], 1, 2)).toBeCloseTo(1);
  });
});

describe('crossings', () => {
  it('finds where a rope crosses itself, the later piece on top', () => {
    const [c] = crossings([LOOP]);
    expect(crossings([LOOP])).toHaveLength(1);
    expect(c.top.at).toBeGreaterThan(c.bottom.at);
  });

  it('follows over, under and behind', () => {
    const under = crossings([{ ...LOOP, under: [[4.5, 5.5]] }])[0];
    expect(under.top.at).toBeLessThan(under.bottom.at);
    const over = crossings([{ ...LOOP, over: [[0.5, 1.5]] }])[0];
    expect(over.top.at).toBeLessThan(over.bottom.at);
    const behind = crossings([{ ...LOOP, behind: [[4.5, 5.5]] }])[0];
    expect(behind.top.at).toBeLessThan(behind.bottom.at);
  });

  it('puts the later rope on top between two ropes', () => {
    const cross: Rope = { points: [[50, 0], [50, 100]] };
    const [c] = crossings([LINE, cross]);
    expect(c.top.rope).toBe(1);
    expect(c).toMatchObject({ x: 50, y: 50 });
  });

  it('skips parallel pieces', () => {
    expect(crossings([LINE, { points: [[0, 60], [100, 60]] }])).toEqual([]);
  });
});

describe('tighten and between', () => {
  it('squeezes points toward the middle, keeping the ends', () => {
    const [t] = tighten([LOOP], { at: [50, 50], scale: [0.5, 0.5] });
    expect(t.points[0]).toEqual([10, 50]);
    expect(t.points[2]).toEqual([60, 40]);
    expect(t.points.at(-1)).toEqual([90, 90]);
    const [k] = tighten([LOOP], { at: [50, 50], scale: [0.5, 0.5], keep: [[2]] });
    expect(k.points[2]).toEqual([70, 30]);
    expect(k.points[0]).toEqual([30, 50]);
  });

  it('goes part-way from one shape to another', () => {
    const [half] = between([LINE], [{ points: [[0, 0], [50, 0], [100, 0]] }], 0.5);
    expect(half.points).toEqual([[0, 25], [50, 25], [100, 25]]);
  });
});

it('numbers the points for drawing by eye', () => {
  expect(debugSvg([LINE, LINE])).toContain('fill="blue">2</text>');
});
