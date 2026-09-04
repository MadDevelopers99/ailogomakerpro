// Generates a working set of templates for the 11 flat print/graphic categories
// in the "More" nav menu (Email Signatures, Letterheads, Posters, Flyers,
// Invoices, Menus, Postcards, Gift Certificates, Invitations, Thank You Cards,
// T-Shirts). Reuses the exact business-card element vocabulary and renderer
// (js/render-card.js) — just different canvas sizes and layouts — and reuses
// existing QC'd background photo folders (no new fetching needed).
// Usage: node scripts/generate-print-templates.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname + "/..";
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "print-categories.json"), "utf8"));
const CARD_BG = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "card-backgrounds.json"), "utf8"));
const SOCIAL_BG = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "social-backgrounds.json"), "utf8"));

function bgImages(cat) {
  const src = cat.bgSource === "business" ? CARD_BG : SOCIAL_BG;
  return src[cat.assetTheme] || [];
}

const EXPORT = { formats: ["PNG", "JPG", "PDF"], defaultDpi: 300 };
function r(n) { return Math.round(n * 100) / 100; }

// ---------------- Skeletons (element arrays as fractions of w/h) ----------------

function skeletonEmailSignature(w, h) {
  const circleD = r(h * 0.4);
  const logoX = 18;
  const textX = r(logoX + circleD + 16);
  const dividerX = r(w * 0.55);
  const rightX = r(w * 0.59);
  const iconTextGap = r(h * 0.13);
  const leftColWidth = r(dividerX - textX - 10);
  const rightColWidth = r(w - (rightX + iconTextGap) - 16);
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "accent_1", type: "shape", shape: "rect", x: 0, y: 0, width: 6, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: logoX, y: r(h / 2 - circleD / 2), width: circleD, height: circleD, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: r(logoX + circleD / 2), y: r(h / 2 + circleD * 0.14), fontSize: r(circleD * 0.4), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "name", type: "text", text: "", x: textX, y: r(h * 0.34), fontSize: r(h * 0.13), maxWidth: leftColWidth, fontFamily: "Poppins", color: "#000", align: "left", bold: true, editable: true },
    { id: "job_title", type: "text", text: "", x: textX, y: r(h * 0.5), fontSize: r(h * 0.075), maxWidth: leftColWidth, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "company", type: "text", text: "", x: textX, y: r(h * 0.64), fontSize: r(h * 0.075), maxWidth: leftColWidth, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "divider", type: "shape", shape: "line", x: dividerX, y: r(h * 0.16), width: 2, height: r(h * 0.68), color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "phone_icon", type: "icon", icon: "phone", x: rightX, y: r(h * 0.19), size: r(h * 0.1), color: "#000", editable: true },
    { id: "phone", type: "text", text: "", x: r(rightX + iconTextGap), y: r(h * 0.28), fontSize: r(h * 0.075), maxWidth: rightColWidth, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "email_icon", type: "icon", icon: "email", x: rightX, y: r(h * 0.42), size: r(h * 0.1), color: "#000", editable: true },
    { id: "email", type: "text", text: "", x: r(rightX + iconTextGap), y: r(h * 0.51), fontSize: r(h * 0.075), maxWidth: rightColWidth, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "web_icon", type: "icon", icon: "globe", x: rightX, y: r(h * 0.65), size: r(h * 0.1), color: "#000", editable: true },
    { id: "website", type: "text", text: "", x: r(rightX + iconTextGap), y: r(h * 0.74), fontSize: r(h * 0.075), maxWidth: rightColWidth, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
  ];
}

function skeletonLetterhead(w, h) {
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "accent_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: 14, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: 60, y: 50, width: 70, height: 70, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: 95, y: 96, fontSize: 30, fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "company", type: "text", text: "", x: 150, y: 88, fontSize: 24, maxWidth: r(w * 0.45), fontFamily: "Poppins", color: "#000", align: "left", bold: true, editable: true },
    { id: "tagline", type: "text", text: "", x: 150, y: 112, fontSize: 13, maxWidth: r(w * 0.45), fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "address", type: "text", text: "", x: w - 60, y: 60, fontSize: 12, fontFamily: "Poppins", color: "#000", align: "right", bold: false, editable: true },
    { id: "phone", type: "text", text: "", x: w - 60, y: 80, fontSize: 12, fontFamily: "Poppins", color: "#000", align: "right", bold: false, editable: true },
    { id: "email", type: "text", text: "", x: w - 60, y: 100, fontSize: 12, fontFamily: "Poppins", color: "#000", align: "right", bold: false, editable: true },
    { id: "divider", type: "shape", shape: "line", x: 60, y: 150, width: w - 120, height: 2, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "footer_bar", type: "shape", shape: "rect", x: 0, y: h - 14, width: w, height: 14, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "footer_text", type: "text", text: "", x: w / 2, y: h - 34, fontSize: 12, fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
  ];
}

