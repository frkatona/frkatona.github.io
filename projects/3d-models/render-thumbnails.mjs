import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const requestedIds = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));

function findBlender() {
  const configured = process.env.THUMBNAIL_BLENDER_PATH;
  if (configured && existsSync(configured)) return configured;

  const command = process.platform === "win32" ? "where.exe" : "which";
  const lookup = spawnSync(command, ["blender"], { encoding: "utf8" });
  const discovered = lookup.stdout?.split(/\r?\n/).find((candidate) => existsSync(candidate));
  if (discovered) return discovered;

  const candidates = [];
  if (process.platform === "win32") {
    const root = path.join(process.env.ProgramFiles || "C:\\Program Files", "Blender Foundation");
    if (existsSync(root)) {
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const executable = path.join(root, entry.name, "blender.exe");
        if (existsSync(executable)) candidates.push(executable);
      }
    }
  } else if (process.platform === "darwin") {
    candidates.push("/Applications/Blender.app/Contents/MacOS/Blender");
  } else {
    candidates.push("/usr/bin/blender", "/usr/local/bin/blender");
  }

  const available = candidates.filter(existsSync);
  const stableReleases = available.filter((candidate) => /[\\/]Blender \d+(?:\.\d+)?[\\/]/i.test(candidate));
  return (stableReleases.length ? stableReleases : available)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
}

async function optimizeThumbnails() {
  const { default: sharp } = await import("sharp");
  const manifest = JSON.parse(readFileSync(path.join(projectDirectory, "assets", "models.json"), "utf8"));
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  let totalBytes = 0;

  const models = manifest.models.filter((model) => !requestedIds.length || requestedIds.includes(model.id));
  const missingIds = requestedIds.filter((id) => !models.some((model) => model.id === id));
  if (missingIds.length) throw new Error(`Unknown model IDs: ${missingIds.join(", ")}`);

  for (const model of models) {
    const thumbnail = path.join(projectDirectory, ...model.thumbnail.split("/"));
    const input = readFileSync(thumbnail);
    const output = await sharp(input)
      .trim({ background: transparent, threshold: 4 })
      .resize(432, 230, { fit: "contain", background: transparent })
      .extend({ top: 20, bottom: 20, left: 24, right: 24, background: transparent })
      .webp({ quality: 76, alphaQuality: 90, smartSubsample: true })
      .toBuffer();
    writeFileSync(thumbnail, output);
    totalBytes += output.length;
  }

  console.log(`Optimized ${models.length} thumbnails (${Math.round(totalBytes / 1024)} KB total).`);
}

if (!process.argv.includes("--optimize-only")) {
  const blender = findBlender();
  if (!blender) {
    console.error("Blender was not found. Set THUMBNAIL_BLENDER_PATH to its executable.");
    process.exit(1);
  }

  const result = spawnSync(
    blender,
    [
      "--background",
      "--factory-startup",
      "--python-exit-code",
      "1",
      "--python",
      path.join(projectDirectory, "render-thumbnails.py"),
      "--",
      "--project-directory",
      projectDirectory,
      ...(requestedIds.length ? ["--ids", ...requestedIds] : []),
    ],
    { stdio: "inherit" },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await optimizeThumbnails();
