// Design rules that can be checked by reading the stylesheet (docs/DESIGN.md).
import { describe, expect, it } from 'vitest';
import css from './style.css?raw';

describe('readable text', () => {
  it('sets no font size under 18px', () => {
    const sizes = [...css.matchAll(/font-size:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(sizes.every((s) => s >= 18)).toBe(true);
    expect(css).toMatch(/--text-sm: 18px/);
  });

  it('makes buttons at least a thumb wide', () => {
    expect(css).toMatch(/--tap: 44px/);
    const blocks = css.match(/\.(controls button|mode button|chip) \{[^}]*\}/g)!;
    expect(blocks).toHaveLength(3);
    for (const block of blocks) expect(block).toContain('min-height: var(--tap)');
  });
});
