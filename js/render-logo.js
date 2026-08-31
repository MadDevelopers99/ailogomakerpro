import { ICONS, iconSvgMarkup } from "./icons.js";

const imageCache = new Map();
function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

function iconImage(iconId, color) {
  const icon = ICONS.find((i) => i.id === iconId);
  if (!icon) return Promise.resolve(null);
  return loadImage("data:image/svg+xml;base64," + btoa(iconSvgMarkup(icon, color)));
}

async function ensureFont(family, weight) {
  try {
    await document.fonts.load(`${weight} 32px "${family}"`);
  } catch {
    /* fall back silently to default stack */
  }
}

// Drawn centered at the local origin, then the caller translates/scales into
// place — this is what lets width and height be resized independently
// (ctx.scale(scaleX, scaleY) stretches the whole shape along each axis).
function drawShape(ctx, shapeId, color, cx, cy, size, scaleX = 1, scaleY = 1) {
  if (!shapeId || shapeId === "none") return;
  const r = size * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, scaleY);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.02 / Math.max(Math.min(scaleX, scaleY), 0.001);
  if (shapeId === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (shapeId === "ring") {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shapeId === "rounded-square") {
    const s = r * 1.7;
    const x = -s / 2;
    const y = -s / 2;
    const rad = s * 0.18;
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + s, y, x + s, y + s, rad);
    ctx.arcTo(x + s, y + s, x, y + s, rad);
    ctx.arcTo(x, y + s, x, y, rad);
    ctx.arcTo(x, y, x + s, y, rad);
    ctx.closePath();
    ctx.fill();
  } else if (shapeId === "hexagon") {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = r * Math.cos(angle);
      const py = r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (shapeId === "triangle") {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.95, r * 0.8);
    ctx.lineTo(-r * 0.95, r * 0.8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// The 8 drag handles around a selected layer's box, used both to draw them
// and (by the editor) to hit-test which one a pointerdown landed on.
function computeHandles(box, canvasSize) {
  const s = Math.max(14, canvasSize * 0.02);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return {
    nw: { x: box.x, y: box.y, size: s, cursor: "nwse-resize" },
    n: { x: cx, y: box.y, size: s, cursor: "ns-resize" },
    ne: { x: box.x + box.w, y: box.y, size: s, cursor: "nesw-resize" },
    e: { x: box.x + box.w, y: cy, size: s, cursor: "ew-resize" },
    se: { x: box.x + box.w, y: box.y + box.h, size: s, cursor: "nwse-resize" },
    s: { x: cx, y: box.y + box.h, size: s, cursor: "ns-resize" },
    sw: { x: box.x, y: box.y + box.h, size: s, cursor: "nesw-resize" },
    w: { x: box.x, y: cy, size: s, cursor: "ew-resize" },
  };
}
const RESIZABLE_LAYERS = { image: true, icon: true, shape: true };

function drawElement(ctx, elementId, size, textY) {
  if (!elementId || elementId === "none") return;
  ctx.save();
  ctx.strokeStyle = "#c7cbe0";
  ctx.lineWidth = 2;
  const cx = size / 2;
  if (elementId === "underline") {
    ctx.beginPath();
    ctx.moveTo(cx - 60, textY + 14);
    ctx.lineTo(cx + 60, textY + 14);
    ctx.stroke();
  } else if (elementId === "double-line") {
    [textY + 10, textY + 16].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(cx - 60, y);
      ctx.lineTo(cx + 60, y);
      ctx.stroke();
    });
  } else if (elementId === "dot") {
    ctx.fillStyle = "#c7cbe0";
    ctx.beginPath();
    ctx.arc(cx, textY + 14, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (elementId === "brackets") {
    const w = size * 0.7;
    const x1 = cx - w / 2;
    const x2 = cx + w / 2;
    const y1 = size * 0.08;
    const y2 = size * 0.92;
    ctx.beginPath();
    ctx.moveTo(x1 + 20, y1);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, y1 + 20);
    ctx.moveTo(x2 - 20, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x2, y1 + 20);
    ctx.moveTo(x1 + 20, y2);
    ctx.lineTo(x1, y2);
    ctx.lineTo(x1, y2 - 20);
    ctx.moveTo(x2 - 20, y2);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y2 - 20);
    ctx.stroke();
  }
  ctx.restore();
}

