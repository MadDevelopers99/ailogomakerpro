import { startCardProject, getCurrentCardProject, setCurrentCardProject, saveCurrentCard } from "./card-store.js";
import { renderCardToCanvas } from "./render-card.js";
import { FONTS } from "./icons.js";
import { backgroundPanelHtml, wireBackgroundPanel } from "./background-panel.js";

function qs(name) { return new URLSearchParams(window.location.search).get(name); }

const canvas = document.getElementById("cardCanvas");
const rightPanel = document.getElementById("rightPanel");
const editorTitle = document.getElementById("editorTitle");

const FIELD_LABELS = {
  name: "Full Name",
  job_title: "Job Title",
  company: "Company Name",
  phone: "Phone",
  email: "Email",
  website: "Website",
  address: "Address",
  tagline: "Tagline",
  logo_mark: "Logo Letter",
  qr_placeholder: "QR Label",
};

let project = null;
let activeSide = "front"; // "front" | "back"
let selectedId = null;
let lastBoxes = {};
let undoStack = [];
let redoStack = [];
let pendingSnapshot = null;
let categories = [];
let logos = [];
let pickerCat = null;
let bgCategories = [];
let cardBackgrounds = {};
let expandedFields = new Set();
let resizeState = null;

// Front-side data lives at the top level of `project` (unchanged shape, so
// existing saved projects keep working); back-side data lives in
// `project.back`. Every function below reads/writes through sideData() so
// the exact same editing logic works for whichever side is active.
function sideData() {
  return activeSide === "back" ? project.back : project;
}

function setActiveSide(side) {
  if (activeSide === side) return;
  activeSide = side;
  selectedId = null;
  document.getElementById("frontSideTab").classList.toggle("on", side === "front");
  document.getElementById("backSideTab").classList.toggle("on", side === "back");
  document.getElementById("sideLabel").textContent = side === "back" ? "Back side" : "Front side";
  renderPanel();
  draw();
}

function elementById(id) {
  return (sideData().elements || []).find((e) => e.id === id);
}

function textDefaults(el) {
  if (!el.fillType) el.fillType = "solid";
  if (!el.gradient) el.gradient = ["#6C5CE7", "#00CEC9"];
  if (!el.stroke) el.stroke = { enabled: false, color: "#000000", width: 2 };
  if (!el.shadow) el.shadow = { enabled: false, color: "#000000", blur: 6, x: 2, y: 2 };
  if (!el.fontFamily) el.fontFamily = "Poppins";
  if (!el.fontSize) el.fontSize = 24;
  return el;
}

function snapshot() { return JSON.stringify(project); }
function beginEdit() { if (!pendingSnapshot) pendingSnapshot = snapshot(); }
function commitEdit() {
  if (pendingSnapshot) { undoStack.push(pendingSnapshot); redoStack = []; pendingSnapshot = null; }
}
function commitAction(fn) {
  const snap = snapshot();
  fn(sideData());
  undoStack.push(snap);
  redoStack = [];
  persistAndDraw();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  project = JSON.parse(undoStack.pop());
  persistAndDraw();
  renderPanel();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  project = JSON.parse(redoStack.pop());
  persistAndDraw();
  renderPanel();
}

// Positions the 4 corner buttons (delete/duplicate/rotate/resize) over the
// selected element's box. Handles live inside #cardWrap alongside the canvas
// so the shared CSS zoom transform scales both together automatically.
function positionHandles() {
  const wrap = document.getElementById("elHandles");
  const el = selectedId && elementById(selectedId);
  const box = selectedId && lastBoxes[selectedId];
  if (!el || !box || (el.type !== "text" && el.type !== "icon" && el.type !== "image")) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "block";
  const scaleX = canvas.clientWidth / canvas.width;
  const scaleY = canvas.clientHeight / canvas.height;
  const left = canvas.offsetLeft, top = canvas.offsetTop;
  const pad = 10;
  const corners = {
    delete: { x: box.x - pad, y: box.y - pad },
    duplicate: { x: box.x + box.w + pad, y: box.y - pad },
    rotate: { x: box.x - pad, y: box.y + box.h + pad },
    resize: { x: box.x + box.w + pad, y: box.y + box.h + pad },
  };
  for (const [action, pt] of Object.entries(corners)) {
    const btn = wrap.querySelector(`[data-action="${action}"]`);
    btn.style.left = (left + pt.x * scaleX) + "px";
    btn.style.top = (top + pt.y * scaleY) + "px";
  }
}

