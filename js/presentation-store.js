// Client-side persistence for the presentation editor. Mirrors the other
// *-store.js modules (localStorage only, no backend) but keyed for decks.
const CURRENT_KEY = "lm_presentation_current_project";
const SAVED_KEY = "lm_saved_presentations";

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

export function getCurrentPresentationProject() {
  return read(CURRENT_KEY, null);
}
export function setCurrentPresentationProject(project) {
  write(CURRENT_KEY, project);
}

export function startPresentationProject(template) {
  const project = JSON.parse(JSON.stringify(template));
  project.sourceTemplateId = template.id;
  setCurrentPresentationProject(project);
  return project;
}

export function listSavedPresentations() {
  return read(SAVED_KEY, []);
}
export function saveCurrentPresentation() {
  const project = getCurrentPresentationProject();
  if (!project) return null;
  const saved = listSavedPresentations();
  const entry = { id: "presentation_" + Date.now(), savedAt: Date.now(), project };
  saved.unshift(entry);
  write(SAVED_KEY, saved);
  return entry;
}
