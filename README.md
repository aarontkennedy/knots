# Knots

An offline phone web app showing ten everyday knots: what each is for, a way to remember
it, and an animation of tying it, step by step or played straight through.

```
npm install
npm run dev        # http://localhost:5173 (also on your phone over Wi-Fi)
npm test           # unit tests with coverage
npm run test:e2e   # iPhone (WebKit) and Android (Chromium) in Playwright
npm run check      # everything CI runs
```

`dev.html` (dev server only, never built) shows every knot with its points numbered and its
crossings listed: use it when drawing a knot. See [docs/DESIGN.md](docs/DESIGN.md) for how
the drawings work, [docs/TESTING.md](docs/TESTING.md) and [docs/LEGAL.md](docs/LEGAL.md).
