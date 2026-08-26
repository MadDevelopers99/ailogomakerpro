import { ICONS, SHAPES, SOLID_COLORS, GRADIENTS, FONTS, iconSvgMarkup } from "./icons.js";
import {
  getCurrentProject, setCurrentProject, startProject, defaultProject, normalizeProject,
  listUploads, addUpload, saveCurrentLogo,
} from "./project-store.js";
import { renderProjectToCanvas, canvasToDataUrl } from "./render-logo.js";

function qs(name) { return new URLSearchParams(window.location.search).get(name); }

const canvas = document.getElementById("logoCanvas");
const rightPanel = document.getElementById("rightPanel");
const toolSidebar = document.getElementById("toolSidebar");
const editorTitle = document.getElementById("editorTitle");

let categories = [];
let logos = [];
let project = null;
let activeTool = "text";
let undoStack = [];
let redoStack = [];
let pendingSnapshot = null;
let lastBoxes = {};
let selectedLayerId = null;

// Which project field the given layer id's x/y live on.
function movableTarget(layerId) {
  if (layerId === "brand" || layerId === "slogan") return project.text[layerId];
  if (layerId === "image" || layerId === "icon" || layerId === "shape") return project[layerId];
  return null;
}
const TOOL_FOR_LAYER = { image: "templates", icon: "icons", shape: "shapes", brand: "text", slogan: "text" };

function snapshot() { return JSON.stringify(project); }
function beginEdit() { if (!pendingSnapshot) pendingSnapshot = snapshot(); }
function commitEdit() {
  if (pendingSnapshot) { undoStack.push(pendingSnapshot); redoStack = []; pendingSnapshot = null; }
}
function liveUpdate(fn) { fn(project); setCurrentProject(project); draw(); }
function commitAction(fn) {
  const snap = snapshot();
  fn(project);
  undoStack.push(snap);
  redoStack = [];
  setCurrentProject(project);
  draw();
  renderPanel();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  project = JSON.parse(undoStack.pop());
  setCurrentProject(project);
  draw();
  renderPanel();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  project = JSON.parse(redoStack.pop());
  setCurrentProject(project);
  draw();
  renderPanel();
}

async function draw() {
  const { boxes } = await renderProjectToCanvas(canvas, project, { selectedLayerId });
  lastBoxes = boxes;
  editorTitle.textContent = project.text.brand.content || "Untitled Logo";
}

function selectLayer(id) {
  selectedLayerId = id;
  if (id && TOOL_FOR_LAYER[id] && TOOL_FOR_LAYER[id] !== activeTool) {
    activeTool = TOOL_FOR_LAYER[id];
    renderPanel();
  }
  draw();
}

const CLEARABLE = { icon: true, shape: true, element: true };
function clearLayer(id) {
  if (!CLEARABLE[id]) return;
  commitAction((p) => {
    if (id === "icon") { p.icon.visible = false; p.icon.id = null; }
    else if (id === "shape") { p.shape.visible = false; p.shape.id = "none"; }
    else if (id === "element") { p.element.visible = false; p.element.id = "none"; }
  });
  if (selectedLayerId === id) selectedLayerId = null;
  draw();
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Delete" && e.key !== "Backspace") return;
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea") return;
  if (!selectedLayerId || !CLEARABLE[selectedLayerId]) return;
  e.preventDefault();
  clearLayer(selectedLayerId);
});

/* ---------------- Canvas select & drag ---------------- */

function canvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}
function hitTest(point) {
  // Topmost layer first.
  const order = [...project.layers].reverse();
  for (const layer of order) {
    const box = lastBoxes[layer.id];
    if (!box) continue;
    if (point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h) {
      return layer.id;
    }
  }
  return null;
}

