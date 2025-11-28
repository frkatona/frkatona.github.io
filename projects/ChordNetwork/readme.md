# TODO

## BUGS

- [x] account for AudioContext user gesture requirement (patch-change initial overlay)

- [ ] Abi's firefox session never removed the arrows once they were created

## FEATURES

- [ ] provide a list of example songs that set the key and populate the chordboxes with the chords of the song

- [ ] flesh out theory underpinning links and eventual user-parameterized link probability weights

  - [ ] rewrite the seed json (or python script to automate child json or the js to crunch it each time)

  - [ ] "tonal ambiguity" in strength of approach intervals (e.g., darkness weights tonal approach preferentially with motion by thirds)

- [ ] create 'x' bars chord progression randomize button that plays the progression

  - [x] continue for 3 bars after note press

  - [ ] start with random chord and continue for n bars where n = number of boxes (which should be a user parameter)

  - [ ] 'clear row' button

  - [ ] 'play' button for to play the chord array

    - [x] arrows above the box to change voicing and extension to hear again on playback or copy to clipboard (will need to organize lastFourChords as objects probably)

- [x] show and use absolute chord information

- [x] color legend for chord functions

- [x] rethink how "closed" or "open" a voicing is...maybe actually do math on the average distance?

- [ ] add missing chord types

  - [x] seventh scale degree (currently only have 2 dominants)

  - [ ] suspensions, extensions, etc.
  
- [x] css piano keyboard to visualize notes played for voicing

- [x] assemble absolute chord information for a single chord (root, extensions, octave, voicing)

  - [ ] also show on hover

- [x] maintain circle buffer of the last n (init 4) chords played and show them in a row

  - [x] button to convert/export row of chords to MIDI info (file? clipboard?)

  - [ ] have setting to change voicing depending on the most recent chord played

- [x] playing the chord (requires reworking the json structure and by extension the json maker script) - done, works in C major, won't be tough to allow other key modifiers

- [x] polish script that converts the json

- [X] connection logic

  - [x] add connection colors

  - [x] arrows/directionality for chord functions

- [x] key selection

## SPEED / OPTIMIZATIONS

- [x] don't re-calculate the pitch array each click event

- [x] maintain note information strictly as midi until frequencies are needed then calculate them (although how expensive is the power function compared to the array lookup I wonder?...either way, there's a better way)

## USER EXPERIENCE

- [x] top and bottom bars with transparent backgrounds and that don't take up the center of the screen or push the content away

- [ ] distinct click and drag spot for changing the force center (or at least be sure the nodes are never inconvenient to click)

- [ ] "?" icon next to settings that aren't obvious for non-intrusive hover tips, a la overwatch fan wiki

- [ ] fancier graphical fx
  
  - [ ] bloom that moves along the line to show the various connections and maybe flash their node ids at the top for a moment (can make boxshadow but maybe a better way)

- [ ] better iconography/UI

  - [ ] more aesthetic dropdowns and text boxes that scale better with the screen size

  - [ ] "copy" icon for copy midi placed closer to the chords

  - [ ] "random" icon for random progression

- [ ] intro overlay

  - [x] create overlay with "click anywhere to continue" and basic feature notes

  - [x] hotkeys for opening menu or changing settings and show on overlay

  - [ ] arrows that point to the various features (maybe an option for "take me on a tour" with "next" button that moves arrow)

  - [ ] bring the overlay back up with a "?" that is highlighted when the user first clicks out of the overlay

- [x] dark mode

- [x] get chord names to appear as text

- [x] fine tune the force and size so everything is readable and things don't move so far away from eachother
