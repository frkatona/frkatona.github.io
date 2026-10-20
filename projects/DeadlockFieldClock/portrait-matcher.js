(function (root) {
  "use strict";
  const W = 24;
  const H = 36;
  const count = W * H;

  function sample(image, rectangle) {
    const rgb = new Float32Array(count * 3);
    const grey = new Float32Array(count);
    const alpha = new Float32Array(count);
    let mean = 0, squared = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const px = Math.max(0, Math.min(image.width - 1, rectangle.x + (x + .5) * rectangle.width / W - .5));
      const py = Math.max(0, Math.min(image.height - 1, rectangle.y + (y + .5) * rectangle.height / H - .5));
      const x0 = Math.floor(px), y0 = Math.floor(py);
      const x1 = Math.min(image.width - 1, x0 + 1), y1 = Math.min(image.height - 1, y0 + 1);
      const dx = px - x0, dy = py - y0;
      const offsets = [(y0 * image.width + x0) * 4, (y0 * image.width + x1) * 4, (y1 * image.width + x0) * 4, (y1 * image.width + x1) * 4];
      const weights = [(1 - dx) * (1 - dy), dx * (1 - dy), (1 - dx) * dy, dx * dy];
      const index = y * W + x;
      for (let channel = 0; channel < 4; channel++) {
        let value = 0;
        for (let corner = 0; corner < 4; corner++) value += image.data[offsets[corner] + channel] * weights[corner];
        if (channel < 3) rgb[index * 3 + channel] = value;
        else alpha[index] = value / 255;
      }
      grey[index] = rgb[index * 3] * .299 + rgb[index * 3 + 1] * .587 + rgb[index * 3 + 2] * .114;
      mean += grey[index]; squared += grey[index] ** 2;
    }
    return { rgb, grey, alpha, deviation: Math.sqrt(Math.max(0, squared / count - (mean / count) ** 2)) };
  }

  function similarity(candidate, reference) {
    let weight = 0, a = 0, b = 0, aa = 0, bb = 0, ab = 0;
    let ar = 0, br = 0, aar = 0, bbr = 0, abr = 0;
    for (let index = 0; index < count; index++) {
      const x = index % W, y = Math.floor(index / W);
      if (x < 2 || x >= W - 2 || y < 2 || y >= H - 2) continue;
      const w = reference.alpha[index] * candidate.alpha[index];
      if (w < .5) continue;
      const av = candidate.grey[index], bv = reference.grey[index];
      weight += w; a += av * w; b += bv * w;
      aa += av * av * w; bb += bv * bv * w; ab += av * bv * w;
      for (let c = 0; c < 3; c++) {
        const ac = candidate.rgb[index * 3 + c], bc = reference.rgb[index * 3 + c];
        ar += ac * w; br += bc * w; aar += ac * ac * w; bbr += bc * bc * w; abr += ac * bc * w;
      }
    }
    if (weight < 100) return 0;
    const correlation = (sa, sb, saa, sbb, sab, n) => (sab - sa * sb / n) / Math.sqrt(Math.max(1, (saa - sa * sa / n) * (sbb - sb * sb / n)));
    const greyScore = correlation(a, b, aa, bb, ab, weight);
    const colorScore = correlation(ar, br, aar, bbr, abr, weight * 3);
    return Math.max(0, Math.min(1, greyScore * .65 + colorScore * .35));
  }

  function prepare(id, image) {
    const variants = [];
    for (const fraction of [1, .95, .9, .85, .8, .75, .7]) {
      variants.push(sample(image, { x: 0, y: 0, width: image.width, height: image.height * fraction }));
    }
    return { id, variants };
  }

  function matchSlot(image, region, slotIndex, references) {
    const slotWidth = region.width / 6;
    const variants = [];
    for (const inset of [0, .06, .12]) for (const fraction of [1, .94]) for (const offset of [-.05, 0, .05]) {
      variants.push(sample(image, { x: region.x + (slotIndex + inset + offset) * slotWidth, y: region.y, width: slotWidth * (1 - 2 * inset), height: region.height * fraction }));
    }
    const ranked = references.map(reference => {
      let score = 0;
      for (const candidate of variants) for (const template of reference.variants) score = Math.max(score, similarity(candidate, template));
      return { id: reference.id, score };
    }).sort((a, b) => b.score - a.score);
    const best = ranked[0] || { id: null, score: 0 };
    const margin = best.score - (ranked[1]?.score || 0);
    const blank = variants[0].deviation < 7;
    return { id: blank || best.score < .32 ? null : best.id, score: best.score, margin, needsReview: blank || best.score < .68 || margin < .1, candidates: ranked.slice(0, 3) };
  }

  const api = Object.freeze({ prepare, matchSlot });
  root.DeadlockPortraitMatcher = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
