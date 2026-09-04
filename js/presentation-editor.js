import { startPresentationProject, getCurrentPresentationProject, setCurrentPresentationProject, saveCurrentPresentation } from "./presentation-store.js";
import { renderCardToCanvas } from "./render-card.js";
import { FONTS } from "./icons.js";

function qs(name) { return new URLSearchParams(window.location.search).get(name); }

const canvas = document.getElementById("slideCanvas");
const rightPanel = document.getElementById("rightPanel");
const editorTitle = document.getElementById("editorTitle");
const slideList = document.getElementById("slideList");

const FIELD_LABELS = {
  logo_mark: "Logo Letter", heading: "Heading", subheading: "Subheading", presenter_line: "Presenter Line",
  eyebrow: "Eyebrow", body: "Body Text", stat_number: "Stat Number", stat_label: "Stat Label", contact_line: "Contact Line",
};

let project = null;
let activeSlideIndex = 0;
let selectedId = null;
let lastBoxes = {};
let undoStack = [];
let redoStack = [];
let pendingSnapshot = null;
let expandedFields = new Set();
let resizeState = null;

function activeSlide() { return project.slides[activeSlideIndex]; }
function elementById(id) { return (activeSlide().elements || []).find((e) => e.id === id); }

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
function commitEdit() { if (pendingSnapshot) { undoStack.push(pendingSnapshot); redoStack = []; pendingSnapshot = null; } }
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
  activeSlideIndex = Math.min(activeSlideIndex, project.slides.length - 1);
  persistAndDraw();
  renderFilmstrip();
  renderPanel();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  project = JSON.parse(redoStack.pop());
  activeSlideIndex = Math.min(activeSlideIndex, project.slides.length - 1);
  persistAndDraw();
  renderFilmstrip();
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

async function draw() {
  const slide = activeSlide();
  canvas.width = slide.canvas?.width || 1280;
  canvas.height = slide.canvas?.height || 720;
  const { ctx, boxes } = await renderCardToCanvas(canvas, slide, { selectedId });
  lastBoxes = boxes;
  drawSelectionHandle(ctx);
}
function persistAndDraw() {
  setCurrentPresentationProject(project);
  draw();
  renderThumb(activeSlideIndex);
}

function selectField(id) {
  selectedId = id;
  draw();
  const input = rightPanel.querySelector(`[data-field="${id}"]`);
  if (input) { input.focus(); input.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
}

// ---- Slide filmstrip ----
function renderFilmstrip() {
  slideList.innerHTML = project.slides.map((s, i) => `
    <div class="pres-slide-thumb${i === activeSlideIndex ? " active" : ""}" data-slide-idx="${i}">
      <span class="pres-slide-num">${i + 1}</span>
      <canvas data-thumb-canvas="${i}"></canvas>
      <div class="pres-slide-actions">
        <button type="button" data-dup-slide="${i}" title="Duplicate">⧉</button>
        ${project.slides.length > 1 ? `<button type="button" data-del-slide="${i}" title="Delete">🗑</button>` : ""}
      </div>
    </div>`).join("");

  slideList.querySelectorAll("[data-slide-idx]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-dup-slide],[data-del-slide]")) return;
      activeSlideIndex = Number(el.dataset.slideIdx);
      selectedId = null;
      renderFilmstrip();
      renderPanel();
      draw();
    });
  });
  slideList.querySelectorAll("[data-dup-slide]").forEach((btn) => {
    btn.addEventListener("click", () => duplicateSlide(Number(btn.dataset.dupSlide)));
  });
  slideList.querySelectorAll("[data-del-slide]").forEach((btn) => {
    btn.addEventListener("click", () => deleteSlide(Number(btn.dataset.delSlide)));
  });

  project.slides.forEach((_, i) => renderThumb(i));
}

async function renderThumb(i) {
  const c = slideList.querySelector(`canvas[data-thumb-canvas="${i}"]`);
  if (!c) return;
  const slide = project.slides[i];
  c.width = slide.canvas?.width || 1280;
  c.height = slide.canvas?.height || 720;
  await renderCardToCanvas(c, slide);
}

