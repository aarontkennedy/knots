import { describe, expect, it } from 'vitest';
import { KNOTS } from './knots';
import { leadRopes, SCENES, sceneSvg } from './scenes';
import type { Point } from './rope';

describe('in-use scenes', () => {
  it('every knot has one, with a caption', () => {
    expect(Object.keys(SCENES).sort()).toEqual(KNOTS.map((k) => k.id).sort());
    for (const s of Object.values(SCENES)) expect(s.caption).toMatch(/\.$/);
  });

  it.each(KNOTS)('$name draws in its scene from start to finish', (k) => {
    const scene = SCENES[k.id];
    for (const [p, t, sl] of [[0, 0, 0], [0.5, 0, 0], [1, 0, 0], [1, 0.5, 0], [1, 1, 0], [1, 1, 1]]) {
      const svg = sceneSvg(k, scene, p, t, sl);
      expect(svg).not.toContain('NaN');
      expect(svg).toMatch(/^<svg class="knot-art scene-art" viewBox="0 0 100 100" aria-hidden="true">/);
    }
  });

  it.each(KNOTS)('$name: rope from the scene joins the knot exactly where its rope ends', (k) => {
    const scene = SCENES[k.id];
    const map = (p: Point): Point => p; // the knot's own drawing, unmoved
    for (const [i, lead] of leadRopes(k, scene, k.ropes, map).entries()) {
      const at = scene.leads[i].from!;
      const rope = k.ropes[at.rope ?? 0];
      const end = at.end === 'end' ? rope.points[rope.points.length - 1] : rope.points[0];
      const [x, y] = lead.points[0];
      // On the rope's middle line, or half the gap from it for a doubled rope's strand.
      const off = Math.hypot(x - end[0], y - end[1]);
      expect(off).toBeCloseTo(at.strand ? rope.double!.gap / 2 : 0, 5);
      expect(lead.plainEnd).toBe(true);
    }
  });

  it('draws two ropes in one color when they\u2019re the same rope round a bundle', () => {
    const square = KNOTS.find((k) => k.id === 'square')!;
    expect(sceneSvg(square, SCENES.square, 1)).not.toContain('rope-core b');
    const sheet = KNOTS.find((k) => k.id === 'sheetbend')!;
    expect(sceneSvg(sheet, SCENES.sheetbend, 1)).toContain('rope-core b');
  });

  it('places the knot by turning, mirroring and scaling its drawing', () => {
    const trucker = KNOTS.find((k) => k.id === 'trucker')!;
    expect(sceneSvg(trucker, SCENES.trucker, 1)).toMatch(/rotate\(238\) scale\(-0\.4 0\.4\)/);
  });

  it('slides the stopper up to the block at the end', () => {
    const eight = KNOTS.find((k) => k.id === 'figure8')!;
    const x = (svg: string) => Number(/translate\(([-\d.]+) /.exec(svg)![1]);
    expect(x(sceneSvg(eight, SCENES.figure8, 1, 1, 1))).toBeCloseTo(x(sceneSvg(eight, SCENES.figure8, 1, 1, 0)) + SCENES.figure8.slide![0]);
  });

  it('leaves no end dot where the scene\u2019s rope carries on from a knot rope\u2019s last point', () => {
    const snell = KNOTS.find((k) => k.id === 'snell')!;
    expect(sceneSvg(snell, SCENES.snell, 1)).not.toContain('rope-tip');
  });
});
