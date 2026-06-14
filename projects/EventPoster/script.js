const canvas = document.getElementById("poster-canvas");
const ctx = canvas.getContext("2d");
const MAX_DATE_TIME_ROWS = 6;

const controls = {
  imageInput: document.getElementById("image-input"),
  posterFrame: document.getElementById("poster-frame"),
  title: document.getElementById("poster-title"),
  subtitle: document.getElementById("poster-subtitle"),
  dateTimeLabel: document.getElementById("poster-date-times-label"),
  dateTimeList: document.getElementById("date-time-list"),
  addDateTime: document.getElementById("add-date-time"),
  footer: document.getElementById("poster-footer"),
  imageScale: document.getElementById("image-scale"),
  imageX: document.getElementById("image-x"),
  imageY: document.getElementById("image-y"),
  titleY: document.getElementById("title-y"),
  detailsY: document.getElementById("details-y"),
  textColor: document.getElementById("text-color"),
  accentColor: document.getElementById("accent-color"),
  qrLink: document.getElementById("qr-link"),
  qrSize: document.getElementById("qr-size"),
  qrX: document.getElementById("qr-x"),
  qrY: document.getElementById("qr-y"),
  openColorWheel: document.getElementById("open-color-wheel"),
  closeColorWheel: document.getElementById("close-color-wheel"),
  colorDialog: document.getElementById("color-dialog"),
  baseHue: document.getElementById("base-hue"),
  swatchList: document.getElementById("split-swatch-list"),
  imagePaletteList: document.getElementById("image-palette-list"),
  wheelMarkers: Array.from(document.querySelectorAll("[data-marker]")),
  posterActionDialog: document.getElementById("poster-action-dialog"),
  closePosterActions: document.getElementById("close-poster-actions"),
  downloadFromPreview: document.getElementById("download-from-preview"),
  uploadBaseImage: document.getElementById("upload-base-image"),
  download: document.getElementById("download-button"),
  presets: Array.from(document.querySelectorAll("[data-preset]")),
};

const state = {
  image: null,
  preset: "noir",
  overlay: "rgba(0, 0, 0, 0.34)",
  vignette: "rgba(0, 0, 0, 0.58)",
  shadow: "rgba(0, 0, 0, 0.82)",
  qrCanvas: null,
  paletteColors: [],
  lastDropAt: 0,
};

const presets = {
  noir: {
    text: "#f8f4eb",
    accent: "#f4b860",
    overlay: "rgba(0, 0, 0, 0.34)",
    vignette: "rgba(0, 0, 0, 0.58)",
    shadow: "rgba(0, 0, 0, 0.82)",
  },
  amber: {
    text: "#fff6de",
    accent: "#ff7a45",
    overlay: "rgba(61, 22, 9, 0.28)",
    vignette: "rgba(34, 10, 5, 0.5)",
    shadow: "rgba(17, 7, 4, 0.86)",
  },
  clean: {
    text: "#ffffff",
    accent: "#96e6d7",
    overlay: "rgba(0, 22, 28, 0.16)",
    vignette: "rgba(0, 0, 0, 0.42)",
    shadow: "rgba(0, 0, 0, 0.72)",
  },
};

function draw() {
  drawBackground();
  drawImageCover();
  drawReadabilityLayer();
  drawText();
  drawQrCode();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#6d2633");
  gradient.addColorStop(0.45, "#20273a");
  gradient.addColorStop(1, "#121217");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(244, 184, 96, 0.18)";
  ctx.beginPath();
  ctx.arc(850, 210, 420, 0, Math.PI * 2);
  ctx.fill();
}

function drawImageCover() {
  if (!state.image) {
    drawPlaceholderTexture();
    return;
  }

  const rect = getImageDrawRect();
  ctx.drawImage(state.image, rect.x, rect.y, rect.width, rect.height);
}