function skeletonPoster(w, h) {
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "corner_1", type: "shape", shape: "triangle", x: 0, y: 0, width: r(w * 0.24), height: r(w * 0.24), color: "#000", rotation: 0, opacity: 0.9, editable: true },
    { id: "corner_2", type: "shape", shape: "triangle", x: r(w * 0.76), y: r(h - w * 0.24), width: r(w * 0.24), height: r(w * 0.24), color: "#000", rotation: 180, opacity: 0.9, editable: true },
    { id: "headline", type: "text", text: "", x: w / 2, y: r(h * 0.42), fontSize: r(h * 0.075), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "subheadline", type: "text", text: "", x: w / 2, y: r(h * 0.5), fontSize: r(h * 0.032), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "date_location", type: "text", text: "", x: w / 2, y: r(h * 0.85), fontSize: r(h * 0.028), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: r(w / 2 - h * 0.035), y: r(h * 0.9), width: r(h * 0.07), height: r(h * 0.07), color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: w / 2, y: r(h * 0.9 + h * 0.05), fontSize: r(h * 0.035), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
  ];
}

function skeletonFlyer(w, h) {
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "accent_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: 14, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "headline", type: "text", text: "", x: w / 2, y: r(h * 0.2), fontSize: r(h * 0.055), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "subheadline", type: "text", text: "", x: w / 2, y: r(h * 0.27), fontSize: r(h * 0.03), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "divider", type: "shape", shape: "line", x: r(w * 0.3), y: r(h * 0.33), width: r(w * 0.4), height: 2, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "detail_1", type: "text", text: "", x: w / 2, y: r(h * 0.42), fontSize: r(h * 0.032), maxWidth: r(w * 0.8), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "detail_2", type: "text", text: "", x: w / 2, y: r(h * 0.48), fontSize: r(h * 0.032), maxWidth: r(w * 0.8), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "detail_3", type: "text", text: "", x: w / 2, y: r(h * 0.54), fontSize: r(h * 0.032), maxWidth: r(w * 0.8), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "cta_text", type: "text", text: "", x: w / 2, y: r(h * 0.78), fontSize: r(h * 0.038), maxWidth: r(w * 0.7), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: r(w / 2 - h * 0.03), y: r(h * 0.87), width: r(h * 0.06), height: r(h * 0.06), color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: w / 2, y: r(h * 0.87 + h * 0.042), fontSize: r(h * 0.03), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
  ];
}

