import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMode, startApp } from './app';
import { KNOTS } from './knots';

let stop = () => {};
const root = () => document.getElementById('app')!;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root().querySelector<T>(sel)!;
const click = (sel: string) => $(sel).click();
const go = (hash: string) => {
  location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

beforeEach(() => {
  // Steps show finished at once, as for someone who asks for less motion.
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
  document.body.innerHTML = '<div id="app"></div>';
});

afterEach(() => {
  stop();
  vi.unstubAllGlobals();
});

describe('the list', () => {
  it('shows every knot with its picture, linking to its page', () => {
    stop = startApp(root());
    const cards = root().querySelectorAll<HTMLAnchorElement>('.knot-card');
    expect(cards).toHaveLength(KNOTS.length);
    expect(cards[1].getAttribute('href')).toBe('#/k/bowline');
    expect(cards[1].textContent).toContain('Bowline');
    expect(cards[1].querySelector('svg')).not.toBeNull();
    expect(document.title).toBe('Knots');
  });

  it('has Settings and About buttons, named for screen readers', () => {
    stop = startApp(root());
    expect($('[aria-label="Settings"]').getAttribute('href')).toBe('#/settings');
    expect($('[aria-label="About"]').getAttribute('href')).toBe('#/about');
  });

  it('is where an unknown address goes', () => {
    location.hash = '#/k/nope';
    stop = startApp(root());
    expect($('h1').textContent).toBe('Knots');
  });
});

describe('a knot page', () => {
  const open = (id: string) => {
    stop = startApp(root());
    go(`#/k/${id}`);
  };
  const caption = () => $('[data-caption]').textContent;
  const count = () => $('[data-count]').textContent;

  it('shows the knot, its uses and a way to remember it', () => {
    open('bowline');
    const k = KNOTS[1];
    expect($('h1').textContent).toBe('Bowline');
    expect(document.title).toBe('Bowline - Knots');
    expect(root().querySelectorAll('.uses li')).toHaveLength(k.uses.length);
    expect($('.remember').textContent).toBe(k.remember);
    expect($('.back').getAttribute('href')).toBe('#/');
  });

  it('starts step by step on the first step', () => {
    open('figure8');
    expect($('[data-mode="step"]').getAttribute('aria-pressed')).toBe('true');
    expect(count()).toBe('Step 1 of 4');
    expect(caption()).toBe(KNOTS[4].steps[0].text);
    expect($<HTMLButtonElement>('[data-back]').disabled).toBe(true);
    expect($('[data-play-controls]').hidden).toBe(true);
    expect($('[data-art] svg')).not.toBeNull();
  });

  it('steps forward to the pull tight and back again', () => {
    open('figure8');
    const k = KNOTS[4];
    click('[data-next]');
    expect(count()).toBe('Step 2 of 4');
    expect(caption()).toBe(k.steps[1].text);
    click('[data-next]');
    click('[data-next]');
    expect(count()).toBe('Step 4 of 4: pull tight');
    expect(caption()).toBe(k.tightText);
    expect($<HTMLButtonElement>('[data-next]').disabled).toBe(true);
    click('[data-back]');
    expect(count()).toBe('Step 3 of 4');
    click('[data-again]');
    expect(count()).toBe('Step 3 of 4');
  });

  it('plays straight through when chosen, and remembers the choice', () => {
    open('figure8');
    click('[data-mode="play"]');
    expect(getMode()).toBe('play');
    expect($('[data-step-controls]').hidden).toBe(true);
    expect($('[data-play-controls]').hidden).toBe(false);
    // With less motion it plays to the end at once.
    expect(count()).toBe('Step 4 of 4: pull tight');
    expect($('[data-play]').textContent).toBe('Play again');
    click('[data-play]');
    expect($('[data-play]').textContent).toBe('Play again');

    go('#/');
    go('#/k/clove');
    expect($('[data-mode="play"]').getAttribute('aria-pressed')).toBe('true');
    click('[data-mode="play"]'); // already chosen: nothing changes
    click('[data-mode="step"]');
    expect(getMode()).toBe('step');
    expect($('[data-step-controls]').hidden).toBe(false);
    expect(count()).toBe('Step 4 of 4: pull tight');
  });

  it('pauses and carries on when playing', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('requestAnimationFrame', undefined);
    vi.useFakeTimers();
    localStorage.setItem('knots:mode', 'play');
    open('square');
    expect(count()).toBe('Step 1 of 4');
    vi.advanceTimersByTime(3000);
    click('[data-play]');
    expect($('[data-play]').textContent).toBe('Play');
    const paused = count();
    vi.advanceTimersByTime(20000);
    expect(count()).toBe(paused);
    click('[data-play]');
    expect($('[data-play]').textContent).toBe('Pause');
    vi.advanceTimersByTime(30000);
    expect(count()).toBe('Step 4 of 4: pull tight');
    click('[data-restart]');
    expect(count()).toBe('Step 1 of 4');
  });
});

describe('Settings and About', () => {
  it('chooses light or dark, showing the choice', () => {
    stop = startApp(root());
    go('#/settings');
    expect($('h1').textContent).toBe('Settings');
    expect(document.title).toBe('Settings - Knots');
    expect($('[data-appearance="auto"]').getAttribute('aria-pressed')).toBe('true');
    click('[data-appearance="dark"]');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect($('[data-appearance="dark"]').getAttribute('aria-pressed')).toBe('true');
    expect($('[data-appearance="auto"]').getAttribute('aria-pressed')).toBe('false');
    click('[data-appearance="auto"]');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect($('.back-icon').getAttribute('href')).toBe('#/');
  });

  it('shows the About page', () => {
    stop = startApp(root());
    go('#/about');
    expect($('h1').textContent).toBe('About');
    expect(document.title).toBe('About - Knots');
    expect($('.about').textContent).toContain('Add it to your phone');
  });
});

describe('getMode', () => {
  it('defaults to step by step, even when storage is blocked', () => {
    expect(getMode()).toBe('step');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getMode()).toBe('step');
  });

  it('still switches modes when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    stop = startApp(root());
    go('#/k/clove');
    click('[data-mode="play"]');
    expect($('[data-mode="play"]').getAttribute('aria-pressed')).toBe('true');
  });
});
