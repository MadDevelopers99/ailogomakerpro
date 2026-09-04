import { startSocialProject, getCurrentSocialProject, setCurrentSocialProject, saveCurrentSocial } from "./social-store.js";
import { renderCardToCanvas } from "./render-card.js";
import { FONTS } from "./icons.js";

function qs(name) { return new URLSearchParams(window.location.search).get(name); }

const canvas = document.getElementById("socialCanvas");
const rightPanel = document.getElementById("rightPanel");
const editorTitle = document.getElementById("editorTitle");

const FIELD_LABELS = {
  headline: "Headline",
  subheadline: "Subheadline",
  handle: "Handle / Website",
  logo_mark: "Logo Letter",
};

let project = null;
let selectedId = null;
let lastBoxes = {};
let undoStack = [];
let redoStack = [];
let pendingSnapshot = null;
let categories = [];
let logos = [];
let pickerCat = null;
let bgThemes = [];
let bgPickerTheme = null;
let socialBackgrounds = {};
let expandedFields = new Set();
let resizeState = null;

function elementById(id) {
  return (project.elements || []).find((e) => e.id === id);
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
  fn(project);
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

function drawSelectionHandle(ctx) {
  if (!selectedId) return;
  const el = elementById(selectedId);
  if (!el || el.type !== "text") return;
  const box = lastBoxes[selectedId];
  if (!box) return;
  const hx = box.x + box.w, hy = box.y + box.h;
  ctx.save();
  ctx.fillStyle = "#6C5CE7";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hx, hy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function applyCanvasSize() {
  const w = project.canvas?.width || 1080;
  const h = project.canvas?.height || 1080;
  canvas.width = w;
  canvas.height = h;
  canvas.style.aspectRatio = `${w} / ${h}`;
}

async function draw() {
  applyCanvasSize();
  const { ctx, boxes } = await renderCardToCanvas(canvas, project, { selectedId });
  lastBoxes = boxes;
  drawSelectionHandle(ctx);
}
function persistAndDraw() {
  setCurrentSocialProject(project);
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
    const w = p.canvas?.width || 1080;
    const h = p.canvas?.height || 1080;
    p.elements.push({
      id, type: "text", text: "New Text", label: "Custom Text",
      x: Math.round(w / 2 - 60), y: Math.round(h / 2),
      fontSize: Math.round(w * 0.05) || 32, fontFamily: "Poppins", color: "#000000", align: "left", bold: false,
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

function deleteTextElement(id) {
  commitAction((p) => {
    p.elements = p.elements.filter((e) => e.id !== id);
    p.editableFields = p.editableFields.filter((f) => f !== id);
  });
  if (selectedId === id) selectedId = null;
  expandedFields.delete(id);
  renderPanel();
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
      img = { id: "logo_image", type: "image", x: circle?.x ?? 0, y: circle?.y ?? 0, width: circle?.width ?? 90, height: circle?.height ?? 90, rotation: 0, opacity: 1, src, visible: true, editable: true };
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

function bgPickerHtml() {
  const isImage = project.background?.type === "image";
  return `
    <div class="field">
      <label>Background Image</label>
      <div style="display:flex;gap:8px;">
        <button type="button" class="btn btn-outline btn-sm" id="chooseBgBtn" style="flex:1;">🖼 Choose Photo Background</button>
        ${isImage ? `<button type="button" class="btn btn-outline btn-sm" id="removeBgBtn" style="color:#dc2626;">Use Color</button>` : ""}
      </div>
      <div id="bgPicker" style="display:none;margin-top:10px;background:var(--bg);border-radius:10px;padding:10px;">
        <select id="bgPickerTheme" style="width:100%;margin-bottom:8px;background:#fff;border:1px solid var(--border);border-radius:8px;padding:7px;font-size:12.5px;">
          ${bgThemes.map((t) => `<option value="${t}">${t.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}</option>`).join("")}
        </select>
        <div id="bgPickerGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-height:220px;overflow-y:auto;"></div>
      </div>
    </div>`;
}

function paintBgPickerGrid() {
  const grid = document.getElementById("bgPickerGrid");
  if (!grid) return;
  const list = socialBackgrounds[bgPickerTheme] || [];
  grid.innerHTML = list.map((src) => `
    <button type="button" data-bg-src="${src}" style="aspect-ratio:16/9;padding:0;border:1px solid var(--border);border-radius:6px;overflow:hidden;cursor:pointer;background:#fff;">
      <img src="${src}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
    </button>`).join("");
  grid.querySelectorAll("button[data-bg-src]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyBackgroundImage(btn.dataset.bgSrc);
      document.getElementById("bgPicker").style.display = "none";
    });
  });
}

function applyBackgroundImage(src) {
  commitAction((p) => {
    p.background = { type: "image", src, color: p.background?.color || "#111111" };
    const bgShape = p.elements.find((e) => e.id === "bg_shape_1");
    if (bgShape) bgShape.visible = false;
  });
  renderPanel();
}

function removeBackgroundImage() {
  commitAction((p) => {
    p.background = { type: "solid", color: p.background?.color || "#111111" };
    const bgShape = p.elements.find((e) => e.id === "bg_shape_1");
    if (bgShape) bgShape.visible = true;
  });
  renderPanel();
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
          <div class="field"><label>Size — ${el.fontSize}</label><input type="range" min="8" max="240" data-edit="size" data-ref="${id}" value="${el.fontSize}"></div>
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

function renderPanel() {
  const fields = project.editableFields || [];
  rightPanel.innerHTML = `
    <h3>Edit Graphic</h3>
    <button type="button" class="btn btn-primary btn-sm" id="addTextBtn" style="width:100%;margin-bottom:14px;">+ Add Text</button>
    ${logoPickerHtml()}
    ${fields.map(textFieldHtml).join("")}
    <div class="field">
      <label>Background Color</label>
      <input type="color" id="bgColorInput" value="${project.background?.color || "#111111"}">
    </div>
    ${bgPickerHtml()}
    <div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">✥ Drag text to reposition · drag the purple handle to resize · click to select.</div>
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
    btn.addEventListener("click", () => deleteTextElement(btn.dataset.deleteText));
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

  const bgInput = document.getElementById("bgColorInput");
  bgInput.addEventListener("focus", beginEdit);
  bgInput.addEventListener("input", () => {
    project.background.color = bgInput.value;
    const bgShape = elementById("bg_shape_1");
    if (bgShape) bgShape.color = bgInput.value;
    persistAndDraw();
  });
  bgInput.addEventListener("change", commitEdit);

  const chooseBtn = document.getElementById("chooseLogoBtn");
  const picker = document.getElementById("logoPicker");
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

  const chooseBgBtn = document.getElementById("chooseBgBtn");
  const bgPicker = document.getElementById("bgPicker");
  chooseBgBtn.addEventListener("click", () => {
    const open = bgPicker.style.display !== "none";
    bgPicker.style.display = open ? "none" : "block";
    if (!open) paintBgPickerGrid();
  });
  document.getElementById("removeBgBtn")?.addEventListener("click", removeBackgroundImage);

  const bgThemeSelect = document.getElementById("bgPickerTheme");
  if (bgPickerTheme) bgThemeSelect.value = bgPickerTheme;
  bgPickerTheme = bgThemeSelect.value;
  bgThemeSelect.addEventListener("change", () => { bgPickerTheme = bgThemeSelect.value; paintBgPickerGrid(); });
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
function hitResizeHandle(point) {
  if (!selectedId) return false;
  const el = elementById(selectedId);
  if (!el || el.type !== "text") return false;
  const box = lastBoxes[selectedId];
  if (!box) return false;
  const dx = point.x - (box.x + box.w), dy = point.y - (box.y + box.h);
  return Math.sqrt(dx * dx + dy * dy) <= 14;
}

let dragState = null;
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  const point = canvasPointFromEvent(e);
  if (hitResizeHandle(point)) {
    const el = elementById(selectedId);
    beginEdit();
    resizeState = { id: selectedId, startY: point.y, startFontSize: el.fontSize };
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  const hitId = hitTest(point);
  if (!hitId) return;
  const el = elementById(hitId);
  beginEdit();
  dragState = { id: hitId, startX: point.x, startY: point.y, originX: el.x, originY: el.y };
  selectField(hitId);
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  const point = canvasPointFromEvent(e);
  if (resizeState) {
    const el = elementById(resizeState.id);
    if (!el) return;
    const delta = point.y - resizeState.startY;
    el.fontSize = Math.max(8, Math.round(resizeState.startFontSize + delta));
    persistAndDraw();
    return;
  }
  if (!dragState) return;
  const el = elementById(dragState.id);
  if (!el) return;
  el.x = dragState.originX + (point.x - dragState.startX);
  el.y = dragState.originY + (point.y - dragState.startY);
  persistAndDraw();
});
function endDrag() {
  if (resizeState) { resizeState = null; commitEdit(); return; }
  if (!dragState) return;
  dragState = null;
  commitEdit();
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("redoBtn").addEventListener("click", redo);

document.getElementById("saveBtn").addEventListener("click", () => {
  const thumb = canvas.toDataURL("image/png");
  saveCurrentSocial(thumb);
  const btn = document.getElementById("saveBtn");
  const original = btn.textContent;
  btn.textContent = "Saved ✓";
  setTimeout(() => { btn.textContent = original; }, 1500);
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const name = (project.platform || "social-graphic").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${name || "social-graphic"}.png`;
  a.click();
});

async function init() {
  const platformSlug = qs("platform");
  const [platformData, catData, logoData, bgData, meta] = await Promise.all([
    platformSlug ? fetch(`data/social-media/${platformSlug}.json`).then((r) => r.json()) : Promise.resolve(null),
    fetch("data/categories.json").then((r) => r.json()),
    fetch("data/logos.json").then((r) => r.json()),
    fetch("data/social-backgrounds.json").then((r) => r.json()),
    fetch("data/social-media-meta.json").then((r) => r.json()),
  ]);
  categories = catData;
  logos = logoData;
  pickerCat = categories[0]?.id || null;
  socialBackgrounds = bgData;
  bgThemes = Object.keys(bgData).sort();
  bgPickerTheme = bgThemes[0] || null;

  const templateId = qs("id");
  let template = platformData?.templates.find((t) => t.id === templateId);
  if (!template) {
    for (const p of meta.platforms) {
      const list = await fetch(`data/social-media/${p.slug}.json`).then((r) => r.json());
      template = list.templates.find((t) => t.id === templateId);
      if (template) break;
    }
  }
  if (!template) {
    const first = meta.platforms[0];
    const list = await fetch(`data/social-media/${first.slug}.json`).then((r) => r.json());
    template = list.templates[0];
  }

  project = getCurrentSocialProject();
  if (!project || project.sourceTemplateId !== template.id) {
    project = startSocialProject(template);
  }

  editorTitle.textContent = template.name;
  renderPanel();
  await draw();
}

init();
