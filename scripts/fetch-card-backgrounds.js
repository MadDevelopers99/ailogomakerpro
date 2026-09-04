// One-time downloader: pulls a handful of textless texture/gradient photos per
// business-card category from the Pexels API and saves them locally under
// assets/business-backgrounds/<category>/. Run once per batch, not at runtime —
// the deployed site never calls Pexels itself (no backend, and the API key
// must never end up in client-side JS).
//
// Usage: node --env-file=.env scripts/fetch-card-backgrounds.js
const fs = require("fs");
const path = require("path");
const https = require("https");

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error("Missing PEXELS_API_KEY. Run with: node --env-file=.env scripts/fetch-card-backgrounds.js");
  process.exit(1);
}

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "business-backgrounds");

// category slug -> [search queries]. Phrased to bias toward plain
// texture/gradient/blurred shots (no embedded text, no readable signage).
const CATEGORY_QUERIES = {
  business: ["abstract blue geometric background", "corporate gradient background"],
  corporate: ["navy marble texture background", "dark corporate gradient texture"],
  creative: ["colorful abstract paint texture", "creative gradient texture background"],
  modern: ["minimal geometric pattern background", "modern soft gradient background"],
  luxury: ["black gold marble texture", "luxury dark texture background"],
  "real-estate": ["modern architecture blurred background", "luxury interior blurred background"],
  photography: ["dark studio texture background", "bokeh lights background"],
  restaurant: ["wood table texture background", "rustic wood background blur"],
  bakery: ["pastel texture background", "warm cream texture background"],
  beauty: ["soft pink marble texture", "pastel beauty texture background"],
  construction: ["concrete texture background", "industrial metal texture background"],
  lawyer: ["dark navy marble texture", "charcoal marble texture background"],
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
  const only = process.argv[2] ? process.argv.slice(2) : Object.keys(CATEGORY_QUERIES);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const cat of only) {
    const queries = CATEGORY_QUERIES[cat];
    if (!queries) { console.log("skip (no queries defined):", cat); continue; }
    const catDir = path.join(OUT_DIR, cat);
    fs.mkdirSync(catDir, { recursive: true });

    let n = 1;
    for (const q of queries) {
      console.log(`[${cat}] searching: "${q}"`);
      let data;
      try {
        data = await searchPexels(q, 3);
      } catch (err) {
        console.error(`  ERROR searching "${q}":`, err.message);
        continue;
      }
      for (const photo of data.photos || []) {
        const src = photo.src.large; // ~940px wide, plenty for a 1050x600 card bg
        const outFile = path.join(catDir, `${cat}-${n}.jpg`);
        try {
          const buf = await get(src, {});
          fs.writeFileSync(outFile, buf);
          console.log(`  saved ${outFile} (by ${photo.photographer}, ${photo.url})`);
          n++;
        } catch (err) {
          console.error(`  ERROR downloading ${src}:`, err.message);
        }
      }
      await new Promise((r) => setTimeout(r, 300)); // gentle on rate limits
    }
  }
  console.log("Done.");
}

run();
