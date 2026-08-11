import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODEL_MANIFEST_URL = new URL("./assets/models.json", document.baseURI).href;
const INITIAL_MODEL_ID = "squirrel-lady";
const FRAME_DURATION = 1 / 30;
const POSE_DURATION_THRESHOLD = 0.1;
const BACKDROPS = [0x101a29, 0x202638, 0x28221f];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.querySelector("#model-canvas");
const viewerStage = document.querySelector("#viewer-stage");
const loadingState = document.querySelector("#loading-state");
const loadingLabel = document.querySelector("#loading-label");
const loadingProgress = document.querySelector("#loading-progress");
const viewerError = document.querySelector("#viewer-error");
const viewerErrorCopy = document.querySelector("#viewer-error-copy");
const modelList = document.querySelector("#model-list");
const modelCount = document.querySelector("#model-count");
const librarySummary = document.querySelector("#library-summary");
const searchInput = document.querySelector("#model-search");
const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const modelName = document.querySelector("#model-name");
const modelDescription = document.querySelector("#model-description");
const categoryTag = document.querySelector("#category-tag");
const riggedTag = document.querySelector("#rigged-tag");
const triangleStat = document.querySelector("#triangle-stat");
const vertexStat = document.querySelector("#vertex-stat");
const animationStat = document.querySelector("#animation-stat");
const modelDownload = document.querySelector("#model-download");
const animationList = document.querySelector("#animation-list");
const clipSelect = document.querySelector("#clip-select");
const clipDuration = document.querySelector("#clip-duration");
const playButton = document.querySelector("#play-button");
const timeline = document.querySelector("#animation-timeline");
const timeReadout = document.querySelector("#time-readout");
const speedControl = document.querySelector("#playback-speed");
const speedOutput = document.querySelector("#speed-output");
const loopToggle = document.querySelector("#loop-toggle");
const skeletonToggle = document.querySelector("#skeleton-toggle");
const lightingToggle = document.querySelector("#lighting-toggle");
const wireframeButton = document.querySelector("#wireframe-button");
const backdropButton = document.querySelector("#backdrop-button");
const resetCameraButton = document.querySelector("#reset-camera-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const previousFrameButton = document.querySelector("#previous-frame-button");
const nextFrameButton = document.querySelector("#next-frame-button");
const detailsButton = document.querySelector("#details-button");
const detailsDialog = document.querySelector("#details-dialog");
const dialogClose = document.querySelector("#dialog-close");
const dialogTitle = document.querySelector("#dialog-title");
const dialogGeometry = document.querySelector("#dialog-geometry");
const dialogRig = document.querySelector("#dialog-rig");
const dialogAppearance = document.querySelector("#dialog-appearance");
const dialogAnimation = document.querySelector("#dialog-animation");

let renderer;
let scene;
let camera;
let controls;
let mixer;
let modelRoot;
let skeletonHelper;
let activeAction;
let activeClip;
let animationClips = [];
let modelCatalog = [];
let activeModel;
let activeModelFilter = "all";
let modelLoadRequest = 0;
let isPlaying = !reducedMotion;
let resumePlaybackAfterPose = !reducedMotion;
let isLooping = true;
let isScrubbing = false;
let backdropIndex = 0;
let modelCameraPosition = new THREE.Vector3(4, 2.6, 5.4);
let modelCameraTarget = new THREE.Vector3(0, 1.5, 0);
let keyLight;
let fillLight;
let rimLight;
let environmentTexture;
const clock = new THREE.Clock();

function initViewer() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
  } catch (error) {
    showViewerError("WebGL could not be initialized in this browser.");
    console.error(error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKDROPS[backdropIndex]);
  camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
  camera.position.copy(modelCameraPosition);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = true;
  controls.minDistance = 1.4;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.target.copy(modelCameraTarget);
  controls.update();

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environmentTexture;
  pmremGenerator.dispose();

  addSceneLighting();
  addGround();
  bindViewerControls();
  observeViewerSize();
  animate();
}

function addSceneLighting() {
  scene.add(new THREE.HemisphereLight(0xc7e6ff, 0x261c18, 1.5));

  keyLight = new THREE.DirectionalLight(0xffeee1, 3.7);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { near: 0.1, far: 30, left: -5, right: 5, top: 5, bottom: -5 });
  scene.add(keyLight);

  fillLight = new THREE.DirectionalLight(0x70caff, 2.4);
  fillLight.position.set(-5, 3.5, 3);
  scene.add(fillLight);

  rimLight = new THREE.DirectionalLight(0xff9a5f, 2.8);
  rimLight.position.set(3, 4, -5);
  scene.add(rimLight);
}

