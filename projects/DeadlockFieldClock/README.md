# Deadlock Companion

A static, GitHub Pages-compatible set of second-monitor tools:

- `index.html` - Field Clock for match events and retrigger timers.
- `counterbuy.html` - Counterbuy lineup builder with transcript-derived counter-item recommendations, current price tiers, and shared-utility ranking.
- `movement.html` - Dash-speed bucket roster and interactive air-strafe / bunnyhop trainer.
- `plots.html` - Soul Lab: time-scaling reward curves, creep/wave and box/run comparisons, lane supply rate, and clearly modeled hero milestones with source links.

The project has no build step or external runtime dependencies. Match events and timer behavior live in `app.js`; Counterbuy behavior and recommendation data live in `counterbuy.js`; Movement Lab rendering and simulation live in `movement.js`. Game assets are stored locally in `icons/` and `counterbuy-assets/` so the pages do not depend on hot-linked images.

Soul Lab formulas and the 44-hero roster live in `economy-data.js`; chart rendering and local preferences live in `plots.js`. Nine author-build milestones are currently curated. All other heroes show only shared ability thresholds (plus an optional custom target), not invented hero-specific timings. Minute estimates use an adjustable income model; they are not sourced match statistics. Formulas, guide dates, and modeling limits are available in the page's source drawer. The research snapshot is October 12, 2026; no data updates automatically.

Run the economy formula and asset checks with `node --test economy.test.cjs` from this directory.