let dragState = null;
canvas.addEventListener("pointerdown", (e) => {
  const point = canvasPointFromEvent(e);
  const hitId = hitTest(point);
  if (!hitId) { selectLayer(null); return; }
  const target = movableTarget(hitId);
  if (!target) { selectLayer(hitId); return; }
  beginEdit();
  dragState = { id: hitId, startX: point.x, startY: point.y, originX: target.x, originY: target.y };
  selectLayer(hitId);
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragState) return;
  const point = canvasPointFromEvent(e);
  const dx = point.x - dragState.startX;
  const dy = point.y - dragState.startY;
  liveUpdate(() => {
    const target = movableTarget(dragState.id);
    target.x = dragState.originX + dx;
    target.y = dragState.originY + dy;
  });
});
function endDrag() {
  if (!dragState) return;
  dragState = null;
  commitEdit();
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

/* ---------------- Panels ---------------- */

function panelShell(title, bodyHtml) {
  return `<h3>${title}</h3>${bodyHtml}`;
}

function renderTemplatesPanel() {
  const cat = categories.find((c) => c.id === project.__browseCat) || categories.find((c) => c.id === (logos.find(l => l.id === project.sourceLogoId) || {}).categoryId) || categories[0];
  const catLogos = logos.filter((l) => l.categoryId === (cat ? cat.id : null)).slice(0, 24);

  rightPanel.innerHTML = panelShell("Templates", `
    <div class="field"><label>Layout</label>
      <div class="toggle-row">
        <button data-layout="below" class="${project.layout === "below" ? "active" : ""}">Below</button>
        <button data-layout="overlay" class="${project.layout === "overlay" ? "active" : ""}">Overlay</button>
        <button data-layout="logo-only" class="${project.layout === "logo-only" ? "active" : ""}">Logo Only</button>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <span style="font-size:11.5px;color:var(--text-faint);">✥ Select then drag on canvas to move logo</span>
      <button type="button" class="btn btn-outline btn-sm" id="selectImageBtn">${selectedLayerId === "image" ? "● Selected" : "Select"}</button>
    </div>
    <div class="field"><label>Category</label>
      <select id="tplCatSelect">${categories.map((c) => `<option value="${c.id}" ${cat && c.id === cat.id ? "selected" : ""}>${c.icon} ${c.name}</option>`).join("")}</select>
    </div>
    <div class="tpl-grid" id="tplMiniGrid" style="grid-template-columns:repeat(2,1fr);gap:8px;"></div>
  `);

  const miniGrid = document.getElementById("tplMiniGrid");
  miniGrid.innerHTML = catLogos.map((l) => `
    <div class="tpl-card" data-logo="${l.id}" style="${l.image === project.image.src ? "outline:2px solid var(--primary);" : ""}">
      <div class="thumb" style="padding:10px;"><img src="${l.image}" loading="lazy"></div>
    </div>`).join("");

  miniGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".tpl-card");
    if (!card) return;
    const logo = logos.find((l) => l.id === card.dataset.logo);
    commitAction((p) => { p.image.src = logo.image; p.image.visible = true; p.sourceLogoId = logo.id; });
  });

  document.getElementById("tplCatSelect").addEventListener("change", (e) => {
    project.__browseCat = e.target.value;
    renderPanel();
  });

  rightPanel.querySelectorAll("[data-layout]").forEach((btn) => {
    btn.addEventListener("click", () => commitAction((p) => { p.layout = btn.dataset.layout; }));
  });
  document.getElementById("selectImageBtn").addEventListener("click", () => selectLayer(selectedLayerId === "image" ? null : "image"));
}

