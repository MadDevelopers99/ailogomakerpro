// Client-side persistence for the editor. Everything lives in localStorage —
// there is no backend, so "cloud save" / "sign in" are simulated locally.
const CURRENT_KEY = "lm_current_project";
const SAVED_KEY = "lm_saved_logos";
const UPLOADS_KEY = "lm_uploads";
const BRAND_KIT_KEY = "lm_brand_kit";
const FAVORITES_KEY = "lm_favorites";

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

export function getBrandKit() {
  return read(BRAND_KIT_KEY, null);
}
export function setBrandKit(kit) {
  write(BRAND_KIT_KEY, kit);
}

export function defaultProject(sourceLogo) {
  const kit = getBrandKit();
  return {
    id: "proj_" + Date.now(),
    createdAt: Date.now(),
    sourceLogoId: sourceLogo ? sourceLogo.id : null,
    canvas: { size: 800, background: { type: "color", value: "#ffffff" } },
    layout: "below", // below | overlay | logo-only
    image: { src: sourceLogo ? sourceLogo.image : null, visible: true, x: 0, y: 0, scaleX: 1, scaleY: 1 },
    icon: { id: null, color: (kit && kit.primaryColor) || "#6C5CE7", visible: false, x: 0, y: 0, scaleX: 1, scaleY: 1 },
    shape: { id: "none", color: "#F1EFFF", visible: false, x: 0, y: 0, scaleX: 1, scaleY: 1 },
    element: { id: "none", visible: false },
    text: {
      brand: {
        content: sourceLogo ? sourceLogo.name : "BRAND NAME",
        font: (kit && kit.font) || "Poppins",
        size: 54,
        weight: 700,
        italic: false,
        align: "center",
        color: (kit && kit.primaryColor) || "#16181d",
        fillType: "solid", // solid | gradient
        gradient: ["#6C5CE7", "#00CEC9"],
        shadow: { enabled: false, color: "#000000", blur: 6, x: 2, y: 2 },
        visible: true,
        x: 0,
        y: 0,
        curve: 0,
      },
      slogan: {
        content: "SLOGAN HERE",
        font: (kit && kit.font) || "Poppins",
        size: 22,
        weight: 400,
        italic: false,
        align: "center",
        color: (kit && kit.secondaryColor) || "#6b7280",
        fillType: "solid",
        gradient: ["#6C5CE7", "#00CEC9"],
        shadow: { enabled: false, color: "#000000", blur: 6, x: 2, y: 2 },
        visible: true,
        x: 0,
        y: 0,
        curve: 0,
      },
    },
    layers: [
      { id: "shape", type: "shape" },
      { id: "image", type: "image" },
      { id: "icon", type: "icon" },
      { id: "element", type: "element" },
      { id: "brand", type: "text", ref: "brand" },
      { id: "slogan", type: "text", ref: "slogan" },
    ],
  };
}

// Fills in fields introduced after a project may have been saved, so old
// localStorage entries (missing x/y/curve) don't crash the renderer.
export function normalizeProject(project) {
  if (!project) return project;
  const d = defaultProject(null);
  project.image = { ...d.image, ...project.image };
  project.icon = { ...d.icon, ...project.icon };
  project.shape = { ...d.shape, ...project.shape };
  project.element = { ...d.element, ...project.element };
  project.text = project.text || {};
  project.text.brand = { ...d.text.brand, ...project.text.brand, shadow: { ...d.text.brand.shadow, ...(project.text.brand || {}).shadow } };
  project.text.slogan = { ...d.text.slogan, ...project.text.slogan, shadow: { ...d.text.slogan.shadow, ...(project.text.slogan || {}).shadow } };
  project.layers = project.layers || d.layers;
  return project;
}

export function getCurrentProject() {
  return normalizeProject(read(CURRENT_KEY, null));
}
export function setCurrentProject(project) {
  write(CURRENT_KEY, project);
}
export function startProject(sourceLogo) {
  const p = defaultProject(sourceLogo);
  setCurrentProject(p);
  return p;
}

export function listSavedLogos() {
  return read(SAVED_KEY, []);
}
export function saveCurrentLogo(thumbnailDataUrl) {
  const project = getCurrentProject();
  if (!project) return null;
  const saved = listSavedLogos();
  const entry = {
    id: project.id,
    name: project.text.brand.content || "Untitled Logo",
    thumbnail: thumbnailDataUrl,
    updatedAt: Date.now(),
    project,
  };
  const idx = saved.findIndex((s) => s.id === project.id);
  if (idx >= 0) saved[idx] = entry;
  else saved.unshift(entry);
  write(SAVED_KEY, saved);
  return entry;
}
export function deleteSavedLogo(id) {
  write(SAVED_KEY, listSavedLogos().filter((s) => s.id !== id));
}
export function loadSavedLogo(id) {
  const found = listSavedLogos().find((s) => s.id === id);
  if (!found) return null;
  const project = normalizeProject(found.project);
  setCurrentProject(project);
  return project;
}

export function listUploads() {
  return read(UPLOADS_KEY, []);
}
export function addUpload(dataUrl, name) {
  const uploads = listUploads();
  const entry = { id: "up_" + Date.now(), name: name || "Upload", dataUrl };
  uploads.unshift(entry);
  write(UPLOADS_KEY, uploads);
  return entry;
}

export function listFavorites() {
  return read(FAVORITES_KEY, []);
}
export function isFavorite(logoId) {
  return listFavorites().includes(logoId);
}
export function toggleFavorite(logoId) {
  const favs = listFavorites();
  const idx = favs.indexOf(logoId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.unshift(logoId);
  write(FAVORITES_KEY, favs);
  return favs.includes(logoId);
}
