// AI Design Assistant — picks a real template from the site's existing template
// library and asks the shared /api/ai-generate proxy to write the copy for it,
// then hands the filled-in project to the matching editor via its own store
// module (same localStorage handoff every gallery page already uses).
import { aiGenerate } from "./ai-client.js";
import { startCardProject, setCurrentCardProject } from "./card-store.js";
import { startSocialProject, setCurrentSocialProject } from "./social-store.js";
import { startPrintProject, setCurrentPrintProject } from "./print-store.js";
import { startWebsiteProject, setCurrentWebsiteProject } from "./website-store.js";
import { startPresentationProject, setCurrentPresentationProject } from "./presentation-store.js";
import { startProject, setCurrentProject } from "./project-store.js";

const typeGrid = document.getElementById("typeGrid");
const form = document.getElementById("genForm");
const platformField = document.getElementById("platformField");
const generateBtn = document.getElementById("generateBtn");
const loadingText = document.getElementById("loadingText");
const errorText = document.getElementById("errorText");

let activeType = "logo";

const requestedType = new URLSearchParams(location.search).get("type");
if (requestedType) {
  const match = [...typeGrid.children].find((b) => b.dataset.type === requestedType);
  if (match) {
    activeType = requestedType;
    [...typeGrid.children].forEach((b) => b.classList.toggle("active", b === match));
    platformField.style.display = activeType === "social" ? "block" : "none";
  }
}

typeGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".aia-type-btn");
  if (!btn) return;
  activeType = btn.dataset.type;
  [...typeGrid.children].forEach((b) => b.classList.toggle("active", b === btn));
  platformField.style.display = activeType === "social" ? "block" : "none";
});

