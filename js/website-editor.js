import { startWebsiteProject, getCurrentWebsiteProject, setCurrentWebsiteProject, saveCurrentWebsite } from "./website-store.js";
import { renderWebsiteHTML, setFieldValue } from "./render-website.js";
import { FONTS } from "./icons.js";

function qs(name) { return new URLSearchParams(window.location.search).get(name); }

const rightPanel = document.getElementById("rightPanel");
const editorTitle = document.getElementById("editorTitle");
const sitePreview = document.getElementById("sitePreview");
const previewScroll = document.getElementById("previewScroll");

const SECTION_LABELS = {
  nav: "Navigation", hero: "Hero", about: "About", features: "Features",
  showcase: "Showcase", testimonials: "Testimonials", "cta-band": "Call To Action",
  contact: "Contact", footer: "Footer",
};

let project = null;
let undoStack = [];
let redoStack = [];
let pendingSnapshot = null;
let categories = [];
let logos = [];
let pickerCat = null;
let bgThemes = [];
let bgPickerTheme = null;
let websiteBackgrounds = {};
let bgPickerTarget = null; // { sectionId, field }

function snapshot() { return JSON.stringify(project); }
function beginEdit() { if (!pendingSnapshot) pendingSnapshot = snapshot(); }
function commitEdit() {
  if (pendingSnapshot) { undoStack.push(pendingSnapshot); redoStack = []; pendingSnapshot = null; setCurrentWebsiteProject(project); }
}
function commitAction(fn) {
  const snap = snapshot();
  fn(project);
  undoStack.push(snap);
  redoStack = [];
  setCurrentWebsiteProject(project);
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  project = JSON.parse(undoStack.pop());
  setCurrentWebsiteProject(project);
  renderPreview();
  renderPanel();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  project = JSON.parse(redoStack.pop());
  setCurrentWebsiteProject(project);
  renderPreview();
  renderPanel();
}

function scopeEl() {
  return document.getElementById(`site-${project.id}`);
}

function renderPreview() {
  const scrollTop = previewScroll.scrollTop;
  sitePreview.innerHTML = renderWebsiteHTML(project, { editable: true });
  previewScroll.scrollTop = scrollTop;
}

function applyThemeVar(key, value) {
  project.theme[key] = value;
  scopeEl()?.style.setProperty(`--${key}`, value);
}

function applyFont(fontName) {
  project.theme.font = fontName;
  scopeEl()?.style.setProperty("--site-font", `'${fontName}'`);
}

function logoPickerHtml() {
  const hasLogo = !!project.logo?.image;
  return `
    <div class="field">
      <label>Logo</label>
      <div style="display:flex;gap:8px;">
        <button type="button" class="btn btn-outline btn-sm" id="chooseLogoBtn" style="flex:1;">🖼 Choose Logo</button>
        ${hasLogo ? `<button type="button" class="btn btn-outline btn-sm" id="removeLogoBtn" style="color:#dc2626;">Use Letter</button>` : ""}
      </div>
      <div id="logoPicker" style="display:none;margin-top:10px;background:var(--bg);border-radius:10px;padding:10px;">
        <select id="logoPickerCat" style="width:100%;margin-bottom:8px;background:#fff;border:1px solid var(--border);border-radius:8px;padding:7px;font-size:12.5px;">
          ${categories.map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("")}
        </select>
        <div id="logoPickerGrid" class="site-picker-grid" style="grid-template-columns:repeat(4,1fr);"></div>
      </div>
    </div>`;
}

function paintLogoPickerGrid() {
  const grid = document.getElementById("logoPickerGrid");
  if (!grid) return;
  const list = logos.filter((l) => l.categoryId === pickerCat).slice(0, 32);
  grid.innerHTML = list.map((l) => `
    <button type="button" data-logo-src="${l.image}" title="${l.name}" style="aspect-ratio:1;">
      <img src="${l.image}" alt="${l.name}" loading="lazy" style="object-fit:contain;">
    </button>`).join("");
  grid.querySelectorAll("button[data-logo-src]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyLogoImage(btn.dataset.logoSrc);
      document.getElementById("logoPicker").style.display = "none";
    });
  });
}

function applyLogoImage(src) {
  commitAction((p) => {
    const nav = p.sections.find((s) => s.type === "nav");
    const footer = p.sections.find((s) => s.type === "footer");
    if (nav) nav.logoImage = src;
    if (footer) footer.logoImage = src;
    p.logo = { ...(p.logo || {}), image: src };
  });
  renderPreview();
  renderPanel();
}

