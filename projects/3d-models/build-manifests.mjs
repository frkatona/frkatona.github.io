import { spawnSync } from "node:child_process";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetsDirectory = path.join(projectDirectory, "assets");
const audioSampleRate = 22050;
const waveformBinCount = 36;
const fftSize = 2048;

const categoryLabels = {
  characters: "Character",
  props: "Prop",
  environments: "Environment",
};

const sourceLabels = {
  "kaya-squirrel-racer": "Kaya SquirrelRacer",
  "micro-jam-52-winter": "Micro Jam 52: Winter",
  "ld57-depths": "LD57: Depths",
  "ld59-signal": "LD59: Signal",
  "brackeys-2026-strange-places": "Brackeys 2026.1: Strange Places",
};

const modelOverrides = {
  squirrelLady: {
    name: "Squirrel Lady",
    description: "Woodland hero with seven animations.",
    albedo: "assets/characters/albedo.png",
    defaultAnimation: "idle1-loop",
  },
  snowboarderCharacter: {
    name: "Snowboarder Character",
    description: "Animated downhill snowboarder character.",
    defaultAnimation: "idle-loop.001",
  },
  dolphin: {
    name: "Dolphin",
    description: "Animated low-poly dolphin character.",
    defaultAnimation: "idle-loop",
  },
  character: {
    name: "Winter Foreman",
    description: "Stylized animated winter worker.",
    defaultAnimation: "idle",
  },
  crossbow: {
    name: "Crossbow",
    description: "Pixel-textured compact crossbow.",
    albedo: "assets/props/albedo.png",
  },
  "bridge-rope": {
    name: "Rope Bridge",
    description: "Modular rope-and-plank bridge.",
  },
  brushMotor: {
    name: "Brush Motor",
    description: "Mechanical brush motor assembly.",
  },
  "greeble-box": {
    name: "Greeble Box",
    description: "Compact sci-fi utility box.",
  },
  wickerSphere2: {
    name: "Wicker Sphere",
    description: "Woven spherical prop.",
  },
  lift: {
    name: "Lift",
    description: "Animated interactive launch platform.",
    defaultAnimation: "launch-circle-1",
  },
  terminal: {
    name: "Terminal",
    description: "Minimal low-poly control terminal.",
  },
  tree: {
    name: "Tree",
    description: "Modular stylized tree.",
  },
  lantern: {
    name: "Lantern",
    description: "Low-poly cavern lantern.",
  },
  wall: {
    name: "Gemstone Wall",
    description: "Textured modular gemstone wall.",
  },
  theSpinner: {
    name: "The Spinner",
    description: "Large animated obstacle.",
    defaultAnimation: "Cylinder.007Action",
  },
  rock1: {
    name: "Cavern Rock",
    description: "Low-poly subterranean rock.",
  },
  dalek: {
    name: "Dalek",
    description: "Detailed science-fiction robot prop.",
  },
  door: {
    name: "Lab Door",
    description: "Animated mechanical laboratory door.",
  },
  "lab-bench": {
    name: "Lab Bench",
    description: "Compact laboratory workstation.",
  },
  oscilloscope: {
    name: "Oscilloscope",
    description: "Signal-monitoring laboratory instrument.",
  },
  dogbowl: {
    name: "Dog Bowl",
    description: "Stylized pet bowl.",
  },
  "round-tree": {
    name: "Round Tree",
    description: "Softly rounded tree prop.",
  },
  umbrella: {
    name: "Umbrella",
    description: "Colorful stylized umbrella.",
  },
  trophy: {
    name: "Trophy",
    description: "Celebratory trophy prop.",
  },
  NPC_bush: {
    name: "Bush NPC",
    description: "Leafy disguised character.",
  },
  capy: {
    name: "Capy",
    description: "Friendly caped character.",
  },
  cathedral: {
    name: "Cathedral",
    description: "Large textured cathedral environment.",
  },
  cabin: {
    name: "Cabin",
    description: "Detailed textured cabin environment.",
  },
  boat: {
    name: "Boat",
    description: "Compact stylized boat prop.",
  },
  cannon: {
    name: "Cannon",
    description: "Heavy stylized cannon.",
  },
  "coffee-cup": {
    name: "Coffee Cup",
    description: "Detailed coffee cup.",
  },
  "desk-battlestation": {
    name: "Desk Battlestation",
    description: "Desktop battle station setup.",
  },
  "FBI-badge": {
    name: "FBI Badge",
    description: "Detailed federal agent badge.",
  },
  "head-scared": {
    name: "Scared Head",
    description: "Expressive frightened head sculpt.",
  },
  "tensile-mockup": {
    name: "Tensile Mockup",
    description: "Tensile structural mockup.",
  },
};

