// Renders the Website Builder's section-based template schema into real HTML
// (not canvas — pages are documents, not fixed-size graphics). Every rule is
// scoped under a per-template wrapper id so multiple previews can coexist
// safely, and every editable string carries data-field="<section>.<key>" so
// the editor can wire contenteditable + undo directly against the template.

function esc(s) {
  return (s ?? "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// withOverlay darkens the image for text sitting on top of it (hero, cta-band).
// Plain photo boxes (about media, showcase cards) should render un-darkened.
export function bgStyle(bg, withOverlay = false) {
  if (!bg) return "";
  if (bg.type === "image" && bg.src) {
    const overlay = withOverlay ? `linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.5)), ` : "";
    return `background-image:${overlay}url('${bg.src}');background-size:cover;background-position:center;`;
  }
  // No explicit color: fall through to the section's own CSS default background.
  return bg.color ? `background:${bg.color};` : "";
}

function field(path, tag, text, cls, extra = "") {
  return `<${tag} class="${cls}" data-field="${path}" ${extra}>${esc(text)}</${tag}>`;
}

function renderNav(s) {
  return `
  <header class="site-nav">
    <div class="site-nav-inner">
      <div class="site-logo">${s.logoImage ? `<img src="${s.logoImage}" alt="logo" class="site-logo-img">` : `<span class="site-logo-mark">${esc((s.brand || "B").charAt(0))}</span>`}<span class="site-logo-text" data-field="${s.id}.brand">${esc(s.brand)}</span></div>
      <nav class="site-nav-links">${(s.links || []).map((l) => `<a href="#">${esc(l)}</a>`).join("")}</nav>
      <a href="#${s.ctaTarget || "contact"}" class="btn-site-cta">${esc(s.ctaText || "Contact")}</a>
    </div>
  </header>`;
}

function renderHero(s) {
  return `
  <section class="site-hero" id="hero" style="${bgStyle(s.background, true)}">
    <div class="site-hero-inner">
      ${field(`${s.id}.eyebrow`, "div", s.eyebrow, "site-eyebrow")}
      ${field(`${s.id}.heading`, "h1", s.heading, "site-hero-heading")}
      ${field(`${s.id}.subheading`, "p", s.subheading, "site-hero-sub")}
      <div class="site-hero-actions">
        <a href="#contact" class="btn-site-primary">${esc(s.ctaText || "Get Started")}</a>
        ${s.secondaryCtaText ? `<a href="#about" class="btn-site-outline">${esc(s.secondaryCtaText)}</a>` : ""}
      </div>
    </div>
  </section>`;
}

function renderAbout(s) {
  return `
  <section class="site-about" id="about">
    <div class="site-about-media" style="${bgStyle(s.image)}"></div>
    <div class="site-about-copy">
      ${field(`${s.id}.eyebrow`, "div", s.eyebrow, "site-eyebrow")}
      ${field(`${s.id}.heading`, "h2", s.heading, "site-h2")}
      ${field(`${s.id}.body`, "p", s.body, "site-body")}
    </div>
  </section>`;
}

function renderFeatures(s) {
  return `
  <section class="site-features" id="${s.id}">
    <div class="site-section-head">
      ${field(`${s.id}.eyebrow`, "div", s.eyebrow, "site-eyebrow center")}
      ${field(`${s.id}.heading`, "h2", s.heading, "site-h2 center")}
    </div>
    <div class="site-features-grid">
      ${(s.items || []).map((it, i) => `
        <div class="site-feature-card">
          <div class="site-feature-icon">${esc(it.icon || "✦")}</div>
          ${field(`${s.id}.items.${i}.title`, "h3", it.title, "site-feature-title")}
          ${field(`${s.id}.items.${i}.text`, "p", it.text, "site-feature-text")}
        </div>`).join("")}
    </div>
  </section>`;
}

function renderShowcase(s) {
  // Handles gallery / portfolio / products / menu — same grid skeleton, different card content.
  const showPrice = s.variant === "products" || s.variant === "menu";
  return `
  <section class="site-showcase" id="${s.id}">
    <div class="site-section-head">
      ${field(`${s.id}.eyebrow`, "div", s.eyebrow, "site-eyebrow center")}
      ${field(`${s.id}.heading`, "h2", s.heading, "site-h2 center")}
    </div>
    <div class="site-showcase-grid">
      ${(s.items || []).map((it, i) => `
        <div class="site-showcase-card">
          <div class="site-showcase-media" style="${bgStyle(it.image)}"></div>
          <div class="site-showcase-body">
            ${field(`${s.id}.items.${i}.title`, "h3", it.title, "site-showcase-title")}
            ${it.subtitle !== undefined ? field(`${s.id}.items.${i}.subtitle`, "p", it.subtitle, "site-showcase-sub") : ""}
            ${showPrice ? field(`${s.id}.items.${i}.price`, "div", it.price, "site-showcase-price") : ""}
          </div>
        </div>`).join("")}
    </div>
  </section>`;
}

function renderTestimonials(s) {
  return `
  <section class="site-testimonials" id="${s.id}">
    <div class="site-section-head">
      ${field(`${s.id}.eyebrow`, "div", s.eyebrow, "site-eyebrow center")}
      ${field(`${s.id}.heading`, "h2", s.heading, "site-h2 center")}
    </div>
    <div class="site-testimonials-grid">
      ${(s.items || []).map((it, i) => `
        <div class="site-testimonial-card">
          ${field(`${s.id}.items.${i}.quote`, "p", `"${it.quote}"`, "site-testimonial-quote")}
          ${field(`${s.id}.items.${i}.name`, "div", it.name, "site-testimonial-name")}
          ${field(`${s.id}.items.${i}.role`, "div", it.role, "site-testimonial-role")}
        </div>`).join("")}
    </div>
  </section>`;
}

function renderCtaBand(s) {
  return `
  <section class="site-cta-band" id="${s.id}" style="${bgStyle(s.background, true)}">
    ${field(`${s.id}.heading`, "h2", s.heading, "site-cta-heading")}
    ${field(`${s.id}.subheading`, "p", s.subheading, "site-cta-sub")}
    <a href="#contact" class="btn-site-primary">${esc(s.ctaText || "Get Started")}</a>
  </section>`;
}

function renderContact(s) {
  return `
  <section class="site-contact" id="contact">
    <div class="site-contact-inner">
      ${field(`${s.id}.eyebrow`, "div", s.eyebrow, "site-eyebrow")}
      ${field(`${s.id}.heading`, "h2", s.heading, "site-h2")}
      <div class="site-contact-rows">
        <div class="site-contact-row">📍 ${field(`${s.id}.address`, "span", s.address, "")}</div>
        <div class="site-contact-row">📞 ${field(`${s.id}.phone`, "span", s.phone, "")}</div>
        <div class="site-contact-row">✉️ ${field(`${s.id}.email`, "span", s.email, "")}</div>
      </div>
    </div>
  </section>`;
}

function renderFooter(s) {
  return `
  <footer class="site-footer">
    <div class="site-footer-inner">
      <div class="site-logo">${s.logoImage ? `<img src="${s.logoImage}" alt="logo" class="site-logo-img">` : `<span class="site-logo-mark">${esc((s.brand || "B").charAt(0))}</span>`}<span class="site-logo-text">${esc(s.brand)}</span></div>
      ${field(`${s.id}.text`, "div", s.text, "site-footer-text")}
    </div>
  </footer>`;
}

const RENDERERS = {
  nav: renderNav, hero: renderHero, about: renderAbout, features: renderFeatures,
  showcase: renderShowcase, testimonials: renderTestimonials, "cta-band": renderCtaBand,
  contact: renderContact, footer: renderFooter,
};

const STYLE_TEMPLATE = (scope) => `
#${scope} { --font-stack: var(--site-font, "Poppins"), "Segoe UI", sans-serif; font-family: var(--font-stack); color: #1c1c22; background: #fff; line-height: 1.5; }
#${scope} * { box-sizing: border-box; }
#${scope} img { max-width: 100%; display: block; }
#${scope} .site-eyebrow { color: var(--primary); font-weight: 700; font-size: 12.5px; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 8px; }
#${scope} .site-eyebrow.center { text-align: center; }
#${scope} .site-h2 { font-size: clamp(24px, 3.2vw, 34px); font-weight: 800; margin: 0 0 14px; color: var(--accent); }
#${scope} .site-h2.center { text-align: center; }
#${scope} .site-body { font-size: 15.5px; color: #4a4a55; max-width: 520px; }
#${scope} [data-field] { outline: none; border-radius: 4px; }
#${scope} [contenteditable="true"]:hover { background: rgba(108,92,231,.08); }
#${scope} [contenteditable="true"]:focus { background: rgba(108,92,231,.14); box-shadow: 0 0 0 2px var(--primary); }

#${scope} .site-nav { position: sticky; top: 0; z-index: 20; background: #fff; border-bottom: 1px solid #eee; }
#${scope} .site-nav-inner { max-width: 1120px; margin: 0 auto; padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
#${scope} .site-logo { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 17px; color: var(--accent); }
#${scope} .site-logo-mark { width: 34px; height: 34px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
#${scope} .site-logo-img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
#${scope} .site-nav-links { display: flex; gap: 26px; font-size: 14px; font-weight: 600; flex: 1; justify-content: center; }
#${scope} .site-nav-links a { color: #444; text-decoration: none; }
#${scope} .site-nav-links a:hover { color: var(--primary); }
#${scope} .btn-site-cta, #${scope} .btn-site-primary { background: var(--primary); color: #fff; border: none; padding: 11px 22px; border-radius: 999px; font-weight: 700; font-size: 13.5px; text-decoration: none; display: inline-block; cursor: pointer; }
#${scope} .btn-site-outline { border: 2px solid var(--primary); color: var(--primary); padding: 9px 20px; border-radius: 999px; font-weight: 700; font-size: 13.5px; text-decoration: none; display: inline-block; margin-left: 10px; }

#${scope} .site-hero { padding: 110px 28px; text-align: center; color: #fff; background: var(--bg); }
#${scope} .site-hero-inner { max-width: 720px; margin: 0 auto; }
#${scope} .site-hero .site-eyebrow { color: var(--primary); }
#${scope} .site-hero-heading { font-size: clamp(32px, 5.5vw, 56px); font-weight: 800; margin: 0 0 16px; }
#${scope} .site-hero-sub { font-size: 17px; opacity: .9; max-width: 560px; margin: 0 auto 30px; }
#${scope} .site-hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

#${scope} .site-about { max-width: 1120px; margin: 0 auto; padding: 80px 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }
#${scope} .site-about-media { aspect-ratio: 4/3; border-radius: 16px; background: #eee; }

#${scope} .site-features, #${scope} .site-showcase, #${scope} .site-testimonials { max-width: 1120px; margin: 0 auto; padding: 80px 28px; }
#${scope} .site-section-head { max-width: 560px; margin: 0 auto 44px; text-align: center; }
#${scope} .site-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; }
#${scope} .site-feature-card { background: #f8f8fb; border-radius: 16px; padding: 28px 24px; }
#${scope} .site-feature-icon { font-size: 30px; margin-bottom: 14px; }
#${scope} .site-feature-title { font-size: 17px; font-weight: 700; margin: 0 0 8px; color: var(--accent); }
#${scope} .site-feature-text { font-size: 14px; color: #5a5a66; margin: 0; }

#${scope} .site-showcase-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
#${scope} .site-showcase-card { border-radius: 16px; overflow: hidden; background: #f8f8fb; }
#${scope} .site-showcase-media { aspect-ratio: 4/3; background: #eee; }
#${scope} .site-showcase-body { padding: 16px 18px 20px; }
#${scope} .site-showcase-title { font-size: 15.5px; font-weight: 700; margin: 0 0 4px; color: var(--accent); }
#${scope} .site-showcase-sub { font-size: 13px; color: #6a6a76; margin: 0; }
#${scope} .site-showcase-price { margin-top: 8px; font-weight: 800; color: var(--primary); }

#${scope} .site-testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
#${scope} .site-testimonial-card { background: #f8f8fb; border-radius: 16px; padding: 26px 22px; }
#${scope} .site-testimonial-quote { font-size: 14.5px; color: #3a3a44; margin: 0 0 14px; }
#${scope} .site-testimonial-name { font-weight: 700; font-size: 13.5px; color: var(--accent); }
#${scope} .site-testimonial-role { font-size: 12px; color: #8a8a96; }

#${scope} .site-cta-band { padding: 70px 28px; text-align: center; color: #fff; background: var(--accent); }
#${scope} .site-cta-heading { font-size: clamp(24px, 3.5vw, 36px); font-weight: 800; margin: 0 0 10px; }
#${scope} .site-cta-sub { opacity: .9; margin: 0 0 24px; }

#${scope} .site-contact { max-width: 720px; margin: 0 auto; padding: 80px 28px; text-align: center; }
#${scope} .site-contact-rows { display: flex; gap: 26px; justify-content: center; flex-wrap: wrap; margin-top: 18px; font-size: 14.5px; color: #3a3a44; }

#${scope} .site-footer { background: #14141a; color: #cfcfd8; padding: 34px 28px; }
#${scope} .site-footer-inner { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
#${scope} .site-footer .site-logo { color: #fff; }
#${scope} .site-footer-text { font-size: 13px; color: #8a8a96; }

@media (max-width: 720px) {
  #${scope} .site-nav-links { display: none; }
  #${scope} .site-about { grid-template-columns: 1fr; }
  #${scope} .site-features-grid, #${scope} .site-showcase-grid, #${scope} .site-testimonials-grid { grid-template-columns: 1fr; }
}
`;

/** Renders a website template to an HTML string (style + scoped root div).
 * opts.editable — when true, text fields get contenteditable="true". */
export function renderWebsiteHTML(template, opts = {}) {
  const scope = `site-${template.id}`;
  const t = template.theme || {};
  const rootStyle = `--primary:${t.primary || "#6C5CE7"};--secondary:${t.secondary || "#ffffff"};--accent:${t.accent || "#1a1a2e"};--bg:${t.bg || "#1a1a2e"};--site-font:'${t.font || "Poppins"}';`;
  const editAttr = opts.editable ? ` contenteditable="true"` : "";
  const body = (template.sections || [])
    .map((s) => {
      const fn = RENDERERS[s.type];
      if (!fn) return "";
      return fn(s);
    })
    .join("");
  const withEditAttrs = opts.editable ? body.replace(/data-field="([^"]+)"/g, `data-field="$1"${editAttr}`) : body;
  return `<style>${STYLE_TEMPLATE(scope)}</style><div id="${scope}" class="site-root" style="${rootStyle}">${withEditAttrs}</div>`;
}

export function getFieldValue(template, path) {
  const [sectionId, ...rest] = path.split(".");
  const section = (template.sections || []).find((s) => s.id === sectionId);
  if (!section) return undefined;
  let obj = section;
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    obj = obj?.[/^\d+$/.test(key) ? Number(key) : key];
  }
  return obj;
}

export function setFieldValue(template, path, value) {
  const [sectionId, ...rest] = path.split(".");
  const section = (template.sections || []).find((s) => s.id === sectionId);
  if (!section) return;
  let obj = section;
  for (let i = 0; i < rest.length - 1; i++) {
    const key = rest[i];
    obj = obj[/^\d+$/.test(key) ? Number(key) : key];
  }
  const lastKey = rest[rest.length - 1];
  obj[/^\d+$/.test(lastKey) ? Number(lastKey) : lastKey] = value;
}
