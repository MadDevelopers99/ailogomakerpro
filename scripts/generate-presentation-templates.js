// Hand-authored presentation decks (5 decks x 7 slides = 35 slides). Each
// slide reuses the exact business-card element vocabulary + renderer
// (js/render-card.js) at 1280x720 (16:9) — a presentation is just an array of
// those "print template" slides. Reuses existing QC'd background photos.
// Usage: node scripts/generate-presentation-templates.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname + "/..";
const CARD_BG = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "card-backgrounds.json"), "utf8"));

const W = 1280, H = 720;
const EXPORT = { formats: ["PNG", "PDF"], defaultDpi: 150 };

function titleSlide(theme, c, bgSrc) {
  return {
    id: "slide_title", name: "Title", canvas: { width: W, height: H, unit: "px" },
    background: bgSrc ? { type: "image", src: bgSrc } : { type: "solid", color: theme.bg },
    elements: [
      { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: W, height: H, color: theme.bg, rotation: 0, opacity: 1, editable: true, visible: !bgSrc },
      { id: "logo_circle", type: "shape", shape: "circle", x: W / 2 - 45, y: 90, width: 90, height: 90, color: theme.primary, rotation: 0, opacity: 1, editable: true },
      { id: "logo_mark", type: "text", text: c.mark, x: W / 2, y: 90 + 45 + 16, fontSize: 40, fontFamily: "Poppins", color: theme.bg, align: "center", bold: true, editable: true },
      { id: "heading", type: "text", text: c.heading, x: W / 2, y: 340, fontSize: 60, maxWidth: W * 0.82, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: true, editable: true },
      { id: "subheading", type: "text", text: c.subheading, x: W / 2, y: 390, fontSize: 24, maxWidth: W * 0.7, fontFamily: "Poppins", color: theme.primary, align: "center", bold: false, editable: true },
      { id: "presenter_line", type: "text", text: c.presenter, x: W / 2, y: 620, fontSize: 18, maxWidth: W * 0.7, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: false, editable: true },
    ],
    editableFields: ["logo_mark", "heading", "subheading", "presenter_line"],
  };
}

function agendaSlide(theme, c) {
  const rowY = (i) => 250 + i * 66;
  const els = [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: W, height: H, color: "#FFFFFF", rotation: 0, opacity: 1, editable: true },
    { id: "accent_1", type: "shape", shape: "rect", x: 0, y: 0, width: 10, height: H, color: theme.primary, rotation: 0, opacity: 1, editable: true },
    { id: "heading", type: "text", text: "Agenda", x: 90, y: 130, fontSize: 46, fontFamily: "Poppins", color: theme.accent, align: "left", bold: true, editable: true },
  ];
  c.items.forEach((item, i) => {
    els.push({ id: `item_${i + 1}`, type: "text", text: `0${i + 1}   ${item}`, x: 90, y: rowY(i), fontSize: 26, maxWidth: W - 180, fontFamily: "Poppins", color: "#22222c", align: "left", bold: false, editable: true });
  });
  return { id: "slide_agenda", name: "Agenda", canvas: { width: W, height: H, unit: "px" }, background: { type: "solid", color: "#FFFFFF" }, elements: els, editableFields: ["heading", ...c.items.map((_, i) => `item_${i + 1}`)] };
}

function contentSlide(theme, c) {
  const rowY = (i) => 260 + i * 74;
  const els = [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: W, height: H, color: "#FFFFFF", rotation: 0, opacity: 1, editable: true },
    { id: "eyebrow", type: "text", text: c.eyebrow, x: 90, y: 100, fontSize: 15, fontFamily: "Poppins", color: theme.primary, align: "left", bold: true, editable: true },
    { id: "heading", type: "text", text: c.heading, x: 90, y: 150, fontSize: 40, maxWidth: W - 180, fontFamily: "Poppins", color: theme.accent, align: "left", bold: true, editable: true },
  ];
  c.bullets.forEach((b, i) => {
    els.push({ id: `bullet_${i + 1}`, type: "text", text: `●  ${b}`, x: 90, y: rowY(i), fontSize: 22, maxWidth: W - 180, fontFamily: "Poppins", color: "#22222c", align: "left", bold: false, editable: true });
  });
  return { id: "slide_content", name: "Content", canvas: { width: W, height: H, unit: "px" }, background: { type: "solid", color: "#FFFFFF" }, elements: els, editableFields: ["heading", "eyebrow", ...c.bullets.map((_, i) => `bullet_${i + 1}`)] };
}

