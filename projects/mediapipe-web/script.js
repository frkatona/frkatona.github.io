function toggleControl() {
  const controlButton = document.getElementById("controlButton");
  const hidden = document.body.classList.toggle("controls-hidden");
  controlButton.textContent = hidden ? "›" : "‹";
  controlButton.setAttribute("aria-label", hidden ? "Expand route panel" : "Collapse route panel");
  controlButton.setAttribute("aria-expanded", String(!hidden));
}

const movementInputs = [
  { value: "nil", label: "Off", group: "both" },
  { value: "leftIndexX", label: "Index X", group: "left" },
  { value: "leftIndexY", label: "Index Y", group: "left" },
  { value: "leftClosed", label: "Fist", group: "left" },
  { value: "leftPinch", label: "Pinch", group: "left" },
  { value: "leftSpread", label: "Spread", group: "left" },
  { value: "leftIndexZ", label: "Depth", group: "left" },
  { value: "leftPalmRoll", label: "Roll", group: "left" },
  { value: "rightIndexX", label: "Index X", group: "right" },
  { value: "rightIndexY", label: "Index Y", group: "right" },
  { value: "rightClosed", label: "Fist", group: "right" },
  { value: "rightPinch", label: "Pinch", group: "right" },
  { value: "rightSpread", label: "Spread", group: "right" },
  { value: "rightIndexZ", label: "Depth", group: "right" },
  { value: "rightPalmRoll", label: "Roll", group: "right" },
  { value: "indexDistance", label: "Index gap", group: "both" },
  { value: "handsDistance", label: "Hands apart", group: "both" },
  { value: "gesture:indexTouch", label: "Index touch", group: "gesture" },
  { value: "gesture:leftBack", label: "L back", group: "gesture" },
  { value: "gesture:rightBack", label: "R back", group: "gesture" },
  { value: "gesture:leftPinch", label: "L pinch", group: "gesture" },
  { value: "gesture:rightPinch", label: "R pinch", group: "gesture" },
  { value: "gesture:doubleFist", label: "Both fists", group: "gesture" },
];

const gestureModes = [
  { value: "off", label: "Off" },
  { value: "note", label: "Note" },
  { value: "cc", label: "CC" },
  { value: "bend", label: "Bend" },
  { value: "touch", label: "Touch" },
];

const routeDefinitions = {
  noteRouteInput: { label: "Note", note: true, accent: "gold" },
  midiPitchControlInput: { label: "Pitch", accent: "teal" },
  midiVelInput: { label: "Velocity", accent: "teal" },
  BPMAutomateInput: { label: "BPM", accent: "gold" },
  pitchBendInput: { label: "Bend", accent: "purple" },
  aftertouchInput: { label: "Touch", accent: "purple" },
  cc1Input: { label: "CC 1", cc: true, channelId: "cc1Channel", controllerId: "cc1Controller", accent: "gold" },
  cc2Input: { label: "CC 2", cc: true, channelId: "cc2Channel", controllerId: "cc2Controller", accent: "gold" },
  cc3Input: { label: "CC 3", cc: true, channelId: "cc3Channel", controllerId: "cc3Controller", accent: "gold" },
  cc4Input: { label: "CC 4", cc: true, channelId: "cc4Channel", controllerId: "cc4Controller", accent: "gold" },
};

const routeGrid = document.getElementById("routeGrid");
const routeStore = document.getElementById("routeStore");
const addRouteButton = document.getElementById("addRouteButton");
const routeMenu = document.getElementById("routeMenu");
const sourceRail = document.querySelector(".source-rail");
const noteRouteOptions = document.getElementById("noteRouteOptions");
let selectedRouteInputId = null;
let draggedRouteId = null;
let rangeDrag = null;
let panelResize = null;
const addedRoutes = new Set();
const ccRouteIds = ["cc1Input", "cc2Input", "cc3Input", "cc4Input"];
const panelWidthConfig = {
  route: { property: "--route-panel-width", selector: ".inspector-dock", min: 250, max: 540 },
  source: { property: "--source-panel-width", selector: ".source-rail", min: 260, max: 560 },
};

function getMovementLabel(value) {
  const input = movementInputs.find((movementInput) => movementInput.value === value);
  if (!input || input.value === "nil") return "Off";
  if (input.group === "left") return `L ${input.label}`;
  if (input.group === "right") return `R ${input.label}`;
  return input.label;
}

function getRouteInput(routeInputId = selectedRouteInputId) {
  return document.getElementById(routeInputId);
}

function updateSourcePalette() {
  const selectedInput = getRouteInput();
  const canUseSources = Boolean(selectedInput && !routeDefinitions[selectedInput.id]?.note);
  const selectedValue = selectedInput ? selectedInput.value : "nil";
  document.querySelectorAll(".source-chip").forEach((chip) => {
    chip.classList.toggle("is-selected", canUseSources && chip.dataset.value === selectedValue);
    chip.disabled = Boolean(selectedInput && routeDefinitions[selectedInput.id]?.note);
  });
}

function updateRouteRow(routeInput) {
  if (!routeInput) return;
  const row = document.querySelector(`[data-control="${routeInput.id}"]`);
  if (!row) return;
  const sourceLabel = row.querySelector("[data-route-source]");
  if (sourceLabel) {
    sourceLabel.textContent = routeDefinitions[routeInput.id]?.note
      ? "Stream"
      : getMovementLabel(routeInput.value);
  }
}

function updateContextPanel() {
  const selectedInput = getRouteInput();
  const hasSelectedRoute = Boolean(selectedInput && addedRoutes.has(selectedInput.id));
  const isNoteRoute = Boolean(selectedInput && routeDefinitions[selectedInput.id]?.note);
  document.body.classList.toggle("has-selected-route", hasSelectedRoute);
  document.body.classList.toggle("has-note-route", isNoteRoute);
  if (sourceRail) sourceRail.setAttribute("aria-hidden", String(!hasSelectedRoute));
  if (noteRouteOptions) noteRouteOptions.hidden = !isNoteRoute;
}

function updateSelectedRouteDetails() {
  const selectedInput = getRouteInput();
  const name = document.getElementById("selectedRouteName");
  const source = document.getElementById("selectedRouteSource");
  if (!name || !source) return;
  if (!selectedInput || !addedRoutes.has(selectedInput.id)) {
    name.textContent = "No route";
    source.textContent = "Add a route";
    return;
  }
  name.textContent = selectedInput.dataset.routeLabel || "Route";
  source.textContent = routeDefinitions[selectedInput.id]?.note
    ? "Note stream"
    : getMovementLabel(selectedInput.value);
}