async function draw() {
  canvas.width = project.canvas?.width || 1050;
  canvas.height = project.canvas?.height || 600;
  const renderable = { canvas: project.canvas, background: sideData().background, elements: sideData().elements };
  const { ctx, boxes } = await renderCardToCanvas(canvas, renderable, { selectedId });
  lastBoxes = boxes;
  positionHandles();
}
function persistAndDraw() {
  setCurrentCardProject(project);
  draw();
}

function selectField(id) {
  selectedId = id;
  draw();
  const input = rightPanel.querySelector(`[data-field="${id}"]`);
  if (input) { input.focus(); input.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
}

function addTextElement() {
  const id = "text_" + Date.now();
  commitAction((p) => {
    const w = p.canvas?.width || 1050;
    const h = p.canvas?.height || 600;
    p.elements.push({
      id, type: "text", text: "New Text", label: "Custom Text",
      x: Math.round(w / 2 - 60), y: Math.round(h / 2),
      fontSize: 32, fontFamily: "Poppins", color: "#000000", align: "left", bold: false,
      fillType: "solid", gradient: ["#6C5CE7", "#00CEC9"],
      stroke: { enabled: false, color: "#000000", width: 2 },
      shadow: { enabled: false, color: "#000000", blur: 6, x: 2, y: 2 },
      editable: true, custom: true,
    });
    p.editableFields.push(id);
  });
  expandedFields.add(id);
  selectField(id);
  renderPanel();
}

function deleteElement(id) {
  commitAction((p) => {
    p.elements = p.elements.filter((e) => e.id !== id);
    p.editableFields = p.editableFields.filter((f) => f !== id);
  });
  if (selectedId === id) selectedId = null;
  expandedFields.delete(id);
  renderPanel();
}

function duplicateElement(id) {
  const src = elementById(id);
  if (!src) return;
  const newId = `${src.type}_${Date.now()}`;
  commitAction((p) => {
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = newId;
    copy.x = (copy.x || 0) + 24;
    copy.y = (copy.y || 0) + 24;
    if (copy.type === "text") {
      copy.custom = true;
      copy.label = `${src.label || FIELD_LABELS[src.id] || "Text"} Copy`;
      p.editableFields.push(newId);
    }
    p.elements.push(copy);
  });
  selectedId = newId;
  renderPanel();
  selectField(newId);
}

function logoPickerHtml() {
  const hasLogo = elementById("logo_image")?.visible;
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
        <div id="logoPickerGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:220px;overflow-y:auto;"></div>
      </div>
    </div>`;
}

function paintLogoPickerGrid() {
  const grid = document.getElementById("logoPickerGrid");
  if (!grid) return;
  const list = logos.filter((l) => l.categoryId === pickerCat).slice(0, 32);
  grid.innerHTML = list.map((l) => `
    <button type="button" data-logo-src="${l.image}" title="${l.name}" style="aspect-ratio:1;padding:4px;border:1px solid var(--border);border-radius:6px;background:#fff;cursor:pointer;">
      <img src="${l.image}" alt="${l.name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;">
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
    const circle = p.elements.find((e) => e.id === "logo_circle");
    const mark = p.elements.find((e) => e.id === "logo_mark");
    let img = p.elements.find((e) => e.id === "logo_image");
    if (!img) {
      img = { id: "logo_image", type: "image", x: circle?.x ?? 50, y: circle?.y ?? 50, width: circle?.width ?? 90, height: circle?.height ?? 90, rotation: 0, opacity: 1, src, visible: true, editable: true };
      p.elements.push(img);
    } else {
      img.src = src;
      img.visible = true;
    }
    if (circle) circle.visible = false;
    if (mark) mark.visible = false;
  });
  renderPanel();
}