async function main() {
  const models = await buildModelManifest();
  const sounds = await buildSoundManifest();

  await writeFile(
    path.join(assetsDirectory, "models.json"),
    `${JSON.stringify({ models }, null, 2)}\n`,
  );
  await writeFile(
    path.join(assetsDirectory, "soundfx", "manifest.json"),
    `${JSON.stringify({ sounds }, null, 2)}\n`,
  );

  console.log(`Wrote ${models.length} models and ${sounds.length} sound effects.`);
}

async function buildModelManifest() {
  const categories = ["characters", "props", "environments"];
  const models = [];

  for (const category of categories) {
    const directory = path.join(assetsDirectory, category);
    const files = (await listFilesRecursively(directory))
      .filter((file) => file.toLowerCase().endsWith(".glb"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const filePath of files) {
      const relativeFile = path.relative(directory, filePath);
      const stem = path.basename(filePath, path.extname(filePath));
      const override = modelOverrides[stem] || {};
      const metadata = await inspectGlb(filePath);
      const name = override.name || humanize(stem);
      const id = slugify(relativeFile.slice(0, -path.extname(relativeFile).length));

      models.push({
        id,
        name,
        category,
        categoryLabel: categoryLabels[category],
        src: toWebPath("assets", category, ...relativeFile.split(path.sep)),
        thumbnail: toWebPath("assets", "thumbnails", `${id}.webp`),
        albedo: override.albedo || null,
        description: override.description || `Curated ${categoryLabels[category].toLowerCase()} asset.`,
        defaultAnimation: override.defaultAnimation || chooseDefaultAnimation(metadata.animations),
        ...metadata,
      });
    }
  }

  const categoryOrder = { characters: 0, props: 1, environments: 2 };
  return models.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category] || a.name.localeCompare(b.name));
}

async function inspectGlb(filePath) {
  const buffer = await readFile(filePath);
  if (buffer.toString("utf8", 0, 4) !== "glTF") {
    throw new Error(`${filePath} is not a binary glTF file.`);
  }

  let offset = 12;
  let gltf;
  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.toString("utf8", offset + 4, offset + 8);
    if (chunkType === "JSON") {
      gltf = JSON.parse(buffer.toString("utf8", offset + 8, offset + 8 + chunkLength).trim());
      break;
    }
    offset += 8 + chunkLength;
  }

  if (!gltf) throw new Error(`No JSON chunk found in ${filePath}.`);

  let triangles = 0;
  let vertices = 0;
  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const vertexCount = gltf.accessors?.[primitive.attributes.POSITION]?.count || 0;
      const indexCount = primitive.indices === undefined
        ? vertexCount
        : gltf.accessors?.[primitive.indices]?.count || 0;
      const mode = primitive.mode ?? 4;
      vertices += vertexCount;
      if (mode === 4) triangles += Math.floor(indexCount / 3);
      if (mode === 5 || mode === 6) triangles += Math.max(indexCount - 2, 0);
    }
  }

  const animations = (gltf.animations || []).map((animation, index) => {
    let duration = 0;
    for (const sampler of animation.samplers || []) {
      duration = Math.max(duration, gltf.accessors?.[sampler.input]?.max?.[0] || 0);
    }
    return {
      name: animation.name || `Animation ${index + 1}`,
      duration: round(duration, 3),
    };
  });

  return {
    bytes: buffer.length,
    triangles,
    vertices,
    meshCount: gltf.meshes?.length || 0,
    materialCount: gltf.materials?.length || 0,
    textureCount: gltf.textures?.length || 0,
    skinCount: gltf.skins?.length || 0,
    animations,
  };
}

