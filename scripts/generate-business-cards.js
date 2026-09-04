// Generates 100+ business card templates per category by recombining the 6
// distinct hand-authored layout skeletons (from the original business_card_001..006
// designs) across color themes and backgrounds (6 photo textures + 3 solid colors
// per category, from data/card-backgrounds.json). Writes one JSON file per
// category under data/business-cards/ (kept small so the gallery/editor only
// fetch the category actually being viewed) plus a lightweight
// data/business-cards-meta.json index for the chip row.
//
// Usage: node scripts/generate-business-cards.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname + "/..";
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "business-cards.json"), "utf8"));
const BACKGROUNDS = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "card-backgrounds.json"), "utf8"));

const CANVAS = { width: 1050, height: 600, unit: "px" };
const SAFE_AREA = { left: 35, top: 35, right: 35, bottom: 35 };
const EDITABLE_FIELDS = ["name", "job_title", "company", "phone", "email", "website", "address", "tagline", "logo_mark", "qr_placeholder"];
const EXPORT = { formats: ["PNG", "JPG", "PDF"], defaultDpi: 300 };

// The 6 distinct layout skeletons live in the original hand-authored templates.
const SKELETON_IDS = ["business_card_001", "business_card_002", "business_card_003", "business_card_004", "business_card_005", "business_card_006"];
const SKELETONS = SKELETON_IDS.map((id) => SEED.templates.find((t) => t.id === id).elements);

const NEUTRAL_SOLID = "#101010";

function recolorElements(elements, theme, useImageBg) {
  return elements.map((raw) => {
    const el = JSON.parse(JSON.stringify(raw));
    if (el.id === "bg_shape_1") {
      el.color = theme.bg;
      el.visible = !useImageBg;
    } else if (el.id === "qr_bg") {
      el.color = "#FFFFFF";
    } else if (el.id === "logo_circle") {
      el.color = theme.primary;
    } else if (el.id === "panel_1") {
      el.color = theme.accent;
    } else if (el.type === "shape") {
      el.color = theme.primary;
    } else if (el.type === "icon") {
      el.color = theme.primary;
    } else if (el.id === "logo_mark") {
      el.color = theme.bg;
    } else if (el.id === "qr_placeholder") {
      el.color = theme.bg;
    } else if (el.id === "tagline" || el.id === "job_title") {
      el.color = theme.primary;
    } else if (el.type === "text") {
      el.color = theme.secondary;
    }
    return el;
  });
}

function buildTemplate({ id, name, category, skeleton, theme, background, content }) {
  const elements = recolorElements(skeleton, theme, background.type === "image");
  const company = elements.find((e) => e.id === "company");
  const job = elements.find((e) => e.id === "job_title");
  const mark = elements.find((e) => e.id === "logo_mark");
  if (company) company.text = content.company;
  if (job) job.text = content.job;
  if (mark) mark.text = content.company.trim().charAt(0).toUpperCase();

  return {
    id,
    name,
    category,
    premium: false,
    orientation: "landscape",
    canvas: CANVAS,
    safeArea: SAFE_AREA,
    background,
    theme: { primary: theme.primary, secondary: theme.secondary, accent: theme.accent },
    elements,
    editableFields: EDITABLE_FIELDS,
    export: EXPORT,
  };
}