function selectRoute(routeInputId) {
  if (!routeInputId || !addedRoutes.has(routeInputId)) {
    selectedRouteInputId = null;
    document.querySelectorAll(".route-item").forEach((row) => {
      row.classList.remove("is-selected-route");
    });
    updateSourcePalette();
    updateSelectedRouteDetails();
    updateContextPanel();
    return;
  }

  selectedRouteInputId = routeInputId;
  document.querySelectorAll(".route-item").forEach((row) => {
    row.classList.toggle("is-selected-route", row.dataset.control === routeInputId);
  });
  updateSourcePalette();
  updateSelectedRouteDetails();
  updateContextPanel();
}

function assignSourceToSelectedRoute(sourceValue) {
  const selectedInput = getRouteInput();
  if (!selectedInput || !addedRoutes.has(selectedInput.id)) return;
  if (routeDefinitions[selectedInput.id]?.note) return;
  selectedInput.value = sourceValue;
  selectedInput.dispatchEvent(new Event("change", { bubbles: true }));
  updateRouteRow(selectedInput);
  updateSourcePalette();
  updateSelectedRouteDetails();
}

document.querySelectorAll("[data-source-group]").forEach((palette) => {
  movementInputs.forEach((movementInput) => {
    if (movementInput.group !== palette.dataset.sourceGroup) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "source-chip";
    button.dataset.value = movementInput.value;
    button.textContent = movementInput.label;
    button.addEventListener("click", () => {
      assignSourceToSelectedRoute(movementInput.value);
    });
    palette.appendChild(button);
  });
});

function updateRouteMenu() {
  routeMenu.querySelectorAll("[data-add-route]").forEach((button) => {
    if (button.dataset.addRoute === "cc") {
      button.disabled = ccRouteIds.every((routeId) => addedRoutes.has(routeId));
      return;
    }
    button.disabled = addedRoutes.has(button.dataset.addRoute);
  });
}

function closeRouteMenu() {
  routeMenu.hidden = true;
  addRouteButton.setAttribute("aria-expanded", "false");
}

function toggleRouteMenu() {
  routeMenu.hidden = !routeMenu.hidden;
  addRouteButton.setAttribute("aria-expanded", String(!routeMenu.hidden));
}

function getNextCcRouteId() {
  return ccRouteIds.find((routeId) => !addedRoutes.has(routeId));
}

function resolveRouteToAdd(routeInputId) {
  return routeInputId === "cc" ? getNextCcRouteId() : routeInputId;
}

function getCurrentCcRouteCount() {
  return [...document.querySelectorAll(".route-item.cc-route")].length;
}

function ensureRouteRange(routeInput) {
  if (!routeInput) return;
  if (routeInput.dataset.routeMin === undefined) routeInput.dataset.routeMin = "0";
  if (routeInput.dataset.routeMax === undefined) routeInput.dataset.routeMax = "1";
}

function getRouteRange(routeInput) {
  ensureRouteRange(routeInput);
  const min = clamp(Number(routeInput.dataset.routeMin), 0, 1);
  const max = clamp(Number(routeInput.dataset.routeMax), 0, 1);
  return min <= max ? { min, max } : { min: max, max: min };
}

function applyRouteRange(routeInput, value) {
  const { min, max } = getRouteRange(routeInput);
  return linearScale(clamp(value, 0, 1), 0, 1, min, max);
}

function updateRouteRangeVisual(row, routeInput, value = 0) {
  if (!row || !routeInput) return;
  const { min, max } = getRouteRange(routeInput);
  const safeValue = clamp(value, 0, 1);
  row.style.setProperty("--route-min", String(min));
  row.style.setProperty("--route-max", String(max));
  row.style.setProperty("--route-value", String(safeValue));
}

function createRouteCard(routeInputId) {
  const routeInput = document.getElementById(routeInputId);
  const definition = routeDefinitions[routeInputId];
  if (!routeInput || !definition) return null;
  ensureRouteRange(routeInput);

  const card = document.createElement("div");
  card.className = "route-item mapping-row";
  card.dataset.control = routeInputId;
  card.draggable = true;
  if (definition.cc) card.classList.add("cc-route");
  if (definition.accent) card.dataset.accent = definition.accent;

  const button = document.createElement("div");
  button.className = "route-button";
  button.role = "button";
  button.tabIndex = 0;
  button.dataset.routeButton = routeInputId;
  button.addEventListener("click", () => selectRoute(routeInputId));
  button.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectRoute(routeInputId);
  });

  const target = document.createElement("span");
  target.className = "route-target";
  target.textContent = routeInput.dataset.routeLabel || definition.label;
  target.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    startRouteRename(routeInputId);
  });

  const source = document.createElement("span");
  source.className = "route-source";
  source.dataset.routeSource = "";
  source.textContent = definition.note ? "Stream" : getMovementLabel(routeInput.value);

  const meter = document.createElement("span");
  meter.className = "meter";
  meter.dataset.routeMeter = routeInputId;
  const meterFill = document.createElement("span");
  meterFill.className = "meter-fill";
  const meterRange = document.createElement("span");
  meterRange.className = "meter-range";
  const minHandle = document.createElement("span");
  minHandle.className = "range-handle range-handle-min";
  minHandle.dataset.rangeHandle = "min";
  minHandle.setAttribute("aria-hidden", "true");
  const maxHandle = document.createElement("span");
  maxHandle.className = "range-handle range-handle-max";
  maxHandle.dataset.rangeHandle = "max";
  maxHandle.setAttribute("aria-hidden", "true");
  meter.append(meterFill, meterRange, minHandle, maxHandle);

  button.append(target, source, meter);
  card.append(button);

  if (definition.cc) {
    const params = document.createElement("div");
    params.className = "route-params";

    const channelLabel = document.createElement("label");
    const channelText = document.createElement("span");
    channelText.textContent = "Ch";
    channelLabel.append(channelText, document.getElementById(definition.channelId));

    const controllerLabel = document.createElement("label");
    const controllerText = document.createElement("span");
    controllerText.textContent = "CC";
    controllerLabel.append(controllerText, document.getElementById(definition.controllerId));

    params.append(channelLabel, controllerLabel);
    card.append(params);
  }

  card.append(routeInput);
  attachRouteDragHandlers(card);
  attachRouteRangeHandlers(card, routeInput);
  updateRouteRangeVisual(card, routeInput, 0);
  return card;
}