function skeletonInvoice(w, h) {
  const rowY = (i) => r(h * 0.42 + i * h * 0.045);
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "accent_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: 100, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: 50, y: 25, width: 50, height: 50, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: 75, y: 58, fontSize: 22, fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "company", type: "text", text: "", x: 115, y: 58, fontSize: 19, maxWidth: r(w * 0.4), fontFamily: "Poppins", color: "#000", align: "left", bold: true, editable: true },
    { id: "invoice_label", type: "text", text: "INVOICE", x: w - 50, y: 45, fontSize: 26, maxWidth: r(w * 0.3), fontFamily: "Poppins", color: "#000", align: "right", bold: true, editable: true },
    { id: "invoice_number", type: "text", text: "", x: w - 50, y: 68, fontSize: 13, fontFamily: "Poppins", color: "#000", align: "right", bold: false, editable: true },
    { id: "invoice_date", type: "text", text: "", x: w - 50, y: 86, fontSize: 13, fontFamily: "Poppins", color: "#000", align: "right", bold: false, editable: true },
    { id: "bill_to_label", type: "text", text: "BILL TO", x: 50, y: 155, fontSize: 12, fontFamily: "Poppins", color: "#000", align: "left", bold: true, editable: false },
    { id: "bill_to_name", type: "text", text: "", x: 50, y: 178, fontSize: 15, fontFamily: "Poppins", color: "#000", align: "left", bold: true, editable: true },
    { id: "bill_to_address", type: "text", text: "", x: 50, y: 198, fontSize: 13, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "table_header", type: "text", text: "DESCRIPTION", x: 50, y: r(h * 0.36), fontSize: 12, fontFamily: "Poppins", color: "#000", align: "left", bold: true, editable: false },
    { id: "amount_header", type: "text", text: "AMOUNT", x: w - 50, y: r(h * 0.36), fontSize: 12, fontFamily: "Poppins", color: "#000", align: "right", bold: true, editable: false },
    { id: "table_divider", type: "shape", shape: "line", x: 50, y: r(h * 0.38), width: w - 100, height: 2, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "item_1", type: "text", text: "", x: 50, y: rowY(0), fontSize: 14, maxWidth: w - 260, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "item_1_price", type: "text", text: "", x: w - 50, y: rowY(0), fontSize: 14, fontFamily: "Poppins", color: "#000", align: "right", bold: false, editable: true },
    { id: "item_2", type: "text", text: "", x: 50, y: rowY(1), fontSize: 14, maxWidth: w - 260, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "item_2_price", type: "text", text: "", x: w - 50, y: rowY(1), fontSize: 14, fontFamily: "Poppins", color: "#000", align: "right", bold: false, editable: true },
    { id: "item_3", type: "text", text: "", x: 50, y: rowY(2), fontSize: 14, maxWidth: w - 260, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "item_3_price", type: "text", text: "", x: w - 50, y: rowY(2), fontSize: 14, fontFamily: "Poppins", color: "#000", align: "right", bold: false, editable: true },
    { id: "total_divider", type: "shape", shape: "line", x: 50, y: rowY(3.3), width: w - 100, height: 2, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "total_label", type: "text", text: "TOTAL", x: w - 220, y: rowY(4.3), fontSize: 18, fontFamily: "Poppins", color: "#000", align: "left", bold: true, editable: true },
    { id: "total_value", type: "text", text: "", x: w - 50, y: rowY(4.3), fontSize: 18, fontFamily: "Poppins", color: "#000", align: "right", bold: true, editable: true },
    { id: "footer_note", type: "text", text: "", x: w / 2, y: h - 50, fontSize: 12, fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
  ];
}

function skeletonMenu(w, h) {
  const catY = (i) => r(h * 0.3 + i * h * 0.2);
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "restaurant_name", type: "text", text: "", x: w / 2, y: r(h * 0.1), fontSize: r(h * 0.045), maxWidth: r(w * 0.86), fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "tagline", type: "text", text: "", x: w / 2, y: r(h * 0.135), fontSize: 14, maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "divider", type: "shape", shape: "line", x: r(w * 0.3), y: r(h * 0.17), width: r(w * 0.4), height: 2, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "category_1_title", type: "text", text: "", x: w / 2, y: catY(0), fontSize: 20, fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "item_1_1", type: "text", text: "", x: 60, y: r(catY(0) + 40), fontSize: 15, maxWidth: w - 120, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "item_1_2", type: "text", text: "", x: 60, y: r(catY(0) + 68), fontSize: 15, maxWidth: w - 120, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "category_2_title", type: "text", text: "", x: w / 2, y: catY(1), fontSize: 20, fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "item_2_1", type: "text", text: "", x: 60, y: r(catY(1) + 40), fontSize: 15, maxWidth: w - 120, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "item_2_2", type: "text", text: "", x: 60, y: r(catY(1) + 68), fontSize: 15, maxWidth: w - 120, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "category_3_title", type: "text", text: "", x: w / 2, y: catY(2), fontSize: 20, fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "item_3_1", type: "text", text: "", x: 60, y: r(catY(2) + 40), fontSize: 15, maxWidth: w - 120, fontFamily: "Poppins", color: "#000", align: "left", bold: false, editable: true },
    { id: "footer_text", type: "text", text: "", x: w / 2, y: h - 40, fontSize: 12, fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
  ];
}

function skeletonPostcard(w, h) {
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "greeting", type: "text", text: "", x: w / 2, y: r(h * 0.45), fontSize: r(h * 0.13), maxWidth: r(w * 0.86), fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "subtext", type: "text", text: "", x: w / 2, y: r(h * 0.56), fontSize: r(h * 0.045), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "website", type: "text", text: "", x: w / 2, y: r(h * 0.9), fontSize: r(h * 0.032), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
  ];
}