function removeLogoImage() {
  commitAction((p) => {
    const nav = p.sections.find((s) => s.type === "nav");
    const footer = p.sections.find((s) => s.type === "footer");
    if (nav) delete nav.logoImage;
    if (footer) delete footer.logoImage;
    p.logo = { ...(p.logo || {}), image: null };
  });
  renderPreview();
  renderPanel();
}

function bgTargets() {
  const targets = [];
  if (project.sections.find((s) => s.type === "hero")) targets.push({ sectionId: "hero", field: "background", label: "Hero Background" });
  if (project.sections.find((s) => s.type === "about")) targets.push({ sectionId: "about", field: "image", label: "About Image" });
  if (project.sections.find((s) => s.type === "cta-band")) targets.push({ sectionId: "cta-band", field: "background", label: "CTA Background" });
  return targets;
}

function bgPickerHtml() {
  const targets = bgTargets();
  return `
    <div class="field">
      <label>Section Backgrounds</label>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${targets.map((t) => `<button type="button" class="btn btn-outline btn-sm" data-bg-target-btn="${t.sectionId}|${t.field}">🖼 ${t.label}</button>`).join("")}
      </div>
      <div id="bgPicker" style="display:none;margin-top:10px;background:var(--bg);border-radius:10px;padding:10px;">
        <select id="bgPickerTheme" style="width:100%;margin-bottom:8px;background:#fff;border:1px solid var(--border);border-radius:8px;padding:7px;font-size:12.5px;">
          ${bgThemes.map((t) => `<option value="${t}">${t.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}</option>`).join("")}
        </select>
        <div id="bgPickerGrid" class="site-picker-grid"></div>
      </div>
    </div>`;
}

function paintBgPickerGrid() {
  const grid = document.getElementById("bgPickerGrid");
  if (!grid) return;
  const list = websiteBackgrounds[bgPickerTheme] || [];
  grid.innerHTML = list.map((src) => `
    <button type="button" data-bg-src="${src}"><img src="${src}" alt="" loading="lazy"></button>`).join("");
  grid.querySelectorAll("button[data-bg-src]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (bgPickerTarget) applySectionBackground(bgPickerTarget.sectionId, bgPickerTarget.field, btn.dataset.bgSrc);
      document.getElementById("bgPicker").style.display = "none";
    });
  });
}

function applySectionBackground(sectionId, field, src) {
  commitAction((p) => {
    const s = p.sections.find((sec) => sec.id === sectionId);
    if (s) s[field] = { type: "image", src };
  });
  renderPreview();
}

