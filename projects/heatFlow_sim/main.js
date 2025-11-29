document.addEventListener("DOMContentLoaded", function () {
  // --- Configuration ---
  const width = 400;
  const height = 400;

  // Simulation State
  let u = new Float32Array(width * height); // Current temperature
  let u_new = new Float32Array(width * height); // Next temperature
  let running = false;
  let timeElapsed = 0;

  // Parameters
  let alpha = 1.0; // Thermal diffusivity
  let dt = 0.1;    // Time step
  let dx = 1.0;    // Space step
  let sourcePower = 1000;
  let brushRadius = 0.1; // Fraction of width

  // DOM Elements
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const timeDisplay = document.getElementById('timeElapsed');
  const tempDisplay = document.getElementById('avgTemp');

  // Controls
  const btnPlay = document.getElementById('playPauseButton');
  const btnRestart = document.getElementById('restartButton');
  const btnClear = document.getElementById('clearButton');

  const inputPower = document.getElementById('circle_power');
  const inputRadius = document.getElementById('circleRadius');
  const inputAlpha = document.getElementById('thermalDiffusivity');
  const inputDt = document.getElementById('t_stepSize');

  const valPower = document.getElementById('val_power');
  const valRadius = document.getElementById('val_radius');
  const valAlpha = document.getElementById('val_alpha');
  const valDt = document.getElementById('val_dt');

  // Graphics
  const imageData = ctx.createImageData(width, height);
  const buf = new Uint32Array(imageData.data.buffer);

  // Color Look-Up Table (Fire Palette)
  const LUT_SIZE = 1024;
  const colorLUT = new Uint32Array(LUT_SIZE);

  function initLUT() {
    for (let i = 0; i < LUT_SIZE; i++) {
      let t = i / (LUT_SIZE - 1);
      let r, g, b;

      // Black -> Red -> Orange -> Yellow -> White
      if (t < 0.33) {
        // Black to Red
        r = (t / 0.33) * 255;
        g = 0;
        b = 0;
      } else if (t < 0.66) {
        // Red to Yellow
        r = 255;
        g = ((t - 0.33) / 0.33) * 255;
        b = 0;
      } else {
        // Yellow to White
        r = 255;
        g = 255;
        b = ((t - 0.66) / 0.34) * 255;
      }

      // ABGR format for little-endian
      colorLUT[i] = (255 << 24) | (Math.floor(b) << 16) | (Math.floor(g) << 8) | Math.floor(r);
    }
  }

  // --- Simulation Logic ---

  function reset() {
    u.fill(0);
    u_new.fill(0);
    timeElapsed = 0;
    updateStats();
    draw();
  }

  function step() {
    // 5-point stencil finite difference
    // u[i,j] = u[i,j] + alpha * dt * ( (u[i+1,j] + u[i-1,j] + u[i,j+1] + u[i,j-1] - 4*u[i,j]) / dx^2 )

    const w = width;
    const h = height;
    const c = (alpha * dt) / (dx * dx);

    // Stability check (CFL condition)
    if (c > 0.25) {
      // console.warn("Unstable parameters! Reduce dt or alpha.");
      // In a real app, we might clamp or warn the user.
    }

    let totalTemp = 0;

    for (let y = 1; y < h - 1; y++) {
      let yw = y * w;
      for (let x = 1; x < w - 1; x++) {
        const idx = yw + x;
        const laplacian = u[idx - 1] + u[idx + 1] + u[idx - w] + u[idx + w] - 4 * u[idx];
        u_new[idx] = u[idx] + c * laplacian;
        totalTemp += u_new[idx];
      }
    }

    // Swap buffers
    let temp = u;
    u = u_new;
    u_new = temp;

    // Boundary conditions (Dirichlet = 0 for edges)
    // Already 0 initialized and loop skips edges, so edges stay 0.

    timeElapsed += dt;

    // Update stats occasionally
    if (Math.floor(timeElapsed / dt) % 10 === 0) {
      updateStats(totalTemp / ((w - 2) * (h - 2)));
    }
  }

  function draw() {
    const len = width * height;
    // Max temp for scaling color (auto-exposure or fixed?)
    // Let's use fixed for now: 0 to 1000
    const maxTemp = 2000;

    for (let i = 0; i < len; i++) {
      let val = u[i];
      let idx = Math.floor((val / maxTemp) * (LUT_SIZE - 1));
      if (idx < 0) idx = 0;
      if (idx >= LUT_SIZE) idx = LUT_SIZE - 1;
      buf[i] = colorLUT[idx];
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function updateStats(avg) {
    timeDisplay.textContent = timeElapsed.toFixed(1) + "s";
    if (avg !== undefined) {
      tempDisplay.textContent = Math.floor(avg) + "°C";
    }
  }

  function loop() {
    if (running) {
      step();
      draw();
      requestAnimationFrame(loop);
    }
  }

  // --- Interaction ---

  let isDragging = false;

  function addHeat(x, y) {
    const r = Math.floor(brushRadius * width);
    const r2 = r * r;
    const amount = sourcePower * dt; // Heat added per step

    const x0 = Math.max(0, x - r);
    const x1 = Math.min(width, x + r);
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height, y + r);

    for (let iy = y0; iy < y1; iy++) {
      let yw = iy * width;
      let dy = iy - y;
      for (let ix = x0; ix < x1; ix++) {
        let dx_dist = ix - x;
        if (dx_dist * dx_dist + dy * dy <= r2) {
          u[yw + ix] += amount;
        }
      }
    }
    if (!running) draw(); // Update view if paused
  }

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (height / rect.height));
    addHeat(x, y);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (height / rect.height));
    addHeat(x, y);
  });

  // Touch support
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.floor((touch.clientX - rect.left) * (width / rect.width));
    const y = Math.floor((touch.clientY - rect.top) * (height / rect.height));
    addHeat(x, y);
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.floor((touch.clientX - rect.left) * (width / rect.width));
    const y = Math.floor((touch.clientY - rect.top) * (height / rect.height));
    addHeat(x, y);
  }, { passive: false });


  // --- Event Listeners ---

  btnPlay.addEventListener('click', () => {
    running = !running;
    btnPlay.innerHTML = running ? '<i class="fas fa-pause"></i> PAUSE' : '<i class="fas fa-play"></i> RUN';
    if (running) loop();
  });

  btnRestart.addEventListener('click', () => {
    reset();
  });

  btnClear.addEventListener('click', () => {
    u.fill(0);
    u_new.fill(0);
    draw();
  });

  // Inputs
  inputPower.addEventListener('input', e => {
    sourcePower = parseFloat(e.target.value);
    valPower.textContent = sourcePower;
  });

  inputRadius.addEventListener('input', e => {
    brushRadius = parseFloat(e.target.value);
    valRadius.textContent = brushRadius.toFixed(2);
  });

  inputAlpha.addEventListener('input', e => {
    alpha = parseFloat(e.target.value);
    valAlpha.textContent = alpha.toFixed(1);
  });

  inputDt.addEventListener('input', e => {
    dt = parseFloat(e.target.value);
    valDt.textContent = dt.toFixed(2);
  });

  // Init
  initLUT();
  reset();
});