function imageTextSlide(theme, c, bgSrc) {
  return {
    id: "slide_image_text", name: "Image + Text", canvas: { width: W, height: H, unit: "px" },
    background: { type: "solid", color: "#FFFFFF" },
    elements: [
      { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: W, height: H, color: "#FFFFFF", rotation: 0, opacity: 1, editable: true },
      { id: "media", type: "image", x: 0, y: 0, width: W * 0.44, height: H, rotation: 0, opacity: 1, src: bgSrc, editable: false },
      { id: "eyebrow", type: "text", text: c.eyebrow, x: W * 0.44 + 80, y: 260, fontSize: 15, fontFamily: "Poppins", color: theme.primary, align: "left", bold: true, editable: true },
      { id: "heading", type: "text", text: c.heading, x: W * 0.44 + 80, y: 310, fontSize: 36, maxWidth: W * 0.5, fontFamily: "Poppins", color: theme.accent, align: "left", bold: true, editable: true },
      { id: "body", type: "text", text: c.body, x: W * 0.44 + 80, y: 370, fontSize: 20, maxWidth: W * 0.48, fontFamily: "Poppins", color: "#3a3a44", align: "left", bold: false, editable: true },
    ],
    editableFields: ["eyebrow", "heading", "body"],
  };
}

function statSlide(theme, c) {
  return {
    id: "slide_stat", name: "Stat", canvas: { width: W, height: H, unit: "px" },
    background: { type: "solid", color: theme.bg },
    elements: [
      { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: W, height: H, color: theme.bg, rotation: 0, opacity: 1, editable: true },
      { id: "stat_number", type: "text", text: c.stat, x: W / 2, y: 350, fontSize: 130, fontFamily: "Poppins", color: theme.primary, align: "center", bold: true, editable: true },
      { id: "stat_label", type: "text", text: c.label, x: W / 2, y: 410, fontSize: 26, maxWidth: W * 0.7, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: false, editable: true },
    ],
    editableFields: ["stat_number", "stat_label"],
  };
}

function teamContactSlide(theme, c) {
  const rowY = (i) => 300 + i * 60;
  const els = [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: W, height: H, color: "#FFFFFF", rotation: 0, opacity: 1, editable: true },
    { id: "heading", type: "text", text: c.heading, x: W / 2, y: 170, fontSize: 40, maxWidth: W * 0.8, fontFamily: "Poppins", color: theme.accent, align: "center", bold: true, editable: true },
  ];
  c.rows.forEach((row, i) => {
    els.push({ id: `row_${i + 1}`, type: "text", text: row, x: W / 2, y: rowY(i), fontSize: 22, maxWidth: W * 0.8, fontFamily: "Poppins", color: "#22222c", align: "center", bold: false, editable: true });
  });
  return { id: "slide_contact", name: "Contact", canvas: { width: W, height: H, unit: "px" }, background: { type: "solid", color: "#FFFFFF" }, elements: els, editableFields: ["heading", ...c.rows.map((_, i) => `row_${i + 1}`)] };
}

function thankYouSlide(theme, c, bgSrc) {
  return {
    id: "slide_thanks", name: "Thank You", canvas: { width: W, height: H, unit: "px" },
    background: bgSrc ? { type: "image", src: bgSrc } : { type: "solid", color: theme.bg },
    elements: [
      { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: W, height: H, color: theme.bg, rotation: 0, opacity: 1, editable: true, visible: !bgSrc },
      { id: "heading", type: "text", text: "Thank You", x: W / 2, y: 340, fontSize: 64, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: true, editable: true },
      { id: "contact_line", type: "text", text: c.contact, x: W / 2, y: 400, fontSize: 22, maxWidth: W * 0.7, fontFamily: "Poppins", color: theme.primary, align: "center", bold: false, editable: true },
    ],
    editableFields: ["heading", "contact_line"],
  };
}

