// The app: a list of knots, and a page for each that shows how to tie it (step by step,
// played straight through, or played zoomed out where it's used: the choice is remembered),
// what it's for and how to remember it.
import { KNOTS, TASKS, type Knot, type Task } from './knots';
import { knotSvg } from './draw';
import { SCENES, sceneSvg } from './scenes';
import { frameAt, run, timeline, type Segment } from './player';
import { mountAbout } from './about';
import { BACK_ICON, GEAR_ICON, INFO_ICON, SHARE_ICON } from './icons';
import { openShareSheet, shareLinks } from './share';
import { getAppearance, setAppearance, type Appearance } from './theme';

export type Mode = 'step' | 'play' | 'scene';
const MODE_KEY = 'knots:mode';

export function getMode(): Mode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === 'play' || saved === 'scene' ? saved : 'step';
  } catch {
    return 'step';
  }
}

function setMode(mode: Mode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Private browsing: the choice lasts until the page closes.
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CHEVRON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

/** The list's filter: kept while the app is open, so coming back from a knot keeps it. */
let filter: Task | 'all' = 'all';

function homeHtml(): string {
  const links = shareLinks();
  return `<header class="topbar">
  <h1>Knots</h1>
  <button type="button" class="top-action top-icon" data-share aria-label="Share" aria-expanded="false">${SHARE_ICON}</button>
  <a class="top-action top-icon" href="#/settings" aria-label="Settings">${GEAR_ICON}</a>
  <a class="top-action top-icon" href="#/about" aria-label="About">${INFO_ICON}</a>
</header>
<div class="share-menu" data-share-menu hidden>
  <a class="btn" href="${links.text}">Send a text</a>
  <a class="btn secondary" href="${links.email}">Send an email</a>
</div>
<main class="page">
  <h2 class="filter-label" id="filter-label">What do you need to do?</h2>
  <div class="chips" role="group" aria-labelledby="filter-label">${[{ id: 'all', label: 'All' }, ...TASKS]
    .map((t) => `<button type="button" class="chip" data-filter="${t.id}" aria-pressed="${t.id === filter}">${t.label}</button>`)
    .join('')}</div>
  <ul class="knot-list">${KNOTS.map(
    (k) => `<li data-knot="${k.id}"><a class="knot-card" href="#/k/${k.id}">${knotSvg(k, 1, 1)}<span class="knot-card-text"><span class="knot-card-name">${esc(k.name)}</span><span class="knot-card-summary">${esc(k.summary)}</span></span></a></li>`,
  ).join('')}</ul>
</main>`;
}

/**
 * Shows only the knots for the chosen job, easiest first (otherwise in the list's order).
 * All shows every knot in the list's order.
 */
function applyFilter(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  const list = root.querySelector<HTMLElement>('.knot-list')!;
  const items = KNOTS.map((k) => list.querySelector<HTMLElement>(`[data-knot="${k.id}"]`)!);
  const level = (i: number) => (filter === 'all' ? 0 : KNOTS[i].level);
  const order = items.map((_, i) => i).sort((a, b) => level(a) - level(b) || a - b);
  for (const i of order) {
    items[i].hidden = filter !== 'all' && !KNOTS[i].tasks.includes(filter);
    list.append(items[i]);
  }
}

/** Share: the phone's share sheet, or text and email links where there isn't one. */
function setUpShare(root: HTMLElement): void {
  const button = root.querySelector<HTMLButtonElement>('[data-share]')!;
  const menu = root.querySelector<HTMLElement>('[data-share-menu]')!;
  button.addEventListener('click', async () => {
    if (await openShareSheet()) return;
    menu.hidden = !menu.hidden;
    button.setAttribute('aria-expanded', String(!menu.hidden));
  });
}

function setUpFilter(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.filter as Task | 'all';
      applyFilter(root);
    }),
  );
  applyFilter(root);
}

