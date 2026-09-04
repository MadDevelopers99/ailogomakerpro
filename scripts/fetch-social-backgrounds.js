// One-time downloader: pulls textless texture/gradient/photo backgrounds for the
// Social Media Maker from the Pexels API, grouped by generic theme (not by
// platform, since the same theme photo works for a Facebook Cover or an
// Instagram Post alike). Saves under assets/social-backgrounds/<theme>/.
// Run once, not at runtime — the deployed site never calls Pexels itself.
//
// Usage: node --env-file=.env scripts/fetch-social-backgrounds.js
const fs = require("fs");
const path = require("path");
const https = require("https");

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error("Missing PEXELS_API_KEY. Run with: node --env-file=.env scripts/fetch-social-backgrounds.js");
  process.exit(1);
}

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "social-backgrounds");

const THEME_QUERIES = {
  abstract: ["abstract gradient background", "colorful abstract shapes background"],
  minimal: ["minimal pastel background", "clean minimal texture background"],
  business: ["modern office blurred background", "corporate gradient background"],
  nature: ["forest sunlight background", "mountain landscape background"],
  food: ["coffee shop table background", "fresh food flatlay background"],
  fitness: ["gym equipment background blur", "outdoor running path background"],
  travel: ["tropical beach background", "city skyline sunset background"],
  gaming: ["neon lights background", "dark tech circuit background"],
  party: ["party lights bokeh background", "concert stage lights background"],
  fashion: ["pastel studio background", "silk fabric texture background"],
};

function get(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location, headers));
      }
      if (res.statusCode !== 200) {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body.slice(0, 200)}`)));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function searchPexels(query, perPage) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const buf = await get(url, { Authorization: API_KEY });
  return JSON.parse(buf.toString("utf8"));
}

async function run() {
  const only = process.argv[2] ? process.argv.slice(2) : Object.keys(THEME_QUERIES);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const theme of only) {
    const queries = THEME_QUERIES[theme];
    if (!queries) { console.log("skip (no queries defined):", theme); continue; }
    const themeDir = path.join(OUT_DIR, theme);
    fs.mkdirSync(themeDir, { recursive: true });

    let n = 1;
    for (const q of queries) {
      console.log(`[${theme}] searching: "${q}"`);
      let data;
      try {
        data = await searchPexels(q, 3);
      } catch (err) {
        console.error(`  ERROR searching "${q}":`, err.message);
        continue;
      }
      for (const photo of data.photos || []) {
        const src = photo.src.large;
        const outFile = path.join(themeDir, `${theme}-${n}.jpg`);
        try {
          const buf = await get(src, {});
          fs.writeFileSync(outFile, buf);
          console.log(`  saved ${outFile} (by ${photo.photographer}, ${photo.url})`);
          n++;
        } catch (err) {
          console.error(`  ERROR downloading ${src}:`, err.message);
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  console.log("Done.");
}

run();