const DECKS = [
  {
    slug: "startup-pitch", name: "Startup Pitch Deck", category: "Startup Pitch",
    theme: { primary: "#D9A441", secondary: "#FFFFFF", accent: "#0B1A2E", bg: "#0B1A2E" }, bgTheme: "business",
    content: {
      mark: "N", heading: "Northlight", subheading: "Reimagining how small teams manage projects", presenter: "Presented by Alex Rivera, Founder & CEO",
      agendaItems: ["The Problem", "Our Solution", "Market Opportunity", "Business Model", "The Team"],
      contentEyebrow: "The Problem", contentHeading: "Small teams are drowning in tool sprawl",
      bullets: ["The average team uses 6+ disconnected tools", "Context switching costs 2+ hours per day", "Critical information gets lost between apps", "Existing solutions are built for enterprises, not small teams"],
      imgEyebrow: "Our Solution", imgHeading: "One workspace for your whole team", imgBody: "Northlight brings planning, communication and files into a single, fast workspace — built specifically for teams under 20 people.",
      stat: "3.2x", statLabel: "Faster project delivery reported by early customers",
      contactHeading: "The Team", contactRows: ["Alex Rivera — Founder & CEO", "Priya Nair — Co-Founder & CTO", "Marcus Bell — Head of Design"],
      thanksContact: "alex@northlight.app · www.northlight.app",
    },
  },
  {
    slug: "portfolio-deck", name: "Portfolio Deck", category: "Portfolio",
    theme: { primary: "#FF6FA5", secondary: "#FFFFFF", accent: "#1B0942", bg: "#1B0942" }, bgTheme: "creative",
    content: {
      mark: "M", heading: "Maya Cross", subheading: "Brand & Visual Design Portfolio", presenter: "maya@mayacross.design · Austin, TX",
      agendaItems: ["About Me", "Selected Work", "Fernweh Coffee Rebrand", "Client Results", "Let's Work Together"],
      contentEyebrow: "About Me", contentHeading: "Brand designer with 8 years of experience",
      bullets: ["Worked with 40+ startups across fintech, food & wellness", "Specialize in identity systems that scale", "Previously led brand at a Series B startup", "Based in Austin, working with clients worldwide"],
      imgEyebrow: "Featured Project", imgHeading: "Fernweh Coffee Rebrand", imgBody: "A full identity refresh for a growing specialty coffee roaster — logo, packaging and a new retail experience.",
      stat: "40+", statLabel: "Brands designed for startups and small businesses",
      contactHeading: "Let's Work Together", contactRows: ["hello@mayacross.design", "www.mayacross.design", "@mayacrossdesign"],
      thanksContact: "hello@mayacross.design · www.mayacross.design",
    },
  },
  {
    slug: "sales-deck", name: "Sales Deck", category: "Sales",
    theme: { primary: "#2EA8FF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#0B2A5B" }, bgTheme: "corporate",
    content: {
      mark: "A", heading: "Apex Consulting", subheading: "Strategic growth for ambitious businesses", presenter: "Prepared for Northgate Retail · June 2026",
      agendaItems: ["Who We Are", "Your Challenge", "Our Approach", "Expected Outcomes", "Next Steps"],
      contentEyebrow: "Your Challenge", contentHeading: "Growth has outpaced your operations",
      bullets: ["Revenue has grown 3x in two years", "Internal processes haven't scaled with the business", "Leadership is spending time on operations, not strategy", "Without change, growth will stall within 12 months"],
      imgEyebrow: "Our Approach", imgHeading: "A focused 90-day engagement", imgBody: "We embed with your leadership team to redesign core operations, without disrupting day-to-day business.",
      stat: "30%", statLabel: "Average operational cost reduction across past engagements",
      contactHeading: "Next Steps", contactRows: ["Kickoff call — this week", "Discovery workshop — week 2", "Full proposal — week 3"],
      thanksContact: "hello@apexconsulting.com · +1 123 456 7890",
    },
  },
  {
    slug: "marketing-plan", name: "Marketing Plan", category: "Marketing",
    theme: { primary: "#34D399", secondary: "#FFFFFF", accent: "#073B32", bg: "#073B32" }, bgTheme: "modern",
    content: {
      mark: "B", heading: "Bloom & Co.", subheading: "2026 Marketing Plan", presenter: "Marketing Team · Q1 Planning",
      agendaItems: ["2025 Recap", "2026 Goals", "Channel Strategy", "Budget Allocation", "Key Milestones"],
      contentEyebrow: "2026 Goals", contentHeading: "Three priorities for the year ahead",
      bullets: ["Grow email list from 40K to 100K subscribers", "Launch a referral program by Q2", "Increase organic search traffic by 60%", "Expand into two new paid channels"],
      imgEyebrow: "Channel Strategy", imgHeading: "Doubling down on what's working", imgBody: "Email and organic search drove 70% of last year's revenue. We're increasing investment there while testing two new paid channels.",
      stat: "2.4x", statLabel: "Return on ad spend across current channels",
      contactHeading: "Key Milestones", contactRows: ["Referral program launch — April", "Website relaunch — June", "Holiday campaign — November"],
      thanksContact: "marketing@bloomandco.com",
    },
  },
  {
    slug: "company-overview", name: "Company Overview", category: "Company Overview",
    theme: { primary: "#C9A961", secondary: "#F5F1E8", accent: "#1A1A1A", bg: "#0D0D0D" }, bgTheme: "luxury",
    content: {
      mark: "G", heading: "Gilded House", subheading: "Company Overview", presenter: "2026 Edition",
      agendaItems: ["Our Story", "What We Offer", "Our Craft", "By The Numbers", "Get In Touch"],
      contentEyebrow: "Our Story", contentHeading: "Fifteen years of timeless craft",
      bullets: ["Founded in 2011 by a family of artisans", "Every piece handmade in our Austin studio", "Featured in Architectural Digest and Dwell", "Now shipping to over 30 countries"],
      imgEyebrow: "Our Craft", imgHeading: "Made to last generations", imgBody: "We use only solid hardwoods and traditional joinery — no particle board, no shortcuts. Every piece is built to be handed down.",
      stat: "15", statLabel: "Years of continuous craftsmanship",
      contactHeading: "Get In Touch", contactRows: ["hello@gildedhouse.com", "www.gildedhouse.com", "Austin, TX"],
      thanksContact: "hello@gildedhouse.com · www.gildedhouse.com",
    },
  },
];