async function buildSoundManifest() {
  const root = path.join(assetsDirectory, "soundfx");
  const sourceDirectories = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const sounds = [];
  const idCounts = new Map();

  for (const source of sourceDirectories) {
    const directory = path.join(root, source);
    const files = (await listFilesRecursively(directory))
      .filter((file) => /\.(wav|mp3|ogg|flac|m4a|aac|opus)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const filePath of files) {
      const relativeFile = path.relative(directory, filePath);
      const file = path.basename(filePath);
      const metadata = await analyzeSound(filePath);
      const stem = path.basename(file, path.extname(file));
      const relativeStem = relativeFile.slice(0, -path.extname(relativeFile).length);
      const baseId = `${source}-${slugify(relativeStem)}`;
      const idCount = (idCounts.get(baseId) || 0) + 1;
      idCounts.set(baseId, idCount);
      sounds.push({
        id: idCount === 1 ? baseId : `${baseId}-${idCount}`,
        name: humanizeSound(stem),
        file,
        source,
        sourceLabel: sourceLabels[source] || humanize(source),
        src: toWebPath("assets", "soundfx", source, ...relativeFile.split(path.sep)),
        ...metadata,
      });
      console.log(`Analyzed ${toWebPath(source, ...relativeFile.split(path.sep))}`);
    }
  }

  return sounds;
}

async function listFilesRecursively(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFilesRecursively(entryPath));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

async function analyzeSound(filePath) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate,channels:format=duration", "-of", "json", filePath],
    { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  if (probe.status !== 0) throw new Error(`ffprobe failed for ${filePath}: ${probe.stderr}`);

  const probeData = JSON.parse(probe.stdout);
  const audioStream = probeData.streams?.[0] || {};
  const decode = spawnSync(
    "ffmpeg",
    ["-v", "error", "-i", filePath, "-f", "f32le", "-ac", "1", "-ar", String(audioSampleRate), "pipe:1"],
    { encoding: null, maxBuffer: 128 * 1024 * 1024 },
  );
  if (decode.status !== 0) throw new Error(`ffmpeg failed for ${filePath}: ${decode.stderr?.toString()}`);

  const samples = new Float32Array(
    decode.stdout.buffer,
    decode.stdout.byteOffset,
    Math.floor(decode.stdout.byteLength / Float32Array.BYTES_PER_ELEMENT),
  );
  const spectrum = analyzeSpectrum(samples, audioSampleRate);
  const fileStats = await stat(filePath);

  return {
    bytes: fileStats.size,
    duration: round(Number(probeData.format?.duration) || samples.length / audioSampleRate, 3),
    sampleRate: Number(audioStream.sample_rate) || audioSampleRate,
    channels: Number(audioStream.channels) || 1,
    waveform: buildWaveform(samples, waveformBinCount),
    spectralCentroid: Math.round(spectrum.centroid),
    frequencyBand: spectrum.band,
    frequencyColor: spectrum.color,
    bandEnergy: spectrum.bandEnergy,
  };
}

function buildWaveform(samples, binCount) {
  if (!samples.length) return Array(binCount).fill(0.04);
  const bins = [];
  let maximum = 0;
  for (let bin = 0; bin < binCount; bin += 1) {
    const start = Math.floor((bin / binCount) * samples.length);
    const end = Math.max(Math.floor(((bin + 1) / binCount) * samples.length), start + 1);
    let sumSquares = 0;
    for (let index = start; index < end; index += 1) sumSquares += samples[index] ** 2;
    const rms = Math.sqrt(sumSquares / Math.max(end - start, 1));
    bins.push(rms);
    maximum = Math.max(maximum, rms);
  }
  return bins.map((value) => round(Math.max(value / Math.max(maximum, 0.000001), 0.035), 3));
}