function textBlock(ref, label) {
  const t = project.text[ref];
  const isSelected = selectedLayerId === ref;
  return `
    <div class="field">
      <label style="display:flex;align-items:center;justify-content:space-between;">
        <span>${label}</span>
        <button type="button" data-select="${ref}" class="btn-ghost btn-sm" style="padding:2px 8px;${isSelected ? "color:var(--primary);font-weight:700;" : ""}">${isSelected ? "● Selected" : "Select"}</button>
      </label>
      <input type="text" data-edit="content" data-ref="${ref}" value="${t.content.replace(/"/g, "&quot;")}">
    </div>
    <div class="row-2">
      <div class="field"><label>Font</label>
        <select data-edit="font" data-ref="${ref}">${FONTS.map((f) => `<option value="${f.id}" ${f.id === t.font ? "selected" : ""}>${f.label}</option>`).join("")}</select>
      </div>
      <div class="field"><label>Size</label><input type="range" min="14" max="100" data-edit="size" data-ref="${ref}" value="${t.size}"></div>
    </div>
    <div class="toggle-row" style="margin-bottom:10px;">
      <button data-edit="weight" data-ref="${ref}" class="${t.weight >= 700 ? "active" : ""}"><b>B</b></button>
      <button data-edit="italic" data-ref="${ref}" class="${t.italic ? "active" : ""}"><i>I</i></button>
    </div>
    <div class="align-row" style="margin-bottom:10px;">
      <button data-edit="align" data-align="left" data-ref="${ref}" class="${t.align === "left" ? "active" : ""}">⯇</button>
      <button data-edit="align" data-align="center" data-ref="${ref}" class="${t.align === "center" ? "active" : ""}">≡</button>
      <button data-edit="align" data-align="right" data-ref="${ref}" class="${t.align === "right" ? "active" : ""}">⯈</button>
    </div>
    <div class="field"><label>Fill</label>
      <div class="toggle-row">
        <button data-edit="filltype" data-value="solid" data-ref="${ref}" class="${t.fillType !== "gradient" ? "active" : ""}">Solid</button>
        <button data-edit="filltype" data-value="gradient" data-ref="${ref}" class="${t.fillType === "gradient" ? "active" : ""}">Gradient</button>
      </div>
    </div>
    ${t.fillType === "gradient" ? `
    <div class="row-2">
      <div class="field"><label>Color 1</label><input type="color" data-edit="grad1" data-ref="${ref}" value="${t.gradient[0]}"></div>
      <div class="field"><label>Color 2</label><input type="color" data-edit="grad2" data-ref="${ref}" value="${t.gradient[1]}"></div>
    </div>
    <div data-grad-preview="${ref}" style="height:28px;border-radius:8px;margin-bottom:16px;background:linear-gradient(90deg, ${t.gradient[0]}, ${t.gradient[1]});"></div>` : `
    <div class="field"><label>Color</label><input type="color" data-edit="color" data-ref="${ref}" value="${t.color}"></div>`}
    <div class="field"><label>Curve — ${t.curve || 0}</label><input type="range" min="-100" max="100" data-edit="curve" data-ref="${ref}" value="${t.curve || 0}"></div>
    <div class="field">
      <label style="display:flex;align-items:center;justify-content:space-between;">
        <span>Shadow</span>
        <button type="button" data-edit="shadow-toggle" data-ref="${ref}" class="btn-ghost btn-sm" style="padding:2px 8px;${t.shadow.enabled ? "color:var(--primary);font-weight:700;" : ""}">${t.shadow.enabled ? "On" : "Off"}</button>
      </label>
    </div>
    ${t.shadow.enabled ? `
    <div class="row-2">
      <div class="field"><label>Shadow Color</label><input type="color" data-edit="shadow-color" data-ref="${ref}" value="${t.shadow.color}"></div>
      <div class="field"><label>Blur — ${t.shadow.blur}</label><input type="range" min="0" max="30" data-edit="shadow-blur" data-ref="${ref}" value="${t.shadow.blur}"></div>
    </div>
    <div class="row-2">
      <div class="field"><label>Offset X — ${t.shadow.x}</label><input type="range" min="-20" max="20" data-edit="shadow-x" data-ref="${ref}" value="${t.shadow.x}"></div>
      <div class="field"><label>Offset Y — ${t.shadow.y}</label><input type="range" min="-20" max="20" data-edit="shadow-y" data-ref="${ref}" value="${t.shadow.y}"></div>
    </div>` : ""}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <span style="font-size:11.5px;color:var(--text-faint);">✥ Click then drag on canvas to move</span>
      <button type="button" class="btn btn-outline btn-sm" data-reset-pos="${ref}">Reset pos</button>
    </div>
  `;
}

