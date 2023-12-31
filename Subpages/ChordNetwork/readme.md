# TODO

## BUGS

- [ ] account for AudioContext user gesture requirement

  - [ ] include a "patch changes" pop-up that only lightly grays the screen and includes a "click anywhere to continue"

- [ ] Abi's firefox session never removed the arrows once they were created

## FEATURES

- [ ] show and use absolute chord information

- [ ] color legend for chord functions

- [ ] rethink how "closed" or "open" a voicing is...maybe actually do math on the average distance?  ask GPT

- [ ] create 'x' bars chord progression randomize button that plays the progression

  - [ ] continue for 4 bars after note press

  - [ ] start with random chord and continue for n bars where n = number of boxes (which should be a user parameter)

  - [ ] 'clear row' button

  - [ ] 'play' button for to play the chord array

- [ ] add missing chord types

  - [ ] seventh scale degree (currently only have 2 dominants)

  - [ ] suspensions, extensions, etc.

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

- [ ] don't re-calculate the pitch array each click event

- [ ] maintain note information strictly as midi until frequencies are needed then calculate them (although how expensive is the power function compared to the array lookup I wonder?...either way, there's a better way)

## USER EXPERIENCE

- [ ] top and bottom bars with transparent backgrounds and that don't take up the center of the screen or push the content away

- [ ] distinct click and drag spot for changing the force center

- [ ] mode selection for Zack

- [ ] fancier graphical fx
  
  - [ ] bloom that moves along the line to show the various connections and maybe flash their node ids at the top for a moment\

- [ ] better iconography/UI

  - [ ] more aesthetic dropdowns and text boxes that scale better with the screen size

  - [ ] "copy" icon for copy midi placed closer to the chords

  - [ ] "random" icon for random progression

- [x] dark mode

- [x] get chord names to appear as text

- [x] fine tune the force and size so everything is readable and things don't move so far away from each other