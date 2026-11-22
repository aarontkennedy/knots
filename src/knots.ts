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
  kind: 'rail' | 'post' | 'cleat';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Knot {
  id: string;
  name: string;
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

export const KNOTS: Knot[] = [
  {
    id: 'square',
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
];
