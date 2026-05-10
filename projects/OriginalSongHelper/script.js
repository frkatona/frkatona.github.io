const ALL_ARTISTS = '__all__';
const HOTKEY_STORAGE_KEY = 'originalSongHelper.hotkeys';
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
    showStarterHints: false,
    hotkeys: Object.fromEntries(Object.entries(HOTKEY_ACTIONS).map(([action, config]) => [action, config.defaultKey]))
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
    hotkeyModal: document.getElementById('hotkeyModal'),
    hotkeyStatus: document.getElementById('hotkeyStatus'),
    songListBtn: document.getElementById('songListBtn'),
    songListModal: document.getElementById('songListModal'),
    menuModal: document.getElementById('menuModal'),
    songSortSelect: document.getElementById('songSortSelect'),
    artistFilterContainer: document.getElementById('artistFilterContainer'),
    songListContainer: document.getElementById('songListContainer'),
    fontDown: document.getElementById('fontDown'),
    fontUp: document.getElementById('fontUp'),
    fontValue: document.getElementById('fontValue'),
    alignToggle: document.getElementById('alignToggle'),
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
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const songParam = params.get('song');
    const speedParam = params.get('speed');
    const transParam = params.get('transpose');
    state.showStarterHints = !songParam && !speedParam && !transParam;

    if (speedParam) {
        state.scrollSpeed = parseFloat(speedParam);
        els.speedValue.textContent = state.scrollSpeed.toFixed(1);
    }

    if (transParam) {
        state.transpose = parseInt(transParam, 10);
        els.transValue.textContent = state.transpose > 0 ? `+${state.transpose}` : state.transpose;
    }

    loadHotkeys();
    renderHotkeyInputs();
    updateUI();
    loadSongList(songParam);
}

// --- Event Listeners ---
els.songInput.addEventListener('input', renderSong);

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
els.hotkeyModal.addEventListener('click', (e) => {
    if (e.button === 0 && e.target === els.hotkeyModal) {
        closeModals();
    }
});
els.songListBtn.addEventListener('click', () => {
    dismissStarterHints();
    openModal(els.songListModal);
});
els.songListModal.addEventListener('click', (e) => {
    if (e.button === 0 && e.target === els.songListModal) {
        closeModals();
    }
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
});

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

// --- Core Logic ---

function renderSong() {
    const text = els.songInput.value;
    const lines = text.split('\n');
    let html = '';

    // Title (first line)
    if (lines.length > 0) {
        const title = lines[0].trim();
        els.headerTitle.textContent = title || 'Untitled Song';
        html += `<div class="song-title-render">${escapeHtml(title)}</div>`;
        lines.shift();
    }

    // Metadata Parsing
    let metadataHtml = '<div class="song-metadata" style="color: #888; font-size: 0.9em; margin-bottom: 1rem;">';
    while (lines.length > 0) {
        const line = lines[0].trim();
        // Check for "key: value" format
        const match = line.match(/^([a-zA-Z]+):\s*(.+)$/);
        if (match) {
            const key = match[1].toLowerCase();
            const value = match[2];
            metadataHtml += `<span style="margin: 0 10px;">${escapeHtml(key.toUpperCase())}: ${escapeHtml(value)}</span>`;
            lines.shift();
        } else if (line === '') {
            lines.shift(); // Skip empty lines between title/metadata and song
        } else {
            break; // Stop at first non-metadata line
        }
    }
    metadataHtml += '</div>';
    html += metadataHtml;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            html += '<br>';
            return;
        }

        // Section Header (ends with :)
        if (/^(\w+[\s\w]*):$/.test(trimmed)) {
            html += `<div class="section-header">${escapeHtml(trimmed)}</div>`;
            return;
        }

        // Lyric/Chord Line
        const processed = processLine(line);
        const isChordOnly = processed.lyrics.trim().length === 0;
        const lineClass = isChordOnly ? 'song-line chord-only' : 'song-line';

        html += `<div class="${lineClass}">
                    <div class="chord-line">${processed.chords}</div>
                    <div class="lyric-line">${processed.lyrics}</div>
                 </div>`;
    });

    els.songView.innerHTML = html;
    applyTranspose(); // Re-apply current transpose
}

