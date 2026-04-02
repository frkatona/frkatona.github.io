#!/usr/bin/env node

// npm run portfolio:check
// npm run portfolio:sync
// npm run portfolio:sync:clean


const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT_DIR = process.cwd();
const PORTFOLIO_DIR = path.join(ROOT_DIR, "assets", "images", "portfolio");
const THUMBS_DIR = path.join(PORTFOLIO_DIR, "thumbs");
const MANIFEST_PATH = path.join(PORTFOLIO_DIR, "manifest.json");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const THUMBNAIL_FORMAT = "webp";

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

main().catch((error) => {
  console.error(`Portfolio sync failed: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  ensurePortfolioLayout();

  const report = {
    promotedOriginals: [],
    migratedSidecars: [],
    migratedThumbs: [],
    createdSidecars: [],
    generatedThumbs: [],
    staleThumbs: [],
    staleSidecars: [],
    removedThumbs: [],
    removedSidecars: [],
    invalidSidecars: [],
    manifestUpdated: false,
  };

  const originalManifest = readJsonIfExists(MANIFEST_PATH);
  const plannedMoves = {
    sidecars: new Set(),
    thumbs: new Set(),
  };

  const promotedOriginals = promoteMisplacedOriginals(report);
  const images = listPortfolioImages(promotedOriginals);
  const imagesByStem = groupImagesByStem(images);
  const manifestItems = [];

  for (const fileName of images) {
    const imagePath = resolveImagePath(fileName);
    const expectedSidecarPath = getExpectedSidecarPath(fileName);
    const expectedThumbPath = getExpectedThumbPath(fileName);
    const legacySidecarPath = getLegacySidecarPath(fileName);

    const hasSidecarAfterSync = maybeMigrateLegacySidecar(fileName, imagesByStem, report, plannedMoves);
    const hasThumbAfterSync = maybeMigrateLegacyThumb(fileName, imagesByStem, report, plannedMoves);

    if (!fs.existsSync(expectedSidecarPath) && !hasSidecarAfterSync) {
      createSidecar(fileName, expectedSidecarPath, report);
    } else {
      const sidecarPathToValidate = fs.existsSync(expectedSidecarPath)
        ? expectedSidecarPath
        : hasSidecarAfterSync && fs.existsSync(legacySidecarPath)
          ? legacySidecarPath
          : null;

      if (sidecarPathToValidate && !isValidJsonFile(sidecarPathToValidate)) {
        report.invalidSidecars.push(path.basename(sidecarPathToValidate));
      }
    }

    if (shouldGenerateThumbnail(imagePath, expectedThumbPath, hasThumbAfterSync)) {
      await generateThumbnail(imagePath, expectedThumbPath);
      report.generatedThumbs.push(path.relative(ROOT_DIR, expectedThumbPath));
    }

    const dimensions = await getImageDimensions(imagePath);
    manifestItems.push({
      fileName,
      metadataFileName: path.basename(expectedSidecarPath),
      thumbnailFileName: toPosixPath(path.relative(PORTFOLIO_DIR, expectedThumbPath)),
      width: dimensions.width,
      height: dimensions.height,
    });
  }

  manifestItems.sort((left, right) =>
    left.fileName.localeCompare(right.fileName, undefined, { numeric: true, sensitivity: "base" })
  );

  report.staleThumbs = findStaleThumbs(images, plannedMoves);
  report.staleSidecars = findStaleSidecars(images, plannedMoves);

  if (options.pruneStale) {
    pruneStaleFiles(report);
  }

  const manifestPayload = {
    generatedAt: new Date().toISOString().slice(0, 10),
    thumbnailMaxDimension: options.maxDimension,
    thumbnailFormat: THUMBNAIL_FORMAT,
    items: manifestItems,
  };

  if (manifestNeedsUpdate(originalManifest, manifestPayload)) {
    if (!options.check) {
      writeJson(MANIFEST_PATH, manifestPayload);
    }

    report.manifestUpdated = true;
  }

  printSummary(images.length, report);
}

function parseArgs(args) {
  const parsed = {
    check: false,
    force: false,
    pruneStale: false,
    maxDimension: 1400,
    quality: 82,
    help: false,
  };

  for (const arg of args) {
    if (arg === "--check") {
      parsed.check = true;
      continue;
    }

    if (arg === "--force") {
      parsed.force = true;
      continue;
    }

    if (arg === "--prune-stale") {
      parsed.pruneStale = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg.startsWith("--max-dimension=")) {
      parsed.maxDimension = parsePositiveInteger(arg.split("=")[1], "max dimension");
      continue;
    }

    if (arg.startsWith("--quality=")) {
      parsed.quality = parsePositiveInteger(arg.split("=")[1], "quality");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage: node scripts/sync-portfolio.js [options]

Syncs assets/images/portfolio by:
- promoting misplaced original files out of thumbs/
- migrating legacy sidecar/thumb names when possible
- generating missing or outdated WebP thumbnails
- creating placeholder sidecars for new originals
- rebuilding manifest.json from the actual originals

Options:
  --check                 Report planned changes without writing files
  --force                 Regenerate thumbnails even if they already exist
  --prune-stale           Remove orphaned thumbnails and orphaned sidecars
  --max-dimension=1400    Long edge of generated thumbnails
  --quality=82            WebP quality for generated thumbnails
  --help, -h              Show this help text
`);
}

function ensurePortfolioLayout() {
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    throw new Error(`Couldn't find portfolio directory at ${PORTFOLIO_DIR}`);
  }

  if (!fs.existsSync(THUMBS_DIR) && !options.check) {
    fs.mkdirSync(THUMBS_DIR, { recursive: true });
  }
}

