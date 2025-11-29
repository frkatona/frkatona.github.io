import { OrbitControls } from 'https://unpkg.com/three@0.110.0/examples/jsm/controls/OrbitControls.js';
// import * as THREE from 'https://unpkg.com/three@0.110.0/build/three.module.js';

const heightMapCanvas = document.getElementById('heightMapCanvas');
const terrainCanvas = document.getElementById('terrainCanvas');

function resizeCanvases() {
    heightMapCanvas.width = window.innerWidth / 2;
    heightMapCanvas.height = window.innerHeight;
    terrainCanvas.width = window.innerWidth / 2;
    terrainCanvas.height = window.innerHeight;

}

// Initial resizing
resizeCanvases();

window.addEventListener('resize', resizeCanvases);

const ctx = heightMapCanvas.getContext('2d');

const noise = new SimplexNoise();
let scale = 50;
let amplitudeUser = 1;
let frequencyUser = 0.1;

ctx.width = window.innerWidth;
ctx.height = window.innerHeight; 

function generateHeightMap(width, height, scale, amplitudeUser, frequencyUser) {
    const data = new Uint8ClampedArray(width * height * 4);
    const numOctaves = 4;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let v = 0;
            let amplitude = amplitudeUser;
            let frequency = frequencyUser;
            for (let i = 0; i < numOctaves; i++) {
                v += (1 + noise.noise2D(x / scale * frequency, y / scale * frequency)) / 2 * amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }
            v = Math.pow(v, 1.2) * 255; // adjusted non-linearity to improve contrast
            const i = (x + y * width) * 4;
            data[i] = data[i + 1] = data[i + 2] = v;
            data[i + 3] = 255;
        }
    }
    return new ImageData(data, width, height);
}

function draw() {
    const imageData = generateHeightMap(ctx.width, ctx.height, scale, amplitudeUser, frequencyUser);
    ctx.putImageData(imageData, 0, 0);
}

function applyChanges() {
    scale = parseFloat(document.getElementById('scale').value);
    amplitudeUser = parseFloat(document.getElementById('amplitudeInput').value);
    frequencyUser = parseFloat(document.getElementById('frequencyInput').value);
    document.getElementById('scale').innerText = scale;
    document.getElementById('amplitudeInput').innerText = amplitudeUser;
    document.getElementById('frequencyInput').innerText = frequencyUser;
    draw();
}

draw();

document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        applyChanges();
        console.log("Enter key pressed");
    }
});

window.addEventListener('resize', function () {
    ctx.width = window.innerWidth;
    ctx.height = window.innerHeight ;
    draw();
});

// Three.js Terrain
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, terrainCanvas.width / terrainCanvas.height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: terrainCanvas });
renderer.setSize(terrainCanvas.width, terrainCanvas.height);

// Wireframe material
const geometry = new THREE.PlaneGeometry(10, 10, terrainCanvas.width - 1, terrainCanvas.height - 1);
const material = new THREE.MeshBasicMaterial({ color: 0xA01090, wireframe: true });
const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);


camera.position.z = 5;

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true; // Allow zoom
controls.zoomSpeed = 1.0; // Adjust zoom speed if necessary
controls.enableRotate = true; // Allow rotation
controls.enablePan = false; // Disable panning
controls.minDistance = 20; // Minimum distance to zoom in
controls.maxDistance = 100; // Maximum distance to zoom out

// Only allow horizontal rotation by setting the same polar angles
controls.minPolarAngle = Math.PI / 2; // Rotate only horizontally
controls.maxPolarAngle = Math.PI / 2;

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required if controls.enableDamping or controls.autoRotate are set to true
    renderer.render(scene, camera);
}
animate();