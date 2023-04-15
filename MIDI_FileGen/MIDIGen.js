import JZZ from 'jzz';
import 'jzz-midi-smf';

document.addEventListener('DOMContentLoaded', function() {
  const generateMidiButton = document.getElementById('generateMidi');
  const downloadLink = document.getElementById('downloadLink');

  generateMidiButton.addEventListener('click', () => {
    const midiFile = generateChordProgressionMidi();
    const midiData = new Blob([midiFile.dump()], { type: 'audio/midi' });
    const url = URL.createObjectURL(midiData);

    downloadLink.href = url;
    downloadLink.download = 'chord-progression.mid';
    downloadLink.style.display = 'block';
  });

  function generateChordProgressionMidi() {
    const chords = [
      [60, 64, 67], // C major
      [57, 60, 64], // A minor
      [62, 65, 69], // D minor
      [55, 59, 62]  // G major
    ];

    const smf = new JZZ.MIDI.SMF(0);
    const track = new JZZ.MIDI.SMF.MTrk();
    smf.push(track);

    track.add(0, JZZ.MIDI.smfBPM(120));
    
    let tick = 0;
    const ticksPerBar = 1920; // Assuming 4/4 time signature, 120 BPM and 480 PPQ

    for (const chord of chords) {
      for (const note of chord) {
        track.add(tick, JZZ.MIDI.noteOn(0, note, 127));
      }
      tick += ticksPerBar;
      for (const note of chord) {
        track.add(tick, JZZ.MIDI.noteOff(0, note));
      }
    }

    return smf;
  }
});