// slug -> { label, themes:[{primary,secondary,accent,bg}, ...2], companies:[...4], jobs:[...4] }
const CATEGORY_DATA = {
  business: {
    label: "Business",
    themes: [
      { primary: "#D9A441", secondary: "#FFFFFF", accent: "#1D3557", bg: "#081A33" },
      { primary: "#4A90D9", secondary: "#FFFFFF", accent: "#12233F", bg: "#0E1E33" },
    ],
    companies: ["APEX CONSULTING GROUP", "STERLING BUSINESS PARTNERS", "BRIGHTPATH ADVISORS", "NORTHGATE ENTERPRISES"],
    jobs: ["Business Consultant", "Managing Director", "Operations Manager", "Strategy Advisor"],
  },
  corporate: {
    label: "Corporate",
    themes: [
      { primary: "#E2AD4F", secondary: "#F5F5F5", accent: "#25252A", bg: "#0B0B0D" },
      { primary: "#C9A0DC", secondary: "#F5F5F5", accent: "#3A2E40", bg: "#151018" },
    ],
    companies: ["VANTAGE CORPORATE GROUP", "BLACKROCK & ASSOCIATES", "PINNACLE HOLDINGS", "MERIDIAN CORPORATE"],
    jobs: ["Chief Executive Officer", "Corporate Director", "VP of Operations", "Senior Executive"],
  },
  creative: {
    label: "Creative",
    themes: [
      { primary: "#2EA8FF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#0B2A5B" },
      { primary: "#FF6FA5", secondary: "#FFFFFF", accent: "#3A0CA3", bg: "#1B0942" },
    ],
    companies: ["PIXELCRAFT STUDIO", "BRIGHT IDEAS CREATIVE", "INKWELL DESIGN CO.", "STUDIO NORTH"],
    jobs: ["Creative Director", "Graphic Designer", "Art Director", "Brand Strategist"],
  },
  modern: {
    label: "Modern",
    themes: [
      { primary: "#50C878", secondary: "#FFFFFF", accent: "#B7E4C7", bg: "#073B32" },
      { primary: "#00C2CB", secondary: "#FFFFFF", accent: "#0E3D3F", bg: "#062B2D" },
    ],
    companies: ["NEXUS TECH SOLUTIONS", "ORBIT DIGITAL", "VERTEX SOFTWARE", "STREAMLINE APPS"],
    jobs: ["Software Engineer", "Product Manager", "UX Designer", "Technical Lead"],
  },
  luxury: {
    label: "Luxury",
    themes: [
      { primary: "#D9A441", secondary: "#FFFFFF", accent: "#7A1F35", bg: "#3B0D18" },
      { primary: "#C9A961", secondary: "#F5F1E8", accent: "#1A1A1A", bg: "#0D0D0D" },
    ],
    companies: ["THE ROYAL COLLECTION", "GILDED HOUSE", "OPULENCE ESTATES", "AURELIA GROUP"],
    jobs: ["Managing Partner", "Private Client Advisor", "Concierge Director", "Brand Ambassador"],
  },
  "real-estate": {
    label: "Real Estate",
    themes: [
      { primary: "#D9A441", secondary: "#FFFFFF", accent: "#1D3557", bg: "#1D3557" },
      { primary: "#6FAE8C", secondary: "#FFFFFF", accent: "#1F3B2E", bg: "#122019" },
    ],
    companies: ["PRIME REALTY GROUP", "SKYLINE PROPERTIES", "HARBOR VIEW REALTY", "GOLDEN KEY ESTATES"],
    jobs: ["Real Estate Agent", "Property Consultant", "Realtor", "Leasing Manager"],
  },
  photography: {
    label: "Photography",
    themes: [
      { primary: "#2EA8FF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#0B2A5B" },
      { primary: "#8AB6D6", secondary: "#FFFFFF", accent: "#16324F", bg: "#0A1B2B" },
    ],
    companies: ["LENS & LIGHT STUDIO", "SILVERFRAME PHOTOGRAPHY", "APERTURE STUDIOS", "MOMENT CAPTURE CO."],
    jobs: ["Photographer", "Creative Director", "Studio Owner", "Visual Artist"],
  },
  restaurant: {
    label: "Restaurant",
    themes: [
      { primary: "#E8A33D", secondary: "#FFFFFF", accent: "#3B2412", bg: "#2A1810" },
      { primary: "#C97B3D", secondary: "#FDF6EC", accent: "#4A2E1A", bg: "#241209" },
    ],
    companies: ["THE OAK TABLE", "HARVEST KITCHEN", "COPPER SPOON BISTRO", "THE GATHERING TABLE"],
    jobs: ["Restaurant Owner", "Executive Chef", "General Manager", "Head Chef"],
  },
  bakery: {
    label: "Bakery",
    themes: [
      { primary: "#E88AA6", secondary: "#FFFFFF", accent: "#5A3825", bg: "#3D2618" },
      { primary: "#F2B5C4", secondary: "#FFF8F3", accent: "#6B4423", bg: "#2E1B10" },
    ],
    companies: ["SWEET CRUMBS BAKERY", "GOLDEN WHISK BAKERY", "BUTTER & BLOOM", "THE FLOUR MILL"],
    jobs: ["Pastry Chef", "Bakery Owner", "Head Baker", "Cake Designer"],
  },
  beauty: {
    label: "Beauty",
    themes: [
      { primary: "#E88AA6", secondary: "#FFFFFF", accent: "#7A3B52", bg: "#4A1F30" },
      { primary: "#D9B3D9", secondary: "#FFFFFF", accent: "#5C2E52", bg: "#2E1530" },
    ],
    companies: ["GLOW BEAUTY BAR", "BLUSH & CO. STUDIO", "LUMIERE BEAUTY", "PURE ESSENCE SALON"],
    jobs: ["Beauty Consultant", "Makeup Artist", "Salon Owner", "Esthetician"],
  },
  construction: {
    label: "Construction",
    themes: [
      { primary: "#E8752D", secondary: "#FFFFFF", accent: "#2A2A2A", bg: "#1A1A1A" },
      { primary: "#F2C230", secondary: "#FFFFFF", accent: "#3A3A3A", bg: "#0F0F0F" },
    ],
    companies: ["IRONCORE BUILDERS", "SUMMIT CONSTRUCTION CO.", "BEDROCK CONTRACTING", "STEELFRAME BUILDERS"],
    jobs: ["Construction Manager", "General Contractor", "Site Supervisor", "Project Engineer"],
  },
  lawyer: {
    label: "Lawyer",
    themes: [
      { primary: "#D9A441", secondary: "#FFFFFF", accent: "#0B1A2E", bg: "#0B1A2E" },
      { primary: "#B0B8C1", secondary: "#FFFFFF", accent: "#1C2530", bg: "#10151C" },
    ],
    companies: ["STERLING & PARTNERS LAW", "MERIDIAN LEGAL GROUP", "BLACKWELL LAW FIRM", "ASHFORD & ASSOCIATES"],
    jobs: ["Attorney at Law", "Managing Partner", "Legal Counsel", "Senior Associate"],
  },
};

