// One-off batch script: generates rich marketing metadata (style, keywords,
// description, brand-name examples) PER CATEGORY (60 calls), not per
// individual logo image (17,824) — real per-image visual analysis at that
// scale isn't feasible, so every logo in a category shares that category's
// genuinely-AI-written style/tag vocabulary. Real per-logo color data is
// handled separately by extract-logo-colors.js (actual pixel analysis).
//
// Run: node --env-file=.env scripts/generate-category-meta.js
const https = require("https");
const fs = require("fs");
const path = require("path");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "openai/gpt-oss-120b";
if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY not set. Run with: node --env-file=.env scripts/generate-category-meta.js");
  process.exit(1);
}

const categories = require(path.join(__dirname, "..", "data", "categories.json"));
const OUT_FILE = path.join(__dirname, "..", "data", "category-meta.json");

const STYLE_VOCAB = ["Minimal", "Modern", "Luxury", "Mascot", "Lettermark", "Monogram", "Abstract", "Badge", "Vintage", "Elegant", "Corporate", "Geometric", "Icon", "Wordmark", "Emblem"];

function callGroq(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You are a branding expert. Always respond with ONLY valid JSON matching the requested shape — no markdown fences, no extra text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });
    const req = https.request({
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), "Authorization": `Bearer ${GROQ_API_KEY}` },
      timeout: 25000,
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error(`Groq ${res.statusCode}: ${body.slice(0, 200)}`));
        try {
          const text = JSON.parse(body).choices?.[0]?.message?.content;
          resolve(JSON.parse(text));
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.write(payload);
    req.end();
  });
}

function buildPrompt(cat) {
  return `Category: "${cat.name}" (a logo design category on a logo maker website).
Generate marketing metadata for this category's logo templates. Respond with ONLY valid JSON in this exact shape:
{
  "style": "<one word/short phrase from this list: ${STYLE_VOCAB.join(", ")}>",
  "keywords": ["<8-10 relevant search keywords, lowercase>"],
  "description": "<one SEO-friendly sentence, under 140 chars, describing logos in this category>",
  "previewTone": "<one of: light, dark, warm, cool, neutral — best background tone for showcasing these logos>",
  "brandNameExamples": [
    {"name": "<short brandable name in this industry>", "tagline": "<4-6 word tagline>"},
    {"name": "...", "tagline": "..."},
    {"name": "...", "tagline": "..."},
    {"name": "...", "tagline": "..."},
    {"name": "...", "tagline": "..."}
  ]
}`;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function callGroqWithRetry(prompt, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await callGroq(prompt);
    } catch (err) {
      const isRateLimit = err.message.includes("Groq 429");
      const isBadJson = err.message.includes("json_validate_failed") || err.message.includes("Unexpected");
      if (attempt === 4 || (!isRateLimit && !isBadJson)) throw err;
      const wait = isRateLimit ? 16000 : 2000;
      console.log(`  retry ${attempt}/3 for ${label} after ${wait}ms (${isRateLimit ? "rate limit" : "bad json"})`);
      await sleep(wait);
    }
  }
}

async function main() {
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch {}

  let done = 0, skipped = 0, failed = 0;
  for (const cat of categories) {
    if (existing[cat.id]) { skipped++; continue; }
    try {
      const meta = await callGroqWithRetry(buildPrompt(cat), cat.id);
      existing[cat.id] = meta;
      done++;
      console.log(`[${done + skipped + failed}/${categories.length}] ${cat.id} -> ${meta.style} | ${meta.keywords?.slice(0, 4).join(", ")}`);
      fs.writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2));
    } catch (err) {
      failed++;
      console.error(`FAILED ${cat.id}:`, err.message);
    }
    await sleep(7000);
  }
  console.log(`\nDone: ${done} generated, ${skipped} already existed, ${failed} failed.`);
}

main();
