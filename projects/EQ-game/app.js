const profiles = [
  {
    id: "boomy",
    label: "Boomy",
    hint: "Low weight",
    summary: "A broad low boost around 90 Hz makes the track feel swollen and oversized.",
    filters: [{ type: "peaking", frequency: 90, q: 0.85, gain: 9 }],
  },
  {
    id: "muddy",
    label: "Muddy",
    hint: "Low-mid cloud",
    summary: "A boost around 240 Hz masks detail and makes the mix feel cloudy.",
    filters: [{ type: "peaking", frequency: 240, q: 0.9, gain: 8.5 }],
  },
  {
    id: "boxy",
    label: "Boxy",
    hint: "Lower-mid knock",
    summary: "A bump around 520 Hz adds a closed-in cardboard quality.",
    filters: [{ type: "peaking", frequency: 520, q: 1.25, gain: 8 }],
  },
  {
    id: "nasal",
    label: "Nasal",
    hint: "Forward mids",
    summary: "A focused boost around 1 kHz pushes the tone into a pinched, honky range.",
    filters: [{ type: "peaking", frequency: 1000, q: 1.15, gain: 8 }],
  },
  {
    id: "hollow",
    label: "Hollow",
    hint: "Missing core",
    summary: "A wide mid scoop around 750 Hz removes body and leaves a hollow center.",
    filters: [{ type: "peaking", frequency: 750, q: 0.8, gain: -10 }],
  },
  {
    id: "scooped",
    label: "Scooped",
    hint: "Wide mid dip",
    summary: "A deeper, wider mid cut makes lows and highs stand out while the center vanishes.",
    filters: [{ type: "peaking", frequency: 1300, q: 0.55, gain: -11 }],
  },
  {
    id: "harsh",
    label: "Harsh",
    hint: "Presence bite",
    summary: "A presence boost around 3.2 kHz makes the track feel sharp and fatiguing.",
    filters: [{ type: "peaking", frequency: 3200, q: 1.05, gain: 8.5 }],
  },
  {
    id: "sibilant",
    label: "Sibilant",
    hint: "Top-end spit",
    summary: "A narrow high boost around 7.2 kHz exaggerates esses, cymbal edge, and fizz.",
    filters: [{ type: "peaking", frequency: 7200, q: 1.25, gain: 8 }],
  },
  {
    id: "dull",
    label: "Dull",
    hint: "Highs pulled back",
    summary: "A high shelf cut above 6 kHz takes away air and transient shine.",
    filters: [{ type: "highshelf", frequency: 6000, q: 0.7, gain: -9 }],
  },
  {
    id: "thin",
    label: "Thin",
    hint: "Low end missing",
    summary: "A low shelf cut below 170 Hz weakens weight and makes the mix feel small.",
    filters: [{ type: "lowshelf", frequency: 170, q: 0.7, gain: -9 }],
  },
  {
    id: "cold",
    label: "Cold",
    hint: "Warmth missing",
    summary: "A focused cut around 320 Hz removes warmth and leaves the track feeling cold.",
    filters: [{ type: "peaking", frequency: 320, q: 1, gain: -8.5 }],
  },
  {
    id: "distant",
    label: "Distant",
    hint: "Presence missing",
    summary: "A presence cut around 3 kHz pushes detail backward and makes the mix feel distant.",
    filters: [{ type: "peaking", frequency: 3000, q: 1.05, gain: -8.5 }],
  },
];

const eqPairs = [
  { boost: "boomy", neutral: "Full", cut: "thin" },
  { boost: "muddy", neutral: "Warm", cut: "cold" },
  { boost: "boxy", neutral: "Natural", cut: "hollow" },
  { boost: "nasal", neutral: "Balanced", cut: "scooped" },
  { boost: "harsh", neutral: "Clear", cut: "distant" },
  { boost: "sibilant", neutral: "Crisp", cut: "dull" },
];

const difficultyOrder = [
  "boomy",
  "thin",
  "harsh",
  "distant",
  "boxy",
  "hollow",
  "nasal",
  "scooped",
  "muddy",
  "cold",
  "sibilant",
  "dull",
];

