const TILE = 1024;

export const types = {
    panels: { label: 'Panel blocks', density: 6, detail: 70, blend: 'source-over', opacity: 100 },
    vents: { label: 'Vent banks', density: 8, detail: 55, blend: 'source-over', opacity: 90 },
    conduits: { label: 'Conduits', density: 7, detail: 42, blend: 'source-over', opacity: 85 },
    fasteners: { label: 'Fasteners', density: 12, detail: 45, blend: 'source-over', opacity: 75 },
    cells: { label: 'Cellular plates', density: 9, detail: 50, blend: 'source-over', opacity: 80 },
    grain: { label: 'Brushed grain', density: 16, detail: 55, blend: 'overlay', opacity: 40 },
};

export const palettes = {
    titanium: {
        base: '#1b242c', seam: '#131b22', low: '#2c3841', mid: '#4c5d67', high: '#91a5ac',
        light: '#d6e3e5', accent: '#c49a64', plates: ['#3e4d57', '#4b5a64', '#55656e', '#61727b', '#73848b'],
    },
    graphite: {
        base: '#1c1e24', seam: '#111317', low: '#292c35', mid: '#50545e', high: '#8b909d',
        light: '#d6d9e0', accent: '#9facbe', plates: ['#32343d', '#3e424b', '#484d56', '#575c65', '#696d76'],
    },
    oxide: {
        base: '#2b231f', seam: '#1b1715', low: '#44332b', mid: '#72503d', high: '#ac8063',
        light: '#ead3b4', accent: '#83a6a2', plates: ['#533b31', '#634437', '#76533e', '#916347', '#a47353'],
    },
};

export function createLayer(type, id) {
    const { density, detail, blend, opacity } = types[type];
    return { density, detail, blend, opacity, type, id, visible: true };
}

export function defaultState() {
    return {
        seed: 41827,
        palette: 'titanium',
        layers: [
            createLayer('grain', 5),
            createLayer('fasteners', 4),
            createLayer('conduits', 3),
            createLayer('vents', 2),
            createLayer('panels', 1),
        ],
    };
}

function rng(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let n = Math.imul(seed ^ (seed >>> 15), seed | 1);
        n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
        return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
}

function choose(values, random) {
    return values[Math.floor(random() * values.length)];
}

function rect(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function polygon(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
}

function line(ctx, color, width, points) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.stroke();
}

function beveled(ctx, color, x, y, w, h, chamfer) {
    polygon(ctx, [
        [x + chamfer, y], [x + w - chamfer, y], [x + w, y + chamfer],
        [x + w, y + h - chamfer], [x + w - chamfer, y + h], [x + chamfer, y + h],
        [x, y + h - chamfer], [x, y + chamfer],
    ]);
    ctx.fillStyle = color;
    ctx.fill();
}

function dot(ctx, color, x, y, radius) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function bolt(ctx, p, x, y, radius, vertical = false) {
    dot(ctx, p.seam, x, y + radius * 0.2, radius * 1.16);
    dot(ctx, p.high, x, y, radius);
    dot(ctx, p.mid, x, y + radius * 0.18, radius * 0.79);
    const dx = vertical ? 0 : radius * 0.62;
    const dy = vertical ? radius * 0.62 : 0;
    line(ctx, p.seam, Math.max(0.8, radius * 0.32), [[x - dx, y - dy], [x + dx, y + dy]]);
}

function eachCell(density, draw) {
    const cell = TILE / density;
    for (let y = 0; y < density; y++) {
        for (let x = 0; x < density; x++) draw(x * cell, y * cell, cell, x, y);
    }
}

function drawPanel(ctx, p, x, y, w, h, style) {
    const unit = Math.min(w, h);
    const edge = unit * 0.025;
    const corner = edge * 2.25;
    beveled(ctx, p.seam, x - edge, y - edge, w + edge * 2, h + edge * 3, corner);
    beveled(ctx, style.color, x, y, w, h, corner);
    line(ctx, p.high, Math.max(0.9, edge * 0.54), [
        [x + edge, y + h - corner], [x + edge, y + corner], [x + corner, y + edge], [x + w - corner, y + edge],
    ]);
    line(ctx, p.low, edge * 0.85, [
        [x + corner, y + h - edge], [x + w - corner, y + h - edge], [x + w - edge, y + h - corner],
        [x + w - edge, y + corner],
    ]);

    if (style.inset) {
        const insetX = x + w * 0.12;
        const insetY = y + h * 0.22;
        const insetW = w * style.width;
        const insetH = h * 0.54;
        beveled(ctx, p.low, insetX, insetY, insetW, insetH, corner);
        beveled(ctx, style.insetColor, insetX + edge, insetY + edge, insetW - edge * 2, insetH - edge * 2, corner);
        line(ctx, p.high, Math.max(0.7, edge * 0.45), [
            [insetX + corner, insetY + insetH], [insetX + insetW - corner, insetY + insetH],
        ]);
    }

    if (style.marking) {
        rect(ctx, p.low, x + w * 0.13, y + h * 0.13, w * 0.27, edge * 1.15);
        rect(ctx, style.markingColor, x + w * 0.13, y + h * 0.13, w * 0.10, edge);
        rect(ctx, p.high, x + w * 0.26, y + h * 0.13, w * 0.035, edge);
    }

    if (style.bolts) {
        for (const side of [0.09, 0.91]) {
            bolt(ctx, p, x + w * side, y + h * 0.11, edge * 0.79);
            bolt(ctx, p, x + w * side, y + h * 0.89, edge * 0.79);
        }
    }
}

