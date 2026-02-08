import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';

async function init() {
    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Initial Camera Transform
    camera.position.set(-2.24, 3.98, -2.48);
    camera.rotation.set(2.69, -0.67, 2.85);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.body.appendChild(renderer.domElement);

    // Post-Processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 1. Bloom
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.5;
    bloomPass.strength = 1.5;
    bloomPass.radius = 0.5;
    composer.addPass(bloomPass);

    // 2. Film Grain
    const filmPass = new FilmPass(0.0, 0.0, 0, false); // noise, scanlines, grayscale
    composer.addPass(filmPass);

    // 3. RGB Shift
    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms['amount'].value = 0.0;
    composer.addPass(rgbShiftPass);

    // 4. Vignette
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['offset'].value = 0.95;
    vignettePass.uniforms['darkness'].value = 0.0;
    composer.addPass(vignettePass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // UI Event Listeners
    document.getElementById('bloomStrength').addEventListener('input', (e) => {
        bloomPass.strength = parseFloat(e.target.value);
    });

    document.getElementById('filmNoise').addEventListener('input', (e) => {
        filmPass.uniforms.nIntensity.value = parseFloat(e.target.value);
    });

    document.getElementById('rgbShift').addEventListener('input', (e) => {
        rgbShiftPass.uniforms['amount'].value = parseFloat(e.target.value);
    });

    document.getElementById('vignetteDarkness').addEventListener('input', (e) => {
        vignettePass.uniforms['darkness'].value = parseFloat(e.target.value);
    });

    // Load Shaders
    const [vertexShader, fragmentShader] = await Promise.all([
        fetch('./js/shaders/atmosphereVertex.glsl').then(r => r.text()),
        fetch('./js/shaders/atmosphereFragment.glsl').then(r => r.text())
    ]);

    // Planet
    const planetGeometry = new THREE.SphereGeometry(5, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
        color: 0x223344,
        roughness: 0.8,
        metalness: 0.2
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planet);

    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(5.0, 64, 64);
    atmosphereGeometry.scale(1.2, 1.2, 1.2);

    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            uSunPosition: { value: new THREE.Vector3(10, 5, 10) },
            uViewVector: { value: new THREE.Vector3() },
            uColor: { value: new THREE.Vector3(0.3, 0.6, 1.0) },
            uPlanetRadius: { value: 5.0 },
            uAtmosphereRadius: { value: 6.0 },
            uTime: { value: 0.0 }
        },
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Sun / Light
    const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
    sunLight.position.set(10, 5, 10);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        starPos[i] = (Math.random() - 0.5) * 200;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Controls Setup
    const keys = { w: false, a: false, s: false, d: false, q: false, e: false };
    const moveSpeed = 0.5; // Reduced to 10% of 5.0

    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
    });

    // Mouse Look
    let pitch = camera.rotation.x;
    let yaw = camera.rotation.y;
    let isDragging = false;

    document.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on controls
        if (e.target.closest('#controls')) return;
        isDragging = true;
    });
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
        }
    });

    // Animation Loop
    let lastTime = performance.now();

    function animate() {
        requestAnimationFrame(animate);

        const currentTime = performance.now();
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Movement Logic
        const direction = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

        if (keys.w) direction.add(forward);
        if (keys.s) direction.sub(forward);
        if (keys.d) direction.add(right);
        if (keys.a) direction.sub(right);
        if (keys.e) direction.add(up);
        if (keys.q) direction.sub(up);

        if (direction.lengthSq() > 0) {
            direction.normalize().multiplyScalar(moveSpeed * delta);
            camera.position.add(direction);
        }

        // Collision Detection
        const planetRadius = 5.0;
        const minHeight = 5.2;
        const dist = camera.position.length();

        if (dist < minHeight) {
            camera.position.setLength(minHeight);
        }

        // Update Uniforms
        atmosphereMaterial.uniforms.uViewVector.value.copy(camera.position).sub(atmosphere.position);
        atmosphereMaterial.uniforms.uTime.value = currentTime / 1000;

        // Update Debug Info
        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            const pos = camera.position;
            const rot = camera.rotation;
            infoDiv.innerHTML = `
                <h1>Planetary Atmosphere</h1>
                <p>Position: x:${pos.x.toFixed(2)} y:${pos.y.toFixed(2)} z:${pos.z.toFixed(2)}</p>
                <p>Rotation: x:${rot.x.toFixed(2)} y:${rot.y.toFixed(2)} z:${rot.z.toFixed(2)}</p>
            `;
        }

        composer.render();
    }

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
}

init();
