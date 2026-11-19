import { createLayer, defaultState, renderTexture, surface, types } from './texture.js';
import { zipPngs } from './zip.js';

const byId = (id) => document.getElementById(id);
const state = defaultState();
let nextId = Math.max(...state.layers.map((layer) => layer.id)) + 1;
let selectedId = state.layers.at(-1).id;
let previewMode = 'composite';
let renderPending = false;

const stack = byId('layer-stack');
const layerTemplate = byId('layer-row-template');
const emptyStack = byId('empty-stack');
const inspector = byId('inspector');
const seed = byId('seed');
const palette = byId('palette');
const add = byId('add-layer');
const raise = byId('raise-layer');
const lower = byId('lower-layer');
const remove = byId('remove-layer');
const pattern = byId('layer-type');
const blend = byId('layer-blend');
const sliders = ['density', 'detail', 'opacity'].map((name) => ({
    name, input: byId('layer-' + name), output: byId(name + '-value'),
}));
const viewButtons = [...document.querySelectorAll('[data-view]')];
const preview = byId('preview');
const previewCtx = preview.getContext('2d');
const previewSize = preview.width;
const compositePreview = surface(previewSize);
const previewScratch = surface(previewSize);
const format = byId('export-format');
const selectedFormat = format.querySelector('option[value="layer"]');
const exportButton = byId('export');
const status = byId('export-status');

for (const [value, type] of Object.entries(types)) pattern.add(new Option(type.label, value));

function selectedLayer() {
    return state.layers.find((layer) => layer.id === selectedId);
}

function selectionButton(id) {
    return stack.querySelector('[data-id="' + id + '"] .layer-pick');
}

function syncStack() {
    const fragment = document.createDocumentFragment();
    for (const layer of state.layers) {
        const row = layerTemplate.content.firstElementChild.cloneNode(true);
        const current = layer.id === selectedId;
        row.dataset.id = layer.id;
        row.dataset.pattern = layer.type;
        row.classList.toggle('is-current', current);
        const visibility = row.querySelector('input');
        visibility.checked = layer.visible;
        visibility.setAttribute('aria-label', 'Show ' + types[layer.type].label + ' in composite');
        row.querySelector('button').setAttribute('aria-pressed', String(current));
        row.querySelector('.layer-name').textContent = types[layer.type].label;
        row.querySelector('.layer-strength').textContent = layer.opacity + '%';
        fragment.append(row);
    }
    stack.replaceChildren(fragment);
    emptyStack.hidden = state.layers.length > 0;
}

function syncView() {
    const layer = selectedLayer();
    if (!layer && previewMode === 'layer') previewMode = 'composite';
    for (const button of viewButtons) {
        const mode = button.dataset.view;
        button.setAttribute('aria-pressed', String(previewMode === mode));
        button.disabled = mode === 'layer' && !layer;
    }
    selectedFormat.disabled = !layer;
    if (!layer && format.value === 'layer') format.value = 'composite';
}

function updateSlider(slider, value) {
    slider.output.value = String(value) + (slider.name === 'density' ? '' : '%');
}

function syncInspector() {
    const layer = selectedLayer();
    inspector.hidden = !layer;
    if (!layer) return;
    pattern.value = layer.type;
    blend.value = layer.blend;
    const index = state.layers.indexOf(layer);
    raise.disabled = index === 0;
    lower.disabled = index === state.layers.length - 1;
    for (const slider of sliders) {
        slider.input.value = layer[slider.name];
        updateSlider(slider, layer[slider.name]);
    }
}

function refresh() {
    syncStack();
    syncInspector();
    syncView();
    queuePreview();
}

function revealInspector() {
    const bounds = inspector.getBoundingClientRect();
    if (bounds.bottom <= window.innerHeight && bounds.top >= 0) return;
    pattern.focus({ preventScroll: true });
    inspector.scrollIntoView({ block: 'start' });
}

function drawPreview() {
    renderPending = false;
    const layer = previewMode === 'layer' ? selectedLayer() : null;
    renderTexture(compositePreview, state, previewScratch, layer);
    previewCtx.clearRect(0, 0, previewSize, previewSize);

    if (previewMode === 'tile') {
        const tileSize = previewSize / 3;
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                previewCtx.drawImage(compositePreview, x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
        preview.setAttribute('aria-label', 'Composite greeble texture repeated in a 3 by 3 grid');
        return;
    }

    previewCtx.drawImage(compositePreview, 0, 0);
    preview.setAttribute('aria-label', layer ? types[layer.type].label + ' layer preview' : 'Composite greeble texture preview');
}

function queuePreview() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(drawPreview);
}

