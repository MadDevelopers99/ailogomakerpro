// One-off batch script: extracts REAL dominant colors from each logo asset's
// actual pixels (not guessed/fabricated) via sharp, ignoring transparent and
// near-white/near-black canvas pixels so the result reflects the logo's own
// ink colors. Writes data/logo-colors.json keyed by logo id: ["#hex", "#hex"].
//
// Run: node scripts/extract-logo-colors.js [--limit N] [--start N]
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const logos = require(path.join(ROOT, "data", "logos.json"));
const OUT_FILE = path.join(ROOT, "data", "logo-colors.json");
const SAMPLE = 20; // resize to SAMPLE x SAMPLE before sampling pixels

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const startArg = args.indexOf("--start");
const LIMIT = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : logos.length;
const START = startArg >= 0 ? parseInt(args[startArg + 1], 10) : 0;

function toHex(r, g, b) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

async function dominantColors(filePath) {
  const { data, info } = await sharp(filePath)
    .resize(SAMPLE, SAMPLE, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 120) continue; // transparent
    const isNearWhite = r > 235 && g > 235 && b > 235;
    const isNearBlack = r < 20 && g < 20 && b < 20;
    if (isNearWhite || isNearBlack) continue;
    // Quantize to reduce noise from anti-aliasing gradients (clamp — rounding
    // near 255 can otherwise overflow to 264+ and produce invalid hex).
    const q = (v) => Math.min(255, Math.round(v / 24) * 24);
    const qr = q(r), qg = q(g), qb = q(b);
    const key = `${qr},${qg},${qb}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  if (buckets.size === 0) return []; // fully transparent/white-black asset

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 2).map(([key]) => {
    const [r, g, b] = key.split(",").map(Number);
    return toHex(r, g, b);
  });
}

async function main() {
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch {}

  const slice = logos.slice(START, START + LIMIT);
  let done = 0, skipped = 0, failed = 0;
  const t0 = Date.now();

  for (const logo of slice) {
    if (existing[logo.id]) { skipped++; continue; }
    try {
      const filePath = path.join(ROOT, logo.image);
      existing[logo.id] = await dominantColors(filePath);
      done++;
    } catch (err) {
      failed++;
      existing[logo.id] = [];
    }
    if ((done + skipped + failed) % 500 === 0) {
      fs.writeFileSync(OUT_FILE, JSON.stringify(existing));
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`progress: ${done + skipped + failed}/${slice.length} (done ${done}, skipped ${skipped}, failed ${failed}) — ${elapsed}s`);
    }
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(existing));
  console.log(`\nFinished: ${done} extracted, ${skipped} already existed, ${failed} failed. Total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

main();