function removeLogoImage() {
  commitAction((p) => {
    const img = p.elements.find((e) => e.id === "logo_image");
    const circle = p.elements.find((e) => e.id === "logo_circle");
    const mark = p.elements.find((e) => e.id === "logo_mark");
    if (img) img.visible = false;
    if (circle) circle.visible = true;
    if (mark) mark.visible = true;
  });
  renderPanel();
}

// Server-side Pexels proxy (see server.js) — the client only ever sends a
// search term, never an API key.
async function searchPhotosApi(query) {
  const res = await fetch(`/api/image-search?q=${encodeURIComponent(query)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Search failed (${res.status})`);
  return data.photos || [];
}

function textFieldHtml(id) {
  const el = elementById(id);
  if (!el || el.type !== "text") return "";
  textDefaults(el);
  const label = el.label || FIELD_LABELS[id] || id;
  const expanded = expandedFields.has(id);
  return `
    <div class="field" data-text-block="${id}">
      <label style="display:flex;align-items:center;justify-content:space-between;">
        <span>${label}</span>
        <span style="display:flex;gap:4px;align-items:center;">
          ${el.custom ? `<button type="button" class="btn-ghost btn-sm" data-delete-text="${id}" title="Delete this text" style="color:#dc2626;">🗑</button>` : ""}
          <button type="button" class="btn-ghost btn-sm" data-toggle-advanced="${id}" style="padding:2px 8px;${expanded ? "color:var(--primary);font-weight:700;" : ""}">${expanded ? "Less ▲" : "Style ▼"}</button>
        </span>
      </label>
      <div style="display:flex;gap:8px;">
        <input type="text" data-field="${id}" value="${(el.text || "").replace(/"/g, "&quot;")}" style="flex:1;">
        <input type="color" data-field-color="${id}" value="${el.color || "#000000"}" style="width:38px;height:38px;padding:2px;border:1px solid var(--border);border-radius:8px;background:var(--bg);">
      </div>
      ${expanded ? `
      <div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:10px;">
        <div class="row-2">
          <div class="field"><label>Font</label>
            <select data-edit="font" data-ref="${id}">${FONTS.map((f) => `<option value="${f.id}" ${f.id === el.fontFamily ? "selected" : ""}>${f.label}</option>`).join("")}</select>
          </div>
          <div class="field"><label>Size — ${el.fontSize}</label><input type="range" min="8" max="140" data-edit="size" data-ref="${id}" value="${el.fontSize}"></div>
        </div>
        <div class="toggle-row" style="margin-bottom:10px;">
          <button type="button" data-edit="weight" data-ref="${id}" class="${el.bold ? "active" : ""}"><b>B</b> Bold</button>
        </div>
        <div class="field"><label>Fill</label>
          <div class="toggle-row">
            <button type="button" data-edit="filltype" data-value="solid" data-ref="${id}" class="${el.fillType !== "gradient" ? "active" : ""}">Solid</button>
            <button type="button" data-edit="filltype" data-value="gradient" data-ref="${id}" class="${el.fillType === "gradient" ? "active" : ""}">Gradient</button>
          </div>
        </div>
        ${el.fillType === "gradient" ? `
        <div class="row-2">
          <div class="field"><label>Color 1</label><input type="color" data-edit="grad1" data-ref="${id}" value="${el.gradient[0]}"></div>
          <div class="field"><label>Color 2</label><input type="color" data-edit="grad2" data-ref="${id}" value="${el.gradient[1]}"></div>
        </div>
        <div data-grad-preview="${id}" style="height:24px;border-radius:8px;margin-bottom:12px;background:linear-gradient(90deg, ${el.gradient[0]}, ${el.gradient[1]});"></div>` : ""}
        <div class="field">
          <label style="display:flex;align-items:center;justify-content:space-between;">
            <span>Stroke</span>
            <button type="button" data-edit="stroke-toggle" data-ref="${id}" class="btn-ghost btn-sm" style="padding:2px 8px;${el.stroke.enabled ? "color:var(--primary);font-weight:700;" : ""}">${el.stroke.enabled ? "On" : "Off"}</button>
          </label>
        </div>
        ${el.stroke.enabled ? `
        <div class="row-2">
          <div class="field"><label>Stroke Color</label><input type="color" data-edit="stroke-color" data-ref="${id}" value="${el.stroke.color}"></div>
          <div class="field"><label>Width — ${el.stroke.width}</label><input type="range" min="1" max="12" data-edit="stroke-width" data-ref="${id}" value="${el.stroke.width}"></div>
        </div>` : ""}
        <div class="field">
          <label style="display:flex;align-items:center;justify-content:space-between;">
            <span>Shadow</span>
            <button type="button" data-edit="shadow-toggle" data-ref="${id}" class="btn-ghost btn-sm" style="padding:2px 8px;${el.shadow.enabled ? "color:var(--primary);font-weight:700;" : ""}">${el.shadow.enabled ? "On" : "Off"}</button>
          </label>
        </div>
        ${el.shadow.enabled ? `
        <div class="row-2">
          <div class="field"><label>Shadow Color</label><input type="color" data-edit="shadow-color" data-ref="${id}" value="${el.shadow.color}"></div>
          <div class="field"><label>Blur — ${el.shadow.blur}</label><input type="range" min="0" max="30" data-edit="shadow-blur" data-ref="${id}" value="${el.shadow.blur}"></div>
        </div>
        <div class="row-2">
          <div class="field"><label>Offset X — ${el.shadow.x}</label><input type="range" min="-20" max="20" data-edit="shadow-x" data-ref="${id}" value="${el.shadow.x}"></div>
          <div class="field"><label>Offset Y — ${el.shadow.y}</label><input type="range" min="-20" max="20" data-edit="shadow-y" data-ref="${id}" value="${el.shadow.y}"></div>
        </div>` : ""}
      </div>` : ""}
    </div>`;
}

