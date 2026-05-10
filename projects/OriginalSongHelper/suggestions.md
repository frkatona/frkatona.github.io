# OriginalSongHelper Suggestions

Ideas are grouped by estimated implementation difficulty. The references are examples to borrow interaction patterns from, not products to copy wholesale.

## Easy

1. Persist user preferences
   - Save font size, alignment, scroll speed, transpose, selected artist filters, sort order, and hotkeys in `localStorage`.
   - Reference: SongbookPro and OnSong both feel stronger because session setup does not need to be repeated every time.

2. Add a search box to the song selector
   - Filter by title, artist, lyrics, or metadata.
   - Keep artist pills and sort active while search is applied.
   - Reference: Ultimate Guitar and MuseScore search patterns are familiar: search first, then narrow with filters.

3. Show selected song state in the selector
   - Highlight the current song row and optionally pin it near the top.
   - Add a small "current" label so it is obvious which chart is loaded.

4. Improve empty metadata handling
   - Hide `key`, `tempo`, `time`, or any metadata field when the value is blank, `?`, `unknown`, or `n/a`.
   - Consider a consistent metadata order: artist, key, capo, tempo, time, tuning, notes.

5. Add quick reset controls
   - One tap reset for transpose, scroll speed, font size, and alignment.
   - Put these in the menu and mobile control overlay.

6. Add recently opened songs
   - Track the last 5-10 selected songs and expose them at the top of the song selector.
   - Reference: setlist and rehearsal apps often optimize for repeat access, not just complete libraries.

## Medium

1. Add setlists
   - Let users create named setlists, reorder songs, and step through them with next/previous buttons.
   - Support URL state like `?setlist=practice&song=2`.
   - Reference: OnSong and Planning Center Music Stand are strong examples of setlist-oriented performance flow.

2. Add ChordPro-style directive support
   - Parse lines such as `{title: ...}`, `{artist: ...}`, `{key: ...}`, `{start_of_chorus}`, and `{comment: ...}`.
   - Continue supporting the current lightweight format so existing songs do not need conversion.
   - Reference: ChordPro is a useful standard for portable chord charts.

3. Better chord rendering
   - Replace the current monospace spacing approach with inline chord anchors above lyric syllables.
   - This would make chords align more reliably on mobile and allow variable-width fonts.
   - Reference: SongbookPro and Ultimate Guitar chord sheets are easier to scan because chord placement survives responsive layouts.

4. Section navigation
   - Parse section headers like `Verse:`, `Chorus:`, `Bridge:` and create a small jump menu.
   - Useful for rehearsal when someone says "go back to bridge."

5. Smarter autoscroll
   - Add countdown before start, pause at section headers, and tap-to-adjust scroll speed while playing.
   - Consider per-song saved scroll speed and font size.

6. Inline editor helpers
   - Buttons for inserting chords, section headers, metadata, and dynamics.
   - Add simple chord validation and quick transpose preview while editing.

7. Better mobile performance mode
   - Add a "performance lock" that disables accidental text selection, modal opening, and editing during a song.
   - Keep only play/pause, controls, and next/previous visible.

8. Import cleanup preview
   - When importing from Ultimate Guitar, show a preview with cleanup toggles before replacing the editor text.
   - Options: strip comments, preserve repeats, convert metadata, merge chord-only lines.

## Hard

1. Full library manager
   - Add create, rename, delete, duplicate, artist reassignment, and metadata editing inside the browser.
   - Requires either a backend, GitHub integration, or a generated downloadable library bundle.

2. Offline-first app mode
   - Add a service worker and cache songs/assets for offline rehearsals.
   - Include a visible sync/cache status.
   - Reference: mobile music tools are often used in basements, venues, and practice rooms with unreliable network access.

3. Setlist playback mode with song transitions
   - Preload the next song, preserve scroll position per song, and add large previous/next controls.
   - Include optional automatic advance after reaching the bottom.

4. Audio-assisted rehearsal tools
   - Add metronome, count-in, tap tempo history, and optional backing track links per song.
   - Could support YouTube, Spotify links, or local audio references as metadata.

5. Cloud sync and collaboration
   - Store songs, setlists, and user preferences in Firebase or GitHub-backed storage.
   - Add conflict handling when two people edit the same song.
   - Reference: Planning Center works well because the shared library is the source of truth.

6. Visual chord diagrams
   - Parse detected guitar/ukulele chords and show diagrams on demand.
   - This needs a chord dictionary and instrument tuning support.
   - Reference: Ultimate Guitar and chord chart apps often expose diagrams without forcing them into the main lyrics flow.

7. PDF/export renderer
   - Export performance-ready PDF charts with selected font, transpose, metadata, and pagination.
   - Include page break hints in the song format.

## Creative And Style Ideas

1. Performance themes
   - Add dark stage, high-contrast daylight, paper chart, and rehearsal room themes.
   - Keep decorative styling restrained so chords and lyrics remain the focus.

2. Song mood metadata
   - Optional fields such as `mood:`, `energy:`, or `occasion:` could power future sorting or setlist planning.

3. Section-aware color accents
   - Give verse, chorus, bridge, intro, and outro subtle distinct accents.
   - Avoid full color blocks; small left rails or header accents would be easier to read.

4. Practice annotations
   - Support non-printing notes like `note: watch the stop after verse 2`.
   - Render these differently from lyrics and comments.

5. Rehearsal checklist
   - Per-song checkboxes for "lyrics checked", "key confirmed", "tempo confirmed", and "ready for setlist."

## Dynamics Notation Idea

Keep your current left-most text convention, but formalize it as a parsed dynamics marker:

```text
{pp} Soft opening line here
{mf} Build through the pre-chorus
{crescendo} Hold the chord and get louder
```

Render recognized dynamics markers as compact badges in the left margin instead of normal lyrics. Use standard markings such as `pp`, `p`, `mp`, `mf`, `f`, `ff`, plus text directions like `crescendo`, `dim`, `rit`, and `hold`. On mobile, keep the badge inline at the beginning of the lyric line so it does not consume too much horizontal space. This keeps the source text readable while making performance cues easier to scan.