function getImageDrawRect() {
  const imageScale = Number(controls.imageScale.value) / 100;
  const imageOffsetX = Number(controls.imageX.value);
  const imageOffsetY = Number(controls.imageY.value);
  const imageRatio = state.image.width / state.image.height;
  const canvasRatio = canvas.width / canvas.height;
  let drawWidth = canvas.width;
  let drawHeight = canvas.height;

  if (imageRatio > canvasRatio) {
    drawHeight = canvas.height;
    drawWidth = drawHeight * imageRatio;
  } else {
    drawWidth = canvas.width;
    drawHeight = drawWidth / imageRatio;
  }

  drawWidth *= imageScale;
  drawHeight *= imageScale;
  const x = (canvas.width - drawWidth) / 2 + imageOffsetX;
  const y = (canvas.height - drawHeight) / 2 + imageOffsetY;

  return {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  };
}

function drawPlaceholderTexture() {
  for (let i = -canvas.height; i < canvas.width; i += 78) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = i % 156 === 0 ? "#f4b860" : "#ffffff";
    ctx.translate(i + 22, 0);
    ctx.rotate(-Math.PI / 7);
    ctx.translate(-(i + 22), 0);
    ctx.fillRect(i, -120, 22, canvas.height * 1.8);
    ctx.restore();
  }
}