const els = {
  fileButton: document.getElementById("fileButton"),
  fileInput: document.getElementById("fileInput"),
  dropZone: document.getElementById("dropZone"),
  trackName: document.getElementById("trackName"),
  trackMeta: document.getElementById("trackMeta"),
  waveCanvas: document.getElementById("waveCanvas"),
  feedbackCanvas: document.getElementById("feedbackCanvas"),
  currentTime: document.getElementById("currentTime"),
  durationTime: document.getElementById("durationTime"),
  volumeSlider: document.getElementById("volumeSlider"),
  volumeValue: document.getElementById("volumeValue"),
  playButton: document.getElementById("playButton"),
  dryButton: document.getElementById("dryButton"),
  wetButton: document.getElementById("wetButton"),
  loopButton: document.getElementById("loopButton"),
  loopLengthValue: document.getElementById("loopLengthValue"),
  identifyTab: document.getElementById("identifyTab"),
  auditionTab: document.getElementById("auditionTab"),
  quizHeading: document.getElementById("quizHeading"),
  difficultyControl: document.getElementById("difficultyControl"),
  difficultySlider: document.getElementById("difficultySlider"),
  difficultyValue: document.getElementById("difficultyValue"),
  optionGrid: document.getElementById("optionGrid"),
  answerActions: document.getElementById("answerActions"),
  confirmButton: document.getElementById("confirmButton"),
  resultPanel: document.getElementById("resultPanel"),
  resultKicker: document.getElementById("resultKicker"),
  resultTitle: document.getElementById("resultTitle"),
  resultText: document.getElementById("resultText"),
  eqCanvas: document.getElementById("eqCanvas"),
  streakCount: document.getElementById("streakCount"),
  streakPill: document.querySelector(".streak-pill"),
  appShell: document.querySelector(".app-shell"),
};

let audioCtx;
let masterGain;
let audioBuffer;
let currentSource;
let activeDryGain;
let activeWetGain;
let currentProfile;
let selectedProfileId = "";
let answered = false;
let streak = 0;
let monitorMode = "dry";
let isPlaying = false;
let startOffset = 0;
let startCtxTime = 0;
let loopEnabled = false;
let loopStart = 0;
let loopEnd = 1;
let loopLength = 1;
let wavePeaks = [];
let particles = [];
let lastProfileId = "";
let gameMode = "identify";
let difficulty = profiles.length;
let isWaveDragging = false;

function ensureAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = Number(els.volumeSlider.value) / 100;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function updateVolume() {
  const volume = Number(els.volumeSlider.value);
  els.volumeValue.textContent = `${volume}%`;
  if (masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(volume / 100, now, 0.015);
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatFrequency(freq) {
  if (freq >= 1000) {
    return `${Number((freq / 1000).toFixed(freq >= 10000 ? 0 : 1))}k`;
  }
  return String(freq);
}

function getDuration() {
  return audioBuffer ? audioBuffer.duration : 0;
}

function clampTime(value) {
  const duration = getDuration();
  return Math.min(Math.max(0, value), Math.max(0, duration - 0.001));
}

function getCurrentPosition() {
  if (!audioBuffer) {
    return 0;
  }

  if (!isPlaying || !audioCtx) {
    return clampTime(startOffset);
  }

  const elapsed = audioCtx.currentTime - startCtxTime;
  if (loopEnabled) {
    const length = Math.max(0.05, loopEnd - loopStart);
    return loopStart + ((startOffset - loopStart + elapsed) % length);
  }

  const duration = getDuration();
  return duration ? (startOffset + elapsed) % duration : 0;
}

function setLoopWindow(position) {
  const duration = getDuration();
  if (!duration) {
    loopStart = 0;
    loopEnd = loopLength;
    return;
  }

  const windowLength = Math.min(loopLength, duration);
  loopStart = Math.min(Math.max(0, position), Math.max(0, duration - windowLength));
  loopEnd = Math.min(duration, loopStart + windowLength);
  if (loopEnd - loopStart < 0.05) {
    loopStart = Math.max(0, loopEnd - 0.05);
  }
}

function updateLoopLengthUi() {
  const label = Number.isInteger(loopLength) ? String(loopLength) : loopLength.toFixed(1);
  els.loopLengthValue.textContent = `${label}s`;
  els.loopButton.title = "Scroll to change loop length";
  els.loopButton.setAttribute("aria-label", `${label} second loop. Scroll to adjust length.`);
}

function stopCurrentSource() {
  if (currentSource) {
    currentSource.onended = null;
    try {
      currentSource.stop();
    } catch {
      // Source may already have ended.
    }
  }
  currentSource = null;
  activeDryGain = null;
  activeWetGain = null;
}

async function startPlayback(offset = startOffset) {
  if (!audioBuffer || !currentProfile) {
    return;
  }

  const ctx = ensureAudioContext();
  await ctx.resume();

  stopCurrentSource();

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  activeDryGain = dryGain;
  activeWetGain = wetGain;

  source.connect(dryGain);
  dryGain.connect(masterGain);

  connectAffectedChain(source, wetGain);
  wetGain.connect(masterGain);
  applyMonitorGains();

  let playOffset = clampTime(offset);
  source.loop = true;
  if (loopEnabled) {
    if (playOffset < loopStart || playOffset >= loopEnd) {
      playOffset = loopStart;
    }
    source.loopStart = loopStart;
    source.loopEnd = loopEnd;
  } else {
    source.loopStart = 0;
    source.loopEnd = getDuration();
  }

  currentSource = source;
  startOffset = playOffset;
  startCtxTime = ctx.currentTime;
  isPlaying = true;
  source.start(0, playOffset);
  updateTransportUi();
}

function pausePlayback() {
  if (!audioBuffer) {
    return;
  }
  startOffset = getCurrentPosition();
  isPlaying = false;
  stopCurrentSource();
  updateTransportUi();
}

function restartIfPlaying(position = getCurrentPosition()) {
  if (isPlaying) {
    startPlayback(position);
  } else {
    startOffset = clampTime(position);
    updateTransportUi();
  }
}

function connectAffectedChain(input, output) {
  let node = input;
  for (const config of currentProfile.filters) {
    const filter = audioCtx.createBiquadFilter();
    filter.type = config.type;
    filter.frequency.value = config.frequency;
    filter.Q.value = config.q;
    filter.gain.value = config.gain;
    node.connect(filter);
    node = filter;
  }
  node.connect(output);
}

function applyMonitorGains() {
  const dry = monitorMode === "dry" ? 1 : 0;
  const wet = monitorMode === "wet" ? 1 : 0;
  if (activeDryGain && activeWetGain && audioCtx) {
    const now = audioCtx.currentTime;
    activeDryGain.gain.cancelScheduledValues(now);
    activeWetGain.gain.cancelScheduledValues(now);
    activeDryGain.gain.setTargetAtTime(dry, now, 0.01);
    activeWetGain.gain.setTargetAtTime(wet, now, 0.01);
  }
}

function setMonitor(mode) {
  monitorMode = mode;
  els.dryButton.classList.toggle("is-active", mode === "dry");
  els.wetButton.classList.toggle("is-active", mode === "wet");
  applyMonitorGains();
}

function getActiveProfileIds() {
  return new Set(difficultyOrder.slice(0, difficulty));
}

function getActiveProfiles() {
  const activeIds = getActiveProfileIds();
  return profiles.filter((profile) => activeIds.has(profile.id));
}

function chooseRandomProfile() {
  const activeProfiles = getActiveProfiles();
  const pool = activeProfiles.filter((profile) => profile.id !== lastProfileId);
  const source = pool.length ? pool : activeProfiles;
  const next = source[Math.floor(Math.random() * source.length)];
  lastProfileId = next.id;
  return next;
}

function startNewRound() {
  if (!audioBuffer || gameMode !== "identify") {
    return;
  }

  const position = getCurrentPosition();
  currentProfile = chooseRandomProfile();
  selectedProfileId = "";
  answered = false;
  setMonitor("wet");
  renderOptions();
  setResultHidden();
  drawEqCurve(null, false);
  updateActionStates();
  restartIfPlaying(position >= getDuration() ? 0 : position);
}

function setResultHidden() {
  els.resultPanel.className = "result-panel is-muted";
  els.resultKicker.textContent = "Round active";
  els.resultTitle.textContent = "";
  els.resultText.textContent = "";
  els.resultTitle.hidden = true;
  els.resultText.hidden = true;
}

function setAuditionIdle() {
  els.resultPanel.className = "result-panel is-muted";
  els.resultKicker.textContent = "Audition";
  els.resultTitle.textContent = "No fault selected";
  els.resultText.textContent = "Load audio to begin.";
  els.resultTitle.hidden = false;
  els.resultText.hidden = false;
}

function applyAuditionProfile(profile) {
  if (!audioBuffer || !profile) {
    return;
  }

  const position = getCurrentPosition();
  currentProfile = profile;
  selectedProfileId = profile.id;
  answered = false;
  setMonitor("wet");
  els.resultPanel.className = "result-panel is-audition";
  els.resultKicker.textContent = "Applied";
  els.resultTitle.textContent = `${profile.label}: ${curveSummary(profile)}`;
  els.resultText.textContent = profile.summary;
  els.resultTitle.hidden = false;
  els.resultText.hidden = false;
  drawEqCurve(profile, true);
  renderOptions();
  updateActionStates();
  restartIfPlaying(position >= getDuration() ? 0 : position);
}

function setGameMode(mode) {
  if (mode !== "identify" && mode !== "audition") {
    return;
  }

  gameMode = mode;
  const isIdentify = mode === "identify";
  els.identifyTab.classList.toggle("is-active", isIdentify);
  els.auditionTab.classList.toggle("is-active", !isIdentify);
  els.identifyTab.setAttribute("aria-selected", String(isIdentify));
  els.auditionTab.setAttribute("aria-selected", String(!isIdentify));
  els.quizHeading.textContent = isIdentify ? "Identify the EQ move" : "Audition EQ faults";
  els.difficultyControl.hidden = !isIdentify;
  els.answerActions.hidden = !isIdentify;

  if (!audioBuffer) {
    currentProfile = null;
    selectedProfileId = "";
    answered = false;
    renderOptions();
    if (isIdentify) {
      setResultHidden();
    } else {
      setAuditionIdle();
    }
    drawEqCurve(null, false);
    updateActionStates();
    return;
  }

  if (isIdentify) {
    startNewRound();
  } else {
    applyAuditionProfile(currentProfile || profiles[0]);
  }
}

function updateDifficultyUi() {
  difficulty = Number(els.difficultySlider.value);
  els.difficultyValue.textContent = `${difficulty} faults`;
  if (gameMode === "identify" && selectedProfileId && !getActiveProfileIds().has(selectedProfileId)) {
    selectedProfileId = "";
    drawEqCurve(null, false);
  }
  renderOptions();
  updateActionStates();
}

function renderOptions() {
  els.optionGrid.innerHTML = "";
  const activeIds = getActiveProfileIds();
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const rows = [
    {
      type: "fault",
      label: "+",
      ariaLabel: "Boost faults",
      polarity: "boost",
      profiles: eqPairs.map((pair) => profileById.get(pair.boost)),
    },
    {
      type: "neutral",
      label: "=",
      ariaLabel: "Properly equalized targets",
      polarity: "neutral",
      pairs: eqPairs,
    },
    {
      type: "fault",
      label: "-",
      ariaLabel: "Cut faults",
      polarity: "cut",
      profiles: eqPairs.map((pair) => profileById.get(pair.cut)),
    },
  ];

  for (const row of rows) {
    const rowLabel = document.createElement("span");
    rowLabel.className = "fault-row-label";
    rowLabel.textContent = row.label;
    rowLabel.dataset.polarity = row.polarity;
    rowLabel.setAttribute("aria-label", row.ariaLabel);
    els.optionGrid.appendChild(rowLabel);

    if (row.type === "neutral") {
      for (const pair of row.pairs) {
        const neutral = document.createElement("span");
        const activeCount =
          gameMode === "audition"
            ? 2
            : Number(activeIds.has(pair.boost)) + Number(activeIds.has(pair.cut));
        neutral.className = "neutral-option";
        neutral.classList.toggle("is-partial", activeCount === 1);
        neutral.classList.toggle("is-inactive", activeCount === 0);
        neutral.textContent = pair.neutral;
        neutral.setAttribute("aria-label", `${pair.neutral}, properly equalized`);
        els.optionGrid.appendChild(neutral);
      }
      continue;
    }

    for (const profile of row.profiles) {
      const isExcluded = gameMode === "identify" && !activeIds.has(profile.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      button.dataset.profileId = profile.id;
      button.dataset.polarity = profile.filters[0].gain > 0 ? "boost" : "cut";
      button.disabled = !audioBuffer || (gameMode === "identify" && (answered || isExcluded));
      button.classList.toggle("is-excluded", isExcluded);

      const title = document.createElement("strong");
      title.textContent = profile.label;
      const hint = document.createElement("span");
      hint.textContent = isExcluded ? "Excluded" : profile.hint;
      button.append(title, hint);

      button.classList.toggle("is-selected", selectedProfileId === profile.id);
      if (gameMode === "identify" && answered && profile.id === currentProfile.id) {
        button.classList.add("is-correct");
      }
      if (
        gameMode === "identify" &&
        answered &&
        profile.id === selectedProfileId &&
        selectedProfileId !== currentProfile.id
      ) {
        button.classList.add("is-wrong");
      }

      button.addEventListener("click", () => {
        if (!audioBuffer || isExcluded) {
          return;
        }
        if (gameMode === "audition") {
          applyAuditionProfile(profile);
          return;
        }
        if (answered) {
          return;
        }
        selectedProfileId = profile.id;
        drawEqCurve(null, false, profile);
        renderOptions();
        updateActionStates();
      });

      els.optionGrid.appendChild(button);
    }
  }
}

function confirmAnswer() {
  if (gameMode !== "identify" || !selectedProfileId || !currentProfile || answered) {
    return;
  }

  answered = true;
  const selected = profiles.find((profile) => profile.id === selectedProfileId);
  const isCorrect = selectedProfileId === currentProfile.id;

  if (isCorrect) {
    streak += 1;
  } else {
    streak = 0;
  }

  els.streakCount.textContent = String(streak);
  els.resultPanel.className = `result-panel ${isCorrect ? "is-correct" : "is-wrong"}`;
  els.resultKicker.textContent = isCorrect ? "Correct" : "Missed";
  els.resultTitle.textContent = isCorrect
    ? `${currentProfile.label}: ${curveSummary(currentProfile)}`
    : `${selected.label} heard, ${currentProfile.label} was applied`;
  els.resultText.textContent = currentProfile.summary;
  els.resultTitle.hidden = false;
  els.resultText.hidden = false;

  drawEqCurve(currentProfile, true, isCorrect ? null : selected);
  renderOptions();
  updateActionStates();
  emitFeedback(isCorrect);
}

function curveSummary(profile) {
  const first = profile.filters[0];
  const direction = first.gain >= 0 ? "boost" : "scoop";
  return `${Math.abs(first.gain)} dB ${direction} at ${formatFrequency(first.frequency)} Hz`;
}

function updateActionStates() {
  const loaded = Boolean(audioBuffer);
  els.playButton.disabled = !loaded;
  els.dryButton.disabled = !loaded;
  els.wetButton.disabled = !loaded;
  els.loopButton.disabled = !loaded;
  els.confirmButton.textContent = answered ? "New Round" : "Confirm";
  els.confirmButton.disabled =
    gameMode !== "identify" || !loaded || (!answered && !selectedProfileId);
}

function updateTransportUi() {
  const duration = getDuration();
  const position = getCurrentPosition();

  els.currentTime.textContent = formatTime(position);
  els.durationTime.textContent = formatTime(duration);
  els.waveCanvas.setAttribute("aria-valuemax", String(Math.round(duration)));
  els.waveCanvas.setAttribute("aria-valuenow", String(Math.round(position)));
  els.waveCanvas.setAttribute("aria-valuetext", `${formatTime(position)} of ${formatTime(duration)}`);
  els.playButton.querySelector("span:last-child").textContent = isPlaying ? "Pause" : "Play";
  els.playButton.querySelector(".button-icon").textContent = isPlaying ? "||" : ">";
  els.loopButton.setAttribute("aria-pressed", String(loopEnabled));
  updateActionStates();
}

function buildWavePeaks(buffer) {
  const bucketCount = 1200;
  const peaks = [];
  let peakMax = 0.0001;
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
    buffer.getChannelData(index),
  );

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = Math.floor((bucket / bucketCount) * buffer.length);
    const end = Math.max(start + 1, Math.floor(((bucket + 1) / bucketCount) * buffer.length));
    const step = Math.max(1, Math.floor((end - start) / 220));
    let min = 1;
    let max = -1;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += step) {
      let mixed = 0;
      for (const channel of channels) {
        mixed += channel[sampleIndex] || 0;
      }
      mixed /= channels.length;
      min = Math.min(min, mixed);
      max = Math.max(max, mixed);
    }

    peakMax = Math.max(peakMax, Math.abs(min), Math.abs(max));
    peaks.push({ min, max });
  }

  return peaks.map((peak) => ({
    min: peak.min / peakMax,
    max: peak.max / peakMax,
  }));
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, ratio };
}

