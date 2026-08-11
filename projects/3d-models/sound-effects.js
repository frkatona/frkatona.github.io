const SOUND_MANIFEST_URL = new URL("./assets/soundfx/manifest.json", document.baseURI).href;
const DEFAULT_VOLUME = 0.8;

const soundSearch = document.querySelector("#sound-search");
const soundSourceFilter = document.querySelector("#sound-source-filter");
const soundResults = document.querySelector("#sound-results");
const soundGrid = document.querySelector("#sound-grid");
const soundEmpty = document.querySelector("#sound-empty");
const soundPlayer = document.querySelector("#sound-player");
const soundMasterPlay = document.querySelector("#sound-master-play");
const soundNowPlaying = document.querySelector("#sound-now-playing");
const soundTime = document.querySelector("#sound-time");
const soundProgress = document.querySelector("#sound-progress");
const soundVolume = document.querySelector("#sound-volume");
const soundVolumeOutput = document.querySelector("#sound-volume-output");
const soundDownload = document.querySelector("#sound-download");

let soundCatalog = [];
let activeSound;

async function loadSoundCatalog() {
  try {
    const response = await fetch(SOUND_MANIFEST_URL);
    if (!response.ok) throw new Error(`Request failed (${response.status}) for ${SOUND_MANIFEST_URL}`);
    const catalog = await response.json();
    soundCatalog = catalog.sounds || [];
    populateSoundSources();
    renderSoundCards();
  } catch (error) {
    console.error(error);
    soundGrid.innerHTML = '<p class="library-empty">The sound catalog could not be loaded.</p>';
    soundResults.textContent = "Unavailable";
  }
}

function populateSoundSources() {
  const sources = Array.from(new Map(soundCatalog.map((sound) => [sound.source, sound.sourceLabel])));
  for (const [value, label] of sources) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    soundSourceFilter.appendChild(option);
  }
}

function renderSoundCards() {
  const query = soundSearch.value.trim().toLowerCase();
  const source = soundSourceFilter.value;
  const sounds = soundCatalog.filter((sound) => {
    const searchable = `${sound.name} ${sound.file} ${sound.sourceLabel}`.toLowerCase();
    const matchesSource = source === "all" || sound.source === source;
    return searchable.includes(query) && matchesSource;
  });

  soundResults.textContent = `${sounds.length} of ${soundCatalog.length} sounds`;
  soundGrid.replaceChildren();
  soundEmpty.hidden = sounds.length > 0;
  if (!sounds.length) return;

  const fragment = document.createDocumentFragment();
  for (const sound of sounds) {
    const card = document.createElement("article");
    const isActive = sound.id === activeSound?.id;
    card.className = `sound-card${isActive ? " is-active" : ""}`;
    card.dataset.soundId = sound.id;
    card.style.setProperty("--sound-color", sound.frequencyColor);
    card.innerHTML = `
      <div class="sound-card-heading">
        <button class="sound-card-play" type="button" aria-label="${isActive && !soundPlayer.paused ? "Pause" : "Play"} ${escapeHtml(sound.name)}">
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 2.5 9 5.5-9 5.5v-11Z"></path></svg>
        </button>
        <div class="sound-card-title">
          <strong>${escapeHtml(sound.name)}</strong>
          <span>${escapeHtml(sound.sourceLabel)}</span>
        </div>
        <span class="sound-duration">${formatSoundTime(sound.duration)}</span>
      </div>
      ${createWaveformSvg(sound.waveform)}
    `;
    card.querySelector("button").addEventListener("click", () => toggleSound(sound.id));
    fragment.appendChild(card);
  }
  soundGrid.appendChild(fragment);
}

function createWaveformSvg(waveform = []) {
  const lines = waveform.map((value, index) => {
    const x = 2 + (index / Math.max(waveform.length - 1, 1)) * 96;
    const amplitude = Math.max(value * 17, 1.25);
    return `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${(20 - amplitude).toFixed(2)}" y2="${(20 + amplitude).toFixed(2)}"></line>`;
  }).join("");
  return `<svg class="waveform-icon" aria-hidden="true" viewBox="0 0 100 40" preserveAspectRatio="none">${lines}</svg>`;
}