function paintBackground(ctx, bg, size) {
  if (!bg || bg.type === "color") {
    ctx.fillStyle = (bg && bg.value) || "#ffffff";
    ctx.fillRect(0, 0, size, size);
  } else if (bg.type === "gradient") {
    const [a, b] = bg.value;
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, a);
    grad.addColorStop(1, b);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else if (bg.type === "transparent") {
    ctx.clearRect(0, 0, size, size);
  }
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#000000");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}
function lerpColor(hexA, hexB, frac) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * frac));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function applyShadow(ctx, shadow) {
  if (shadow && shadow.enabled) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.x;
    ctx.shadowOffsetY = shadow.y;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
}

/** Draws text along an arc. curve: -100..100 (0 handled by caller as straight text). */
function drawCurvedText(ctx, text, centerX, baselineY, curve, font, t) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  applyShadow(ctx, t.shadow);

  const sign = curve > 0 ? 1 : -1;
  const strength = Math.min(Math.abs(curve), 100);

  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  // Angular span scales with the slider, independent of text length, so the
  // curve "feels" the same intensity whether the text is short or long.
  const totalAngle = (strength / 100) * Math.PI * 0.85;
  const radius = totalWidth / Math.max(totalAngle, 0.001);
  const cy = baselineY + sign * radius; // circle center: below baseline for a dome, above for a cup

  let a = -totalAngle / 2;
  let widthSoFar = 0;
  for (let i = 0; i < chars.length; i++) {
    const w = widths[i];
    const charAngle = w / radius;
    a += charAngle / 2;

    const px = centerX + radius * Math.sin(a);
    const py = sign > 0 ? cy - radius * Math.cos(a) : cy + radius * Math.cos(a);
    const theta = sign > 0 ? a : -a;

    // A true continuous gradient can't follow per-glyph rotation, so each
    // character is filled with the gradient color at its position along the
    // word — reads as a smooth sweep across the curve.
    if (t.fillType === "gradient") {
      const frac = totalWidth > 0 ? (widthSoFar + w / 2) / totalWidth : 0;
      ctx.fillStyle = lerpColor(t.gradient[0], t.gradient[1], frac);
    } else {
      ctx.fillStyle = t.color;
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(theta);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();

    widthSoFar += w;
    a += charAngle / 2;
  }
  ctx.restore();

  return { width: totalWidth, angle: totalAngle, radius };
}

function textBoundingBox(ctx, t, tx, ty) {
  ctx.font = `${t.italic ? "italic" : "normal"} ${t.weight} ${t.size}px "${t.font}", "Segoe UI", sans-serif`;
  const metrics = ctx.measureText(t.content || "");
  const w = Math.max(metrics.width, 20);
  const h = t.size * 1.3;
  let x = tx;
  if (t.align === "center") x -= w / 2;
  else if (t.align === "right") x -= w;
  return { x, y: ty - h * 0.75, w, h };
}

/**
 * Renders a project onto the given canvas. Returns { ctx, boxes } once all
 * async assets (images, icons, fonts) are loaded and drawn. `boxes` gives
 * each visible layer's bounding rect in canvas-internal pixels, used by the
 * editor for click-to-select / drag.
 */
