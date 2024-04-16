// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Camera position
camera.position.z = 50;
camera.position.y = 30;
camera.lookAt(new THREE.Vector3(0, 0, 0));

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(5, 5, 5);
scene.add(light);

// Terrain creation
const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
const material = new THREE.MeshLambertMaterial({ color: 0x5566aa, wireframe: true });
const terrain = new THREE.Mesh(geometry, material);
terrain.rotation.x = -Math.PI / 2;
scene.add(terrain);

// Generate terrain using noise
const simplex = new SimplexNoise();
for (let i = 0; i < geometry.vertices.length; i++) {
    const vertex = geometry.vertices[i];
    vertex.z = simplex.noise2D(vertex.x / 10, vertex.y / 10) * 10;
}
geometry.computeVertexNormals();

// Rendering loop
function animate() {
    requestAnimationFrame(animate);
    terrain.rotation.z += 0.001;  // Rotate terrain for better visualization
    renderer.render(scene, camera);
}

animate();

// Responsive canvas
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