function skeletonGiftCertificate(w, h) {
  const inset = 22;
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "border_outer", type: "shape", shape: "rect", x: inset, y: inset, width: w - inset * 2, height: h - inset * 2, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "border_inner", type: "shape", shape: "rect", x: inset + 8, y: inset + 8, width: w - (inset + 8) * 2, height: h - (inset + 8) * 2, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "heading", type: "text", text: "GIFT CERTIFICATE", x: w / 2, y: r(h * 0.28), fontSize: r(h * 0.075), maxWidth: r(w * 0.8), fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "subtext", type: "text", text: "", x: w / 2, y: r(h * 0.42), fontSize: r(h * 0.038), maxWidth: r(w * 0.8), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "amount", type: "text", text: "", x: w / 2, y: r(h * 0.62), fontSize: r(h * 0.13), maxWidth: r(w * 0.6), fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "company", type: "text", text: "", x: w / 2, y: r(h * 0.78), fontSize: r(h * 0.035), maxWidth: r(w * 0.8), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "signature_label", type: "text", text: "Signature", x: r(w * 0.22), y: r(h * 0.9), fontSize: 12, fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "date_label", type: "text", text: "Date", x: r(w * 0.78), y: r(h * 0.9), fontSize: 12, fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
  ];
}

function skeletonInvitation(w, h) {
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "heading", type: "text", text: "", x: w / 2, y: r(h * 0.22), fontSize: r(h * 0.032), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "event_name", type: "text", text: "", x: w / 2, y: r(h * 0.32), fontSize: r(h * 0.06), maxWidth: r(w * 0.86), fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "divider", type: "shape", shape: "line", x: r(w * 0.35), y: r(h * 0.38), width: r(w * 0.3), height: 2, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "date_time", type: "text", text: "", x: w / 2, y: r(h * 0.62), fontSize: r(h * 0.026), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "location", type: "text", text: "", x: w / 2, y: r(h * 0.67), fontSize: r(h * 0.026), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "rsvp", type: "text", text: "", x: w / 2, y: r(h * 0.78), fontSize: r(h * 0.022), maxWidth: r(w * 0.86), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: r(w / 2 - h * 0.035), y: r(h * 0.08), width: r(h * 0.07), height: r(h * 0.07), color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: w / 2, y: r(h * 0.08 + h * 0.05), fontSize: r(h * 0.035), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
  ];
}

function skeletonThankYouCard(w, h) {
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: r(w / 2 - h * 0.035), y: r(h * 0.14), width: r(h * 0.07), height: r(h * 0.07), color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: w / 2, y: r(h * 0.14 + h * 0.05), fontSize: r(h * 0.035), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
    { id: "heading", type: "text", text: "Thank You", x: w / 2, y: r(h * 0.4), fontSize: r(h * 0.075), maxWidth: r(w * 0.8), fontFamily: "Playfair Display", color: "#000", align: "center", bold: true, editable: true },
    { id: "message", type: "text", text: "", x: w / 2, y: r(h * 0.5), fontSize: r(h * 0.02), maxWidth: r(w * 0.72), fontFamily: "Poppins", color: "#000", align: "center", bold: false, editable: true },
    { id: "signature", type: "text", text: "", x: w / 2, y: r(h * 0.62), fontSize: r(h * 0.03), maxWidth: r(w * 0.8), fontFamily: "Playfair Display", color: "#000", align: "center", bold: false, editable: true },
  ];
}

function skeletonTShirt(w, h) {
  return [
    { id: "bg_shape_1", type: "shape", shape: "rect", x: 0, y: 0, width: w, height: h, color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "line_1", type: "text", text: "", x: w / 2, y: r(h * 0.44), fontSize: r(h * 0.09), maxWidth: r(w * 0.86), fontFamily: "Montserrat", color: "#000", align: "center", bold: true, editable: true },
    { id: "line_2", type: "text", text: "", x: w / 2, y: r(h * 0.52), fontSize: r(h * 0.04), maxWidth: r(w * 0.86), fontFamily: "Montserrat", color: "#000", align: "center", bold: false, editable: true },
    { id: "logo_circle", type: "shape", shape: "circle", x: r(w / 2 - h * 0.035), y: r(h * 0.58), width: r(h * 0.07), height: r(h * 0.07), color: "#000", rotation: 0, opacity: 1, editable: true },
    { id: "logo_mark", type: "text", text: "B", x: w / 2, y: r(h * 0.58 + h * 0.05), fontSize: r(h * 0.035), fontFamily: "Poppins", color: "#000", align: "center", bold: true, editable: true },
  ];
}