function panels(ctx, p, density, detail, random) {
    const rowH = TILE / density;
    for (let row = 0; row < density; row++) {
        const count = Math.max(3, density + Math.floor(random() * 5) - 2);
        const widths = Array.from({ length: count }, () => 0.5 + random() * 1.05);
        const widthSum = widths.reduce((sum, width) => sum + width, 0);
        let x = random() * TILE;
        for (const width of widths) {
            const span = width * TILE / widthSum;
            const gap = Math.min(span, rowH) * 0.047;
            const style = {
                color: choose(p.plates, random), insetColor: choose(p.plates, random), width: 0.4 + random() * 0.46,
                inset: random() < detail, bolts: random() < detail + 0.18, marking: random() < detail * 0.62,
                markingColor: random() < 0.49 ? p.accent : p.light,
            };
            const start = x % TILE + gap;
            const draw = (left) => drawPanel(ctx, p, left, row * rowH + gap, span - gap * 2, rowH - gap * 2, style);
            draw(start);
            if (start + span > TILE) draw(start - TILE);
            x += span;
        }
    }
}

function vents(ctx, p, density, detail, random) {
    eachCell(density, (x, y, cell) => {
        if (random() > 0.18 + detail * 0.58) return;
        const w = cell * (0.36 + random() * 0.25);
        const h = cell * (0.22 + random() * 0.21);
        const edge = Math.max(1.2, cell * 0.018);
        const slots = 3 + Math.round(random() * 2 + detail * 4);
        ctx.save();
        ctx.translate(x + cell * (0.37 + random() * 0.26), y + cell * (0.35 + random() * 0.3));
        if (random() < 0.36) ctx.rotate(Math.PI / 2);
        beveled(ctx, p.seam, -w / 2 - edge, -h / 2, w + edge * 2, h + edge * 2, edge * 2);
        beveled(ctx, p.high, -w / 2, -h / 2, w, h, edge * 2);
        beveled(ctx, p.low, -w / 2 + edge, -h / 2 + edge, w - edge * 2, h - edge * 2, edge);
        for (let slot = 0; slot < slots; slot++) {
            const yy = -h * 0.36 + slot * h * 0.72 / slots;
            const slotH = h * 0.39 / slots;
            rect(ctx, p.seam, -w * 0.36, yy, w * 0.72, slotH);
            rect(ctx, p.mid, -w * 0.36, yy + slotH, w * 0.72, Math.max(0.7, edge * 0.5));
        }
        bolt(ctx, p, -w * 0.42, 0, edge);
        bolt(ctx, p, w * 0.42, 0, edge, true);
        ctx.restore();
    });
}

function conduits(ctx, p, density, detail, random) {
    eachCell(density, (x, y, cell, column, row) => {
        if (random() > 0.16 + detail * 0.66) return;
        const startX = cell * (0.18 + random() * 0.28);
        const startY = cell * (0.30 + random() * 0.26);
        const width = cell * (random() < 0.68 ? 0.52 : 0.96);
        const rise = cell * (0.10 + random() * 0.13) * (random() < 0.5 ? 1 : -1);
        const pipe = Math.max(1.6, cell * (0.014 + random() * 0.027));
        const color = random() < 0.27 ? p.accent : p.high;
        const count = random() < detail ? 2 : 1;
        ctx.save();
        ctx.translate(x, y);
        const vertical = random() < 0.43;
        if (vertical) {
            ctx.translate(cell, 0);
            ctx.rotate(Math.PI / 2);
        }
        for (let index = 0; index < count; index++) {
            const yy = startY + index * pipe * 2.5;
            const points = [[startX, yy], [startX + width * 0.34, yy],
                [startX + width * 0.61, yy + rise], [startX + width, yy + rise]];
            // A run can cross the right side of a cell and wrap at the texture edge.
            const drawRun = () => {
                line(ctx, p.seam, pipe * 1.85, points);
                line(ctx, color, pipe, points);
                line(ctx, p.low, pipe * 0.32, points.map(([px, py]) => [px, py + pipe * 0.27]));
                bolt(ctx, p, startX, yy, pipe * 0.69);
                bolt(ctx, p, startX + width, yy + rise, pipe * 0.69, true);
            };
            drawRun();
            if (startX + width + pipe > cell && (vertical ? row : column) === density - 1) {
                ctx.save();
                ctx.translate(-TILE, 0);
                drawRun();
                ctx.restore();
            }
        }
        ctx.restore();
    });
}

