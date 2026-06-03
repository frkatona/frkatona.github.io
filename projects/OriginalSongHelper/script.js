const ALL_ARTISTS = '__all__';
const PREFERENCES_STORAGE_KEY = 'originalSongHelper.preferences';
const HOTKEY_STORAGE_KEY = 'originalSongHelper.hotkeys';
const SONG_TRANSPOSE_STORAGE_KEY = 'originalSongHelper.songTranspose';
const HOTKEY_ACTIONS = {
    fontSizeIncrease: {
        label: 'Font size increase',
        defaultKey: 'a',
        run: () => updateFontSize(2)
    },
    fontSizeDecrease: {
        label: 'Font size decrease',
        defaultKey: 's',
        run: () => updateFontSize(-2)
    },
    scrollSpeedIncrease: {
        label: 'Scroll speed increase',
        defaultKey: 'z',
        run: () => updateSpeed(0.25)
    },
    scrollSpeedDecrease: {
        label: 'Scroll speed decrease',
        defaultKey: 'x',
        run: () => updateSpeed(-0.25)
    }
};
const MOBILE_CONTROL_CONFIG = {
    transpose: {
        min: -12,
        max: 12,
        step: 1,
        getValue: () => state.transpose,
        setValue: value => setTranspose(value),
        format: value => value > 0 ? `+${value}` : `${value}`
    },
    speed: {
        min: 0.5,
        max: 6,
        step: 0.5,
        getValue: () => state.scrollSpeed,
        setValue: value => setSpeed(value),
        format: value => value.toFixed(1)
    },
    font: {
        min: 10,
        max: 60,
        step: 2,
        getValue: () => state.fontSize,
        setValue: value => setFontSize(value),
        format: value => `${value}`
    }
};

// --- State ---
const state = {
    transpose: 0,
    scrollSpeed: 1.0,
    isScrolling: false,
    isAtBottom: false,
    scrollInterval: null,
    fontSize: 16,
    alignment: 'center',
    isEditMode: false,
    currentSong: null, // Track current artist-relative song path
    bpm: 0,
    tapTimes: [],
    pulseInterval: null,
    songs: [],
    selectedArtists: new Set([ALL_ARTISTS]),
    songSort: 'artist-title',
    expandedFooter: false,
    dynamicLineStart: 0.08,
    dynamicLineStop: 0.33,
    showStarterHints: false,
    hotkeys: Object.fromEntries(Object.entries(HOTKEY_ACTIONS).map(([action, config]) => [action, config.defaultKey])),
    songTranspose: {},
    initialTranspose: null
};

// --- Elements ---
const els = {
    songInput: document.getElementById('songInput'),
    songView: document.getElementById('songView'),
    headerTitle: document.getElementById('headerTitle'),
    editorPanel: document.getElementById('editorPanel'),
    appMain: document.getElementById('appMain'),
    editToggleBtn: document.getElementById('editToggleBtn'),
    transDown: document.getElementById('transDown'),
    transUp: document.getElementById('transUp'),
    transValue: document.getElementById('transValue'),
    speedDown: document.getElementById('speedDown'),
    speedUp: document.getElementById('speedUp'),
    speedValue: document.getElementById('speedValue'),
    playBtn: document.getElementById('playBtn'),
    mobileControlsBtn: document.getElementById('mobileControlsBtn'),
    mobileControlOverlay: document.getElementById('mobileControlOverlay'),
    mobileControlPanel: document.getElementById('mobileControlPanel'),
    mobileControlClose: document.getElementById('mobileControlClose'),
    mobileTransposeValue: document.getElementById('mobileTransposeValue'),
    mobileSpeedValue: document.getElementById('mobileSpeedValue'),
    mobileFontValue: document.getElementById('mobileFontValue'),
    menuBtn: document.getElementById('menuBtn'),
    hotkeyBtn: document.getElementById('hotkeyBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    hotkeyModal: document.getElementById('hotkeyModal'),
    hotkeyStatus: document.getElementById('hotkeyStatus'),
    songListBtn: document.getElementById('songListBtn'),
    mobileSongListBtn: document.getElementById('mobileSongListBtn'),
    songListModal: document.getElementById('songListModal'),
    menuModal: document.getElementById('menuModal'),
    songSortSelect: document.getElementById('songSortSelect'),
    artistFilterContainer: document.getElementById('artistFilterContainer'),
    songListContainer: document.getElementById('songListContainer'),
    fontDown: document.getElementById('fontDown'),
    fontUp: document.getElementById('fontUp'),
    fontValue: document.getElementById('fontValue'),
    alignToggle: document.getElementById('alignToggle'),
    footerLayoutToggle: document.getElementById('footerLayoutToggle'),
    dynamicLineStartInput: document.getElementById('dynamicLineStartInput'),
    dynamicLineStopInput: document.getElementById('dynamicLineStopInput'),
    dynamicLineRangeValue: document.getElementById('dynamicLineRangeValue'),
    downloadBtn: document.getElementById('downloadBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    fileInput: document.getElementById('fileInput'),
    importMenuBtn: document.getElementById('importMenuBtn'),
    importModal: document.getElementById('importModal'),
    importUrlInput: document.getElementById('importUrlInput'),
    doImportBtn: document.getElementById('doImportBtn'),
    doImportBtn: document.getElementById('doImportBtn'),
    importStatus: document.getElementById('importStatus'),
    tapBtn: document.getElementById('tapBtn'),
    resetBpmBtn: document.getElementById('resetBpmBtn'),
    bpmDisplay: document.getElementById('bpmDisplay')
};

// --- Initialization ---
function init() {
    syncVisualViewport();

    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const songParam = params.get('song');
    const speedParam = params.get('speed');
    const transParam = params.get('transpose');
    state.showStarterHints = !songParam && !speedParam && !transParam;

    loadPreferences();
    loadHotkeys();
    loadSongTranspose();

    if (speedParam) {
        const parsedSpeed = parseFloat(speedParam);
        if (Number.isFinite(parsedSpeed)) {
            state.scrollSpeed = clamp(parsedSpeed, 0.5, 10);
        }
    }

    if (transParam) {
        const parsedTranspose = parseInt(transParam, 10);
        if (Number.isFinite(parsedTranspose)) {
            state.initialTranspose = Math.round(clamp(parsedTranspose, -12, 12));
        }
    }

    els.speedValue.textContent = state.scrollSpeed.toFixed(1);
    renderHotkeyInputs();
    updateUI();
    updateTransposeDisplay();
    loadSongList(songParam);
}

function syncVisualViewport() {
    const viewport = window.visualViewport;
    const offsetTop = viewport ? Math.max(0, viewport.offsetTop) : 0;
    const visibleHeight = viewport ? viewport.height : window.innerHeight;
    const bottomInset = Math.max(0, window.innerHeight - visibleHeight - offsetTop);

    document.documentElement.style.setProperty('--visual-viewport-top', `${offsetTop}px`);
    document.documentElement.style.setProperty('--visual-viewport-bottom', `${bottomInset}px`);
}

window.addEventListener('resize', syncVisualViewport, { passive: true });
window.addEventListener('orientationchange', syncVisualViewport, { passive: true });
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncVisualViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', syncVisualViewport, { passive: true });
}

// --- Event Listeners ---
els.songInput.addEventListener('input', renderSong);
els.songView.addEventListener('scroll', handleSongViewScroll, { passive: true });

els.editToggleBtn.addEventListener('click', () => {
    dismissStarterHints();
    state.isEditMode = !state.isEditMode;
    els.editorPanel.classList.toggle('hidden', !state.isEditMode);
    els.editToggleBtn.classList.toggle('active', state.isEditMode);
    els.appMain.classList.toggle('split-view', state.isEditMode);
});

// Transpose
els.transDown.addEventListener('click', () => updateTranspose(-1));
els.transUp.addEventListener('click', () => updateTranspose(1));

// Speed
els.speedDown.addEventListener('click', () => updateSpeed(-0.25));
els.speedUp.addEventListener('click', () => updateSpeed(0.25));

// Play/Pause
els.playBtn.addEventListener('click', toggleScroll);

// Mobile Controls
els.mobileControlsBtn.addEventListener('click', toggleMobileControls);
els.mobileControlClose.addEventListener('click', closeMobileControls);
els.mobileControlOverlay.addEventListener('click', (e) => {
    if (e.target === els.mobileControlOverlay) closeMobileControls();
});
document.querySelectorAll('.mobile-control-lane').forEach(lane => {
    lane.addEventListener('pointerdown', handleMobileControlPointerDown);
    lane.addEventListener('pointermove', handleMobileControlPointerMove);
    lane.addEventListener('pointerup', handleMobileControlPointerEnd);
    lane.addEventListener('pointercancel', handleMobileControlPointerEnd);
});

// Menu & Modals
els.menuBtn.addEventListener('click', () => openModal(els.menuModal));
els.hotkeyBtn.addEventListener('click', () => openModal(els.hotkeyModal));
els.fullscreenBtn.addEventListener('click', toggleFullscreen);
function openSongListModal() {
    dismissStarterHints();
    openModal(els.songListModal);
}
els.songListBtn.addEventListener('click', openSongListModal);
els.mobileSongListBtn.addEventListener('click', openSongListModal);
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', closeModalOnBackdropClick);
});
els.songSortSelect.addEventListener('change', () => {
    state.songSort = els.songSortSelect.value;
    renderSongList();
});
els.artistFilterContainer.addEventListener('click', handleArtistFilterClick);
document.querySelectorAll('.hotkey-input').forEach(input => {
    input.addEventListener('keydown', handleHotkeyInputKeydown);
    input.addEventListener('focus', () => {
        els.hotkeyStatus.textContent = 'Press a key to assign it. Backspace clears the selected shortcut.';
    });
});