const SKELETONS = {
  "email-signatures": skeletonEmailSignature, letterheads: skeletonLetterhead, posters: skeletonPoster,
  flyers: skeletonFlyer, invoices: skeletonInvoice, menus: skeletonMenu, postcards: skeletonPostcard,
  "gift-certificates": skeletonGiftCertificate, invitations: skeletonInvitation,
  "thank-you-cards": skeletonThankYouCard, "t-shirts": skeletonTShirt,
};

// ---------------- Recoloring (same convention as the business card generator) ----------------

function recolor(elements, theme, useImageBg) {
  return elements.map((raw) => {
    const el = { ...raw };
    if (el.id === "bg_shape_1") { el.color = theme.bg; el.visible = !useImageBg; }
    else if (el.id.startsWith("border_")) { el.color = el.id === "border_outer" ? theme.primary : theme.bg; }
    else if (el.id === "logo_circle") { el.color = theme.primary; }
    else if (el.id === "logo_mark") { el.color = theme.bg; }
    else if (el.type === "shape") { el.color = theme.primary; }
    else if (el.type === "icon") { el.color = theme.primary; }
    else if (["headline", "event_name", "restaurant_name", "invoice_label", "amount", "heading"].includes(el.id)) { el.color = theme.secondary; }
    else if (["subheadline", "tagline", "job_title", "cta_text", "total_label", "total_value", "table_header", "amount_header"].includes(el.id)) { el.color = theme.primary; }
    else if (el.type === "text") { el.color = theme.secondary; }
    return el;
  });
}

function buildTemplate({ id, name, cat, elements, theme, background, content }) {
  const els = recolor(elements, theme, background.type === "image");
  Object.entries(content).forEach(([fieldId, value]) => {
    const el = els.find((e) => e.id === fieldId);
    if (el) el.text = value;
  });
  const editableFields = els.filter((e) => e.type === "text" && e.editable !== false).map((e) => e.id);
  return {
    id, name, category: cat.label, categorySlug: cat.slug, premium: false,
    canvas: { width: cat.width, height: cat.height, unit: "px" },
    background, theme: { primary: theme.primary, secondary: theme.secondary, accent: theme.accent },
    elements: els, editableFields, export: EXPORT,
  };
}

// ---------------- Palettes + content per category ----------------

const PALETTES = {
  "email-signatures": [{ primary: "#2EA8FF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#FFFFFF" }, { primary: "#34D399", secondary: "#FFFFFF", accent: "#073B32", bg: "#FFFFFF" }],
  letterheads: [{ primary: "#D9A441", secondary: "#FFFFFF", accent: "#0B1A2E", bg: "#FFFFFF" }, { primary: "#2EA8FF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#FFFFFF" }],
  posters: [{ primary: "#FF4D8D", secondary: "#FFFFFF", accent: "#111111", bg: "#111111" }, { primary: "#14D6D6", secondary: "#FFFFFF", accent: "#041F1F", bg: "#041F1F" }],
  flyers: [{ primary: "#FF7A45", secondary: "#FFFFFF", accent: "#331100", bg: "#331100" }, { primary: "#A855F7", secondary: "#FFFFFF", accent: "#1E0A38", bg: "#1E0A38" }],
  invoices: [{ primary: "#2EA8FF", secondary: "#0B1A2E", accent: "#0B2A5B", bg: "#FFFFFF" }, { primary: "#34D399", secondary: "#0B1A2E", accent: "#073B32", bg: "#FFFFFF" }],
  menus: [{ primary: "#E8A33D", secondary: "#FFFFFF", accent: "#2A1810", bg: "#2A1810" }, { primary: "#E64545", secondary: "#FFFFFF", accent: "#1A0E0A", bg: "#1A0E0A" }],
  postcards: [{ primary: "#FFFFFF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#0B2A5B" }, { primary: "#FFFFFF", secondary: "#FFFFFF", accent: "#331100", bg: "#331100" }],
  "gift-certificates": [{ primary: "#D9A441", secondary: "#FFFFFF", accent: "#7A1F35", bg: "#3B0D18" }, { primary: "#C9A961", secondary: "#F5F1E8", accent: "#1A1A1A", bg: "#0D0D0D" }],
  invitations: [{ primary: "#F5A9B8", secondary: "#FFFFFF", accent: "#3A1826", bg: "#3A1826" }, { primary: "#A855F7", secondary: "#FFFFFF", accent: "#1E0A38", bg: "#1E0A38" }],
  "thank-you-cards": [{ primary: "#C97B3D", secondary: "#3a2a1a", accent: "#3a2a1a", bg: "#FDF6EC" }, { primary: "#6FAE8C", secondary: "#16241c", accent: "#16241c", bg: "#F3F7F4" }],
  "t-shirts": [{ primary: "#F2C230", secondary: "#FFFFFF", accent: "#F2C230", bg: "#111111" }, { primary: "#FFFFFF", secondary: "#111111", accent: "#FFFFFF", bg: "#1A1A1A" }],
};

