const frequencyInput = document.getElementById("frequency");
const frequencyValue = document.getElementById("frequency-value");
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();
oscillator.type = "sine";
oscillator.frequency.value = frequencyInput.value;
gainNode.gain.value = 0;
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);
oscillator.start();
function updateFrequency() {
    frequencyValue.textContent = frequencyInput.value;
    oscillator.frequency.value = frequencyInput.value;
}
const volumeInput = document.getElementById("volume");
const volumeValue = document.getElementById("volume-value");
// Initialize gain value
gainNode.gain.value = volumeInput.value;
function updateVolume() {
    volumeValue.textContent = Math.round(volumeInput.value * 100);
}
const oscilloscopeCanvas = document.getElementById("oscilloscope");
const oscilloscopeContext = oscilloscopeCanvas.getContext("2d");
const analyzer = audioContext.createAnalyser();
analyzer.fftSize = 2048;
const bufferLength = analyzer.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
gainNode.connect(analyzer);
function drawOscilloscope() {
    requestAnimationFrame(drawOscilloscope);
    analyzer.getByteTimeDomainData(dataArray);
    oscilloscopeContext.fillStyle = "rgb(255, 255, 255)";
    oscilloscopeContext.fillRect(0, 0, oscilloscopeCanvas.width, oscilloscopeCanvas.height);
    oscilloscopeContext.lineWidth = 2;
    oscilloscopeContext.strokeStyle = "rgb(0, 0, 0)";
    oscilloscopeContext.beginPath();
    const sliceWidth = oscilloscopeCanvas.width * 1.0 / bufferLength;
    let x = 0;
    for(let i = 0; i < bufferLength; i++){
        const v = dataArray[i] / 128.0;
        const y = v * oscilloscopeCanvas.height / 2;
        if (i === 0) oscilloscopeContext.moveTo(x, y);
        else oscilloscopeContext.lineTo(x, y);
        x += sliceWidth;
    }
    oscilloscopeContext.lineTo(oscilloscopeCanvas.width, oscilloscopeCanvas.height / 2);
    oscilloscopeContext.stroke();
}
drawOscilloscope();
volumeInput.addEventListener("input", updateVolume);
frequencyInput.addEventListener("input", updateFrequency);
function isClickWithinOscilloscope(event) {
    const rect = oscilloscopeCanvas.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}
document.addEventListener("mousedown", (event)=>{
    if (isClickWithinOscilloscope(event)) {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(volumeInput.value, now + 0.01);
    }
});
document.addEventListener("mouseup", (event)=>{
    if (isClickWithinOscilloscope(event)) {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
    }
});
if (navigator.requestMIDIAccess) navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
else updateStatus("Web MIDI API is not supported in your browser.");
function onMIDISuccess(midiAccess) {
    const inputs = midiAccess.inputs.values();
    for (const input of inputs)input.onmidimessage = onMIDIMessage;
    updateStatus("MIDI controller connected!");
}
function onMIDIFailure() {
    updateStatus("Failed to access your MIDI devices.");
}
function onMIDIMessage(event) {
    const [command, note, velocity] = event.data;
    if (command === 144 && velocity > 0) playNote(note, velocity);
    else if (command === 128 || command === 144 && velocity === 0) stopNote(note);
}
function playNote(note, velocity) {
    // Use the Web Audio API to play the note
    console.log("Note on:", note, "Velocity:", velocity);
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(volumeInput.value, now + 0.01);
}
function stopNote(note) {
    // Use the Web Audio API to stop the note
    console.log("Note off:", note);
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
}
function updateStatus(message) {
    document.getElementById("status").innerText = message;
}

//# sourceMappingURL=synth.3cd4cf28.js.map