function addRoute(routeInputId) {
  const requestedRouteId = routeInputId;
  routeInputId = resolveRouteToAdd(routeInputId);
  if (!routeInputId) {
    closeRouteMenu();
    return;
  }

  if (addedRoutes.has(routeInputId)) {
    selectRoute(routeInputId);
    closeRouteMenu();
    return;
  }

  if (requestedRouteId === "cc") {
    const routeInput = document.getElementById(routeInputId);
    const label = `CC ${getCurrentCcRouteCount() + 1}`;
    routeInput.dataset.routeLabel = label;
    routeInput.dataset.routeDefaultLabel = label;
  }

  const card = createRouteCard(routeInputId);
  if (!card) return;

  routeGrid.insertBefore(card, addRouteButton);
  addedRoutes.add(routeInputId);
  mappingRows.set(routeInputId, card);
  updateRouteRow(document.getElementById(routeInputId));
  updateRouteMenu();
  selectRoute(routeInputId);
  closeRouteMenu();
}

function startRouteRename(routeInputId) {
  const routeInput = document.getElementById(routeInputId);
  const row = document.querySelector(`[data-control="${routeInputId}"]`);
  const target = row?.querySelector(".route-target");
  if (!routeInput || !target || target.querySelector("input")) return;

  const editor = document.createElement("input");
  editor.className = "route-rename-input";
  editor.value = routeInput.dataset.routeLabel || routeInput.dataset.routeDefaultLabel || target.textContent;
  target.textContent = "";
  target.append(editor);
  editor.focus();
  editor.select();

  const commit = () => {
    const nextLabel = editor.value.trim() || routeInput.dataset.routeDefaultLabel || "Route";
    routeInput.dataset.routeLabel = nextLabel;
    target.textContent = nextLabel;
    updateSelectedRouteDetails();
  };

  editor.addEventListener("blur", commit, { once: true });
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Enter") editor.blur();
    if (event.key === "Escape") {
      editor.value = routeInput.dataset.routeLabel || routeInput.dataset.routeDefaultLabel || "Route";
      editor.blur();
    }
  });
}

function clearDropMarkers() {
  document.querySelectorAll(".route-item").forEach((card) => {
    card.classList.remove("is-drop-left", "is-drop-right");
  });
}

function attachRouteDragHandlers(card) {
  card.addEventListener("dragstart", (event) => {
    draggedRouteId = card.dataset.control;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedRouteId);
  });

  card.addEventListener("dragend", () => {
    draggedRouteId = null;
    card.classList.remove("is-dragging");
    clearDropMarkers();
  });

  card.addEventListener("dragover", (event) => {
    if (!draggedRouteId || draggedRouteId === card.dataset.control) return;
    event.preventDefault();
    const rect = card.getBoundingClientRect();
    const dropAfter = event.clientX > rect.left + rect.width / 2;
    clearDropMarkers();
    card.classList.add(dropAfter ? "is-drop-right" : "is-drop-left");
  });

  card.addEventListener("drop", (event) => {
    event.preventDefault();
    const dragged = document.querySelector(`[data-control="${draggedRouteId}"]`);
    if (!dragged || dragged === card) return;

    const rect = card.getBoundingClientRect();
    const dropAfter = event.clientX > rect.left + rect.width / 2;
    routeGrid.insertBefore(dragged, dropAfter ? card.nextSibling : card);
    clearDropMarkers();
  });
}

function attachRouteRangeHandlers(card, routeInput) {
  const meter = card.querySelector(".meter");
  if (!meter) return;

  meter.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest("[data-range-handle]");
    if (!handle) return;

    event.preventDefault();
    event.stopPropagation();
    card.draggable = false;
    const { min, max } = getRouteRange(routeInput);
    rangeDrag = {
      card,
      meter,
      routeInput,
      handle: handle.dataset.rangeHandle,
      startMin: min,
      startMax: max,
    };
    handle.setPointerCapture?.(event.pointerId);
    handle.classList.add("is-dragging");
  });
}

function updateRangeDrag(event) {
  if (!rangeDrag) return;
  const rect = rangeDrag.meter.getBoundingClientRect();
  const fraction = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
  const minGap = 0.04;
  const currentRange = getRouteRange(rangeDrag.routeInput);

  if (rangeDrag.handle === "min") {
    rangeDrag.routeInput.dataset.routeMin = String(
      clamp(fraction, 0, Math.max(0, currentRange.max - minGap))
    );
  } else {
    rangeDrag.routeInput.dataset.routeMax = String(
      clamp(fraction, Math.min(1, currentRange.min + minGap), 1)
    );
  }

  updateRouteRangeVisual(rangeDrag.card, rangeDrag.routeInput, Number(rangeDrag.card.style.getPropertyValue("--route-value")) || 0);
}

function endRangeDrag() {
  if (!rangeDrag) return;
  rangeDrag.card.draggable = true;
  rangeDrag.card.querySelectorAll(".range-handle").forEach((handle) => {
    handle.classList.remove("is-dragging");
  });
  rangeDrag = null;
}

function getCssPixelValue(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getPanelWidth(panelName) {
  const config = panelWidthConfig[panelName];
  const panel = document.querySelector(config.selector);
  return getCssPixelValue(config.property, panel?.getBoundingClientRect().width || config.min);
}

function clampPanelWidth(panelName, width) {
  const config = panelWidthConfig[panelName];
  let max = config.max;

  if (window.innerWidth > 1000) {
    const otherPanelName = panelName === "route" ? "source" : "route";
    const otherWidth = getPanelWidth(otherPanelName);
    const edge = getCssPixelValue("--edge-margin", 16);
    const gap = getCssPixelValue("--panel-gap", 16);
    const minimumRouteSpace = 300;
    max = Math.min(max, window.innerWidth - otherWidth - (edge * 2) - (gap * 2) - minimumRouteSpace);
  }

  return Math.max(config.min, Math.min(Math.max(config.min, max), width));
}

function setPanelWidth(panelName, width) {
  const config = panelWidthConfig[panelName];
  document.documentElement.style.setProperty(config.property, `${Math.round(width)}px`);
}

function updatePanelResize(event) {
  if (!panelResize) return;
  const delta = event.clientX - panelResize.startX;
  const nextWidth = panelResize.panelName === "source"
    ? panelResize.startWidth - delta
    : panelResize.startWidth + delta;
  setPanelWidth(panelResize.panelName, clampPanelWidth(panelResize.panelName, nextWidth));
}

function endPanelResize() {
  if (!panelResize) return;
  panelResize.handle.classList.remove("is-dragging");
  document.body.classList.remove("panel-resizing");
  panelResize = null;
}

document.addEventListener("pointermove", updateRangeDrag);
document.addEventListener("pointerup", endRangeDrag);
document.addEventListener("pointermove", updatePanelResize);
document.addEventListener("pointerup", endPanelResize);

document.querySelectorAll("[data-panel-resizer]").forEach((handle) => {
  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const panelName = handle.dataset.panelResizer;
    panelResize = {
      panelName,
      handle,
      startX: event.clientX,
      startWidth: getPanelWidth(panelName),
    };
    handle.classList.add("is-dragging");
    document.body.classList.add("panel-resizing");
    handle.setPointerCapture?.(event.pointerId);
  });
});

addRouteButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleRouteMenu();
});

routeMenu.querySelectorAll("[data-add-route]").forEach((button) => {
  button.addEventListener("click", () => addRoute(button.dataset.addRoute));
});

document.addEventListener("click", (event) => {
  if (!routeMenu.hidden && !routeMenu.contains(event.target) && event.target !== addRouteButton) {
    closeRouteMenu();
  }

  const inRouteCard = Boolean(event.target.closest(".route-item"));
  const inSourcePanel = Boolean(event.target.closest(".source-rail"));
  const inPanelResizer = Boolean(event.target.closest("[data-panel-resizer]"));
  const inRouteMenu = routeMenu.contains(event.target) || event.target === addRouteButton;
  if (!inRouteCard && !inSourcePanel && !inPanelResizer && !inRouteMenu) {
    selectRoute(null);
  }
});

document.querySelectorAll("[data-control-input]").forEach((input) => {
  input.addEventListener("change", () => {
    updateRouteRow(input);
    if (input.id === selectedRouteInputId) {
      updateSourcePalette();
      updateSelectedRouteDetails();
    }
  });
  updateRouteRow(input);
});

updateRouteMenu();
selectRoute(null);

function updateModePicker(picker, value) {
  const row = picker.closest(".gesture-row");
  row.dataset.mode = value;
  picker.querySelectorAll(".mode-chip").forEach((chip) => {
    chip.classList.toggle("is-selected", chip.dataset.value === value);
  });
}

document.querySelectorAll("[data-gesture-mode]").forEach((picker) => {
  const row = picker.closest(".gesture-row");
  const input = row.querySelector("input[type='hidden']");

  gestureModes.forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mode-chip";
    button.dataset.value = mode.value;
    button.textContent = mode.label;
    button.addEventListener("click", () => {
      input.value = mode.value;
      updateModePicker(picker, input.value);
    });
    picker.appendChild(button);
  });

  updateModePicker(picker, input.value);
});

// Get HTML elements and create global variables.
const videoElement = document.getElementsByClassName("input_video")[0];
const videoSelect = document.querySelector("select#videoSource");
const selectors = [videoSelect];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");
const showTracking = document.getElementById("showTracking");
const selfie = document.getElementById("selfie");
const fpsoutput = document.getElementById("fps");
const gesture = document.getElementById("gesture");
const device = document.getElementById("device");
const sendMidi = document.getElementById("sendMidi");
const bpm = document.getElementById("bpm");
const noteRouteInput = document.getElementById("noteRouteInput");
const BPMAutomateInput = document.getElementById("BPMAutomateInput");
const bpmValue = document.getElementById("bpmValue");
const sliderMinValueInput = document.getElementById("sliderMinValue");
const sliderMaxValueInput = document.getElementById("sliderMaxValue");
const midiChannel = document.getElementById("midiChannel");
const midiPitchControlInput = document.getElementById("midiPitchControlInput");
const midiVelInput = document.getElementById("midiVelInput");
const pitchBendInput = document.getElementById("pitchBendInput");
const aftertouchInput = document.getElementById("aftertouchInput");
const cc1Input = document.getElementById("cc1Input");
const cc1Controller = document.getElementById("cc1Controller");
const cc1Channel = document.getElementById("cc1Channel");
const cc2Input = document.getElementById("cc2Input");
const cc2Controller = document.getElementById("cc2Controller");
const cc2Channel = document.getElementById("cc2Channel");
const cc3Input = document.getElementById("cc3Input");
const cc3Controller = document.getElementById("cc3Controller");
const cc3Channel = document.getElementById("cc3Channel");
const cc4Input = document.getElementById("cc4Input");
const cc4Controller = document.getElementById("cc4Controller");
const cc4Channel = document.getElementById("cc4Channel");
const trackingStatus = document.getElementById("trackingStatus");
const triggerStack = document.getElementById("triggerStack");
const midiStatus = document.getElementById("midiStatus");
const streamRow = document.querySelector("[data-stream='sendMidi']");
const mappingRows = new Map(
  [...document.querySelectorAll("[data-control]")].map((row) => [
    row.dataset.control,
    row,
  ])
);

let output;
let tempo = 500; // BPM 120.
let minVal = Number(sliderMinValueInput.value);
let maxVal = Number(sliderMaxValueInput.value);
let midiPitchControlValue = 60;
let midiVel = 1;
let activeControlKeys = new Set();

function setMidiStatus(ready, title) {
  midiStatus.classList.toggle("is-ready", Boolean(ready));
  midiStatus.title = title;
}

function populateMidiOutputs() {
  device.replaceChildren();

  if (!window.WebMidi || WebMidi.outputs.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No MIDI outputs";
    device.appendChild(option);
    device.disabled = true;
    output = undefined;
    setMidiStatus(false, "No MIDI output");
    return;
  }

  WebMidi.outputs.forEach((midiOutput) => {
    const option = document.createElement("option");
    option.value = midiOutput.name;
    option.textContent = midiOutput.name;
    device.appendChild(option);
  });
  device.disabled = false;
  output = WebMidi.outputs[0];
  setMidiStatus(true, `MIDI: ${output.name}`);
}

if (navigator.requestMIDIAccess && window.WebMidi) {
  WebMidi.enable()
    .then(populateMidiOutputs)
    .catch((err) => {
      console.warn("Web MIDI access error:", err);
      setMidiStatus(false, "MIDI unavailable");
    });
} else {
  setMidiStatus(false, "Web MIDI unsupported");
}

function changeDevice() {
  if (!window.WebMidi) return;
  output = WebMidi.outputs.find((midiOutput) => midiOutput.name === device.value);
  setMidiStatus(Boolean(output), output ? `MIDI: ${output.name}` : "MIDI unavailable");
}

if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
  console.warn(
    "Safari detected. Web MIDI API is not natively supported. Consider using Chrome or Firefox."
  );
}