const OUT_DIR = path.join(ROOT, "data", "business-cards");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PREVIEW_PER_CATEGORY = 2;
const meta = { categories: [], preview: [] };
let grandTotal = 0;

for (const [slug, cfg] of Object.entries(CATEGORY_DATA)) {
  const photos = BACKGROUNDS[slug] || [];
  const backgroundOptions = [
    ...photos.map((src) => ({ type: "image", src })),
    { type: "solid", color: cfg.themes[0].bg },
    { type: "solid", color: cfg.themes[1].bg },
    { type: "solid", color: NEUTRAL_SOLID },
  ];

  const templates = [];
  let seq = 1;
  let contentIdx = 0;
  for (let s = 0; s < SKELETONS.length; s++) {
    for (let b = 0; b < backgroundOptions.length; b++) {
      for (let th = 0; th < cfg.themes.length; th++) {
        const content = { company: cfg.companies[contentIdx % cfg.companies.length], job: cfg.jobs[contentIdx % cfg.jobs.length] };
        contentIdx++;
        const id = `bcard_${slug}_${String(seq).padStart(3, "0")}`;
        const name = `${cfg.label} Business Card ${String(seq).padStart(3, "0")}`;
        templates.push(
          buildTemplate({
            id,
            name,
            category: cfg.label,
            skeleton: SKELETONS[s],
            theme: cfg.themes[th],
            background: { ...backgroundOptions[b] },
            content,
          })
        );
        seq++;
      }
    }
  }

  const filePath = path.join(OUT_DIR, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ schemaVersion: "1.0", category: cfg.label, templates }, null, 2) + "\n");
  meta.categories.push({ slug, label: cfg.label, count: templates.length });
  meta.preview.push(...templates.slice(0, PREVIEW_PER_CATEGORY).map((t) => ({ ...t, __slug: slug })));
  grandTotal += templates.length;
  console.log(`${slug}: ${templates.length} templates -> ${filePath}`);
}

meta.totalTemplates = grandTotal;
fs.writeFileSync(path.join(ROOT, "data", "business-cards-meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(`Total: ${grandTotal} templates across ${meta.categories.length} categories.`);