/** A page under the list (About, Settings): back arrow, centered title. */
const subHeader = (title: string) =>
  `<header class="topbar sub"><a class="back-icon top-icon" href="#/" aria-label="Back to knots">${BACK_ICON}</a><h1>${title}</h1></header>`;

function showAbout(root: HTMLElement): void {
  root.innerHTML = `${subHeader('About')}<main class="page prose about"></main>`;
  mountAbout(root.querySelector<HTMLElement>('.about')!);
}

function showSettings(root: HTMLElement): void {
  const choices: [Appearance, string][] = [['auto', 'Automatic'], ['light', 'Light'], ['dark', 'Dark']];
  const now = getAppearance();
  root.innerHTML = `${subHeader('Settings')}
<main class="page">
  <section class="setting">
    <h2>Appearance</h2>
    <div class="segmented" role="group" aria-label="Appearance">${choices
      .map(([id, label]) => `<button type="button" data-appearance="${id}" aria-pressed="${id === now}">${label}</button>`)
      .join('')}</div>
    <p class="setting-note">Automatic follows your phone’s light or dark mode.</p>
  </section>
</main>`;
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-appearance]');
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      setAppearance(btn.dataset.appearance as Appearance);
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    }),
  );
}

function knotHtml(k: Knot, mode: Mode): string {
  return `<header class="topbar"><a class="back" href="#/">${CHEVRON}<span>All knots</span></a></header>
<main class="page knot">
  <h1>${esc(k.name)}</h1>
  <p class="summary">${esc(k.summary)}</p>
  <div class="art" data-art></div>
  <div class="mode" role="group" aria-label="How to show it">
    <button type="button" data-mode="step" aria-pressed="${mode === 'step'}">Step by step</button>
    <button type="button" data-mode="play" aria-pressed="${mode === 'play'}">Play through</button>
    <button type="button" data-mode="scene" aria-pressed="${mode === 'scene'}">In use</button>
  </div>
  <div class="controls">
    <button type="button" data-back>Back</button>
    <button type="button" data-middle></button>
    <button type="button" data-next>Next</button>
  </div>
  <p class="step-count" data-count></p>
  <p class="caption" data-caption aria-live="polite"></p>
  <section><h2>What it’s for</h2><ul class="uses">${k.uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></section>
  <section><h2>Remember it</h2><p class="remember">${esc(k.remember)}</p></section>
</main>`;
}

/** A knot's page: draws frames of its timeline and handles the controls. */
class KnotPage {
  private segments: Segment[];
  private total: number;
  private t = 0;
  private step = 0;
  private stop: () => void = () => {};
  private playing = false;
  private readonly q = <T extends HTMLElement>(sel: string) => this.root.querySelector<T>(sel)!;

