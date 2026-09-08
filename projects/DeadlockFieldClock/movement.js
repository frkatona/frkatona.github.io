(() => {
  "use strict";

  const buckets = [
    {
      id: 1,
      time: "0.62",
      speed: "16.1",
      air: "0.43",
      heroes: [
        ["calico", "Calico"],
        ["celeste", "Celeste"],
        ["grey-talon", "Grey Talon"],
        ["haze", "Haze"],
        ["holliday", "Holliday"],
        ["ivy", "Ivy"],
        ["mina", "Mina"],
        ["paradox", "Paradox"],
        ["the-doorman", "The Doorman"],
      ],
    },
    {
      id: 2,
      time: "0.68",
      speed: "14.7",
      air: "0.47",
      heroes: [
        ["apollo", "Apollo"],
        ["billy", "Billy"],
        ["drifter", "Drifter"],
        ["graves", "Graves"],
        ["infernus", "Infernus"],
        ["lash", "Lash"],
        ["mcginnis", "McGinnis"],
        ["mirage", "Mirage"],
        ["pocket", "Pocket"],
        ["seven", "Seven"],
        ["silver", "Silver"],
        ["sinclair", "Sinclair"],
        ["vindicta", "Vindicta"],
        ["viscous", "Viscous"],
        ["vyper", "Vyper"],
        ["warden", "Warden"],
        ["wraith", "Wraith"],
        ["yamato", "Yamato"],
      ],
    },
    {
      id: 3,
      time: "0.72",
      speed: "13.9",
      air: "0.51",
      heroes: [
        ["abrams", "Abrams"],
        ["bebop", "Bebop"],
        ["dynamo", "Dynamo"],
        ["kelvin", "Kelvin"],
        ["lady-geist", "Lady Geist"],
        ["mo-and-krill", "Mo & Krill"],
        ["paige", "Paige"],
        ["rem", "Rem"],
        ["shiv", "Shiv"],
        ["venator", "Venator"],
        ["victor", "Victor"],
      ],
    },
  ];

  const bucketLanes = document.querySelector("[data-bucket-lanes]");
  bucketLanes.innerHTML = buckets.map((bucket) => `
    <article class="bucket-card bucket-${bucket.id}" aria-label="Dash bucket ${bucket.id}: ${bucket.time} seconds">
      <div class="bucket-metric">
        <span class="bucket-number">BUCKET ${bucket.id}</span>
        <strong class="bucket-time">${bucket.time}<small>SEC</small></strong>
        <span class="bucket-speed"><strong>${bucket.speed} M/S</strong>AIR ${bucket.air} SEC</span>
      </div>
      <div class="hero-cluster">
        ${bucket.heroes.map(([id, name]) => `
          <div class="hero-chip" title="${name}">
            <img src="counterbuy-assets/heroes/${id}.webp" alt="${name}" width="80" height="90" loading="lazy">
            <span>${name}</span>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");

  const canvas = document.querySelector("[data-movement-canvas]");
  const canvasWrap = document.querySelector("[data-canvas-wrap]");
  const ctx = canvas.getContext("2d");
  const elements = {
    speed: document.querySelector("[data-speed]"),
    qualityLabel: document.querySelector("[data-quality-label]"),
    quality: document.querySelector("[data-quality]"),
    chainLabel: document.querySelector("[data-chain-label]"),
    chain: document.querySelector("[data-chain]"),
    coachState: document.querySelector("[data-coach-state]"),
    coachCopy: document.querySelector("[data-coach-copy]"),
    lessonNumber: document.querySelector("[data-lesson-number]"),
    lessonTitle: document.querySelector("[data-lesson-title]"),
    lessonCopy: document.querySelector("[data-lesson-copy]"),
    inputFormula: document.querySelector("[data-input-formula]"),
    whyGrid: document.querySelector("[data-why-grid]"),
    canvasInstruction: document.querySelector("[data-canvas-instruction]"),
    timingCallout: document.querySelector("[data-timing-callout]"),
    timingLabel: document.querySelector("[data-timing-label]"),
    jumpLabel: document.querySelector("[data-jump-label]"),
    jumpButton: document.querySelector("[data-action='jump']"),
  };

  const colors = {
    cyan: "#35cef5",
    green: "#61d46c",
    amber: "#ffb219",
    coral: "#ff6656",
    text: "#f0eadc",
    muted: "#8fa2ad",
  };

  const keys = { a: false, d: false, w: false };
  const MAX_CAMERA_OFFSET = 105 * Math.PI / 180;
  const UNITS_PER_METER = 39.37;
  const AIR_CONTROL_THRESHOLD_UPS = 450;
  const AIR_CONTROL_SLOW_UPS = 80;
  const AIR_CONTROL_FAST_UPS = 50;
  const AIR_ACCELERATE = 10;
  let drill = "strafe";
  let state;
  let lastFrame = performance.now();
  let pointerDown = false;
  let pointerAim = 0;
  let pointerTurnRate = 0;
  let lastPointerEventAt = performance.now();
  let cssWidth = 0;
  let cssHeight = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const alignmentDegrees = () => Math.abs(normalizeAngle(state.heading - state.velocityAngle)) * 180 / Math.PI;

  function alignCameraToCursor() {
    if (!state) return;
    state.heading = -Math.PI / 2 + pointerAim * MAX_CAMERA_OFFSET;
  }

  function getAirControlWindow(speed = state.speed) {
    const speedUps = speed * UNITS_PER_METER;
    const capUps = speedUps < AIR_CONTROL_THRESHOLD_UPS ? AIR_CONTROL_SLOW_UPS : AIR_CONTROL_FAST_UPS;
    const minimumAngle = speedUps <= capUps ? 0 : Math.acos(clamp(capUps / speedUps, 0, 1)) * 180 / Math.PI;
    return {
      speedUps,
      capUps,
      minimumAngle,
      width: 90 - minimumAngle,
    };
  }

  function getInputGeometry(keySignal) {
    const window = getAirControlWindow();
    if (keySignal === 0) {
      return { ...window, wishAngle: null, wishDelta: null, inWindow: false, over: false, capped: false };
    }
    const wishAngle = normalizeAngle(state.heading + keySignal * Math.PI / 2);
    const wishDelta = Math.abs(normalizeAngle(wishAngle - state.velocityAngle)) * 180 / Math.PI;
    return {
      ...window,
      wishAngle,
      wishDelta,
      inWindow: wishDelta >= window.minimumAngle && wishDelta <= 90,
      over: wishDelta > 90,
      capped: wishDelta < window.minimumAngle,
    };
  }

  function applyAirAcceleration(dt, keySignal, strength = 1) {
    const geometry = getInputGeometry(keySignal);
    if (keySignal === 0) return geometry;

    const velocityX = Math.cos(state.velocityAngle) * geometry.speedUps;
    const velocityY = Math.sin(state.velocityAngle) * geometry.speedUps;
    const alongWish = velocityX * Math.cos(geometry.wishAngle) + velocityY * Math.sin(geometry.wishAngle);
    const addSpeed = geometry.capUps - alongWish;
    if (addSpeed <= 0) return geometry;

    // Deadlock exposes sv_airaccelerate=10 and 80/50 u/s air-control caps.
    // Using the active cap as wish speed keeps this trainer conservative while
    // preserving the real dot-product window and its 450 u/s breakpoint.
    const accelerationUps = Math.min(addSpeed, AIR_ACCELERATE * geometry.capUps * dt * strength);
    const nextX = velocityX + Math.cos(geometry.wishAngle) * accelerationUps;
    const nextY = velocityY + Math.sin(geometry.wishAngle) * accelerationUps;
    const nextSpeedUps = Math.hypot(nextX, nextY);
    state.speed = clamp(nextSpeedUps / UNITS_PER_METER, 7, 20);
    state.velocityAngle = Math.atan2(nextY, nextX);
    return geometry;
  }

  function setPointerAimFromClientX(clientX, trackRate = true) {
    const rect = canvasWrap.getBoundingClientRect();
    const nextAim = clamp((clientX - (rect.left + rect.width / 2)) / Math.max(1, rect.width / 2), -1, 1);
    const now = performance.now();
    const elapsed = (now - lastPointerEventAt) / 1000;
    if (trackRate && elapsed > 0.008 && elapsed < 0.25) {
      pointerTurnRate = clamp((nextAim - pointerAim) / elapsed, -4, 4);
    } else {
      pointerTurnRate = 0;
    }
    pointerAim = nextAim;
    lastPointerEventAt = now;
    alignCameraToCursor();
  }

  function makeState() {
    return {
      active: false,
      elapsed: 0,
      speed: drill === "strafe" ? 9.8 : 13.0,
      startSpeed: drill === "strafe" ? 9.8 : 13.0,
      bestGain: 0,
      heading: -Math.PI / 2,
      velocityAngle: -Math.PI / 2,
      x: 0,
      y: 0,
      trail: [],
      sync: 0,
      lastSignal: 0,
      lastInputAt: 0,
      phase: drill === "bhop" ? "slide" : "air",
      slideTime: drill === "bhop" ? 0.35 : 0,
      airTime: 0,
      vertical: 0,
      grounded: true,
      takeoffClean: false,
      airSync: 0,
      overstrafed: false,
      lastLandingClean: false,
      streak: 0,
      bestStreak: 0,
      eventText: "READY",
      eventTone: "green",
    };
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    cssWidth = Math.max(1, rect.width);
    cssHeight = Math.max(1, rect.height);
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function setHeld(key, held) {
    if (!(key in keys)) return;
    keys[key] = held;
    document.querySelector(`[data-hold-key="${key}"]`)?.classList.toggle("is-held", held);
    if (held && !state.active) state.active = true;
  }

  function setCoach(stateLabel, copy, tone = "green") {
    state.eventText = stateLabel;
    state.eventTone = tone;
    elements.coachState.textContent = stateLabel;
    elements.coachState.style.color = colors[tone] || colors.green;
    elements.coachCopy.textContent = copy;
  }

  function reset() {
    state = makeState();
    keys.a = false;
    keys.d = false;
    keys.w = false;
    pointerTurnRate = 0;
    alignCameraToCursor();
    document.querySelectorAll("[data-hold-key]").forEach((button) => button.classList.remove("is-held"));
    elements.jumpButton.classList.remove("is-hot");
    updateLesson();
    if (drill === "strafe") {
      setCoach("READY", "Start centered. Hold A or D, then move the camera that way slowly enough to keep the amber wish arrow in green.");
    } else {
      setCoach("ALIGN FIRST", "Match the white camera arrow to blue velocity, then hold A or D just before Space.");
    }
    updateReadout();
  }

  function updateLesson() {
    const isStrafe = drill === "strafe";
    elements.lessonNumber.textContent = isStrafe ? "01" : "02";
    elements.lessonTitle.textContent = isStrafe ? "PAIR THE TURN" : "ALIGN, THEN CARVE";
    elements.lessonCopy.textContent = isStrafe
      ? "Blue is velocity; white is your camera; amber is the A/D wish direction. The green acceleration window narrows with speed. Keep amber inside it without crossing 90°."
      : "During the slide, align the camera with velocity. Just before jumping hold A or D; as you jump, smoothly turn the camera the same way. Land into slide and realign.";
    elements.inputFormula.innerHTML = isStrafe
      ? `<span class="keycap keycap-muted">W UP</span><span class="formula-arrow">+</span><span class="keycap">A</span><span class="mouse-turn">MOUSE <i>&larr;</i></span><span class="formula-or">OR</span><span class="keycap">D</span><span class="mouse-turn">MOUSE <i>&rarr;</i></span>`
      : `<span class="mouse-turn">CAM <i>&uarr;</i> VELOCITY</span><span class="formula-arrow">THEN</span><span class="keycap">A / D</span><span class="formula-arrow">BEFORE</span><span class="keycap">SPACE</span><span class="formula-arrow">+</span><span class="mouse-turn">TURN</span>`;
    elements.whyGrid.innerHTML = isStrafe
      ? `<div><span>GOOD SYNC</span><strong>STRAFE + CAMERA TURN MATCH</strong><small>Velocity curves cleanly; momentum grows.</small></div><div><span>COMMON LEAK</span><strong>HOLDING W / TURNING TOO FAST</strong><small>Both reduce useful sideways acceleration.</small></div>`
      : `<div><span>ON THE SLIDE</span><strong>CAMERA ON VELOCITY</strong><small>Turning does not change slide speed; use this phase to realign.</small></div><div><span>AT TAKEOFF</span><strong>A/D FIRST, THEN JUMP + TURN</strong><small>Start the smooth matching turn as you leave the slide.</small></div>`;
    elements.qualityLabel.textContent = "CAM <> VELOCITY";
    elements.chainLabel.textContent = isStrafe ? "BEST GAIN" : "CLEAN HOPS";
    elements.canvasInstruction.innerHTML = isStrafe
      ? "<strong>CENTER X = CAMERA STRAIGHT AHEAD</strong><span>Cursor distance sets an absolute white camera angle</span>"
      : "<strong>SLIDE · ALIGN CAMERA</strong><span>White camera arrow should sit on blue velocity</span>";
    elements.timingCallout.hidden = isStrafe;
    elements.timingLabel.textContent = "SLIDE WINDOW";
    elements.jumpLabel.textContent = isStrafe ? "RESET RUN" : "JUMP FROM SLIDE";
  }

  function setDrill(nextDrill) {
    if (nextDrill === drill) return;
    drill = nextDrill;
    document.querySelectorAll("[data-drill]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.drill === drill));
    });
    reset();
  }

  function jump() {
    if (drill === "strafe") {
      reset();
      state.active = true;
      setCoach("RUNNING", "Pair your strafe key with a smooth turn in the same direction.");
      return;
    }

    state.active = true;
    if (state.phase === "slide") {
      const keySignal = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      const alignment = alignmentDegrees();
      const timingClean = state.slideTime >= 0.45 && state.slideTime <= 1.05;
      const alignmentClean = alignment <= 12;
      const inputClean = keySignal !== 0 && !keys.w;

      state.phase = "air";
      state.grounded = false;
      state.airTime = 0;
      state.vertical = 0;
      state.takeoffClean = timingClean && alignmentClean && inputClean;
      state.airSync = 0;
      state.overstrafed = false;

      if (!alignmentClean) {
        state.speed = Math.max(7, state.speed - 0.45);
        setCoach("MISALIGNED", "Camera should match slide velocity before takeoff. Realign during the next slide.", "coral");
      } else if (!inputClean) {
        state.speed = Math.max(7, state.speed - 0.3);
        setCoach("A/D FIRST", "Hold the strafe key just before Space, then turn with it.", "coral");
      } else if (!timingClean) {
        state.speed = Math.max(7, state.speed - 0.35);
        setCoach("SLIDE LONGER", "Let the slide carry for about half a second before hopping.", "coral");
      } else {
        setCoach("TURN NOW", `Keep ${keySignal < 0 ? "A" : "D"} held and turn ${keySignal < 0 ? "left" : "right"} smoothly.`, "green");
      }
      return;
    }

    state.speed = Math.max(7, state.speed - 0.55);
    state.streak = 0;
    setCoach("AIR JUMP RISK", "Space belongs at slide takeoff. Pressing it airborne can spend your double jump.", "coral");
  }

  function updateStrafe(dt) {
    if (!state.active) return;
    state.elapsed += dt;
    const keySignal = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    alignCameraToCursor();
    let geometry = getInputGeometry(keySignal);

    if (keys.w) {
      state.speed = Math.max(8.4, state.speed - 0.38 * dt);
      state.velocityAngle += (state.heading - state.velocityAngle) * 0.28 * dt;
      state.sync = Math.max(0, state.sync - 2.2 * dt);
      setCoach("RELEASE W", "Forward input fights the sideways wish-direction. Let W go in the air.", "coral");
    } else if (keySignal !== 0) {
      const previousSpeed = state.speed;
      geometry = applyAirAcceleration(dt, keySignal);
      if (geometry.over) {
        state.sync = Math.max(0, state.sync - 2.5 * dt);
        setCoach("OVER 90°", "Amber crossed the velocity-perpendicular line. Turn less sharply or let velocity catch up.", "coral");
      } else if (geometry.inWindow) {
        state.sync = Math.min(1, state.sync + 2.5 * dt);
        state.lastInputAt = state.elapsed;
        const gain = Math.max(0, state.speed - previousSpeed) * UNITS_PER_METER;
        setCoach("IN THE GREEN", `Full air-control window. This frame added about ${gain.toFixed(1)} u/s of total speed.`, "green");
      } else {
        state.sync = Math.max(0, state.sync - 0.7 * dt);
        setCoach("CAP-LIMITED", "Amber is too close to velocity. Turn a little farther to move it into the green wedge.", "amber");
      }
    } else {
      state.sync = Math.max(0, state.sync - 0.7 * dt);
      if (state.elapsed - state.lastInputAt > 0.35) {
        setCoach("ADD A / D", "Hold a side key. Its amber wish arrow shows whether your camera angle is inside the live green window.", "amber");
      }
    }

    state.bestGain = Math.max(state.bestGain, state.speed - state.startSpeed);
    const scale = 18;
    state.x += Math.cos(state.velocityAngle) * state.speed * dt * scale;
    state.y += Math.sin(state.velocityAngle) * state.speed * dt * scale;
    state.trail.push({ x: state.x, y: state.y, tone: geometry.inWindow ? 1 : 0 });
    if (state.trail.length > 260) state.trail.shift();
    alignCameraToCursor();
    pointerTurnRate *= Math.pow(0.035, dt);
  }

  function updateBhop(dt) {
    if (!state.active) return;
    state.elapsed += dt;
    const keySignal = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    alignCameraToCursor();
    let geometry = getInputGeometry(keySignal);

    if (state.phase === "air") {
      state.airTime += dt;
      const progress = clamp(state.airTime / 0.8, 0, 1);
      state.vertical = Math.sin(progress * Math.PI);

      if (keySignal !== 0 && !keys.w) {
        geometry = applyAirAcceleration(dt, keySignal, state.speed >= AIR_CONTROL_THRESHOLD_UPS / UNITS_PER_METER ? 0.9 : 1);
        if (geometry.over) {
          state.overstrafed = true;
          setCoach("OVER 90°", "Amber crossed past perpendicular. Ease the camera turn so the wish arrow returns to green.", "coral");
        } else if (geometry.inWindow) {
          state.airSync += dt;
          if (state.takeoffClean) {
            setCoach("CARVING", "Amber is in the live acceleration window. Follow it as the green wedge narrows.", "green");
          }
        } else {
          setCoach("FIND THE GREEN", "The wish angle is cap-limited. Turn smoothly until amber reaches the green wedge.", "amber");
        }
      } else if (keys.w) {
        state.speed = Math.max(7, state.speed - 0.16 * dt);
        setCoach("RELEASE W", "Use the sideways key and matching camera turn while airborne.", "coral");
      }

      if (state.airTime >= 0.8) {
        state.vertical = 0;
        state.phase = "slide";
        state.grounded = true;
        state.slideTime = 0;
        const cleanHop = state.takeoffClean && state.airSync >= 0.12 && !state.overstrafed;
        state.lastLandingClean = cleanHop;
        if (cleanHop) {
          state.streak += 1;
          state.bestStreak = Math.max(state.bestStreak, state.streak);
          state.speed = Math.min(20, state.speed + 0.12);
          setCoach("LAND -> REALIGN", "You kept momentum. During this slide, put the white camera arrow back on blue velocity.", "green");
        } else {
          state.streak = 0;
          setCoach("LAND -> RESET", "Use the slide to realign camera and velocity before the next takeoff.", "amber");
        }
      }
    } else {
      state.slideTime += dt;
      state.grounded = true;
      state.vertical = 0;
      const alignment = alignmentDegrees();
      const ready = state.slideTime >= 0.45 && state.slideTime <= 1.05;

      if (state.slideTime < 0.14 && state.elapsed > 0.5) {
        setCoach(state.lastLandingClean ? "LAND -> REALIGN" : "LAND -> RESET", "The slide locks in velocity; use it to put the white camera arrow back on blue.", state.lastLandingClean ? "green" : "amber");
      } else if (state.slideTime > 1.05) {
        state.speed = Math.max(7, state.speed - 1.8 * dt);
        setCoach("HOP SOONER", "The useful slide window is ending. Realign, preload A/D, then jump.", "coral");
      } else if (alignment > 12) {
        setCoach("REALIGN CAMERA", "Turning cannot change slide velocity. Put white back on blue before takeoff.", "amber");
      } else if (keySignal !== 0 && ready && !keys.w) {
        setCoach("READY TO HOP", `Camera aligned. Keep ${keySignal < 0 ? "A" : "D"} held, press Space, then turn ${keySignal < 0 ? "left" : "right"}.`, "green");
      } else if (ready) {
        setCoach("PRELOAD A / D", "Camera is aligned. Hold your turn key just before pressing Space.", "amber");
      } else {
        setCoach("SLIDING", "Camera alignment matters now; movement keys do not change slide speed.", "green");
      }
    }

    const scale = 16;
    state.x += Math.cos(state.velocityAngle) * state.speed * dt * scale;
    state.y += Math.sin(state.velocityAngle) * state.speed * dt * scale;
    state.trail.push({ x: state.x, y: state.y, tone: state.phase === "air" ? 1 : 0 });
    if (state.trail.length > 300) state.trail.shift();
    alignCameraToCursor();
    pointerTurnRate *= Math.pow(0.035, dt);
  }

  function updateReadout() {
    elements.speed.textContent = state.speed.toFixed(1);
    const alignment = Math.round(alignmentDegrees());
    const keySignal = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const geometry = getInputGeometry(keySignal);
    if (drill === "strafe") {
      elements.quality.textContent = keySignal === 0
        ? `${alignment}° CAMERA`
        : `${Math.round(geometry.wishDelta)}° ${geometry.inWindow ? "GREEN" : geometry.over ? "OVER" : "CAPPED"}`;
      elements.quality.style.color = keySignal === 0 ? colors.amber : geometry.inWindow ? colors.green : geometry.over ? colors.coral : colors.amber;
      elements.chain.textContent = `+${state.bestGain.toFixed(1)}`;
    } else {
      const showingWish = state.phase === "air" && keySignal !== 0;
      elements.quality.textContent = showingWish
        ? `${Math.round(geometry.wishDelta)}° ${geometry.inWindow ? "GREEN" : geometry.over ? "OVER" : "CAPPED"}`
        : `${alignment}° ${alignment <= 12 ? "ALIGNED" : "OFF"}`;
      elements.quality.style.color = showingWish
        ? geometry.inWindow ? colors.green : geometry.over ? colors.coral : colors.amber
        : alignment <= 12 ? colors.green : alignment <= 45 ? colors.amber : colors.coral;
      elements.chain.textContent = String(state.streak);
      const hot = state.phase === "slide" && state.slideTime >= 0.45 && state.slideTime <= 1.05 && alignment <= 12 && keySignal !== 0 && !keys.w;
      elements.jumpButton.classList.toggle("is-hot", hot);
      elements.timingLabel.textContent = state.phase === "slide" ? "SLIDE / ALIGN" : "AIR / TURN";
      elements.timingCallout.style.setProperty("--landing-progress", state.phase === "slide" ? clamp(state.slideTime / 0.5, 0, 1) : clamp(state.airTime / 0.8, 0, 1));
      elements.canvasInstruction.innerHTML = state.phase === "slide"
        ? "<strong>SLIDE · ALIGN CAMERA</strong><span>White camera arrow should sit on <b>blue velocity</b></span>"
        : "<strong>AIR · TURN WITH A / D</strong><span>Smooth input; faster speed needs a slower turn</span>";
    }
  }

  function drawGrid(offsetX = 0, offsetY = 0) {
    ctx.fillStyle = "#06111b";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    const grid = 42;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(74, 134, 159, 0.10)";
    ctx.beginPath();
    for (let x = ((offsetX % grid) + grid) % grid; x < cssWidth; x += grid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssHeight);
    }
    for (let y = ((offsetY % grid) + grid) % grid; y < cssHeight; y += grid) {
      ctx.moveTo(0, y);
      ctx.lineTo(cssWidth, y);
    }
    ctx.stroke();
  }

  function drawArrow(x, y, angle, color, length = 30) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(length - 8, -5);
    ctx.lineTo(length - 8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawRunner(x, y, angle = 0, airborne = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowBlur = 18;
    ctx.shadowColor = airborne ? colors.green : colors.amber;
    ctx.fillStyle = "#061019";
    ctx.strokeStyle = airborne ? colors.green : colors.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawAimRail(y) {
    const left = 18;
    const right = cssWidth - 18;
    const center = cssWidth / 2;
    const markerX = center + pointerAim * (right - left) / 2;

    ctx.strokeStyle = "rgba(143, 188, 212, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(240, 234, 220, 0.4)";
    ctx.beginPath();
    ctx.moveTo(center, y - 7);
    ctx.lineTo(center, y + 7);
    ctx.stroke();

    ctx.fillStyle = colors.green;
    ctx.beginPath();
    ctx.arc(markerX, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "700 7px Arial";
    ctx.fillStyle = "rgba(143, 162, 173, 0.68)";
    ctx.textAlign = "left";
    ctx.fillText("CAM LEFT", left, y - 8);
    ctx.textAlign = "center";
    ctx.fillText("CENTER = STRAIGHT AHEAD", center, y - 8);
    ctx.textAlign = "right";
    ctx.fillText("CAM RIGHT", right, y - 8);
    ctx.textAlign = "left";
  }

  function drawSector(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fill();
  }

  function drawAirControlCompass(centerX, centerY, keySignal, active = true) {
    const geometry = getInputGeometry(keySignal);
    const velocityAngle = state.velocityAngle;
    const minimum = geometry.minimumAngle * Math.PI / 180;
    const radius = clamp(Math.min(cssWidth * 0.16, cssHeight * 0.24), 62, 94);
    const innerRadius = 22;
    const alpha = active ? 1 : 0.34;

    ctx.save();
    ctx.lineCap = "butt";
    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgba(53, 206, 245, ${0.18 * alpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, velocityAngle - Math.PI / 2, velocityAngle + Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 102, 86, ${0.2 * alpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, velocityAngle + Math.PI / 2, velocityAngle + Math.PI * 1.5);
    ctx.stroke();

    drawSector(
      centerX,
      centerY,
      innerRadius,
      radius - 4,
      velocityAngle + minimum,
      velocityAngle + Math.PI / 2,
      `rgba(97, 212, 108, ${0.19 * alpha})`,
    );
    drawSector(
      centerX,
      centerY,
      innerRadius,
      radius - 4,
      velocityAngle - Math.PI / 2,
      velocityAngle - minimum,
      `rgba(97, 212, 108, ${0.19 * alpha})`,
    );

    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(97, 212, 108, ${0.9 * alpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, velocityAngle + minimum, velocityAngle + Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, velocityAngle - Math.PI / 2, velocityAngle - minimum);
    ctx.stroke();

    const labelX = 18;
    const labelY = Math.max(144, centerY - radius - 15);
    ctx.font = "700 8px Consolas";
    ctx.textAlign = "left";
    ctx.fillStyle = active ? colors.green : colors.muted;
    ctx.fillText(active ? "GREEN = AIR ACCELERATION WINDOW" : "AIR WINDOW PAUSED DURING SLIDE", labelX, labelY);
    ctx.fillStyle = "rgba(240, 234, 220, 0.62)";
    ctx.fillText(
      `${Math.round(geometry.speedUps)} u/s · ${geometry.capUps} u/s CONTROL · ${geometry.minimumAngle.toFixed(1)}–90° WISH`,
      labelX,
      labelY + 13,
    );
    ctx.fillStyle = "rgba(143, 162, 173, 0.52)";
    ctx.fillText("CONTROL DROPS 80→50 u/s AT 450 u/s (11.4 m/s)", labelX, labelY + 26);
    ctx.restore();
  }

  function drawStrafe() {
    const centerX = cssWidth * 0.5;
    const centerY = cssHeight * 0.64;
    const cameraDisplay = state.heading;
    drawGrid(-state.x * 0.14, -state.y * 0.14);
    drawAimRail(Math.min(126, Math.max(92, cssHeight * 0.28)));

    ctx.save();
    ctx.translate(centerX - state.x, centerY - state.y);

    if (state.trail.length > 1) {
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      state.trail.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = state.sync > 0.4 ? colors.green : colors.cyan;
      ctx.stroke();
    }
    ctx.restore();

    const keySignal = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    drawAirControlCompass(centerX, centerY, keySignal);

    ctx.strokeStyle = "rgba(240, 234, 220, 0.18)";
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 155);
    ctx.lineTo(centerX, centerY - 190);
    ctx.stroke();
    ctx.setLineDash([]);

    if (keySignal !== 0) {
      drawArrow(centerX, centerY, cameraDisplay + keySignal * Math.PI / 2, colors.amber, 35);
    }
    drawArrow(centerX, centerY, state.velocityAngle, colors.cyan, 52);
    drawArrow(centerX, centerY, cameraDisplay, "rgba(240, 234, 220, 0.7)", 38);
    drawRunner(centerX, centerY, cameraDisplay, true);

    const cameraOffset = normalizeAngle(cameraDisplay - state.velocityAngle);
    if (Math.abs(cameraOffset) > 0.025) {
      ctx.strokeStyle = alignmentDegrees() > 92 ? colors.coral : "rgba(240, 234, 220, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, state.velocityAngle, cameraDisplay, cameraOffset < 0);
      ctx.stroke();
    }

    ctx.font = "700 8px Arial";
    ctx.letterSpacing = "1px";
    ctx.fillStyle = colors.cyan;
    ctx.fillText("VELOCITY", centerX + Math.cos(state.velocityAngle) * 57 + 5, centerY + Math.sin(state.velocityAngle) * 57);
    ctx.fillStyle = "rgba(240, 234, 220, 0.55)";
    ctx.fillText("CAMERA", centerX + Math.cos(cameraDisplay) * 45 + 5, centerY + Math.sin(cameraDisplay) * 45);
    if (keySignal !== 0) {
      ctx.fillStyle = colors.amber;
      ctx.fillText(keySignal < 0 ? "A WISH" : "D WISH", centerX + Math.cos(cameraDisplay + keySignal * Math.PI / 2) * 41, centerY + Math.sin(cameraDisplay + keySignal * Math.PI / 2) * 41);
    }

    ctx.fillStyle = "rgba(143, 162, 173, 0.45)";
    ctx.font = "700 9px Consolas";
    ctx.fillText("FORWARD TRAVEL  ↑", 18, cssHeight - 20);
    ctx.textAlign = "right";
    ctx.fillText("SLOWER TURN AS SPEED RISES", cssWidth - 18, cssHeight - 20);
    ctx.textAlign = "left";
  }

  function drawBhop() {
    const centerX = cssWidth * 0.5;
    const centerY = cssHeight * 0.66;
    const cameraDisplay = state.heading;
    const keySignal = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    drawGrid(-state.x * 0.14, -state.y * 0.14);
    drawAimRail(128);

    ctx.save();
    ctx.translate(centerX - state.x, centerY - state.y);
    if (state.trail.length > 1) {
      ctx.beginPath();
      state.trail.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.restore();

    drawAirControlCompass(centerX, centerY, keySignal, state.phase === "air");

    ctx.strokeStyle = "rgba(240, 234, 220, 0.16)";
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 140);
    ctx.lineTo(centerX, centerY - 175);
    ctx.stroke();
    ctx.setLineDash([]);

    const shadowWidth = 30 - state.vertical * 12;
    ctx.fillStyle = `rgba(255, 178, 25, ${0.28 - state.vertical * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 4, shadowWidth, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (keySignal !== 0) {
      drawArrow(centerX, centerY, cameraDisplay + keySignal * Math.PI / 2, colors.amber, 35);
    }
    drawArrow(centerX, centerY, state.velocityAngle, colors.cyan, 52);
    drawArrow(centerX, centerY, cameraDisplay, "rgba(240, 234, 220, 0.72)", 39);
    drawRunner(centerX, centerY - state.vertical * 10, cameraDisplay, state.phase === "air");

    const cameraOffset = normalizeAngle(cameraDisplay - state.velocityAngle);
    if (Math.abs(cameraOffset) > 0.025) {
      ctx.strokeStyle = alignmentDegrees() > 12 && state.phase === "slide" ? colors.amber : "rgba(240, 234, 220, 0.32)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 62, state.velocityAngle, cameraDisplay, cameraOffset < 0);
      ctx.stroke();
    }

    ctx.fillStyle = colors.cyan;
    ctx.font = "700 8px Arial";
    ctx.fillText("VELOCITY", centerX + Math.cos(state.velocityAngle) * 57 + 5, centerY + Math.sin(state.velocityAngle) * 57);
    ctx.fillStyle = "rgba(240, 234, 220, 0.58)";
    ctx.fillText("CAMERA", centerX + Math.cos(cameraDisplay) * 46 + 5, centerY + Math.sin(cameraDisplay) * 46);
    if (keySignal !== 0) {
      ctx.fillStyle = colors.amber;
      ctx.fillText(keySignal < 0 ? "A WISH" : "D WISH", centerX + Math.cos(cameraDisplay + keySignal * Math.PI / 2) * 41, centerY + Math.sin(cameraDisplay + keySignal * Math.PI / 2) * 41);
    }

    const labels = ["ALIGN", "A / D", "JUMP + TURN", "LAND / SLIDE"];
    let activePhase = 0;
    if (state.phase === "air") activePhase = 2;
    else if (state.slideTime < 0.14 && state.elapsed > 0.5) activePhase = 3;
    else if (keySignal !== 0 && alignmentDegrees() <= 12) activePhase = 1;
    const railX = 18;
    const railY = 82;
    const railGap = 5;
    const railWidth = Math.max(54, Math.min(100, (cssWidth - railX * 2 - railGap * 3) / 4));
    labels.forEach((label, index) => {
      const x = railX + index * (railWidth + railGap);
      ctx.fillStyle = index === activePhase ? "rgba(97, 212, 108, 0.16)" : "rgba(12, 31, 45, 0.72)";
      ctx.strokeStyle = index === activePhase ? colors.green : "rgba(143, 188, 212, 0.2)";
      ctx.lineWidth = 1;
      ctx.fillRect(x, railY, railWidth, 25);
      ctx.strokeRect(x, railY, railWidth, 25);
      ctx.fillStyle = index === activePhase ? colors.green : colors.muted;
      ctx.font = "700 7px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, x + railWidth / 2, railY + 16);
    });
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(143, 162, 173, 0.54)";
    ctx.font = "700 9px Consolas";
    ctx.fillText(state.phase === "slide" ? "SLIDE: CAMERA CAN REALIGN; VELOCITY STAYS FIXED" : "AIR: STRAFE + CAMERA TURN CURVE VELOCITY", 18, cssHeight - 20);
    ctx.textAlign = "right";
    ctx.fillText("FORWARD TRAVEL  ↑", cssWidth - 18, cssHeight - 20);
    ctx.textAlign = "left";
  }

  function animate(now) {
    const dt = Math.min(0.035, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (drill === "strafe") {
      updateStrafe(dt);
      drawStrafe();
    } else {
      updateBhop(dt);
      drawBhop();
    }
    updateReadout();
    requestAnimationFrame(animate);
  }

  document.querySelectorAll("[data-drill]").forEach((button) => {
    button.addEventListener("click", () => setDrill(button.dataset.drill));
  });

  document.querySelector("[data-action='reset']").addEventListener("click", reset);
  elements.jumpButton.addEventListener("click", jump);

  document.querySelectorAll("[data-hold-key]").forEach((button) => {
    const key = button.dataset.holdKey;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      setHeld(key, true);
    });
    const release = () => setHeld(key, false);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["a", "d", "w"].includes(key)) {
      event.preventDefault();
      setHeld(key, true);
    }
    if (event.code === "Space" && !event.repeat) {
      event.preventDefault();
      jump();
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      pointerAim = clamp(pointerAim + (event.key === "ArrowLeft" ? -0.08 : 0.08), -1, 1);
      pointerTurnRate = event.key === "ArrowLeft" ? -0.7 : 0.7;
      alignCameraToCursor();
      if (!state.active) state.active = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    setHeld(event.key.toLowerCase(), false);
  });

  canvasWrap.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    setPointerAimFromClientX(event.clientX, false);
    canvasWrap.setPointerCapture(event.pointerId);
    if (!state.active) state.active = true;
  });

  canvasWrap.addEventListener("pointermove", (event) => {
    setPointerAimFromClientX(event.clientX, true);
    if (!state.active) state.active = true;
  });

  const endPointer = () => {
    pointerDown = false;
  };
  canvasWrap.addEventListener("pointerup", endPointer);
  canvasWrap.addEventListener("pointercancel", endPointer);
  canvasWrap.addEventListener("lostpointercapture", endPointer);
  canvasWrap.addEventListener("pointerenter", (event) => {
    setPointerAimFromClientX(event.clientX, false);
  });
  canvasWrap.addEventListener("pointerleave", (event) => {
    pointerTurnRate = 0;
    pointerDown = false;
    if (canvasWrap.hasPointerCapture?.(event.pointerId)) {
      canvasWrap.releasePointerCapture(event.pointerId);
    }
  });

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(canvasWrap);
  reset();
  resizeCanvas();
  requestAnimationFrame(animate);
})();