function renderTextPanel() {
  rightPanel.innerHTML = panelShell("Edit Text", `
    ${textBlock("brand", "Brand Name")}
    <hr style="border:none;border-top:1px solid var(--border);margin:18px 0;">
    ${textBlock("slogan", "Slogan")}
  `);

  rightPanel.querySelectorAll('input[data-edit="content"]').forEach((input) => {
    input.addEventListener("focus", beginEdit);
    input.addEventListener("input", () => liveUpdate((p) => { p.text[input.dataset.ref].content = input.value; }));
    input.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('select[data-edit="font"]').forEach((sel) => {
    sel.addEventListener("change", () => commitAction((p) => { p.text[sel.dataset.ref].font = sel.value; }));
  });
  rightPanel.querySelectorAll('input[data-edit="size"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => liveUpdate((p) => { p.text[range.dataset.ref].size = Number(range.value); }));
    range.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="color"]').forEach((color) => {
    color.addEventListener("focus", beginEdit);
    color.addEventListener("input", () => liveUpdate((p) => { p.text[color.dataset.ref].color = color.value; }));
    color.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('button[data-edit="weight"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction((p) => {
      const t = p.text[btn.dataset.ref]; t.weight = t.weight >= 700 ? 400 : 700;
    }));
  });
  rightPanel.querySelectorAll('button[data-edit="italic"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction((p) => { p.text[btn.dataset.ref].italic = !p.text[btn.dataset.ref].italic; }));
  });
  rightPanel.querySelectorAll('button[data-edit="align"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction((p) => { p.text[btn.dataset.ref].align = btn.dataset.align; }));
  });
  rightPanel.querySelectorAll('input[data-edit="curve"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      liveUpdate((p) => { p.text[range.dataset.ref].curve = Number(range.value); });
      range.closest(".field").querySelector("label").textContent = `Curve — ${range.value}`;
    });
    range.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll("button[data-select]").forEach((btn) => {
    btn.addEventListener("click", () => selectLayer(selectedLayerId === btn.dataset.select ? null : btn.dataset.select));
  });
  rightPanel.querySelectorAll("button[data-reset-pos]").forEach((btn) => {
    btn.addEventListener("click", () => commitAction((p) => {
      const t = p.text[btn.dataset.resetPos];
      t.x = 0; t.y = 0;
    }));
  });
  rightPanel.querySelectorAll('button[data-edit="filltype"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction((p) => { p.text[btn.dataset.ref].fillType = btn.dataset.value; }));
  });
  function updateGradPreview(ref) {
    const t = project.text[ref];
    const el = rightPanel.querySelector(`[data-grad-preview="${ref}"]`);
    if (el) el.style.background = `linear-gradient(90deg, ${t.gradient[0]}, ${t.gradient[1]})`;
  }
  rightPanel.querySelectorAll('input[data-edit="grad1"]').forEach((color) => {
    color.addEventListener("focus", beginEdit);
    color.addEventListener("input", () => { liveUpdate((p) => { p.text[color.dataset.ref].gradient[0] = color.value; }); updateGradPreview(color.dataset.ref); });
    color.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="grad2"]').forEach((color) => {
    color.addEventListener("focus", beginEdit);
    color.addEventListener("input", () => { liveUpdate((p) => { p.text[color.dataset.ref].gradient[1] = color.value; }); updateGradPreview(color.dataset.ref); });
    color.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('button[data-edit="shadow-toggle"]').forEach((btn) => {
    btn.addEventListener("click", () => commitAction((p) => { p.text[btn.dataset.ref].shadow.enabled = !p.text[btn.dataset.ref].shadow.enabled; }));
  });
  rightPanel.querySelectorAll('input[data-edit="shadow-color"]').forEach((color) => {
    color.addEventListener("focus", beginEdit);
    color.addEventListener("input", () => liveUpdate((p) => { p.text[color.dataset.ref].shadow.color = color.value; }));
    color.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="shadow-blur"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      liveUpdate((p) => { p.text[range.dataset.ref].shadow.blur = Number(range.value); });
      range.closest(".field").querySelector("label").textContent = `Blur — ${range.value}`;
    });
    range.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="shadow-x"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      liveUpdate((p) => { p.text[range.dataset.ref].shadow.x = Number(range.value); });
      range.closest(".field").querySelector("label").textContent = `Offset X — ${range.value}`;
    });
    range.addEventListener("change", commitEdit);
  });
  rightPanel.querySelectorAll('input[data-edit="shadow-y"]').forEach((range) => {
    range.addEventListener("focus", beginEdit);
    range.addEventListener("input", () => {
      liveUpdate((p) => { p.text[range.dataset.ref].shadow.y = Number(range.value); });
      range.closest(".field").querySelector("label").textContent = `Offset Y — ${range.value}`;
    });
    range.addEventListener("change", commitEdit);
  });
}

