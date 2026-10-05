// Production equivalent of server.js's /api/ai-generate route. Same prompt
// logic (lib/groq.js) so local dev and production can never drift.
const { buildPrompt, callGroq } = require("../../lib/groq.js");
const { createRateLimiter } = require("../../lib/rate-limit.js");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const isRateLimited = createRateLimiter(12, 60_000);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const ip = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
  if (isRateLimited(ip)) {
    return { statusCode: 429, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Too many requests — please wait a minute and try again." }) };
  }
  if (!GROQ_API_KEY) {
    return { statusCode: 503, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "AI features aren't configured yet on this server." }) };
  }

  try {
    const { task, input } = JSON.parse(event.body || "{}");
    const prompt = buildPrompt(task, input || {});
    const result = await callGroq(prompt, GROQ_API_KEY);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: err.message }) };
  }
};
