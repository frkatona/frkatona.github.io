# Asset archive

- Add a model: copy its `.glb` into `assets/characters`, `assets/props`, or `assets/environments`; nested folders may hold companion textures.
- Add a sound: copy it into a project folder under `assets/soundfx`.
- Rename, describe, or assign an albedo in `modelOverrides` inside `build-manifests.mjs`.
- Rebuild catalogs/audio with `npm run 3d-assets:build`, then previews with `npm run 3d-assets:thumbnails` (`ffmpeg`, `ffprobe`, and Blender required).
- Rerender selected previews with `npm run 3d-assets:thumbnails -- model-id another-id`.
- Edit models in `index.html`/`script.js`, audio in `sound-effects.html`/`sound-effects.js`, and shared styling in `style.css`; do not hand-edit generated JSON manifests.
