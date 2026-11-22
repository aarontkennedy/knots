import { describe, expect, it } from 'vitest';
import { KNOTS } from './knots';
import { knotSvg, propSvg, stepEnds } from './draw';

describe('propSvg', () => {
  it('draws a post or rail as a bar, and a cleat with its base', () => {
    expect(propSvg({ kind: 'rail', x: 1, y: 2, w: 3, h: 4 })).toBe('<rect class="prop" x="1" y="2" width="3" height="4" rx="2"/>');
    const cleat = propSvg({ kind: 'cleat', x: 0, y: 0, w: 100, h: 10 });
    expect(cleat).toContain('rx="5"');
    expect(cleat).toContain('prop-base');
  });
});

describe('knotSvg', () => {
  it.each(KNOTS)('draws $name at every step and pulled tight', (k) => {
    for (const p of [0.1, ...stepEnds(k)]) expect(knotSvg(k, p)).not.toContain('NaN');
    const tight = knotSvg(k, 0, 1);
    expect(tight).toContain('rope-core');
    expect(tight).not.toContain('NaN');
    if (k.prop) expect(tight).toContain('class="prop"');
  });

  it('is hidden from screen readers (the caption says what it shows)', () => {
    expect(knotSvg(KNOTS[0], 1)).toMatch(/^<svg class="knot-art" viewBox="0 0 100 100" aria-hidden="true">/);
  });
});
