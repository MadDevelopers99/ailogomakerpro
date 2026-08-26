// Injects the shared app sidebar (dashboard/templates/my-logos/etc.) into #appSidebar.
// Which link is "active" is read from document.body.dataset.page.

const NAV_ICONS = {
  dashboard: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  templates: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  "my-logos": '<rect x="3" y="4" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-4-4 3-3-2-5 4"/>',
  "brand-kit": '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 019 9M12 3v9l6 6"/>',
  saved: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  favorites: '<path d="M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2-.3 3.8.8 6 3.1C14.2 4.8 16 3.7 18 4c3.6.5 5.4 4 4 7.7C19.5 16.4 12 21 12 21z"/>',
  "logo-editor": '<path d="M4 21l4-1 11-11-3-3L5 17z"/><path d="M14 6l3 3"/>',
  "icon-library": '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7-5.4-4.7 7.1-.6z"/>',
  backgrounds: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 16l5-5 4 4 3-3 6 6"/>',
  mockups: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.2-1.6l2-1.6-2-3.4-2.4 1a7 7 0 00-2.7-1.6L13 2h-4l-.7 2.8a7 7 0 00-2.7 1.6l-2.4-1-2 3.4 2 1.6A7 7 0 003 12a7 7 0 00.2 1.6l-2 1.6 2 3.4 2.4-1c.8.7 1.7 1.3 2.7 1.6L9 22h4l.7-2.8a7 7 0 002.7-1.6l2.4 1 2-3.4-2-1.6c.1-.5.2-1 .2-1.6z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 115.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>',
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "dashboard.html" },
  { id: "templates", label: "Templates", href: "templates.html" },
  { id: "my-logos", label: "My Logos", href: "my-logos.html" },
  { id: "brand-kit", label: "Brand Kit", href: "brand-kit.html" },
  { id: "saved", label: "Saved", href: "saved.html" },
  { id: "favorites", label: "Favorites", href: "favorites.html" },
];

const TOOL_ITEMS = [
  { id: "logo-editor", label: "Logo Editor", href: "editor.html" },
  { id: "icon-library", label: "Icon Library", href: "editor.html?tool=icons" },
  { id: "backgrounds", label: "Backgrounds", href: "editor.html?tool=background" },
  { id: "mockups", label: "Mockups", href: "preview.html" },
];

const BOTTOM_ITEMS = [
  { id: "settings", label: "Settings", href: "settings.html" },
  { id: "help", label: "Help & Support", href: "help.html" },
];

function iconSvg(id) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${NAV_ICONS[id] || ""}</svg>`;
}

function renderLink(item, activePage) {
  const active = item.id === activePage ? " active" : "";
  return `<a class="sidebar-link${active}" href="${item.href}">${iconSvg(item.id)}<span>${item.label}</span></a>`;
}

export function mountAppShell() {
  const el = document.getElementById("appSidebar");
  if (!el) return;
  const activePage = document.body.dataset.page || "";
  el.innerHTML = `
    <div class="app-sidebar">
      <a class="brand" href="dashboard.html"><span class="brand-mark">M</span> LOGO MAKER</a>
      <button class="btn-create" onclick="window.location.href='templates.html'">+ Create New</button>
      <nav class="sidebar-nav">
        ${NAV_ITEMS.map((i) => renderLink(i, activePage)).join("")}
      </nav>
      <div class="sidebar-section-label">Tools</div>
      <nav class="sidebar-nav">
        ${TOOL_ITEMS.map((i) => renderLink(i, activePage)).join("")}
      </nav>
      <div class="sidebar-nav sidebar-nav-bottom">
        ${BOTTOM_ITEMS.map((i) => renderLink(i, activePage)).join("")}
      </div>
      <a href="upgrade.html" class="premium-card">
        <div class="premium-card-icon">💎</div>
        <div class="premium-card-title">Unlock Premium</div>
        <div class="premium-card-sub">Get premium templates, icons and all features.</div>
        <div class="premium-card-btn">Upgrade Now</div>
      </a>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", mountAppShell);