function addGround() {
  const grid = new THREE.GridHelper(14, 28, 0x365b79, 0x23384d);
  grid.material.transparent = true;
  grid.material.opacity = 0.42;
  scene.add(grid);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 64),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.002;
  ground.receiveShadow = true;
  scene.add(ground);
}

async function loadModelCatalog() {
  try {
    const catalog = await fetchJson(MODEL_MANIFEST_URL);
    modelCatalog = catalog.models || [];
    modelCount.textContent = String(modelCatalog.length);
    librarySummary.textContent = `${modelCatalog.length} models across three asset categories.`;
    renderModelCards();
    const initialModel = modelCatalog.find((model) => model.id === INITIAL_MODEL_ID) || modelCatalog[0];
    if (initialModel) selectModel(initialModel.id);
  } catch (error) {
    console.error(error);
    modelList.innerHTML = '<p class="library-empty">The model catalog could not be loaded.</p>';
    showViewerError("The model catalog could not be loaded.");
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.json();
}

function renderModelCards() {
  const query = searchInput.value.trim().toLowerCase();
  const models = modelCatalog.filter((model) => {
    const matchesCategory = activeModelFilter === "all" || model.category === activeModelFilter;
    const searchable = `${model.name} ${model.categoryLabel} ${model.description}`.toLowerCase();
    return matchesCategory && searchable.includes(query);
  });

  modelCount.textContent = String(models.length);
  modelList.replaceChildren();

  if (!models.length) {
    const empty = document.createElement("p");
    empty.className = "library-empty";
    empty.textContent = "No models match that filter.";
    modelList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const model of models) {
    const card = document.createElement("button");
    const isActive = model.id === activeModel?.id;
    card.className = `model-card${isActive ? " is-active" : ""}`;
    card.type = "button";
    card.dataset.modelId = model.id;
    card.setAttribute("aria-pressed", String(isActive));
    card.setAttribute("aria-label", `View ${model.name}`);

    card.innerHTML = `
      <span class="model-thumb">
        ${model.thumbnail
          ? `<img src="${escapeHtml(model.thumbnail)}" alt="Three-quarter preview of ${escapeHtml(model.name)}" width="480" height="270" loading="lazy" decoding="async">`
          : getCategoryIcon(model.category)}
        ${isActive ? '<span class="selected-check" aria-hidden="true">&#10003;</span>' : ""}
      </span>
      <span class="model-card-copy">
        <strong>${escapeHtml(model.name)}</strong>
        <span>${escapeHtml(model.categoryLabel)}</span>
        <small>${formatCompact(model.triangles)} triangles</small>
      </span>
    `;
    card.addEventListener("click", () => selectModel(model.id));
    fragment.appendChild(card);
  }
  modelList.appendChild(fragment);
}

function getCategoryIcon(category) {
  const paths = {
    characters: '<path d="M40 15a11 11 0 1 1 0 22 11 11 0 0 1 0-22Zm-18 48c2-15 9-23 18-23s16 8 18 23M28 28l-7-8m31 8 7-8"></path>',
    props: '<path d="m19 28 21-12 21 12v25L40 65 19 53V28Zm0 0 21 12 21-12M40 40v25"></path>',
    environments: '<path d="m12 61 18-27 10 14 8-11 20 24H12Zm18-27 5-14 9 17"></path>',
  };
  return `<svg class="model-thumb-placeholder" aria-hidden="true" viewBox="0 0 80 80">${paths[category] || paths.props}</svg>`;
}

async function selectModel(modelId) {
  const entry = modelCatalog.find((model) => model.id === modelId);
  if (!entry || (entry.id === activeModel?.id && modelRoot)) return;

  const requestId = ++modelLoadRequest;
  activeModel = entry;
  renderModelCards();
  updateInspector(entry);
  beginModelLoading(entry);
  cleanupActiveModel();

  try {
    const gltf = await loadGltf(entry, requestId);
    if (requestId !== modelLoadRequest) {
      disposeObject(gltf.scene);
      return;
    }

    const loadedRoot = gltf.scene;
    normalizeModel(loadedRoot);

    let albedoTexture = null;
    if (entry.albedo) {
      loadingLabel.textContent = `Texturing ${entry.name}`;
      albedoTexture = await loadAlbedoTexture(entry.albedo);
      if (requestId !== modelLoadRequest) {
        albedoTexture.dispose();
        disposeObject(loadedRoot);
        return;
      }
      canvas.dataset.textureStatus = "external-albedo";
    } else {
      canvas.dataset.textureStatus = entry.textureCount ? "embedded" : "material-color";
    }

    modelRoot = loadedRoot;
    prepareModelMaterials(modelRoot, albedoTexture);
    scene.add(modelRoot);

    skeletonHelper = new THREE.SkeletonHelper(modelRoot);
    skeletonHelper.visible = false;
    scene.add(skeletonHelper);

    animationClips = gltf.animations || [];
    mixer = animationClips.length ? new THREE.AnimationMixer(modelRoot) : null;
    mixer?.addEventListener("finished", handleAnimationFinished);
    populateAnimations(animationClips);

    const initialClip = animationClips.find((clip) => clip.name === entry.defaultAnimation) || animationClips[0];
    if (initialClip) selectClip(initialClip.name, { transition: false });

    loadingProgress.style.width = "100%";
    loadingLabel.textContent = "Ready to explore";
    window.setTimeout(() => loadingState.classList.add("is-complete"), 220);
  } catch (error) {
    if (requestId !== modelLoadRequest) return;
    console.error(error);
    showViewerError(`${entry.name} could not be loaded.`);
  }
}

function beginModelLoading(entry) {
  loadingState.classList.remove("is-complete");
  loadingLabel.textContent = `Loading ${entry.name}`;
  loadingProgress.style.width = "8%";
  viewerError.hidden = true;
  canvas.setAttribute("aria-label", `Interactive 3D view of ${entry.name}`);
}

function loadGltf(entry, requestId) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      new URL(entry.src, document.baseURI).href,
      resolve,
      (event) => {
        if (requestId !== modelLoadRequest || !event.total) return;
        const progress = Math.min((event.loaded / event.total) * 100, 94);
        loadingProgress.style.width = `${progress}%`;
        loadingLabel.textContent = `Loading ${entry.name} · ${Math.round(progress)}%`;
      },
      reject,
    );
  });
}