function processLine(line) {
    // New logic: We want chords to be on their own line visually, but aligned.
    // Actually, the previous logic of "chord line" + "lyric line" works well for fixed width fonts.
    // But for variable width, we might want inline chords or positioned chords.
    // Let's stick to the "Chord Line above Lyric Line" approach but use monospace for spacing alignment if possible,
    // OR use the "inline chord" approach where chords are floating above the word.
    // The previous code did a complex spacing calculation.
    // Let's try a simpler "inline block" approach for robustness.
    // We will split the line by chords [C].

    // Actually, the most robust way for "Songbook Pro" style is often "Chords above text".
    // Let's try to map chords to their position.

    // Simple approach:
    // 1. Extract chords and their indices.
    // 2. Build a chord line string with spaces.
    // 3. Build a lyric line string.

    let chordLine = '';
    let lyricLine = '';
    let lastIdx = 0;
    let chordOffset = 0; // Adjust for removed brackets

    const regex = /\[([^\]]+)\]/g;
    let match;
    let chords = [];

    // Pass 1: Get all chords and their "lyric index"
    let cleanLine = line.replace(regex, '');

    // We need to reconstruct the chord line to match the visual width of the clean line.
    // This is hard with variable width fonts. 
    // Alternative: Use HTML structure <span class="chord-wrapper"><span class="chord">C</span>Word</span>
    // This binds the chord to the word.

    let resultHtml = '';
    let currentIndex = 0;

    // Reset regex
    regex.lastIndex = 0;

    // We will rebuild the line as a sequence of text nodes and chord-wrappers.
    // But wait, the previous code separated them into two lines.
    // Let's try the wrapper approach, it handles variable width fonts better.

    // However, the prompt asked for "Songbook Pro" style. 
    // Songbook Pro often does "Chords above lyrics".
    // Let's stick to the previous logic's output structure but refined.
    // Actually, the previous logic was:
    // <div class="chord-line">...</div> <div class="lyric-line">...</div>
    // This relies on monospace to align.

    // Let's switch to the "Inline Block" method which is superior for responsive text.
    // We iterate through the string. When we see [Chord], we start a wrapper.

    let parts = line.split(/(\[[^\]]+\])/);
    let finalHtml = '';

    // This is tricky because [C] usually applies to the *following* syllable.
    // Example: Am[C]azing -> Am [C] azing.
    // If we want [C] above 'a', we need to wrap 'azing'.

    // Let's go with a simpler approximation:
    // Just replace [Chord] with <span class="chord">Chord</span> and let CSS position it.
    // If we make .song-line relative, and .chord absolute? No, that overlaps.
    // If we make .chord inline-block with negative margin?

    // Let's use the "Chord over text" trick:
    // <span class="pair"><span class="chord">C</span><span class="text">Text</span></span>
    // But we don't know how much text the chord covers.

    // FALLBACK: Use the previous "Monospace Spacing" logic but render it cleaner.
    // It worked well enough.

    // Let's reuse the previous logic's core idea but simplified.

    let chordLineHtml = '';
    let lyricLineHtml = '';
    let plain = line.replace(regex, '');

    // We will use &nbsp; for spaces in chord line.
    // To make this work with variable width fonts, we really should use a monospace font for the song view
    // OR use the wrapper method.
    // Let's enforce Monospace for the song view for now to ensure alignment.
    // It's the safest bet for a text-based format.
    // I set --font-chord to monospace. I should set --font-song to monospace too if I want perfect alignment.
    // Songbook Pro allows variable width, but it parses the song into objects.
    // Given I'm working with raw text, Monospace is the robust choice.

    // Let's stick to the previous implementation's logic for `processLine` as it was decent,
    // but I'll clean it up.

    let buffer = '';
    let chordBuffer = '';
    let textIndex = 0;

    // Re-implementing the "Space padding" logic
    let chordsMap = []; // {pos: 5, chord: "C"}

    let cleanLen = 0;
    let match2;
    const r2 = /\[([^\]]+)\]/g;
    while ((match2 = r2.exec(line)) !== null) {
        // Position in clean text is match.index minus length of all previous brackets
        let pre = line.substring(0, match2.index);
        let preClean = pre.replace(/\[[^\]]+\]/g, '');
        chordsMap.push({ pos: preClean.length, chord: match2[1] });
    }

    let clean = line.replace(r2, '');

    // Build chord line
    let cLine = '';
    let lastPos = 0;

    chordsMap.forEach(c => {
        // Add spaces
        while (cLine.length < c.pos) cLine += ' ';
        // If overlap, just append (simple collision handling)
        if (cLine.length > c.pos) {
            // cLine += ' '; // Force space?
        }
        // Add chord marker
        // We wrap it in a span for transposition
        cLine += `___CHORD___${c.chord}___END___`;
    });

    // Replace markers with HTML
    // We need to handle the length of the chord string vs the length of the space it takes.
    // In a monospace view, [C] takes 3 chars in source, but we want it to sit above the char.
    // The `cLine` string length now is "virtual".
    // This is getting complicated.

    // SIMPLIFIED APPROACH:
    // Just return the clean text and a chord line that attempts to align.
    // We will rely on the user putting chords roughly where they want them.
    // Actually, the previous code did:
    // Iterate chars of plain text. If chord at index, insert chord span. Else insert space.

    let chordSpans = [];
    let cMap = new Map();
    chordsMap.forEach(c => cMap.set(c.pos, c.chord));

    for (let i = 0; i < clean.length + 5; i++) { // +5 for trailing chords
        if (cMap.has(i)) {
            chordSpans.push(`<span class="chord-root" data-root="${cMap.get(i)}">${cMap.get(i)}</span>`);
        } else {
            if (i < clean.length) chordSpans.push('&nbsp;');
        }
    }

    return {
        chords: chordSpans.join(''),
        lyrics: escapeHtml(clean)
    };
}

