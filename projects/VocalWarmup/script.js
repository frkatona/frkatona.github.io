(function () {
    // ==== Constants + helpers ====
    const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const RANGE_MIN = 21; // A0
    const RANGE_MAX = 108; // C8
    const KEYS = Array.from({ length: RANGE_MAX - RANGE_MIN + 1 }, (_, i) => RANGE_MIN + i);
    const KEY_W = 40, KEY_H = 48, KEY_GAP = 6, VIEW_SEMITONES = 15; // 1 octave
    const PIX_PER = KEY_W + KEY_GAP;
    // NOTE: pixel measurements (key width + gap) are computed from DOM after keys are rendered.
    // The constants above are fallbacks but we compute actual values dynamically to match CSS.
    const VIEWPORT_W = VIEW_SEMITONES * PIX_PER - KEY_GAP; // fallback
    const LABEL_W = 96;
    const CONTENT_W = KEYS.length * PIX_PER - KEY_GAP;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const pretty = (m) => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
    const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

    // Compute key/layout metrics from the DOM so JS aligns with CSS (margin/gap may differ from constants)
    function computeKeyLayout(viewport) {
        const keysEl = viewport.querySelector('.keys');
        const firstKey = keysEl && keysEl.querySelector('.key');
        if (!firstKey) return null;
        const keyRect = firstKey.getBoundingClientRect();
        const style = getComputedStyle(firstKey);
        const gap = parseFloat(style.marginRight) || 0;
        const keyWidth = Math.round(keyRect.width);
        const pixPer = keyWidth + gap;
        const viewportW = Math.round(VIEW_SEMITONES * pixPer - gap);
        const contentW = Math.round(KEYS.length * pixPer - gap);
        return { keyWidth, gap, pixPer, viewportW, contentW };
    }

    // Center the viewport so midi note appears centered
    function centerLeftForMidi(viewport, midi) {
        const layout = computeKeyLayout(viewport);
        if (!layout) return 0;
        const idx = midi - RANGE_MIN;
        const leftOfKey = idx * layout.pixPer;
        const target = leftOfKey + layout.keyWidth / 2 - viewport.clientWidth / 2;
        const maxLeft = Math.max(0, layout.contentW - viewport.clientWidth);
        return clamp(Math.round(target), 0, maxLeft);
    }

    function visibleStartFromViewport(viewport) {
        const layout = computeKeyLayout(viewport);
        if (!layout) return RANGE_MIN;
        const idx = Math.floor(viewport.scrollLeft / layout.pixPer);
        return clamp(RANGE_MIN + idx, RANGE_MIN, RANGE_MAX);
    }

    // Return left/width for a voice range segment relative to viewport in pixels
    function segmentForRange(viewport, visibleStart, min, max) {
        const layout = computeKeyLayout(viewport);
        if (!layout) return null;
        const visEnd = visibleStart + VIEW_SEMITONES - 1;
        const s = Math.max(min, visibleStart);
        const e = Math.min(max, visEnd);
        if (e < s) return null;
        const left = (s - visibleStart) * layout.pixPer;
        const width = (e - s + 1) * layout.pixPer - layout.gap;
        return { left, width };
    }

    // ==== Audio ====
    let audioCtx = null;
    function ensureCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }
    function playTone(midi, durMs, volume) {
        try {
            const ctx = ensureCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq(midi);
            // slightly longer attack/release for smoother transitions and to reduce clicking
            const now = ctx.currentTime;
            // increase attack/release while keeping them proportional to note duration
            const attack = Math.min(0.06, durMs / 1000 * 0.25); // up to 60ms
            const release = Math.min(0.08, durMs / 1000 * 0.35); // up to 80ms
            const minGain = 0.00001;
            const target = Math.max(0.0002, 0.9 * volume);

            // ensure minimum audible duration and that envelope fits inside it
            const durSec = Math.max(0.04, durMs / 1000);
            const a = Math.min(attack, durSec * 0.4);
            const r = Math.min(release, durSec * 0.5);

            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(minGain, now);
            gain.gain.linearRampToValueAtTime(target, now + a);

            osc.connect(gain).connect(ctx.destination);
            osc.start(now);

            // schedule release and a guaranteed stop at stopTime
            const stopTime = now + durSec;
            const releaseStart = Math.max(now + a, stopTime - r);
            gain.gain.setValueAtTime(target, releaseStart);
            gain.gain.linearRampToValueAtTime(minGain, stopTime);
            try { osc.stop(stopTime + 0.02); } catch { }
        } catch { }
    }

    // ==== Piano factory ====
    function createPiano({ rootEl, onPlay, highlightRef, initialCenter = 55, onScroll }) {
        const viewport = rootEl; // .piano-viewport
        const keysEl = viewport.querySelector('.keys');
        // build keys first, then compute actual layout to set viewport width

        // build keys
        KEYS.forEach(m => {
            const b = document.createElement('button');
            const sharp = NOTE_NAMES[m % 12].includes('#');
            b.className = 'key' + (sharp ? ' sharp' : '');
            b.textContent = pretty(m);
            b.title = pretty(m);
            b.dataset.midi = m;
            b.addEventListener('click', () => onPlay(m));
            keysEl.appendChild(b);
        });

        // After keys are in the DOM compute layout. If the piano viewport is hidden (e.g. the
        // step panel is hidden), measuring will return zero; defer measuring until visible.
        function initLayoutAndCenter() {
            const layout = computeKeyLayout(viewport);
            if (!layout || viewport.clientWidth === 0) {
                // Not ready yet; try again on next frame
                requestAnimationFrame(initLayoutAndCenter);
                return;
            }
            const visibleW = Math.round(layout.pixPer * VIEW_SEMITONES - layout.gap);
            viewport.style.width = visibleW + 'px';
            viewport.style.minWidth = visibleW + 'px';
            viewport.style.maxWidth = visibleW + 'px';
            // initial centering (now that we have measurements)
            const left = centerLeftForMidi(viewport, initialCenter);
            viewport.scrollLeft = left;
            onScroll && onScroll(viewport.scrollLeft, visibleStartFromViewport(viewport));
            requestAnimationFrame(() => {
                const left2 = centerLeftForMidi(viewport, initialCenter);
                viewport.scrollLeft = left2;
                onScroll && onScroll(viewport.scrollLeft, visibleStartFromViewport(viewport));
            });
        }
        // kick off layout init (will retry until the element is measurable)
        initLayoutAndCenter();

        // highlight management
        function setHighlight(midi) {
            // remove active
            keysEl.querySelectorAll('.key.active').forEach(k => k.classList.remove('active'));
            const el = keysEl.querySelector(`.key[data-midi="${midi}"]`);
            if (el) el.classList.add('active');
        }

        // scrolling listener: report both raw scrollLeft and a measured visibleStart
        viewport.addEventListener('scroll', (e) => {
            onScroll && onScroll(viewport.scrollLeft, visibleStartFromViewport(viewport));
        });

        function scrollToMidi(m) {
            const L = centerLeftForMidi(viewport, m);
            viewport.scrollTo({ left: L, behavior: 'smooth' });
            onScroll && onScroll(L, visibleStartFromViewport(viewport));
        }

        // external highlight binding
        if (highlightRef) {
            highlightRef.get = () => keysEl.querySelector('.key.active');
            highlightRef.set = (m) => setHighlight(m);
        }

        return { scrollToMidi, setHighlight };
    }

    // ==== Voice-type bars ====
    const VOICES = [
        { name: 'Bass', min: 40, max: 60 },
        { name: 'Baritone', min: 44, max: 64 },
        { name: 'Tenor', min: 48, max: 67 },
        { name: 'Alto', min: 52, max: 72 },
        { name: 'Mezzo', min: 55, max: 74 },
        { name: 'Soprano', min: 60, max: 79 },
    ];
    function renderVoiceBars(container, viewport, visibleStart, lastPlayed) {
        container.innerHTML = '';
        VOICES.forEach(v => {
            const row = document.createElement('div'); row.className = 'barrow';
            const label = document.createElement('div'); label.className = 'barlabel'; label.textContent = v.name;
            const track = document.createElement('div'); track.className = 'bartrack';
            // width based on viewport clientWidth so it lines up visually
            track.style.width = viewport.clientWidth + 'px';

            // compute left/width for the voice segment by measuring actual key elements
            const keysEl = viewport.querySelector('.keys');
            const visEnd = visibleStart + VIEW_SEMITONES - 1;
            const sMidi = Math.max(v.min, visibleStart - 4);
            const eMidi = Math.min(v.max, visEnd + 4);
            if (eMidi >= sMidi) {
                const firstKey = keysEl.querySelector(`.key[data-midi="${sMidi}"]`);
                const lastKey = keysEl.querySelector(`.key[data-midi="${eMidi}"]`);
                if (firstKey && lastKey) {
                    const kRect = firstKey.getBoundingClientRect();
                    const lRect = lastKey.getBoundingClientRect();
                    const vRect = viewport.getBoundingClientRect();
                    const left = Math.round(kRect.left - vRect.left);
                    const width = Math.round((lRect.left + lRect.width) - kRect.left);
                    const s = document.createElement('div'); s.className = 'barseg';
                    s.style.left = left + 'px'; s.style.width = width + 'px';
                    if (lastPlayed != null && lastPlayed >= v.min && lastPlayed <= v.max) s.classList.add('active');
                    track.appendChild(s);
                }
            }
            row.appendChild(label); row.appendChild(track); container.appendChild(row);
        });
    }

    // ==== Timers ====
    // makeTimer now uses a single primary button that toggles between Start and Pause
    function makeTimer({ elTime, btnStart, btnReset, seconds, onDone }) {
        let s = seconds, running = false, id = null;
        function fmt() { const m = String(Math.floor(s / 60)).padStart(2, '0'); const sec = String(s % 60).padStart(2, '0'); elTime.textContent = `${m}:${sec}`; }
        function tick() { s--; fmt(); if (s <= 0) { stop(); s = 0; fmt(); onDone && onDone(); } }
        function start() { if (running) return; if (s <= 0) s = seconds; running = true; btnStart.textContent = 'Pause'; btnStart.classList.add('running'); id = setInterval(tick, 1000); }
        function pause() { running = false; if (id) clearInterval(id); id = null; btnStart.textContent = 'Start'; btnStart.classList.remove('running'); }
        function reset() { pause(); s = seconds; fmt(); }
        function stop() { running = false; if (id) clearInterval(id); id = null; btnStart.textContent = 'Start'; btnStart.classList.remove('running'); }
        // toggle on primary button
        btnStart.addEventListener('click', () => { if (running) pause(); else start(); });
        btnReset.addEventListener('click', reset);
        fmt();
        return { start, pause, reset, stop };
    }

    // ==== App state ====
    const STEPS = ["Stretches", "Arpeggios", "Sirens", "Character"];//,"Range","Passaggio"];
    const roadmap = document.getElementById('roadmap-list');
    const panel = document.getElementById('panel');
    const progress = document.getElementById('progress');
    let current = 1; const completed = new Set();

    function renderRoadmap() {
        roadmap.innerHTML = '';
        STEPS.forEach((label, i) => {
            const idx = i + 1; const isActive = current === idx; const done = completed.has(idx);
            const b = document.createElement('button'); b.className = 'step' + (isActive ? ' active' : '');
            const badge = document.createElement('div'); badge.className = 'badge ' + (isActive ? 'active' : 'inactive'); badge.textContent = idx;
            const info = document.createElement('div');
            const t = document.createElement('div'); t.textContent = label; t.style.fontWeight = '600'; t.style.fontSize = '14px';
            t.style.display = 'flex'; t.style.alignItems = 'center'; t.style.gap = '6px';
            if (done) { const d = document.createElement('span'); d.className = 'dot'; d.textContent = '●'; t.appendChild(d); }
            const c = document.createElement('div'); c.className = 'step-caption';
            // c.textContent='Step '+idx;  // on previous line for activities subtext
            info.appendChild(t); info.appendChild(c);
            b.appendChild(badge); b.appendChild(info);
            b.addEventListener('click', () => go(idx));
            roadmap.appendChild(b);
        });
    }
    function renderProgress() {
        progress.innerHTML = 'Progress:';
        STEPS.forEach((_, i) => {
            const idx = i + 1; const d = document.createElement('div'); d.className = 'bar' + (completed.has(idx) ? ' done' : (current === idx ? ' active' : ''));
            progress.appendChild(d);
        });
    }
    function go(step) {
        current = step;
        panel.querySelectorAll('.step-panel').forEach(s => {
            s.hidden = Number(s.getAttribute('data-step')) !== current;
        });
        renderRoadmap(); renderProgress();
        if (step === 4) loadSamples(); // Load samples when entering the tab
    }

    // ==== Volume ====
    let volume = 0.6;
    if (document.getElementById('vol')) {
        document.getElementById('vol').addEventListener('input', (e) => {
            volume = Number(e.target.value) / 100;
        });
    }


    // ==== Stretches ====
    const t1 = makeTimer({
        elTime: document.getElementById('t1'),
        btnStart: document.getElementById('t1-start'),
        btnReset: document.getElementById('t1-reset'),
        seconds: 120,
        onDone: () => { completed.add(1); const n = document.getElementById('n1'); n.disabled = false; n.classList.add('pulse'); renderRoadmap(); renderProgress(); }
    });
    document.getElementById('n1').addEventListener('click', () => go(2));

    // ==== Arpeggios ====
    let lastPlayed = null;
    const voiceBars = document.getElementById('voice-bars');
    const highlightRef = {};
    const piano = createPiano({
        rootEl: document.getElementById('piano'),
        onPlay: (m) => { lastPlayed = m; currentMidi = m; playTone(m, 1200, volume); highlightRef.set && highlightRef.set(m); updateBars(); },
        highlightRef,
        initialCenter: 55,
        onScroll: () => updateBars(),
    });
    function updateBars() {
        const pianoViewport = document.getElementById('piano');
        const visibleStart = visibleStartFromViewport(pianoViewport);
        renderVoiceBars(voiceBars, pianoViewport, visibleStart, lastPlayed);
    }
    updateBars();

    const single = document.getElementById('single');
    // Make arpeggiated notes short and spaced so they don't overlap.
    // Note duration (ms) should be less than or equal to the step gap.
    const ARP_NOTE_DUR = 260; // ms note length (short)
    const ARP_STEP_GAP = 300;  // ms spacing between steps (>= ARP_NOTE_DUR to avoid overlap)
    function scheduleNote(m) { playTone(m, ARP_NOTE_DUR, volume); highlightRef.set && highlightRef.set(m); lastPlayed = m; updateBars(); }
    let arpPlaying = false;
    async function playArpeggio(root) {
        if (arpPlaying) return; arpPlaying = true;
        const steps = [0, 2, 4, 5, 7, 5, 4, 2, 0];
        for (const st of steps) { scheduleNote(root + st); await new Promise(r => setTimeout(r, ARP_STEP_GAP)); }
        arpPlaying = false;
    }
    let currentMidi = 57; // A3
    function shift(delta) {
        currentMidi = clamp(currentMidi + delta, RANGE_MIN, RANGE_MAX);
        piano.scrollToMidi(currentMidi);
        // If "Single note only" is checked, play a single note; otherwise start the arpeggio
        if (single && single.checked) {
            scheduleNote(currentMidi);
        } else {
            // Always start arpeggio on arrow press (per latest)
            playArpeggio(currentMidi);
        }
    }
    document.getElementById('down').addEventListener('click', () => shift(-1));
    document.getElementById('up').addEventListener('click', () => shift(1));
    document.getElementById('repeat').addEventListener('click', () => {
        if (single.checked) { scheduleNote(currentMidi); }
        else { playArpeggio(currentMidi); }
    });

    // Keyboard support: left/right arrows control semitone shift (unless typing in a form)
    window.addEventListener('keydown', (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return; // ignore combos
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement && document.activeElement.isContentEditable) return;
        if (e.code === 'ArrowLeft') {
            e.preventDefault(); shift(-1);
        } else if (e.code === 'ArrowRight') {
            e.preventDefault(); shift(1);
        }
    });

    const t2 = makeTimer({
        elTime: document.getElementById('t2'),
        btnStart: document.getElementById('t2-start'),
        btnReset: document.getElementById('t2-reset'),
        seconds: 180,
        onDone: () => { completed.add(2); const n = document.getElementById('n2'); n.disabled = false; n.classList.add('pulse'); renderRoadmap(); renderProgress(); }
    });
    document.getElementById('n2').addEventListener('click', () => go(3));

    // ==== Sirens ====
    const t3 = makeTimer({
        elTime: document.getElementById('t3'),
        btnStart: document.getElementById('t3-start'),
        btnReset: document.getElementById('t3-reset'),
        seconds: 60,
        onDone: () => { completed.add(3); const n = document.getElementById('n3'); n.disabled = false; n.classList.add('pulse'); renderRoadmap(); renderProgress(); }
    });
    document.getElementById('n3').addEventListener('click', () => go(4));

    // ==== Range (piano only) ====
    const lastNote = document.getElementById('last-note');
    const listComf = document.getElementById('list-comf');
    const listStr = document.getElementById('list-str');
    const pianoRange = createPiano({
        rootEl: document.getElementById('piano-range'),
        onPlay: (m) => { playTone(m, 1200, volume); lastNote.textContent = 'Last played: ' + pretty(m); },
        initialCenter: 55,
    });
    const chips = new Set();
    function addChip(listEl, label, color) {
        const s = document.createElement('span');
        s.textContent = label; s.style.fontSize = '12px'; s.style.padding = '2px 8px'; s.style.borderRadius = '999px';
        s.style.border = '1px solid ' + (color === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(244,63,94,.3)');
        s.style.background = color === 'ok' ? 'rgba(16,185,129,.15)' : 'rgba(244,63,94,.15)';
        s.style.color = color === 'ok' ? '#86efac' : '#fecaca';
        listEl.appendChild(s);
    }
    document.getElementById('mark-comf').addEventListener('click', () => {
        const el = document.querySelector('#keys-range .key.active');
        const label = el ? el.textContent : null; if (!label) return; const key = 'c:' + label; if (chips.has(key)) return; chips.add(key);
        addChip(listComf, label, 'ok');
    });
    document.getElementById('mark-str').addEventListener('click', () => {
        const el = document.querySelector('#keys-range .key.active');
        const label = el ? el.textContent : null; if (!label) return; const key = 's:' + label; if (chips.has(key)) return; chips.add(key);
        addChip(listStr, label, 'bad');
    });
    document.getElementById('n4').addEventListener('click', () => go(5));

    // ==== Passaggio ====
    const lastPass = document.getElementById('last-note-pass');
    const passWindow = document.getElementById('pass-window');
    const statePass = { lower: null, upper: null };
    const pianoPass = createPiano({
        rootEl: document.getElementById('piano-pass'),
        onPlay: (m) => { playTone(m, 1200, volume); lastPass.textContent = 'Last played: ' + pretty(m); },
        initialCenter: 55,
    });
    document.getElementById('mark-low').addEventListener('click', () => {
        const el = document.querySelector('#keys-pass .key.active'); const label = el ? el.textContent : null; if (!label) return;
        statePass.lower = label; passWindow.textContent = `${statePass.lower || '—'} to ${statePass.upper || '—'}`;
    });
    document.getElementById('mark-up').addEventListener('click', () => {
        const el = document.querySelector('#keys-pass .key.active'); const label = el ? el.textContent : null; if (!label) return;
        statePass.upper = label; passWindow.textContent = `${statePass.lower || '—'} to ${statePass.upper || '—'}`;
    });

    // ==== Roadmap + progress init ====
    function initProgress() {
        progress.textContent = '';
        const label = document.createTextNode('Progress:'); progress.appendChild(label);
        STEPS.forEach(() => { const d = document.createElement('div'); d.className = 'bar'; progress.appendChild(d); });
    }
    initProgress(); renderRoadmap(); go(1);

    // ==== Samples Feature ====
    const samplesState = {
        data: [],
        loading: false,
        loaded: false,
        filters: new Set(), // active tag filters
        filterMode: 'and', // 'and' or 'or'
        allTags: {} // category -> set of tags
    };
    const listEl = document.getElementById('samples-grid');
    const filtersEl = document.getElementById('samples-filters');
    const matchCountEl = document.getElementById('match-count');
    const clearBtn = document.getElementById('clear-filters');
    const filterLogicRadios = document.querySelectorAll('input[name="filter-logic"]');

    // Filter Logic Toggle Listener
    if (filterLogicRadios.length > 0) {
        filterLogicRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    samplesState.filterMode = e.target.value;
                    renderSamplesGrid();
                    checkAvailability();
                }
            });
        });
    }

    async function loadSamples() {
        if (samplesState.loading || samplesState.loaded) return;
        samplesState.loading = true;
        try {
            const resp = await fetch('Samples.json');
            const data = await resp.json();
            samplesState.data = data;
            processTags(data);
            renderFilters();
            renderSamplesGrid();
            samplesState.loaded = true;
        } catch (e) {
            console.error(e);
            if (filtersEl) filtersEl.innerHTML = '<div class="muted" style="color:var(--rose)">Failed to load samples.</div>';
        }
    }

    // Extract all unique tags per category with category metadata
    function processTags(data) {
        const cats = {}; // category -> Set(tags)
        // Helper to map tag -> category for color coding later
        samplesState.tagMeta = {};

        const skip = new Set(['artist', 'song', 'section', 'link']);
        data.forEach(item => {
            Object.keys(item).forEach(k => {
                if (skip.has(k)) return;
                if (Array.isArray(item[k])) {
                    if (!cats[k]) cats[k] = new Set();
                    item[k].forEach(tag => {
                        cats[k].add(tag);
                        samplesState.tagMeta[tag] = k; // Map tag to its category key
                    });
                }
            });
        });
        samplesState.allTags = cats;
    }

    function renderFilters() {
        if (!filtersEl) return;
        filtersEl.innerHTML = '';
        const cleanName = (s) => s.replace('_', ' ');

        // Sort categories for consistency
        Object.keys(samplesState.allTags).sort().forEach(cat => {
            const group = document.createElement('div'); group.className = 'tag-group';
            const header = document.createElement('div'); header.className = 'tag-header';
            header.textContent = cleanName(cat);

            const tagsDiv = document.createElement('div'); tagsDiv.className = 'tags';

            Array.from(samplesState.allTags[cat]).sort().forEach(tag => {
                const pill = document.createElement('div');
                pill.className = `tag-pill tag-cat-${cat}`; // color code
                pill.textContent = tag;
                pill.dataset.tag = tag;
                pill.onclick = () => toggleFilter(pill, tag);
                tagsDiv.appendChild(pill);
            });

            group.appendChild(header);
            group.appendChild(tagsDiv);
            filtersEl.appendChild(group);
        });
        checkAvailability(); // Initial check
    }

    function toggleFilter(el, tag) {
        if (el.classList.contains('disabled')) return; // Prevent clicking disabled

        if (samplesState.filters.has(tag)) {
            samplesState.filters.delete(tag);
            el.classList.remove('active');
        } else {
            samplesState.filters.add(tag);
            el.classList.add('active');
        }
        updateClearBtn();
        renderSamplesGrid();
        checkAvailability();
    }

    // Smart fading: Disable tags that would result map to 0 matches
    function checkAvailability() {
        // For each tag that represents a filter choice...
        document.querySelectorAll('.tag-pill').forEach(pill => {
            const tag = pill.dataset.tag;
            // If already active, don't disable it (let user deselect it)
            if (samplesState.filters.has(tag)) {
                pill.classList.remove('disabled');
                return;
            }

            // Check if adding this tag yields > 0 matches
            // We can optimize effectively by checking if any currently filtered item has this tag
            // But we need to filter based on hypothetical state.
            // Optimized logic:
            // 1. Get currently matching items (or all if no filters).
            // 2. See if any of those items contain the target tag. (Because AND logic means we are narrowing down).

            // If there are currently NO filters, all tags are valid candidates (assuming each tag appears at least once, which is true by def).
            if (samplesState.filters.size === 0) {
                pill.classList.remove('disabled');
                return;
            }

            // In 'OR' mode, selecting another tag will naturally add MORE matches (or same), so it never reduces result set to zero.
            // So we never disable tags in OR mode unless we want to indicate "no items have this tag at all" but we know they exist from initial load.
            if (samplesState.filterMode === 'or') {
                pill.classList.remove('disabled');
                return;
            }

            // Get current match set
            const currentMatches = getMatches(Array.from(samplesState.filters));

            // Does any current match have this tag?
            const hasPotential = currentMatches.some(item => {
                // Flatten item tags to check
                // optimization: usually iterating logic again is fast enough for small N
                let found = false;
                Object.values(item).forEach(v => {
                    if (Array.isArray(v) && v.includes(tag)) found = true;
                });
                return found;
            });

            if (hasPotential) pill.classList.remove('disabled');
            else pill.classList.add('disabled');
        });
    }

    function getMatches(activeFilters) {
        if (activeFilters.length === 0) return samplesState.data;
        return samplesState.data.filter(item => {
            const itemTags = new Set();
            Object.values(item).forEach(v => {
                if (Array.isArray(v)) v.forEach(t => itemTags.add(t));
            });

            if (samplesState.filterMode === 'or') {
                // Match ANY
                return activeFilters.some(f => itemTags.has(f));
            } else {
                // Match ALL
                return activeFilters.every(f => itemTags.has(f));
            }
        });
    }

    function updateClearBtn() {
        if (!clearBtn) return;
        if (samplesState.filters.size > 0) {
            clearBtn.style.display = 'block';
            clearBtn.textContent = `Clear Filters (${samplesState.filters.size})`;
        } else {
            clearBtn.style.display = 'none';
        }
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            samplesState.filters.clear();
            document.querySelectorAll('.tag-pill.active').forEach(p => p.classList.remove('active'));
            updateClearBtn();
            renderSamplesGrid();
            checkAvailability(); // Reset disabled states
        });
    }

    function renderSamplesGrid() {
        if (!listEl) return;
        listEl.innerHTML = '';

        const matches = getMatches(Array.from(samplesState.filters));

        if (matchCountEl) matchCountEl.textContent = `(${matches.length})`;

        matches.forEach(item => {
            const card = document.createElement('div');
            card.className = 'sample-card';
            card.style.cursor = 'pointer';
            card.title = 'Click to find on YouTube';
            card.onclick = () => {
                if (item.youtube) {
                    window.open(item.youtube, '_blank');
                } else {
                    const query = encodeURIComponent(`${item.artist} ${item.song}`);
                    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
                }
            };

            // Play Button
            const playBtn = document.createElement('a');
            playBtn.className = 'play-btn';
            playBtn.innerHTML = '▶'; // Shape
            // Logic: Assume MP3 is in Samples folder with Song Name formatted
            const filename = item.song.replace(/[\s\/\(\)\'\"\.\,\!]+/g, '_') + '.mp3';
            playBtn.href = `Samples/${filename}`;
            playBtn.target = '_blank'; // Open in new tab or audio player triggers
            playBtn.title = `Play ${item.song} sample`;
            // prevent card click
            playBtn.onclick = (e) => e.stopPropagation();

            card.appendChild(playBtn);

            const artist = document.createElement('div'); artist.className = 's-artist'; artist.textContent = item.artist;
            const song = document.createElement('div'); song.className = 's-song'; song.textContent = item.song;
            const section = document.createElement('div'); section.className = 's-section'; section.textContent = item.section;

            const tagsDiv = document.createElement('div'); tagsDiv.className = 's-tags';
            // Collect matching tags to highlight
            const itemTagsAll = [];
            Object.keys(item).forEach(k => {
                if (Array.isArray(item[k])) item[k].forEach(t => itemTagsAll.push(t));
            });

            // Show top tags
            itemTagsAll.forEach(t => {
                const sTag = document.createElement('div');
                // look up category for color
                const cat = samplesState.tagMeta[t] || '';
                sTag.className = `s-tag tag-cat-${cat}` + (samplesState.filters.has(t) ? ' match' : '');
                sTag.textContent = t;
                tagsDiv.appendChild(sTag);
            });

            card.appendChild(artist);
            card.appendChild(song);
            card.appendChild(section);
            card.appendChild(tagsDiv);

            listEl.appendChild(card);
        });
    }
})();