async function loadAlbedoTexture(relativeUrl) {
  const texture = await new THREE.TextureLoader().loadAsync(new URL(relativeUrl, document.baseURI).href);
  texture.name = `${activeModel?.name || "Model"} albedo`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function prepareModelMaterials(root, albedoTexture) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      if (albedoTexture) {
        material.map = albedoTexture;
        material.color?.set(0xffffff);
        if ("metalness" in material) material.metalness = 0;
        if ("roughness" in material) material.roughness = 0.78;
      }
      material.needsUpdate = true;
    });
  });
}

function cleanupActiveModel() {
  if (mixer && modelRoot) {
    mixer.stopAllAction();
    mixer.uncacheRoot(modelRoot);
  }
  if (skeletonHelper) {
    scene.remove(skeletonHelper);
    skeletonHelper = null;
  }
  if (modelRoot) {
    scene.remove(modelRoot);
    disposeObject(modelRoot);
    modelRoot = null;
  }
  mixer = null;
  activeAction = null;
  activeClip = null;
  animationClips = [];
  isScrubbing = false;
  wireframeButton.setAttribute("aria-pressed", "false");
}

function disposeObject(root) {
  root?.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose();
      }
      material.dispose();
    });
  });
}

function normalizeModel(root) {
  root.updateMatrixWorld(true);
  const initialBox = new THREE.Box3().setFromObject(root);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  root.scale.setScalar(3.45 / Math.max(initialSize.y, initialSize.x, initialSize.z, 0.001));
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y;
  root.position.z -= center.z;
  root.updateMatrixWorld(true);

  const finalBox = new THREE.Box3().setFromObject(root);
  const finalSize = finalBox.getSize(new THREE.Vector3());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const fitHeightDistance = finalSize.y / (2 * Math.tan(verticalFov / 2));
  const fitWidthDistance = finalSize.x / (2 * Math.tan(horizontalFov / 2));
  const distance = Math.max(fitHeightDistance, fitWidthDistance, 2.2) * 1.3;
  const viewDirection = new THREE.Vector3(0.55, 0.08, 1).normalize();

  modelCameraTarget = new THREE.Vector3(0, finalSize.y * 0.49, 0);
  modelCameraPosition = modelCameraTarget.clone().add(viewDirection.multiplyScalar(distance));
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 24;
  camera.updateProjectionMatrix();
  resetCamera();
}

