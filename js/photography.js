const manifestPath = "../assets/images/portfolio/manifest.json";
const portfolioBasePath = "../assets/images/portfolio/";

const state = {
  items: [],
  activeTag: "all",
  activeSort: "newest",
  activeLightboxFileName: null,
};

const galleryGrid = document.getElementById("gallery-grid");
const tagToolbar = document.getElementById("tag-toolbar");
const sortSelect = document.getElementById("sort-select");
const photoCount = document.getElementById("photo-count");
const tagCount = document.getElementById("tag-count");
const resultsStatus = document.getElementById("results-status");
const activeFilterCopy = document.getElementById("active-filter-copy");

const lightbox = document.getElementById("lightbox");
const lightboxPanel = document.getElementById("lightbox-panel");
const lightboxFigure = document.getElementById("lightbox-figure");
const lightboxLoader = document.getElementById("lightbox-loader");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxDate = document.getElementById("lightbox-date");
const lightboxDescription = document.getElementById("lightbox-description");
const lightboxTags = document.getElementById("lightbox-tags");
const lightboxExpand = document.getElementById("lightbox-expand");
const lightboxExpandIcon = document.getElementById("lightbox-expand-icon");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");

let touchStartX = 0;
let touchStartY = 0;
let lightboxLoadToken = 0;

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  updateFullscreenButton();
  loadPortfolio();
});

function wireEvents() {
  sortSelect.addEventListener("change", (event) => {
    state.activeSort = event.target.value;
    renderGallery();
  });

  tagToolbar.addEventListener("click", (event) => {
    const button = event.target.closest(".tag-button");

    if (!button) {
      return;
    }

    state.activeTag = button.dataset.tag || "all";
    syncQueryString();
    renderTagToolbar();
    renderGallery();
  });

  galleryGrid.addEventListener("click", (event) => {
    const trigger = event.target.closest(".photo-trigger");

    if (!trigger) {
      return;
    }

    openLightbox(trigger.dataset.fileName);
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => {
    navigateLightbox(-1);
  });
  lightboxNext.addEventListener("click", () => {
    navigateLightbox(1);
  });
  lightboxExpand.addEventListener("click", toggleLightboxFullscreen);
  lightbox.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-lightbox")) {
      closeLightbox();
    }
  });
  document.addEventListener("fullscreenchange", updateFullscreenButton);

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) {
      return;
    }

    if (event.key === "Escape") {
      if (isLightboxFullscreen()) {
        exitLightboxFullscreen();
        return;
      }

      closeLightbox();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateLightbox(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateLightbox(1);
    }
  });

  lightboxFigure.addEventListener("touchstart", handleTouchStart, { passive: true });
  lightboxFigure.addEventListener("touchend", handleTouchEnd, { passive: true });
}

async function loadPortfolio() {
  try {
    const manifest = await fetchJson(manifestPath);
    const entries = Array.isArray(manifest.items) ? manifest.items : [];

    state.items = await Promise.all(entries.map(loadPortfolioItem));

    photoCount.textContent = String(state.items.length);
    tagCount.textContent = String(getUniqueTags(state.items).length);
    state.activeTag = getInitialTagFromQuery();

    renderTagToolbar();
    renderGallery();
  } catch (error) {
    console.error(error);
    renderError(
      "Couldn't load the photo metadata. This page needs to be served over HTTP to read the manifest and sidecar files."
    );
  }
}

async function loadPortfolioItem(entry) {
  const fileName = typeof entry === "string" ? entry : entry.fileName;
  const metadataFileName =
    typeof entry === "string" ? `${entry}.json` : entry.metadataFileName || `${fileName}.json`;
  const thumbnailFileName =
    typeof entry === "string"
      ? `thumbs/${entry}.webp`
      : normalizeAssetPath(entry.thumbnailFileName || `thumbs/${fileName}.webp`);
  const metadataPath = `${portfolioBasePath}${metadataFileName}`;
  let metadata = {};

  try {
    metadata = await fetchJson(metadataPath);
  } catch (error) {
    console.warn(`Could not load sidecar metadata for ${fileName}.`, error);
  }

  const captureDate = metadata.captureDate || inferCaptureDate(fileName);

  return {
    fileName,
    imagePath: `${portfolioBasePath}${fileName}`,
    thumbnailPath: `${portfolioBasePath}${thumbnailFileName}`,
    metadataPath,
    title: metadata.title || deriveTitle(fileName),
    description:
      metadata.description ||
      "Placeholder caption. Replace this in the image sidecar file when you are ready to add a real note.",
    tags: sanitizeTags(metadata.tags),
    captureDate,
    width: typeof entry === "object" ? entry.width || null : null,
    height: typeof entry === "object" ? entry.height || null : null,
    sortTimestamp: captureDate ? new Date(captureDate).getTime() : 0,
  };
}

