const box = document.getElementById("box");
const counter = document.getElementById("counter");
const clickSounds = [
    new Audio('Audio/note1.mp3'),
    new Audio('Audio/note2.mp3'),
    new Audio('Audio/note3.mp3'),
    new Audio('Audio/note4.mp3'),
    new Audio('Audio/note5.mp3'),
    new Audio('Audio/note6.mp3'),
    new Audio('Audio/note7.mp3')
  ];

const chordSounds = [
    new Audio('Audio/chord1.mp3'),
    new Audio('Audio/chord2.mp3'),
    new Audio('Audio/chord3.mp3'),
    new Audio('Audio/chord4.mp3')
]; 
// play chordSounds chords on repeat
let chordTime = 7000; //120bpm for 4 beats
let chordIndex = 0;
chordSounds.forEach(function(chord) {
    chord.volume = 0.3;
});
let chordInterval = null;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create an array to store the buffer sources
const bufferSources = [];

/// Load the audio files
chordSounds.forEach((chordSound, index) => {
    fetch(chordSound.src)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = audioBuffer;
            bufferSources[index] = bufferSource;
            chordSound.loaded = true; // Set the loaded property to true
        });
});

// Check if all the audios are loaded
function areAllAudiosLoaded() {
    return chordSounds.every(chordSound => chordSound.loaded);
}

// Display a loading indicator until all the audios are loaded
function displayLoadingIndicator() {
    if (!areAllAudiosLoaded()) {
        console.log("Loading audio files...");
        setTimeout(displayLoadingIndicator, 1000); // Check again in 1 second
    } else {
        console.log("All audio files loaded.");
    }
}

// Call the function when the page loads
displayLoadingIndicator();

// Play the audio files
function playChords() {
    const bufferSource = bufferSources[chordIndex];
    bufferSource.connect(audioContext.destination);
    bufferSource.start();

    chordIndex = (chordIndex + 1) % bufferSources.length;
}

// Estimate the remaining time before the audio samples begin to play
function estimateRemainingTime() {
    const remainingTime = bufferSources.reduce((total, bufferSource) => {
        return total + (bufferSource ? bufferSource.buffer.duration : 0);
    }, 0);

    return remainingTime;
}

function toggleSound() {
    sound = !sound;
    if (sound) {
        soundToggle.textContent = "Chords: On";
        chordSounds.forEach(function(chord) {
            chord.volume = 0.3;
        });
        chordInterval = setInterval(playChords, chordTime);
    } else {
        soundToggle.textContent = "Chords: Off";
        chordSounds.forEach(function(chord) {
            chord.volume = 0.0;
        });
        clearInterval(chordInterval);
    }
}

let sound = true;
const soundToggle = document.getElementById("sound-toggle");
soundToggle.addEventListener("click", toggleSound);

let clickCount = 0;

function getRandomPosition() {
    const windowHeight = window.innerHeight - box.offsetHeight;
    const windowWidth = window.innerWidth - box.offsetWidth;
    const randomY = Math.floor(Math.random() * windowHeight);
    const randomX = Math.floor(Math.random() * windowWidth);

    return { x: randomX, y: randomY };
}

lastRandom = null;

function moveBox() {
    // box movement
    const position = getRandomPosition();
    box.style.top = `${position.y}px`;
    box.style.left = `${position.x}px`;

    // audio select and play
    let randomNumber = Math.floor(Math.random() * clickSounds.length);
    while (randomNumber == lastRandom) {
        randomNumber = Math.floor(Math.random() * clickSounds.length);
    }
    lastRandom = randomNumber;
    let clickSound = new Audio(clickSounds[randomNumber].src);
    clickSound.play();

    // counter update
    clickCount++;
    counter.textContent = clickCount;

    // Shrink the box instantly
    box.style.transform = 'scale(0.1)';
    box.style.transition = 'transform 0s';

    // Return to original size over 0.5 seconds
    setTimeout(function() {
        box.style.transform = 'scale(1)';
        box.style.transition = 'transform 0.3s';
    }, 0);
}

box.addEventListener("click", moveBox);

// Dark Mode
document.body.classList.add("dark-mode");
const toggle = document.getElementById("dark-mode-toggle");
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}
toggle.addEventListener("change", toggleDarkMode);
