// Production equivalent of server.js's /api/reviews routes (GET list + POST
// submit). Netlify Functions don't have a writable, shared local disk like a
// traditional server, so this uses Netlify Blobs (a real, persistent
// key-value store built into Netlify) instead of server.js's local JSON
// file — same data shape, same validation rules, just a different backend.
const { getStore } = require("@netlify/blobs");
const { createRateLimiter } = require("../../lib/rate-limit.js");

const STORE_NAME = "reviews";
const KEY = "all";
const isReviewRateLimited = createRateLimiter(3, 60 * 60_000);

async function readReviews(store) {
  const data = await store.get(KEY, { type: "json" });
  return Array.isArray(data) ? data : [];
}
function reviewStats(all) {
  if (!all.length) return { average: 0, count: 0 };
  const sum = all.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / all.length) * 10) / 10, count: all.length };
}

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);

  if (event.httpMethod === "GET") {
    const q = event.queryStringParameters || {};
    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(q.limit, 10) || 20));
    const all = (await readReviews(store)).sort((a, b) => b.createdAt - a.createdAt);
    const totalPages = Math.max(1, Math.ceil(all.length / limit));
    const pageItems = all.slice((page - 1) * limit, page * limit);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviews: pageItems, total: all.length, page, totalPages, ...reviewStats(all) }),
    };
  }

  if (event.httpMethod === "POST") {
    const ip = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
    if (isReviewRateLimited(ip)) {
      return { statusCode: 429, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Too many reviews submitted — please try again later." }) };
    }
    try {
      const data = JSON.parse(event.body || "{}");
      if (String(data.website || "").trim()) throw new Error("Invalid submission."); // honeypot
      const name = String(data.name || "").trim().slice(0, 60);
      const text = String(data.text || "").trim().slice(0, 600);
      const rating = Math.round(Number(data.rating));
      if (name.length < 2) throw new Error("Please enter your name.");
      if (text.length < 10) throw new Error("Please write a bit more detail in your review.");
      if (!(rating >= 1 && rating <= 5)) throw new Error("Please select a rating from 1 to 5.");

      const review = { id: "rev_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8), name, text, rating, createdAt: Date.now() };
      const all = await readReviews(store);
      all.push(review);
      await store.setJSON(KEY, all);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ review }) };
    } catch (err) {
      return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
};