const CONTENT = {
  "email-signatures": [
    { name: "Michael Johnson", job_title: "Business Consultant", company: "Apex Consulting", phone: "+1 123 456 7890", email: "michael@apexconsulting.com", website: "www.apexconsulting.com" },
    { name: "Sarah Klein", job_title: "Marketing Director", company: "Northgate Retail", phone: "+1 212 555 0148", email: "sarah@northgate.com", website: "www.northgate.com" },
  ],
  letterheads: [
    { company: "APEX CONSULTING", tagline: "Strategic Business Advisory", address: "123 Business Ave, Suite 400", phone: "+1 123 456 7890", email: "hello@apexconsulting.com", footer_text: "www.apexconsulting.com" },
    { company: "STERLING PARTNERS", tagline: "Management Consulting", address: "88 Market Street, Floor 12", phone: "+1 212 555 0148", email: "contact@sterlingpartners.com", footer_text: "www.sterlingpartners.com" },
  ],
  posters: [
    { headline: "SUMMER MUSIC FESTIVAL", subheadline: "Three days of live music under the stars", date_location: "July 12–14 · Riverside Park" },
    { headline: "GRAND OPENING", subheadline: "Join us for a night to remember", date_location: "Saturday, June 6 · 7 PM" },
  ],
  flyers: [
    { headline: "COMMUNITY YARD SALE", subheadline: "Everything must go — furniture, clothes & more", detail_1: "Saturday, May 10", detail_2: "8 AM – 2 PM", detail_3: "45 Maple Street", cta_text: "See You There!" },
    { headline: "FREE YOGA CLASS", subheadline: "All levels welcome, mats provided", detail_1: "Every Sunday", detail_2: "9 AM – 10 AM", detail_3: "Riverside Park Pavilion", cta_text: "Register Today" },
  ],
  invoices: [
    { company: "Apex Consulting", invoice_number: "Invoice #INV-1042", invoice_date: "Date: June 4, 2026", bill_to_name: "Northgate Retail", bill_to_address: "123 Business Ave, Suite 400", item_1: "Strategy Consulting — 20 hrs", item_1_price: "$3,000.00", item_2: "Market Research Report", item_2_price: "$850.00", item_3: "Follow-up Workshop", item_3_price: "$450.00", total_label: "TOTAL", total_value: "$4,300.00", footer_note: "Thank you for your business. Payment due within 30 days." },
    { company: "Studio Nine", invoice_number: "Invoice #INV-2091", invoice_date: "Date: June 12, 2026", bill_to_name: "Fernweh Coffee Co.", bill_to_address: "77 Harvest Lane", item_1: "Brand Identity Design", item_1_price: "$2,400.00", item_2: "Packaging Design", item_2_price: "$1,100.00", item_3: "Print Production Support", item_3_price: "$300.00", total_label: "TOTAL", total_value: "$3,800.00", footer_note: "Thank you for your business. Payment due within 30 days." },
  ],
  menus: [
    { restaurant_name: "The Oak Table", tagline: "Seasonal Cooking, Warm Hospitality", category_1_title: "STARTERS", item_1_1: "Bruschetta — $8", item_1_2: "Soup of the Day — $7", category_2_title: "MAINS", item_2_1: "Roasted Chicken — $28", item_2_2: "Pan-Seared Salmon — $32", category_3_title: "DESSERTS", item_3_1: "Chocolate Tart — $9", footer_text: "214 Maple Street · +1 555 234 8890" },
    { restaurant_name: "Harvest Kitchen", tagline: "Farm To Table, Every Season", category_1_title: "STARTERS", item_1_1: "Heirloom Tomato Salad — $10", item_1_2: "Grilled Flatbread — $9", category_2_title: "MAINS", item_2_1: "Grilled Ribeye — $38", item_2_2: "Butternut Squash Tart — $18", category_3_title: "DESSERTS", item_3_1: "Apple Crumble — $8", footer_text: "77 Harvest Lane · +1 555 349 7712" },
  ],
  postcards: [
    { greeting: "Greetings", subtext: "Wish you were here", website: "www.yourbrand.com" },
    { greeting: "Hello From Paradise", subtext: "Sun, sand, and endless blue skies", website: "www.yourbrand.com" },
  ],
  "gift-certificates": [
    { subtext: "This certificate entitles the bearer to", amount: "$50", company: "Apex Spa & Wellness" },
    { subtext: "This certificate entitles the bearer to", amount: "$100", company: "The Oak Table Restaurant" },
  ],
  invitations: [
    { heading: "YOU'RE INVITED TO", event_name: "Sarah's Bridal Shower", date_time: "Saturday, June 20 · 2:00 PM", location: "The Garden Terrace, 45 Rose Ave", rsvp: "RSVP by June 10 to hello@yourname.com" },
    { heading: "JOIN US FOR", event_name: "An Evening of Celebration", date_time: "Friday, July 3 · 7:00 PM", location: "Riverside Hall, 12 Bay Street", rsvp: "RSVP by June 25 to events@yourbrand.com" },
  ],
  "thank-you-cards": [
    { message: "For your kindness, generosity and support — thank you from the bottom of our hearts.", signature: "With gratitude, Maya" },
    { message: "Thank you for being part of our journey. We couldn't have done it without you.", signature: "Warmly, The Team" },
  ],
  "t-shirts": [
    { line_1: "GOOD VIBES", line_2: "ONLY" },
    { line_1: "STAY WILD", line_2: "STAY FREE" },
  ],
};

