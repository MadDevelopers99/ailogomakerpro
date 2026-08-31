// Generates /logo-maker/<id>.html landing pages from data/category-content.js,
// plus a logo-maker.html hub page, and appends the new URLs to sitemap.xml.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const categories = require(path.join(ROOT, "data/categories.json"));
const content = require(path.join(ROOT, "data/category-content.js"));
const logos = require(path.join(ROOT, "data/logos.json"));

const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
const countById = {};
for (const l of logos) countById[l.categoryId] = (countById[l.categoryId] || 0) + 1;

const NAVBAR = `  <header class="navbar">
    <div class="bar">
      <a class="brand" href="../index.html"><span class="brand-mark">LM</span> LOGO MAKER</a>
      <nav class="main-nav">
        <a href="../index.html">Home</a>
        <a href="../templates.html">Templates</a>
        <a href="../my-logos.html">My Logos</a>
        <a href="../upgrade.html">Pricing</a>
        <a href="../blog.html">Blog</a>
        <a href="../developer.html" target="_blank" rel="noopener">Developer</a>
      </nav>
      <a class="btn btn-primary btn-sm" href="../signin.html">Sign In</a>
    </div>
  </header>`;

const FOOTER = `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="brand" href="../index.html"><span class="brand-mark">LM</span> LOGO MAKER</a>
          <p>A free online logo maker with 17,000+ templates across 60 industries — customize colors, fonts, icons and curved text, then download in high resolution.</p>
        </div>
        <div class="footer-col">
          <h5>Product</h5>
          <a href="../templates.html">Templates</a>
          <a href="../editor.html">Logo Editor</a>
          <a href="../logo-maker.html">Browse by Industry</a>
          <a href="../upgrade.html">Pricing</a>
        </div>
        <div class="footer-col">
          <h5>Company</h5>
          <a href="../about.html">About Us</a>
          <a href="../blog.html">Blog</a>
          <a href="../contact.html">Contact</a>
          <a href="../help.html">Help &amp; Support</a>
        </div>
        <div class="footer-col">
          <h5>Legal</h5>
          <a href="../privacy.html">Privacy Policy</a>
          <a href="../terms.html">Terms of Service</a>
        </div>
      </div>
      <div class="footer-bottom">
        <div>© <span data-yearnow></span> Logo Maker. Not affiliated with design.com.</div>
      </div>
    </div>
  </footer>`;