function layersHtml() {
  const fields = sideData().editableFields || [];
  const rows = fields.map((id) => {
    const el = elementById(id);
    if (!el) return "";
    const label = el.label || FIELD_LABELS[id] || id;
    const visible = el.visible !== false;
    return `
      <div class="ced-layer">
        <span>T&nbsp; ${label}</span>
        <button type="button" data-layer-toggle="${id}" class="${visible ? "" : "off"}" title="${visible ? "Hide" : "Show"}">${visible ? "◉" : "○"}</button>
      </div>`;
  }).join("");
  return `<div class="ced-title" style="padding-left:0;">Layers</div>${rows}`;
}

function cardSettingsHtml() {
  const w = project.canvas?.width || 1050;
  const h = project.canvas?.height || 600;
  const inW = (w / 300).toFixed(1);
  const inH = (h / 300).toFixed(1);
  return `
    <div class="ced-title" style="padding-left:0;">Card Settings</div>
    <div class="row" style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-dim);margin:8px 0;"><span>Size</span><b style="color:var(--text);">${inW} × ${inH} in</b></div>
    <div class="row" style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-dim);margin:8px 0;"><span>Orientation</span><b style="color:var(--text);">${project.orientation === "portrait" ? "Portrait" : "Landscape"}</b></div>`;
}