function renderTagToolbar() {
  const tags = getUniqueTags(state.items);
  const buttons = [
    {
      tag: "all",
      label: "All",
    },
    ...tags.map((tag) => ({
      tag,
      label: formatTag(tag),
    })),
  ];

  tagToolbar.innerHTML = buttons
    .map(
      (button) => `
        <button
          class="tag-button${button.tag === state.activeTag ? " is-active" : ""}"
          type="button"
          data-tag="${escapeHtml(button.tag)}"
          aria-pressed="${button.tag === state.activeTag ? "true" : "false"}"
        >
          ${escapeHtml(button.label)}
        </button>
      `
    )
    .join("");
}

function renderGallery() {
  const visibleItems = getVisibleItems();

  galleryGrid.innerHTML = visibleItems
    .map(
      (item) => `
        <article class="photo-card">
          <button class="photo-trigger" type="button" data-file-name="${escapeHtml(item.fileName)}">
            <img
              class="photo-image"
              src="${escapeHtml(item.thumbnailPath || item.imagePath)}"
              alt="${escapeHtml(`${item.title} photograph`)}"
              loading="lazy"
              decoding="async"
              ${item.width ? `width="${item.width}"` : ""}
              ${item.height ? `height="${item.height}"` : ""}
            >
            <div class="card-copy">
              <p class="card-date">${escapeHtml(formatDate(item.captureDate))}</p>
              <h3 class="card-title">${escapeHtml(item.title)}</h3>
              <div class="tag-list">
                ${item.tags
                  .map((tag) => `<span class="tag-chip">${escapeHtml(formatTag(tag))}</span>`)
                  .join("")}
              </div>
            </div>
          </button>
        </article>
      `
    )
    .join("");

  const filterSummary =
    state.activeTag === "all" ? "Showing all photos." : `Tag: ${formatTag(state.activeTag)}.`;

  resultsStatus.textContent = `${visibleItems.length} photo${visibleItems.length === 1 ? "" : "s"}`;
  activeFilterCopy.textContent = `${filterSummary} ${formatSortLabel(state.activeSort)}.`;

  if (!visibleItems.length) {
    galleryGrid.innerHTML = `<p class="empty-state">No images match the current filter yet.</p>`;
  }
}

function renderError(message) {
  resultsStatus.textContent = "Unavailable";
  activeFilterCopy.textContent = message;
  galleryGrid.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function getInitialTagFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const requestedTag = normalizeTagValue(params.get("tag"));

  if (!requestedTag || requestedTag === "all") {
    return "all";
  }

  const availableTags = getUniqueTags(state.items);
  const matchedTag = availableTags.find((tag) => normalizeTagValue(tag) === requestedTag);

  if (!matchedTag) {
    syncQueryString("all");
    return "all";
  }

  syncQueryString(matchedTag);
  return matchedTag;
}

function getVisibleItems() {
  return [...state.items]
    .filter((item) => state.activeTag === "all" || item.tags.includes(state.activeTag))
    .sort((left, right) => compareItems(left, right, state.activeSort));
}

function compareItems(left, right, sortMode) {
  if (sortMode === "title") {
    return left.title.localeCompare(right.title);
  }

  if (sortMode === "oldest") {
    return compareDates(left, right, "asc");
  }

  return compareDates(left, right, "desc");
}

function compareDates(left, right, direction) {
  const leftHasDate = Boolean(left.sortTimestamp);
  const rightHasDate = Boolean(right.sortTimestamp);
  const multiplier = direction === "asc" ? 1 : -1;

  if (leftHasDate !== rightHasDate) {
    return leftHasDate ? -1 : 1;
  }

  if (left.sortTimestamp !== right.sortTimestamp) {
    return (left.sortTimestamp - right.sortTimestamp) * multiplier;
  }

  return left.title.localeCompare(right.title);
}

function getUniqueTags(items) {
  return [...new Set(items.flatMap((item) => item.tags))].sort((left, right) =>
    formatTag(left).localeCompare(formatTag(right))
  );
}

function sanitizeTags(tags) {
  if (!Array.isArray(tags) || !tags.length) {
    return ["placeholder-uncurated"];
  }

  return [...new Set(tags.map((tag) => normalizeTagValue(tag)).filter(Boolean))];
}

function openLightbox(fileName) {
  const didUpdate = updateLightbox(fileName);

  if (!didUpdate) {
    return;
  }

  lightbox.hidden = false;
  document.body.classList.add("modal-open");
}