// Font
els.fontDown.addEventListener('click', () => updateFontSize(-2));
els.fontUp.addEventListener('click', () => updateFontSize(2));

// Alignment
els.alignToggle.addEventListener('click', () => {
    state.alignment = state.alignment === 'center' ? 'left' : 'center';
    updateUI();
    savePreferences();
});

els.footerLayoutToggle.addEventListener('click', () => {
    state.expandedFooter = !state.expandedFooter;
    closeMobileControls();
    updateUI();
    savePreferences();
});
els.dynamicLineStartInput.addEventListener('input', handleDynamicLineRangeInput);
els.dynamicLineStopInput.addEventListener('input', handleDynamicLineRangeInput);

// File Ops
els.downloadBtn.addEventListener('click', downloadSong);
els.uploadBtn.addEventListener('click', () => els.fileInput.click());
els.fileInput.addEventListener('change', handleFileUpload);

// Import
els.importMenuBtn.addEventListener('click', () => { closeModals(); openModal(els.importModal); });
els.doImportBtn.addEventListener('click', importFromUG);

// Tempo Tapper
els.tapBtn.addEventListener('click', tapTempo);
els.resetBpmBtn.addEventListener('click', resetBpm);

// Global Keys
document.addEventListener('keydown', handleGlobalKeydown);
document.addEventListener('fullscreenchange', updateFullscreenUI);

// --- Core Logic ---

function renderSong() {
    const text = els.songInput.value;
    const lines = text.split('\n');
    let html = '';

    // Title (first line)
    if (lines.length > 0) {
        const title = lines[0].trim();
        els.headerTitle.textContent = title || 'Untitled Song';
        lines.shift();
    }

    // Metadata Parsing
    const metadataItems = [];
    while (lines.length > 0) {
        const line = lines[0].trim();
        // Check for "key: value" format
        const match = line.match(/^([a-zA-Z]+):\s*(.+)$/);
        if (match) {
            const key = match[1].toLowerCase();
            const value = match[2].trim();
            if (isMeaningfulMetadataValue(value)) {
                metadataItems.push(`<span style="margin: 0 10px;">${escapeHtml(key.toUpperCase())}: ${escapeHtml(value)}</span>`);
            }
            lines.shift();
        } else if (line === '') {
            lines.shift(); // Skip empty lines between title/metadata and song
        } else {
            break; // Stop at first non-metadata line
        }
    }

    if (metadataItems.length > 0) {
        html += `<div class="song-metadata" style="color: #888; font-size: 0.9em; margin-bottom: 1rem;">${metadataItems.join('')}</div>`;
    }

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            html += '<br>';
            return;
        }

        const bracketSection = getBracketSectionHeader(trimmed);
        if (bracketSection) {
            html += `<div class="section-header">${escapeHtml(bracketSection)}</div>`;
            return;
        }

        // Section Header (ends with :)
        if (/^(\w+[\s\w]*):$/.test(trimmed)) {
            html += `<div class="section-header">${escapeHtml(trimmed)}</div>`;
            return;
        }

        // Lyric/Chord Line
        const processed = processLine(line);
        const lineClasses = ['song-line'];
        if (processed.hasChords) lineClasses.push('has-chords');
        if (!processed.hasLyrics) lineClasses.push('chord-only');
        if (processed.dynamics.length > 0) lineClasses.push('has-dynamics');

        const dynamicHtml = processed.dynamics.length > 0
            ? `<span class="dynamic-marker">${processed.dynamics.map(escapeHtml).join(' ')}</span>`
            : '';
        html += `<div class="${lineClasses.join(' ')}">${dynamicHtml}<span class="song-line-content">${processed.html}</span></div>`;
    });

    els.songView.innerHTML = html;
    applyTranspose(); // Re-apply current transpose
    updateSongBottomState();
}

