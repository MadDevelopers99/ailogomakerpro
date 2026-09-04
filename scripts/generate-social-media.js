// Generates a working set of Social Media Maker templates (covers, posts,
// profile pictures) for every platform listed in data/social-platforms.json,
// combining 2 generic layout skeletons per format group across our fetched
// theme photos (data/social-backgrounds.json) and a small set of universal
// color palettes. Writes one JSON file per platform under data/social-media/
// plus a lightweight data/social-media-meta.json index (grouped like the nav).
//
// Usage: node scripts/generate-social-media.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname + "/..";
const PLATFORMS_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "social-platforms.json"), "utf8"));
const BACKGROUNDS = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "social-backgrounds.json"), "utf8"));
const THEMES = Object.keys(BACKGROUNDS).sort();

const EXPORT = { formats: ["PNG", "JPG", "PDF"], defaultDpi: 300 };

const PALETTES = [
  { name: "Sunset Orange", primary: "#FF7A45", secondary: "#FFFFFF", accent: "#7A2E00", bg: "#331100" },
  { name: "Ocean Blue", primary: "#2EA8FF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#071B33" },
  { name: "Royal Purple", primary: "#A855F7", secondary: "#FFFFFF", accent: "#3B0764", bg: "#1E0A38" },
  { name: "Forest Green", primary: "#34D399", secondary: "#FFFFFF", accent: "#064E3B", bg: "#052E22" },
  { name: "Rose Gold", primary: "#F5A9B8", secondary: "#FFFFFF", accent: "#7A3B52", bg: "#3A1826" },
  { name: "Monochrome", primary: "#E5E5E5", secondary: "#FFFFFF", accent: "#1A1A1A", bg: "#0A0A0A" },
  { name: "Vivid Pink", primary: "#FF4D8D", secondary: "#FFFFFF", accent: "#6B0F3A", bg: "#2B0617" },
  { name: "Electric Teal", primary: "#14D6D6", secondary: "#FFFFFF", accent: "#0A3A3A", bg: "#041F1F" },
];

const CONTENT = [
  { headline: "YOUR BRAND NAME", sub: "Tagline goes here", handle: "@yourhandle" },
  { headline: "NEW ARRIVAL", sub: "Shop the latest collection", handle: "www.yoursite.com" },
  { headline: "WE ARE HIRING", sub: "Join our growing team", handle: "@yourcompany" },
  { headline: "SPECIAL OFFER", sub: "Limited time only", handle: "www.yourbrand.com" },
  { headline: "COMING SOON", sub: "Stay tuned for updates", handle: "@yourhandle" },
  { headline: "THANK YOU", sub: "For following our journey", handle: "@yourhandle" },
];

function round(n) { return Math.round(n * 100) / 100; }

// ---- Layout skeletons (element positions as fractions of canvas w/h) ----

