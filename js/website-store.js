// Client-side persistence for the website editor. Mirrors card-store.js /
// social-store.js (localStorage only, no backend) but keyed for website projects.
const CURRENT_KEY = "lm_website_current_project";
const SAVED_KEY = "lm_saved_websites";

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

export function getCurrentWebsiteProject() {
  return read(CURRENT_KEY, null);
}
export function setCurrentWebsiteProject(project) {
  write(CURRENT_KEY, project);
}

export function startWebsiteProject(template) {
  const project = JSON.parse(JSON.stringify(template));
  project.sourceTemplateId = template.id;
  setCurrentWebsiteProject(project);
  return project;
}

export function listSavedWebsites() {
  return read(SAVED_KEY, []);
}
export function saveCurrentWebsite() {
  const project = getCurrentWebsiteProject();
  if (!project) return null;
  const saved = listSavedWebsites();
  const entry = { id: "website_" + Date.now(), savedAt: Date.now(), project };
  saved.unshift(entry);
  write(SAVED_KEY, saved);
  return entry;
}