function processLine(line) {
    const dynamicResult = extractDynamicMarkers(line);
    line = dynamicResult.line;

    const chordRegex = /\[([^\]]+)\]/g;
    const matches = [...line.matchAll(chordRegex)];
    const cleanLine = line.replace(chordRegex, '');

    if (matches.length === 0) {
        return {
            html: `<span class="lyric-text">${escapeHtml(line)}</span>`,
            hasChords: false,
            hasLyrics: line.trim().length > 0,
            dynamics: dynamicResult.dynamics
        };
    }

    let html = '';
    let cursor = 0;

    matches.forEach((match, index) => {
        const chord = match[1].trim();
        const chordStart = match.index;
        const lyricStart = chordStart + match[0].length;
        const nextChordStart = matches[index + 1] ? matches[index + 1].index : line.length;

        appendLyricText(line.slice(cursor, chordStart));

        const lyricSegment = line.slice(lyricStart, nextChordStart);
        const anchorParts = splitChordAnchorText(lyricSegment);
        const preserveLeadingSpace = html.length > 0;

        if (preserveLeadingSpace) {
            appendLyricText(anchorParts.leading);
        }

        html += renderChordAnchor(chord, anchorParts.anchor);
        appendLyricText(anchorParts.tail);
        cursor = nextChordStart;
    });

    appendLyricText(line.slice(cursor));

    return {
        html,
        hasChords: true,
        hasLyrics: cleanLine.trim().length > 0,
        dynamics: dynamicResult.dynamics
    };

    function appendLyricText(text) {
        if (!text) return;
        html += `<span class="lyric-text">${escapeHtml(text)}</span>`;
    }
}

function extractDynamicMarkers(line) {
    const dynamics = [];
    const strippedLine = line.replace(/\{([^{}]+)\}/g, (_, dynamicText) => {
        const value = dynamicText.trim();
        if (value) dynamics.push(value);
        return '';
    });

    return {
        dynamics,
        line: dynamics.length > 0 ? strippedLine.replace(/^\s+/, '') : strippedLine
    };
}

function splitChordAnchorText(text) {
    const leading = text.match(/^\s*/)[0];
    const rest = text.slice(leading.length);

    if (!rest) {
        return { leading, anchor: '', tail: '' };
    }

    const anchor = rest.match(/^\S+/)[0];
    return {
        leading,
        anchor,
        tail: rest.slice(anchor.length)
    };
}

function renderChordAnchor(chord, lyricAnchor) {
    const chordClass = lyricAnchor ? 'chord-anchor' : 'chord-anchor chord-anchor-empty';
    const lyricHtml = lyricAnchor
        ? escapeHtml(lyricAnchor)
        : '<span class="chord-lyric-spacer" aria-hidden="true">&nbsp;</span>';

    return `<span class="${chordClass}"><span class="chord-root" data-root="${escapeHtml(chord)}">${escapeHtml(chord)}</span><span class="chord-lyric">${lyricHtml}</span></span>`;
}

function getBracketSectionHeader(line) {
    const match = line.match(/^\[([^\]]+)\]$/);
    if (!match) return '';

    const label = match[1].trim();
    return containsChordSymbol(label) ? '' : label;
}

function updateTranspose(amount) {
    setTranspose(state.transpose + amount);
}

function setTranspose(value) {
    state.transpose = Math.round(clamp(value, -12, 12));
    updateTransposeDisplay();
    saveCurrentSongTranspose();
    applyTranspose();
    updateURLState();
    updateMobileControlUI();
}

function updateTransposeDisplay() {
    els.transValue.textContent = formatTranspose(state.transpose);
}

