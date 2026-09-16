// Shared "maximum options" background editor — Color, Gradient, Split
// (2/3/4-color + triangle), Pattern/texture, and Photo (curated + live
// Pexels search), plus corner-rounding and a 3D/glossy light effect that
// apply on top of any background type. Rendering itself lives in
// render-card.js (drawBackground/applyBackgroundEffect/applyCornerRadius) so
// every editor built on renderCardToCanvas gets the same real result.
//
// Usage: call backgroundPanelHtml(bg, opts) to get the panel's HTML, insert
// it into your panel, then call wireBackgroundPanel(root, getBg, callbacks).

const SPLIT_PRESETS = {
  2: ["#6C5CE7", "#00CEC9"],
  3: ["#FF6B6B", "#FFD93D", "#4D96FF"],
  4: ["#FF6B6B", "#FFD93D", "#4D96FF", "#6BCB77"],
};
const RAINBOW = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#0A84FF", "#AF52DE"];
const PATTERNS = [
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "lines", label: "Diagonal Lines" },
  { id: "waves", label: "Waves" },
  { id: "noise", label: "Noise" },
];

function esc(s) { return (s ?? "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export function backgroundPanelHtml(bg, opts = {}) {
  const type = bg?.type || "solid";
  const bgCategories = opts.bgCategories || [];
  const tabs = [
    ["solid", "Color"], ["gradient", "Gradient"], ["split", "Split"], ["pattern", "Texture"], ["image", "Photo"],
  ];
  return `
    <div class="field bgp-root">
      <label>Background</label>
      <div class="bgp-tabs">
        ${tabs.map(([id, label]) => `<button type="button" class="bgp-tab${type === id ? " on" : ""}" data-bgp-tab="${id}">${label}</button>`).join("")}
      </div>

      <div class="bgp-pane" data-bgp-pane="solid" style="${type === "solid" ? "" : "display:none;"}">
        <input type="color" id="bgpSolidColor" value="${bg?.color || "#ffffff"}">
      </div>

      <div class="bgp-pane" data-bgp-pane="gradient" style="${type === "gradient" ? "" : "display:none;"}">
        <div class="row-2">
          <div class="field"><label>Color 1</label><input type="color" id="bgpGrad1" value="${bg?.stops?.[0] || "#6C5CE7"}"></div>
          <div class="field"><label>Color 2</label><input type="color" id="bgpGrad2" value="${bg?.stops?.[1] || "#00CEC9"}"></div>
        </div>
        <div class="toggle-row" style="margin:8px 0;">
          <button type="button" data-bgp-gradtype="linear" class="${(bg?.gradientType || "linear") === "linear" ? "active" : ""}">Linear</button>
          <button type="button" data-bgp-gradtype="radial" class="${bg?.gradientType === "radial" ? "active" : ""}">Radial</button>
        </div>
        <div class="field" data-bgp-angle-field style="${bg?.gradientType === "radial" ? "display:none;" : ""}">
          <label>Angle — ${bg?.angle ?? 135}°</label>
          <input type="range" id="bgpGradAngle" min="0" max="360" value="${bg?.angle ?? 135}">
        </div>
        <button type="button" class="btn btn-outline btn-sm" id="bgpRainbowBtn" style="width:100%;">🌈 Rainbow Preset</button>
      </div>

      <div class="bgp-pane" data-bgp-pane="split" style="${type === "split" ? "" : "display:none;"}">
        <div class="toggle-row" style="margin-bottom:8px;">
          <button type="button" data-bgp-splitcount="2" class="${(bg?.splitColors?.length || 2) === 2 ? "active" : ""}">2 Color</button>
          <button type="button" data-bgp-splitcount="3" class="${bg?.splitColors?.length === 3 ? "active" : ""}">3 Color</button>
          <button type="button" data-bgp-splitcount="4" class="${bg?.splitColors?.length === 4 ? "active" : ""}">4 Color</button>
        </div>
        <div class="toggle-row" style="margin-bottom:8px;">
          <button type="button" data-bgp-splitstyle="diagonal" class="${(bg?.splitStyle || "diagonal") === "diagonal" ? "active" : ""}">Diagonal</button>
          <button type="button" data-bgp-splitstyle="triangle" class="${bg?.splitStyle === "triangle" ? "active" : ""}">Triangle</button>
          <button type="button" data-bgp-splitstyle="vertical" class="${bg?.splitStyle === "vertical" ? "active" : ""}">Vertical</button>
          <button type="button" data-bgp-splitstyle="horizontal" class="${bg?.splitStyle === "horizontal" ? "active" : ""}">Horizontal</button>
        </div>
        <div id="bgpSplitColors" class="bgp-swatchrow"></div>
      </div>

      <div class="bgp-pane" data-bgp-pane="pattern" style="${type === "pattern" ? "" : "display:none;"}">
        <select id="bgpPatternType" style="width:100%;margin-bottom:8px;background:#fff;border:1px solid var(--border);border-radius:8px;padding:7px;font-size:12.5px;">
          ${PATTERNS.map((p) => `<option value="${p.id}" ${((bg?.pattern) || "dots") === p.id ? "selected" : ""}>${p.label}</option>`).join("")}
        </select>
        <div class="row-2">
          <div class="field"><label>Background</label><input type="color" id="bgpPatternBg" value="${bg?.patternBg || "#F5F5F7"}"></div>
          <div class="field"><label>Pattern Color</label><input type="color" id="bgpPatternColor" value="${bg?.patternColorHex || "#6C5CE7"}"></div>
        </div>
      </div>

      <div class="bgp-pane" data-bgp-pane="image" style="${type === "image" ? "" : "display:none;"}">
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <input type="text" id="bgpSearchInput" placeholder="Search photos...">
          <button type="button" class="btn btn-outline btn-sm" id="bgpSearchBtn">Search</button>
        </div>
        <select id="bgpPickerCat" style="width:100%;margin-bottom:8px;background:#fff;border:1px solid var(--border);border-radius:8px;padding:7px;font-size:12.5px;">
          ${bgCategories.map((c) => `<option value="${c}">${c.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}</option>`).join("")}
        </select>
        <div id="bgpSearchStatus" style="font-size:11.5px;color:var(--text-faint);margin-bottom:6px;display:none;"></div>
        <div id="bgpPhotoGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-height:200px;overflow-y:auto;"></div>
      </div>

      <div class="ced-line" style="margin:14px 0 10px;"></div>
      <div class="field">
        <label>Corner Rounding — ${bg?.cornerRadius || 0}px</label>
        <input type="range" id="bgpCornerRadius" min="0" max="80" value="${bg?.cornerRadius || 0}">
      </div>
      <div class="field">
        <label style="display:flex;align-items:center;justify-content:space-between;">
          <span>3D / Glossy Effect</span>
          <button type="button" id="bgpEffect3d" class="btn-ghost btn-sm" style="padding:2px 8px;${bg?.effect === "3d" ? "color:var(--primary);font-weight:700;" : ""}">${bg?.effect === "3d" ? "On" : "Off"}</button>
        </label>
      </div>
    </div>`;
}

export function wireBackgroundPanel(root, getBg, callbacks) {
  const { onChange, onCommit, searchPhotos, cardBackgrounds = {} } = callbacks;
  let bgPickerCat = Object.keys(cardBackgrounds).sort()[0] || null;

  function update(patch) {
    onChange({ ...getBg(), ...patch });
  }

  // Tabs
  root.querySelectorAll("[data-bgp-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.bgpTab;
      root.querySelectorAll("[data-bgp-tab]").forEach((b) => b.classList.toggle("on", b === btn));
      root.querySelectorAll("[data-bgp-pane]").forEach((p) => { p.style.display = p.dataset.bgpPane === type ? "" : "none"; });
      const bg = getBg();
      if (type === "solid") update({ type: "solid", color: bg.color || "#ffffff" });
      else if (type === "gradient") update({ type: "gradient", stops: bg.stops || ["#6C5CE7", "#00CEC9"], gradientType: bg.gradientType || "linear", angle: bg.angle ?? 135 });
      else if (type === "split") update({ type: "split", splitColors: bg.splitColors || SPLIT_PRESETS[2], splitStyle: bg.splitStyle || "diagonal" });
      else if (type === "pattern") update({ type: "pattern", pattern: bg.pattern || "dots", patternBg: bg.patternBg || "#F5F5F7", patternColor: bg.patternColorHex || "#6C5CE7" });
      else if (type === "image") { /* left as-is until user picks a photo */ }
      onCommit?.();
    });
  });

  // Solid
  root.querySelector("#bgpSolidColor")?.addEventListener("input", (e) => update({ type: "solid", color: e.target.value }));
  root.querySelector("#bgpSolidColor")?.addEventListener("change", () => onCommit?.());

  // Gradient
  function currentStops() {
    const bg = getBg();
    return Array.isArray(bg.stops) && bg.stops.length >= 2 ? bg.stops : ["#6C5CE7", "#00CEC9"];
  }
  root.querySelector("#bgpGrad1")?.addEventListener("input", (e) => { const s = currentStops(); s[0] = e.target.value; update({ type: "gradient", stops: s }); });
  root.querySelector("#bgpGrad2")?.addEventListener("input", (e) => { const s = currentStops(); s[1] = e.target.value; update({ type: "gradient", stops: s }); });
  root.querySelectorAll("#bgpGrad1, #bgpGrad2").forEach((el) => el.addEventListener("change", () => onCommit?.()));
  root.querySelectorAll("[data-bgp-gradtype]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update({ type: "gradient", gradientType: btn.dataset.bgpGradtype });
      onCommit?.();
      const angleField = root.querySelector("[data-bgp-angle-field]");
      if (angleField) angleField.style.display = btn.dataset.bgpGradtype === "radial" ? "none" : "";
      root.querySelectorAll("[data-bgp-gradtype]").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });
  const angleInput = root.querySelector("#bgpGradAngle");
  angleInput?.addEventListener("input", () => {
    update({ type: "gradient", angle: Number(angleInput.value) });
    angleInput.closest(".field").querySelector("label").textContent = `Angle — ${angleInput.value}°`;
  });
  angleInput?.addEventListener("change", () => onCommit?.());
  root.querySelector("#bgpRainbowBtn")?.addEventListener("click", () => {
    update({ type: "gradient", stops: [...RAINBOW], gradientType: "linear", angle: 90 });
    onCommit?.();
  });

  // Split
  function renderSplitSwatches() {
    const bg = getBg();
    const colors = Array.isArray(bg.splitColors) && bg.splitColors.length >= 2 ? bg.splitColors : SPLIT_PRESETS[2];
    const wrap = root.querySelector("#bgpSplitColors");
    if (!wrap) return;
    wrap.innerHTML = colors.map((c, i) => `<input type="color" data-split-idx="${i}" value="${c}">`).join("");
    wrap.querySelectorAll("[data-split-idx]").forEach((input) => {
      input.addEventListener("input", () => {
        const cols = [...(getBg().splitColors || colors)];
        cols[Number(input.dataset.splitIdx)] = input.value;
        update({ type: "split", splitColors: cols });
      });
      input.addEventListener("change", () => onCommit?.());
    });
  }
  renderSplitSwatches();
  root.querySelectorAll("[data-bgp-splitcount]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.bgpSplitcount);
      update({ type: "split", splitColors: SPLIT_PRESETS[n] });
      onCommit?.();
      root.querySelectorAll("[data-bgp-splitcount]").forEach((b) => b.classList.toggle("active", b === btn));
      renderSplitSwatches();
    });
  });
  root.querySelectorAll("[data-bgp-splitstyle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update({ type: "split", splitStyle: btn.dataset.bgpSplitstyle });
      onCommit?.();
      root.querySelectorAll("[data-bgp-splitstyle]").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  // Pattern
  root.querySelector("#bgpPatternType")?.addEventListener("change", (e) => { update({ type: "pattern", pattern: e.target.value }); onCommit?.(); });
  root.querySelector("#bgpPatternBg")?.addEventListener("input", (e) => update({ type: "pattern", patternBg: e.target.value }));
  root.querySelector("#bgpPatternColor")?.addEventListener("input", (e) => update({ type: "pattern", patternColorHex: e.target.value, patternColor: e.target.value }));
  root.querySelectorAll("#bgpPatternBg, #bgpPatternColor").forEach((el) => el.addEventListener("change", () => onCommit?.()));

  // Photo
  function paintPhotoGrid(sources) {
    const grid = root.querySelector("#bgpPhotoGrid");
    if (!grid) return;
    grid.innerHTML = sources.map(({ src, title }) => `
      <button type="button" data-bgp-photo="${src}" title="${esc(title || "")}" style="aspect-ratio:16/9;padding:0;border:1px solid var(--border);border-radius:6px;overflow:hidden;cursor:pointer;background:#fff;">
        <img src="${src}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
      </button>`).join("");
    grid.querySelectorAll("[data-bgp-photo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        update({ type: "image", src: btn.dataset.bgpPhoto });
        onCommit?.();
      });
    });
  }
  function paintCategoryGrid() {
    paintPhotoGrid((cardBackgrounds[bgPickerCat] || []).map((src) => ({ src })));
  }
  const catSelect = root.querySelector("#bgpPickerCat");
  if (catSelect) {
    if (bgPickerCat) catSelect.value = bgPickerCat;
    catSelect.addEventListener("change", () => { bgPickerCat = catSelect.value; paintCategoryGrid(); });
    paintCategoryGrid();
  }
  const searchInput = root.querySelector("#bgpSearchInput");
  const searchBtn = root.querySelector("#bgpSearchBtn");
  const status = root.querySelector("#bgpSearchStatus");
  async function runSearch(query) {
    if (!searchPhotos || !query.trim()) return;
    status.style.display = "block";
    status.textContent = "Searching photos…";
    try {
      const photos = await searchPhotos(query);
      if (!photos.length) { status.textContent = "No photos found — try a different search."; root.querySelector("#bgpPhotoGrid").innerHTML = ""; return; }
      status.style.display = "none";
      paintPhotoGrid(photos.map((p) => ({ src: p.full, title: p.alt })));
    } catch (err) {
      status.style.display = "block";
      status.textContent = err.message;
    }
  }
  searchBtn?.addEventListener("click", () => runSearch(searchInput.value));
  searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); runSearch(searchInput.value); } });

  // Shared corner-radius + 3D effect controls (apply regardless of active tab/type).
  const radiusInput = root.querySelector("#bgpCornerRadius");
  radiusInput?.addEventListener("input", () => {
    update({ cornerRadius: Number(radiusInput.value) });
    radiusInput.closest(".field").querySelector("label").textContent = `Corner Rounding — ${radiusInput.value}px`;
  });
  radiusInput?.addEventListener("change", () => onCommit?.());
  root.querySelector("#bgpEffect3d")?.addEventListener("click", (e) => {
    const bg = getBg();
    const on = bg.effect === "3d";
    update({ effect: on ? "none" : "3d" });
    e.target.textContent = on ? "Off" : "On";
    e.target.style.color = on ? "" : "var(--primary)";
    e.target.style.fontWeight = on ? "" : "700";
    onCommit?.();
  });
}