function drawWaveform() {
  const canvas = els.waveCanvas;
  const { width, height } = resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const center = height / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#151411";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(244, 239, 229, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (!wavePeaks.length) {
    ctx.strokeStyle = "rgba(244, 239, 229, 0.26)";
    ctx.beginPath();
    ctx.moveTo(0, center);
    ctx.lineTo(width, center);
    ctx.stroke();
    return;
  }

  if (loopEnabled && audioBuffer) {
    const duration = getDuration();
    const x1 = (loopStart / duration) * width;
    const x2 = (loopEnd / duration) * width;
    ctx.fillStyle = "rgba(241, 184, 76, 0.18)";
    ctx.fillRect(x1, 0, x2 - x1, height);
  }

  const barWidth = Math.max(1, width / wavePeaks.length);
  const amp = height * 0.43;
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "rgba(98, 228, 186, 0.88)");
  grad.addColorStop(0.55, "rgba(100, 200, 255, 0.86)");
  grad.addColorStop(1, "rgba(241, 184, 76, 0.88)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = Math.max(1, barWidth * 0.72);
  ctx.lineCap = "round";

  wavePeaks.forEach((peak, index) => {
    const x = index * barWidth + barWidth / 2;
    ctx.beginPath();
    ctx.moveTo(x, center + peak.min * amp);
    ctx.lineTo(x, center + peak.max * amp);
    ctx.stroke();
  });

  const position = getCurrentPosition();
  const playheadX = getDuration() ? (position / getDuration()) * width : 0;
  ctx.strokeStyle = "#f4efe5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
}