function updateLightbox(fileName) {
  const selectedItem = state.items.find((item) => item.fileName === fileName);

  if (!selectedItem) {
    return false;
  }

  const loadToken = ++lightboxLoadToken;
  state.activeLightboxFileName = selectedItem.fileName;
  lightboxTitle.textContent = selectedItem.title;
  lightboxDate.textContent = formatDate(selectedItem.captureDate);
  lightboxDescription.textContent = selectedItem.description;
  lightboxTags.innerHTML = selectedItem.tags
    .map((tag) => `<span class="tag-chip">${escapeHtml(formatTag(tag))}</span>`)
    .join("");
  updateLightboxNavButtons();
  setLightboxLoadingState(true);

  const preloadImage = new Image();
  preloadImage.decoding = "async";
  preloadImage.onload = () => {
    if (loadToken !== lightboxLoadToken) {
      return;
    }

    lightboxImage.src = selectedItem.imagePath;
    lightboxImage.alt = `${selectedItem.title} photograph`;
    setLightboxLoadingState(false);
  };
  preloadImage.onerror = () => {
    if (loadToken !== lightboxLoadToken) {
      return;
    }

    lightboxImage.src = selectedItem.imagePath;
    lightboxImage.alt = `${selectedItem.title} photograph`;
    setLightboxLoadingState(false);
  };
  preloadImage.src = selectedItem.imagePath;
  return true;
}

function closeLightbox() {
  lightboxLoadToken += 1;
  exitLightboxFullscreen();
  lightbox.hidden = true;
  document.body.classList.remove("modal-open");
  state.activeLightboxFileName = null;
  setLightboxLoadingState(false);
}

function navigateLightbox(direction) {
  const visibleItems = getVisibleItems();
  const currentIndex = visibleItems.findIndex((item) => item.fileName === state.activeLightboxFileName);
  const nextIndex = currentIndex + direction;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= visibleItems.length) {
    return;
  }

  updateLightbox(visibleItems[nextIndex].fileName);
}

function updateLightboxNavButtons() {
  const visibleItems = getVisibleItems();
  const currentIndex = visibleItems.findIndex((item) => item.fileName === state.activeLightboxFileName);

  if (currentIndex === -1) {
    lightboxPrev.disabled = true;
    lightboxNext.disabled = true;
    return;
  }

  lightboxPrev.disabled = currentIndex === 0;
  lightboxNext.disabled = currentIndex === visibleItems.length - 1;
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function handleTouchEnd(event) {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return;
  }

  if (deltaX > 0) {
    navigateLightbox(-1);
    return;
  }

  navigateLightbox(1);
}

function setLightboxLoadingState(isLoading) {
  lightboxFigure.classList.toggle("is-loading", isLoading);
  lightboxFigure.setAttribute("aria-busy", isLoading ? "true" : "false");
  lightboxLoader.setAttribute("aria-hidden", isLoading ? "false" : "true");
}

function toggleLightboxFullscreen() {
  if (isLightboxFullscreen()) {
    exitLightboxFullscreen();
    return;
  }

  if (typeof lightboxPanel.requestFullscreen === "function") {
    lightboxPanel.requestFullscreen().catch(() => {});
  }
}

function exitLightboxFullscreen() {
  if (isLightboxFullscreen() && typeof document.exitFullscreen === "function") {
    document.exitFullscreen().catch(() => {});
  }
}

function isLightboxFullscreen() {
  return document.fullscreenElement === lightboxPanel;
}

function updateFullscreenButton() {
  const supported = typeof lightboxPanel.requestFullscreen === "function" && typeof document.exitFullscreen === "function";
  lightboxExpand.hidden = !supported;

  if (!supported) {
    return;
  }

  const fullscreen = isLightboxFullscreen();
  lightboxExpand.setAttribute("aria-label", fullscreen ? "Exit fullscreen" : "Enter fullscreen");
  lightboxExpand.setAttribute("title", fullscreen ? "Exit fullscreen" : "Enter fullscreen");
  lightboxExpandIcon.innerHTML = fullscreen ? "&#x2715;" : "&#x26F6;";
}

function formatDate(value) {
  if (!value) {
    return "Date not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatTag(tag) {
  return tag
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function normalizeTagValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeAssetPath(value) {
  return String(value || "").replaceAll("\\", "/");
}

function syncQueryString(tag = state.activeTag) {
  const url = new URL(window.location.href);

  if (!tag || tag === "all") {
    url.searchParams.delete("tag");
  } else {
    url.searchParams.set("tag", tag);
  }

  window.history.replaceState({}, "", url);
}

function formatSortLabel(sortMode) {
  switch (sortMode) {
    case "oldest":
      return "Oldest first";
    case "title":
      return "Title A-Z";
    default:
      return "Newest first";
  }
}

function inferCaptureDate(fileName) {
  const match = fileName.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);

  if (!match) {
    return "";
  }

  const [, year, month, day] = match;
  return `${year}-${month}-${day || "01"}`;
}

function deriveTitle(fileName) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const withoutDate = stem.replace(/^\d{4}-\d{2}(?:-\d{2})?[_-]?/, "");
  const normalized = withoutDate
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2");

  return normalized
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((token) => {
      if (/^\d+$/.test(token) || /^[A-Z0-9]{2,}$/.test(token)) {
        return token;
      }

      if (/[A-Z]/.test(token) && /[a-z]/.test(token)) {
        return token;
      }

      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ") || stem;
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
