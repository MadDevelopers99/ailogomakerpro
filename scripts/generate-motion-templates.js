// Hand-authored motion templates for Animations (short square/story clips)
// and Videos (widescreen intro-style clips). Reuses the exact business-card
// element vocabulary + the render-card.js animation extension (el.animation),
// and reuses existing QC'd background photos — no new fetching needed.
// Usage: node scripts/generate-motion-templates.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname + "/..";
const SOCIAL_BG = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "social-backgrounds.json"), "utf8"));
const CARD_BG = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "card-backgrounds.json"), "utf8"));

const EXPORT = { formats: ["WEBM"], defaultDpi: 300 };

function circleAnim(delay) { return { type: "zoom", delay, duration: 500 }; }
function fadeAnim(delay, duration = 450) { return { type: "fade", delay, duration }; }
function slideUpAnim(delay, duration = 550) { return { type: "slide-up", delay, duration }; }

// ---- Animations: square 1080x1080, ~2.4s ----
function animationElements(theme, content, bgSrc) {
  const w = 1080, h = 1080;
  const circleD = 190;
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: theme.bg, rotation: 0, opacity: 1, editable: true, visible: !bgSrc, animation: fadeAnim(0, 300) },
    { id: "deco_circle_1", type: "shape", shape: "circle", x: -160, y: -130, width: 540, height: 540, color: theme.primary, rotation: 0, opacity: 0.16, editable: true, animation: circleAnim(0) },
    { id: "deco_circle_2", type: "shape", shape: "circle", x: 756, y: 842, width: 486, height: 486, color: theme.primary, rotation: 0, opacity: 0.13, editable: true, animation: circleAnim(150) },
    { id: "logo_circle", type: "shape", shape: "circle", x: w / 2 - circleD / 2, y: 110, width: circleD, height: circleD, color: theme.primary, rotation: 0, opacity: 1, editable: true, animation: circleAnim(150) },
    { id: "logo_mark", type: "text", text: content.mark, x: w / 2, y: 110 + circleD / 2 + 35, fontSize: 96, fontFamily: "Poppins", color: theme.bg, align: "center", bold: true, editable: true, animation: fadeAnim(350, 350) },
    { id: "headline", type: "text", text: content.headline, x: w / 2, y: 540, fontSize: 96, maxWidth: w * 0.86, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: true, editable: true, animation: slideUpAnim(550) },
    { id: "subheadline", type: "text", text: content.subheadline, x: w / 2, y: 610, fontSize: 42, maxWidth: w * 0.8, fontFamily: "Poppins", color: theme.primary, align: "center", bold: false, editable: true, animation: fadeAnim(950) },
    { id: "handle", type: "text", text: content.handle, x: w / 2, y: 960, fontSize: 36, maxWidth: w * 0.8, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: false, editable: true, animation: fadeAnim(1250) },
  ];
}

// ---- Videos: widescreen 1280x720, ~4.2s, more spaced-out sequence ----
function videoElements(theme, content, bgSrc) {
  const w = 1280, h = 720;
  const circleD = 120;
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: theme.bg, rotation: 0, opacity: 1, editable: true, visible: !bgSrc, animation: fadeAnim(0, 400) },
    { id: "logo_circle", type: "shape", shape: "circle", x: w / 2 - circleD / 2, y: 90, width: circleD, height: circleD, color: theme.primary, rotation: 0, opacity: 1, editable: true, animation: circleAnim(150) },
    { id: "logo_mark", type: "text", text: content.mark, x: w / 2, y: 90 + circleD / 2 + 22, fontSize: 56, fontFamily: "Poppins", color: theme.bg, align: "center", bold: true, editable: true, animation: fadeAnim(400, 350) },
    { id: "headline", type: "text", text: content.headline, x: w / 2, y: 380, fontSize: 72, maxWidth: w * 0.82, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: true, editable: true, animation: slideUpAnim(750) },
    { id: "subheadline", type: "text", text: content.subheadline, x: w / 2, y: 440, fontSize: 30, maxWidth: w * 0.76, fontFamily: "Poppins", color: theme.primary, align: "center", bold: false, editable: true, animation: fadeAnim(1300) },
    { id: "handle", type: "text", text: content.handle, x: w / 2, y: 640, fontSize: 26, maxWidth: w * 0.7, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: false, editable: true, animation: fadeAnim(1750) },
  ];
}

const PALETTES = [
  { primary: "#6C5CE7", secondary: "#FFFFFF", accent: "#0F0B29", bg: "#0F0B29" },
  { primary: "#2EA8FF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#0B2A5B" },
  { primary: "#FF4D8D", secondary: "#FFFFFF", accent: "#2B0617", bg: "#2B0617" },
  { primary: "#34D399", secondary: "#FFFFFF", accent: "#073B32", bg: "#073B32" },
  { primary: "#F2C230", secondary: "#FFFFFF", accent: "#111111", bg: "#111111" },
  { primary: "#D9A441", secondary: "#FFFFFF", accent: "#0B1A2E", bg: "#0B1A2E" },
];

