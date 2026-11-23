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

Step by step is the default: Back, Again and Next. Play through runs every step with a
pause between, and can be paused. In use plays the same steps in the knot's scene. The
choice is remembered. With the phone set to reduce motion, each step shows finished
without animating.
