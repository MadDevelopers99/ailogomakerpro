// Shared card color palette so a given template shows the same background
// on the gallery grid and when opened in the editor (instead of the gallery
// picking a color by grid position and the editor defaulting to white).
export const CARD_THEMES = [
  { bg: "#FFFFFF", brand: "#2563eb", slogan: "#9296ac" },
  { bg: "#F3EEFF", brand: "#7c3aed", slogan: "#a599c9" },
  { bg: "#111214", brand: "#F4D58D", slogan: "#8b8d94" },
  { bg: "#F1F2F5", brand: "#16181d", slogan: "#8b8f9c" },
  { bg: "#FFF9EC", brand: "#c2790a", slogan: "#b5a688" },
  { bg: "#FFF1E6", brand: "#ea580c", slogan: "#c2a493" },
  { bg: "#FFFFFF", brand: "#16a34a", slogan: "#9296ac" },
  { bg: "#0F1E1A", brand: "#7FE3B4", slogan: "#7c9490" },
  { bg: "#FFFFFF", brand: "#db2777", slogan: "#9296ac" },
  { bg: "#EAF1FF", brand: "#1d4ed8", slogan: "#96a7c9" },
];

// Deterministic per-id pick (a simple string hash) so the same template
// always maps to the same theme, regardless of its position in any grid.
export function themeForId(id) {
  const s = String(id || "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return CARD_THEMES[hash % CARD_THEMES.length];
}
