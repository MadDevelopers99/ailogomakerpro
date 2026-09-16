// Simple static file server for local preview + a single AI proxy route.
// Run: node server.js  (or node --env-file=.env server.js locally so
// GROQ_API_KEY is available; on Railway, set GROQ_API_KEY as a real
// environment variable in the project dashboard — never in code).
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5500;
const ROOT = __dirname;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "openai/gpt-oss-120b";
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

// ---- Minimal in-memory rate limiter: protects the shared free API key from
// being drained by bots/abuse. Per-IP sliding window, resets on restart. ----
const RATE_LIMIT = 12; // requests
const RATE_WINDOW_MS = 60_000; // per minute
const hits = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE_LIMIT;
}

// ---- Reviews: stored as a JSON file on disk. NOTE: on Railway this needs a
// persistent Volume mounted over the data/ directory, otherwise the file
// resets to empty on every redeploy since the container filesystem is
// ephemeral. ----
const REVIEWS_FILE = path.join(ROOT, "data", "reviews.json");
const REVIEW_RATE_LIMIT = 3; // posts
const REVIEW_RATE_WINDOW_MS = 60 * 60_000; // per hour
const reviewHits = new Map();
function isReviewRateLimited(ip) {
  const now = Date.now();
  const arr = (reviewHits.get(ip) || []).filter((t) => now - t < REVIEW_RATE_WINDOW_MS);
  arr.push(now);
  reviewHits.set(ip, arr);
  return arr.length > REVIEW_RATE_LIMIT;
}
function readReviews() {
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8"));
  } catch {
    return [];
  }
}
function writeReviews(list) {
  fs.mkdirSync(path.dirname(REVIEWS_FILE), { recursive: true });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(list, null, 2));
}

// ---- SEO: injects real AggregateRating (+ individual Review) structured
// data into index.html / reviews.html at request time, computed from actual
// submitted reviews. Omitted entirely when there are zero reviews, since a
// fabricated or zero-count rating is invalid per schema.org/Google guidance. ----
function aggregateRatingBlock(reviews) {
  if (!reviews.length) return "";
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const ratingValue = Math.round((sum / reviews.length) * 10) / 10;
  return `,"aggregateRating":${JSON.stringify({ "@type": "AggregateRating", ratingValue, reviewCount: reviews.length, bestRating: 5, worstRating: 1 })}`;
}
function reviewListBlock(reviews, limit) {
  if (!reviews.length) return "";
  const items = reviews.slice(0, limit).map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.name },
    reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    reviewBody: r.text,
    datePublished: new Date(r.createdAt).toISOString().slice(0, 10),
  }));
  return `,"review":${JSON.stringify(items)}`;
}
function injectReviewSchema(html, urlPath) {
  const reviews = readReviews().sort((a, b) => b.createdAt - a.createdAt);
  const block = urlPath === "/reviews.html"
    ? aggregateRatingBlock(reviews) + reviewListBlock(reviews, 20)
    : aggregateRatingBlock(reviews);
  return html.replace("<!--AGGREGATE_RATING-->", block);
}

function handleReviewsGet(req, res, query) {
  const page = Math.max(1, parseInt(query.get("page"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.get("limit"), 10) || 20));
  const all = readReviews().sort((a, b) => b.createdAt - a.createdAt);
  const totalPages = Math.max(1, Math.ceil(all.length / limit));
  const pageItems = all.slice((page - 1) * limit, page * limit);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ reviews: pageItems, total: all.length, page, totalPages }));
}

function handleReviewsPost(req, res) {
  const ip = req.socket.remoteAddress || "unknown";
  if (isReviewRateLimited(ip)) {
    res.writeHead(429, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Too many reviews submitted — please try again later." }));
  }
  let body = "";
  req.on("data", (c) => { body += c; if (body.length > 5_000) req.destroy(); });
  req.on("end", () => {
    try {
      const data = JSON.parse(body || "{}");
      if (String(data.website || "").trim()) throw new Error("Invalid submission."); // honeypot
      const name = String(data.name || "").trim().slice(0, 60);
      const text = String(data.text || "").trim().slice(0, 600);
      const rating = Math.round(Number(data.rating));
      if (name.length < 2) throw new Error("Please enter your name.");
      if (text.length < 10) throw new Error("Please write a bit more detail in your review.");
      if (!(rating >= 1 && rating <= 5)) throw new Error("Please select a rating from 1 to 5.");

      const review = {
        id: "rev_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        name,
        text,
        rating,
        createdAt: Date.now(),
      };
      const all = readReviews();
      all.push(review);
      writeReviews(all);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ review }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// ---- Task -> prompt builder. Keeps prompt construction server-side so the
// client only ever sends a task name + short user input, never a raw prompt. ----
function buildPrompt(task, input) {
  const biz = String(input?.description || "").slice(0, 300).trim();
  const industry = String(input?.industry || "").slice(0, 60).trim();
  const fields = Array.isArray(input?.fields) ? input.fields.slice(0, 12) : [];
  const keywords = String(input?.keywords || "").slice(0, 120).trim();

  if (task === "business-names") {
    return `You are a branding expert. A user is starting a business described as: "${biz}"${industry ? ` (industry: ${industry})` : ""}.
Generate 8 short, brandable business name ideas with a matching 4-6 word tagline for each.
Respond with ONLY valid JSON, no markdown, no commentary, in this exact shape:
{"names":[{"name":"...","tagline":"..."}]}`;
  }
  if (task === "domain-names") {
    return `A user wants domain name ideas for a business described as: "${biz}"${industry ? ` (industry: ${industry})` : ""}.${keywords ? ` Try to incorporate or relate to these keywords where natural: ${keywords}.` : ""}
Suggest 10 short, brandable, likely-available-sounding domain name ideas (just the name part, no TLD, lowercase, no spaces or special characters, use hyphens only if truly needed).
Respond with ONLY valid JSON, no markdown, no commentary, in this exact shape:
{"domains":["example","example-two"]}`;
  }
  if (task === "template-copy") {
    const fieldList = fields.length ? fields.join(", ") : "headline, subheadline, company, tagline";
    return `A user is creating a ${String(input?.contentType || "design").slice(0, 40)} for a business described as: "${biz}"${industry ? ` (industry: ${industry})` : ""}.
Write short, punchy marketing copy for these text fields: ${fieldList}.
Keep each value short and realistic for the field name (e.g. "company" is a business name, "headline" is a short punchy phrase, "phone"/"email"/"website"/"address" should be left as sensible realistic-looking placeholders since we don't know the real ones).
Respond with ONLY valid JSON, no markdown, no commentary, mapping each field name to its text value, in this exact shape:
{"fields":{"<fieldName>":"<value>", ...}}`;
  }
  throw new Error("Unknown task");
}

function callGroq(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You are a helpful branding and copywriting assistant. Always respond with ONLY valid JSON matching the requested shape — no markdown fences, no extra text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });
    const reqOpts = {
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      timeout: 20000,
    };
    const r = https.request(reqOpts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error(`Groq API error ${res.statusCode}: ${body.slice(0, 300)}`));
        try {
          const parsed = JSON.parse(body);
          const text = parsed.choices?.[0]?.message?.content;
          if (!text) return reject(new Error("No content in AI response"));
          resolve(JSON.parse(text));
        } catch (err) {
          reject(new Error("Failed to parse AI response: " + err.message));
        }
      });
    });
    r.on("error", reject);
    r.on("timeout", () => r.destroy(new Error("AI request timed out")));
    r.write(payload);
    r.end();
  });
}

