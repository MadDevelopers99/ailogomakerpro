// Client-side persistence for the business card editor. Mirrors project-store.js's
// pattern (localStorage only, no backend) but keyed separately from logo projects.
const CURRENT_KEY = "lm_card_current_project";
const SAVED_KEY = "lm_saved_cards";

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

export function getCurrentCardProject() {
  return read(CURRENT_KEY, null);
}
export function setCurrentCardProject(project) {
  write(CURRENT_KEY, project);
}

// Deep-clones the template so in-editor edits never mutate the shared
// data/business-cards.json objects held in memory.
export function startCardProject(template) {
  const project = JSON.parse(JSON.stringify(template));
  project.sourceTemplateId = template.id;
  setCurrentCardProject(project);
  return project;
}

export function listSavedCards() {
  return read(SAVED_KEY, []);
}
export function saveCurrentCard(thumbnailDataUrl) {
  const project = getCurrentCardProject();
  if (!project) return null;
  const saved = listSavedCards();
  const entry = { id: "card_" + Date.now(), savedAt: Date.now(), thumbnail: thumbnailDataUrl, project };
  saved.unshift(entry);
  write(SAVED_KEY, saved);
  return entry;
}