function analyzeSpectrum(samples, sampleRate) {
  const windowCount = Math.min(12, Math.max(Math.floor(samples.length / fftSize), 1));
  const bandPower = [0, 0, 0];
  let weightedFrequency = 0;
  let magnitudeTotal = 0;

  for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
    const maximumStart = Math.max(samples.length - fftSize, 0);
    const start = windowCount === 1 ? 0 : Math.floor((windowIndex / (windowCount - 1)) * maximumStart);
    const magnitudes = fftMagnitudes(samples, start, fftSize);
    for (let bin = 1; bin < magnitudes.length; bin += 1) {
      const frequency = (bin * sampleRate) / fftSize;
      const magnitude = magnitudes[bin];
      const power = magnitude * magnitude;
      weightedFrequency += frequency * magnitude;
      magnitudeTotal += magnitude;
      if (frequency < 250) bandPower[0] += power;
      else if (frequency < 2000) bandPower[1] += power;
      else bandPower[2] += power;
    }
  }

  const centroid = magnitudeTotal ? weightedFrequency / magnitudeTotal : 0;
  const totalPower = bandPower.reduce((sum, value) => sum + value, 0) || 1;
  const bandEnergy = {
    low: round(bandPower[0] / totalPower, 3),
    mid: round(bandPower[1] / totalPower, 3),
    high: round(bandPower[2] / totalPower, 3),
  };
  const band = centroid < 500 ? "low" : centroid < 2200 ? "mid" : "high";
  const normalizedFrequency = clamp(
    (Math.log2(Math.max(centroid, 80)) - Math.log2(80)) / (Math.log2(6500) - Math.log2(80)),
    0,
    1,
  );
  const hue = Math.round(185 + normalizedFrequency * 150);

  return {
    centroid,
    band,
    color: `hsl(${hue} 78% 60%)`,
    bandEnergy,
  };
}

function fftMagnitudes(samples, start, size) {
  const real = new Float64Array(size);
  const imaginary = new Float64Array(size);
  for (let index = 0; index < size; index += 1) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * index) / (size - 1)));
    real[index] = (samples[start + index] || 0) * window;
  }

  for (let index = 1, reversed = 0; index < size; index += 1) {
    let bit = size >> 1;
    for (; reversed & bit; bit >>= 1) reversed ^= bit;
    reversed ^= bit;
    if (index < reversed) {
      [real[index], real[reversed]] = [real[reversed], real[index]];
      [imaginary[index], imaginary[reversed]] = [imaginary[reversed], imaginary[index]];
    }
  }

  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let startIndex = 0; startIndex < size; startIndex += length) {
      let phaseReal = 1;
      let phaseImaginary = 0;
      for (let offset = 0; offset < length / 2; offset += 1) {
        const evenIndex = startIndex + offset;
        const oddIndex = evenIndex + length / 2;
        const oddReal = real[oddIndex] * phaseReal - imaginary[oddIndex] * phaseImaginary;
        const oddImaginary = real[oddIndex] * phaseImaginary + imaginary[oddIndex] * phaseReal;
        real[oddIndex] = real[evenIndex] - oddReal;
        imaginary[oddIndex] = imaginary[evenIndex] - oddImaginary;
        real[evenIndex] += oddReal;
        imaginary[evenIndex] += oddImaginary;
        const nextPhaseReal = phaseReal * cosine - phaseImaginary * sine;
        phaseImaginary = phaseReal * sine + phaseImaginary * cosine;
        phaseReal = nextPhaseReal;
      }
    }
  }

  const magnitudes = new Float64Array(size / 2);
  for (let index = 0; index < magnitudes.length; index += 1) {
    magnitudes[index] = Math.hypot(real[index], imaginary[index]);
  }
  return magnitudes;
}

function chooseDefaultAnimation(animations) {
  const preferred = animations.find((animation) => /idle.*loop|idle/i.test(animation.name));
  return preferred?.name || animations[0]?.name || null;
}

function humanize(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizeSound(value) {
  return humanize(value)
    .replace(/^Soundfx\s*/i, "")
    .replace(/^Ksfx\s*/i, "")
    .trim();
}

function slugify(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toWebPath(...parts) {
  return parts.join("/");
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

await main();