function promoteMisplacedOriginals(report) {
  if (!fs.existsSync(THUMBS_DIR)) {
    return [];
  }

  const entries = fs
    .readdirSync(THUMBS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMisplacedOriginalThumbFile(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));

  for (const fileName of entries) {
    const sourcePath = path.join(THUMBS_DIR, fileName);
    const destinationPath = path.join(PORTFOLIO_DIR, fileName);

    if (fs.existsSync(destinationPath)) {
      console.warn(
        `Skipping misplaced original ${fileName} because ${path.relative(
          ROOT_DIR,
          destinationPath
        )} already exists.`
      );
      continue;
    }

    if (!options.check) {
      fs.renameSync(sourcePath, destinationPath);
    }

    report.promotedOriginals.push(fileName);
  }

  return entries.filter((fileName) => {
    const destinationPath = path.join(PORTFOLIO_DIR, fileName);
    return !fs.existsSync(destinationPath);
  });
}

function listPortfolioImages(extraImages = []) {
  const images = fs
    .readdirSync(PORTFOLIO_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isPortfolioImage(entry.name))
    .map((entry) => entry.name)
    .concat(extraImages);

  return [...new Set(images)].sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
  );
}

function groupImagesByStem(images) {
  const grouped = new Map();

  for (const fileName of images) {
    const stem = path.parse(fileName).name;
    const list = grouped.get(stem) || [];
    list.push(fileName);
    grouped.set(stem, list);
  }

  return grouped;
}

function isPortfolioImage(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function isGeneratedThumbName(fileName) {
  return /\.(png|jpe?g|webp|avif)\.webp$/i.test(fileName);
}

function isMisplacedOriginalThumbFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();

  if (!IMAGE_EXTENSIONS.has(ext)) {
    return false;
  }

  return !isGeneratedThumbName(fileName);
}

function getExpectedSidecarPath(fileName) {
  return path.join(PORTFOLIO_DIR, `${fileName}.json`);
}

function getLegacySidecarPath(fileName) {
  return path.join(PORTFOLIO_DIR, `${path.parse(fileName).name}.json`);
}

function getExpectedThumbPath(fileName) {
  return path.join(THUMBS_DIR, `${fileName}.webp`);
}

function getLegacyThumbPath(fileName) {
  return path.join(THUMBS_DIR, `${path.parse(fileName).name}.webp`);
}

