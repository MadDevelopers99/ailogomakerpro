// Minimal in-memory sliding-window rate limiter, shared by server.js and the
// Netlify Functions. On serverless, this only protects within a single warm
// container's lifetime (not a hard guarantee across cold starts or multiple
// concurrent instances) — a best-effort safety net, not a strict limiter.
function createRateLimiter(limit, windowMs) {
  const hits = new Map();
  return function isRateLimited(key) {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(key, arr);
    return arr.length > limit;
  };
}

module.exports = { createRateLimiter };