function coverElements(w, h, variant) {
  const barH = round(h * 0.025);
  const circleD = round(h * 0.34);
  if (variant === "center") {
    const circleX = round(w / 2 - circleD / 2);
    return [
      { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000000", rotation: 0, opacity: 1, editable: true },
      { id: "accent_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: barH, color: "#000000", rotation: 0, opacity: 1, editable: true },
      { id: "logo_circle", type: "shape", shape: "circle", x: circleX, y: round(h * 0.14), width: circleD, height: circleD, color: "#000000", rotation: 0, opacity: 1, editable: true },
      { id: "logo_mark", type: "text", text: "B", x: round(w / 2), y: round(h * 0.14 + circleD / 2 + h * 0.05), fontSize: round(h * 0.14), fontFamily: "Poppins", color: "#000000", align: "center", bold: true, editable: true },
      { id: "headline", type: "text", text: "", x: round(w / 2), y: round(h * 0.62), fontSize: round(h * 0.12), fontFamily: "Poppins", color: "#000000", align: "center", bold: true, editable: true },
      { id: "subheadline", type: "text", text: "", x: round(w / 2), y: round(h * 0.72), fontSize: round(h * 0.05), fontFamily: "Poppins", color: "#000000", align: "center", bold: false, editable: true },
      { id: "handle", type: "text", text: "", x: round(w / 2), y: round(h * 0.88), fontSize: round(h * 0.042), fontFamily: "Poppins", color: "#000000", align: "center", bold: false, editable: true },
    ];
  }
  const circleX = round(w * 0.035);
  const textX = round(circleX + circleD + w * 0.03);
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000000", rotation: 0, opacity: 1, editable: true },
    { id: "accent_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: barH, color: "#000000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: circleX, y: round(h * 0.28), width: circleD, height: circleD, color: "#000000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: round(circleX + circleD / 2), y: round(h * 0.28 + circleD / 2 + h * 0.05), fontSize: round(h * 0.14), fontFamily: "Poppins", color: "#000000", align: "center", bold: true, editable: true },
    { id: "headline", type: "text", text: "", x: textX, y: round(h * 0.52), fontSize: round(h * 0.12), fontFamily: "Poppins", color: "#000000", align: "left", bold: true, editable: true },
    { id: "subheadline", type: "text", text: "", x: textX, y: round(h * 0.64), fontSize: round(h * 0.05), fontFamily: "Poppins", color: "#000000", align: "left", bold: false, editable: true },
    { id: "handle", type: "text", text: "", x: textX, y: round(h * 0.85), fontSize: round(h * 0.042), fontFamily: "Poppins", color: "#000000", align: "left", bold: false, editable: true },
  ];
}

function postElements(w, h, variant) {
  const circleD = round(w * 0.18);
  if (variant === "left") {
    return [
      { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000000", rotation: 0, opacity: 1, editable: true },
      { id: "deco_circle_1", type: "shape", shape: "circle", x: round(w * 0.65), y: round(-h * 0.1), width: round(w * 0.5), height: round(w * 0.5), color: "#000000", rotation: 0, opacity: 0.16, editable: true },
      { id: "logo_circle", type: "shape", shape: "circle", x: round(w * 0.08), y: round(h * 0.06), width: circleD, height: circleD, color: "#000000", rotation: 0, opacity: 1, editable: true },
      { id: "logo_mark", type: "text", text: "B", x: round(w * 0.08 + circleD / 2), y: round(h * 0.06 + circleD / 2 + w * 0.03), fontSize: round(w * 0.09), fontFamily: "Poppins", color: "#000000", align: "center", bold: true, editable: true },
      { id: "headline", type: "text", text: "", x: round(w * 0.08), y: round(h * 0.5), fontSize: round(w * 0.085), fontFamily: "Poppins", color: "#000000", align: "left", bold: true, editable: true },
      { id: "subheadline", type: "text", text: "", x: round(w * 0.08), y: round(h * 0.58), fontSize: round(w * 0.038), fontFamily: "Poppins", color: "#000000", align: "left", bold: false, editable: true },
      { id: "handle", type: "text", text: "", x: round(w * 0.08), y: round(h * 0.92), fontSize: round(w * 0.032), fontFamily: "Poppins", color: "#000000", align: "left", bold: false, editable: true },
    ];
  }
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000000", rotation: 0, opacity: 1, editable: true },
    { id: "deco_circle_1", type: "shape", shape: "circle", x: round(-w * 0.15), y: round(-h * 0.12), width: round(w * 0.5), height: round(w * 0.5), color: "#000000", rotation: 0, opacity: 0.16, editable: true },
    { id: "deco_circle_2", type: "shape", shape: "circle", x: round(w * 0.7), y: round(h * 0.78), width: round(w * 0.45), height: round(w * 0.45), color: "#000000", rotation: 0, opacity: 0.13, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: round(w / 2 - circleD / 2), y: round(h * 0.08), width: circleD, height: circleD, color: "#000000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: round(w / 2), y: round(h * 0.08 + circleD / 2 + w * 0.03), fontSize: round(w * 0.09), fontFamily: "Poppins", color: "#000000", align: "center", bold: true, editable: true },
    { id: "headline", type: "text", text: "", x: round(w / 2), y: round(h * 0.48), fontSize: round(w * 0.09), fontFamily: "Poppins", color: "#000000", align: "center", bold: true, editable: true },
    { id: "subheadline", type: "text", text: "", x: round(w / 2), y: round(h * 0.55), fontSize: round(w * 0.04), fontFamily: "Poppins", color: "#000000", align: "center", bold: false, editable: true },
    { id: "handle", type: "text", text: "", x: round(w / 2), y: round(h * 0.9), fontSize: round(w * 0.035), fontFamily: "Poppins", color: "#000000", align: "center", bold: false, editable: true },
  ];
}

function profileElements(w, h) {
  const d = round(Math.min(w, h) * 0.8);
  const x = round((w - d) / 2);
  const y = round((h - d) / 2);
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x, y, width: d, height: d, color: "#000000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: round(w / 2), y: round(h / 2 + Math.min(w, h) * 0.12), fontSize: round(Math.min(w, h) * 0.34), fontFamily: "Poppins", color: "#000000", align: "center", bold: true, editable: true },
  ];
}

function recolor(elements, theme, useImageBg) {
  return elements.map((raw) => {
    const el = { ...raw };
    if (el.id === "bg_shape_1") {
      el.color = theme.bg;
      el.visible = !useImageBg;
    } else if (el.id === "logo_circle") {
      el.color = theme.primary;
    } else if (el.id === "logo_mark") {
      el.color = theme.bg;
    } else if (el.type === "shape") {
      el.color = theme.primary;
    } else if (el.id === "headline") {
      el.color = theme.secondary;
    } else if (el.id === "subheadline" || el.id === "handle") {
      el.color = theme.primary;
    }
    return el;
  });
}

function buildTemplate({ id, name, platform, elements, theme, background, content }) {
  const els = recolor(elements, theme, background.type === "image");
  const headline = els.find((e) => e.id === "headline");
  const sub = els.find((e) => e.id === "subheadline");
  const handle = els.find((e) => e.id === "handle");
  const mark = els.find((e) => e.id === "logo_mark");
  if (headline) headline.text = content.headline;
  if (sub) sub.text = content.sub;
  if (handle) handle.text = content.handle;
  if (mark) mark.text = content.headline.trim().charAt(0).toUpperCase();

  const editableFields = els.filter((e) => e.type === "text").map((e) => e.id);

  return {
    id,
    name,
    platform: platform.slug,
    category: platform.label,
    group: platform.group,
    premium: false,
    canvas: { width: platform.width, height: platform.height, unit: "px" },
    background,
    theme: { primary: theme.primary, secondary: theme.secondary, accent: theme.accent },
    elements: els,
    editableFields,
    export: EXPORT,
  };
}

function pickThemes(startIdx, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(THEMES[(startIdx + i) % THEMES.length]);
  return out;
}

function backgroundOptionsFor(platformIdx, theme1, theme2) {
  const photoThemes = pickThemes(platformIdx, 6);
  const photos = photoThemes.map((t, i) => ({ type: "image", src: BACKGROUNDS[t][i % BACKGROUNDS[t].length] }));
  return [...photos, { type: "solid", color: theme1.bg }, { type: "solid", color: theme2.bg }];
}

const OUT_DIR = path.join(ROOT, "data", "social-media");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PREVIEW_PER_PLATFORM = 1;
const meta = { groups: PLATFORMS_DATA.groups, platforms: [], preview: [] };
let grandTotal = 0;

PLATFORMS_DATA.platforms.forEach((platform, pIdx) => {
  const palettes = [PALETTES[pIdx % PALETTES.length], PALETTES[(pIdx + 3) % PALETTES.length], PALETTES[(pIdx + 5) % PALETTES.length]];
  const backgrounds = backgroundOptionsFor(pIdx, palettes[0], palettes[1]);

  let skeletonFn, variants;
  if (platform.group === "covers") { skeletonFn = coverElements; variants = ["left", "center"]; }
  else if (platform.group === "posts") { skeletonFn = postElements; variants = ["center", "left"]; }
  else { skeletonFn = () => profileElements(platform.width, platform.height); variants = [null]; }

  const templates = [];
  let seq = 1;
  let contentIdx = 0;
  const paletteSet = platform.group === "profile-pictures" ? palettes : palettes.slice(0, 2);

  for (const variant of variants) {
    for (const bg of backgrounds) {
      for (const theme of paletteSet) {
        const content = CONTENT[contentIdx % CONTENT.length];
        contentIdx++;
        const baseElements = platform.group === "profile-pictures" ? skeletonFn() : skeletonFn(platform.width, platform.height, variant);
        const id = `social_${platform.slug}_${String(seq).padStart(3, "0")}`;
        const name = `${platform.label} ${String(seq).padStart(3, "0")}`;
        templates.push(buildTemplate({ id, name, platform, elements: baseElements, theme, background: { ...bg }, content }));
        seq++;
      }
    }
  }

  const filePath = path.join(OUT_DIR, `${platform.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ schemaVersion: "1.0", platform: platform.slug, category: platform.label, templates }, null, 2) + "\n");
  meta.platforms.push({ slug: platform.slug, label: platform.label, group: platform.group, width: platform.width, height: platform.height, count: templates.length });
  meta.preview.push(...templates.slice(0, PREVIEW_PER_PLATFORM).map((t) => ({ ...t, __slug: platform.slug })));
  grandTotal += templates.length;
  console.log(`${platform.slug}: ${templates.length} templates -> ${filePath}`);
});

meta.totalTemplates = grandTotal;
fs.writeFileSync(path.join(ROOT, "data", "social-media-meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(`Total: ${grandTotal} templates across ${meta.platforms.length} platforms.`);
