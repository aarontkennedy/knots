# Knots

An offline phone web app showing useful knots (ten everyday ones, five for camping and canoeing, and four fishing knots): what each is for, a way to remember
it, and an animation of tying it, step by step or played straight through.

```
npm install
npm run dev        # http://localhost:5173 (also on your phone over Wi-Fi)
npm test           # unit tests with coverage
npm run test:e2e   # iPhone (WebKit) and Android (Chromium) in Playwright
npm run check      # everything CI runs
```

`dev.html` (dev server only, never built) shows every knot with its points numbered and its
crossings listed: use it when drawing a knot. `dev.html?scene=<id>` shows a knot's "in use"
scene at four moments, and `?scene=all` every scene finished. See [docs/DESIGN.md](docs/DESIGN.md) for how
the drawings work, [docs/TESTING.md](docs/TESTING.md) and [docs/LEGAL.md](docs/LEGAL.md).