const ANIMATION_SET = [
  { theme: PALETTES[0], bgTheme: "abstract", bgIdx: 0, content: { mark: "N", headline: "NEW POST", subheadline: "Swipe up to see more", handle: "@yourhandle" } },
  { theme: PALETTES[1], bgTheme: "minimal", bgIdx: 1, content: { mark: "F", headline: "FOLLOW US", subheadline: "Join our growing community", handle: "@yourhandle" } },
  { theme: PALETTES[2], bgTheme: "fashion", bgIdx: 2, content: { mark: "C", headline: "COMING SOON", subheadline: "Something exciting is on the way", handle: "www.yourbrand.com" } },
  { theme: PALETTES[3], bgTheme: "party", bgIdx: 0, content: { mark: "S", headline: "SALE ENDS SOON", subheadline: "Don't miss out — shop now", handle: "www.yourbrand.com" } },
  { theme: PALETTES[4], bgTheme: "gaming", bgIdx: 1, content: { mark: "S", headline: "SUBSCRIBE NOW", subheadline: "New videos every week", handle: "@yourchannel" } },
  { theme: PALETTES[5], bgTheme: "travel", bgIdx: 2, content: { mark: "J", headline: "JOIN THE JOURNEY", subheadline: "Follow along for more", handle: "@yourhandle" } },
];

const VIDEO_SET = [
  { theme: PALETTES[5], bgTheme: "business", bgIdx: 0, content: { mark: "A", headline: "WELCOME TO APEX CONSULTING", subheadline: "Strategic growth for ambitious businesses", handle: "www.apexconsulting.com" } },
  { theme: PALETTES[1], bgTheme: "corporate", bgIdx: 1, content: { mark: "S", headline: "STERLING PARTNERS", subheadline: "Management consulting you can trust", handle: "www.sterlingpartners.com" } },
  { theme: PALETTES[2], bgTheme: "restaurant", bgIdx: 0, content: { mark: "O", headline: "THE OAK TABLE", subheadline: "Seasonal cooking, warm hospitality", handle: "214 Maple Street" } },
  { theme: PALETTES[4], bgTheme: "luxury", bgIdx: 1, content: { mark: "G", headline: "GILDED HOUSE", subheadline: "Timeless elegance, modern craft", handle: "www.gildedhouse.com" } },
  { theme: PALETTES[3], bgTheme: "photography", bgIdx: 0, content: { mark: "L", headline: "LENS & LIGHT STUDIO", subheadline: "Stories told through light", handle: "@lensandlight" } },
  { theme: PALETTES[0], bgTheme: "real-estate", bgIdx: 1, content: { mark: "P", headline: "PRIME REALTY GROUP", subheadline: "Finding you home", handle: "www.primerealty.com" } },
];

function buildCategory(slug, label, set, canvas, duration, buildElements, bgLookup) {
  const templates = set.map((cfg, i) => {
    const photos = bgLookup(cfg.bgTheme);
    const bgSrc = photos && photos[cfg.bgIdx % photos.length];
    const id = `motion_${slug}_${String(i + 1).padStart(3, "0")}`;
    return {
      id,
      name: `${label} ${String(i + 1).padStart(3, "0")}`,
      category: label,
      categorySlug: slug,
      premium: false,
      canvas,
      durationMs: duration,
      background: bgSrc ? { type: "image", src: bgSrc } : { type: "solid", color: cfg.theme.bg },
      theme: { primary: cfg.theme.primary, secondary: cfg.theme.secondary, accent: cfg.theme.accent },
      elements: buildElements(cfg.theme, cfg.content, bgSrc),
      editableFields: ["logo_mark", "headline", "subheadline", "handle"],
      export: EXPORT,
    };
  });
  return templates;
}

const OUT_DIR = path.join(ROOT, "data", "motion-templates");
fs.mkdirSync(OUT_DIR, { recursive: true });

const animations = buildCategory("animations", "Animations", ANIMATION_SET, { width: 1080, height: 1080, unit: "px" }, 2400, animationElements, (t) => SOCIAL_BG[t]);
const videos = buildCategory("videos", "Videos", VIDEO_SET, { width: 1280, height: 720, unit: "px" }, 4200, videoElements, (t) => CARD_BG[t]);

fs.writeFileSync(path.join(OUT_DIR, "animations.json"), JSON.stringify({ schemaVersion: "1.0", category: "Animations", templates: animations }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT_DIR, "videos.json"), JSON.stringify({ schemaVersion: "1.0", category: "Videos", templates: videos }, null, 2) + "\n");

const meta = {
  categories: [
    { slug: "animations", label: "Animations", count: animations.length, canvas: { width: 1080, height: 1080 }, durationMs: 2400 },
    { slug: "videos", label: "Videos", count: videos.length, canvas: { width: 1280, height: 720 }, durationMs: 4200 },
  ],
  preview: [...animations.slice(0, 3).map((t) => ({ ...t, __slug: "animations" })), ...videos.slice(0, 3).map((t) => ({ ...t, __slug: "videos" }))],
  totalTemplates: animations.length + videos.length,
};
fs.writeFileSync(path.join(ROOT, "data", "motion-templates-meta.json"), JSON.stringify(meta, null, 2) + "\n");

console.log(`animations: ${animations.length} templates`);
console.log(`videos: ${videos.length} templates`);
console.log(`Total: ${meta.totalTemplates} motion templates.`);
