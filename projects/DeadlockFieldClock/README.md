# Deadlock Companion

A static, GitHub Pages-compatible set of second-monitor tools:

- `index.html` - Field Clock for match events and retrigger timers.
- `counterbuy.html` - Counterbuy lineup builder with transcript-derived counter-item recommendations, current price tiers, and shared-utility ranking.
- `movement.html` - Dash-speed bucket roster and interactive air-strafe / bunnyhop trainer.
- `plots.html` - Soul Lab: time-scaling reward curves, creep/wave and box/run comparisons, lane supply rate, and clearly modeled hero milestones with source links.

The project has no build step or external runtime dependencies. Match events and timer behavior live in `app.js`; Counterbuy behavior and recommendation data live in `counterbuy.js`; Movement Lab rendering and simulation live in `movement.js`. Game assets are stored locally in `icons/` and `counterbuy-assets/` so the pages do not depend on hot-linked images.

Soul Lab formulas and the 44-hero roster live in `economy-data.js`; chart rendering and local preferences live in `plots.js`. Nine author-build milestones are currently curated. All other heroes show only shared ability thresholds (plus an optional custom target), not invented hero-specific timings. Minute estimates use an adjustable income model; they are not sourced match statistics. Formulas, guide dates, and modeling limits are available in the page's source drawer. Economy rewards were reviewed November 4, 2026, through the October 30 gameplay patch; curated hero guides retain their October 12 snapshot and individual source dates. No data updates automatically.

Run the economy formula and asset checks with `node --test economy.test.cjs` from this directory.

The first plot also compares small, medium and large camps and equal-worth hero kills. Camp curves are explicit composition estimates (3S; S+2M; 2L+M), not a map-location-weighted survey. Kill rewards default to solo credit (125% of base), with an optional base-bounty view and a cap at 40 minutes. These exclude comeback, first-kill, assist and hero-specific bonuses. Each reward curve can be hidden independently; the remaining curves rescale automatically.

October 30 economy coefficients: small Haunt 45 + 0.49/min; medium 75 + 0.81/min; large 199 + 2.15/min; normal box 23 + 1.8/min (60% drop chance). These published coefficients are continuous approximations before individual payout rounding. The source drawer also records the new Mid-Boss/Rejuvenator rewards and the changed comeback/haunted-soul rules, which are outside the plotted baseline model.
