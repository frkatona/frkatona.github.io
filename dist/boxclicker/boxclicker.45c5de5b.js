const box = document.getElementById("box");
const counter = document.getElementById("counter");
let clickCount = 0;
// creates list of audio files from folder
const clickSounds = [
    "Audio/note1.mp3",
    "Audio/note2.mp3",
    "Audio/note3.mp3",
    "Audio/note4.mp3",
    "Audio/note5.mp3"
];
function getRandomPosition() {
    const windowHeight = window.innerHeight - box.offsetHeight;
    const windowWidth = window.innerWidth - box.offsetWidth;
    const randomY = Math.floor(Math.random() * windowHeight);
    const randomX = Math.floor(Math.random() * windowWidth);
    return {
        x: randomX,
        y: randomY
    };
}
function moveBox() {
    // box movement
    const position = getRandomPosition();
    box.style.top = `${position.y}px`;
    box.style.left = `${position.x}px`;
    // audio select and play
    const clickSound = new Audio(clickSounds[Math.floor(Math.random() * clickSounds.length)]);
    clickSound.play();
    // counter update
    clickCount++;
    counter.textContent = clickCount;
}
box.addEventListener("click", moveBox);
// Dark Mode
document.body.classList.add("dark-mode");
const toggle = document.getElementById("dark-mode-toggle");
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}
toggle.addEventListener("change", toggleDarkMode);

//# sourceMappingURL=boxclicker.45c5de5b.js.map