// ---------------- Generate ----------------

const OUT_DIR = path.join(ROOT, "data", "print-templates");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PREVIEW_PER_CATEGORY = 2;
const meta = { categories: [], preview: [] };
let grandTotal = 0;

for (const cat of CATEGORIES) {
  const skeletonFn = SKELETONS[cat.slug];
  const palettes = PALETTES[cat.slug];
  const contents = CONTENT[cat.slug];
  // Documents (invoices, letterheads) stay clean/solid — a busy photo behind
  // structured body text and tables reads as broken, not stylish.
  const isDocument = cat.slug === "invoices" || cat.slug === "letterheads";
  const photos = isDocument ? [] : bgImages(cat);
  const backgroundOptions = isDocument
    ? [{ type: "solid", color: "#FFFFFF" }, { type: "solid", color: "#F8F8F6" }, { type: "solid", color: "#FBF9F3" }]
    : [...photos.map((src) => ({ type: "image", src })), { type: "solid", color: palettes[0].bg }, { type: "solid", color: palettes[1].bg }];

  const templates = [];
  let seq = 1;
  let contentIdx = 0;
  for (const bg of backgroundOptions) {
    for (const theme of palettes) {
      const content = contents[contentIdx % contents.length];
      contentIdx++;
      const id = `print_${cat.slug}_${String(seq).padStart(3, "0")}`;
      const name = `${cat.label} ${String(seq).padStart(3, "0")}`;
      const elements = skeletonFn(cat.width, cat.height);
      templates.push(buildTemplate({ id, name, cat, elements, theme, background: { ...bg }, content }));
      seq++;
    }
  }

  const filePath = path.join(OUT_DIR, `${cat.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ schemaVersion: "1.0", category: cat.label, templates }, null, 2) + "\n");
  meta.categories.push({ slug: cat.slug, label: cat.label, width: cat.width, height: cat.height, count: templates.length });
  meta.preview.push(...templates.slice(0, PREVIEW_PER_CATEGORY).map((t) => ({ ...t, __slug: cat.slug })));
  grandTotal += templates.length;
  console.log(`${cat.slug}: ${templates.length} templates -> ${filePath}`);
}

meta.totalTemplates = grandTotal;
fs.writeFileSync(path.join(ROOT, "data", "print-templates-meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(`Total: ${grandTotal} templates across ${meta.categories.length} categories.`);
