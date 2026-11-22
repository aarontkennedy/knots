import { describe, expect, it } from 'vitest';
import { KNOTS, TASKS, type Knot } from './knots';
import { crossings } from './rope';
import { stepEnds } from './draw';

/** Over (O) or under (U) at each crossing, in order along one rope. */
function pattern(k: Knot, rope = 0): string {
  return crossings(k.ropes)
    .flatMap((c) => [
      ...(c.top.rope === rope ? [{ at: c.top.at, s: 'O' }] : []),
      ...(c.bottom.rope === rope ? [{ at: c.bottom.at, s: 'U' }] : []),
    ])
    .sort((a, b) => a.at - b.at)
    .map((c) => c.s)
    .join('');
}

const knot = (id: string) => KNOTS.find((k) => k.id === id)!;

describe('the knots', () => {
  it('are the everyday ten, in order', () => {
    expect(KNOTS.map((k) => k.name)).toEqual([
      'Square knot',
      'Bowline',
      'Clove hitch',
      'Two half hitches',
      'Figure-eight stopper',
      'Figure-eight loop',
      'Sheet bend',
      'Taut-line hitch',
      'Trucker’s hitch',
      'Cleat hitch',
    ]);
    expect(new Set(KNOTS.map((k) => k.id)).size).toBe(KNOTS.length);
  });

  it.each(KNOTS)('$name has its uses, a way to remember it, and steps that finish the rope', (k) => {
    expect(k.uses.length).toBeGreaterThanOrEqual(3);
    expect(k.remember.length).toBeGreaterThan(20);
    expect(k.tightText).toBeTruthy();
    const ends = stepEnds(k);
    expect(ends.every((e, i) => e > (ends[i - 1] ?? 0))).toBe(true);
    expect(ends.at(-1)).toBeCloseTo(1, 5);
  });

  it('each job has knots for it, and each knot is good for some job', () => {
    for (const t of TASKS) expect(KNOTS.some((k) => k.tasks.includes(t.id)), t.label).toBe(true);
    for (const k of KNOTS) expect(k.tasks.length, k.name).toBeGreaterThan(0);
  });

  it.each(KNOTS)('$name only names points its ropes have', (k) => {
    for (const r of k.ropes) {
      const last = r.points.length - 1;
      for (const [a, b] of [...(r.over ?? []), ...(r.under ?? []), ...(r.behind ?? [])]) {
        expect(a).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(last);
        expect(a).toBeLessThan(b);
      }
    }
    for (const s of k.steps) expect(s.at).toBeLessThanOrEqual(k.ropes[s.rope ?? 0].points.length - 1);
  });
});

// Which piece goes over at each crossing is what makes each knot that knot. These pin the
// patterns checked by eye and by hand against how each knot is tied (docs/DESIGN.md).
describe('crossings', () => {
  it('the figure-eight alternates over and under all the way along', () => {
    expect(pattern(knot('figure8'))).toBe('OUOUOUOU');
    expect(pattern(knot('figure8loop'))).toBe('OUOUOUOU');
  });

  it('the square knot: each rope goes the same way past both parts of the other', () => {
    // Blue's two parts both cross over yellow's bend; yellow's both pass under then over blue.
    expect(pattern(knot('square'), 0)).toBe('UOUUOU');
    expect(pattern(knot('square'), 1)).toBe('OUOOUO');
  });

  it('the bowline: up through the hole, behind the tree, back down the hole', () => {
    expect(pattern(knot('bowline'))).toBe('OUUOOUOUUOUOOU');
  });

  it('the hitches tuck their ends under', () => {
    expect(pattern(knot('clove'))).toBe('OU');
    expect(pattern(knot('halfhitches'))).toBe('UOUOOOUUOOUU');
    expect(pattern(knot('tautline'))).toBe('UOUOUOUOUOUOOOUU');
    expect(pattern(knot('trucker'))).toBe('OUOUOUOUUOOUUO');
    expect(pattern(knot('cleat'))).toBe('UUUUUUOOOOOOUO');
  });

  it('the sheet bend: the thin rope goes round behind the U and tucks under itself', () => {
    expect(pattern(knot('sheetbend'), 0)).toBe('OUOUUO');
    expect(pattern(knot('sheetbend'), 1)).toBe('UOOUUOUO');
  });
});
