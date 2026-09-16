// Client-side persistence for the business card editor. Mirrors project-store.js's
// pattern (localStorage only, no backend) but keyed separately from logo projects.
const CURRENT_KEY = "lm_card_current_project";
const SAVED_KEY = "lm_saved_cards";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCurrentCardProject() {
  return read(CURRENT_KEY, null);
}
export function setCurrentCardProject(project) {
  write(CURRENT_KEY, project);
}

// Every real template only defines a front side. Rather than fabricate
// per-template back-side artwork, generate one real, editable back layout
// from the template's own theme colors and existing front-side text/logo —
// a genuine starting point the user can then customize independently.
function generateDefaultBack(template) {
  const w = template.canvas?.width || 1050;
  const h = template.canvas?.height || 600;
  const theme = template.theme || { primary: "#1454C8", secondary: "#FFFFFF", accent: "#0B1A2E" };
  const els = template.elements || [];
  const companyText = els.find((e) => e.id === "company")?.text || "COMPANY NAME";
  const taglineText = els.find((e) => e.id === "tagline")?.text || "TAGLINE HERE";
  const markText = els.find((e) => e.id === "logo_mark")?.text || companyText.trim().charAt(0).toUpperCase() || "A";
  const cx = w / 2;

  return {
    background: { type: "solid", color: theme.primary },
    elements: [
      // Reuses the SAME ids as the front side's logo (logo_mark/logo_image) so
      // the existing "Choose Logo" picker works unmodified on the back too —
      // no circle behind it; the bold letter sits directly on the background.
      { id: "logo_mark", type: "text", text: markText, x: cx, y: h / 2 - 80, fontSize: 40, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: true, editable: true, label: "Logo Letter" },
      { id: "back_company", type: "text", text: companyText, x: cx, y: h / 2, fontSize: 26, fontFamily: "Poppins", color: theme.secondary, align: "center", bold: true, editable: true, label: "Company Name" },
      { id: "back_tagline", type: "text", text: taglineText, x: cx, y: h / 2 + 34, fontSize: 13, fontFamily: "Poppins", color: theme.accent, align: "center", editable: true, label: "Tagline" },
      { id: "back_qr_bg", type: "shape", shape: "roundedRect", x: w - 130, y: h - 130, width: 80, height: 80, color: theme.secondary, rotation: 0, opacity: 1, editable: true },
      { id: "back_qr_label", type: "text", text: "QR", x: w - 90, y: h - 82, fontSize: 18, fontFamily: "Poppins", color: theme.primary, align: "center", bold: true, editable: true, label: "QR Label" },
    ],
    editableFields: ["logo_mark", "back_company", "back_tagline", "back_qr_label"],
  };
}

// Deep-clones the template so in-editor edits never mutate the shared
// data/business-cards.json objects held in memory.
export function startCardProject(template) {
  const project = JSON.parse(JSON.stringify(template));
  project.sourceTemplateId = template.id;
  if (!project.back) project.back = generateDefaultBack(template);
  setCurrentCardProject(project);
  return project;
}

export function listSavedCards() {
  return read(SAVED_KEY, []);
}
export function saveCurrentCard(thumbnailDataUrl) {
  const project = getCurrentCardProject();
  if (!project) return null;
  const saved = listSavedCards();
  const entry = { id: "card_" + Date.now(), savedAt: Date.now(), thumbnail: thumbnailDataUrl, project };
  saved.unshift(entry);
  write(SAVED_KEY, saved);
  return entry;
}
