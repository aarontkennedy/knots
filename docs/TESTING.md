# Testing

- `npm test`: Vitest (jsdom) with coverage; lines, branches, functions and statements must
  stay at 95% or more. Covers the rope drawing, every knot's data and crossing pattern, the
  timeline, and both pages.
- `npm run test:e2e`: Playwright on an iPhone 13 (WebKit) and a Pixel 7 (Chromium), against
  the production build: the main flow, playing through, no sideways scrolling on any knot
  page, and (Chromium only, which supports service workers in tests) every knot offline.
- `npm run licenses`: every dependency's license is on the allowed list.