seed.addEventListener('input', () => {
    if (!seed.value || !seed.validity.valid) return;
    state.seed = seed.valueAsNumber;
    queuePreview();
});

seed.addEventListener('change', () => { seed.value = state.seed; });

byId('shuffle').addEventListener('click', () => {
    state.seed = Math.floor(Math.random() * 4294967296);
    seed.value = state.seed;
    queuePreview();
});

palette.addEventListener('change', () => {
    state.palette = palette.value;
    queuePreview();
});

stack.addEventListener('click', (event) => {
    const button = event.target.closest('.layer-pick');
    if (!button) return;
    selectedId = Number(button.closest('li').dataset.id);
    refresh();
    selectionButton(selectedId).focus();
    revealInspector();
});

stack.addEventListener('change', (event) => {
    const checkbox = event.target;
    const id = Number(checkbox.closest('li').dataset.id);
    const layer = state.layers.find((item) => item.id === id);
    layer.visible = checkbox.checked;
    queuePreview();
});

add.addEventListener('click', () => {
    const type = Object.keys(types).find((name) => !state.layers.some((layer) => layer.type === name)) ?? 'panels';
    const layer = createLayer(type, nextId++);
    state.layers.unshift(layer);
    selectedId = layer.id;
    refresh();
    revealInspector();
});

function moveLayer(offset, button) {
    const index = state.layers.findIndex((layer) => layer.id === selectedId);
    const destination = index + offset;
    if (destination < 0 || destination >= state.layers.length) return;
    const [layer] = state.layers.splice(index, 1);
    state.layers.splice(destination, 0, layer);
    refresh();
    if (button.disabled) selectionButton(selectedId).focus();
}

raise.addEventListener('click', () => moveLayer(-1, raise));
lower.addEventListener('click', () => moveLayer(1, lower));

remove.addEventListener('click', () => {
    const index = state.layers.findIndex((layer) => layer.id === selectedId);
    state.layers.splice(index, 1);
    selectedId = state.layers[Math.min(index, state.layers.length - 1)]?.id ?? null;
    refresh();
    (selectionButton(selectedId) ?? add).focus();
});

pattern.addEventListener('change', () => {
    selectedLayer().type = pattern.value;
    syncStack();
    queuePreview();
});

blend.addEventListener('change', () => {
    selectedLayer().blend = blend.value;
    queuePreview();
});

for (const slider of sliders) {
    slider.input.addEventListener('input', () => {
        const value = slider.input.valueAsNumber;
        selectedLayer()[slider.name] = value;
        updateSlider(slider, value);
        if (slider.name === 'opacity') selectionButton(selectedId).querySelector('.layer-strength').textContent = value + '%';
        queuePreview();
    });
}

for (const button of viewButtons) {
    button.addEventListener('click', () => {
        previewMode = button.dataset.view;
        syncView();
        queuePreview();
    });
}

function png(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('The browser could not encode the PNG.'));
        }, 'image/png');
    });
}

function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}

exportButton.addEventListener('click', async () => {
    const snapshot = { ...state, layers: state.layers.map((layer) => ({ ...layer })) };
    const size = Number(byId('resolution').value);
    const output = format.value;
    const selected = snapshot.layers.find((layer) => layer.id === selectedId);
    const stem = 'greeble-' + snapshot.seed + '-' + size;
    exportButton.disabled = true;
    status.textContent = 'Rendering PNG…';
    try {
        await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
        const canvas = surface(size);
        const scratch = surface(size);
        const makePng = (layer = null) => {
            renderTexture(canvas, snapshot, scratch, layer);
            return png(canvas);
        };

        if (output === 'layer') {
            download(await makePng(selected), stem + '-' + selected.type + '-' + selected.id + '.png');
        } else if (output === 'bundle') {
            const layers = snapshot.layers.filter((layer) => layer.visible);
            const files = [{ name: 'composite.png', blob: await makePng() }];
            for (const [index, layer] of layers.entries()) {
                status.textContent = 'Rendering layer ' + (index + 1) + ' of ' + layers.length + '…';
                const name = String(index + 1).padStart(2, '0') + '-' + layer.type + '.png';
                files.push({ name, blob: await makePng(layer) });
            }
            status.textContent = 'Preparing ZIP…';
            download(await zipPngs(files), stem + '-layers.zip');
        } else {
            download(await makePng(), stem + '.png');
        }
        status.textContent = 'Download started.';
    } catch (error) {
        console.error('Greeble export failed.', error);
        status.textContent = 'Export failed. Try a smaller resolution.';
    } finally {
        exportButton.disabled = false;
    }
});

refresh();