async function toggleSound(soundId) {
  const sound = soundCatalog.find((candidate) => candidate.id === soundId);
  if (!sound) return;

  if (activeSound?.id === sound.id) {
    if (soundPlayer.paused) await safePlaySound();
    else soundPlayer.pause();
    return;
  }

  activeSound = sound;
  soundPlayer.src = new URL(sound.src, document.baseURI).href;
  soundPlayer.load();
  soundNowPlaying.textContent = `${sound.name} · ${sound.sourceLabel}`;
  soundDownload.href = sound.src;
  soundDownload.download = sound.file;
  soundDownload.hidden = false;
  soundMasterPlay.disabled = false;
  soundProgress.disabled = false;
  soundProgress.max = String(Math.max(sound.duration, 0.001));
  renderSoundCards();
  await safePlaySound();
}

async function safePlaySound() {
  try {
    await soundPlayer.play();
  } catch (error) {
    console.error("The selected sound could not be played.", error);
  }
}

function bindSoundControls() {
  soundSearch.addEventListener("input", renderSoundCards);
  soundSourceFilter.addEventListener("change", renderSoundCards);
  soundMasterPlay.addEventListener("click", async () => {
    if (!activeSound) return;
    if (soundPlayer.paused) await safePlaySound();
    else soundPlayer.pause();
  });
  soundProgress.addEventListener("input", () => {
    soundPlayer.currentTime = Number(soundProgress.value);
    updateSoundProgress();
  });
  soundVolume.addEventListener("input", updateVolume);
  soundPlayer.addEventListener("play", updateSoundPlaybackUi);
  soundPlayer.addEventListener("pause", updateSoundPlaybackUi);
  soundPlayer.addEventListener("ended", updateSoundPlaybackUi);
  soundPlayer.addEventListener("timeupdate", updateSoundProgress);
  soundPlayer.addEventListener("loadedmetadata", updateSoundProgress);
}

function updateSoundPlaybackUi() {
  soundMasterPlay.classList.toggle("is-playing", !soundPlayer.paused);
  soundMasterPlay.setAttribute("aria-label", soundPlayer.paused ? "Play selected sound" : "Pause selected sound");
  document.querySelectorAll(".sound-card").forEach((card) => {
    const isActive = card.dataset.soundId === activeSound?.id;
    card.classList.toggle("is-active", isActive);
    const button = card.querySelector(".sound-card-play");
    if (button && isActive) {
      button.setAttribute("aria-label", `${soundPlayer.paused ? "Play" : "Pause"} ${activeSound.name}`);
    }
  });
}

function updateSoundProgress() {
  if (!activeSound) return;
  const duration = Number.isFinite(soundPlayer.duration) ? soundPlayer.duration : activeSound.duration;
  const currentTime = soundPlayer.currentTime || 0;
  soundProgress.max = String(Math.max(duration, 0.001));
  soundProgress.value = String(currentTime);
  updateRangeProgress(soundProgress, (currentTime / Math.max(duration, 0.001)) * 100);
  soundTime.textContent = `${formatSoundTime(currentTime)} / ${formatSoundTime(duration)}`;
}

function updateVolume() {
  const volume = Math.min(Math.max(Number(soundVolume.value), 0), 1);
  soundPlayer.volume = volume;
  soundVolumeOutput.value = `${Math.round(volume * 100)}%`;
  updateRangeProgress(soundVolume, volume * 100);
}

function updateRangeProgress(input, percentage) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  input.style.setProperty("--range-progress", `${clamped}%`);
}

function formatSoundTime(seconds) {
  const safeSeconds = Math.max(Number(seconds) || 0, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(1).padStart(4, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

soundPlayer.volume = DEFAULT_VOLUME;
soundVolume.value = String(DEFAULT_VOLUME);
updateVolume();
bindSoundControls();
loadSoundCatalog();
