// Client-side persistence for the print design editor (flyers, posters,
// invoices, etc). Mirrors card-store.js / social-store.js (localStorage only,
// no backend) but keyed separately for print projects.
const CURRENT_KEY = "lm_print_current_project";
const SAVED_KEY = "lm_saved_print";

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

export function getCurrentPrintProject() {
  return read(CURRENT_KEY, null);
}
export function setCurrentPrintProject(project) {
  write(CURRENT_KEY, project);
}

export function startPrintProject(template) {
  const project = JSON.parse(JSON.stringify(template));
  project.sourceTemplateId = template.id;
  setCurrentPrintProject(project);
  return project;
}

export function listSavedPrint() {
  return read(SAVED_KEY, []);
}
export function saveCurrentPrint(thumbnailDataUrl) {
  const project = getCurrentPrintProject();
  if (!project) return null;
  const saved = listSavedPrint();
  const entry = { id: "print_" + Date.now(), savedAt: Date.now(), thumbnail: thumbnailDataUrl, project };
  saved.unshift(entry);
  write(SAVED_KEY, saved);
  return entry;
}