function gotDevices(deviceInfos) {
  const values = selectors.map((select) => select.value);
  selectors.forEach((select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });

  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }

  selectors.forEach((select, selectorIndex) => {
    if (
      Array.prototype.slice
        .call(select.childNodes)
        .some((node) => node.value === values[selectorIndex])
    ) {
      select.value = values[selectorIndex];
    }
  });
}

if (navigator.mediaDevices?.enumerateDevices) {
  navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
}

function gotStream(stream) {
  window.stream = stream;
  videoElement.srcObject = stream;
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
  trackingStatus.textContent = "Camera off";
}

midiPitchControlInput.addEventListener("change", function () {
  if (midiPitchControlInput.value === "nil") {
    midiPitchControlValue = 60;
  }
});

pitchBendInput.addEventListener("change", function () {
  if (pitchBendInput.value === "nil" && output) {
    output.sendPitchBend(0);
  }
});

aftertouchInput.addEventListener("change", function () {
  if (aftertouchInput.value === "nil" && output) {
    output.sendChannelAftertouch(0, "all");
  }
});

cc1Input.addEventListener("change", function () {
  if (cc1Input.value === "nil") cc1Control(0);
});

cc2Input.addEventListener("change", function () {
  if (cc2Input.value === "nil") cc2Control(0);
});

cc3Input.addEventListener("change", function () {
  if (cc3Input.value === "nil") cc3Control(0);
});

cc4Input.addEventListener("change", function () {
  if (cc4Input.value === "nil") cc4Control(0);
});

