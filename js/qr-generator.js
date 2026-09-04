import { QRCode } from "./qrcode-lib.js";

const canvas = document.getElementById("qrCanvas");
const ctx = canvas.getContext("2d");
const fieldsHost = document.getElementById("fieldsHost");
const typeRow = document.getElementById("typeRow");
const fgColor = document.getElementById("fgColor");
const bgColor = document.getElementById("bgColor");
const transparentBg = document.getElementById("transparentBg");
const ecLevel = document.getElementById("ecLevel");
const qrError = document.getElementById("qrError");

let activeType = "url";
let logoSrc = null;
let logoImg = null;
let categories = [];
let logos = [];
let pickerCat = null;
let lastQr = null;

const FIELD_SETS = {
  url: [{ id: "url", label: "Website URL", placeholder: "https://example.com", value: "https://ailogomakerpro.com" }],
  text: [{ id: "text", label: "Text", placeholder: "Any text you want to encode", value: "Hello there!" }],
  email: [
    { id: "to", label: "Email Address", placeholder: "hello@example.com", value: "" },
    { id: "subject", label: "Subject (optional)", placeholder: "", value: "" },
  ],
  phone: [{ id: "phone", label: "Phone Number", placeholder: "+1 123 456 7890", value: "" }],
  sms: [
    { id: "phone", label: "Phone Number", placeholder: "+1 123 456 7890", value: "" },
    { id: "message", label: "Message (optional)", placeholder: "", value: "" },
  ],
  wifi: [
    { id: "ssid", label: "Network Name (SSID)", placeholder: "MyWiFi", value: "" },
    { id: "password", label: "Password", placeholder: "", value: "" },
  ],
};

