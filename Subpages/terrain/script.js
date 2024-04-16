const canvas = document.getElementById('terrainCanvas');
const ctx = canvas.getContext('2d');
const noise = new SimplexNoise();
let scale = 50;  // Default scale value
let amplitudeUser = 0.4;
let frequencyUser = 0.2;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.9;  // Adjust for control panel

function generateHeightMap(width, height, scale, amplitudeUser, frequencyUser) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let v = 0;
            let amplitude = amplitudeUser;
            let frequency = frequencyUser;
            for (let i = 0; i < 4; i++) {
                v += (1 + noise.noise2D(x / scale * frequency, y / scale * frequency)) / 2 * amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }
            v = Math.pow(v, 2) * 255;
            const i = (x + y * width) * 4;
            data[i] = data[i + 1] = data[i + 2] = v;
            data[i + 3] = 255;
        }
    }
    return new ImageData(data, width, height);
}


function draw() {
    const imageData = generateHeightMap(canvas.width, canvas.height, scale, amplitudeUser, frequencyUser);
    ctx.putImageData(imageData, 0, 0);
}

function applyChanges() {
    scale = document.getElementById('scaleSlider').value;
    amplitude = document.getElementById('amplitudeSlider').value;  // Corrected
    frequency = document.getElementById('frequencySlider').value;  // Corrected
    document.getElementById('scaleValue').innerText = scale;
    document.getElementById('amplitudeValue').innerText = amplitudeUser;  // Corrected
    document.getElementById('frequencyValue').innerText = frequencyUser;  // Corrected
    draw();
}


draw();

window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight ;
    draw();
});