function renderIconsPanel() {
  rightPanel.innerHTML = panelShell("Icons", `
    <input type="text" id="iconSearch" placeholder="Search icons..." style="width:100%;margin-bottom:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:9px 11px;font-size:13.5px;">
    <div class="field"><label>Icon Color</label><input type="color" id="iconColor" value="${project.icon.color}"></div>
    <div class="icon-grid" id="iconGrid"></div>
    ${project.icon.visible ? `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;">
      <span style="font-size:11.5px;color:var(--text-faint);">✥ Select then drag on canvas to move</span>
      <button type="button" class="btn btn-outline btn-sm" id="selectIconBtn">${selectedLayerId === "icon" ? "● Selected" : "Select"}</button>
    </div>
    <button type="button" class="btn btn-outline btn-sm" id="removeIconBtn" style="width:100%;margin-top:8px;color:#dc2626;border-color:#f3c9c9;">🗑 Remove Icon</button>` : ""}
  `);

  function paintGrid(filter = "") {
    const list = ICONS.filter((i) => i.label.toLowerCase().includes(filter.toLowerCase()));
    document.getElementById("iconGrid").innerHTML = list.map((icon) => `
      <button data-icon="${icon.id}" class="${project.icon.id === icon.id && project.icon.visible ? "selected" : ""}" title="${icon.label}">${iconSvgMarkup(icon, "currentColor")}</button>
    `).join("");
  }
  paintGrid();

  document.getElementById("iconSearch").addEventListener("input", (e) => paintGrid(e.target.value));
  document.getElementById("iconGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-icon]");
    if (!btn) return;
    commitAction((p) => {
      if (p.icon.visible && p.icon.id === btn.dataset.icon) { p.icon.visible = false; }
      else { p.icon.id = btn.dataset.icon; p.icon.visible = true; }
    });
  });
  const colorInput = document.getElementById("iconColor");
  colorInput.addEventListener("focus", beginEdit);
  colorInput.addEventListener("input", () => liveUpdate((p) => { p.icon.color = colorInput.value; }));
  colorInput.addEventListener("change", commitEdit);
  document.getElementById("selectIconBtn")?.addEventListener("click", () => selectLayer(selectedLayerId === "icon" ? null : "icon"));
  document.getElementById("removeIconBtn")?.addEventListener("click", () => clearLayer("icon"));
}

function renderShapesPanel() {
  rightPanel.innerHTML = panelShell("Shapes", `
    <div class="shape-grid" id="shapeGrid">
      ${SHAPES.map((s) => `
        <button data-shape="${s.id}" class="${project.shape.id === s.id ? "selected" : ""}">
          <span class="shape-preview ${s.id}"></span>${s.label}
        </button>`).join("")}
    </div>
    <div class="field"><label>Shape Color</label><input type="color" id="shapeColor" value="${project.shape.color}"></div>
    ${project.shape.visible ? `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:11.5px;color:var(--text-faint);">✥ Select then drag on canvas to move</span>
      <button type="button" class="btn btn-outline btn-sm" id="selectShapeBtn">${selectedLayerId === "shape" ? "● Selected" : "Select"}</button>
    </div>
    <button type="button" class="btn btn-outline btn-sm" id="removeShapeBtn" style="width:100%;margin-top:8px;color:#dc2626;border-color:#f3c9c9;">🗑 Remove Shape</button>` : ""}
  `);

  document.getElementById("shapeGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-shape]");
    if (!btn) return;
    commitAction((p) => {
      p.shape.id = btn.dataset.shape;
      p.shape.visible = btn.dataset.shape !== "none";
    });
  });
  const colorInput = document.getElementById("shapeColor");
  colorInput.addEventListener("focus", beginEdit);
  colorInput.addEventListener("input", () => liveUpdate((p) => { p.shape.color = colorInput.value; }));
  colorInput.addEventListener("change", commitEdit);
  document.getElementById("selectShapeBtn")?.addEventListener("click", () => selectLayer(selectedLayerId === "shape" ? null : "shape"));
  document.getElementById("removeShapeBtn")?.addEventListener("click", () => clearLayer("shape"));
}

