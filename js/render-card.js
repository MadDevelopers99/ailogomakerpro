// Canvas renderer for the Business Card Maker template schema
// (data/business-cards.json). Independent from render-logo.js since the
// card schema is a different shape (absolute x/y elements array, its own
// shape vocabulary: rect/roundedRect/circle/triangle/diamond/line).

const ICON_PATHS = {
  phone: "M6 3h4l1 5-2.5 1.5a12 12 0 006 6L16 13l5 1v4a2 2 0 01-2 2C10.5 20 4 13.5 4 5a2 2 0 012-2z",
  email: "M4 5h16v14H4zM4 6l8 7 8-7",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z",
  location: "M12 21s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12zM12 11a2 2 0 100-4 2 2 0 000 4z",
};

async function ensureFont(family) {
  try {
    await Promise.all([
      document.fonts.load(`400 32px "${family}"`),
      document.fonts.load(`800 32px "${family}"`),
    ]);
  } catch { /* fall back silently */ }
}

const imageCache = new Map();
function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

function withRotation(ctx, el, draw) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  if (el.rotation) {
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    draw(-el.width / 2, -el.height / 2, el.width, el.height);
  } else {
    draw(el.x, el.y, el.width, el.height);
  }
  ctx.restore();
}

function drawShape(ctx, el) {
  ctx.fillStyle = el.color;
  withRotation(ctx, el, (x, y, w, h) => {
    if (el.shape === "rect" || el.shape === "line") {
      ctx.fillRect(x, y, w, h);
    } else if (el.shape === "roundedRect") {
      const r = Math.min(20, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    } else if (el.shape === "circle") {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (el.shape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
    } else if (el.shape === "diamond") {
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      ctx.fill();
    }
  });
}

// If el.maxWidth is set, shrinks the font (down to 50% of el.fontSize) until
// the text fits — keeps ready-made templates from overflowing their canvas
// when a variant swaps in longer copy, without permanently mutating el.
function fitFontSize(ctx, el) {
  const font = (size) => `${el.bold ? 800 : 400} ${size}px "${el.fontFamily}", "Segoe UI", sans-serif`;
  if (!el.maxWidth) return el.fontSize;
  let size = el.fontSize;
  const minSize = Math.max(8, el.fontSize * 0.5);
  ctx.font = font(size);
  while (ctx.measureText(el.text || "").width > el.maxWidth && size > minSize) {
    size -= 1;
    ctx.font = font(size);
  }
  return size;
}

function drawText(ctx, el) {
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.textAlign = el.align === "center" ? "center" : el.align === "right" ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  const fontSize = fitFontSize(ctx, el);
  ctx.font = `${el.bold ? 800 : 400} ${fontSize}px "${el.fontFamily}", "Segoe UI", sans-serif`;

  const w = Math.max(ctx.measureText(el.text || "").width, 10);
  const h = fontSize * 1.2;
  let x = el.x;
  if (el.align === "center") x -= w / 2;
  else if (el.align === "right") x -= w;
  const box = { x, y: el.y - h * 0.8, w, h };

  if (el.stroke?.enabled && el.stroke.width > 0) {
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = el.stroke.width;
    ctx.strokeStyle = el.stroke.color || "#000000";
    ctx.strokeText(el.text, el.x, el.y);
  }

  if (el.shadow?.enabled) {
    ctx.shadowColor = el.shadow.color || "rgba(0,0,0,0.5)";
    ctx.shadowBlur = el.shadow.blur ?? 6;
    ctx.shadowOffsetX = el.shadow.x ?? 2;
    ctx.shadowOffsetY = el.shadow.y ?? 2;
  }

  if (el.fillType === "gradient" && Array.isArray(el.gradient) && el.gradient.length === 2) {
    const grad = ctx.createLinearGradient(box.x, 0, box.x + box.w, 0);
    grad.addColorStop(0, el.gradient[0]);
    grad.addColorStop(1, el.gradient[1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = el.color;
  }
  ctx.fillText(el.text, el.x, el.y);

  ctx.restore();
  return box;
}

function drawImage(ctx, el, img) {
  if (!img) return;
  withRotation(ctx, el, (x, y, w, h) => {
    const fit = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * fit, dh = img.naturalHeight * fit;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  });
}

function drawBackgroundImage(ctx, img, w, h) {
  if (!img) return;
  const fit = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * fit, dh = img.naturalHeight * fit;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.fillStyle = `rgba(0,0,0,${0.4})`;
  ctx.fillRect(0, 0, w, h);
}

function drawIcon(ctx, el) {
  const d = ICON_PATHS[el.icon];
  if (!d) return;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.translate(el.x, el.y);
  ctx.scale(el.size / 24, el.size / 24);
  ctx.strokeStyle = el.color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(d));
  ctx.restore();
}

// Entrance animation: given el.animation = {type, delay, duration}, returns a
// clone of el with opacity/position/size adjusted for elapsed time `timeMs`.
// Never mutates el. Absent el.animation or opts.time => el is returned as-is.
function animateElement(el, timeMs) {
  if (timeMs === undefined || !el.animation) return el;
  const { type = "fade", delay = 0, duration = 500 } = el.animation;
  const t = Math.max(0, Math.min(1, (timeMs - delay) / duration));
  const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
  const clone = { ...el };
  clone.opacity = (el.opacity ?? 1) * eased;
  if (type === "slide-up") clone.y = el.y + (1 - eased) * 40;
  else if (type === "slide-down") clone.y = el.y - (1 - eased) * 40;
  else if (type === "slide-left") clone.x = el.x + (1 - eased) * 60;
  else if (type === "slide-right") clone.x = el.x - (1 - eased) * 60;
  else if (type === "zoom") {
    const scale = 0.6 + 0.4 * eased;
    if (el.type === "text") {
      clone.fontSize = (el.fontSize || 24) * scale;
    } else if (el.width !== undefined) {
      const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
      clone.width = el.width * scale;
      clone.height = el.height * scale;
      clone.x = cx - clone.width / 2;
      clone.y = cy - clone.height / 2;
    }
  }
  return clone;
}

/** Renders a business card template onto the given canvas at its native 1050x600
 * coordinate space, scaled to fit canvas.width/canvas.height (set by the caller).
 * opts.selectedId draws a dashed selection outline around that element's text box.
 * Returns { ctx, boxes } where boxes maps text element id -> its box in the
 * canvas's native (unscaled) coordinate space (i.e. template.canvas.width/height units). */
export async function renderCardToCanvas(canvas, template, opts = {}) {
  const NATIVE_W = template.canvas?.width || 1050;
  const NATIVE_H = template.canvas?.height || 600;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / NATIVE_W, canvas.height / NATIVE_H);

  const bg = template.background;
  let bgImage = null;
  if (bg && bg.type === "image" && bg.src) {
    bgImage = await loadImage(bg.src);
  }
  if (bgImage) {
    drawBackgroundImage(ctx, bgImage, NATIVE_W, NATIVE_H);
  } else if (bg && bg.type === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
  }

  const visibleEls = (template.elements || []).filter((el) => el.visible !== false);
  const fontFamilies = new Set(["Poppins"]);
  visibleEls.forEach((el) => { if (el.type === "text" && el.fontFamily) fontFamilies.add(el.fontFamily); });
  await Promise.all([...fontFamilies].map(ensureFont));
  const images = await Promise.all(
    visibleEls.map((el) => (el.type === "image" ? loadImage(el.src) : Promise.resolve(null)))
  );

  const boxes = {};
  visibleEls.forEach((rawEl, i) => {
    const el = animateElement(rawEl, opts.time);
    if (el.type === "shape") drawShape(ctx, el);
    else if (el.type === "text") boxes[el.id] = drawText(ctx, el);
    else if (el.type === "icon") drawIcon(ctx, el);
    else if (el.type === "image") { drawImage(ctx, el, images[i]); boxes[el.id] = { x: el.x, y: el.y, w: el.width, h: el.height }; }
  });

  if (opts.selectedId && boxes[opts.selectedId]) {
    const b = boxes[opts.selectedId];
    ctx.save();
    ctx.strokeStyle = "#6C5CE7";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
    ctx.restore();
  }

  ctx.restore();
  return { ctx, boxes };
}
