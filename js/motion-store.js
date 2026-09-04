// Client-side persistence for the animation/video editor. Mirrors
// social-store.js (localStorage only, no backend) but keyed for motion projects.
const CURRENT_KEY = "lm_motion_current_project";
const SAVED_KEY = "lm_saved_motion";

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

export function getCurrentMotionProject() {
  return read(CURRENT_KEY, null);
}
export function setCurrentMotionProject(project) {
  write(CURRENT_KEY, project);
}

export function startMotionProject(template) {
  const project = JSON.parse(JSON.stringify(template));
  project.sourceTemplateId = template.id;
  setCurrentMotionProject(project);
  return project;
}

export function listSavedMotion() {
  return read(SAVED_KEY, []);
}
export function saveCurrentMotion() {
  const project = getCurrentMotionProject();
  if (!project) return null;
  const saved = listSavedMotion();
  const entry = { id: "motion_" + Date.now(), savedAt: Date.now(), project };
  saved.unshift(entry);
  write(SAVED_KEY, saved);
  return entry;
}