function drawReadabilityLayer() {
  ctx.fillStyle = state.overlay;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const vertical = ctx.createLinearGradient(0, 0, 0, canvas.height);
  vertical.addColorStop(0, "rgba(0, 0, 0, 0.18)");
  vertical.addColorStop(0.22, "rgba(0, 0, 0, 0.08)");
  vertical.addColorStop(0.72, "rgba(0, 0, 0, 0.18)");
  vertical.addColorStop(1, "rgba(0, 0, 0, 0.66)");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const radial = ctx.createRadialGradient(540, 600, 100, 540, 600, 780);
  radial.addColorStop(0, "rgba(0, 0, 0, 0)");
  radial.addColorStop(1, state.vignette);
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawText() {
  const textColor = controls.textColor.value;
  const accent = controls.accentColor.value;
  const titleY = Number(controls.titleY.value);
  const detailsY = Number(controls.detailsY.value);
  const margin = 72;
  const scheduleLines = getDateTimeLines();
  const scheduleLayout = getScheduleLayout(scheduleLines.length);
  const scheduleHalfHeight = scheduleLayout.blockHeight / 2;
  const footerText = controls.footer.value.trim();
  const scheduleY = clamp(
    detailsY,
    margin + scheduleLayout.ruleGap + scheduleHalfHeight,
    canvas.height - margin - scheduleHalfHeight - (footerText ? scheduleLayout.footerGap : 0)
  );

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  drawPill(540, titleY - 125, controls.subtitle.value, accent, textColor);

  const titleLines = wrapText(controls.title.value.toUpperCase(), 900, "Bebas Neue", 164, 0.92);
  drawOutlinedLines(titleLines, 540, titleY, {
    font: "Bebas Neue",
    size: titleLines.length > 1 ? 146 : 172,
    lineHeight: titleLines.length > 1 ? 130 : 150,
    fill: textColor,
    stroke: "rgba(0, 0, 0, 0.6)",
    strokeWidth: 18,
    shadow: state.shadow,
  });

  drawRule(margin, scheduleY - scheduleHalfHeight - scheduleLayout.ruleGap, canvas.width - margin, accent);
  drawScheduleLines(scheduleLines, 540, scheduleY, {
    font: "Fira Sans",
    size: scheduleLayout.size,
    weight: 800,
    fill: textColor,
    shadow: state.shadow,
    lineHeight: scheduleLayout.lineHeight,
  });

  if (footerText) {
    drawCenteredText(footerText.toUpperCase(), 540, scheduleY + scheduleHalfHeight + scheduleLayout.footerGap, {
      font: "Fira Sans",
      size: scheduleLayout.footerSize,
      weight: 700,
      fill: textColor,
      shadow: state.shadow,
    });
  }

  ctx.restore();
}

function drawQrCode() {
  if (!state.qrCanvas) {
    return;
  }

  const size = Number(controls.qrSize.value);
  const padding = Math.round(size * 0.09);
  const boxSize = size + padding * 2;
  const x = clamp(Number(controls.qrX.value), 0, canvas.width - boxSize);
  const y = clamp(Number(controls.qrY.value), 0, canvas.height - boxSize);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  roundRect(x, y, boxSize, boxSize, 18);
  ctx.fillStyle = "#fffdf8";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.drawImage(state.qrCanvas, x + padding, y + padding, size, size);
  ctx.restore();
}

function drawPill(x, y, text, bg, color) {
  const cleanText = text.trim().toUpperCase();
  if (!cleanText) {
    return;
  }

  ctx.font = "800 34px Fira Sans, Arial, sans-serif";
  const width = Math.min(ctx.measureText(cleanText).width + 58, 900);
  const height = 58;
  roundRect(x - width / 2, y - height / 2, width, height, 29);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(cleanText, x, y + 2, width - 34);
}

function drawRule(x1, y, x2, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function drawOutlinedLines(lines, x, y, options) {
  const totalHeight = (lines.length - 1) * options.lineHeight;
  ctx.font = `400 ${options.size}px ${options.font}, Impact, sans-serif`;
  ctx.shadowColor = options.shadow;
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  ctx.strokeStyle = options.stroke;
  ctx.lineWidth = options.strokeWidth;
  ctx.fillStyle = options.fill;

  lines.forEach((line, index) => {
    const lineY = y - totalHeight / 2 + index * options.lineHeight;
    ctx.strokeText(line, x, lineY, 960);
    ctx.fillText(line, x, lineY, 960);
  });

  ctx.shadowColor = "transparent";
}

function drawScheduleLines(lines, x, y, options) {
  if (!lines.length) {
    return;
  }

  const totalHeight = (lines.length - 1) * options.lineHeight;

  lines.forEach((line, index) => {
    drawCenteredText(line.toUpperCase(), x, y - totalHeight / 2 + index * options.lineHeight, {
      font: options.font,
      size: options.size,
      weight: options.weight,
      fill: options.fill,
      shadow: options.shadow,
    });
  });
}

function drawCenteredText(text, x, y, options) {
  if (!text.trim()) {
    return;
  }

  ctx.font = `${options.weight} ${options.size}px ${options.font}, Arial, sans-serif`;
  ctx.shadowColor = options.shadow;
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = options.fill;
  ctx.fillText(text, x, y, 930);
  ctx.shadowColor = "transparent";
}

function getDateTimeLines() {
  return Array.from(controls.dateTimeList.querySelectorAll(".date-time-input"))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function getScheduleLayout(lineCount) {
  const count = Math.max(lineCount, 1);
  const size = clamp(46 - (count - 1) * 4, 30, 46);
  const lineHeight = Math.round(size * 1.28);

  return {
    size,
    lineHeight,
    blockHeight: Math.max(0, count - 1) * lineHeight,
    ruleGap: count > 1 ? 74 : 100,
    footerGap: count > 1 ? 68 : 86,
    footerSize: count > 3 ? 27 : 31,
  };
}

function wrapText(text, maxWidth, font, size, scale) {
  ctx.font = `400 ${size}px ${font}, Impact, sans-serif`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width * scale > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : [""];
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateQrCode() {
  const qrText = controls.qrLink.value.trim();

  if (!qrText) {
    state.qrCanvas = null;
    draw();
    return;
  }

  if (typeof window.qrcode !== "function") {
    state.qrCanvas = null;
    draw();
    return;
  }

  const qrCanvas = document.createElement("canvas");
  const qrContext = qrCanvas.getContext("2d");
  const quietZone = 4;
  const outputSize = 512;

  try {
    const qr = window.qrcode(0, "M");
    qr.addData(qrText);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = outputSize / (moduleCount + quietZone * 2);
    qrCanvas.width = outputSize;
    qrCanvas.height = outputSize;
    qrContext.fillStyle = "#ffffff";
    qrContext.fillRect(0, 0, outputSize, outputSize);
    qrContext.fillStyle = "#17191f";

    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (!qr.isDark(row, col)) {
          continue;
        }

        const x = Math.floor((col + quietZone) * cellSize);
        const y = Math.floor((row + quietZone) * cellSize);
        const width = Math.ceil((col + quietZone + 1) * cellSize) - x;
        const height = Math.ceil((row + quietZone + 1) * cellSize) - y;
        qrContext.fillRect(x, y, width, height);
      }
    }

    state.qrCanvas = qrCanvas;
  } catch (error) {
    state.qrCanvas = null;
  }

  draw();
}

function loadImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const image = new Image();
    image.addEventListener("load", () => {
      state.image = image;
      if (controls.colorDialog.open) {
        renderImagePalette();
      }
      draw();
    });
    image.src = reader.result;
  });
  reader.readAsDataURL(file);
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) {
    return;
  }

  state.preset = name;
  state.overlay = preset.overlay;
  state.vignette = preset.vignette;
  state.shadow = preset.shadow;
  controls.textColor.value = preset.text;
  controls.accentColor.value = preset.accent;
  controls.presets.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === name);
  });
  draw();
}