  constructor(
    private readonly root: HTMLElement,
    private readonly knot: Knot,
    private mode: Mode,
  ) {
    ({ segments: this.segments, total: this.total } = this.timeline());
    root.innerHTML = knotHtml(knot, mode);
    this.q('[data-next]').addEventListener('click', () => this.go(this.step + 1));
    this.q('[data-back]').addEventListener('click', () => this.go(this.step - 1));
    this.q('[data-middle]').addEventListener('click', () => this.middle());
    root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => this.setMode(b.dataset.mode as Mode)));
    this.setButtons();
    if (mode === 'step') this.showStep(0);
    else this.play(0);
  }

  /**
   * One row of buttons for every mode: Back and Next move a step (playing on from there when
   * playing through), and the middle one shows the step again or plays and pauses.
   */
  private setButtons(): void {
    const step = this.mode === 'step';
    this.q('[data-next]').classList.toggle('primary', step);
    this.q('[data-middle]').classList.toggle('primary', !step);
    this.q('[data-middle]').textContent = step ? 'Again' : this.playing ? 'Pause' : this.t >= this.total ? 'Play again' : 'Play';
  }

  private go(step: number): void {
    if (this.mode === 'step') this.showStep(step);
    else this.play(this.segments[Math.max(0, Math.min(this.steps - 1, step))].start);
  }

  private middle(): void {
    if (this.mode === 'step') this.showStep(this.step);
    else if (this.playing) this.pause();
    else this.play(this.t >= this.total ? 0 : this.t);
  }

  /** The steps, and pulling tight. */
  private get steps() {
    return this.knot.steps.length + 1;
  }

  /** The timeline for the current mode: "in use" may end with the knot at work. */
  private timeline() {
    return timeline(this.knot, this.mode === 'scene' && !!SCENES[this.knot.id].slide);
  }

  private caption(step: number): string {
    return step < this.knot.steps.length ? this.knot.steps[step].text : this.knot.tightText;
  }

  private draw(t: number): void {
    this.t = t;
    const f = frameAt(this.segments, t);
    this.q('[data-art]').innerHTML =
      this.mode === 'scene' ? sceneSvg(this.knot, SCENES[this.knot.id], f.progress, f.tight, f.slide) : knotSvg(this.knot, f.progress, f.tight);
    if (f.step !== this.step || !this.q('[data-caption]').textContent) this.setStep(f.step);
  }

  private setStep(step: number): void {
    this.step = step;
    this.q('[data-count]').textContent =
      this.mode === 'scene'
        ? `In use: ${SCENES[this.knot.id].caption}`
        : step === this.steps - 1
          ? `Step ${step + 1} of ${this.steps}: pull tight`
          : `Step ${step + 1} of ${this.steps}`;
    this.q('[data-caption]').textContent = this.caption(step);
    this.q<HTMLButtonElement>('[data-back]').disabled = step === 0;
    this.q<HTMLButtonElement>('[data-next]').disabled = step === this.steps - 1;
  }

  /** Step by step: animate one step's stretch of the timeline. */
  showStep(step: number): void {
    this.stop();
    const s = this.segments[Math.max(0, Math.min(this.steps - 1, step))];
    this.setStep(s.step);
    this.stop = run(s.start, s.end, (t) => this.draw(t), () => {});
  }

  /** Playing through, from time `t`. */
  play(t: number): void {
    this.stop();
    this.playing = true;
    this.setButtons();
    this.stop = run(t, this.total, (now) => this.draw(now), () => {
      this.playing = false;
      this.setButtons();
    });
  }

  pause(): void {
    this.stop();
    this.playing = false;
    this.setButtons();
  }

  setMode(mode: Mode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    setMode(mode);
    this.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    this.pause();
    ({ segments: this.segments, total: this.total } = this.timeline());
    const step = this.step;
    this.step = -1; // so the step line is redrawn for the new mode
    if (mode === 'step') this.showStep(step);
    else this.play(mode === 'scene' ? 0 : this.segments[step].start);
  }

  destroy(): void {
    this.stop();
  }
}

/** Shows the page for the current address, and follows changes to it. */
export function startApp(root: HTMLElement): () => void {
  let page: KnotPage | null = null;
  const show = () => {
    page?.destroy();
    page = null;
    const id = /^#\/k\/([\w-]+)$/.exec(location.hash)?.[1];
    const knot = KNOTS.find((k) => k.id === id);
    if (knot) {
      document.title = `${knot.name} - Knots`;
      page = new KnotPage(root, knot, getMode());
    } else if (location.hash === '#/about') {
      document.title = 'About - Knots';
      showAbout(root);
    } else if (location.hash === '#/settings') {
      document.title = 'Settings - Knots';
      showSettings(root);
    } else {
      document.title = 'Knots';
      root.innerHTML = homeHtml();
      setUpShare(root);
      setUpFilter(root);
    }
    document.documentElement.scrollTop = 0;
  };
  window.addEventListener('hashchange', show);
  show();
  return () => {
    window.removeEventListener('hashchange', show);
    page?.destroy();
  };
}