export async function renderProjectToCanvas(canvas, project, opts = {}) {
  const size = opts.size || project.canvas.size || 800;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const transparent = opts.transparentBackground && project.canvas.background.type !== "image";
  if (!transparent) paintBackground(ctx, project.canvas.background, size);
  else if (project.canvas.background.type === "image") {
    const bgImg = await loadImage(project.canvas.background.value);
    if (bgImg) ctx.drawImage(bgImg, 0, 0, size, size);
  }

  const layout = project.layout;
  let imgBox;
  if (layout === "overlay") imgBox = { x: 0, y: 0, w: size, h: size };
  else if (layout === "logo-only") imgBox = { x: size * 0.08, y: size * 0.08, w: size * 0.84, h: size * 0.84 };
  else imgBox = { x: size * 0.12, y: size * 0.08, w: size * 0.76, h: size * 0.55 };

  const [logoImg, iconImg] = await Promise.all([
    loadImage(project.image.src),
    project.icon.visible ? iconImage(project.icon.id, project.icon.color) : Promise.resolve(null),
  ]);

  await Promise.all([
    ensureFont(project.text.brand.font, project.text.brand.weight),
    ensureFont(project.text.slogan.font, project.text.slogan.weight),
  ]);

  const textY = layout === "overlay" ? size - size * 0.18 : imgBox.y + imgBox.h + size * 0.09;
  const boxes = {};

  for (const layer of project.layers) {
    if (layer.type === "shape") {
      if (project.shape.visible) {
        const cx = size / 2 + project.shape.x, cy = size / 2 + project.shape.y;
        const sx = project.shape.scaleX ?? 1, sy = project.shape.scaleY ?? 1;
        drawShape(ctx, project.shape.id, project.shape.color, cx, cy, size, sx, sy);
        const r = size * 0.42;
        const rw = r * sx, rh = r * sy;
        boxes.shape = { x: cx - rw, y: cy - rh, w: rw * 2, h: rh * 2 };
      }
    } else if (layer.type === "image") {
      if (project.image.visible && logoImg && layout !== "icon-only") {
        const fitScale = Math.min(imgBox.w / logoImg.naturalWidth, imgBox.h / logoImg.naturalHeight);
        const sx = project.image.scaleX ?? 1, sy = project.image.scaleY ?? 1;
        const dw = logoImg.naturalWidth * fitScale * sx;
        const dh = logoImg.naturalHeight * fitScale * sy;
        const centerX = imgBox.x + imgBox.w / 2 + project.image.x;
        const centerY = imgBox.y + imgBox.h / 2 + project.image.y;
        const dx = centerX - dw / 2;
        const dy = centerY - dh / 2;
        ctx.drawImage(logoImg, dx, dy, dw, dh);
        boxes.image = { x: dx, y: dy, w: dw, h: dh };
      }
    } else if (layer.type === "icon") {
      if (project.icon.visible && iconImg) {
        const baseIw = size * 0.16;
        const sx = project.icon.scaleX ?? 1, sy = project.icon.scaleY ?? 1;
        const iw = baseIw * sx, ih = baseIw * sy;
        const centerX = size / 2 + project.icon.x;
        const centerY = imgBox.y + imgBox.h * 0.15 + baseIw / 2 + project.icon.y;
        const ix = centerX - iw / 2;
        const iy = centerY - ih / 2;
        ctx.drawImage(iconImg, ix, iy, iw, ih);
        boxes.icon = { x: ix, y: iy, w: iw, h: ih };
      }
    } else if (layer.type === "element") {
      if (project.element.visible) drawElement(ctx, project.element.id, size, textY);
    } else if (layer.type === "text") {
      const t = project.text[layer.ref];
      if (t.visible && t.content && layout !== "logo-only" && layout !== "icon-only") {
        const baseTx = t.align === "left" ? size * 0.12 : t.align === "right" ? size * 0.88 : size / 2;
        const baseTy = layer.ref === "brand" ? textY : textY + project.text.brand.size * 0.85;
        const tx = baseTx + t.x;
        const ty = baseTy + t.y;

        const style = t.italic ? "italic" : "normal";
        const font = `${style} ${t.weight} ${t.size}px "${t.font}", "Segoe UI", sans-serif`;

        if (t.curve) {
          const res = drawCurvedText(ctx, t.content, tx, ty, t.curve, font, t);
          boxes[layer.ref] = { x: tx - res.width / 2, y: ty - t.size * 1.4, w: res.width, h: t.size * 2.2 };
        } else {
          ctx.save();
          ctx.textAlign = t.align;
          ctx.textBaseline = "alphabetic";
          ctx.font = font;
          const box = textBoundingBox(ctx, t, tx, ty);
          if (t.fillType === "gradient") {
            const grad = ctx.createLinearGradient(box.x, 0, box.x + box.w, 0);
            grad.addColorStop(0, t.gradient[0]);
            grad.addColorStop(1, t.gradient[1]);
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = t.color;
          }
          applyShadow(ctx, t.shadow);
          ctx.fillText(t.content, tx, ty);
          ctx.restore();
          boxes[layer.ref] = box;
        }
      }
    }
  }

  let handles = null;
  if (opts.selectedLayerId && boxes[opts.selectedLayerId]) {
    const b = boxes[opts.selectedLayerId];
    ctx.save();
    ctx.strokeStyle = "#6C5CE7";
    ctx.lineWidth = Math.max(2, size * 0.003);
    ctx.setLineDash([size * 0.012, size * 0.008]);
    ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
    ctx.setLineDash([]);
    ctx.restore();

    if (RESIZABLE_LAYERS[opts.selectedLayerId]) {
      handles = computeHandles(b, size);
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#6C5CE7";
      ctx.lineWidth = Math.max(1.5, size * 0.0025);
      Object.values(handles).forEach((h) => {
        ctx.beginPath();
        ctx.rect(h.x - h.size / 2, h.y - h.size / 2, h.size, h.size);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  return { ctx, boxes, handles };
}

export function canvasToDataUrl(canvas, format = "png", quality = 0.92) {
  const mime = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
  return canvas.toDataURL(mime, quality);
}
