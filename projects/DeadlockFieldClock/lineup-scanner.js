(() => {
  "use strict";
  const PROFILE_KEY = "deadlock-scan-crop-v1";
  const TOP_FRACTION = .18;
  const tick = () => new Promise(resolve => setTimeout(resolve, 0));

  function init({ heroes, onAccept }) {
    const dialog = document.querySelector("[data-scan-dialog]");
    const captureButton = dialog.querySelector("[data-scan-capture]");
    const fileInput = dialog.querySelector("[data-scan-file]");
    const status = dialog.querySelector("[data-scan-status]");
    const cropStage = dialog.querySelector("[data-scan-crop-stage]");
    const preview = dialog.querySelector("[data-scan-preview]");
    const canvas = dialog.querySelector("[data-scan-canvas]");
    const overlay = dialog.querySelector("[data-scan-overlay]");
    const rectangle = dialog.querySelector("[data-scan-rectangle]");
    const dividers = dialog.querySelector("[data-scan-dividers]");
    const fullImage = dialog.querySelector("[data-scan-full-image]");
    const review = dialog.querySelector("[data-scan-review]");
    const matchButton = dialog.querySelector("[data-scan-match]");
    const applyButton = dialog.querySelector("[data-scan-apply]");
    const reviewNote = dialog.querySelector("[data-scan-review-note]");
    const sourceCanvas = document.createElement("canvas");
    const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
    const heroById = Object.fromEntries(heroes.map(hero => [hero.id, hero]));
    const sortedHeroes = [...heroes].sort((a, b) => a.name.localeCompare(b.name));
    let frame = null, region = null, results = [], activeStream = null;
    let referencesPromise = null, generation = 0, busy = false, dragStart = null;

    const setStatus = (text, error = false) => {
      status.textContent = text;
      status.classList.toggle("is-error", error);
    };
    const setBusy = value => {
      busy = value;
      matchButton.disabled = value || !frame;
      matchButton.textContent = value ? "MATCHING…" : "MATCH PORTRAITS";
      captureButton.disabled = value || !navigator.mediaDevices?.getDisplayMedia;
      fileInput.disabled = value;
      dialog.setAttribute("aria-busy", String(value));
      if (results.length) updateApply();
    };
    const clearResults = () => {
      results = [];
      review.replaceChildren();
      review.hidden = true;
      applyButton.hidden = true;
      applyButton.disabled = true;
      reviewNote.textContent = "Only the crop position is remembered—not your screenshot.";
    };
    const stopCapture = () => {
      activeStream?.getTracks().forEach(track => track.stop());
      activeStream = null;
    };
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    function clampRegion(value) {
      const width = clamp(value.width, .03, 1);
      const height = clamp(value.height, .015, 1);
      return { x: clamp(value.x, 0, 1 - width), y: clamp(value.y, 0, 1 - height), width, height };
    }
    function pixelRegion() {
      return { x: region.x * frame.width, y: region.y * frame.height, width: region.width * frame.width, height: region.height * frame.height };
    }
    function drawPreview() {
      if (!frame) return;
      const visibleHeight = fullImage.checked ? frame.height : Math.round(frame.height * TOP_FRACTION);
      canvas.width = frame.width;
      canvas.height = visibleHeight;
      canvas.getContext("2d").drawImage(sourceCanvas, 0, 0, frame.width, visibleHeight, 0, 0, frame.width, visibleHeight);
      overlay.setAttribute("viewBox", `0 0 ${frame.width} ${visibleHeight}`);
      drawRegion();
    }
    function drawRegion() {
      if (!frame || !region) return;
      const bounds = pixelRegion();
      for (const [key, value] of Object.entries(bounds)) rectangle.setAttribute(key, String(value));
      dividers.innerHTML = Array.from({ length: 5 }, (_, index) => {
        const x = bounds.x + bounds.width * (index + 1) / 6;
        return `<line x1="${x}" x2="${x}" y1="${bounds.y}" y2="${bounds.y + bounds.height}"></line>`;
      }).join("");
    }
    function changeRegion(value) {
      region = clampRegion(value);
      clearResults();
      drawRegion();
      setStatus("Check that each outlined slot contains one enemy portrait, then match.");
    }
    function preset(side) {
      if (!frame || busy) return;
      const strip = frame.width / frame.height > 3.5;
      changeRegion(side === "whole" ? { x: 0, y: 0, width: 1, height: 1 } : {
        x: side === "left" ? .175 : .555, y: 0, width: .275, height: strip ? .85 : .088,
      });
      fullImage.checked = region.y + region.height > TOP_FRACTION;
      drawPreview();
    }
    function savedProfile() {
      try {
        const saved = JSON.parse(localStorage.getItem(PROFILE_KEY));
        if (!saved?.region || !Number.isFinite(saved.aspect)) return null;
        if (!["x", "y", "width", "height"].every(key => Number.isFinite(saved.region[key]))) return null;
        return saved;
      } catch { return null; }
    }
    function setFrame(image) {
      const width = image.videoWidth || image.width;
      const height = image.videoHeight || image.height;
      if (!width || !height) throw new Error("No usable image was captured. Try choosing or pasting a screenshot.");
      const scale = Math.min(1, 4096 / width, 4096 / height);
      sourceCanvas.width = Math.round(width * scale);
      sourceCanvas.height = Math.round(height * scale);
      context.drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height);
      frame = context.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      const saved = savedProfile();
      const aspect = frame.width / frame.height;
      if (saved && Math.abs(saved.aspect - aspect) < .05) region = clampRegion(saved.region);
      else region = aspect > 3.5 ? { x: 0, y: 0, width: 1, height: 1 } : { x: .555, y: 0, width: .275, height: .088 };
      fullImage.checked = aspect > 3.5 || region.y + region.height > TOP_FRACTION;
      clearResults();
      cropStage.hidden = false;
      drawPreview();
      setBusy(false);
      setStatus("Select exactly six enemy portraits. Adjust the suggested crop if needed.");
    }
    async function receiveFile(file) {
      if (!file || !dialog.open || busy) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 40 * 1024 * 1024) {
        setStatus("Choose a PNG, JPEG, or WebP screenshot under 40 MB.", true); return;
      }
      const token = ++generation;
      let bitmap;
      try {
        bitmap = await createImageBitmap(file);
        if (token === generation && dialog.open) setFrame(bitmap);
      } catch { if (token === generation && dialog.open) setStatus("That image could not be opened. Try a PNG or JPEG screenshot.", true); }
      finally { bitmap?.close(); fileInput.value = ""; }
    }
    async function capture() {
      if (busy) return;
      const token = ++generation;
      let video;
      setBusy(true);
      matchButton.textContent = "WAITING FOR IMAGE…";
      setStatus("Choose the game window in the browser prompt. Only one frame will be used.");
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "window", frameRate: 1 }, audio: false });
        if (token !== generation || !dialog.open) { stream.getTracks().forEach(track => track.stop()); return; }
        activeStream = stream;
        video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("aria-hidden", "true");
        video.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;";
        document.body.append(video);
        video.srcObject = stream;
        let playTimeout;
        try { await Promise.race([video.play(), new Promise((_, reject) => { playTimeout = setTimeout(() => reject(new Error("No video frame")), 6000); })]); }
        finally { clearTimeout(playTimeout); }
        if (video.readyState < 2) await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("The shared window did not produce an image. Try a screenshot instead.")), 6000);
          video.addEventListener("loadeddata", () => { clearTimeout(timer); resolve(); }, { once: true });
        });
        if (token === generation && dialog.open) setFrame(video);
      } catch (error) {
        if (token === generation && dialog.open) setStatus(error.name === "NotAllowedError" ? "Screen sharing was cancelled or denied. You can choose or paste a screenshot instead." : "The game window could not be captured. Try choosing or pasting a screenshot.", true);
      } finally {
        stopCapture();
        if (video) { video.pause(); video.srcObject = null; video.remove(); }
        if (token === generation) setBusy(false);
      }
    }
    function references() {
      if (!referencesPromise) referencesPromise = Promise.all(heroes.filter(hero => hero.hudImage).map(async hero => {
        const image = new Image();
        image.src = hero.hudImage;
        await image.decode();
        const referenceCanvas = document.createElement("canvas");
        referenceCanvas.width = image.naturalWidth;
        referenceCanvas.height = image.naturalHeight;
        const ctx = referenceCanvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        return window.DeadlockPortraitMatcher.prepare(hero.id, ctx.getImageData(0, 0, referenceCanvas.width, referenceCanvas.height));
      })).catch(error => { referencesPromise = null; throw error; });
      return referencesPromise;
    }
    function thumbnail(slot) {
      const bounds = pixelRegion();
      const thumb = document.createElement("canvas");
      thumb.width = 90; thumb.height = 100;
      thumb.getContext("2d").drawImage(sourceCanvas, bounds.x + bounds.width * slot / 6, bounds.y, bounds.width / 6, bounds.height, 0, 0, 90, 100);
      return thumb.toDataURL("image/png");
    }
    function renderReview() {
      review.innerHTML = results.map((result, index) => {
        const hero = heroById[result.id];
        return `<article class="scan-result ${result.needsReview ? "needs-review" : ""}" data-scan-result="${index}"><div class="scan-result-images"><img src="${thumbnail(index)}" alt="Captured portrait ${index + 1}">${hero ? `<img src="${hero.image}" alt="Suggested ${hero.name}" data-scan-reference="${index}">` : `<span data-scan-reference="${index}"></span>`}</div><small>${result.id ? (result.needsReview ? "CHECK MATCH" : "CLEAR MATCH") : "CHOOSE HERO"}</small><select data-scan-hero="${index}" aria-label="Hero for captured portrait ${index + 1}"><option value="">Choose hero…</option>${sortedHeroes.map(entry => `<option value="${entry.id}" ${entry.id === result.id ? "selected" : ""}>${entry.name}</option>`).join("")}</select></article>`;
      }).join("");
      review.hidden = false;
      applyButton.hidden = false;
      updateApply();
    }
    function updateApply() {
      const ids = results.map(result => result.id);
      const duplicates = ids.filter((id, index) => id && ids.indexOf(id) !== index);
      review.querySelectorAll("[data-scan-result]").forEach(card => card.classList.toggle("is-duplicate", duplicates.includes(results[Number(card.dataset.scanResult)].id)));
      applyButton.disabled = busy || ids.length !== 6 || ids.some(id => !heroById[id]) || duplicates.length > 0;
      reviewNote.textContent = duplicates.length ? "Duplicate heroes detected. Correct the highlighted slots before applying." : ids.some(id => !id) ? "Choose a hero for each empty slot before applying." : "Review the six heroes. USE LINEUP replaces your current selection.";
    }
    async function match() {
      if (!frame || !region || busy) return;
      const bounds = pixelRegion();
      if (bounds.width < 72 || bounds.height < 12) { setStatus("The crop is too small. Select the full strip of six portraits.", true); return; }
      const token = ++generation;
      clearResults(); setBusy(true);
      setStatus("Matching the selected portraits locally…");
      try {
        const templates = await references();
        if (token !== generation || !dialog.open) return;
        for (let slot = 0; slot < 6; slot++) {
          await tick();
          if (token !== generation || !dialog.open) return;
          const result = window.DeadlockPortraitMatcher.matchSlot(frame, bounds, slot, templates);
          if (heroById[result.id]?.hudReferenceStatus === "reveal-only") result.needsReview = true;
          results.push(result);
        }
        renderReview();
        const uncertain = results.filter(result => result.needsReview).length;
        setStatus(uncertain ? `${uncertain} ${uncertain === 1 ? "match needs" : "matches need"} a check. Review or correct the highlighted portraits.` : "Six clear matches. Review the lineup, then apply it.");
      } catch { if (token === generation) setStatus("Matching could not finish. Reload the page to refresh reference images, or use manual entry.", true); }
      finally { if (token === generation) setBusy(false); }
    }
    function pointerPosition(event) {
      const bounds = canvas.getBoundingClientRect();
      return { x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1), y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1) * canvas.height / frame.height };
    }
    preview.addEventListener("pointerdown", event => {
      if (!frame || busy || event.button !== 0) return;
      event.preventDefault(); preview.focus();
      dragStart = pointerPosition(event);
      preview.setPointerCapture(event.pointerId);
    });
    preview.addEventListener("pointermove", event => {
      if (!dragStart || busy) return;
      const point = pointerPosition(event);
      changeRegion({ x: Math.min(dragStart.x, point.x), y: Math.min(dragStart.y, point.y), width: Math.abs(point.x - dragStart.x), height: Math.abs(point.y - dragStart.y) });
    });
    preview.addEventListener("pointerup", () => { dragStart = null; });
    preview.addEventListener("pointercancel", () => { dragStart = null; });
    preview.addEventListener("keydown", event => {
      if (!frame || busy || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const value = { ...region };
      const amount = .002;
      if (event.key === "ArrowLeft") value[event.shiftKey ? "width" : "x"] -= amount;
      if (event.key === "ArrowRight") value[event.shiftKey ? "width" : "x"] += amount;
      if (event.key === "ArrowUp") value[event.shiftKey ? "height" : "y"] -= amount;
      if (event.key === "ArrowDown") value[event.shiftKey ? "height" : "y"] += amount;
      changeRegion(value);
    });
    document.querySelector('[data-action="scan-lineup"]').addEventListener("click", () => {
      ++generation;
      dialog.showModal();
      setBusy(false);
      setStatus(navigator.mediaDevices?.getDisplayMedia ? "Choose a source. Screen sharing stops after one frame." : "Screen sharing is unavailable here. Choose or paste a screenshot; or open this page in a supported desktop browser.");
    });
    dialog.querySelector("[data-scan-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    dialog.addEventListener("close", () => {
      ++generation; stopCapture(); setBusy(false); clearResults();
      frame = null; region = null; dragStart = null;
      sourceCanvas.width = sourceCanvas.height = canvas.width = canvas.height = 1;
      cropStage.hidden = true; fileInput.value = "";
    });
    captureButton.addEventListener("click", capture);
    fileInput.addEventListener("change", () => receiveFile(fileInput.files[0]));
    document.addEventListener("paste", event => {
      if (!dialog.open || busy) return;
      const item = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith("image/"));
      if (item) { event.preventDefault(); receiveFile(item.getAsFile()); }
    });
    preview.addEventListener("dragover", event => event.preventDefault());
    dialog.addEventListener("drop", event => { event.preventDefault(); receiveFile(event.dataTransfer?.files[0]); });
    dialog.querySelectorAll("[data-scan-side]").forEach(button => button.addEventListener("click", () => preset(button.dataset.scanSide)));
    fullImage.addEventListener("change", drawPreview);
    matchButton.addEventListener("click", match);
    review.addEventListener("change", event => {
      const select = event.target.closest("[data-scan-hero]");
      if (!select) return;
      const index = Number(select.dataset.scanHero);
      results[index] = { ...results[index], id: select.value || null, needsReview: !select.value };
      const card = select.closest(".scan-result");
      card.classList.toggle("needs-review", !select.value);
      card.querySelector("small").textContent = select.value ? "MANUALLY SELECTED" : "CHOOSE HERO";
      const oldImage = card.querySelector("[data-scan-reference]");
      const image = document.createElement(select.value ? "img" : "span");
      image.dataset.scanReference = String(index);
      image.alt = select.value ? `Selected ${heroById[select.value].name}` : "No hero selected";
      if (select.value) image.src = heroById[select.value].image;
      oldImage.replaceWith(image);
      updateApply();
    });
    applyButton.addEventListener("click", () => {
      if (applyButton.disabled) return;
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ region, aspect: frame.width / frame.height })); } catch { /* Optional calibration storage. */ }
      onAccept(results.map(result => result.id));
      dialog.close();
    });
    setBusy(false);
  }
  window.DeadlockLineupScanner = Object.freeze({ init });
})();
