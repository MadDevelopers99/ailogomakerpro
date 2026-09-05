// Fully client-side background removal — the ML model (U2-Net based) runs
// in the browser via WASM through @imgly/background-removal. No API key, no
// server upload, no per-use cost or rate limit.
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const statusArea = document.getElementById("statusArea");
const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const errorText = document.getElementById("errorText");
const compareArea = document.getElementById("compareArea");
const actionsArea = document.getElementById("actionsArea");
const originalImg = document.getElementById("originalImg");
const resultImg = document.getElementById("resultImg");
const downloadBtn = document.getElementById("downloadBtn");
const tryAnotherBtn = document.getElementById("tryAnotherBtn");

let resultBlobUrl = null;
let removeBackgroundFn = null;

async function loadLibrary() {
  if (removeBackgroundFn) return removeBackgroundFn;
  const mod = await import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/+esm");
  removeBackgroundFn = mod.removeBackground;
  return removeBackgroundFn;
}

function resetUI() {
  compareArea.style.display = "none";
  actionsArea.style.display = "none";
  statusArea.style.display = "none";
  errorText.textContent = "";
  progressBar.style.width = "0%";
  if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null; }
}

async function processFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  resetUI();
  statusArea.style.display = "block";
  statusText.textContent = "Loading AI model… (first use only, then it's cached)";
  originalImg.src = URL.createObjectURL(file);

  try {
    const removeBackground = await loadLibrary();
    statusText.textContent = "Removing background…";
    const blob = await removeBackground(file, {
      progress: (key, current, total) => {
        if (total > 0) {
          const pct = Math.round((current / total) * 100);
          progressBar.style.width = pct + "%";
          statusText.textContent = key.includes("fetch") ? `Downloading AI model… ${pct}%` : `Removing background… ${pct}%`;
        }
      },
    });
    resultBlobUrl = URL.createObjectURL(blob);
    resultImg.src = resultBlobUrl;
    statusArea.style.display = "none";
    compareArea.style.display = "grid";
    actionsArea.style.display = "flex";
  } catch (err) {
    console.error(err);
    statusText.textContent = "Something went wrong.";
    errorText.textContent = err.message || "Failed to process this image. Try a different photo, or a modern browser (Chrome/Edge/Firefox).";
  }
}

fileInput.addEventListener("change", () => processFile(fileInput.files[0]));

dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

downloadBtn.addEventListener("click", () => {
  if (!resultBlobUrl) return;
  const a = document.createElement("a");
  a.href = resultBlobUrl;
  a.download = "background-removed.png";
  a.click();
});

tryAnotherBtn.addEventListener("click", () => {
  resetUI();
  fileInput.value = "";
});
