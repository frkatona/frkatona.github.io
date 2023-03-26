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
    gainNode.gain.value = volumeInput.value;
}

volumeInput.addEventListener("input", updateVolume);

frequencyInput.addEventListener("input", updateFrequency);

document.addEventListener("mousedown", () => {
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(volumeInput.value, now + 0.01); // Ramp gain to 1 over 10ms
});

document.addEventListener("mouseup", () => {
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.01); // Ramp gain to 0 over 10ms
});