function renderBackgroundPanel() {
  const bg = project.canvas.background;
  rightPanel.innerHTML = panelShell("Background", `
    <div class="field"><label>Solid Colors</label></div>
    <div class="swatch-grid" id="solidGrid">
      ${SOLID_COLORS.map((c) => `<button class="swatch ${bg.type === "color" && bg.value === c ? "selected" : ""}" data-color="${c}" style="background:${c};"></button>`).join("")}
    </div>
    <div class="field"><label>Gradient Colors</label></div>
    <div class="gradient-grid" id="gradGrid">
      ${GRADIENTS.map((g, i) => `<button class="gradient-swatch ${bg.type === "gradient" && JSON.stringify(bg.value) === JSON.stringify(g) ? "selected" : ""}" data-grad="${i}" style="background:linear-gradient(135deg, ${g[0]}, ${g[1]});"></button>`).join("")}
    </div>
    <div class="field"><label>Custom Color</label><input type="color" id="customBg" value="${bg.type === "color" ? bg.value : "#ffffff"}"></div>
  `);

  document.getElementById("solidGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-color]");
    if (!btn) return;
    commitAction((p) => { p.canvas.background = { type: "color", value: btn.dataset.color }; });
  });
  document.getElementById("gradGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-grad]");
    if (!btn) return;
    commitAction((p) => { p.canvas.background = { type: "gradient", value: GRADIENTS[Number(btn.dataset.grad)] }; });
  });
  const customBg = document.getElementById("customBg");
  customBg.addEventListener("focus", beginEdit);
  customBg.addEventListener("input", () => liveUpdate((p) => { p.canvas.background = { type: "color", value: customBg.value }; }));
  customBg.addEventListener("change", commitEdit);
}

function renderUploadsPanel() {
  rightPanel.innerHTML = panelShell("Uploads", `
    <label class="upload-drop" for="fileInput">📁 Click to upload an image<br><span style="font-size:11px;">PNG, JPG or SVG</span></label>
    <input type="file" id="fileInput" accept="image/*" style="display:none;">
    <div class="field"><label>My Files</label></div>
    <div class="upload-grid" id="uploadGrid"></div>
  `);

  function paintUploads() {
    document.getElementById("uploadGrid").innerHTML = listUploads().map((u) => `
      <div class="thumb" data-upload="${u.id}"><img src="${u.dataUrl}"></div>
    `).join("") || `<div style="grid-column:1/-1;color:var(--text-faint);font-size:12px;">No uploads yet.</div>`;
  }
  paintUploads();

  document.getElementById("fileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const entry = addUpload(reader.result, file.name);
      commitAction((p) => { p.image.src = entry.dataUrl; p.image.visible = true; });
      paintUploads();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("uploadGrid").addEventListener("click", (e) => {
    const thumb = e.target.closest(".thumb[data-upload]");
    if (!thumb) return;
    const entry = listUploads().find((u) => u.id === thumb.dataset.upload);
    if (!entry) return;
    commitAction((p) => { p.image.src = entry.dataUrl; p.image.visible = true; });
  });
}

const ELEMENTS = [
  { id: "none", label: "None" },
  { id: "underline", label: "Underline" },
  { id: "double-line", label: "Double Line" },
  { id: "dot", label: "Dot" },
  { id: "brackets", label: "Corner Brackets" },
];

function renderElementsPanel() {
  rightPanel.innerHTML = panelShell("Elements", `
    <p style="font-size:12.5px;color:var(--text-dim);margin-top:-8px;">Decorative accents placed near your text.</p>
    <div class="shape-grid" id="elementGrid" style="grid-template-columns:repeat(2,1fr);">
      ${ELEMENTS.map((el) => `<button data-element="${el.id}" class="${project.element.id === el.id ? "selected" : ""}">${el.label}</button>`).join("")}
    </div>
    ${project.element.visible ? `<button type="button" class="btn btn-outline btn-sm" id="removeElementBtn" style="width:100%;margin-top:10px;color:#dc2626;border-color:#f3c9c9;">🗑 Remove Element</button>` : ""}
  `);
  document.getElementById("elementGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-element]");
    if (!btn) return;
    commitAction((p) => { p.element.id = btn.dataset.element; p.element.visible = btn.dataset.element !== "none"; });
  });
  document.getElementById("removeElementBtn")?.addEventListener("click", () => clearLayer("element"));
}

const LAYER_LABELS = { shape: "Background Shape", image: "Logo Image", icon: "Icon", element: "Element", brand: "Brand Name Text", slogan: "Slogan Text" };
function layerVisible(layer) {
  if (layer.type === "text") return project.text[layer.ref].visible;
  return project[layer.type].visible;
}
function setLayerVisible(layer, val) {
  if (layer.type === "text") project.text[layer.ref].visible = val;
  else project[layer.type].visible = val;
}