function updateTranspose(amount) {
    setTranspose(state.transpose + amount);
}

function setTranspose(value) {
    state.transpose = Math.round(value);
    els.transValue.textContent = formatTranspose(state.transpose);
    applyTranspose();
    updateURLState();
    updateMobileControlUI();
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
function transposeChord(chord, semitones) {
    // Split root from suffix (e.g. C#m7 -> C#, m7)
    let match = chord.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return chord;

    let root = match[1];
    let suffix = match[2];

    // Normalize flats to sharps for simplicity
    const flatMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    if (flatMap[root]) root = flatMap[root];

    let idx = NOTES.indexOf(root);
    if (idx === -1) return chord;

    let newIdx = (idx + semitones) % 12;
    if (newIdx < 0) newIdx += 12;

    return NOTES[newIdx] + suffix;
}

function updateSpeed(amount) {
    setSpeed(state.scrollSpeed + amount);
}

function setSpeed(value) {
    state.scrollSpeed = clamp(Number(value), 0.5, 10);
    els.speedValue.textContent = state.scrollSpeed.toFixed(1);
    if (state.isScrolling) {
        clearInterval(state.scrollInterval);
        state.scrollInterval = setInterval(() => {
            els.songView.scrollTop += 1;
        }, 50 / state.scrollSpeed);
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
}

function toggleScroll() {
    if (state.isScrolling) {
        clearInterval(state.scrollInterval);
        state.isScrolling = false;
        els.playBtn.textContent = '▶';
        els.playBtn.classList.remove('playing');
        els.playBtn.classList.remove('pulsing');
    } else {
        state.scrollInterval = setInterval(() => {
            els.songView.scrollTop += 1;
        }, 50 / state.scrollSpeed); // Simple speed logic
        state.isScrolling = true;
        els.playBtn.textContent = '❚❚';
        els.playBtn.classList.add('playing');

        if (state.bpm > 0) {
            els.playBtn.classList.add('pulsing');
            // Set pulse duration based on BPM
            // 60 BPM = 1 beat per second
            const duration = 60 / state.bpm;
            els.playBtn.style.setProperty('--pulse-duration', `${duration}s`);
        }
    }
}

function updateUI() {
    els.songView.style.fontSize = `${state.fontSize}px`;
    els.songView.style.textAlign = state.alignment;
    els.fontValue.textContent = state.fontSize;
    els.alignToggle.dataset.alignment = state.alignment;
    els.alignToggle.setAttribute('aria-pressed', state.alignment === 'center' ? 'true' : 'false');
    updateMobileControlUI();
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

function openModal(modal) {
    modal.classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}
window.closeModals = closeModals; // Expose to HTML

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
        const stored = window.localStorage ? JSON.parse(window.localStorage.getItem(HOTKEY_STORAGE_KEY) || '{}') : {};
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
    try {
        if (window.localStorage) {
            window.localStorage.setItem(HOTKEY_STORAGE_KEY, JSON.stringify(state.hotkeys));
        }
    } catch (error) {
        console.warn('Hotkey settings could not be saved.', error);
    }
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

        const title = document.createElement('span');
        title.className = 'song-list-title';
        title.textContent = song.title;

        const artist = document.createElement('span');
        artist.className = 'song-list-artist';
        artist.textContent = song.artist;

        div.append(title, artist);
        div.onclick = () => {
            setTranspose(0);
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
            renderSong();
            els.songView.scrollTop = 0;
            updateURLState();
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
}

function loadDefaultSong() {
    els.songInput.value = "Amazing Grace\n\n[G]Amazing grace how [C]sweet the [G]sound\nThat [G]saved a wretch like [D]me\nI [G]once was lost but [C]now am [G]found\nWas [Em]blind but [D]now I [G]see";
    renderSong();
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
    }
}

function resetBpm() {
    state.bpm = 0;
    state.tapTimes = [];
    els.bpmDisplay.textContent = `BPM: --`;
}

// Run
init();
