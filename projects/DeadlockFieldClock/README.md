# Deadlock Companion

A static, GitHub Pages-compatible pair of second-monitor tools:

- `index.html` - Field Clock for match events and retrigger timers.
- `counterbuy.html` - Counterbuy lineup builder with transcript-derived counter-item recommendations, current price tiers, and shared-utility ranking.

The project has no build step or external runtime dependencies. Match events and timer behavior live in `app.js`; Counterbuy behavior and recommendation data live in `counterbuy.js`. Game assets are stored locally in `icons/` and `counterbuy-assets/` so the pages do not depend on hot-linked images.