const OUT_DIR = path.join(ROOT, "data", "presentation-templates");
fs.mkdirSync(OUT_DIR, { recursive: true });

const meta = { decks: [] };
for (const deck of DECKS) {
  const photos = CARD_BG[deck.bgTheme] || [];
  const c = deck.content;
  const slides = [
    titleSlide(deck.theme, { mark: c.mark, heading: c.heading, subheading: c.subheading, presenter: c.presenter }, photos[0]),
    agendaSlide(deck.theme, { items: c.agendaItems }),
    contentSlide(deck.theme, { eyebrow: c.contentEyebrow, heading: c.contentHeading, bullets: c.bullets }),
    imageTextSlide(deck.theme, { eyebrow: c.imgEyebrow, heading: c.imgHeading, body: c.imgBody }, photos[1]),
    statSlide(deck.theme, { stat: c.stat, label: c.statLabel }),
    teamContactSlide(deck.theme, { heading: c.contactHeading, rows: c.contactRows }),
    thankYouSlide(deck.theme, { contact: c.thanksContact }, photos[2]),
  ];
  const template = {
    id: `deck_${deck.slug}`, name: deck.name, category: deck.category, categorySlug: deck.slug,
    premium: false, theme: deck.theme, slides, export: EXPORT,
  };
  fs.writeFileSync(path.join(OUT_DIR, `${deck.slug}.json`), JSON.stringify(template, null, 2) + "\n");
  meta.decks.push({ slug: deck.slug, name: deck.name, category: deck.category, slideCount: slides.length, theme: deck.theme, coverBg: slides[0].background });
  console.log(`${deck.slug}: ${slides.length} slides`);
}
fs.writeFileSync(path.join(ROOT, "data", "presentation-templates-meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(`Total: ${DECKS.length} decks, ${DECKS.length * 7} slides.`);
