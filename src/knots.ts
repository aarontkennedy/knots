// The knots: what each is for, a way to remember it, and its rope drawn step by step.
// Drawings are the app's own, in a 100 by 100 space (y counts down the page).
import type { Point, Rope, Tight } from './rope';

export interface Step {
  /** The rope (for knots joining two) and the point it has reached by the end of this step. */
  rope?: number;
  at: number;
  text: string;
}

/** What the knot is tied to, drawn between the rope behind it and the rope in front. */
export interface Prop {
  /**
   * For a hook, (x, y) is the middle of the eye, w its radius and h the shank's length. For a
   * ring, (x, y) is its middle, w its radius and h the metal's thickness. For a rope, (x, y)
   * is its left end, w its length and h its thickness.
   */
  kind: 'rail' | 'post' | 'cleat' | 'hook' | 'ring' | 'rope';
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What someone might need a knot for: the filters on the list. */
export const TASKS = [
  { id: 'tie', label: 'Tie to a post or ring' },
  { id: 'loop', label: 'Make a loop' },
  { id: 'join', label: 'Join two ropes' },
  { id: 'tighten', label: 'Pull a line tight' },
  { id: 'load', label: 'Tie down a load' },
  { id: 'stop', label: 'Stop an end slipping' },
  { id: 'bundle', label: 'Tie around a bundle' },
  { id: 'grip', label: 'Grip a rope or pole' },
  { id: 'hook', label: 'Tie on a fishing hook' },
] as const;

export type Task = (typeof TASKS)[number]['id'];

export interface Knot {
  id: string;
  name: string;
  /** The jobs it's good for (TASKS). */
  tasks: Task[];
  /** One line: what it does. */
  summary: string;
  uses: string[];
  /** A way to remember how to tie it. */
  remember: string;
  ropes: Rope[];
  steps: Step[];
  /** The knot pulled tight, the last step. */
  tight: Tight;
  tightText: string;
  prop?: Prop;
  /** Rope thickness (default 4). */
  width?: number;
}

/** Moves and scales points (for drawing one knot from another's shape). */
const place = (pts: readonly Point[], scale: number, dx: number, dy: number, about: Point = [50, 50]): Point[] =>
  pts.map(([x, y]) => [about[0] + (x - about[0]) * scale + dx, about[1] + (y - about[1]) * scale + dy]);

// The figure-eight's path: a loop over the standing part, around behind it, and down through
// the loop. Its crossings go over, under, over, under: that's what makes it a figure-eight.
const EIGHT: Point[] = [
  [4, 40], [20, 40], [32, 40], [46, 40], [60, 41], [70, 50], [68, 63], [56, 70], [44, 66], [39, 54],
  [36, 32], [30, 24], [21, 27], [21, 48], [27, 56], [46, 52], [52, 46], [54, 34],
];
const EIGHT_UNDER: [number, number][] = [[12.4, 13.4], [16.4, 17.4]];

// --- Fishing knots: line tied to a hook. Wraps are laid out here, not point by point. ---

/** A range `half` a point either side of each of `at` (around a crossing). */
const around = (at: number[], half = 0.35): [number, number][] => at.map((a) => [a - half, a + half]);

// Improved clinch: through the eye, five turns around the line, back through the small loop
// by the eye, then up through the big loop.
const CLINCH_TURNS = 5;
const CLINCH: Point[] = [
  [50, 2], [50, 24], [50, 44], [50, 58], [50, 66], [50, 76], [53, 81], [58, 77], [58, 66], [57, 53],
  ...Array.from({ length: CLINCH_TURNS }, (_, i): Point[] => {
    const b = 47 - 8 * i;
    return [[50, b], [44, b - 2], [50, b - 4], [56, b - 6]];
  }).flat(),
  [60, 5], [64, 9], [64, 40], [64, 54], [58, 58.5], [46, 58.5], [42, 55], [44, 51], [52, 51], [60, 51], [68, 51], [74, 52],
];
const CLINCH_END = 10 + 4 * CLINCH_TURNS; // the first point after the turns

// Uni: through the eye, the end laid back up the line, a loop, and six turns inside it.
const UNI_TURNS = 5;
const UNI: Point[] = [
  [48, 2], [48, 30], [48, 50], [49, 62], [52, 74], [56, 78], [58, 72], [55, 60], [55, 40], [55, 22],
  [52, 13], [45, 12], [36, 18], [33, 36], [35, 54], [42, 60],
  ...Array.from({ length: UNI_TURNS }, (_, i): Point[] => [[60, 57 - 7 * i], [42, 53.5 - 7 * i]]).flat(),
  [32, 24],
];

// Snell, worked out from the line's end back to the line (so it draws in tying order): the
// end along the shank and through the eye, turns down the shank, and the line back up under
// them and out by the eye.
const SNELL_TURNS = 6;
const SNELL_LINE: Point[] = [
  [57, 2], [58, 12], [55, 30], [53, 50], [53, 70], [55, 77], [59, 76],
  ...Array.from({ length: SNELL_TURNS }, (_, i): Point[] => [[58, 74 - 8 * i], [42, 70 - 8 * i]]).flat(),
  [52, 26], [50, 15], [47, 8], [41, 11], [44, 23], [46, 35], [47, 55], [47, 72], [47, 86],
];
const SNELL_LAST = SNELL_LINE.length - 1;
/** Reverses a range of points along SNELL_LINE, for the reversed path. */
const flip = ([a, b]: readonly [number, number]): [number, number] => [SNELL_LAST - b, SNELL_LAST - a];
const SNELL_BEHIND: [number, number][] = [
  ...Array.from({ length: SNELL_TURNS - 1 }, (_, i): [number, number] => [8 + 2 * i + 0.05, 9 + 2 * i - 0.05]),
  [6 + 2 * SNELL_TURNS + 0.05, 7 + 2 * SNELL_TURNS + 0.6] as [number, number],
].map(flip);

export const KNOTS: Knot[] = [
  {
    id: 'square',
    tasks: ['join', 'bundle'],
    name: 'Square knot',
    summary: 'Ties two ends together snugly around something, like a bundle or a bandage.',
    uses: ['Tying up a bundle, a bag or a sail', 'Finishing a bandage or sling', 'Tying shoelaces (the bow is a square knot with loops)'],
    remember: 'Right over left and under, then left over right and under. Each end should come out beside its own rope; if not, it’s a granny knot and will slip. Not for joining two ropes that will take a load.',
    ropes: [
      { points: [[4, 36], [30, 36], [50, 36], [62, 38], [68, 50], [62, 62], [50, 64], [30, 64], [4, 64]] },
      {
        color: 'b',
        points: [[96, 56], [80, 56], [64, 56], [54, 62], [46, 72], [34, 72], [28, 50], [34, 28], [46, 28], [54, 38], [64, 44], [80, 44], [96, 44]],
        under: [[2.8, 3.9], [8.2, 9.3]],
      },
    ],
    steps: [
      { rope: 0, at: 8, text: 'Fold one end into a U.' },
      { rope: 1, at: 6, text: 'Lay the other end in over the bend of the U, under its lower side, and back over it.' },
      { rope: 1, at: 12, text: 'Go over the top side, back under it, and out over the bend, beside where it came in.' },
    ],
    tight: { at: [48, 50], scale: [0.45, 0.55] },
    tightText: 'Pull both ends of each rope to tighten.',
  },
  {
    id: 'bowline',
    tasks: ['tie', 'loop'],
    name: 'Bowline',
    summary: 'A fixed loop in the end of a rope that won’t slip, and unties easily afterwards.',
    uses: ['A loop to drop over a post or a cleat', 'Tying a rope around a tree or a person', 'Tying a line to a ring or a mooring'],
    remember: 'Make a small loop: the rabbit hole. The rabbit comes up the hole, runs around the back of the tree, and goes back down the hole.',
    ropes: [
      {
        points: [
          [50, 2], [50, 14], [50, 24], [50, 34], [56, 44], [54, 56], [44, 61], [35, 55], [33, 44], [40, 35],
          [52, 32], [64, 36], [72, 48], [72, 66], [64, 82], [50, 90], [34, 86], [24, 72], [24, 60], [30, 54],
          [42, 46], [44, 30], [44, 18], [50, 12], [58, 12], [61, 20], [58, 28], [50, 44], [49, 54], [48, 66], [47, 74],
        ],
        under: [[18.8, 19.8], [22.5, 23.5], [28, 29]],
      },
    ],
    steps: [
      { at: 11, text: 'Make a small loop, with the end side on top. This is the rabbit hole.' },
      { at: 21.5, text: 'Leave a big loop below. Bring the end up through the hole from underneath.' },
      { at: 25.5, text: 'Take it around behind the standing part: the tree.' },
      { at: 30, text: 'Back down the hole, beside itself.' },
    ],
    tight: { at: [48, 36], scale: [0.6, 0.55], keep: [[0, 13, 14, 15, 16]] },
    tightText: 'Hold the end with its side of the loop, and pull the standing part to tighten.',
  },
  {
    id: 'clove',
    tasks: ['tie', 'bundle'],
    name: 'Clove hitch',
    summary: 'A quick hitch around a post or rail that’s easy to adjust.',
    uses: ['Tying a boat to a post for a short stop', 'Starting a lashing on a pole', 'Hanging something from a rail'],
    remember: 'Two turns that cross in an X, with the end tucked under the X.',
    prop: { kind: 'rail', x: 4, y: 42, w: 92, h: 16 },
    ropes: [
      {
        points: [[40, 98], [40, 78], [40, 60], [40, 50], [40, 40], [44, 38], [48, 46], [54, 54], [58, 61], [59, 50], [59, 40], [56, 41], [52, 50], [48, 60], [47, 78], [47, 98]],
        behind: [[2.2, 4.6], [8.4, 10.6]],
        under: [[11.4, 12.6]],
      },
    ],
    steps: [
      { at: 8.2, text: 'Take the end around the rail.' },
      { at: 11, text: 'Cross over the first turn and go around again.' },
      { at: 15, text: 'Tuck the end under the crossing.' },
    ],
    tight: { at: [50, 50], scale: [0.6, 1] },
    tightText: 'Pull both ends to tighten. It shows an X on this side.',
  },
  {
    id: 'halfhitches',
    tasks: ['tie', 'load'],
    name: 'Two half hitches',
    summary: 'Ties a rope to a ring, post or rail, quickly and securely.',
    uses: ['Tying a line to a ring or a tree', 'Hanging a tarp or a bear bag', 'Finishing off other knots, like the trucker’s hitch'],
    remember: 'Around the post, then wrap the end around the rope twice, both times the same way.',
    prop: { kind: 'post', x: 8, y: 14, w: 14, h: 72 },
    ropes: [
      {
        points: [
          [98, 44], [70, 44], [40, 44], [22, 44], [14, 44], [5, 48], [10, 56], [22, 58], [36, 58], [48, 54],
          [46, 44], [40, 36], [33, 40], [32, 48], [36, 58], [44, 64], [60, 64], [70, 58], [68, 44], [62, 36],
          [55, 40], [54, 48], [58, 60], [66, 70], [82, 74],
        ],
        behind: [[3.1, 5.6]],
        under: [[12.2, 13], [13.6, 14.4], [20.2, 21.2], [21.6, 22.4]],
      },
    ],
    steps: [
      { at: 8, text: 'Take the end around the post.' },
      { at: 15, text: 'Bring it over the rope, around behind, and tuck it under itself: one half hitch.' },
      { at: 24, text: 'Make a second half hitch the same way.' },
    ],
    tight: { at: [22, 50], scale: [0.6, 0.8], keep: [[0, 3, 4, 5, 6, 7, 24]] },
    tightText: 'Slide the hitches up against the post and pull to tighten.',
  },
  {
    id: 'figure8',
    tasks: ['stop'],
    name: 'Figure-eight stopper',
    summary: 'A chunky knot in the end of a rope that stops it slipping through a hole.',
    uses: ['Stopping a rope pulling out of a pulley, cleat or grommet', 'The end of a sheet or halyard on a boat', 'A quick knot you can always untie'],
    remember: 'Make a loop, go around the standing part, and come back down through the loop: it makes an 8.',
    ropes: [{ points: [...EIGHT, [60, 24], [80, 18]], under: EIGHT_UNDER }],
    steps: [
      { at: 9.5, text: 'Make a loop: bring the working end back over the standing part.' },
      { at: 12.6, text: 'Take it around behind the standing part.' },
      { at: 19, text: 'Bring it down into the loop and out the top.' },
    ],
    tight: { at: [45, 47], scale: [0.5, 0.5] },
    tightText: 'Pull both ends to tighten.',
  },
  {
    id: 'figure8loop',
    tasks: ['loop'],
    name: 'Figure-eight loop',
    summary: 'A strong fixed loop that’s easy to check by eye.',
    uses: ['Clipping a rope to a carabiner', 'A loop to hang a bag or a pulley from', 'Climbing (the follow-through version)'],
    remember: 'It’s a figure-eight stopper tied with the rope folded in two.',
    width: 3,
    ropes: [
      {
        points: place([...EIGHT, [58, 26], [66, 20], [76, 16], [86, 14]], 1.1, -2, 4),
        under: [[12, 13.9], [16, 17.9]],
        double: { gap: 4.4, eye: 18.6, eyeGap: 20 },
      },
    ],
    steps: [
      { at: 9.5, text: 'Fold the rope in two. Make a loop with the fold, over the doubled rope.' },
      { at: 12.6, text: 'Take the fold around behind.' },
      { at: 17.5, text: 'Bring it down into the loop and out the top.' },
      { at: 21, text: 'Open out the fold into the size of loop you need.' },
    ],
    tight: { at: [45, 50], scale: [0.55, 0.55], keep: [[0, 19, 20, 21]] },
    tightText: 'Pull all four strands to tighten, keeping them side by side.',
  },
  {
    id: 'sheetbend',
    tasks: ['join'],
    name: 'Sheet bend',
    summary: 'Joins two ropes, even of different thicknesses.',
    uses: ['Making a rope longer with another one', 'Joining a thin line to a thick one', 'Tying a rope to the corner of a tarp'],
    remember: 'Make a U in the thicker rope. The thin rope comes up through the U, around the back of both sides, and tucks under itself.',
    ropes: [
      {
        width: 5.2,
        points: [[4, 24], [16, 24], [28, 24], [40, 24], [46, 30], [54, 42], [70, 44], [82, 44], [88, 50], [88, 58], [80, 61], [72, 58], [56, 50], [46, 49], [34, 48], [24, 47], [12, 46]],
        over: [[3.8, 4.8], [7.5, 8.5], [12.9, 13.9]],
      },
      {
        color: 'b',
        width: 3.2,
        points: [[98, 50], [86, 50], [76, 50], [66, 50], [56, 56], [44, 54], [39, 44], [45, 35], [56, 33], [65, 40], [68, 52], [64, 64], [56, 74], [46, 80]],
        under: [[9.5, 10.05]],
      },
    ],
    steps: [
      { rope: 0, at: 16, text: 'Make a U in the thicker rope.' },
      { rope: 1, at: 4.5, text: 'Bring the other rope up through the U.' },
      { rope: 1, at: 9, text: 'Take it around behind both sides of the U.' },
      { rope: 1, at: 13, text: 'Tuck it under itself.' },
    ],
    tight: { at: [62, 46], scale: [0.6, 0.6] },
    tightText: 'Pull the standing parts to tighten. Both short ends should be on the same side.',
  },
  {
    id: 'tautline',
    tasks: ['tie', 'tighten'],
    name: 'Taut-line hitch',
    summary: 'A loop that slides to tighten a line, then holds.',
    uses: ['Tent and tarp guy lines', 'A clothesline you can tighten', 'Tying down a load, then adjusting it'],
    remember: 'Around the stake, two wraps inside the loop, one wrap outside. Slide the knot to tighten the line.',
    prop: { kind: 'post', x: 8, y: 14, w: 14, h: 72 },
    ropes: [
      {
        points: [
          [98, 36], [80, 36], [40, 36], [22, 36], [14, 36], [5, 44], [10, 58], [22, 60], [50, 60], [66, 60],
          [72, 52], [67, 30], [61, 28], [59, 40], [57, 46], [53, 30], [47, 28], [45, 40], [44, 48], [56, 52],
          [74, 52], [86, 46], [86, 30], [80, 28], [78, 40], [80, 56], [80, 72],
        ],
        behind: [[3.1, 5.6]],
        under: [[12.4, 13.4], [16.4, 17.4], [23.4, 24.4], [24.6, 25.4]],
      },
    ],
    steps: [
      { at: 9, text: 'Take the end around the stake.' },
      { at: 18.5, text: 'Wrap it twice around the line, inside the loop, working toward the stake.' },
      { at: 21, text: 'Cross back over the wraps.' },
      { at: 26, text: 'Wrap once more outside the loop and tuck the end under itself.' },
    ],
    tight: { at: [62, 42], scale: [0.7, 0.8], keep: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 26]] },
    tightText: 'Slide the knot along the line to tighten it. It holds where you leave it.',
  },
  {
    id: 'trucker',
    tasks: ['tighten', 'load'],
    name: 'Trucker’s hitch',
    summary: 'A rope pulley for pulling a line really tight, then tying it off.',
    uses: ['Tying a canoe or a load onto a roof rack', 'Pulling a ridge line tight for a tarp', 'Tying down a load in a trailer'],
    remember: 'Make a loop in the line, go around the hook, back through the loop, pull down hard, and tie it off with two half hitches.',
    width: 3,
    prop: { kind: 'rail', x: 26, y: 84, w: 70, h: 8 },
    ropes: [
      {
        // An overhand knot with a fold pushed through instead of the end (a slipped overhand)
        // makes the pulley loop; the end goes round the hook and back through it.
        points: [
          [2, 56], [14, 56], [28, 56], [46, 56], [60, 54], [66, 44], [62, 30], [50, 22], [36, 24], [28, 34],
          [28, 48], [30, 64], [38, 72], [46, 70], [48, 60], [50, 46], [58, 40], [70, 38], [80, 38], [84, 44],
          [80, 50], [70, 50], [60, 50], [54, 58], [54, 70], [55, 82], [56, 90], [60, 97], [66, 90], [68, 76],
          [72, 60], [74, 48], [77, 42], [86, 36], [92, 44], [92, 60], [90, 78],
        ],
        under: [[10.2, 10.9], [16.1, 16.9], [22.2, 23], [30.5, 31.2]],
        behind: [[25.1, 26.6]],
      },
    ],
    steps: [
      { at: 11, text: 'Make a loop in the line.' },
      { at: 23, text: 'Push a fold of rope through the loop. The fold is your pulley.' },
      { at: 29, text: 'Take the end around the hook and back up.' },
      { at: 36, text: 'Pass it through the pulley and pull down hard.' },
    ],
    tight: { at: [50, 50], scale: [1, 1] },
    tightText: 'Hold it tight and tie it off with two half hitches around the lines below the pulley.',
  },
  {
    id: 'cleat',
    tasks: ['tie'],
    name: 'Cleat hitch',
    summary: 'Ties a boat’s line to a cleat on a dock, quick to tie and untie.',
    uses: ['Tying up a boat at a dock', 'Tying off a halyard or sheet on a boat', 'Tying a canoe line to a cleat'],
    remember: 'Go around the far horn, then make a figure-eight across the top, and finish with a flipped loop over the horn.',
    prop: { kind: 'cleat', x: 18, y: 44, w: 64, h: 12 },
    ropes: [
      {
        points: [
          [6, 92], [30, 74], [62, 62], [74, 58], [77, 50], [74, 40], [62, 38], [40, 38], [26, 40], [23, 50],
          [28, 61], [38, 59], [50, 50], [62, 42], [72, 38], [78, 46], [74, 60], [62, 58], [50, 50], [38, 42],
          [30, 38], [20, 42], [18, 52], [22, 58], [32, 50], [40, 42], [46, 34],
        ],
        behind: [[3.6, 5.4], [8.6, 10.4], [14.6, 16.4], [20.5, 22.6]],
        under: [[24.3, 25.3]],
      },
    ],
    steps: [
      { at: 11, text: 'Take the line around the far horn, then around the base.' },
      { at: 20, text: 'Cross over the top and around the other horn: a figure-eight.' },
      { at: 26, text: 'Make a loop with the end underneath, and drop it over the horn.' },
    ],
    tight: { at: [50, 50], scale: [1, 1] },
    tightText: 'Pull the line to tighten.',
  },
  {
    id: 'roundturn',
    tasks: ['tie', 'load'],
    name: 'Round turn and two half hitches',
    summary: 'Ties a line to a post, tree or ring so it holds hard pulls and still unties.',
    uses: ['Tying a canoe’s painter to a tree or a ring', 'A bear bag line or a hammock strap to a tree', 'Tying off a line that’s already pulling: the turns take the strain while you tie'],
    remember: 'Two full turns around the post take the pull. Then two half hitches around the line, both the same way.',
    prop: { kind: 'post', x: 8, y: 14, w: 14, h: 72 },
    ropes: [
      {
        points: [
          [98, 40], [70, 40], [40, 40], [22, 40], [14, 40], [5, 43], [9, 48], [16, 49], [24, 51], [16, 54],
          [5, 56], [10, 60], [22, 62], [36, 62], [48, 58], [46, 40], [40, 32], [33, 36], [32, 44], [36, 62],
          [44, 68], [60, 68], [70, 62], [68, 40], [62, 32], [55, 36], [54, 44], [58, 64], [66, 74], [82, 78],
        ],
        behind: [[3.1, 5.6], [8.1, 10.6]],
        under: [[17.2, 18], [18.6, 19.4], [25.2, 26.2], [26.6, 27.4]],
      },
    ],
    steps: [
      { at: 12, text: 'Take the end around the post twice: a round turn.' },
      { at: 20, text: 'Bring it over the line, around behind, and tuck it under itself: one half hitch.' },
      { at: 29, text: 'Make a second half hitch the same way.' },
    ],
    tight: { at: [22, 50], scale: [0.6, 0.8], keep: [[0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 29]] },
    tightText: 'Slide the hitches up toward the post and pull to tighten.',
  },
  {
    id: 'anchor',
    tasks: ['tie', 'load'],
    name: 'Anchor bend',
    summary: 'Ties a line to a ring so it holds even when it jerks and slackens, like an anchor line.',
    uses: ['Tying a line to an anchor’s ring', 'Tying a canoe or boat line to a mooring ring', 'Any ring tie that will tug and go slack over and over'],
    remember: 'A round turn on the ring, then the end goes around the line and back under both turns, and finishes with a half hitch.',
    prop: { kind: 'ring', x: -15, y: 50, w: 30, h: 9 },
    ropes: [
      {
        points: [
          [98, 30], [70, 30], [40, 30], [24, 30], [15, 30], [5, 35], [8, 42], [15, 43], [24, 45], [15, 49],
          [5, 52], [9, 57], [22, 58], [38, 58], [50, 52], [50, 30], [44, 21], [36, 23], [33, 32], [27, 37],
          [17, 38], [14, 48], [15, 60], [20, 68], [36, 72], [56, 70], [66, 60], [68, 44], [68, 30], [62, 22],
          [55, 26], [54, 38], [58, 60], [66, 74], [82, 80],
        ],
        behind: [[3.1, 5.6], [8.1, 10.6]],
        under: [[17.45, 18.05], [20.2, 22.1], [30.1, 30.7], [32.1, 32.75]],
      },
    ],
    steps: [
      { at: 12, text: 'Take the end around the ring twice: a round turn.' },
      { at: 18, text: 'Bring it over the line and around behind it.' },
      { at: 23, text: 'Tuck it back under both turns, between them and the ring.' },
      { at: 34, text: 'Finish with a half hitch around the line.' },
    ],
    tight: { at: [24, 50], scale: [0.6, 0.8], keep: [[0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 34]] },
    tightText: 'Pull the line to snug the turns down on the ring, then slide the half hitch up.',
  },
  {
    id: 'timber',
    tasks: ['tie', 'bundle'],
    name: 'Timber hitch',
    summary: 'Grips a log or a bundle while you pull, and falls apart when you stop.',
    uses: ['Dragging a log or a bundle of branches', 'Starting a lashing on a pole', 'Lifting or lowering something round, like a tree trunk'],
    remember: 'Around the log, around the line, then twist the end around itself three times. The twists hold it; pulling the line locks them.',
    prop: { kind: 'post', x: 8, y: 14, w: 14, h: 72 },
    ropes: [
      {
        points: [
          [98, 40], [80, 40], [50, 40], [22, 40], [14, 40], [5, 48], [10, 58], [22, 60], [42, 60], [62, 60],
          [76, 60], [84, 54], [84, 44], [82, 34], [76, 30], [71, 34], [71, 44], [70, 52], [66, 68], [60, 52],
          [54, 68], [48, 52], [42, 68], [36, 52], [32, 48],
        ],
        behind: [[3.1, 5.6]],
        under: [[15.3, 15.9], [17.15, 17.75], [19.2, 19.8], [21.2, 21.8]],
      },
    ],
    steps: [
      { at: 10, text: 'Take the end around the log.' },
      { at: 17, text: 'Bring it around the line.' },
      { at: 24, text: 'Twist the end around its own rope three times, working back toward the log.' },
    ],
    tight: { at: [22, 50], scale: [0.6, 0.75], keep: [[0, 1, 2, 3, 4, 5, 6]] },
    tightText: 'Pull the line: the loop grips the log and the twists jam against each other.',
  },
  {
    id: 'rolling',
    tasks: ['grip', 'tie'],
    name: 'Rolling hitch',
    summary: 'Ties a line to a pole or another rope so it holds when pulled along it.',
    uses: ['Pulling along a pole or a rope without the knot sliding', 'Taking the strain off a jammed line so you can free it', 'Tying a tarp line to a pole at an angle'],
    remember: 'Two turns toward the pull, each inside the line. Then cross back over and finish like a clove hitch.',
    prop: { kind: 'rail', x: 4, y: 42, w: 92, h: 16 },
    ropes: [
      {
        points: [
          [-2, 72], [20, 67], [40, 62.5], [50, 60.5], [53, 54], [53, 44], [55, 37], [50, 48], [45, 60], [43, 66],
          [40, 58], [38, 44], [35, 37], [31, 50], [27, 62], [25, 67], [22, 58], [21, 44], [25, 37], [40, 46],
          [55, 56], [66, 64], [69, 66], [71, 56], [71, 44], [68, 37], [63, 44], [59, 53], [56, 62], [55, 76],
          [55, 96],
        ],
        behind: [[3.6, 5.9], [9, 11.9], [15, 17.9], [22, 24.9]],
        under: [[8, 8.5], [14.2, 14.75], [27.25, 27.85]],
      },
    ],
    steps: [
      { at: 9, text: 'Take the end around the pole, coming down inside the line (between it and the pole).' },
      { at: 15, text: 'Go around again beside the first turn, toward the pull, and inside the line again.' },
      { at: 22, text: 'Cross back over both turns and the line.' },
      { at: 30, text: 'Go around once more and tuck the end under that crossing, like a clove hitch.' },
    ],
    tight: { at: [48, 50], scale: [0.7, 1], keep: [[0, 1, 29, 30]] },
    tightText: 'Snug it before you load it. Pulled along the pole toward the two turns, it grips.',
  },
  {
    id: 'prusik',
    tasks: ['grip'],
    name: 'Prusik knot',
    summary: 'A loop of cord wrapped around a rope: it slides when you push it and grips when you pull.',
    uses: ['Sliding a tarp along a ridgeline, then having it stay put', 'A handle or hang point you can move along a rope', 'Climbing and rescue (learn those from an instructor)'],
    remember: 'Wrap the loop around the rope three times, through itself each time. Keep the wraps neat and side by side.',
    width: 2.4,
    prop: { kind: 'rope', x: -2, y: 40, w: 104, h: 4.4 },
    ropes: [
      {
        color: 'b',
        plainEnd: true,
        points: [
          // Starts behind the rope, along the back, so the joins in the loop are out of sight.
          [17, 39.6], [50, 40], [83, 39.6], [87, 43], [82, 47], [77, 33], [72, 47], [67, 33], [62, 47], [57, 33],
          [53, 48], [54, 56], [56, 72], [55, 85], [50, 88], [45, 85], [44, 72], [46, 56], [47, 48], [43, 33],
          [38, 47], [33, 33], [28, 47], [23, 33], [18, 47], [13, 43], [17, 39.6],
        ],
        behind: [[0, 4], [5, 6], [7, 8], [9, 10], [18, 19], [20, 21], [22, 23], [24, 26]],
      },
    ],
    steps: [
      { at: 5, text: 'Lay a loop of cord, thinner than the rope, behind the rope. Bring one end over the front.' },
      { at: 10, text: 'Wrap it around the rope three times in all, passing through the loop each time.' },
      { at: 18, text: 'The end comes out of the middle of the wraps: that’s the loop you hang things from.' },
      { at: 26, text: 'The wraps lie side by side, three either side of the middle, with the loop across the back.' },
    ],
    tight: { at: [50, 40], scale: [0.6, 0.8], keep: [[12, 13, 14, 15, 16]] },
    tightText: 'Snug the wraps tight and neat. Pull the loop and it grips; push the knot itself and it slides.',
  },
  {
    id: 'clinch',
    tasks: ['hook'],
    name: 'Improved clinch knot',
    summary: 'The classic knot for tying a hook or lure to monofilament line.',
    uses: ['Hooks, lures and swivels on monofilament', 'Light to medium line', 'Quick to tie once your fingers know it'],
    remember: 'Through the eye, five turns around the line, back through the little loop by the eye, then up through the big loop. That last tuck is the \u201cimproved\u201d part.',
    width: 2.6,
    prop: { kind: 'hook', x: 50, y: 70, w: 4.5, h: 18 },
    ropes: [
      {
        points: CLINCH,
        behind: [[4.6, 5.5]],
        under: [...around(Array.from({ length: CLINCH_TURNS }, (_, i) => 12 + 4 * i), 0.36), ...around([CLINCH_END + 4.67, CLINCH_END + 9.5], 0.3)],
      },
    ],
    steps: [
      { at: 9, text: 'Pass the end through the eye of the hook and back up beside the line.' },
      { at: CLINCH_END - 1, text: 'Wrap the end around the line five times.' },
      { at: CLINCH_END + 6, text: 'Bring it back down and through the small loop just above the eye.' },
      { at: CLINCH_END + 11, text: 'Then up through the big loop you just made.' },
    ],
    tight: { at: [50, 60], scale: [0.8, 0.55], keep: [[0, 3, 4, 5, 6, 7, 8]] },
    tightText: 'Wet it, then pull the line so the turns snug down against the eye. Trim the end.',
  },
  {
    id: 'palomar',
    tasks: ['hook'],
    name: 'Palomar knot',
    summary: 'A very strong, simple hook knot, and the one to use with braided line.',
    uses: ['Braided line, which slips in other knots', 'Hooks and lures with an eye big enough for doubled line', 'A strong knot that\u2019s easy to tie right'],
    remember: 'Double the line, push the loop through the eye, tie a loose overhand knot, and pass the hook through the loop.',
    width: 2.4,
    prop: { kind: 'hook', x: 50, y: 62, w: 4.5, h: 26 },
    ropes: [
      {
        points: [
          [44, 2], [44, 20], [45, 38], [47, 52], [49.5, 58], [51, 69], [56, 74], [62, 68], [61, 56], [58, 44],
          [54, 32], [48, 26], [40, 23], [34, 28], [36, 36], [52, 42], [64, 46], [70, 56], [68, 70], [60, 80],
          [53, 87], [50, 92],
        ],
        behind: [[4.6, 5.4], [18.6, 21]],
        under: [[11, 12], [15.1, 16]],
        double: { gap: 3.6, eye: 19, eyeGap: 10 },
      },
    ],
    steps: [
      { at: 6, text: 'Double the line and push the loop through the eye.' },
      { at: 16, text: 'Tie a loose overhand knot with the loop around the doubled line.' },
      { at: 21, text: 'Pass the loop over the hook, so it goes around behind it.' },
    ],
    tight: { at: [50, 60], scale: [0.6, 0.55], keep: [[0, 4, 5]] },
    tightText: 'Wet it and pull both ends so the loop snugs up around the eye. Trim the end.',
  },
  {
    id: 'uni',
    tasks: ['hook', 'join'],
    name: 'Uni knot',
    summary: 'One knot that ties on a hook and, doubled up, joins two lines.',
    uses: ['Hooks, lures and swivels on any kind of line', 'Joining two lines: a uni knot in each, pulled together', 'Tying line onto a reel'],
    remember: 'Through the eye, lay the end back along the line, make a loop, and wrap through the loop five or six times around both lines.',
    width: 2.6,
    prop: { kind: 'hook', x: 51, y: 68, w: 4.5, h: 18 },
    ropes: [
      {
        points: UNI,
        behind: [[3.6, 4.4]],
        under: Array.from({ length: UNI_TURNS }, (_, i): [number, number] => [16 + 2 * i + 0.17, 16 + 2 * i + 0.78]),
      },
    ],
    steps: [
      { at: 9, text: 'Pass the end through the eye and lay it back up beside the line.' },
      { at: 15, text: 'Bring it over and down, making a loop beside the two lines.' },
      { at: UNI.length - 1, text: 'Wrap the end around both lines, inside the loop, five or six times.' },
    ],
    tight: { at: [50, 50], scale: [0.7, 0.6], keep: [[0, 3, 4, 5, 6]] },
    tightText: 'Wet it and pull the end to snug the turns, then pull the line to slide the knot down to the eye. Trim the end.',
  },
  {
    id: 'snell',
    tasks: ['hook'],
    name: 'Snell knot',
    summary: 'Wraps the line around the hook\u2019s shank so it pulls straight along the hook.',
    uses: ['Bait hooks, especially ones with turned-up or turned-down eyes', 'Circle hooks, where a straight pull helps them set', 'Tying hooks onto leaders before a trip'],
    remember: 'The end lies along the shank, the turns go around the shank and the end from the eye down, and the line comes out by the eye.',
    width: 2.6,
    prop: { kind: 'hook', x: 50, y: 18, w: 4.5, h: 63 },
    ropes: [
      {
        points: [...SNELL_LINE].reverse(),
        behind: SNELL_BEHIND,
        under: [flip([2.1, 6.95])],
      },
    ],
    steps: [
      { at: SNELL_LAST - 19, text: 'Lay the end along the shank and pass it through the eye.' },
      { at: SNELL_LAST - 7, text: 'Wrap the line around the shank and the end, from the eye down toward the bend: six turns.' },
      { at: SNELL_LAST, text: 'Pull the line: the rest of the loop slides up under the turns and out by the eye.' },
    ],
    tight: { at: [50, 50], scale: [0.7, 1], keep: [[0, SNELL_LAST - 1, SNELL_LAST]] },
    tightText: 'Wet it and pull the line and the end so the turns bed down. The line now pulls straight along the hook.',
  },
];
