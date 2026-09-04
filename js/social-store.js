// Client-side persistence for the social media editor. Mirrors card-store.js's
// pattern (localStorage only, no backend) but keyed separately from card/logo projects.
const CURRENT_KEY = "lm_social_current_project";
const SAVED_KEY = "lm_saved_social";

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

export function getCurrentSocialProject() {
  return read(CURRENT_KEY, null);
}
export function setCurrentSocialProject(project) {
  write(CURRENT_KEY, project);
}

// Deep-clones the template so in-editor edits never mutate the shared
// data/social-media/<platform>.json objects held in memory.
export function startSocialProject(template) {
  const project = JSON.parse(JSON.stringify(template));
  project.sourceTemplateId = template.id;
  setCurrentSocialProject(project);
  return project;
}

export function listSavedSocial() {
  return read(SAVED_KEY, []);
}
export function saveCurrentSocial(thumbnailDataUrl) {
  const project = getCurrentSocialProject();
  if (!project) return null;
  const saved = listSavedSocial();
  const entry = { id: "social_" + Date.now(), savedAt: Date.now(), thumbnail: thumbnailDataUrl, project };
  saved.unshift(entry);
  write(SAVED_KEY, saved);
  return entry;
}
