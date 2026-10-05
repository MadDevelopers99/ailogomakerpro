// Shared Groq prompt-building + API-calling logic, used by both the local
// dev server (server.js) and the production Netlify Function
// (netlify/functions/ai-generate.js) so the two runtimes can never drift.
const https = require("https");

const GROQ_MODEL = "openai/gpt-oss-120b";

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

function callGroq(prompt, apiKey) {
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
    const req = https.request({
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Authorization": `Bearer ${apiKey}`,
      },
      timeout: 20000,
    }, (res) => {
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
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("AI request timed out")));
    req.write(payload);
    req.end();
  });
}

module.exports = { buildPrompt, callGroq, GROQ_MODEL };
