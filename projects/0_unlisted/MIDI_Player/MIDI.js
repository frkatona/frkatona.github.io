if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  } else {
    updateStatus("Web MIDI API is not supported in your browser.");
  }
  
  function onMIDISuccess(midiAccess) {
    const inputs = midiAccess.inputs.values();
    for (const input of inputs) {
      input.onmidimessage = onMIDIMessage;
    }
    updateStatus("MIDI controller connected!");
  }
  
  function onMIDIFailure() {
    updateStatus("Failed to access your MIDI devices.");
  }
  
  function onMIDIMessage(event) {
    const [command, note, velocity] = event.data;
  
    if (command === 144 && velocity > 0) {
      playNote(note, velocity);
    } else if (command === 128 || (command === 144 && velocity === 0)) {
      stopNote(note);
    }
  }
  
  function playNote(note, velocity) {
    // Use the Web Audio API to play the note
    console.log("Note on:", note, "Velocity:", velocity);
  }
  
  function stopNote(note) {
    // Use the Web Audio API to stop the note
    console.log("Note off:", note);
  }
  
  function updateStatus(message) {
    document.getElementById("status").innerText = message;
  }
  