// Shared helpers for the real, server-backed reviews feature (data/reviews.json
// on the server, via /api/reviews) — used by both the homepage preview list
// and the full reviews.html page.
export async function fetchReviews(page = 1, limit = 20) {
  const res = await fetch(`/api/reviews?page=${page}&limit=${limit}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed to load reviews (${res.status})`);
  return data;
}

export async function submitReview({ name, rating, text, website }) {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rating, text, website }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed to submit review (${res.status})`);
  return data.review;
}

export function escapeHtml(s) {
  return (s ?? "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function starsHtml(rating) {
  return `<span class="review-stars-display" aria-label="${rating} out of 5 stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>`;
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
  const h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  const d = Math.floor(h / 24);
  if (d < 30) return d + (d === 1 ? " day ago" : " days ago");
  const mo = Math.floor(d / 30);
  if (mo < 12) return mo + (mo === 1 ? " month ago" : " months ago");
  const y = Math.floor(mo / 12);
  return y + (y === 1 ? " year ago" : " years ago");
}

export function reviewCardHtml(r) {
  return `
    <div class="review-item">
      <div class="review-avatar">${escapeHtml(r.name).trim().charAt(0).toUpperCase() || "?"}</div>
      <div class="review-body">
        <div class="review-head">
          <span class="review-name">${escapeHtml(r.name)}</span>
          <span class="review-time">· ${timeAgo(r.createdAt)}</span>
        </div>
        ${starsHtml(r.rating)}
        <div class="review-text">${escapeHtml(r.text)}</div>
      </div>
    </div>`;
}