function renderPanel() {
  const fields = sideData().editableFields || [];
  rightPanel.innerHTML = `
    <h3>Edit Business Card — ${activeSide === "back" ? "Back Side" : "Front Side"}</h3>
    <button type="button" class="btn btn-primary btn-sm" id="addTextBtn" style="width:100%;margin-bottom:14px;">+ Add Text</button>
    ${logoPickerHtml()}
    ${fields.map(textFieldHtml).join("")}
    ${backgroundPanelHtml(sideData().background, { bgCategories })}
    <div style="font-size:11.5px;color:var(--text-faint);margin:6px 0 16px;">✥ Drag text to reposition · drag the purple handle to resize · click to select.</div>
    <div class="ced-line"></div>
    ${cardSettingsHtml()}
    <div class="ced-line"></div>
    ${layersHtml()}
    <div class="ced-note"><b>Ready-made template</b><br>Every text, color, logo and background is editable. Changes save automatically.</div>
  `;

  document.getElementById("addTextBtn").addEventListener("click", addTextElement);

  rightPanel.querySelectorAll("input[data-field]").forEach((input) => {
    input.addEventListener("focus", () => { selectedId = input.dataset.field; beginEdit(); draw(); });
    input.addEventListener("input", () => {
      const el = elementById(input.dataset.field);
      if (el) { el.text = input.value; persistAndDraw(); }
    });
    input.addEventListener("change", commitEdit);
  });

  rightPanel.querySelectorAll("input[data-field-color]").forEach((input) => {
    input.addEventListener("focus", () => { selectedId = input.dataset.fieldColor; beginEdit(); draw(); });
    input.addEventListener("input", () => {
      const el = elementById(input.dataset.fieldColor);
      if (el) { el.color = input.value; persistAndDraw(); }
    });
    input.addEventListener("change", commitEdit);
  });

  rightPanel.querySelectorAll("[data-toggle-advanced]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleAdvanced;
      if (expandedFields.has(id)) expandedFields.delete(id); else expandedFields.add(id);
      renderPanel();
    });
  });
  rightPanel.querySelectorAll("[data-delete-text]").forEach((btn) => {
    btn.addEventListener("click", () => deleteElement(btn.dataset.deleteText));
  });
  rightPanel.querySelectorAll('select[data-edit="font"]').forEach((sel) => {
    sel.addEventListener("change", () => commitAction(() => { elementById(sel.dataset.ref).fontFamily = sel.value; }));
  });
  rightPanel.querySelectorAll('input[data-edit="size"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      elementById(range.dataset.ref).fontSize = Number(range.value);
      range.closest(".field").querySelector("label").textContent = `Size — ${range.value}`;
      persistAndDraw();
    });
    range.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('button[data-edit="weight"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction(() => { const t = elementById(btn.dataset.ref); t.bold = !t.bold; }));
  });
  rightPanel.querySelectorAll('button[data-edit="filltype"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction(() => { elementById(btn.dataset.ref).fillType = btn.dataset.value; renderPanel(); }));
  });
  function updateGradPreview(ref) {
    const t = elementById(ref);
    const el = rightPanel.querySelector(`[data-grad-preview="${ref}"]`);
    if (el) el.style.background = `linear-gradient(90deg, ${t.gradient[0]}, ${t.gradient[1]})`;
  }
  rightPanel.querySelectorAll('input[data-edit="grad1"]').forEach((color) => {
    color.addEventListener("focus", beginEdit);
    color.addEventListener("input", () => { elementById(color.dataset.ref).gradient[0] = color.value; updateGradPreview(color.dataset.ref); persistAndDraw(); });
    color.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="grad2"]').forEach((color) => {
    color.addEventListener("focus", beginEdit);
    color.addEventListener("input", () => { elementById(color.dataset.ref).gradient[1] = color.value; updateGradPreview(color.dataset.ref); persistAndDraw(); });
    color.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('button[data-edit="stroke-toggle"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction(() => { const t = elementById(btn.dataset.ref); t.stroke.enabled = !t.stroke.enabled; renderPanel(); }));
  });
  rightPanel.querySelectorAll('input[data-edit="stroke-color"]').forEach((color) => {
    color.addEventListener("focus", beginEdit);
    color.addEventListener("input", () => { elementById(color.dataset.ref).stroke.color = color.value; persistAndDraw(); });
    color.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="stroke-width"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      elementById(range.dataset.ref).stroke.width = Number(range.value);
      range.closest(".field").querySelector("label").textContent = `Width — ${range.value}`;
      persistAndDraw();
    });
    range.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('button[data-edit="shadow-toggle"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction(() => { const t = elementById(btn.dataset.ref); t.shadow.enabled = !t.shadow.enabled; renderPanel(); }));
  });
  rightPanel.querySelectorAll('input[data-edit="shadow-color"]').forEach((color) => {
    color.addEventListener("focus", beginEdit);
    color.addEventListener("input", () => { elementById(color.dataset.ref).shadow.color = color.value; persistAndDraw(); });
    color.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="shadow-blur"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      elementById(range.dataset.ref).shadow.blur = Number(range.value);
      range.closest(".field").querySelector("label").textContent = `Blur — ${range.value}`;
      persistAndDraw();
    });
    range.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="shadow-x"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      elementById(range.dataset.ref).shadow.x = Number(range.value);
      range.closest(".field").querySelector("label").textContent = `Offset X — ${range.value}`;
      persistAndDraw();
    });
    range.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="shadow-y"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      elementById(range.dataset.ref).shadow.y = Number(range.value);
      range.closest(".field").querySelector("label").textContent = `Offset Y — ${range.value}`;
      persistAndDraw();
    });
    range.addEventListener("change", commitEdit);
  });

  wireBackgroundPanel(rightPanel, () => sideData().background, {
    // beginEdit() is idempotent (only captures the pre-edit snapshot once
    // per session), so calling it on every change — instead of on a
    // separate focus event, which this panel's mixed control types don't
    // all have — still yields exactly one undo step per edit session.
    onChange: (bg) => { beginEdit(); sideData().background = bg; persistAndDraw(); },
    onCommit: commitEdit,
    searchPhotos: searchPhotosApi,
    cardBackgrounds,
  });

  // Logo picker only renders on the front side (see renderPanel above).
  const chooseBtn = document.getElementById("chooseLogoBtn");
  const picker = document.getElementById("logoPicker");
  if (chooseBtn) {
    chooseBtn.addEventListener("click", () => {
      const open = picker.style.display !== "none";
      picker.style.display = open ? "none" : "block";
      if (!open) paintLogoPickerGrid();
    });
    document.getElementById("removeLogoBtn")?.addEventListener("click", removeLogoImage);

    const catSelect = document.getElementById("logoPickerCat");
    if (pickerCat) catSelect.value = pickerCat;
    pickerCat = catSelect.value;
    catSelect.addEventListener("change", () => { pickerCat = catSelect.value; paintLogoPickerGrid(); });
  }

  rightPanel.querySelectorAll("[data-layer-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      commitAction((p) => {
        const el = p.elements.find((e) => e.id === btn.dataset.layerToggle);
        if (el) el.visible = el.visible === false;
      });
      renderPanel();
    });
  });
}

function canvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}
function hitTest(point) {
  for (const [id, box] of Object.entries(lastBoxes)) {
    if (point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h) return id;
  }
  return null;
}
let dragState = null;
let rotateState = null;
canvas.addEventListener("pointerdown", (e) => {
  // Without this, the browser's default mousedown focus-handling steals focus
  // back to <body> right after we programmatically focus the field input.
  e.preventDefault();
  const point = canvasPointFromEvent(e);
  const hitId = hitTest(point);
  if (!hitId) { selectedId = null; positionHandles(); return; }
  const el = elementById(hitId);
  beginEdit();
  dragState = { id: hitId, startX: point.x, startY: point.y, originX: el.x, originY: el.y };
  selectField(hitId);
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragState) return;
  const point = canvasPointFromEvent(e);
  const el = elementById(dragState.id);
  if (!el) return;
  el.x = dragState.originX + (point.x - dragState.startX);
  el.y = dragState.originY + (point.y - dragState.startY);
  persistAndDraw();
});
function endDrag() {
  if (!dragState) return;
  dragState = null;
  commitEdit();
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

// Corner handles: delete / duplicate / rotate / resize for the selected
// text or icon "sticker". Rotate + resize track drag via pointer capture on
// the handle button itself; delete/duplicate are single clicks.
const elHandles = document.getElementById("elHandles");
elHandles.querySelector('[data-action="delete"]').addEventListener("click", () => {
  if (selectedId) deleteElement(selectedId);
});
elHandles.querySelector('[data-action="duplicate"]').addEventListener("click", () => {
  if (selectedId) duplicateElement(selectedId);
});
elHandles.querySelector('[data-action="resize"]').addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const el = elementById(selectedId);
  if (!el) return;
  beginEdit();
  resizeState = { id: selectedId, startY: canvasPointFromEvent(e).y, startFontSize: el.fontSize, startSize: el.size, startWidth: el.width, startHeight: el.height };
  e.currentTarget.setPointerCapture(e.pointerId);
});
elHandles.querySelector('[data-action="resize"]').addEventListener("pointermove", (e) => {
  if (!resizeState) return;
  const el = elementById(resizeState.id);
  if (!el) return;
  const delta = canvasPointFromEvent(e).y - resizeState.startY;
  if (el.type === "icon") {
    el.size = Math.max(8, Math.round(resizeState.startSize + delta));
  } else if (el.type === "image") {
    const factor = Math.max(0.2, (resizeState.startHeight + delta) / resizeState.startHeight);
    el.width = Math.max(16, Math.round(resizeState.startWidth * factor));
    el.height = Math.max(16, Math.round(resizeState.startHeight * factor));
  } else {
    el.fontSize = Math.max(8, Math.round(resizeState.startFontSize + delta));
  }
  persistAndDraw();
});
elHandles.querySelector('[data-action="resize"]').addEventListener("pointerup", () => {
  if (!resizeState) return;
  resizeState = null;
  commitEdit();
});
elHandles.querySelector('[data-action="rotate"]').addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const el = elementById(selectedId);
  const box = lastBoxes[selectedId];
  if (!el || !box) return;
  beginEdit();
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const point = canvasPointFromEvent(e);
  rotateState = { id: selectedId, cx, cy, startAngle: Math.atan2(point.y - cy, point.x - cx), startRotation: el.rotation || 0 };
  e.currentTarget.setPointerCapture(e.pointerId);
});
elHandles.querySelector('[data-action="rotate"]').addEventListener("pointermove", (e) => {
  if (!rotateState) return;
  const el = elementById(rotateState.id);
  if (!el) return;
  const point = canvasPointFromEvent(e);
  const angle = Math.atan2(point.y - rotateState.cy, point.x - rotateState.cx);
  const deltaDeg = (angle - rotateState.startAngle) * (180 / Math.PI);
  el.rotation = Math.round(rotateState.startRotation + deltaDeg);
  persistAndDraw();
});
elHandles.querySelector('[data-action="rotate"]').addEventListener("pointerup", () => {
  if (!rotateState) return;
  rotateState = null;
  commitEdit();
});

