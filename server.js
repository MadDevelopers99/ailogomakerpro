// Simple static file server for LOCAL DEV / preview only. Production runs on
// Netlify: the same /api/* routes are implemented as Netlify Functions in
// netlify/functions/, sharing this file's prompt-building, Pexels-proxy and
// rate-limit logic via lib/. Run locally with:
//   node --env-file=.env server.js
// (so GROQ_API_KEY / PEXELS_API_KEY are available — on Netlify, set both as
// real environment variables in the site's dashboard, never in code).
const http = require("http");
const fs = require("fs");
const path = require("path");
const { buildPrompt, callGroq } = require("./lib/groq.js");
const { searchPexels, toPhotos } = require("./lib/pexels.js");
const { createRateLimiter } = require("./lib/rate-limit.js");

const PORT = process.env.PORT || 5500;
const ROOT = __dirname;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
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

// ---- AI text generation (Groq) ----
const isAiRateLimited = createRateLimiter(12, 60_000);
function handleAiGenerate(req, res) {
  const ip = req.socket.remoteAddress || "unknown";
  if (isAiRateLimited(ip)) {
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
      const result = await callGroq(prompt, GROQ_API_KEY);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// ---- Reviews: stored as a JSON file on disk for local dev. NOTE: this is
// NOT how production works — the Netlify Function version uses Netlify Blobs
// for real persistence, since serverless functions don't keep a writable,
// shared local disk. ----
const REVIEWS_FILE = path.join(ROOT, "data", "reviews.json");
const isReviewRateLimited = createRateLimiter(3, 60 * 60_000);
function readReviews() {
  try { return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8")); } catch { return []; }
}
function writeReviews(list) {
  fs.mkdirSync(path.dirname(REVIEWS_FILE), { recursive: true });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(list, null, 2));
}
function reviewStats(all) {
  if (!all.length) return { average: 0, count: 0 };
  const sum = all.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / all.length) * 10) / 10, count: all.length };
}
function handleReviewsGet(req, res, query) {
  const page = Math.max(1, parseInt(query.get("page"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.get("limit"), 10) || 20));
  const all = readReviews().sort((a, b) => b.createdAt - a.createdAt);
  const totalPages = Math.max(1, Math.ceil(all.length / limit));
  const pageItems = all.slice((page - 1) * limit, page * limit);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ reviews: pageItems, total: all.length, page, totalPages, ...reviewStats(all) }));
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

      const review = { id: "rev_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8), name, text, rating, createdAt: Date.now() };
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

// ---- Live stock-photo search (Pexels) ----
const isImageSearchRateLimited = createRateLimiter(30, 60_000);
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
  searchPexels(q, PEXELS_API_KEY, 24)
    .then((data) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ photos: toPhotos(data) }));
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

    if (req.method === "POST" && urlPath === "/api/ai-generate") return handleAiGenerate(req, res);
    if (req.method === "GET" && urlPath === "/api/reviews") return handleReviewsGet(req, res, new URLSearchParams(rawQuery || ""));
    if (req.method === "POST" && urlPath === "/api/reviews") return handleReviewsPost(req, res);
    if (req.method === "GET" && urlPath === "/api/image-search") return handleImageSearch(req, res, new URLSearchParams(rawQuery || ""));

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
      res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`LogoMaker running at http://localhost:${PORT}`));