function maybeMigrateLegacySidecar(fileName, imagesByStem, report, plannedMoves) {
  const expectedPath = getExpectedSidecarPath(fileName);

  if (fs.existsSync(expectedPath)) {
    return true;
  }

  const legacyPath = getLegacySidecarPath(fileName);
  const matches = imagesByStem.get(path.parse(fileName).name) || [];

  if (!fs.existsSync(legacyPath) || matches.length !== 1 || legacyPath === expectedPath) {
    return false;
  }

  if (!options.check) {
    fs.renameSync(legacyPath, expectedPath);
  }

  plannedMoves.sidecars.add(path.basename(legacyPath));

  report.migratedSidecars.push({
    from: path.relative(ROOT_DIR, legacyPath),
    to: path.relative(ROOT_DIR, expectedPath),
  });

  return true;
}

function maybeMigrateLegacyThumb(fileName, imagesByStem, report, plannedMoves) {
  const expectedPath = getExpectedThumbPath(fileName);

  if (fs.existsSync(expectedPath)) {
    return true;
  }

  const legacyPath = getLegacyThumbPath(fileName);
  const matches = imagesByStem.get(path.parse(fileName).name) || [];

  if (!fs.existsSync(legacyPath) || matches.length !== 1 || legacyPath === expectedPath) {
    return false;
  }

  if (!options.check) {
    fs.renameSync(legacyPath, expectedPath);
  }

  plannedMoves.thumbs.add(path.basename(legacyPath));

  report.migratedThumbs.push({
    from: path.relative(ROOT_DIR, legacyPath),
    to: path.relative(ROOT_DIR, expectedPath),
  });

  return true;
}

function createSidecar(fileName, sidecarPath, report) {
  const payload = buildPlaceholderSidecar(fileName);

  if (!options.check) {
    writeJson(sidecarPath, payload);
  }

  report.createdSidecars.push(path.relative(ROOT_DIR, sidecarPath));
}

function buildPlaceholderSidecar(fileName) {
  const title = deriveTitle(fileName);
  const captureDate = inferCaptureDate(fileName) || null;

  return {
    title,
    description: `Placeholder description for ${title}. Update this sidecar with a real caption when ready.`,
    tags: derivePlaceholderTags(fileName),
    captureDate,
    featured: false,
    status: "placeholder",
  };
}

function derivePlaceholderTags(fileName) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const withoutDate = stem.replace(/^\d{4}-\d{2}(?:-\d{2})?[_-]?/, "");
  const normalized = withoutDate
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2");

  const tokens = normalized
    .split(/[_\-\s]+/)
    .map((token) => normalizeTagValue(token))
    .filter((token) => token && !/^\d+$/.test(token));

  return [...new Set(["placeholder-uncurated", ...tokens.slice(0, 4)])];
}

function normalizeTagValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
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

  return (
    normalized
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
      .join(" ") || stem
  );
}

function shouldGenerateThumbnail(imagePath, thumbPath, hasThumbAfterSync = false) {
  if (hasThumbAfterSync) {
    return false;
  }

  if (options.force || !fs.existsSync(thumbPath)) {
    return true;
  }

  const imageStat = fs.statSync(imagePath);
  const thumbStat = fs.statSync(thumbPath);
  return thumbStat.mtimeMs < imageStat.mtimeMs;
}

async function generateThumbnail(imagePath, thumbPath) {
  if (options.check) {
    return;
  }

  if (!fs.existsSync(THUMBS_DIR)) {
    fs.mkdirSync(THUMBS_DIR, { recursive: true });
  }

  await sharp(imagePath)
    .rotate()
    .resize({
      width: options.maxDimension,
      height: options.maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: options.quality })
    .toFile(thumbPath);
}

async function getImageDimensions(imagePath) {
  const metadata = await sharp(imagePath).metadata();
  let width = metadata.width || null;
  let height = metadata.height || null;

  if (metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8) {
    [width, height] = [height, width];
  }

  return { width, height };
}

function findStaleThumbs(images, plannedMoves) {
  if (!fs.existsSync(THUMBS_DIR)) {
    return [];
  }

  const expectedThumbs = new Set(images.map((fileName) => `${fileName}.webp`));

  return fs
    .readdirSync(THUMBS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => !expectedThumbs.has(fileName))
    .filter((fileName) => !plannedMoves.thumbs.has(fileName))
    .filter((fileName) => !isMisplacedOriginalThumbFile(fileName))
    .map((fileName) => path.relative(ROOT_DIR, path.join(THUMBS_DIR, fileName)))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));
}