function updateInspector(entry) {
  modelName.textContent = entry.name;
  modelDescription.textContent = entry.description;
  categoryTag.textContent = entry.categoryLabel;
  riggedTag.hidden = entry.skinCount === 0;
  triangleStat.textContent = formatCompact(entry.triangles);
  vertexStat.textContent = formatCompact(entry.vertices);
  animationStat.textContent = String(entry.animations.length);
  modelDownload.href = entry.src;
  dialogTitle.textContent = entry.name;
  dialogGeometry.textContent = `${formatNumber(entry.triangles)} triangles / ${formatNumber(entry.vertices)} vertices`;
  dialogRig.textContent = entry.skinCount ? `Skinned mesh (${entry.skinCount} ${pluralize(entry.skinCount, "skin")})` : "Static mesh";
  dialogAppearance.textContent = entry.albedo
    ? "External pixel albedo"
    : entry.textureCount
      ? `${entry.textureCount} embedded ${pluralize(entry.textureCount, "texture")}`
      : entry.materialCount
        ? `${entry.materialCount} embedded color ${pluralize(entry.materialCount, "material")}`
        : "Default material";
  dialogAnimation.textContent = entry.animations.length
    ? `${entry.animations.length} embedded ${pluralize(entry.animations.length, "clip")}`
    : "No embedded clips";
  skeletonToggle.disabled = entry.skinCount === 0;
  setSwitchState(skeletonToggle, false);
}