function applyTranspose() {
    // Find all chord roots and update text
    const roots = document.querySelectorAll('.chord-root');
    roots.forEach(el => {
        const original = el.getAttribute('data-root');
        if (original) {
            el.textContent = transposeChord(original, state.transpose);
        }
    });
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHORD_SYMBOL_SOURCE = '[A-G](?:#|b)?(?:(?:maj|min|dim|aug|sus|add|m|M)\\d*)?(?:\\d+)?(?:[#b]\\d+)*(?:\\/[A-G](?:#|b)?)?';
const CHORD_SYMBOL_REGEX = new RegExp(`(^|[^A-Za-z])(${CHORD_SYMBOL_SOURCE})(?![A-Za-z])`, 'g');

function containsChordSymbol(text) {
    return new RegExp(`(^|[^A-Za-z])(${CHORD_SYMBOL_SOURCE})(?![A-Za-z])`).test(text);
}

function transposeChord(chord, semitones) {
    if (semitones === 0) return chord;

    return chord.replace(CHORD_SYMBOL_REGEX, (match, prefix, token) => {
        return prefix + transposeChordToken(token, semitones);
    });
}

function transposeChordToken(token, semitones) {
    const match = token.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return token;

    const root = transposeRoot(match[1], semitones);
    const suffix = match[2].replace(/\/([A-G][#b]?)/g, (_, bassRoot) => `/${transposeRoot(bassRoot, semitones)}`);

    return root + suffix;
}

function transposeRoot(root, semitones) {
    // Normalize flats to sharps for simplicity
    const flatMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    if (flatMap[root]) root = flatMap[root];

    let idx = NOTES.indexOf(root);
    if (idx === -1) return root;

    let newIdx = (idx + semitones) % 12;
    if (newIdx < 0) newIdx += 12;

    return NOTES[newIdx];
}

function updateSpeed(amount) {
    setSpeed(state.scrollSpeed + amount);
}

function setSpeed(value) {
    state.scrollSpeed = clamp(Number(value), 0.5, 10);
    els.speedValue.textContent = state.scrollSpeed.toFixed(1);
    savePreferences();
    if (state.isScrolling) {
        clearInterval(state.scrollInterval);
        state.scrollInterval = setInterval(stepAutoScroll, 50 / state.scrollSpeed);
    }
    updateURLState();
    updateMobileControlUI();
}

function updateFontSize(amount) {
    setFontSize(state.fontSize + amount);
}

function setFontSize(value) {
    state.fontSize = clamp(Math.round(value), 10, 60);
    updateUI();
    savePreferences();
}

function toggleScroll() {
    if (state.isAtBottom) {
        returnSongToTop();
        return;
    }

    if (state.isScrolling) {
        pauseAutoScroll();
    } else {
        startAutoScroll();
    }
}

function startAutoScroll() {
    if (isSongViewAtBottom()) {
        updateSongBottomState();
        return;
    }

    clearInterval(state.scrollInterval);
    state.scrollInterval = setInterval(stepAutoScroll, 50 / state.scrollSpeed);
    state.isScrolling = true;
    updatePlayButtonUI();
}

function pauseAutoScroll() {
    clearInterval(state.scrollInterval);
    state.scrollInterval = null;
    state.isScrolling = false;
    updatePlayButtonUI();
}

function stepAutoScroll() {
    els.songView.scrollTop += 1;

    if (isSongViewAtBottom()) {
        updateSongBottomState();
        pauseAutoScroll();
    }
}

function returnSongToTop() {
    pauseAutoScroll();
    els.songView.scrollTop = 0;
    updateSongBottomState();
}

function handleSongViewScroll() {
    updateSongBottomState();

    if (state.isScrolling && state.isAtBottom) {
        pauseAutoScroll();
    }
}

function updateSongBottomState() {
    const wasAtBottom = state.isAtBottom;
    state.isAtBottom = isSongViewAtBottom();

    if (wasAtBottom !== state.isAtBottom || state.isAtBottom) {
        updatePlayButtonUI();
    }
}

function isSongViewAtBottom() {
    const threshold = 2;
    const hasScrollableContent = els.songView.scrollHeight > els.songView.clientHeight + threshold;
    if (!hasScrollableContent) return false;

    return els.songView.scrollHeight - els.songView.clientHeight - els.songView.scrollTop <= threshold;
}

function updatePlayButtonUI() {
    els.playBtn.classList.toggle('playing', state.isScrolling);
    els.playBtn.classList.toggle('return-top', state.isAtBottom);

    if (state.isAtBottom) {
        els.playBtn.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
        els.playBtn.setAttribute('aria-label', 'Return to top');
        els.playBtn.title = 'Return to top';
        els.playBtn.classList.remove('pulsing');
        return;
    }

    els.playBtn.textContent = state.isScrolling ? '❚❚' : '▶';
    els.playBtn.setAttribute('aria-label', state.isScrolling ? 'Pause auto-scroll' : 'Start auto-scroll');
    els.playBtn.title = state.isScrolling ? 'Pause auto-scroll' : 'Start auto-scroll';

    if (state.isScrolling && state.bpm > 0) {
        els.playBtn.classList.add('pulsing');
        const duration = 60 / state.bpm;
        els.playBtn.style.setProperty('--pulse-duration', `${duration}s`);
    } else {
        els.playBtn.classList.remove('pulsing');
    }
}

function updateUI() {
    els.songView.style.fontSize = `${state.fontSize}px`;
    els.songView.style.textAlign = state.alignment;
    els.fontValue.textContent = state.fontSize;
    els.alignToggle.dataset.alignment = state.alignment;
    els.alignToggle.setAttribute('aria-pressed', state.alignment === 'center' ? 'true' : 'false');
    document.body.classList.toggle('expanded-footer', state.expandedFooter);
    els.footerLayoutToggle.dataset.footerLayout = state.expandedFooter ? 'expanded' : 'compact';
    els.footerLayoutToggle.setAttribute('aria-pressed', state.expandedFooter ? 'true' : 'false');
    updateDynamicLineControls();
    updateMobileControlUI();
    updateSongBottomState();
}

function handleDynamicLineRangeInput(e) {
    const minGap = 0.01;
    const startInput = Number(els.dynamicLineStartInput.value) / 100;
    const stopInput = Number(els.dynamicLineStopInput.value) / 100;

    if (e.target === els.dynamicLineStartInput) {
        state.dynamicLineStart = clamp(startInput, 0, state.dynamicLineStop - minGap);
    } else {
        state.dynamicLineStop = clamp(stopInput, state.dynamicLineStart + minGap, 1);
    }

    updateDynamicLineControls();
    savePreferences();
}

function updateDynamicLineControls() {
    const minGap = 0.01;
    if (!Number.isFinite(Number(state.dynamicLineStart))) state.dynamicLineStart = 0.08;
    if (!Number.isFinite(Number(state.dynamicLineStop))) state.dynamicLineStop = 0.33;
    state.dynamicLineStart = clamp(Number(state.dynamicLineStart), 0, 1 - minGap);
    state.dynamicLineStop = clamp(Number(state.dynamicLineStop), state.dynamicLineStart + minGap, 1);

    const startPercent = Math.round(state.dynamicLineStart * 100);
    const stopPercent = Math.round(state.dynamicLineStop * 100);
    els.dynamicLineStartInput.value = startPercent;
    els.dynamicLineStopInput.value = stopPercent;
    els.dynamicLineRangeValue.textContent = `${startPercent}% - ${stopPercent}%`;
    document.documentElement.style.setProperty('--dynamic-line-start', `${state.dynamicLineStart * 100}vw`);
    document.documentElement.style.setProperty('--dynamic-line-stop', `${state.dynamicLineStop * 100}vw`);

    const track = document.querySelector('.dual-range-track');
    if (track) {
        track.style.background = `linear-gradient(90deg, #262626 0%, #262626 ${startPercent}%, rgba(192, 132, 252, 0.48) ${startPercent}%, rgba(192, 132, 252, 0.48) ${stopPercent}%, #262626 ${stopPercent}%, #262626 100%)`;
    }
}

// --- Helpers ---
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isMeaningfulMetadataValue(value) {
    return value.trim() !== '' && value.trim() !== '?';
}

function loadPreferences() {
    try {
        const stored = getStoredJson(PREFERENCES_STORAGE_KEY, {});
        if (Number.isFinite(stored.fontSize)) {
            state.fontSize = clamp(Math.round(stored.fontSize), 10, 60);
        }
        if (stored.alignment === 'left' || stored.alignment === 'center') {
            state.alignment = stored.alignment;
        }
        state.expandedFooter = stored.expandedFooter === true;
        if (Number.isFinite(stored.dynamicLineStart)) {
            state.dynamicLineStart = clamp(Number(stored.dynamicLineStart), 0, 0.99);
        }
        if (Number.isFinite(stored.dynamicLineStop)) {
            state.dynamicLineStop = clamp(Number(stored.dynamicLineStop), state.dynamicLineStart + 0.01, 1);
        }
        if (Number.isFinite(stored.scrollSpeed)) {
            state.scrollSpeed = clamp(Number(stored.scrollSpeed), 0.5, 10);
            els.speedValue.textContent = state.scrollSpeed.toFixed(1);
        }
    } catch (error) {
        console.warn('Preferences could not be loaded.', error);
    }
}

function savePreferences() {
    setStoredJson(PREFERENCES_STORAGE_KEY, {
        fontSize: state.fontSize,
        alignment: state.alignment,
        expandedFooter: state.expandedFooter,
        dynamicLineStart: state.dynamicLineStart,
        dynamicLineStop: state.dynamicLineStop,
        scrollSpeed: state.scrollSpeed
    }, 'Preferences could not be saved.');
}

function loadSongTranspose() {
    try {
        const stored = getStoredJson(SONG_TRANSPOSE_STORAGE_KEY, {});
        state.songTranspose = typeof stored === 'object' && stored ? stored : {};
    } catch (error) {
        console.warn('Song transpose settings could not be loaded.', error);
    }
}

function saveCurrentSongTranspose() {
    if (!state.currentSong) return;

    if (state.transpose === 0) {
        delete state.songTranspose[state.currentSong];
    } else {
        state.songTranspose[state.currentSong] = state.transpose;
    }

    setStoredJson(SONG_TRANSPOSE_STORAGE_KEY, state.songTranspose, 'Song transpose settings could not be saved.');
}

function getStoredSongTranspose(songPath) {
    const stored = state.songTranspose[songPath];
    return Number.isFinite(stored) ? Math.round(clamp(stored, -12, 12)) : 0;
}

function getStoredJson(key, fallback) {
    if (!window.localStorage) return fallback;
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
}

function setStoredJson(key, value, warning) {
    try {
        if (window.localStorage) {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    } catch (error) {
        console.warn(warning, error);
    }
}

function openModal(modal) {
    modal.classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}
window.closeModals = closeModals; // Expose to HTML

function closeModalOnBackdropClick(e) {
    if (e.button === 0 && e.target === e.currentTarget) {
        e.currentTarget.classList.remove('active');
    }
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
    }

    if (document.body.classList.contains('app-fullscreen')) {
        setFallbackFullscreen(false);
        return;
    }

    const target = document.documentElement;
    if (target.requestFullscreen) {
        target.requestFullscreen().catch(error => {
            console.warn('Fullscreen could not be enabled.', error);
            setFallbackFullscreen(true);
        });
    } else {
        setFallbackFullscreen(!document.body.classList.contains('app-fullscreen'));
    }
}

function updateFullscreenUI() {
    const isFullscreen = Boolean(document.fullscreenElement);
    document.body.classList.toggle('app-fullscreen', isFullscreen);
    els.fullscreenBtn.classList.toggle('active', isFullscreen);
    els.fullscreenBtn.textContent = isFullscreen ? '⇱' : '⛶';
    els.fullscreenBtn.title = isFullscreen ? 'Exit fullscreen' : 'Toggle fullscreen';
}

function setFallbackFullscreen(isFullscreen) {
    document.body.classList.toggle('app-fullscreen', isFullscreen);
    els.fullscreenBtn.classList.toggle('active', isFullscreen);
    els.fullscreenBtn.textContent = isFullscreen ? '⇱' : '⛶';
    els.fullscreenBtn.title = isFullscreen ? 'Exit fullscreen' : 'Toggle fullscreen';
}

function toggleMobileControls() {
    if (els.mobileControlOverlay.classList.contains('active')) {
        closeMobileControls();
    } else {
        openMobileControls();
    }
}

function openMobileControls() {
    els.mobileControlOverlay.classList.add('active');
    els.mobileControlOverlay.setAttribute('aria-hidden', 'false');
    els.mobileControlsBtn.classList.add('active');
    updateMobileControlUI();
}

function closeMobileControls() {
    els.mobileControlOverlay.classList.remove('active');
    els.mobileControlOverlay.setAttribute('aria-hidden', 'true');
    els.mobileControlsBtn.classList.remove('active');
    document.querySelectorAll('.mobile-control-lane').forEach(lane => lane.classList.remove('dragging'));
}

function handleMobileControlPointerDown(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragging');
    if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
    }
    updateMobileControlFromPointer(e);
}

function handleMobileControlPointerMove(e) {
    if (!e.currentTarget.classList.contains('dragging')) return;
    e.preventDefault();
    updateMobileControlFromPointer(e);
}

function handleMobileControlPointerEnd(e) {
    e.currentTarget.classList.remove('dragging');
    if (e.currentTarget.releasePointerCapture) {
        e.currentTarget.releasePointerCapture(e.pointerId);
    }
}

function updateMobileControlFromPointer(e) {
    const control = e.currentTarget.dataset.mobileControl;
    const config = MOBILE_CONTROL_CONFIG[control];
    if (!config) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = rect.width ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0;
    const rawValue = config.min + percent * (config.max - config.min);
    const steppedValue = quantize(rawValue, config.step, config.min);

    config.setValue(clamp(steppedValue, config.min, config.max));
}

function updateMobileControlUI() {
    document.querySelectorAll('.mobile-control-lane').forEach(lane => {
        const control = lane.dataset.mobileControl;
        const config = MOBILE_CONTROL_CONFIG[control];
        if (!config) return;

        const value = clamp(config.getValue(), config.min, config.max);
        const percent = ((value - config.min) / (config.max - config.min)) * 100;
        lane.style.setProperty('--mobile-control-level', `${percent}%`);
    });

    els.mobileTransposeValue.textContent = formatTranspose(state.transpose);
    els.mobileSpeedValue.textContent = state.scrollSpeed.toFixed(1);
    els.mobileFontValue.textContent = state.fontSize;
}

function formatTranspose(value) {
    return value > 0 ? `+${value}` : `${value}`;
}

function quantize(value, step, min = 0) {
    return min + Math.round((value - min) / step) * step;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function loadHotkeys() {
    try {
        const stored = getStoredJson(HOTKEY_STORAGE_KEY, {});
        Object.keys(HOTKEY_ACTIONS).forEach(action => {
            if (typeof stored[action] === 'string') {
                state.hotkeys[action] = stored[action];
            }
        });
    } catch (error) {
        console.warn('Hotkey settings could not be loaded.', error);
    }
}

function saveHotkeys() {
    setStoredJson(HOTKEY_STORAGE_KEY, state.hotkeys, 'Hotkey settings could not be saved.');
}

function renderHotkeyInputs() {
    document.querySelectorAll('.hotkey-input').forEach(input => {
        const action = input.dataset.hotkeyAction;
        input.value = formatShortcutKey(state.hotkeys[action]);
        input.setAttribute('aria-label', `${HOTKEY_ACTIONS[action].label} hotkey`);
    });
}

function handleHotkeyInputKeydown(e) {
    e.preventDefault();

    const action = e.target.dataset.hotkeyAction;
    if (!HOTKEY_ACTIONS[action]) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
        state.hotkeys[action] = '';
        saveHotkeys();
        renderHotkeyInputs();
        els.hotkeyStatus.textContent = `${HOTKEY_ACTIONS[action].label} hotkey cleared.`;
        return;
    }

    const key = normalizeShortcutKey(e);
    if (!key) {
        els.hotkeyStatus.textContent = 'Choose a letter, number, punctuation key, or named key.';
        return;
    }

    Object.keys(state.hotkeys).forEach(existingAction => {
        if (existingAction !== action && state.hotkeys[existingAction] === key) {
            state.hotkeys[existingAction] = '';
        }
    });

    state.hotkeys[action] = key;
    saveHotkeys();
    renderHotkeyInputs();
    els.hotkeyStatus.textContent = `${HOTKEY_ACTIONS[action].label} set to ${formatShortcutKey(key)}.`;
}

function handleGlobalKeydown(e) {
    if (shouldIgnoreHotkeys(e)) return;

    if (e.code === 'Space') {
        e.preventDefault();
        toggleScroll();
        return;
    }

    if (e.code === 'ArrowUp') {
        e.preventDefault();
        els.songView.scrollTop -= 50;
        return;
    }

    if (e.code === 'ArrowDown') {
        e.preventDefault();
        els.songView.scrollTop += 50;
        return;
    }

    const key = normalizeShortcutKey(e);
    const action = Object.keys(state.hotkeys).find(actionName => state.hotkeys[actionName] === key);
    if (!action) return;

    e.preventDefault();
    HOTKEY_ACTIONS[action].run();
}

function shouldIgnoreHotkeys(e) {
    if (state.isEditMode) return true;
    if (!e.target) return false;

    const tagName = e.target.tagName;
    return e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
}

function normalizeShortcutKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return '';
    const key = e.key === ' ' ? 'space' : e.key.toLowerCase();
    if (['shift', 'control', 'alt', 'meta', 'tab', 'escape'].includes(key)) return '';
    return key;
}

function formatShortcutKey(key) {
    if (!key) return '';
    const names = {
        space: 'Space',
        arrowup: 'Arrow Up',
        arrowdown: 'Arrow Down',
        arrowleft: 'Arrow Left',
        arrowright: 'Arrow Right'
    };
    return names[key] || (key.length === 1 ? key.toUpperCase() : key);
}

function showStarterHints() {
    if (state.showStarterHints) {
        document.body.classList.add('show-starter-hints');
    }
}

function dismissStarterHints() {
    if (!state.showStarterHints) return;
    state.showStarterHints = false;
    document.body.classList.remove('show-starter-hints');
}

function loadSongList(initialSong = null) {
    els.songListContainer.innerHTML = '<div class="song-list-empty">Loading songs...</div>';

    fetch('songs/index.json')
        .then(r => {
            if (!r.ok) throw new Error('Song index could not be loaded.');
            return r.json();
        })
        .then(songs => {
            state.songs = songs.map(normalizeSongEntry).filter(Boolean);
            renderArtistFilters();
            renderSongList();

            if (initialSong) {
                return loadSongFile(initialSong).catch(() => loadDefaultSong());
            } else if (!els.songInput.value.trim()) {
                loadDefaultSong();
            } else {
                renderSong();
            }
        })
        .catch(error => {
            console.error(error);
            els.songListContainer.innerHTML = '<div class="song-list-empty">No songs found or index.json missing.</div>';

            if (initialSong) {
                loadSongFile(initialSong).catch(() => loadDefaultSong());
            } else if (!els.songInput.value.trim()) {
                loadDefaultSong();
            }
        });
}

function normalizeSongEntry(entry) {
    const rawPath = typeof entry === 'string' ? entry : entry.path || entry.file || entry.filename;
    if (!rawPath || !/\.txt$/i.test(rawPath)) return null;

    const path = normalizeSongPath(rawPath);
    const parts = path.split('/');
    const fileName = parts.pop();
    const artist = typeof entry === 'object' && entry.artist ? entry.artist : parts[0] || 'Unknown Artist';
    const title = typeof entry === 'object' && entry.title ? entry.title : fileName.replace(/\.txt$/i, '');

    return { path, fileName, artist, title };
}

function normalizeSongPath(path) {
    return path.replace(/\\/g, '/').replace(/^songs\//, '').replace(/^\/+/, '');
}

function renderArtistFilters() {
    const artists = [...new Set(state.songs.map(song => song.artist))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    els.artistFilterContainer.innerHTML = '';
    els.artistFilterContainer.appendChild(createArtistFilterPill(ALL_ARTISTS, 'All', state.selectedArtists.has(ALL_ARTISTS)));

    artists.forEach(artist => {
        const checked = !state.selectedArtists.has(ALL_ARTISTS) && state.selectedArtists.has(artist);
        els.artistFilterContainer.appendChild(createArtistFilterPill(artist, artist, checked));
    });
}

function createArtistFilterPill(value, label, selected) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'artist-filter-pill';
    button.dataset.artistFilter = value;
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    button.textContent = label;
    return button;
}

function handleArtistFilterClick(e) {
    const button = e.target.closest('.artist-filter-pill');
    if (!button) return;

    const value = button.dataset.artistFilter;
    const isSelected = button.getAttribute('aria-pressed') === 'true';

    toggleArtistFilter(value, isSelected);

    renderArtistFilters();
    renderSongList();
}

function toggleArtistFilter(value, isSelected) {
    if (value === ALL_ARTISTS) {
        state.selectedArtists = new Set([ALL_ARTISTS]);
        return;
    }

    state.selectedArtists.delete(ALL_ARTISTS);

    if (isSelected) {
        state.selectedArtists.delete(value);
    } else {
        state.selectedArtists.add(value);
    }

    if (state.selectedArtists.size === 0) {
        state.selectedArtists.add(ALL_ARTISTS);
    }
}

function renderSongList() {
    const showAll = state.selectedArtists.has(ALL_ARTISTS);
    const visibleSongs = showAll
        ? state.songs
        : state.songs.filter(song => state.selectedArtists.has(song.artist));
    const sortedSongs = sortSongs(visibleSongs);

    els.songListContainer.innerHTML = '';

    if (sortedSongs.length === 0) {
        els.songListContainer.innerHTML = '<div class="song-list-empty">No songs match the selected artists.</div>';
        return;
    }

    sortedSongs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-list-item';
        if (state.currentSong === song.path) {
            div.classList.add('selected');
            div.setAttribute('aria-current', 'true');
        }

        const title = document.createElement('span');
        title.className = 'song-list-title';
        title.textContent = song.title;

        const artist = document.createElement('span');
        artist.className = 'song-list-artist';
        artist.textContent = song.artist;

        div.append(title, artist);
        div.onclick = () => {
            if (state.isScrolling) toggleScroll();
            loadSongFile(song.path);
            closeModals();
        };
        els.songListContainer.appendChild(div);
    });
}

function sortSongs(songs) {
    const sorted = [...songs];
    const compareTitle = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    const compareArtist = (a, b) => a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });

    switch (state.songSort) {
        case 'title-asc':
            return sorted.sort((a, b) => compareTitle(a, b) || compareArtist(a, b));
        case 'title-desc':
            return sorted.sort((a, b) => compareTitle(b, a) || compareArtist(a, b));
        case 'artist-desc':
            return sorted.sort((a, b) => compareArtist(b, a) || compareTitle(a, b));
        case 'artist-title':
        default:
            return sorted.sort((a, b) => compareArtist(a, b) || compareTitle(a, b));
    }
}