function renderPanel() {
  const t = project.theme || {};
  rightPanel.innerHTML = `
    <h3>Edit Website</h3>
    ${logoPickerHtml()}
    <div class="field"><label>Theme Colors</label></div>
    <div class="theme-color-row">
      <div class="theme-color-item"><input type="color" data-theme="primary" value="${t.primary || "#6C5CE7"}"><span>Primary</span></div>
      <div class="theme-color-item"><input type="color" data-theme="secondary" value="${t.secondary || "#ffffff"}"><span>Secondary</span></div>
      <div class="theme-color-item"><input type="color" data-theme="accent" value="${t.accent || "#1a1a2e"}"><span>Accent</span></div>
      <div class="theme-color-item"><input type="color" data-theme="bg" value="${t.bg || "#1a1a2e"}"><span>Hero BG</span></div>
    </div>
    <div class="field"><label>Font</label>
      <select id="fontSelect">${FONTS.map((f) => `<option value="${f.id}" ${f.id === t.font ? "selected" : ""}>${f.label}</option>`).join("")}</select>
    </div>
    ${bgPickerHtml()}
    <div class="field"><label>Jump to Section</label></div>
    ${project.sections.map((s) => `<button type="button" class="section-jump-btn" data-jump="${s.type}">${SECTION_LABELS[s.type] || s.type}</button>`).join("")}
    <div style="font-size:11.5px;color:var(--text-faint);margin-top:10px;">✎ Click any text on the page to edit it directly.</div>
  `;

  const chooseBtn = document.getElementById("chooseLogoBtn");
  const logoPicker = document.getElementById("logoPicker");
  chooseBtn.addEventListener("click", () => {
    const open = logoPicker.style.display !== "none";
    logoPicker.style.display = open ? "none" : "block";
    if (!open) paintLogoPickerGrid();
  });
  document.getElementById("removeLogoBtn")?.addEventListener("click", removeLogoImage);
  const catSelect = document.getElementById("logoPickerCat");
  if (pickerCat) catSelect.value = pickerCat;
  pickerCat = catSelect.value;
  catSelect.addEventListener("change", () => { pickerCat = catSelect.value; paintLogoPickerGrid(); });

  rightPanel.querySelectorAll("input[data-theme]").forEach((input) => {
    input.addEventListener("focus", beginEdit);
    input.addEventListener("input", () => { applyThemeVar(input.dataset.theme, input.value); setCurrentWebsiteProject(project); });
    input.addEventListener("change", commitEdit);
  });

  const fontSelect = document.getElementById("fontSelect");
  fontSelect.addEventListener("change", () => {
    const snap = snapshot();
    applyFont(fontSelect.value);
    undoStack.push(snap);
    redoStack = [];
    setCurrentWebsiteProject(project);
  });

  const bgPicker = document.getElementById("bgPicker");
  rightPanel.querySelectorAll("[data-bg-target-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [sectionId, field] = btn.dataset.bgTargetBtn.split("|");
      const open = bgPicker.style.display !== "none" && bgPickerTarget?.sectionId === sectionId;
      bgPickerTarget = { sectionId, field };
      bgPicker.style.display = open ? "none" : "block";
      if (!open) paintBgPickerGrid();
    });
  });
  const bgThemeSelect = document.getElementById("bgPickerTheme");
  if (bgPickerTheme) bgThemeSelect.value = bgPickerTheme;
  bgPickerTheme = bgThemeSelect.value;
  bgThemeSelect.addEventListener("change", () => { bgPickerTheme = bgThemeSelect.value; paintBgPickerGrid(); });

  rightPanel.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sitePreview.querySelector(`.site-${btn.dataset.jump}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// Inline content editing directly on the live page (contenteditable), synced
// back into the model without re-rendering the DOM (would kill cursor position).
sitePreview.addEventListener("focusin", (e) => {
  if (e.target.dataset?.field) beginEdit();
});
sitePreview.addEventListener("input", (e) => {
  const path = e.target.dataset?.field;
  if (!path) return;
  setFieldValue(project, path, e.target.textContent);
  setCurrentWebsiteProject(project);
});
sitePreview.addEventListener("focusout", (e) => {
  if (e.target.dataset?.field) commitEdit();
});

document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("redoBtn").addEventListener("click", redo);

document.getElementById("saveBtn").addEventListener("click", () => {
  saveCurrentWebsite();
  const btn = document.getElementById("saveBtn");
  const original = btn.textContent;
  btn.textContent = "Saved ✓";
  setTimeout(() => { btn.textContent = original; }, 1500);
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const brand = project.sections.find((s) => s.type === "nav")?.brand || "My Website";
  const fontsLink = `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;600;700;800&family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Roboto+Slab:wght@400;700&display=swap`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${brand.replace(/</g, "&lt;")}</title>
<link href="${fontsLink}" rel="stylesheet">
</head>
<body>
${renderWebsiteHTML(project, { editable: false })}
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "website"}.html`;
  a.click();
  URL.revokeObjectURL(url);
});

async function init() {
  const cat = qs("cat");
  const [siteData, catData, logoData, bgData, meta] = await Promise.all([
    cat ? fetch(`data/website-templates/${cat}.json`).then((r) => r.json()) : Promise.resolve(null),
    fetch("data/categories.json").then((r) => r.json()),
    fetch("data/logos.json").then((r) => r.json()),
    fetch("data/website-backgrounds.json").then((r) => r.json()),
    fetch("data/website-templates-meta.json").then((r) => r.json()),
  ]);
  categories = catData;
  logos = logoData;
  pickerCat = categories[0]?.id || null;
  websiteBackgrounds = bgData;
  bgThemes = Object.keys(bgData).sort();
  bgPickerTheme = bgThemes[0] || null;

  const templateId = qs("id");
  let template = siteData?.templates.find((t) => t.id === templateId);
  if (!template) {
    for (const c of meta.categories) {
      const list = await fetch(`data/website-templates/${c.slug}.json`).then((r) => r.json());
      template = list.templates.find((t) => t.id === templateId);
      if (template) break;
    }
  }
  if (!template) {
    const first = meta.categories[0];
    const list = await fetch(`data/website-templates/${first.slug}.json`).then((r) => r.json());
    template = list.templates[0];
  }

  project = getCurrentWebsiteProject();
  if (!project || project.sourceTemplateId !== template.id) {
    project = startWebsiteProject(template);
  }

  editorTitle.textContent = template.name;
  renderPanel();
  renderPreview();
}

init();