function findStaleSidecars(images, plannedMoves) {
  const expectedSidecars = new Set(images.map((fileName) => `${fileName}.json`));

  return fs
    .readdirSync(PORTFOLIO_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .filter((fileName) => fileName !== "manifest.json")
    .filter((fileName) => !expectedSidecars.has(fileName))
    .filter((fileName) => !plannedMoves.sidecars.has(fileName))
    .map((fileName) => path.relative(ROOT_DIR, path.join(PORTFOLIO_DIR, fileName)))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));
}

function pruneStaleFiles(report) {
  for (const relativePath of report.staleThumbs) {
    const absolutePath = path.join(ROOT_DIR, relativePath);

    if (!options.check) {
      fs.unlinkSync(absolutePath);
    }

    report.removedThumbs.push(relativePath);
  }

  for (const relativePath of report.staleSidecars) {
    const absolutePath = path.join(ROOT_DIR, relativePath);

    if (!options.check) {
      fs.unlinkSync(absolutePath);
    }

    report.removedSidecars.push(relativePath);
  }
}

function manifestNeedsUpdate(existingManifest, nextManifest) {
  if (!existingManifest) {
    return true;
  }

  const comparableCurrent = {
    thumbnailMaxDimension: existingManifest.thumbnailMaxDimension,
    thumbnailFormat: existingManifest.thumbnailFormat,
    items: existingManifest.items || [],
  };

  const comparableNext = {
    thumbnailMaxDimension: nextManifest.thumbnailMaxDimension,
    thumbnailFormat: nextManifest.thumbnailFormat,
    items: nextManifest.items,
  };

  return JSON.stringify(comparableCurrent) !== JSON.stringify(comparableNext);
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = stripBom(fs.readFileSync(filePath, "utf8"));
  return JSON.parse(raw);
}

function resolveImagePath(fileName) {
  const rootPath = path.join(PORTFOLIO_DIR, fileName);

  if (fs.existsSync(rootPath)) {
    return rootPath;
  }

  const thumbsPath = path.join(THUMBS_DIR, fileName);

  if (fs.existsSync(thumbsPath)) {
    return thumbsPath;
  }

  throw new Error(`Couldn't find source image for ${fileName}`);
}

function isValidJsonFile(filePath) {
  try {
    readJsonIfExists(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function stripBom(content) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toPosixPath(value) {
  return value.replaceAll(path.sep, "/");
}

function printSummary(imageCount, report) {
  const modeLabel = options.check ? "Check complete" : "Sync complete";
  console.log(`\n${modeLabel}: ${imageCount} portfolio image${imageCount === 1 ? "" : "s"} scanned.\n`);

  printFileList("Promoted misplaced originals", report.promotedOriginals);
  printMoveList("Migrated sidecars", report.migratedSidecars);
  printMoveList("Migrated legacy thumbs", report.migratedThumbs);
  printFileList("Created sidecars", report.createdSidecars);
  printFileList("Generated thumbnails", report.generatedThumbs);
  printFileList("Invalid sidecars", report.invalidSidecars);
  printFileList("Stale thumbnails", report.staleThumbs);
  printFileList("Stale sidecars", report.staleSidecars);
  printFileList("Removed stale thumbnails", report.removedThumbs);
  printFileList("Removed stale sidecars", report.removedSidecars);

  console.log(`Manifest ${report.manifestUpdated ? options.check ? "would be updated" : "updated" : "already up to date"}.`);

  if (!options.check && (report.staleThumbs.length || report.staleSidecars.length) && !options.pruneStale) {
    console.log("Tip: run again with --prune-stale to remove orphaned thumbnails and sidecars.");
  }
}

function printFileList(label, values) {
  if (!values.length) {
    console.log(`${label}: none`);
    return;
  }

  console.log(`${label}:`);
  for (const value of values) {
    console.log(`  - ${value}`);
  }
}

function printMoveList(label, moves) {
  if (!moves.length) {
    console.log(`${label}: none`);
    return;
  }

  console.log(`${label}:`);
  for (const move of moves) {
    console.log(`  - ${move.from} -> ${move.to}`);
  }
}
