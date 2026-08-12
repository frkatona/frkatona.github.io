# Plate Plan recipe guide

The meal chooser is a dependency-free static project. All recipe content lives in
`recipes.js`; the page builds every card and recipe view from that file.

## Add a recipe

1. Open `recipes.js`.
2. Copy one complete recipe object inside `window.RECIPES`.
3. Give it a unique lowercase `id` (use hyphens, no spaces) and a distinct `icon`.
4. Update every field, including the per-serving `costPerServing`, `nutrition`,
   `storage`, and `source` values.
5. Set `mealPrep` to `true` only when the finished meal keeps well for multiple days.

The interface validates the required fields and skips incomplete records with a
warning in the browser console. No HTML or CSS changes are needed for ordinary
recipe additions.

## Cost and nutrition

Values in the interface are estimates per serving. Recipe publishers, ingredient
brands, local prices, and substitutions can all change them. Update the figures in
`recipes.js` whenever the ingredient list or serving count changes.

## Possible future improvements
- add a +/- button to adjust yield and automatically update the ingredients
- center-align the boxed values
- bold either the ingredient quantities/volumes or the item
  - also bold either the ingredients or the verbs in the steps