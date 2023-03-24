const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let cubeX = 50;
let cubeY = 50;

function drawCube() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'red';
	ctx.fillRect(cubeX, cubeY, 50, 50);
}

drawCube();

canvas.addEventListener('click', function(e) {
	if (e.clientX >= cubeX && e.clientX <= cubeX + 50 && e.clientY >= cubeY && e.clientY <= cubeY + 50) {
		cubeX = Math.floor(Math.random() * (canvas.width - 50));
		cubeY = Math.floor(Math.random() * (canvas.height - 50));
		drawCube();
	}
});