function fasteners(ctx, p, density, detail, random) {
    eachCell(density, (x, y, cell) => {
        if (random() > 0.25 + detail * 0.7) return;
        const px = x + cell * (0.22 + random() * 0.56);
        const py = y + cell * (0.22 + random() * 0.56);
        const radius = cell * (0.028 + random() * 0.039);
        if (random() < detail) {
            const w = radius * 5.3;
            beveled(ctx, p.seam, px - w / 2, py - radius * 1.9, w, radius * 3.8, radius);
            beveled(ctx, p.mid, px - w / 2 + 1, py - radius * 1.7, w - 2, radius * 3.1, radius);
            bolt(ctx, p, px + radius * 1.25, py, radius * 0.75, true);
            bolt(ctx, p, px - radius * 1.25, py, radius * 0.75);
        } else {
            bolt(ctx, p, px, py, radius, random() < 0.5);
        }
    });
}

function clipCell(points, dx, dy) {
    const limit = (dx * dx + dy * dy) / 2;
    const clipped = [];
    points.forEach((point, index) => {
        const previous = points[(index + points.length - 1) % points.length];
        const distance = point[0] * dx + point[1] * dy - limit;
        const previousDistance = previous[0] * dx + previous[1] * dy - limit;
        if ((distance < 0) !== (previousDistance < 0)) {
            const fraction = previousDistance / (previousDistance - distance);
            clipped.push(previous.map((value, axis) => value + fraction * (point[axis] - value)));
        }
        if (distance < 0) clipped.push(point);
    });
    return clipped;
}

function cells(ctx, p, density, detail, random) {
    const size = TILE / density;
    const sites = Array.from({ length: density }, () => Array.from({ length: density }, () => [
        0.22 + random() * 0.56, 0.22 + random() * 0.56,
    ]));
    const wrap = (value) => (value + density) % density;
    sites.forEach((row, y) => row.forEach(([cx, cy], x) => {
        let points = [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]];
        for (let j = -2; j <= 2; j++) {
            for (let i = -2; i <= 2; i++) {
                if (i === 0 && j === 0) continue;
                const [nx, ny] = sites[wrap(y + j)][wrap(x + i)];
                points = clipCell(points, nx + i - cx, ny + j - cy);
            }
        }
        const color = choose(p.plates, random);
        const hasInset = random() < detail;
        const inset = (ratio) => points.map(([px, py]) => [px * size * ratio, py * size * ratio]);
        const shiftsX = x === 0 ? [0, TILE] : x === density - 1 ? [0, -TILE] : [0];
        const shiftsY = y === 0 ? [0, TILE] : y === density - 1 ? [0, -TILE] : [0];
        for (const shiftY of shiftsY) {
            for (const shiftX of shiftsX) {
                ctx.save();
                ctx.translate((x + cx) * size + shiftX, (y + cy) * size + shiftY);
                polygon(ctx, inset(0.93));
                ctx.fillStyle = p.seam;
                ctx.fill();
                polygon(ctx, inset(0.85));
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = p.high;
                ctx.lineWidth = size * 0.009;
                ctx.stroke();
                if (hasInset) {
                    polygon(ctx, inset(0.55));
                    ctx.fillStyle = p.low;
                    ctx.fill();
                    bolt(ctx, p, 0, 0, size * 0.036);
                }
                ctx.restore();
            }
        }
    }));
}

function grain(ctx, p, density, detail, random) {
    const size = density * 24;
    const texture = surface(size);
    const noise = texture.getContext('2d');
    const frame = noise.createImageData(size, size);
    for (let y = 0; y < size; y++) {
        const brush = (random() - 0.5) * detail;
        for (let x = 0; x < size; x++) {
            const value = Math.max(0, Math.min(1, random() + brush));
            const index = (y * size + x) * 4;
            frame.data[index] = frame.data[index + 1] = frame.data[index + 2] = value * 255;
            frame.data[index + 3] = 115 + detail * 125;
        }
    }
    noise.putImageData(frame, 0, 0);
    ctx.drawImage(texture, 0, 0, TILE, TILE);
}

const painters = { panels, vents, conduits, fasteners, cells, grain };

export function surface(size) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    return canvas;
}

function paintLayer(canvas, state, layer) {
    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = canvas.width / TILE;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const seed = state.seed ^ Math.imul(layer.id, 0x9e3779b9);
    painters[layer.type](ctx, palettes[state.palette], layer.density, layer.detail / 100, rng(seed));
}

export function renderTexture(canvas, state, scratch, isolatedLayer = null) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    if (!isolatedLayer) rect(ctx, palettes[state.palette].base, 0, 0, size, size);

    const stack = isolatedLayer ? [isolatedLayer] : state.layers.filter((layer) => layer.visible).reverse();
    for (const layer of stack) {
        if (layer.opacity === 0) continue;
        paintLayer(scratch, state, layer);
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = isolatedLayer ? 'source-over' : layer.blend;
        ctx.drawImage(scratch, 0, 0);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}