window.addEventListener("resize", positionHandles);

document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("redoBtn").addEventListener("click", redo);

document.getElementById("saveBtn").addEventListener("click", async () => {
  // The saved thumbnail should always show the front side, even if the
  // back side happens to be on screen when the user clicks Save.
  let thumb;
  if (activeSide === "back") {
    const offscreen = document.createElement("canvas");
    offscreen.width = project.canvas?.width || 1050;
    offscreen.height = project.canvas?.height || 600;
    await renderCardToCanvas(offscreen, { canvas: project.canvas, background: project.background, elements: project.elements }, {});
    thumb = offscreen.toDataURL("image/png");
  } else {
    thumb = canvas.toDataURL("image/png");
  }
  saveCurrentCard(thumb);
  const btn = document.getElementById("saveBtn");
  const original = btn.textContent;
  btn.textContent = "Saved ✓";
  setTimeout(() => { btn.textContent = original; }, 1500);
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  // Always name the file after the front side's identity, regardless of
  // which side is currently shown on canvas (that's what actually exports).
  const frontCompany = project.elements?.find((e) => e.id === "company")?.text;
  const frontName = project.elements?.find((e) => e.id === "name")?.text;
  const name = (frontCompany || frontName || "business-card")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = activeSide === "back" ? "-back" : "";
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${name || "business-card"}${suffix}.png`;
  a.click();
});

async function init() {
  const cardCat = qs("cat");
  const [cardData, catData, logoData, bgData, meta] = await Promise.all([
    cardCat ? fetch(`data/business-cards/${cardCat}.json`).then((r) => r.json()) : Promise.resolve(null),
    fetch("data/categories.json").then((r) => r.json()),
    fetch("data/logos.json").then((r) => r.json()),
    fetch("data/card-backgrounds.json").then((r) => r.json()),
    fetch("data/business-cards-meta.json").then((r) => r.json()),
  ]);
  categories = catData;
  logos = logoData;
  pickerCat = categories[0]?.id || null;
  cardBackgrounds = bgData;
  bgCategories = Object.keys(bgData).sort();

  const templateId = qs("id");
  let template = cardData?.templates.find((t) => t.id === templateId);
  let resolvedCat = cardData ? cardCat : null;
  let siblingTemplates = cardData?.templates || null;
  if (!template) {
    // Fallback: cat param missing/wrong — search every category file for the id.
    for (const c of meta.categories) {
      const list = await fetch(`data/business-cards/${c.slug}.json`).then((r) => r.json());
      template = list.templates.find((t) => t.id === templateId);
      if (template) { resolvedCat = c.slug; siblingTemplates = list.templates; break; }
    }
  }
  if (!template) {
    const first = meta.categories[0];
    const list = await fetch(`data/business-cards/${first.slug}.json`).then((r) => r.json());
    template = list.templates[0];
    resolvedCat = first.slug;
    siblingTemplates = list.templates;
  }

  project = getCurrentCardProject();
  if (!project || project.sourceTemplateId !== template.id) {
    project = startCardProject(template);
  }

  editorTitle.textContent = template.name;
  renderPanel();
  await draw();

  // Left sidebar: template gallery (real sibling templates from this category).
  const tplGrid = document.getElementById("tplThumbGrid");
  tplGrid.innerHTML = siblingTemplates.slice(0, 12).map((t) => {
    const isImage = t.background?.type === "image";
    return `
      <button type="button" class="ced-tpl${t.id === template.id ? " on" : ""}" style="background-image:${isImage ? `url('${t.background.src}')` : "none"};background-color:${t.theme?.primary || "#e9edf5"};" data-tpl-id="${t.id}" title="${t.name}">
        <span>${t.name}</span>
      </button>`;
  }).join("");
  tplGrid.querySelectorAll("[data-tpl-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = `card-editor.html?cat=${resolvedCat}&id=${btn.dataset.tplId}`;
    });
  });

  // Left sidebar tool shortcuts: reuse the existing pickers already wired
  // inside the right panel rather than duplicating their logic.
  document.getElementById("frontSideTab").addEventListener("click", () => setActiveSide("front"));
  document.getElementById("backSideTab").addEventListener("click", () => setActiveSide("back"));

  document.getElementById("addTextToolBtn").addEventListener("click", addTextElement);
  document.getElementById("chooseLogoToolBtn").addEventListener("click", () => {
    document.getElementById("chooseLogoBtn").click();
    document.getElementById("logoPicker").scrollIntoView({ block: "center", behavior: "smooth" });
  });
  document.getElementById("chooseBgToolBtn").addEventListener("click", () => {
    rightPanel.querySelector(".bgp-root")?.scrollIntoView({ block: "center", behavior: "smooth" });
  });

  // Zoom controls (visual scale only — export always uses full resolution).
  const cardWrap = document.getElementById("cardWrap");
  const zoomLabel = document.getElementById("zoomLabel");
  let zoom = 1;
  function applyZoom() {
    cardWrap.style.transform = `scale(${zoom})`;
    zoomLabel.textContent = Math.round(zoom * 100) + "%";
  }
  document.getElementById("zoomInBtn").addEventListener("click", () => { zoom = Math.min(2, zoom + 0.1); applyZoom(); });
  document.getElementById("zoomOutBtn").addEventListener("click", () => { zoom = Math.max(0.3, zoom - 0.1); applyZoom(); });
  document.getElementById("zoomFitBtn").addEventListener("click", () => { zoom = 1; applyZoom(); });
}

init();