function escAttr(s) { return String(s).replace(/"/g, "&quot;"); }
function shortName(name) { return name.replace(/\s*Logo Designs?$/i, "").trim(); }

function categoryPage(id) {
  const cat = catById[id];
  const c = content[id];
  const count = countById[id] || 0;
  const name = shortName(cat.name);
  const url = `https://ailogomakerpro.com/logo-maker/${id}.html`;
  const metaDesc = `Create a custom ${name.toLowerCase()} logo free with ${count.toLocaleString()}+ templates. ${c.intro}`.slice(0, 300);
  const title = `${name} Logo Maker | Free ${name} Logo Templates — Logo Maker`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": c.faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://ailogomakerpro.com/" },
      { "@type": "ListItem", "position": 2, "name": "Logo Maker by Industry", "item": "https://ailogomakerpro.com/logo-maker.html" },
      { "@type": "ListItem", "position": 3, "name": `${name} Logo Maker`, "item": url },
    ],
  };

  const faqHtml = c.faqs.map((f) => `        <details class="faq-accordion">
          <summary>${f.q}</summary>
          <div class="faq-answer">${f.a}</div>
        </details>`).join("\n");

  const tipsHtml = c.tips.map((t) => `          <li>${t}</li>`).join("\n");

  const relatedHtml = c.related.map((rid) => {
    const rc = catById[rid];
    if (!rc) return "";
    return `          <a class="btn btn-outline" href="${rid}.html">${rc.icon} ${shortName(rc.name)} Logo Maker</a>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8548717208623024" crossorigin="anonymous"></script>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${escAttr(metaDesc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="/logo-maker/${id}.html">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(metaDesc)}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>
</head>
<body data-category="${id}">
${NAVBAR}

  <main class="container">
    <div class="breadcrumb-row"><a href="../index.html">Home</a> / <a href="../logo-maker.html">Logo Maker by Industry</a> / ${name}</div>
  </main>

  <section class="category-showcase">
    <div class="container">
      <div>
        <span class="badge">${cat.icon} ${name}</span>
        <h1>${name} Logo Maker</h1>
        <p>${c.intro}</p>
        <a class="btn btn-primary" href="../templates.html?cat=${id}">Browse <span id="catCount">${count}</span>+ ${name} Templates</a>
      </div>
      <div class="hero-visual" id="tileGrid"></div>
    </div>
  </section>

  <section class="content-section" data-reveal>
    <div class="container">
      <h2>Why Customize a ${name} Logo</h2>
      <p class="lead">${c.why}</p>
    </div>
  </section>

  <section class="content-section alt" data-reveal>
    <div class="container">
      <h2>Design Tips for ${name} Logos</h2>
      <ul class="tips-list">
${tipsHtml}
      </ul>
    </div>
  </section>

  <section class="content-section" id="faq" data-reveal>
    <div class="container">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-list">
${faqHtml}
      </div>
    </div>
  </section>

  <section class="content-section alt" data-reveal>
    <div class="container">
      <h2>Related Logo Categories</h2>
      <div class="related-links">
${relatedHtml}
      </div>
    </div>
  </section>

${FOOTER}

  <script src="../js/category-page.js"></script>
</body>
</html>
`;
}

const outDir = path.join(ROOT, "logo-maker");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const ids = Object.keys(content);
for (const id of ids) {
  if (!catById[id]) { console.log("SKIP (no category meta):", id); continue; }
  fs.writeFileSync(path.join(outDir, `${id}.html`), categoryPage(id));
}
console.log(`Generated ${ids.length} category pages in /logo-maker/`);

// ---- Hub page: logo-maker.html ----
const grouped = ids.map((id) => catById[id]).filter(Boolean);
const hubLinks = grouped.map((cat) =>
  `        <a class="btn btn-outline" href="logo-maker/${cat.id}.html">${cat.icon} ${shortName(cat.name)} Logo Maker</a>`
).join("\n");

const hubHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8548717208623024" crossorigin="anonymous"></script>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Logo Maker by Industry — Browse ${ids.length}+ Categories — Logo Maker</title>
<meta name="description" content="Browse free logo makers by industry — business, restaurant, tech, gaming, fitness, real estate and ${ids.length - 6}+ more categories, each with dedicated templates and design tips.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="/logo-maker.html">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://ailogomakerpro.com/" },
    { "@type": "ListItem", "position": 2, "name": "Logo Maker by Industry", "item": "https://ailogomakerpro.com/logo-maker.html" },
  ],
})}</script>
</head>
<body>
  <header class="navbar">
    <div class="bar">
      <a class="brand" href="index.html"><span class="brand-mark">LM</span> LOGO MAKER</a>
      <nav class="main-nav">
        <a href="index.html">Home</a>
        <a href="templates.html">Templates</a>
        <a href="my-logos.html">My Logos</a>
        <a href="upgrade.html">Pricing</a>
        <a href="blog.html">Blog</a>
        <a href="developer.html" target="_blank" rel="noopener">Developer</a>
      </nav>
      <a class="btn btn-primary btn-sm" href="signin.html">Sign In</a>
    </div>
  </header>

  <section class="content-section">
    <div class="container">
      <h1 style="text-align:center;font-size:32px;margin:0 0 14px;">Logo Maker by Industry</h1>
      <p class="lead">Pick your industry for templates, design tips and answers built specifically for that kind of logo — not a generic one-size-fits-all guide.</p>
      <div class="related-links">
${hubLinks}
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html"><span class="brand-mark">LM</span> LOGO MAKER</a>
          <p>A free online logo maker with 17,000+ templates across 60 industries — customize colors, fonts, icons and curved text, then download in high resolution.</p>
        </div>
        <div class="footer-col">
          <h5>Product</h5>
          <a href="templates.html">Templates</a>
          <a href="editor.html">Logo Editor</a>
          <a href="logo-maker.html">Browse by Industry</a>
          <a href="upgrade.html">Pricing</a>
        </div>
        <div class="footer-col">
          <h5>Company</h5>
          <a href="about.html">About Us</a>
          <a href="blog.html">Blog</a>
          <a href="contact.html">Contact</a>
          <a href="help.html">Help &amp; Support</a>
        </div>
        <div class="footer-col">
          <h5>Legal</h5>
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms of Service</a>
        </div>
      </div>
      <div class="footer-bottom">
        <div>© <span id="yearNow"></span> Logo Maker. Not affiliated with design.com.</div>
      </div>
    </div>
  </footer>
  <script>document.getElementById("yearNow").textContent = new Date().getFullYear();</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "logo-maker.html"), hubHtml);
console.log("Generated logo-maker.html hub page");

// ---- sitemap.xml: append new URLs if not already present ----
const sitemapPath = path.join(ROOT, "sitemap.xml");
let sitemap = fs.readFileSync(sitemapPath, "utf8");
const today = new Date().toISOString().slice(0, 10);
const newUrls = [`https://ailogomakerpro.com/logo-maker.html`, ...ids.map((id) => `https://ailogomakerpro.com/logo-maker/${id}.html`)];
let added = 0;
for (const u of newUrls) {
  if (sitemap.includes(`<loc>${u}</loc>`)) continue;
  const entry = `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
  added++;
}
fs.writeFileSync(sitemapPath, sitemap);
console.log(`Added ${added} new URLs to sitemap.xml`);