function getSplitComplementaryColors(baseHue) {
  return [
    { key: "base", name: "Base", hue: baseHue },
    { key: "split-a", name: "Split A", hue: normalizeHue(baseHue + 150) },
    { key: "split-b", name: "Split B", hue: normalizeHue(baseHue + 210) },
  ].map((color) => ({
    ...color,
    hex: hslToHex(color.hue, 82, 58),
  }));
}

function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function hslToHex(h, s, l) {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = chroma;
    g = x;
  } else if (h < 120) {
    r = x;
    g = chroma;
  } else if (h < 180) {
    g = chroma;
    b = x;
  } else if (h < 240) {
    g = x;
    b = chroma;
  } else if (h < 300) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  return `#${[r, g, b]
    .map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function extractProminentImageColors() {
  if (!state.image) {
    return [];
  }

  const sampleWidth = 120;
  const sampleHeight = 150;
  const sampleCanvas = document.createElement("canvas");
  const sampleContext = sampleCanvas.getContext("2d");
  const rect = getImageDrawRect();
  const scaleX = sampleWidth / canvas.width;
  const scaleY = sampleHeight / canvas.height;

  sampleCanvas.width = sampleWidth;
  sampleCanvas.height = sampleHeight;
  sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
  sampleContext.drawImage(
    state.image,
    rect.x * scaleX,
    rect.y * scaleY,
    rect.width * scaleX,
    rect.height * scaleY
  );

  const imageData = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const buckets = new Map();

  for (let index = 0; index < imageData.length; index += 16) {
    const r = imageData[index];
    const g = imageData[index + 1];
    const b = imageData[index + 2];
    const alpha = imageData[index + 3];

    if (alpha < 160) {
      continue;
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 510;

    if (lightness < 0.04 || lightness > 0.98) {
      continue;
    }

    const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    const key = [r, g, b]
      .map((channel) => Math.min(255, Math.round(channel / 24) * 24))
      .join(",");
    const bucket = buckets.get(key) || {
      count: 0,
      r: 0,
      g: 0,
      b: 0,
      saturation: 0,
      lightness: 0,
    };

    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.saturation += saturation;
    bucket.lightness += lightness;
    buckets.set(key, bucket);
  }

  const candidates = Array.from(buckets.values())
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count);
      const g = Math.round(bucket.g / bucket.count);
      const b = Math.round(bucket.b / bucket.count);
      const saturation = bucket.saturation / bucket.count;
      const lightness = bucket.lightness / bucket.count;
      const balance = 1 - Math.abs(lightness - 0.52) * 0.45;

      return {
        hex: rgbToHex(r, g, b),
        r,
        g,
        b,
        score: bucket.count * (0.55 + saturation) * balance,
      };
    })
    .sort((a, b) => b.score - a.score);

  const colors = [];

  candidates.forEach((candidate) => {
    if (colors.length >= 8) {
      return;
    }

    const isDistinct = colors.every((color) => colorDistance(candidate, color) > 44);
    if (isDistinct) {
      colors.push(candidate);
    }
  });

  return colors.map((color) => color.hex);
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function colorDistance(a, b) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

function setHarmonyColor(target, hex) {
  if (target === "text") {
    controls.textColor.value = hex;
  } else {
    controls.accentColor.value = hex;
  }
  draw();
}

function renderColorHarmony() {
  const colors = getSplitComplementaryColors(Number(controls.baseHue.value));
  const markerRadius = 42;

  controls.wheelMarkers.forEach((marker) => {
    const color = colors.find((item) => item.key === marker.dataset.marker);
    if (!color) {
      return;
    }

    const radians = ((color.hue - 90) * Math.PI) / 180;
    marker.style.setProperty("--x", `${50 + Math.cos(radians) * markerRadius}%`);
    marker.style.setProperty("--y", `${50 + Math.sin(radians) * markerRadius}%`);
    marker.style.setProperty("--marker-color", color.hex);
  });

  renderSwatchList(controls.swatchList, colors);
}

function renderImagePalette() {
  state.paletteColors = extractProminentImageColors();
  renderSwatchList(
    controls.imagePaletteList,
    state.paletteColors.map((hex, index) => ({
      name: `Image ${index + 1}`,
      hex,
    }))
  );
}

function renderSwatchList(container, colors) {
  container.innerHTML = "";

  if (!colors.length) {
    const empty = document.createElement("div");
    empty.className = "swatch-empty";
    empty.textContent = "No image colors";
    container.appendChild(empty);
    return;
  }

  colors.forEach((color) => {
    const swatch = document.createElement("div");
    const chip = document.createElement("span");
    const detail = document.createElement("span");
    const name = document.createElement("span");
    const value = document.createElement("span");
    const textButton = document.createElement("button");
    const accentButton = document.createElement("button");

    swatch.className = "swatch-card";
    chip.className = "swatch-chip";
    chip.style.background = color.hex;
    name.className = "swatch-name";
    name.textContent = color.name;
    value.className = "swatch-value";
    value.textContent = color.hex.toUpperCase();
    textButton.className = "swatch-action";
    textButton.type = "button";
    textButton.dataset.apply = "text";
    textButton.dataset.color = color.hex;
    textButton.textContent = "Text";
    accentButton.className = "swatch-action";
    accentButton.type = "button";
    accentButton.dataset.apply = "accent";
    accentButton.dataset.color = color.hex;
    accentButton.textContent = "Accent";

    detail.append(name, value);
    swatch.append(chip, detail, textButton, accentButton);
    container.appendChild(swatch);
  });
}

function createRemoveDateTimeButton() {
  const button = document.createElement("button");
  button.className = "icon-button remove-date-time";
  button.type = "button";
  button.textContent = "-";
  button.title = "Remove date and time";
  button.setAttribute("aria-label", "Remove date and time");
  return button;
}

function addDateTimeRow(value = "") {
  const row = document.createElement("div");
  const input = document.createElement("input");

  row.className = "date-time-row";
  input.className = "date-time-input";
  input.type = "text";
  input.maxLength = 80;
  input.value = value;

  row.append(input);
  controls.dateTimeList.append(row);
  updateDateTimeRows();

  return row;
}

function updateDateTimeRows() {
  const rows = Array.from(controls.dateTimeList.querySelectorAll(".date-time-row"));
  const canRemove = rows.length > 1;
  const canAdd = rows.length < MAX_DATE_TIME_ROWS;

  rows.forEach((row, index) => {
    const input = row.querySelector(".date-time-input");
    let removeButton = row.querySelector(".remove-date-time");

    input.id = `poster-details-${index + 1}`;
    input.setAttribute("aria-label", `Date and time ${index + 1}`);
    row.classList.toggle("has-remove", canRemove);

    if (canRemove && !removeButton) {
      removeButton = createRemoveDateTimeButton();
      row.append(removeButton);
    } else if (!canRemove && removeButton) {
      removeButton.remove();
    }
  });

  const firstInput = rows[0]?.querySelector(".date-time-input");
  if (firstInput) {
    controls.dateTimeLabel.setAttribute("for", firstInput.id);
  }

  controls.addDateTime.disabled = !canAdd;
  controls.addDateTime.title = canAdd
    ? "Add date and time"
    : `Up to ${MAX_DATE_TIME_ROWS} date/time rows`;
}

function downloadPoster() {
  const link = document.createElement("a");
  link.download = "event-poster.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

controls.imageInput.addEventListener("change", (event) => {
  loadImageFile(event.target.files[0]);
  event.target.value = "";
});

["dragenter", "dragover"].forEach((eventName) => {
  controls.posterFrame.addEventListener(eventName, (event) => {
    event.preventDefault();
    controls.posterFrame.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  controls.posterFrame.addEventListener(eventName, (event) => {
    event.preventDefault();
    controls.posterFrame.classList.remove("is-dragging");
  });
});

controls.posterFrame.addEventListener("drop", (event) => {
  state.lastDropAt = Date.now();
  loadImageFile(event.dataTransfer.files[0]);
});

controls.posterFrame.addEventListener("click", () => {
  if (Date.now() - state.lastDropAt < 300) {
    return;
  }

  controls.posterActionDialog.showModal();
});

[
  controls.title,
  controls.subtitle,
  controls.footer,
  controls.imageScale,
  controls.imageX,
  controls.imageY,
  controls.titleY,
  controls.detailsY,
  controls.textColor,
  controls.accentColor,
  controls.qrSize,
  controls.qrX,
  controls.qrY,
].forEach((control) => {
  control.addEventListener("input", draw);
});

controls.addDateTime.addEventListener("click", () => {
  if (controls.dateTimeList.querySelectorAll(".date-time-row").length >= MAX_DATE_TIME_ROWS) {
    return;
  }

  const row = addDateTimeRow();
  row.querySelector(".date-time-input").focus();
  draw();
});

controls.dateTimeList.addEventListener("input", (event) => {
  if (event.target.matches(".date-time-input")) {
    draw();
  }
});

controls.dateTimeList.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-date-time");
  if (!button) {
    return;
  }

  button.closest(".date-time-row").remove();
  updateDateTimeRows();
  draw();
});

controls.qrLink.addEventListener("input", updateQrCode);

[controls.imageScale, controls.imageX, controls.imageY].forEach((control) => {
  control.addEventListener("input", () => {
    if (controls.colorDialog.open) {
      renderImagePalette();
    }
  });
});

controls.presets.forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

controls.openColorWheel.addEventListener("click", () => {
  renderImagePalette();
  renderColorHarmony();
  controls.colorDialog.showModal();
});

controls.closeColorWheel.addEventListener("click", () => {
  controls.colorDialog.close();
});

controls.colorDialog.addEventListener("click", (event) => {
  if (event.target === controls.colorDialog) {
    controls.colorDialog.close();
  }
});

controls.baseHue.addEventListener("input", renderColorHarmony);

controls.swatchList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apply]");
  if (!button) {
    return;
  }

  setHarmonyColor(button.dataset.apply, button.dataset.color);
});

controls.imagePaletteList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apply]");
  if (!button) {
    return;
  }

  setHarmonyColor(button.dataset.apply, button.dataset.color);
});

controls.closePosterActions.addEventListener("click", () => {
  controls.posterActionDialog.close();
});

controls.posterActionDialog.addEventListener("click", (event) => {
  if (event.target === controls.posterActionDialog) {
    controls.posterActionDialog.close();
  }
});

controls.downloadFromPreview.addEventListener("click", () => {
  controls.posterActionDialog.close();
  downloadPoster();
});

controls.uploadBaseImage.addEventListener("click", () => {
  controls.posterActionDialog.close();
  controls.imageInput.click();
});

controls.download.addEventListener("click", downloadPoster);

updateDateTimeRows();
draw();
renderColorHarmony();

if (document.fonts) {
  document.fonts.ready.then(draw);
}