function resolveSongPath(songPath) {
    const normalized = normalizeSongPath(songPath);
    const exactMatch = state.songs.find(song => song.path.toLowerCase() === normalized.toLowerCase());
    if (exactMatch) return exactMatch.path;

    const fileName = normalized.split('/').pop().toLowerCase();
    const fileNameMatches = state.songs.filter(song => song.fileName.toLowerCase() === fileName);

    return fileNameMatches.length === 1 ? fileNameMatches[0].path : normalized;
}

function loadSongFile(filename) {
    const songPath = resolveSongPath(filename);

    return fetch('songs/' + encodeURI(songPath))
        .then(r => {
            if (!r.ok) throw new Error(`Song file could not be loaded: ${songPath}`);
            return r.text();
        })
        .then(text => {
            els.songInput.value = text;
            state.currentSong = songPath;
            applySongTransposePreference(songPath);
            renderSong();
            els.songView.scrollTop = 0;
            updateSongBottomState();
            updateURLState();
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
}

function applySongTransposePreference(songPath) {
    if (state.initialTranspose !== null) {
        state.transpose = state.initialTranspose;
        state.initialTranspose = null;
        saveCurrentSongTranspose();
    } else {
        state.transpose = getStoredSongTranspose(songPath);
    }

    updateTransposeDisplay();
    updateMobileControlUI();
}

function loadDefaultSong() {
    els.songInput.value = "Amazing Grace\n\n[G]Amazing grace how [C]sweet the [G]sound\nThat [G]saved a wretch like [D]me\nI [G]once was lost but [C]now am [G]found\nWas [Em]blind but [D]now I [G]see";
    state.currentSong = null;
    state.transpose = 0;
    state.initialTranspose = null;
    updateTransposeDisplay();
    updateMobileControlUI();
    renderSong();
    els.songView.scrollTop = 0;
    updateSongBottomState();
    showStarterHints();
}

function updateURLState() {
    const params = new URLSearchParams();
    if (state.currentSong) params.set('song', state.currentSong);
    if (state.scrollSpeed !== 1.0) params.set('speed', state.scrollSpeed);
    if (state.transpose !== 0) params.set('transpose', state.transpose);

    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
}

function downloadSong() {
    const blob = new Blob([els.songInput.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (els.headerTitle.textContent || 'song') + '.txt';
    a.click();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        els.songInput.value = ev.target.result;
        renderSong();
        closeModals();
    };
    reader.readAsText(file);
}

function importFromUG() {
    const url = els.importUrlInput.value.trim();
    if (!url) return;

    els.importStatus.textContent = "Fetching...";

    // Use a CORS proxy
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);

    fetch(proxyUrl)
        .then(response => {
            if (response.ok) return response.json();
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            const html = data.contents;
            const parsed = parseUGHtml(html);
            if (parsed) {
                els.songInput.value = parsed;
                renderSong();
                closeModals();
                els.importStatus.textContent = "";
                els.importUrlInput.value = "";
            } else {
                els.importStatus.textContent = "Could not parse song content.";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            els.importStatus.textContent = "Error fetching URL. Check console.";
        });
}

function parseUGHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let data = null;

    // Method 1: Look for .js-store div (New structure)
    const storeDiv = doc.querySelector('.js-store');
    if (storeDiv) {
        const content = storeDiv.getAttribute('data-content');
        if (content) {
            try {
                const json = JSON.parse(content);
                if (json && json.store && json.store.page && json.store.page.data) {
                    data = json.store.page.data;
                }
            } catch (e) {
                console.error("Error parsing .js-store data", e);
            }
        }
    }

    // Method 2: Look for script tag (Old structure)
    if (!data) {
        const scripts = doc.querySelectorAll('script');
        for (let s of scripts) {
            if (s.textContent.includes('window.UGAPP.store.page.data =')) {
                try {
                    const content = s.textContent;
                    const start = content.indexOf('window.UGAPP.store.page.data =') + 'window.UGAPP.store.page.data ='.length;
                    const end = content.indexOf(';', start);
                    const jsonStr = content.substring(start, end);
                    data = JSON.parse(jsonStr);
                    break;
                } catch (e) {
                    console.error("JSON parse error", e);
                }
            }
        }
    }

    if (data && data.tab_view && data.tab_view.wiki_tab && data.tab_view.wiki_tab.content) {
        const tabContent = data.tab_view.wiki_tab.content;
        const artist = data.tab.artist_name;
        const song = data.tab.song_name;
        const key = data.tab_view.meta ? data.tab_view.meta.tonality : '?';
        const tempo = data.tab_view.meta ? data.tab_view.meta.tempo : '?'; // Sometimes available

        // Format
        let output = `${song}\nartist: ${artist}\nkey: ${key || '?'}\n`;
        if (tempo) output += `tempo: ${tempo} BPM\n`;

        // Clean up UG specific tags and excessive newlines
        // We want to preserve [ch] tags for the merge logic, so we don't strip them yet.
        // But we do want to clean up other tags like [tab].
        let cleanContent = tabContent
            .replace(/\[tab\]/g, '')
            .replace(/\[\/tab\]/g, '')
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n'); // Max 2 newlines

        // Merge chords and lyrics
        let merged = mergeChordsAndLyrics(cleanContent);

        output += `\n${merged}`;
        return output;
    }

    // Fallback: Scrape HTML directly
    // Look for <pre> tags or specific classes
    const pre = doc.querySelector('pre.js-tab-content, pre._1YgOS'); // _1YgOS is a common obfuscated class, might change
    if (pre) {
        const content = pre.textContent;
        // Try to get title/artist from header
        const title = doc.querySelector('h1') ? doc.querySelector('h1').textContent : 'Imported Song';
        return `${title}\n\n${content}`;
    }

    return null;
}

function mergeChordsAndLyrics(text) {
    const lines = text.split('\n');
    const result = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Check if this is a chord line (contains [ch] tags)
        if (line.includes('[ch]')) {
            // It's a chord line. Let's parse the chords and their positions.
            // We need to handle the [ch] tags and spaces.
            // Example: [ch]D[/ch]       [ch]Bm[/ch]

            // We need to calculate the "visual" index of each chord.
            // The visual index is the length of the string *without* tags up to that point.

            let chordMap = [];
            let visualIndex = 0;
            let regex = /\[ch\](.*?)\[\/ch\]/g;
            let lastIndex = 0;
            let match;

            // We iterate through the raw string to find tags
            // But we need to account for spaces between tags.

            // Let's strip tags to get the "visual string" of the chord line first?
            // No, because we need to know WHICH part is a chord.

            // Let's iterate manually.
            let tempLine = line;
            let currentPos = 0;

            while ((match = regex.exec(line)) !== null) {
                // Text before this chord
                let before = line.substring(lastIndex, match.index);
                // Add length of 'before' to visualIndex (it's mostly spaces)
                visualIndex += before.length;

                // The chord itself
                let chord = match[1];

                // Store chord and its visual start position
                chordMap.push({ chord: chord, pos: visualIndex });

                // Advance visual index by chord length
                visualIndex += chord.length;

                lastIndex = regex.lastIndex;
            }

            // Check next line
            if (i + 1 < lines.length) {
                let nextLine = lines[i + 1];
                // If next line has NO [ch] tags, assume it's lyrics
                if (!nextLine.includes('[ch]')) {
                    // Merge!
                    // We insert chords into nextLine at correct positions.
                    // We must insert from right to left to avoid messing up indices.

                    let mergedLine = nextLine;
                    // Sort chords by pos descending
                    chordMap.sort((a, b) => b.pos - a.pos);

                    chordMap.forEach(c => {
                        // If position is beyond end of line, append
                        if (c.pos >= mergedLine.length) {
                            // Pad with spaces if needed? 
                            // Usually just appending is fine, but padding is safer for alignment.
                            let padding = ' '.repeat(Math.max(0, c.pos - mergedLine.length));
                            mergedLine += padding + `[${c.chord}]`;
                        } else {
                            // Insert at position
                            // We need to be careful not to split words awkwardly, but UG usually aligns to start of word.
                            // Just insert.
                            mergedLine = mergedLine.slice(0, c.pos) + `[${c.chord}]` + mergedLine.slice(c.pos);
                        }
                    });

                    result.push(mergedLine);
                    i++; // Skip next line
                    continue;
                }
            }

            // If we didn't merge (no next line, or next line is chords), just output chords in brackets
            // We strip [ch] tags and wrap in []
            let cleanChordLine = line.replace(/\[ch\](.*?)\[\/ch\]/g, '[$1]');
            result.push(cleanChordLine);

        } else {
            // Not a chord line, just add it
            result.push(line);
        }
    }

    return result.join('\n');
}

function tapTempo() {
    const now = Date.now();

    // Reset if too long between taps (2 seconds)
    if (state.tapTimes.length > 0 && now - state.tapTimes[state.tapTimes.length - 1] > 2000) {
        state.tapTimes = [];
    }

    state.tapTimes.push(now);

    // Keep only last 5 taps for average
    if (state.tapTimes.length > 5) {
        state.tapTimes.shift();
    }

    if (state.tapTimes.length > 1) {
        // Calculate intervals
        let intervals = [];
        for (let i = 1; i < state.tapTimes.length; i++) {
            intervals.push(state.tapTimes[i] - state.tapTimes[i - 1]);
        }

        // Average interval
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        // BPM = 60000 / ms
        const bpm = Math.round(60000 / avgInterval);
        state.bpm = bpm;
        els.bpmDisplay.textContent = `BPM: ${bpm}`;
        updatePlayButtonUI();
    }
}

function resetBpm() {
    state.bpm = 0;
    state.tapTimes = [];
    els.bpmDisplay.textContent = `BPM: --`;
    updatePlayButtonUI();
}

// Run
init();
