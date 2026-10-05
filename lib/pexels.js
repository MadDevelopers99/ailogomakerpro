// Shared Pexels search proxy logic — used by both server.js (local dev) and
// the production Netlify Function (netlify/functions/image-search.js).
const https = require("https");

function searchPexels(query, apiKey, perPage = 24) {
  return new Promise((resolve, reject) => {
    const reqPath = `/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
    const req = https.request({
      hostname: "api.pexels.com",
      path: reqPath,
      method: "GET",
      headers: { Authorization: apiKey },
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

function toPhotos(pexelsData) {
  return (pexelsData.photos || []).map((p) => ({
    id: p.id,
    thumb: p.src.medium,
    full: p.src.large2x || p.src.large,
    alt: p.alt || "",
    photographer: p.photographer,
  }));
}

module.exports = { searchPexels, toPhotos };
