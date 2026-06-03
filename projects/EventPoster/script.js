const canvas = document.getElementById("poster-canvas");
const ctx = canvas.getContext("2d");

const controls = {
  imageInput: document.getElementById("image-input"),
  dropZone: document.getElementById("drop-zone"),
  title: document.getElementById("poster-title"),
  subtitle: document.getElementById("poster-subtitle"),
  details: document.getElementById("poster-details"),
  footer: document.getElementById("poster-footer"),
  titleY: document.getElementById("title-y"),
  detailsY: document.getElementById("details-y"),
  textColor: document.getElementById("text-color"),
  accentColor: document.getElementById("accent-color"),
  download: document.getElementById("download-button"),
  presets: Array.from(document.querySelectorAll("[data-preset]")),
};

const state = {
  image: null,
  preset: "noir",
  overlay: "rgba(0, 0, 0, 0.34)",
  vignette: "rgba(0, 0, 0, 0.58)",
  shadow: "rgba(0, 0, 0, 0.82)",
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

  const imageRatio = state.image.width / state.image.height;
  const canvasRatio = canvas.width / canvas.height;
  let drawWidth = canvas.width;
  let drawHeight = canvas.height;
  let x = 0;
  let y = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvas.height;
    drawWidth = drawHeight * imageRatio;
    x = (canvas.width - drawWidth) / 2;
  } else {
    drawWidth = canvas.width;
    drawHeight = drawWidth / imageRatio;
    y = (canvas.height - drawHeight) / 2;
  }

  ctx.drawImage(state.image, x, y, drawWidth, drawHeight);
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

  drawRule(margin, detailsY - 100, canvas.width - margin, accent);
  drawCenteredText(controls.details.value.toUpperCase(), 540, detailsY, {
    font: "Fira Sans",
    size: 46,
    weight: 800,
    fill: textColor,
    shadow: state.shadow,
  });

  drawCenteredText(controls.footer.value.toUpperCase(), 540, detailsY + 86, {
    font: "Fira Sans",
    size: 31,
    weight: 700,
    fill: textColor,
    shadow: state.shadow,
  });

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

function loadImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const image = new Image();
    image.addEventListener("load", () => {
      state.image = image;
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

function downloadPoster() {
  const link = document.createElement("a");
  link.download = "event-poster.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

controls.imageInput.addEventListener("change", (event) => {
  loadImageFile(event.target.files[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  controls.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    controls.dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  controls.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    controls.dropZone.classList.remove("is-dragging");
  });
});

controls.dropZone.addEventListener("drop", (event) => {
  loadImageFile(event.dataTransfer.files[0]);
});

[
  controls.title,
  controls.subtitle,
  controls.details,
  controls.footer,
  controls.titleY,
  controls.detailsY,
  controls.textColor,
  controls.accentColor,
].forEach((control) => {
  control.addEventListener("input", draw);
});

controls.presets.forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

controls.download.addEventListener("click", downloadPoster);

draw();

if (document.fonts) {
  document.fonts.ready.then(draw);
}
