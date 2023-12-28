# TODO

- [ ] account for AudioContext user gesture requirement

- [ ] show and use absolute chord information

  - [x] assemble absolute chord information for a single chord (root, extensions, octave, voicing)

  - [x] maintain circle buffer of the last n (init 4) chords played and show them in a row

  - [ ] button to convert/export row of chords to MIDI info (file? clipboard?)

  - [ ] show absolute chord with name, extensions, voicing, and function on hover

- [ ] color legend

- [ ] fancy on-click events

  - [x] playing the chord (requires reworking the json structure and by extension the json maker script) - done, works in C major, won't be tough to allow other key modifiers
  
  - [ ] have setting to change voicing depending on the most recent chord played

  - [ ] bloom that moves along the line to show the various connections and maybe flash their node ids at the top for a moment

- [ ] distinct click and drag spot for changing the force center

- [ ] "create"/"randomize" functionality

  - [ ] create 'x' bars chord progression randomize button with fancy blooms and then plays the progression

  - [ ] allow user to reroll any of the chords in the new progression without affecting the others

- [ ] optimizing

  - [ ] don't re-calculate the pitch array each click event

- [ ] connection logic

  - [x] add connection colors

  - [ ] legends for color coordination

  - [x] arrows/directionality for chord functions

- [ ] add an option to change from relative to a given key

- [x] dark mode

- [x] get chord names to appear as text

- [x] fine tune the force and size so everything is readable and things don't move so far away from each other

- [x] polish script that converts the json