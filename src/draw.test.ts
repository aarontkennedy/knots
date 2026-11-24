import { describe, expect, it } from 'vitest';
import { KNOTS } from './knots';
import { knotSvg, propSvg, stepEnds } from './draw';

describe('propSvg', () => {
  it('draws a hook with its eye, outlined so rope behind it shows', () => {
    const hook = propSvg({ kind: 'hook', x: 50, y: 20, w: 4, h: 30 });
    expect(hook).toContain('<circle cx="50" cy="20" r="4"/>');
    expect(hook.indexOf('hook-edge')).toBeLessThan(hook.indexOf('class="hook"'));
  });

  it('draws a post or rail as a bar, and a cleat with its base', () => {
    expect(propSvg({ kind: 'rail', x: 1, y: 2, w: 3, h: 4 })).toBe('<rect class="prop" x="1" y="2" width="3" height="4" rx="2"/>');
    const cleat = propSvg({ kind: 'cleat', x: 0, y: 0, w: 100, h: 10 });
    expect(cleat).toContain('rx="5"');
    expect(cleat).toContain('prop-base');
  });

  it('draws a ring as a metal circle, and another rope straight across', () => {
    const ring = propSvg({ kind: 'ring', x: -15, y: 50, w: 30, h: 9 });
    expect(ring).toContain('class="ring-edge" cx="-15" cy="50" r="30" stroke-width="10.6"');
    expect(ring).toContain('class="ring"');
    const rope = propSvg({ kind: 'rope', x: -2, y: 40, w: 104, h: 4.4 });
    expect(rope).toContain('d="M-2 40H102"');
    expect(rope).toContain('class="rope-core a"');
  });
});

describe('knotSvg', () => {
  it.each(KNOTS)('draws $name at every step and pulled tight', (k) => {
    for (const p of [0.1, ...stepEnds(k)]) expect(knotSvg(k, p)).not.toContain('NaN');
    const tight = knotSvg(k, 0, 1);
    expect(tight).toContain('rope-core');
    expect(tight).not.toContain('NaN');
    const looks = { hook: /class="hook"/, ring: /class="ring"/, rope: /M-?\d+ \d+H/ } as Record<string, RegExp>;
    if (k.prop) expect(tight).toMatch(looks[k.prop.kind] ?? /class="prop"/);
  });

  it('is hidden from screen readers (the caption says what it shows)', () => {
    expect(knotSvg(KNOTS[0], 1)).toMatch(/^<svg class="knot-art" viewBox="0 0 100 100" aria-hidden="true">/);
  });
});
