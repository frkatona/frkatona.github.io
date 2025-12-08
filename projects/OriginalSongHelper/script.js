// --- State ---
const state = {
    transpose: 0,
    scrollSpeed: 1.0,
    isScrolling: false,
    scrollInterval: null,
    fontSize: 16,
    alignment: 'center',
    isEditMode: false,
    currentSong: null, // Track current song filename
    bpm: 0,
    tapTimes: [],
    pulseInterval: null
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
    menuBtn: document.getElementById('menuBtn'),
    songListBtn: document.getElementById('songListBtn'),
    songListModal: document.getElementById('songListModal'),
    menuModal: document.getElementById('menuModal'),
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

    if (speedParam) {
        state.scrollSpeed = parseFloat(speedParam);
        els.speedValue.textContent = state.scrollSpeed.toFixed(1);
    }

    if (transParam) {
        state.transpose = parseInt(transParam, 10);
        els.transValue.textContent = state.transpose > 0 ? `+${state.transpose}` : state.transpose;
    }

    // Load initial song
    if (songParam) {
        loadSongFile(songParam);
    } else if (!els.songInput.value.trim()) {
        els.songInput.value = "Amazing Grace\n\n[G]Amazing grace how [C]sweet the [G]sound\nThat [G]saved a wretch like [D]me\nI [G]once was lost but [C]now am [G]found\nWas [Em]blind but [D]now I [G]see";
        renderSong();
    } else {
        renderSong();
    }

    updateUI();
    loadSongList();
}

// --- Event Listeners ---
els.songInput.addEventListener('input', renderSong);

els.editToggleBtn.addEventListener('click', () => {
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

// Menu & Modals
els.menuBtn.addEventListener('click', () => openModal(els.menuModal));
els.songListBtn.addEventListener('click', () => openModal(els.songListModal));

// Font
els.fontDown.addEventListener('click', () => { state.fontSize = Math.max(10, state.fontSize - 2); updateUI(); });
els.fontUp.addEventListener('click', () => { state.fontSize = Math.min(60, state.fontSize + 2); updateUI(); });

// Alignment
els.alignToggle.addEventListener('click', () => {
    state.alignment = state.alignment === 'center' ? 'left' : 'center';
    els.alignToggle.textContent = state.alignment === 'center' ? 'Center' : 'Left';
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
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA') return; // Ignore if typing
    if (e.code === 'Space') { e.preventDefault(); toggleScroll(); }
    if (e.code === 'ArrowUp') { els.songView.scrollTop -= 50; }
    if (e.code === 'ArrowDown') { els.songView.scrollTop += 50; }
});

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
    state.transpose += amount;
    els.transValue.textContent = state.transpose > 0 ? `+${state.transpose}` : state.transpose;
    applyTranspose();
    updateURLState();
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
    state.scrollSpeed = Math.max(0.5, Math.min(10, state.scrollSpeed + amount));
    els.speedValue.textContent = state.scrollSpeed.toFixed(1);
    if (state.isScrolling) {
        clearInterval(state.scrollInterval);
        state.scrollInterval = setInterval(() => {
            els.songView.scrollTop += 1;
        }, 50 / state.scrollSpeed);
    }
    updateURLState();
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

function loadSongList() {
    // Mock or fetch
    fetch('songs/index.json')
        .then(r => r.json())
        .then(songs => {
            els.songListContainer.innerHTML = '';
            songs.forEach(song => {
                const div = document.createElement('div');
                div.className = 'song-list-item';
                div.textContent = song.replace('.txt', '');
                div.onclick = () => {
                    state.transpose = 0;
                    els.transValue.textContent = '0';
                    // Pause if playing
                    if (state.isScrolling) toggleScroll();
                    loadSongFile(song);
                    closeModals();

                };
                els.songListContainer.appendChild(div);
            });
        })
        .catch(() => {
            els.songListContainer.innerHTML = '<div style="padding:10px; color:#666;">No songs found or index.json missing.</div>';
        });
}

function loadSongFile(filename) {
    fetch('songs/' + filename)
        .then(r => r.text())
        .then(text => {
            els.songInput.value = text;
            state.currentSong = filename;
            renderSong();
            updateURLState();
        });
}

function updateURLState() {
    const params = new URLSearchParams();
    if (state.currentSong) params.set('song', state.currentSong);
    if (state.scrollSpeed !== 1.0) params.set('speed', state.scrollSpeed);
    if (state.transpose !== 0) params.set('transpose', state.transpose);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
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
