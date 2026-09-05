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

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);

    if (req.method === "POST" && urlPath === "/api/ai-generate") {
      return handleAiGenerate(req, res);
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
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`LogoMaker running at http://localhost:${PORT}`));