function scoreOverlap(a, b) {
  const wordsA = (a.toLowerCase().match(/[a-z]+/g) || []).filter((w) => w.length > 2);
  const setB = new Set((b.toLowerCase().match(/[a-z]+/g) || []).filter((w) => w.length > 2));
  return wordsA.filter((w) => setB.has(w)).length;
}
function bestMatch(items, text, labelKey, slugKey) {
  if (!items || !items.length) return null;
  let best = null, bestScore = 0;
  for (const it of items) {
    const s = scoreOverlap(text, `${it[labelKey] || ""} ${it[slugKey] || ""}`);
    if (s > bestScore) { bestScore = s; best = it; }
  }
  return best || items[Math.floor(Math.random() * items.length)];
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function textFieldIds(elements) {
  return (elements || [])
    .filter((e) => e.type === "text" && e.id !== "logo_mark" && e.id !== "qr_placeholder" && (e.text || "").length > 2)
    .map((e) => e.id)
    .slice(0, 10);
}
function applyFields(elements, fields) {
  if (!fields) return;
  (elements || []).forEach((e) => {
    if (e.type === "text" && fields[e.id] != null) e.text = String(fields[e.id]).slice(0, 140);
  });
}

async function handleCard(description, industry) {
  const meta = await fetch("data/business-cards-meta.json").then((r) => r.json());
  const cat = bestMatch(meta.categories, `${description} ${industry}`, "label", "slug");
  const list = await fetch(`data/business-cards/${cat.slug}.json`).then((r) => r.json());
  const template = pickRandom(list.templates);
  const fieldIds = textFieldIds(template.elements);
  const { fields } = await aiGenerate("template-copy", { contentType: "business card", description, industry, fields: fieldIds });
  const project = startCardProject(template);
  applyFields(project.elements, fields);
  setCurrentCardProject(project);
  return `card-editor.html?cat=${cat.slug}&id=${template.id}`;
}

async function handleSocial(description, industry, platform) {
  const slug = platform || "instagram-posts";
  const list = await fetch(`data/social-media/${slug}.json`).then((r) => r.json());
  const template = pickRandom(list.templates);
  const fieldIds = textFieldIds(template.elements);
  const { fields } = await aiGenerate("template-copy", { contentType: "social media post", description, industry, fields: fieldIds });
  const project = startSocialProject(template);
  applyFields(project.elements, fields);
  setCurrentSocialProject(project);
  return `social-editor.html?platform=${slug}&id=${template.id}`;
}

async function handlePrint(description, industry, printCat) {
  const list = await fetch(`data/print-templates/${printCat}.json`).then((r) => r.json());
  const template = pickRandom(list.templates);
  const fieldIds = textFieldIds(template.elements);
  const { fields } = await aiGenerate("template-copy", { contentType: printCat.slice(0, -1), description, industry, fields: fieldIds });
  const project = startPrintProject(template);
  applyFields(project.elements, fields);
  setCurrentPrintProject(project);
  return `print-editor.html?cat=${printCat}&id=${template.id}`;
}

async function handleWebsite(description, industry) {
  const cats = await fetch("data/website-categories.json").then((r) => r.json());
  const cat = bestMatch(cats, `${description} ${industry}`, "label", "slug");
  const list = await fetch(`data/website-templates/${cat.slug}.json`).then((r) => r.json());
  const template = pickRandom(list.templates);
  const { fields } = await aiGenerate("template-copy", { contentType: "website", description, industry, fields: ["company", "headline", "subheadline"] });
  const project = startWebsiteProject(template);
  const nav = project.sections.find((s) => s.type === "nav");
  const hero = project.sections.find((s) => s.type === "hero");
  if (fields) {
    if (nav && fields.company) nav.brand = String(fields.company).toUpperCase().slice(0, 40);
    if (hero && fields.headline) hero.heading = String(fields.headline).slice(0, 90);
    if (hero && fields.subheadline) hero.subheading = String(fields.subheadline).slice(0, 140);
  }
  setCurrentWebsiteProject(project);
  return `website-editor.html?cat=${cat.slug}&id=${template.id}`;
}

async function handlePresentation(description, industry) {
  const meta = await fetch("data/presentation-templates-meta.json").then((r) => r.json());
  const deckMeta = bestMatch(meta.decks, `${description} ${industry}`, "category", "slug");
  const template = await fetch(`data/presentation-templates/${deckMeta.slug}.json`).then((r) => r.json());
  const titleSlide = template.slides.find((s) => s.id === "slide_title");
  const fieldIds = titleSlide ? textFieldIds(titleSlide.elements).filter((id) => id !== "presenter_line") : ["heading", "subheading"];
  const { fields } = await aiGenerate("template-copy", { contentType: "presentation title slide", description, industry, fields: fieldIds });
  const project = startPresentationProject(template);
  const slide = project.slides.find((s) => s.id === "slide_title");
  if (slide) applyFields(slide.elements, fields);
  setCurrentPresentationProject(project);
  return `presentation-editor.html?id=${deckMeta.slug}`;
}

async function handleLogo(description, industry) {
  const cats = await fetch("data/categories.json").then((r) => r.json());
  const cat = bestMatch(cats, `${description} ${industry}`, "name", "id");
  const logos = await fetch("data/logos.json").then((r) => r.json());
  const pool = logos.filter((l) => l.categoryId === cat.id);
  const logo = pickRandom(pool.length ? pool : logos);
  const { names } = await aiGenerate("business-names", { description, industry });
  const suggestion = names && names[0];
  const project = startProject(logo);
  if (suggestion) {
    project.text.brand.content = String(suggestion.name || "").toUpperCase().slice(0, 40);
    project.text.slogan.content = String(suggestion.tagline || "").toUpperCase().slice(0, 60);
  }
  setCurrentProject(project);
  return "editor.html";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const description = document.getElementById("description").value.trim();
  const industry = document.getElementById("industry").value.trim();
  const platform = document.getElementById("platform").value;
  if (!description) return;

  generateBtn.disabled = true;
  loadingText.style.display = "block";
  errorText.textContent = "";

  try {
    let url;
    if (activeType === "logo") url = await handleLogo(description, industry);
    else if (activeType === "card") url = await handleCard(description, industry);
    else if (activeType === "social") url = await handleSocial(description, industry, platform);
    else if (activeType === "flyers" || activeType === "posters") url = await handlePrint(description, industry, activeType);
    else if (activeType === "website") url = await handleWebsite(description, industry);
    else if (activeType === "presentation") url = await handlePresentation(description, industry);
    if (url) window.location.href = url;
  } catch (err) {
    errorText.textContent = err.message || "Something went wrong. Please try again.";
    generateBtn.disabled = false;
    loadingText.style.display = "none";
  }
});