function handleAiGenerate(req, res) {
  const ip = req.socket.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    res.writeHead(429, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Too many requests — please wait a minute and try again." }));
  }
  if (!GROQ_API_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "AI features aren't configured yet on this server." }));
  }
  let body = "";
  req.on("data", (c) => { body += c; if (body.length > 10_000) req.destroy(); });
  req.on("end", async () => {
    try {
      const { task, input } = JSON.parse(body || "{}");
      const prompt = buildPrompt(task, input || {});
      const result = await callGroq(prompt);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// ---- Live stock-photo search: proxies Pexels so the API key stays
// server-side (the client only ever sends a search term). Used by editor
// background pickers to show real, relevant photos beyond the pre-fetched
// curated sets. ----
const IMAGE_SEARCH_RATE_LIMIT = 30; // requests
const IMAGE_SEARCH_RATE_WINDOW_MS = 60_000; // per minute
const imageSearchHits = new Map();
function isImageSearchRateLimited(ip) {
  const now = Date.now();
  const arr = (imageSearchHits.get(ip) || []).filter((t) => now - t < IMAGE_SEARCH_RATE_WINDOW_MS);
  arr.push(now);
  imageSearchHits.set(ip, arr);
  return arr.length > IMAGE_SEARCH_RATE_LIMIT;
}
function callPexels(query, perPage) {
  return new Promise((resolve, reject) => {
    const reqPath = `/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
    const req = https.request({
      hostname: "api.pexels.com",
      path: reqPath,
      method: "GET",
      headers: { Authorization: PEXELS_API_KEY },
      timeout: 15000,
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error(`Pexels ${res.statusCode}: ${body.slice(0, 200)}`));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("Pexels request timed out")));
    req.end();
  });
}
function handleImageSearch(req, res, query) {
  const ip = req.socket.remoteAddress || "unknown";
  if (isImageSearchRateLimited(ip)) {
    res.writeHead(429, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Too many searches — please wait a minute and try again." }));
  }
  if (!PEXELS_API_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Photo search isn't configured yet on this server." }));
  }
  const q = String(query.get("q") || "").trim().slice(0, 100);
  if (!q) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Missing search query." }));
  }
  callPexels(q, 24)
    .then((data) => {
      const photos = (data.photos || []).map((p) => ({
        id: p.id,
        thumb: p.src.medium,
        full: p.src.large2x || p.src.large,
        alt: p.alt || q,
        photographer: p.photographer,
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ photos }));
    })
    .catch((err) => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    });
}

http
  .createServer((req, res) => {
    const [rawPath, rawQuery] = req.url.split("?");
    const urlPath = decodeURIComponent(rawPath);

    if (req.method === "POST" && urlPath === "/api/ai-generate") {
      return handleAiGenerate(req, res);
    }
    if (req.method === "GET" && urlPath === "/api/reviews") {
      return handleReviewsGet(req, res, new URLSearchParams(rawQuery || ""));
    }
    if (req.method === "POST" && urlPath === "/api/reviews") {
      return handleReviewsPost(req, res);
    }
    if (req.method === "GET" && urlPath === "/api/image-search") {
      return handleImageSearch(req, res, new URLSearchParams(rawQuery || ""));
    }

    let filePath = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("404 Not Found: " + urlPath);
      }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream",
      });
      if (urlPath === "/" || urlPath === "/index.html" || urlPath === "/reviews.html") {
        return res.end(injectReviewSchema(data.toString("utf8"), urlPath === "/" ? "/index.html" : urlPath));
      }
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`LogoMaker running at http://localhost:${PORT}`));