function populateAnimations(clips) {
  animationList.replaceChildren();
  clipSelect.replaceChildren();
  const hasAnimations = clips.length > 0;

  [playButton, previousFrameButton, nextFrameButton, timeline, clipSelect].forEach((control) => {
    control.disabled = !hasAnimations;
  });

  if (!hasAnimations) {
    const message = document.createElement("p");
    message.className = "animation-placeholder";
    message.textContent = "Static model — no embedded animation clips.";
    animationList.appendChild(message);
    clipDuration.textContent = "Static";
    timeline.value = "0";
    updateRangeProgress(timeline, 0);
    timeReadout.textContent = "00:00.0 / 00:00.0";
    isPlaying = false;
    resumePlaybackAfterPose = !reducedMotion;
    updateModelPlayButton();
    return;
  }

  isPlaying = !reducedMotion;
  resumePlaybackAfterPose = isPlaying;
  updateModelPlayButton();
  clips.forEach((clip) => {
    const label = getClipLabel(clip.name);
    const button = document.createElement("button");
    button.className = "animation-button";
    button.type = "button";
    button.dataset.clipName = clip.name;
    button.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 2.5 9 5.5-9 5.5v-11Z"></path></svg>
      <span>${escapeHtml(label)}</span>
      <small>${formatDuration(clip.duration)}</small>
    `;
    button.addEventListener("click", () => selectClip(clip.name));
    animationList.appendChild(button);

    const option = document.createElement("option");
    option.value = clip.name;
    option.textContent = label;
    clipSelect.appendChild(option);
  });
}

function selectClip(clipName, { transition = true } = {}) {
  const clip = animationClips.find((candidate) => candidate.name === clipName);
  if (!clip || !mixer) return;

  // A clip change must always release the timeline. A pointer can otherwise
  // leave the transport latched in its scrubbing state when the next clip
  // disables the range control (as static poses do).
  isScrubbing = false;
  const previousAction = activeAction;
  const previousClip = activeClip;
  const isPose = isStaticPoseClip(clip);
  const previousWasPose = isStaticPoseClip(previousClip);
  if (isPose && !previousWasPose) resumePlaybackAfterPose = isPlaying;
  if (!isPose && previousWasPose) isPlaying = resumePlaybackAfterPose;
  activeClip = clip;
  activeAction = mixer.clipAction(clip);
  activeAction.enabled = true;
  activeAction.reset();
  activeAction.setEffectiveWeight(1);
  activeAction.setEffectiveTimeScale(1);
  activeAction.clampWhenFinished = isPose || !isLooping;
  activeAction.setLoop(isPose || !isLooping ? THREE.LoopOnce : THREE.LoopRepeat, isPose || !isLooping ? 1 : Infinity);
  activeAction.paused = isPose || !isPlaying;
  activeAction.play();

  if (transition && previousAction && previousAction !== activeAction && !isPose && !previousWasPose) previousAction.crossFadeTo(activeAction, 0.18, true);
  else if (previousAction && previousAction !== activeAction) previousAction.stop();

  if (isPose) {
    isPlaying = false;
    activeAction.time = 0;
    mixer.update(0);
  }

  document.querySelectorAll(".animation-button").forEach((button) => {
    const isActive = button.dataset.clipName === clipName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  clipSelect.value = clipName;
  clipDuration.textContent = formatDuration(clip.duration);
  timeline.max = String(Math.max(clip.duration, FRAME_DURATION));
  timeline.value = "0";
  updateRangeProgress(timeline, 0);
  setPoseTransportState(isPose);
  updateModelPlayButton();
  updateTimeReadout();
}

function isStaticPoseClip(clip) {
  return Boolean(clip) && clip.duration < POSE_DURATION_THRESHOLD;
}

function setPoseTransportState(isPose) {
  if (isPose) isScrubbing = false;
  [playButton, previousFrameButton, nextFrameButton, timeline].forEach((control) => {
    control.disabled = isPose;
  });
}

function bindViewerControls() {
  playButton.addEventListener("click", togglePlayback);
  clipSelect.addEventListener("change", () => selectClip(clipSelect.value));
  speedControl.addEventListener("input", () => {
    const speed = Number(speedControl.value);
    if (mixer) mixer.timeScale = speed;
    speedOutput.innerHTML = `${speed.toFixed(2).replace(/\.00$/, ".0")}&times;`;
    updateRangeProgress(speedControl, ((speed - 0.25) / 1.75) * 100);
  });
  updateRangeProgress(speedControl, ((Number(speedControl.value) - 0.25) / 1.75) * 100);

  const finishScrubbing = () => { isScrubbing = false; };
  timeline.addEventListener("pointerdown", () => {
    if (!timeline.disabled) isScrubbing = true;
  });
  window.addEventListener("pointerup", finishScrubbing);
  window.addEventListener("pointercancel", finishScrubbing);
  window.addEventListener("blur", finishScrubbing);
  timeline.addEventListener("change", finishScrubbing);
  timeline.addEventListener("blur", finishScrubbing);
  timeline.addEventListener("input", () => {
    if (!activeAction || !activeClip || isStaticPoseClip(activeClip)) return;
    activeAction.time = Number(timeline.value);
    mixer.update(0);
    updateRangeProgress(timeline, (activeAction.time / Math.max(activeClip.duration, FRAME_DURATION)) * 100);
    updateTimeReadout();
  });

  previousFrameButton.addEventListener("click", () => stepAnimation(-FRAME_DURATION));
  nextFrameButton.addEventListener("click", () => stepAnimation(FRAME_DURATION));
  loopToggle.addEventListener("click", () => {
    isLooping = !isLooping;
    setSwitchState(loopToggle, isLooping);
    if (activeAction && !isStaticPoseClip(activeClip)) {
      activeAction.clampWhenFinished = !isLooping;
      activeAction.setLoop(isLooping ? THREE.LoopRepeat : THREE.LoopOnce, isLooping ? Infinity : 1);
    }
  });
  skeletonToggle.addEventListener("click", () => {
    const visible = !skeletonToggle.classList.contains("is-active");
    setSwitchState(skeletonToggle, visible);
    if (skeletonHelper) skeletonHelper.visible = visible;
  });
  lightingToggle.addEventListener("click", () => {
    const enabled = !lightingToggle.classList.contains("is-active");
    setSwitchState(lightingToggle, enabled);
    [keyLight, fillLight, rimLight].forEach((light) => { light.visible = enabled; });
    scene.environment = enabled ? environmentTexture : null;
  });
  wireframeButton.addEventListener("click", toggleWireframe);
  backdropButton.addEventListener("click", () => {
    backdropIndex = (backdropIndex + 1) % BACKDROPS.length;
    scene.background.setHex(BACKDROPS[backdropIndex]);
  });
  resetCameraButton.addEventListener("click", resetCamera);
  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  canvas.addEventListener("dblclick", resetCamera);
  canvas.addEventListener("keydown", (event) => {
    if (event.code === "Space" && animationClips.length && !isStaticPoseClip(activeClip)) {
      event.preventDefault();
      togglePlayback();
    }
  });
  canvas.tabIndex = 0;
}

function togglePlayback() {
  if (!activeAction || isStaticPoseClip(activeClip)) return;
  isPlaying = !isPlaying;
  resumePlaybackAfterPose = isPlaying;
  if (isPlaying && !isLooping && activeClip && activeAction.time >= activeClip.duration - 0.001) activeAction.reset().play();
  activeAction.paused = !isPlaying;
  updateModelPlayButton();
}

function updateModelPlayButton() {
  if (isStaticPoseClip(activeClip)) {
    playButton.classList.add("is-paused");
    playButton.setAttribute("aria-label", "Static pose");
    return;
  }
  playButton.classList.toggle("is-paused", !isPlaying);
  playButton.setAttribute("aria-label", isPlaying ? "Pause animation" : "Play animation");
}

function stepAnimation(delta) {
  if (!activeAction || !activeClip || isStaticPoseClip(activeClip)) return;
  if (isPlaying) togglePlayback();
  const duration = activeClip.duration;
  activeAction.time = isLooping
    ? THREE.MathUtils.euclideanModulo(activeAction.time + delta, duration)
    : THREE.MathUtils.clamp(activeAction.time + delta, 0, duration);
  mixer.update(0);
  updateTimelineFromAction();
}

function handleAnimationFinished() {
  if (isLooping) return;
  isPlaying = false;
  resumePlaybackAfterPose = false;
  updateModelPlayButton();
}

function toggleWireframe() {
  const enabled = wireframeButton.getAttribute("aria-pressed") !== "true";
  wireframeButton.setAttribute("aria-pressed", String(enabled));
  modelRoot?.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.wireframe = enabled;
      material.needsUpdate = true;
    });
  });
}

function resetCamera() {
  if (!camera || !controls) return;
  camera.position.copy(modelCameraPosition);
  controls.target.copy(modelCameraTarget);
  camera.lookAt(modelCameraTarget);
  controls.update();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement === viewerStage) await document.exitFullscreen();
    else await viewerStage.requestFullscreen();
  } catch (error) {
    console.error("Fullscreen could not be changed.", error);
  }
}

function updateFullscreenButton() {
  const fullscreen = document.fullscreenElement === viewerStage;
  fullscreenButton.setAttribute("aria-label", fullscreen ? "Exit fullscreen" : "Enter fullscreen");
}

function observeViewerSize() {
  new ResizeObserver(() => {
    if (!renderer || !camera) return;
    const width = Math.max(viewerStage.clientWidth, 1);
    const height = Math.max(viewerStage.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }).observe(viewerStage);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  mixer?.update(delta);
  controls?.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (activeAction && activeClip && !isScrubbing) updateTimelineFromAction();
}

function updateTimelineFromAction() {
  if (isStaticPoseClip(activeClip)) {
    timeline.value = "0";
    updateRangeProgress(timeline, 0);
    updateTimeReadout();
    return;
  }
  const duration = Math.max(activeClip.duration, FRAME_DURATION);
  const currentTime = THREE.MathUtils.clamp(activeAction.time, 0, duration);
  timeline.value = String(currentTime);
  updateRangeProgress(timeline, (currentTime / duration) * 100);
  updateTimeReadout();
}

function updateTimeReadout() {
  if (isStaticPoseClip(activeClip)) {
    timeReadout.textContent = "Static pose";
    return;
  }
  timeReadout.textContent = `${formatAnimationTime(activeAction?.time || 0)} / ${formatAnimationTime(activeClip?.duration || 0)}`;
}

function showViewerError(message) {
  loadingState.classList.add("is-complete");
  viewerErrorCopy.textContent = message;
  viewerError.hidden = false;
}

function bindLibraryControls() {
  searchInput.addEventListener("input", renderModelCards);
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeModelFilter = button.dataset.filter;
      filterButtons.forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
      renderModelCards();
    });
  });
}

function bindDialogControls() {
  detailsButton.addEventListener("click", () => detailsDialog.showModal());
  dialogClose.addEventListener("click", () => detailsDialog.close());
  detailsDialog.addEventListener("click", (event) => {
    const bounds = detailsDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      detailsDialog.close();
    }
  });
}

function updateRangeProgress(input, percentage) {
  input.style.setProperty("--range-progress", `${THREE.MathUtils.clamp(percentage, 0, 100)}%`);
}

function setSwitchState(button, active) {
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-checked", String(active));
}

function getClipLabel(name) {
  return name
    .replace(/\.\d+$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\s+Loop$/i, " Loop");
}

function formatDuration(seconds) {
  return seconds < 0.1 ? "Pose" : `${seconds.toFixed(2)}s`;
}

function formatAnimationTime(seconds) {
  const safeSeconds = Math.max(Number(seconds) || 0, 0);
  const minutes = Math.floor(safeSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${(safeSeconds % 60).toFixed(1).padStart(4, "0")}`;
}

function formatCompact(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function pluralize(value, word) {
  return value === 1 ? word : `${word}s`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

bindLibraryControls();
bindDialogControls();
initViewer();
loadModelCatalog();
