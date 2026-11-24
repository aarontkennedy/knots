# Design

The same look as the games app: flat colors, light and dark following the phone, text no
smaller than 18px, buttons at least 44px tall, no emoji. `src/design.test.ts` checks the
sizes.

## The drawings

Every knot is drawn by hand in a 100 by 100 space (`src/knots.ts`) as points that a smooth
curve passes through (`src/rope.ts`). Rope is a dark edge with a light core, so a strand
passing over another shows a gap either side.

- **Laying order.** The rope is drawn from the standing part to the end, and later rope
  lies on top. A knot overrides that with `over` and `under` ranges (in point numbers),
  and `behind` for rope hidden by the post, rail or cleat.
- **Steps.** Each step names the point the rope has reached by its end. The animation lays
  the rope at a steady speed, then the last step pulls the knot tight (its points squeezed
  toward the middle, the ends left long).
- **Two ropes** (square knot, sheet bend) are drawn one after the other in two colors; a rope
  can have its own thickness. **Doubled rope** (figure-eight loop) is drawn as two strands
  with a fold leading, opening into the loop at the end.
- **What it's tied to.** A post, rail, cleat, hook, ring (anchor bend) or another rope
  (prusik). A closed loop of cord (prusik) starts and ends hidden behind the rope it's
  wrapped on, so the join never shows.
- **Checking a knot.** Which piece goes over at each crossing is what makes a knot that knot
  and not another. `crossings()` lists them; `dev.html` marks them; `src/knots.test.ts` pins
  each knot's over-and-under pattern so a change to the points can't quietly break one. A
  figure-eight, for example, must alternate over, under all the way along.

## In use

Each knot also has a zoomed-out scene showing where it's used (`src/scenes.ts`): firewood
for the square knot, a dock post for the bowline, a canoe on a roof rack for the trucker's
hitch, a fishing line for the hook knots, and so on. The knot's own drawing is placed into
the scene, scaled, and turned or mirrored if need be (a mirrored knot is the same knot tied
the other way round), so its crossings stay exactly as drawn and checked. Rope from the
scene (to the boat, the tent, the rod) joins the knot's rope end smoothly along its own
direction, and is drawn at the knot's scale so the outlines match. A scene can end with one
more beat once the knot is tight: the figure-eight slides up against the pulley block it
stops. Scene colors are fixed illustration colors (`.s-*` in `style.css`), like the green
board.

`dev.html?scene=<id>` shows a scene part-laid, laid, pulled tight and at work.

## Watching

Step by step is the default. Play through runs every step with a pause between. In use
plays the same steps in the knot's scene. The buttons sit right under the mode choice and
are the same row in every mode: Back and Next move a step (in Play through and In use they
play on from that step), and the middle one is Again when stepping, or Pause, Play and
Play again when playing. The
choice is remembered. With the phone set to reduce motion, each step shows finished
without animating.

## The list

The chips at the top narrow the list to knots for one job. Each knot has a `level` (1 easy,
2 medium, 3 hard) that isn't shown: a narrowed list puts the easiest knots first, keeping the
list's order among knots of the same level. All shows every knot in the list's order.