function renderLayersPanel() {
  rightPanel.innerHTML = panelShell("Layers", `
    <p style="font-size:12.5px;color:var(--text-dim);margin-top:-8px;">Top of the list renders on top.</p>
    <div id="layerList"></div>
  `);
  const list = document.getElementById("layerList");
  const ordered = [...project.layers].reverse();
  list.innerHTML = ordered.map((layer, i) => `
    <div class="layer-row" data-id="${layer.id}" style="${selectedLayerId === layer.id ? "border-color:var(--primary);background:var(--primary-light);" : ""}cursor:${movableTarget(layer.id) ? "pointer" : "default"};">
      <button data-act="vis" title="Toggle visibility">${layerVisible(layer) ? "👁" : "🚫"}</button>
      <span class="layer-name">${LAYER_LABELS[layer.id] || layer.id}</span>
      <button data-act="up" title="Move up" ${i === 0 ? "disabled" : ""}>⬆</button>
      <button data-act="down" title="Move down" ${i === ordered.length - 1 ? "disabled" : ""}>⬇</button>
      ${CLEARABLE[layer.id] ? `<button data-act="delete" title="Delete" style="color:#dc2626;">🗑</button>` : ""}
    </div>
  `).join("");

  list.addEventListener("click", (e) => {
    const row = e.target.closest(".layer-row");
    if (!row) return;
    const id = row.dataset.id;
    const btn = e.target.closest("button[data-act]");
    if (!btn) {
      if (movableTarget(id)) selectLayer(selectedLayerId === id ? null : id);
      return;
    }
    const act = btn.dataset.act;
    if (act === "delete") { clearLayer(id); renderPanel(); return; }
    commitAction((p) => {
      const layer = p.layers.find((l) => l.id === id);
      if (act === "vis") setLayerVisible(layer, !layerVisible(layer));
      else if (act === "up" || act === "down") {
        const idx = p.layers.findIndex((l) => l.id === id);
        const targetIdx = act === "up" ? idx + 1 : idx - 1;
        if (targetIdx >= 0 && targetIdx < p.layers.length) {
          [p.layers[idx], p.layers[targetIdx]] = [p.layers[targetIdx], p.layers[idx]];
        }
      }
    });
  });
}

const PANEL_RENDERERS = {
  templates: renderTemplatesPanel,
  text: renderTextPanel,
  icons: renderIconsPanel,
  shapes: renderShapesPanel,
  background: renderBackgroundPanel,
  uploads: renderUploadsPanel,
  elements: renderElementsPanel,
  layers: renderLayersPanel,
};

function renderPanel() {
  toolSidebar.querySelectorAll(".tool-btn").forEach((b) => b.classList.toggle("active", b.dataset.tool === activeTool));
  PANEL_RENDERERS[activeTool]();
}

toolSidebar.addEventListener("click", (e) => {
  const btn = e.target.closest(".tool-btn");
  if (!btn) return;
  activeTool = btn.dataset.tool;
  renderPanel();
});

document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("redoBtn").addEventListener("click", redo);

document.getElementById("saveBtn").addEventListener("click", () => {
  const thumb = canvasToDataUrl(canvas, "png");
  saveCurrentLogo(thumb);
  const btn = document.getElementById("saveBtn");
  const old = btn.textContent;
  btn.textContent = "Saved ✓";
  setTimeout(() => { btn.textContent = old; }, 1400);
});

document.getElementById("previewBtn").addEventListener("click", () => {
  window.location.href = "preview.html";
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  window.location.href = "download.html";
});

/* ---------------- Init ---------------- */

async function init() {
  [categories, logos] = await Promise.all([
    fetch("data/categories.json").then((r) => r.json()),
    fetch("data/logos.json").then((r) => r.json()),
  ]);

  const projectId = qs("project");
  const logoId = qs("logo");

  if (projectId) {
    const saved = JSON.parse(localStorage.getItem("lm_saved_logos") || "[]").find((s) => s.id === projectId);
    project = normalizeProject(saved ? saved.project : defaultProject(logos[0]));
  } else if (logoId) {
    const logo = logos.find((l) => l.id === logoId) || logos[0];
    project = startProject(logo);
  } else {
    project = getCurrentProject() || startProject(logos[0]);
  }
  setCurrentProject(project);

  const tool = qs("tool");
  if (tool && PANEL_RENDERERS[tool]) activeTool = tool;

  renderPanel();
  await draw();
}

init();
