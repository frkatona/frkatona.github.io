const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let cubeX = 50;
let cubeY = 50;
let clickCount = 0;
let isMuted = false;

// Create array of sound file names
const soundFiles = ['note1.mp3', 'note2.mp3', 'note3.mp3', 'note4.mp3', 'note5.mp3', 'note6.mp3', 'note7.mp3'];

// Create audio element for background music and load sound file
const bgMusic = document.getElementById('bg-music');
bgMusic.volume = 0.1; // Set music volume to 50%
bgMusic.play(); // Start playing the music when the page loads

function drawCube() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'red';
	ctx.fillRect(cubeX, cubeY, 150, 150); // Make cube 3 times bigger

	ctx.fillStyle = 'white';
	ctx.font = '20px Arial';
	ctx.fillText(`Click count: ${clickCount}`, 10, 30);
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

resizeCanvas();
drawCube();

window.addEventListener('resize', function() {
	resizeCanvas();
	drawCube();
});

canvas.addEventListener('click', function(e) {
	if (e.clientX >= cubeX && e.clientX <= cubeX + 150 && e.clientY >= cubeY && e.clientY <= cubeY + 150) {
		cubeX = Math.floor(Math.random() * (canvas.width - 150));
		cubeY = Math.floor(Math.random() * (canvas.height - 150));
		clickCount++;

		// Choose random sound file from array
		const soundFile = soundFiles[Math.floor(Math.random() * soundFiles.length)];

		// Create audio element and load selected sound file
		const audio = new Audio(soundFile);

		// Set volume for sound effect
		audio.volume = 1.0; // Set volume to maximum

		// Play sound effect
		audio.currentTime = 0;
		audio.play();

		drawCube();
	}
});

// Add event listener for mute button
const muteBtn = document.getElementById('mute-btn');
muteBtn.addEventListener('click', function() {
	if (!isMuted) {
		bgMusic.pause();
		muteBtn.textContent = 'Unmute';
		isMuted = true;
	} else {
		bgMusic.play();
		muteBtn.textContent = 'Mute';
		isMuted = false;
	}
});