function escapeWifi(s) { return (s || "").replace(/([\\;,:"])/g, "\\$1"); }

function buildPayload() {
  const get = (id) => document.getElementById(`f_${id}`)?.value.trim() || "";
  switch (activeType) {
    case "url": {
      let v = get("url");
      if (v && !/^https?:\/\//i.test(v)) v = "https://" + v;
      return v;
    }
    case "text":
      return get("text");
    case "email": {
      const to = get("to"), subject = get("subject");
      return `mailto:${to}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
    }
    case "phone":
      return `tel:${get("phone")}`;
    case "sms": {
      const phone = get("phone"), msg = get("message");
      return `sms:${phone}${msg ? `?body=${encodeURIComponent(msg)}` : ""}`;
    }
    case "wifi": {
      const ssid = escapeWifi(get("ssid")), pass = escapeWifi(get("password"));
      return `WIFI:T:WPA;S:${ssid};P:${pass};;`;
    }
    default:
      return "";
  }
}

function renderFields() {
  fieldsHost.innerHTML = FIELD_SETS[activeType].map((f) => `
    <div class="field">
      <label>${f.label}</label>
      <input type="text" id="f_${f.id}" placeholder="${f.placeholder}" value="${f.value}">
    </div>`).join("");
  fieldsHost.querySelectorAll("input").forEach((input) => input.addEventListener("input", scheduleRender));
}

let renderTimer = null;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderQr, 150);
}

function drawQrToCtx(targetCtx, size, opts = {}) {
  const fg = opts.fg ?? fgColor.value;
  const bg = opts.transparent ? null : (opts.bg ?? bgColor.value);
  const count = lastQr.getModuleCount();
  const quiet = 4; // standard quiet-zone modules
  const totalModules = count + quiet * 2;
  const cell = size / totalModules;

  targetCtx.clearRect(0, 0, size, size);
  if (bg) { targetCtx.fillStyle = bg; targetCtx.fillRect(0, 0, size, size); }
  targetCtx.fillStyle = fg;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (lastQr.isDark(r, c)) {
        targetCtx.fillRect((c + quiet) * cell, (r + quiet) * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
  }

  if (opts.logo && logoImg) {
    const logoSize = size * 0.22;
    const lx = (size - logoSize) / 2, ly = (size - logoSize) / 2;
    const pad = logoSize * 0.14;
    targetCtx.fillStyle = bg || "#ffffff";
    targetCtx.fillRect(lx - pad, ly - pad, logoSize + pad * 2, logoSize + pad * 2);
    targetCtx.drawImage(logoImg, lx, ly, logoSize, logoSize);
  }
}

function renderQr() {
  const payload = buildPayload();
  qrError.textContent = "";
  if (!payload) { ctx.clearRect(0, 0, canvas.width, canvas.height); lastQr = null; return; }
  try {
    lastQr = QRCode.encodeText(payload, { ecLevel: ecLevel.value });
  } catch (err) {
    qrError.textContent = err.message;
    lastQr = null;
    return;
  }
  drawQrToCtx(ctx, canvas.width, { logo: !!logoSrc });
}

typeRow.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-type]");
  if (!btn) return;
  activeType = btn.dataset.type;
  typeRow.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
  renderFields();
  renderQr();
});

[fgColor, bgColor, ecLevel].forEach((el) => el.addEventListener("input", renderQr));
transparentBg.addEventListener("change", () => { bgColor.disabled = transparentBg.checked; renderQr(); });

// ---- Logo picker (reuses the shared logo library) ----
function paintLogoPickerGrid() {
  const grid = document.getElementById("logoPickerGrid");
  const list = logos.filter((l) => l.categoryId === pickerCat).slice(0, 32);
  grid.innerHTML = list.map((l) => `
    <button type="button" data-logo-src="${l.image}" title="${l.name}" style="aspect-ratio:1;padding:4px;border:1px solid var(--border);border-radius:6px;background:#fff;cursor:pointer;">
      <img src="${l.image}" alt="${l.name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;">
    </button>`).join("");
  grid.querySelectorAll("button[data-logo-src]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLogo(btn.dataset.logoSrc);
      document.getElementById("logoPicker").style.display = "none";
    });
  });
}
function setLogo(src) {
  logoSrc = src;
  const img = new Image();
  img.onload = () => { logoImg = img; document.getElementById("removeLogoBtn").style.display = ""; renderQr(); };
  img.src = src;
}
document.getElementById("chooseLogoBtn").addEventListener("click", () => {
  const picker = document.getElementById("logoPicker");
  const open = picker.style.display !== "none";
  picker.style.display = open ? "none" : "block";
  if (!open) paintLogoPickerGrid();
});
document.getElementById("removeLogoBtn").addEventListener("click", () => {
  logoSrc = null; logoImg = null;
  document.getElementById("removeLogoBtn").style.display = "none";
  renderQr();
});

// ---- Downloads ----
document.getElementById("downloadPngBtn").addEventListener("click", () => {
  if (!lastQr) return;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1200;
  exportCanvas.height = 1200;
  drawQrToCtx(exportCanvas.getContext("2d"), 1200, { logo: !!logoSrc, transparent: transparentBg.checked });
  const a = document.createElement("a");
  a.href = exportCanvas.toDataURL("image/png");
  a.download = "qr-code.png";
  a.click();
});

document.getElementById("downloadSvgBtn").addEventListener("click", () => {
  if (!lastQr) return;
  const count = lastQr.getModuleCount();
  const quiet = 4;
  const total = count + quiet * 2;
  const fg = fgColor.value;
  const bg = transparentBg.checked ? null : bgColor.value;
  let rects = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (lastQr.isDark(r, c)) rects += `<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}">${bg ? `<rect width="${total}" height="${total}" fill="${bg}"/>` : ""}<g fill="${fg}">${rects}</g></svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "qr-code.svg";
  a.click();
  URL.revokeObjectURL(url);
});

async function init() {
  const [catData, logoData] = await Promise.all([
    fetch("data/categories.json").then((r) => r.json()),
    fetch("data/logos.json").then((r) => r.json()),
  ]);
  categories = catData;
  logos = logoData;
  pickerCat = categories[0]?.id || null;
  document.getElementById("logoPickerCat").innerHTML = categories.map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("");
  document.getElementById("logoPickerCat").addEventListener("change", (e) => { pickerCat = e.target.value; paintLogoPickerGrid(); });

  renderFields();
  renderQr();
}
init();
