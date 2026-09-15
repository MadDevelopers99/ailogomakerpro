// Shared "smart template" rendering used by templates.html and the homepage's
// Trending Templates section: real per-logo colors (extracted from actual
// pixels, see scripts/extract-logo-colors.js) + category-level style/industry
// metadata (AI-generated once per category, see scripts/generate-category-meta.js).
export function esc(s) {
  return (s ?? "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function loadTemplateData() {
  const [categories, logos, categoryMeta, logoColors] = await Promise.all([
    fetch("data/categories.json").then((r) => r.json()),
    fetch("data/logos.json").then((r) => r.json()),
    fetch("data/category-meta.json").then((r) => r.json()).catch(() => ({})),
    fetch("data/logo-colors.json").then((r) => r.json()).catch(() => ({})),
  ]);
  return { categories, logos, categoryMeta, logoColors };
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function colorFamily(hex) {
  if (!hex) return null;
  const [h, s, l] = hexToHsl(hex);
  if (s < 0.12) return l > 0.85 ? "white" : "black";
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 70) return "gold";
  if (h < 160) return "green";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

export const COLOR_SWATCH = { blue: "#0866FF", black: "#111", white: "#eee", red: "#e53935", orange: "#fb8c00", gold: "#d4af37", green: "#2e7d32", purple: "#8e24aa", pink: "#ec407a" };

export function cardInfoRow(logo, { categories, categoryMeta, logoColors }) {
  const cat = categories.find((c) => c.id === logo.categoryId);
  const meta = categoryMeta[logo.categoryId];
  const colors = logoColors[logo.id] || [];
  const pills = [
    cat ? `<span class="tpl-pill">${cat.icon ? cat.icon + " " : ""}${esc(cat.name)}</span>` : "",
    meta?.style ? `<span class="tpl-pill style">${esc(meta.style)}</span>` : "",
  ].join("");
  const swatches = colors.length
    ? `<div class="tpl-swatches">${colors.map((hex) => `<span class="tpl-swatch" style="background:${hex};"></span>`).join("")}</div>`
    : "";
  if (!pills && !swatches) return "";
  return `<div class="tpl-info-row"><div class="tpl-pills">${pills}</div>${swatches}</div>`;
}

// data = { categories, categoryMeta, logoColors, themeForId, isFavorite, brandParam, popularBadge }
export function templateCardHtml(logo, data) {
  const theme = data.themeForId(logo.id);
  const fav = data.isFavorite ? data.isFavorite(logo.id) : false;
  const brandText = data.brandParam ? esc(data.brandParam.toUpperCase()) : "BRAND NAME";
  return `
    <div class="tpl-card" style="position:relative;background:${theme.bg};">
      ${data.popularBadge ? `<span class="tpl-badge">✦ Popular</span>` : ""}
      <button class="tpl-fav${fav ? " faved" : ""}" data-fav="${logo.id}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="${fav ? "#ef4444" : "none"}" stroke="${fav ? "#ef4444" : "currentColor"}" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2-.3 3.8.8 6 3.1C14.2 4.8 16 3.7 18 4c3.6.5 5.4 4 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
      </button>
      <a href="editor.html?logo=${logo.id}${data.brandParam ? "&brand=" + encodeURIComponent(data.brandParam) : ""}">
        <div class="thumb"><img src="${logo.image}" loading="lazy" alt="${esc(logo.name)}"></div>
        <div class="tpl-caption"><div class="tpl-brand" style="color:${theme.brand};">${brandText}</div><div class="tpl-slogan" style="color:${theme.slogan};">SLOGAN HERE</div></div>
        ${cardInfoRow(logo, data)}
        <span class="tpl-customize-btn">Customize →</span>
      </a>
    </div>`;
}