function scaleValue(value, inMin, inMax, outMin, outMax) {
  if (inMin === inMax) return outMin;
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getNumberInputStep(input) {
  const step = Number(input.step);
  return Number.isFinite(step) && step > 0 ? step : 1;
}

function getNumberInputValue(input) {
  const value = Number(input.value);
  if (Number.isFinite(value)) return value;

  const defaultValue = Number(input.getAttribute("value"));
  if (Number.isFinite(defaultValue)) return defaultValue;

  const min = Number(input.min);
  if (Number.isFinite(min)) return min;

  return 0;
}

function getNumberInputBound(input, attributeName, fallback) {
  const rawValue = input.getAttribute(attributeName);
  if (rawValue === null || rawValue.trim() === "") return fallback;

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : fallback;
}

function formatNumberInputValue(value, step) {
  if (Number.isInteger(step)) return String(Math.round(value));

  const decimalPart = String(step).split(".")[1] || "";
  return value.toFixed(Math.min(decimalPart.length, 6)).replace(/\.?0+$/, "");
}

function handleNumberInputWheel(event) {
  const input = event.target.closest("input[type='number']");
  if (!input || input.disabled || input.readOnly) return;

  event.preventDefault();
  event.stopPropagation();

  const direction = event.deltaY < 0 ? 1 : -1;
  const step = getNumberInputStep(input);
  const lower = getNumberInputBound(input, "min", -Infinity);
  const upper = getNumberInputBound(input, "max", Infinity);
  const nextValue = clamp(getNumberInputValue(input) + direction * step, lower, upper);

  input.value = formatNumberInputValue(nextValue, step);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function linearScale(value, inMin, inMax, outMin, outMax) {
  const scaledValue = scaleValue(value, inMin, inMax, outMin, outMax);
  return outMin < outMax
    ? clamp(scaledValue, outMin, outMax)
    : clamp(scaledValue, outMax, outMin);
}

document.querySelectorAll("input[type='number']").forEach((input) => {
  input.addEventListener("wheel", handleNumberInputWheel, { passive: false });
});

function setTempoFromBpm(bpmNumber) {
  const safeBpm = clamp(Number(bpmNumber) || 120, minVal, maxVal);
  bpm.value = safeBpm;
  bpmValue.textContent = Math.round(safeBpm);
  tempo = 60000 / safeBpm;
}

bpm.addEventListener("input", function () {
  setTempoFromBpm(bpm.value);
});

function syncBpmRange() {
  minVal = Number(sliderMinValueInput.value) || 20;
  maxVal = Number(sliderMaxValueInput.value) || 500;

  if (minVal >= maxVal) {
    maxVal = minVal + 1;
    sliderMaxValueInput.value = maxVal;
  }

  bpm.min = minVal;
  bpm.max = maxVal;
  setTempoFromBpm(bpm.value);
}

sliderMinValueInput.addEventListener("input", syncBpmRange);
sliderMaxValueInput.addEventListener("input", syncBpmRange);

let BPMTracker = new Date();

function playMidiNote(note, channel, duration = 500, attack = 1) {
  if (!output) return;
  output.playNote(Number(note) || 60, [Number(channel) || 1], {
    attack,
    duration,
  });
}

function myMidiNoteLoop(hands) {
  const hasHand = Boolean(hands.left || hands.right);
  const isActive = sendMidi.checked && hasHand;
  streamRow.classList.toggle("is-active", isActive);

  const now = new Date();
  const timeDiffBPM = now.getTime() - BPMTracker.getTime();
  if (addedRoutes.has("noteRouteInput")) {
    setControlFeedback(noteRouteInput, isActive ? 1 : 0, isActive);
  }

  if (isActive && timeDiffBPM >= tempo) {
    playMidiNote(midiPitchControlValue, midiChannel.value, tempo * 0.8, midiVel);
    BPMTracker = new Date();
  }
}

function autoBPMControl(controlValue) {
  const mappedBpm = linearScale(controlValue, 0, 1, minVal, maxVal);
  setTempoFromBpm(mappedBpm);
}

function midiVelControl(controlValue) {
  midiVel = clamp(controlValue, 0, 1);
}

function midiPitchControl(controlValue) {
  midiPitchControlValue = Math.round(linearScale(controlValue, 0, 1, 1, 127));
}

function pitchBendControl(controlValue) {
  if (output) output.sendPitchBend(linearScale(controlValue, 0, 1, -1, 1));
}

function aftertouchControl(controlValue) {
  if (output) output.sendChannelAftertouch(clamp(controlValue, 0, 1), "all");
}

function cc1Control(controlValue) {
  if (output)
    output.sendControlChange(
      Number(cc1Controller.value),
      linearScale(controlValue, 0, 1, 0, 127),
      [cc1Channel.value]
    );
}

function cc2Control(controlValue) {
  if (output)
    output.sendControlChange(
      Number(cc2Controller.value),
      linearScale(controlValue, 0, 1, 0, 127),
      [cc2Channel.value]
    );
}

function cc3Control(controlValue) {
  if (output)
    output.sendControlChange(
      Number(cc3Controller.value),
      linearScale(controlValue, 0, 1, 0, 127),
      [cc3Channel.value]
    );
}

function cc4Control(controlValue) {
  if (output)
    output.sendControlChange(
      Number(cc4Controller.value),
      linearScale(controlValue, 0, 1, 0, 127),
      [cc4Channel.value]
    );
}

const controls_io = [
  { in: BPMAutomateInput, out: autoBPMControl },
  { in: midiPitchControlInput, out: midiPitchControl },
  { in: midiVelInput, out: midiVelControl },
  { in: pitchBendInput, out: pitchBendControl },
  { in: aftertouchInput, out: aftertouchControl },
  { in: cc1Input, out: cc1Control },
  { in: cc2Input, out: cc2Control },
  { in: cc3Input, out: cc3Control },
  { in: cc4Input, out: cc4Control },
];

function createHand(landmarks) {
  return {
    landmarks,
    wrist: landmarks[0],
    thumb: landmarks[4],
    index: landmarks[8],
    middle: landmarks[12],
    ring: landmarks[16],
    pinky: landmarks[20],
    palm: landmarks[9],
  };
}

function distance2D(a, b) {
  if (!a || !b) return null;
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function handScale(hand) {
  if (!hand) return null;
  return Math.max(distance2D(hand.wrist, hand.palm), 0.04);
}

function fistStrength(hand) {
  if (!hand) return null;
  const scale = handScale(hand);
  const tipIndexes = [8, 12, 16, 20];
  const averageTipDistance =
    tipIndexes.reduce((sum, index) => {
      return sum + distance2D(hand.landmarks[index], hand.wrist) / scale;
    }, 0) / tipIndexes.length;

  return linearScale(averageTipDistance, 2.65, 1.25, 0, 1);
}

function pinchStrength(hand) {
  if (!hand) return null;
  const pinchDistance = distance2D(hand.thumb, hand.index) / handScale(hand);
  return linearScale(pinchDistance, 1.15, 0.34, 0, 1);
}

function spreadStrength(hand) {
  if (!hand) return null;
  const spreadDistance = distance2D(hand.thumb, hand.pinky) / handScale(hand);
  return linearScale(spreadDistance, 1.0, 2.45, 0, 1);
}

function palmRoll(hand, side) {
  if (!hand) return null;
  const roll = side === "left"
    ? hand.thumb.x - hand.pinky.x
    : hand.pinky.x - hand.thumb.x;
  return linearScale(roll, -0.18, 0.18, 1, 0);
}

function depthValue(hand) {
  if (!hand) return null;
  return linearScale(hand.index.z, 0.1, -0.22, 0, 1);
}

function getControlValue(controlName, hands) {
  if (controlName?.startsWith("gesture:")) {
    const gestureId = controlName.slice("gesture:".length);
    const config = gestureConfigs.find((gestureConfig) => gestureConfig.id === gestureId);
    return config?.on ? 1 : 0;
  }

  switch (controlName) {
    case "leftIndexX":
      return hands.left ? hands.left.index.x : null;
    case "leftIndexY":
      return hands.left ? 1 - hands.left.index.y : null;
    case "leftClosed":
      return fistStrength(hands.left);
    case "leftPinch":
      return pinchStrength(hands.left);
    case "leftSpread":
      return spreadStrength(hands.left);
    case "leftIndexZ":
      return depthValue(hands.left);
    case "leftPalmRoll":
      return palmRoll(hands.left, "left");
    case "rightIndexX":
      return hands.right ? hands.right.index.x : null;
    case "rightIndexY":
      return hands.right ? 1 - hands.right.index.y : null;
    case "rightClosed":
      return fistStrength(hands.right);
    case "rightPinch":
      return pinchStrength(hands.right);
    case "rightSpread":
      return spreadStrength(hands.right);
    case "rightIndexZ":
      return depthValue(hands.right);
    case "rightPalmRoll":
      return palmRoll(hands.right, "right");
    case "indexDistance":
      return hands.left && hands.right
        ? linearScale(distance2D(hands.left.index, hands.right.index), 0.02, 0.72, 0, 1)
        : null;
    case "handsDistance":
      return hands.left && hands.right
        ? linearScale(distance2D(hands.left.wrist, hands.right.wrist), 0.08, 0.9, 0, 1)
        : null;
    default:
      return null;
  }
}

function setControlFeedback(selectElement, value, isActive) {
  const row = mappingRows.get(selectElement.id);
  if (!row) return;

  row.classList.toggle("is-active", isActive);
  updateRouteRangeVisual(row, selectElement, isActive ? clamp(value, 0, 1) : 0);
}

function resetControlFeedback() {
  controls_io.forEach((io) => setControlFeedback(io.in, 0, false));
  if (noteRouteInput) setControlFeedback(noteRouteInput, 0, false);
  streamRow.classList.remove("is-active");
  activeControlKeys = new Set();
}

function myMidi(hands) {
  activeControlKeys = new Set();

  if (midiVelInput.value === "nil") {
    midiVel = 1;
  }

  controls_io.forEach((io) => {
    const controlName = io.in.value;
    const rawControlValue = getControlValue(controlName, hands);
    const controlValue = rawControlValue === null ? null : applyRouteRange(io.in, rawControlValue);
    const isActive = controlName !== "nil" && controlValue !== null;

    if (isActive) {
      io.out(controlValue);
      activeControlKeys.add(controlName);
    }

    setControlFeedback(io.in, controlValue || 0, isActive);
  });
}

const gestureConfigs = [
  {
    id: "indexTouch",
    label: "Index touch",
    color: "#e3a522",
    mode: document.getElementById("trigger1ModeInput"),
    channel: document.getElementById("trigger1Channel"),
    note: document.getElementById("midi1NoteInput"),
    cc: document.getElementById("trigger1CcInput"),
    amount: document.getElementById("trigger1AmountInput"),
    metric: (hands) =>
      hands.left && hands.right ? distance2D(hands.left.index, hands.right.index) : null,
    activate: (value) => value <= 0.045,
    deactivate: (value) => value > 0.075,
  },
  {
    id: "leftBack",
    label: "L back",
    color: "#6b5fb5",
    mode: document.getElementById("trigger2ModeInput"),
    channel: document.getElementById("trigger2Channel"),
    note: document.getElementById("midi2NoteInput"),
    cc: document.getElementById("trigger2CcInput"),
    amount: document.getElementById("trigger2AmountInput"),
    metric: (hands) =>
      hands.left ? hands.left.thumb.x - hands.left.pinky.x : null,
    activate: (value) => value <= -0.1,
    deactivate: (value) => value > -0.02,
  },
  {
    id: "rightBack",
    label: "R back",
    color: "#6b5fb5",
    mode: document.getElementById("trigger3ModeInput"),
    channel: document.getElementById("trigger3Channel"),
    note: document.getElementById("midi3NoteInput"),
    cc: document.getElementById("trigger3CcInput"),
    amount: document.getElementById("trigger3AmountInput"),
    metric: (hands) =>
      hands.right ? hands.right.pinky.x - hands.right.thumb.x : null,
    activate: (value) => value <= -0.1,
    deactivate: (value) => value > -0.02,
  },
  {
    id: "leftPinch",
    label: "L pinch",
    color: "#0f9f8f",
    mode: document.getElementById("trigger4ModeInput"),
    channel: document.getElementById("trigger4Channel"),
    note: document.getElementById("midi4NoteInput"),
    cc: document.getElementById("trigger4CcInput"),
    amount: document.getElementById("trigger4AmountInput"),
    metric: (hands) =>
      hands.left ? distance2D(hands.left.thumb, hands.left.index) / handScale(hands.left) : null,
    activate: (value) => value <= 0.42,
    deactivate: (value) => value > 0.68,
  },
  {
    id: "rightPinch",
    label: "R pinch",
    color: "#0f9f8f",
    mode: document.getElementById("trigger5ModeInput"),
    channel: document.getElementById("trigger5Channel"),
    note: document.getElementById("midi5NoteInput"),
    cc: document.getElementById("trigger5CcInput"),
    amount: document.getElementById("trigger5AmountInput"),
    metric: (hands) =>
      hands.right ? distance2D(hands.right.thumb, hands.right.index) / handScale(hands.right) : null,
    activate: (value) => value <= 0.42,
    deactivate: (value) => value > 0.68,
  },
  {
    id: "doubleFist",
    label: "Both fists",
    color: "#d85f3a",
    mode: document.getElementById("trigger6ModeInput"),
    channel: document.getElementById("trigger6Channel"),
    note: document.getElementById("midi6NoteInput"),
    cc: document.getElementById("trigger6CcInput"),
    amount: document.getElementById("trigger6AmountInput"),
    metric: (hands) =>
      hands.left && hands.right
        ? Math.min(fistStrength(hands.left), fistStrength(hands.right))
        : null,
    activate: (value) => value >= 0.72,
    deactivate: (value) => value < 0.48,
  },
];

function setGestureFeedback(config, isActive) {
  const row = document.querySelector(`[data-gesture="${config.id}"]`);
  if (!row) return;
  row.classList.toggle("is-active", isActive);
}

function getGestureAmount(config) {
  return clamp(Number(config.amount.value) || 0, 0, 127);
}

function getGestureDestinationLabel(config) {
  const mode = config.mode.value;
  if (mode === "note") return `Note ${Number(config.note.value) || 60}`;
  if (mode === "cc") return `CC ${Number(config.cc.value) || 0}`;
  if (mode === "bend") return `Bend ${getGestureAmount(config)}`;
  if (mode === "touch") return `Touch ${getGestureAmount(config)}`;
  return "Off";
}

function sendGestureMidi(config) {
  const mode = config.mode.value;
  const amount = getGestureAmount(config);

  if (mode === "off") return false;

  if (mode === "note") {
    playMidiNote(config.note.value, config.channel.value, 500, amount / 127);
    return true;
  }

  if (!output) return true;

  if (mode === "cc") {
    output.sendControlChange(
      Number(config.cc.value) || 0,
      amount,
      [Number(config.channel.value) || 1]
    );
    return true;
  }

  if (mode === "bend") {
    output.sendPitchBend(linearScale(amount, 0, 127, -1, 1));
    return true;
  }

  if (mode === "touch") {
    output.sendChannelAftertouch(amount / 127, "all");
    return true;
  }

  return false;
}

function flashGesture(config) {
  const row = document.querySelector(`[data-gesture="${config.id}"]`);
  if (row) {
    row.classList.remove("is-fired");
    void row.offsetWidth;
    row.classList.add("is-fired");
  }

  const pill = document.createElement("div");
  pill.className = "trigger-pill";
  pill.style.borderLeftColor = config.color;

  const label = document.createElement("span");
  label.textContent = config.label;
  const note = document.createElement("strong");
  note.textContent = getGestureDestinationLabel(config);

  pill.append(label, note);
  triggerStack.prepend(pill);

  while (triggerStack.children.length > 4) {
    triggerStack.lastElementChild.remove();
  }

  window.setTimeout(() => {
    pill.remove();
  }, 1400);
}

function processGestures(hands) {
  const enabled = gesture.checked;

  gestureConfigs.forEach((config) => {
    const value = enabled ? config.metric(hands) : null;

    if (value === null) {
      config.on = false;
      setGestureFeedback(config, false);
      return;
    }

    if (!config.on && config.activate(value)) {
      config.on = true;
      if (sendGestureMidi(config)) {
        flashGesture(config);
      }
    } else if (config.on && config.deactivate(value)) {
      config.on = false;
    }

    setGestureFeedback(config, config.on);
  });
}

function toCanvasPoint(landmark) {
  return {
    x: landmark.x * canvasElement.width,
    y: landmark.y * canvasElement.height,
  };
}

function drawRing(landmark, color, radius = 16) {
  if (!landmark) return;
  const point = toCanvasPoint(landmark);
  canvasCtx.save();
  canvasCtx.strokeStyle = color;
  canvasCtx.lineWidth = 4;
  canvasCtx.shadowColor = color;
  canvasCtx.shadowBlur = 14;
  canvasCtx.beginPath();
  canvasCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  canvasCtx.stroke();
  canvasCtx.restore();
}

function drawLine(a, b, color) {
  if (!a || !b) return;
  const start = toCanvasPoint(a);
  const end = toCanvasPoint(b);
  canvasCtx.save();
  canvasCtx.strokeStyle = color;
  canvasCtx.lineWidth = 4;
  canvasCtx.shadowColor = color;
  canvasCtx.shadowBlur = 12;
  canvasCtx.beginPath();
  canvasCtx.moveTo(start.x, start.y);
  canvasCtx.lineTo(end.x, end.y);
  canvasCtx.stroke();
  canvasCtx.restore();
}

function drawLabel(text, landmark, color) {
  if (!landmark) return;
  const point = toCanvasPoint(landmark);
  const x = clamp(point.x + 14, 8, canvasElement.width - 160);
  const y = clamp(point.y - 14, 26, canvasElement.height - 10);

  canvasCtx.save();
  canvasCtx.font = "700 16px Arial";
  const width = canvasCtx.measureText(text).width + 18;
  canvasCtx.fillStyle = "rgba(20, 20, 20, 0.74)";
  canvasCtx.strokeStyle = color;
  canvasCtx.lineWidth = 2;
  canvasCtx.beginPath();
  canvasCtx.roundRect(x, y - 20, width, 26, 7);
  canvasCtx.fill();
  canvasCtx.stroke();
  canvasCtx.fillStyle = "#fffaf0";
  canvasCtx.fillText(text, x + 9, y - 2);
  canvasCtx.restore();
}

function drawControlOverlay(controlName, hands) {
  const controlColor = "#0f9f8f";

  switch (controlName) {
    case "leftIndexX":
    case "leftIndexY":
    case "leftIndexZ":
      drawRing(hands.left?.index, controlColor);
      drawLabel("L index", hands.left?.index, controlColor);
      break;
    case "rightIndexX":
    case "rightIndexY":
    case "rightIndexZ":
      drawRing(hands.right?.index, controlColor);
      drawLabel("R index", hands.right?.index, controlColor);
      break;
    case "leftClosed":
      drawRing(hands.left?.wrist, controlColor, 22);
      drawLabel("L fist", hands.left?.wrist, controlColor);
      break;
    case "rightClosed":
      drawRing(hands.right?.wrist, controlColor, 22);
      drawLabel("R fist", hands.right?.wrist, controlColor);
      break;
    case "leftPinch":
      drawRing(hands.left?.thumb, controlColor, 13);
      drawRing(hands.left?.index, controlColor, 13);
      drawLine(hands.left?.thumb, hands.left?.index, controlColor);
      drawLabel("L pinch", hands.left?.index, controlColor);
      break;
    case "rightPinch":
      drawRing(hands.right?.thumb, controlColor, 13);
      drawRing(hands.right?.index, controlColor, 13);
      drawLine(hands.right?.thumb, hands.right?.index, controlColor);
      drawLabel("R pinch", hands.right?.index, controlColor);
      break;
    case "leftSpread":
      drawLine(hands.left?.thumb, hands.left?.pinky, controlColor);
      drawLabel("L spread", hands.left?.pinky, controlColor);
      break;
    case "rightSpread":
      drawLine(hands.right?.thumb, hands.right?.pinky, controlColor);
      drawLabel("R spread", hands.right?.pinky, controlColor);
      break;
    case "leftPalmRoll":
      drawLine(hands.left?.thumb, hands.left?.pinky, controlColor);
      drawLabel("L roll", hands.left?.palm, controlColor);
      break;
    case "rightPalmRoll":
      drawLine(hands.right?.thumb, hands.right?.pinky, controlColor);
      drawLabel("R roll", hands.right?.palm, controlColor);
      break;
    case "indexDistance":
      drawLine(hands.left?.index, hands.right?.index, controlColor);
      drawLabel("Index gap", hands.right?.index, controlColor);
      break;
    case "handsDistance":
      drawLine(hands.left?.wrist, hands.right?.wrist, controlColor);
      drawLabel("Hands", hands.right?.wrist, controlColor);
      break;
    default:
      break;
  }
}

function drawGestureOverlays(hands) {
  gestureConfigs.forEach((config) => {
    if (!config.on) return;

    switch (config.id) {
      case "indexTouch":
        drawLine(hands.left?.index, hands.right?.index, config.color);
        drawLabel(config.label, hands.right?.index, config.color);
        break;
      case "leftBack":
        drawLine(hands.left?.thumb, hands.left?.pinky, config.color);
        drawLabel(config.label, hands.left?.palm, config.color);
        break;
      case "rightBack":
        drawLine(hands.right?.thumb, hands.right?.pinky, config.color);
        drawLabel(config.label, hands.right?.palm, config.color);
        break;
      case "leftPinch":
        drawLine(hands.left?.thumb, hands.left?.index, config.color);
        drawLabel(config.label, hands.left?.index, config.color);
        break;
      case "rightPinch":
        drawLine(hands.right?.thumb, hands.right?.index, config.color);
        drawLabel(config.label, hands.right?.index, config.color);
        break;
      case "doubleFist":
        drawRing(hands.left?.wrist, config.color, 24);
        drawRing(hands.right?.wrist, config.color, 24);
        drawLabel(config.label, hands.right?.wrist, config.color);
        break;
      default:
        break;
    }
  });
}

let counter = 0;
let counterTracker = new Date();

function onResults(results) {
  counter++;
  const now = new Date();
  const timeDiff = now.getTime() - counterTracker.getTime();
  if (timeDiff >= 1000) {
    const fps = Math.floor(counter / (timeDiff / 1000));
    fpsoutput.textContent = fps;
    counter = 0;
    counterTracker = new Date();
  }

  const hands = { left: null, right: null };

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      const side = classification.label === "Right" ? "right" : "left";
      const landmarks = results.multiHandLandmarks[index];
      const isRightHand = side === "right";

      hands[side] = createHand(landmarks);

      if (showTracking.checked) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: isRightHand ? "#fffaf0" : "#0f9f8f",
          lineWidth: 3,
        });
        drawLandmarks(canvasCtx, landmarks, {
          color: isRightHand ? "#fffaf0" : "#0f9f8f",
          fillColor: isRightHand ? "#0f9f8f" : "#fffaf0",
          radius: (data) => linearScale(data.from.z, -0.15, 0.1, 8, 2),
        });
      }
    }
  }

  const handCount = Number(Boolean(hands.left)) + Number(Boolean(hands.right));
  trackingStatus.textContent = handCount ? `Hands ${handCount}` : "No hands";

  if (handCount) {
    processGestures(hands);
    myMidi(hands);
    myMidiNoteLoop(hands);
    activeControlKeys.forEach((controlName) => drawControlOverlay(controlName, hands));
    drawGestureOverlays(hands);
  } else {
    resetControlFeedback();
    processGestures(hands);
  }

  canvasCtx.restore();
}

selfie.addEventListener("change", function () {
  hands.setOptions({ selfieMode: this.checked });
});

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.3/${file}`;
  },
});

hands.setOptions({
  selfieMode: true,
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});

camera.start();

function start() {
  const videoSource = videoSelect.value;
  const constraints = {
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .then(gotDevices)
    .catch(handleError);
}

videoSelect.onchange = start;
