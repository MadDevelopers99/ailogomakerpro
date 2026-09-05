// Thin client for the server-side AI proxy (/api/ai-generate). The actual
// API key lives only on the server (Railway env var) — this module never
// sees it. Each call sends a task name + short structured input; the server
// builds the real prompt and calls the AI provider.
export async function aiGenerate(task, input) {
  const res = await fetch("/api/ai-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, input }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `AI request failed (${res.status})`);
  }
  return data;
}