function drawEqCurve(profile, reveal, guessProfile = null) {
  const canvas = els.eqCanvas;
  const { width, height } = resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const pad = {
    left: Math.max(46, width * 0.055),
    right: Math.max(18, width * 0.025),
    top: Math.max(18, height * 0.08),
    bottom: Math.max(34, height * 0.14),
  };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const minFreq = 20;
  const maxFreq = 20000;
  const minDb = -15;
  const maxDb = 15;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);

  const xForFreq = (freq) => pad.left + ((Math.log10(freq) - logMin) / (logMax - logMin)) * chartW;
  const yForDb = (db) => pad.top + ((maxDb - db) / (maxDb - minDb)) * chartH;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#141310";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(244, 239, 229, 0.1)";
  ctx.lineWidth = 1;
  const freqMarks = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  ctx.font = `${Math.max(10, width * 0.012)}px Inter, sans-serif`;
  ctx.fillStyle = "rgba(244, 239, 229, 0.58)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const freq of freqMarks) {
    const x = xForFreq(freq);
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + chartH);
    ctx.stroke();
    ctx.fillText(formatFrequency(freq), x, pad.top + chartH + 9);
  }

  const dbMarks = [-12, -6, 0, 6, 12];
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const db of dbMarks) {
    const y = yForDb(db);
    ctx.strokeStyle = db === 0 ? "rgba(244, 239, 229, 0.28)" : "rgba(244, 239, 229, 0.1)";
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillText(`${db > 0 ? "+" : ""}${db}`, pad.left - 9, y);
  }

  const freqs = new Float32Array(280);
  for (let i = 0; i < freqs.length; i += 1) {
    const t = i / (freqs.length - 1);
    freqs[i] = 10 ** (logMin + t * (logMax - logMin));
  }

  const getResponse = (responseProfile) => {
    const values = new Array(freqs.length).fill(0);
    if (!responseProfile || !audioCtx) {
      return values;
    }
    for (const config of responseProfile.filters) {
      const filter = audioCtx.createBiquadFilter();
      const mag = new Float32Array(freqs.length);
      const phase = new Float32Array(freqs.length);
      filter.type = config.type;
      filter.frequency.value = config.frequency;
      filter.Q.value = config.q;
      filter.gain.value = config.gain;
      filter.getFrequencyResponse(freqs, mag, phase);
      for (let i = 0; i < mag.length; i += 1) {
        values[i] += 20 * Math.log10(Math.max(0.00001, mag[i]));
      }
    }
    return values;
  };

  const dbValues = getResponse(reveal ? profile : null);
  const guessDbValues = getResponse(guessProfile);

  const zeroY = yForDb(0);
  if (reveal && profile) {
    const fill = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    fill.addColorStop(0, "rgba(98, 228, 186, 0.24)");
    fill.addColorStop(0.5, "rgba(241, 184, 76, 0.1)");
    fill.addColorStop(1, "rgba(255, 112, 103, 0.2)");
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(xForFreq(freqs[0]), zeroY);
    for (let i = 0; i < freqs.length; i += 1) {
      ctx.lineTo(xForFreq(freqs[i]), yForDb(dbValues[i]));
    }
    ctx.lineTo(xForFreq(freqs[freqs.length - 1]), zeroY);
    ctx.closePath();
    ctx.fill();
  }

  if (reveal || !guessProfile) {
    ctx.strokeStyle = reveal ? "#62e4ba" : "rgba(244, 239, 229, 0.35)";
    ctx.lineWidth = reveal ? 4 : 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < freqs.length; i += 1) {
      const x = xForFreq(freqs[i]);
      const y = yForDb(dbValues[i]);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  if (guessProfile) {
    ctx.save();
    ctx.strokeStyle = "#f1c44f";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    for (let i = 0; i < freqs.length; i += 1) {
      const x = xForFreq(freqs[i]);
      const y = yForDb(guessDbValues[i]);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  if (reveal && profile) {
    for (const config of profile.filters) {
      const x = xForFreq(config.frequency);
      const y = yForDb(config.gain);
      ctx.fillStyle = config.gain >= 0 ? "#f1b84c" : "#64c8ff";
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function emitFeedback(correct) {
  const canvas = els.feedbackCanvas;
  const { width, height } = resizeCanvas(canvas);
  const x = getDuration() ? (getCurrentPosition() / getDuration()) * width : width / 2;
  const y = height / 2;
  const colors = correct
    ? ["#62e4ba", "#f1b84c", "#64c8ff", "#f4efe5"]
    : ["#ff7067", "#f1b84c", "#f4efe5"];
  const count = correct ? Math.min(60, 22 + streak * 4) : 18;

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
    const speed = correct ? 2.4 + Math.random() * 4.8 : 1.4 + Math.random() * 2.1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (correct ? 1.3 : 0.2),
      life: correct ? 42 + Math.random() * 24 : 28 + Math.random() * 10,
      size: correct ? 2 + Math.random() * 4 : 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  if (correct) {
    els.streakPill.classList.remove("is-hot");
    els.appShell.classList.remove("celebrate");
    void els.streakPill.offsetWidth;
    els.streakPill.classList.add("is-hot");
    els.appShell.classList.add("celebrate");
  }
}

function drawFeedback() {
  const canvas = els.feedbackCanvas;
  const { width, height } = resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  particles = particles.filter((particle) => particle.life > 0);
  for (const particle of particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.09;
    particle.life -= 1;
    const alpha = Math.max(0, Math.min(1, particle.life / 42));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;

  if (!particles.length) {
    ctx.clearRect(0, 0, width, height);
  }
}

async function loadAudioFile(file) {
  if (!file) {
    return;
  }

  pausePlayback();
  els.trackName.textContent = "Decoding audio...";
  els.trackMeta.textContent = file.name;

  try {
    const ctx = ensureAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    wavePeaks = buildWavePeaks(audioBuffer);
    startOffset = 0;
    loopEnabled = false;
    setLoopWindow(0);
    els.fileButton.textContent = "New File";
    els.trackName.textContent = file.name;
    els.trackMeta.textContent = `${formatTime(audioBuffer.duration)} | ${audioBuffer.numberOfChannels} ch | ${Math.round(
      audioBuffer.sampleRate / 1000,
    )} kHz`;
    updateTransportUi();
    if (gameMode === "identify") {
      startNewRound();
    } else {
      applyAuditionProfile(currentProfile || profiles[0]);
    }
  } catch (error) {
    audioBuffer = null;
    wavePeaks = [];
    currentProfile = null;
    selectedProfileId = "";
    answered = false;
    els.fileButton.textContent = "Choose File";
    els.trackName.textContent = "Could not decode file";
    els.trackMeta.textContent = error.message || "Try another audio format";
    renderOptions();
    updateTransportUi();
    if (gameMode === "identify") {
      setResultHidden();
    } else {
      setAuditionIdle();
    }
    drawEqCurve(null, false);
  }
}

function seekToPosition(position) {
  if (!audioBuffer) {
    return;
  }
  const target = clampTime(position);
  if (loopEnabled) {
    setLoopWindow(target);
    restartIfPlaying(loopStart);
  } else {
    restartIfPlaying(target);
  }
}

function seekFromWavePointer(event) {
  const rect = els.waveCanvas.getBoundingClientRect();
  const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  seekToPosition(fraction * getDuration());
}

function attachEvents() {
  els.fileButton.addEventListener("click", () => els.fileInput.click());
  els.dropZone.addEventListener("click", () => els.fileInput.click());
  els.dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.fileInput.click();
    }
  });
  els.fileInput.addEventListener("change", (event) => {
    loadAudioFile(event.target.files[0]);
    event.target.value = "";
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, () => {
      els.dropZone.classList.remove("is-dragging");
    });
  });

  els.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    loadAudioFile(event.dataTransfer.files[0]);
  });

  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("drop", (event) => event.preventDefault());

  els.playButton.addEventListener("click", () => {
    if (!audioBuffer) {
      return;
    }
    if (isPlaying) {
      pausePlayback();
    } else {
      const position = startOffset >= getDuration() ? 0 : startOffset;
      startPlayback(loopEnabled ? loopStart : position);
    }
  });

  els.dryButton.addEventListener("click", () => setMonitor("dry"));
  els.wetButton.addEventListener("click", () => setMonitor("wet"));
  els.volumeSlider.addEventListener("input", updateVolume);
  els.identifyTab.addEventListener("click", () => setGameMode("identify"));
  els.auditionTab.addEventListener("click", () => setGameMode("audition"));
  els.difficultySlider.addEventListener("input", updateDifficultyUi);
  els.difficultySlider.addEventListener("change", () => {
    if (gameMode === "identify" && audioBuffer) {
      startNewRound();
    }
  });

  els.loopButton.addEventListener("click", () => {
    if (!audioBuffer) {
      return;
    }
    const position = getCurrentPosition();
    loopEnabled = !loopEnabled;
    if (loopEnabled) {
      setLoopWindow(position);
      restartIfPlaying(loopStart);
    } else {
      restartIfPlaying(position);
    }
    updateTransportUi();
  });
  els.loopButton.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 0.5 : -0.5;
      const nextLength = Math.min(5, Math.max(0.5, loopLength + delta));
      if (nextLength === loopLength) {
        return;
      }

      const position = getCurrentPosition();
      const anchor = loopStart;
      loopLength = nextLength;
      updateLoopLengthUi();
      if (audioBuffer && loopEnabled) {
        setLoopWindow(anchor);
        restartIfPlaying(position);
      }
      drawWaveform();
    },
    { passive: false },
  );

  els.waveCanvas.addEventListener("pointerdown", (event) => {
    if (!audioBuffer) {
      return;
    }
    isWaveDragging = true;
    els.waveCanvas.setPointerCapture(event.pointerId);
    els.waveCanvas.closest(".wave-wrap").classList.add("is-seeking");
    seekFromWavePointer(event);
  });
  els.waveCanvas.addEventListener("pointermove", (event) => {
    if (isWaveDragging) {
      seekFromWavePointer(event);
    }
  });
  const stopWaveDrag = (event) => {
    if (!isWaveDragging) {
      return;
    }
    isWaveDragging = false;
    if (els.waveCanvas.hasPointerCapture(event.pointerId)) {
      els.waveCanvas.releasePointerCapture(event.pointerId);
    }
    els.waveCanvas.closest(".wave-wrap").classList.remove("is-seeking");
  };
  els.waveCanvas.addEventListener("pointerup", stopWaveDrag);
  els.waveCanvas.addEventListener("pointercancel", stopWaveDrag);
  els.waveCanvas.addEventListener("keydown", (event) => {
    if (!audioBuffer) {
      return;
    }
    const step = event.shiftKey ? 5 : 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      seekToPosition(getCurrentPosition() + (event.key === "ArrowRight" ? step : -step));
    } else if (event.key === "Home") {
      event.preventDefault();
      seekToPosition(0);
    } else if (event.key === "End") {
      event.preventDefault();
      seekToPosition(getDuration());
    }
  });
  els.confirmButton.addEventListener("click", () => {
    if (answered) {
      startNewRound();
    } else {
      confirmAnswer();
    }
  });

  window.addEventListener("resize", () => {
    drawWaveform();
    const revealCurve = gameMode === "audition" ? Boolean(currentProfile && audioBuffer) : answered;
    const selected = gameMode === "identify" ? profiles.find((profile) => profile.id === selectedProfileId) : null;
    const guess = selected && (!answered || selected.id !== currentProfile?.id) ? selected : null;
    drawEqCurve(revealCurve ? currentProfile : null, revealCurve, guess);
  });

  els.streakPill.addEventListener("animationend", () => els.streakPill.classList.remove("is-hot"));
  els.appShell.addEventListener("animationend", () => els.appShell.classList.remove("celebrate"));
}

function animationLoop() {
  updateTransportUi();
  drawWaveform();
  drawFeedback();
  requestAnimationFrame(animationLoop);
}

function init() {
  updateDifficultyUi();
  updateVolume();
  updateLoopLengthUi();
  setMonitor("dry");
  setGameMode("identify");
  updateTransportUi();
  attachEvents();
  requestAnimationFrame(animationLoop);
}

init();
