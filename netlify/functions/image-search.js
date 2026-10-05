// Production equivalent of server.js's /api/image-search route.
const { searchPexels, toPhotos } = require("../../lib/pexels.js");
const { createRateLimiter } = require("../../lib/rate-limit.js");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const isRateLimited = createRateLimiter(30, 60_000);

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const ip = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
  if (isRateLimited(ip)) {
    return { statusCode: 429, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Too many searches — please wait a minute and try again." }) };
  }
  if (!PEXELS_API_KEY) {
    return { statusCode: 503, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Photo search isn't configured yet on this server." }) };
  }

  const q = String(event.queryStringParameters?.q || "").trim().slice(0, 100);
  if (!q) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Missing search query." }) };
  }

  try {
    const data = await searchPexels(q, PEXELS_API_KEY, 24);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: toPhotos(data) }) };
  } catch (err) {
    return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: err.message }) };
  }
};