function duplicateSlide(i) {
  commitAction((p) => {
    const copy = JSON.parse(JSON.stringify(p.slides[i]));
    copy.id = copy.id + "_copy_" + Date.now();
    p.slides.splice(i + 1, 0, copy);
  });
  activeSlideIndex = i + 1;
  renderFilmstrip();
  renderPanel();
  draw();
}
function deleteSlide(i) {
  if (project.slides.length <= 1) return;
  commitAction((p) => { p.slides.splice(i, 1); });
  activeSlideIndex = Math.max(0, Math.min(activeSlideIndex, project.slides.length - 1));
  renderFilmstrip();
  renderPanel();
  draw();
}
document.getElementById("addSlideBtn").addEventListener("click", () => {
  commitAction((p) => {
    const copy = JSON.parse(JSON.stringify(p.slides[activeSlideIndex]));
    copy.id = copy.id + "_copy_" + Date.now();
    p.slides.splice(activeSlideIndex + 1, 0, copy);
  });
  activeSlideIndex += 1;
  renderFilmstrip();
  renderPanel();
  draw();
});

// ---- Text field panel (same pattern as the other editors) ----
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
        <button type="button" class="btn-ghost btn-sm" data-toggle-advanced="${id}" style="padding:2px 8px;${expanded ? "color:var(--primary);font-weight:700;" : ""}">${expanded ? "Less ▲" : "Style ▼"}</button>
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
          <div class="field"><label>Size — ${el.fontSize}</label><input type="range" min="8" max="200" data-edit="size" data-ref="${id}" value="${el.fontSize}"></div>
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
  const fields = activeSlide().editableFields || [];
  rightPanel.innerHTML = `
    <h3>Edit Slide ${activeSlideIndex + 1}</h3>
    ${fields.map(textFieldHtml).join("")}
    <div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">✥ Drag text to reposition · drag the purple handle to resize · click to select.</div>
  `;

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
}

// ---- Canvas drag / resize ----
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
  saveCurrentPresentation();
  const btn = document.getElementById("saveBtn");
  const original = btn.textContent;
  btn.textContent = "Saved ✓";
  setTimeout(() => { btn.textContent = original; }, 1500);
});

document.getElementById("downloadPngBtn").addEventListener("click", () => {
  const name = (project.name || "slide").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${name}-slide-${activeSlideIndex + 1}.png`;
  a.click();
});

document.getElementById("exportPdfBtn").addEventListener("click", async () => {
  const btn = document.getElementById("exportPdfBtn");
  const original = btn.textContent;
  btn.textContent = "Preparing…";
  btn.disabled = true;
  const images = [];
  for (const slide of project.slides) {
    const off = document.createElement("canvas");
    off.width = slide.canvas?.width || 1280;
    off.height = slide.canvas?.height || 720;
    await renderCardToCanvas(off, slide);
    images.push(off.toDataURL("image/png"));
  }
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups to export as PDF."); btn.textContent = original; btn.disabled = false; return; }
  const html = `<!DOCTYPE html><html><head><title>${(project.name || "Presentation").replace(/</g, "&lt;")}</title>
    <style>
      @page { size: landscape; margin: 0; }
      body { margin: 0; }
      img { display: block; width: 100vw; height: 100vh; object-fit: contain; page-break-after: always; }
      img:last-child { page-break-after: auto; }
    </style></head><body>
    ${images.map((src) => `<img src="${src}">`).join("")}
    </body></html>`;
  win.document.write(html);
  win.document.close();
  win.onload = () => setTimeout(() => win.print(), 300);
  btn.textContent = original;
  btn.disabled = false;
});

async function init() {
  const deckSlug = qs("id");
  const [meta, deckData] = await Promise.all([
    fetch("data/presentation-templates-meta.json").then((r) => r.json()),
    deckSlug ? fetch(`data/presentation-templates/${deckSlug}.json`).then((r) => r.json()) : Promise.resolve(null),
  ]);

  let template = deckData;
  if (!template) template = await fetch(`data/presentation-templates/${meta.decks[0].slug}.json`).then((r) => r.json());

  project = getCurrentPresentationProject();
  if (!project || project.sourceTemplateId !== template.id) {
    project = startPresentationProject(template);
  }

  editorTitle.textContent = template.name;
  renderFilmstrip();
  renderPanel();
  await draw();
}

init();
