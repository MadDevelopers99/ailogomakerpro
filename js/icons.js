// Small hand-built line-icon set (24x24, stroke-based) used by the editor's Icons panel.
// Each entry is raw inner-SVG markup (no <svg> wrapper) so it can be sized/colored at draw time.
export const ICONS = [
  { id: "star", label: "Star", d: "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7-5.4-4.7 7.1-.6z" },
  { id: "heart", label: "Heart", d: "M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2-.3 3.8.8 6 3.1C14.2 4.8 16 3.7 18 4c3.6.5 5.4 4 4 7.7C19.5 16.4 12 21 12 21z" },
  { id: "bolt", label: "Bolt", d: "M13 2 3 14h7l-1 8 10-12h-7z" },
  { id: "leaf", label: "Leaf", d: "M20 4C10 4 4 10 4 18v2h2c8 0 14-6 14-16zM6 20c0-4 2-8 6-10" },
  { id: "shield", label: "Shield", d: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" },
  { id: "crown", label: "Crown", d: "M3 19h18l-1-9-5 4-3-7-3 7-5-4z" },
  { id: "rocket", label: "Rocket", d: "M14 3c3 0 6 3 6 6-2 2-3 3-5 5l-5 1 1-5c2-2 3-3 5-5-2 0-4 1-6 3l-3-1 3-3c1.3-1 3.2-1.5 4-1zM7 15l-3 5 5-3z" },
  { id: "camera", label: "Camera", d: "M4 8h3l2-3h6l2 3h3v11H4zM12 18a4 4 0 100-8 4 4 0 000 8z" },
  { id: "coffee", label: "Coffee", d: "M4 8h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 9h1.5a2.5 2.5 0 010 5H17M7 2c-.5 1 .5 1.5 0 3M11 2c-.5 1 .5 1.5 0 3" },
  { id: "paw", label: "Paw", d: "M7 11a2 2 0 100-4 2 2 0 000 4zM12 9a2 2 0 100-4 2 2 0 000 4zM17 11a2 2 0 100-4 2 2 0 000 4zM12 21c-3 0-6-1.5-6-4.5S8 14 12 14s6 0 6 2.5S15 21 12 21z" },
  { id: "home", label: "Home", d: "M3 11l9-8 9 8M5 10v10h14V10" },
  { id: "gear", label: "Gear", d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.2-1.6l2-1.6-2-3.4-2.4 1a7 7 0 00-2.7-1.6L13 2h-4l-.7 2.8a7 7 0 00-2.7 1.6l-2.4-1-2 3.4 2 1.6A7 7 0 003 12" },
  { id: "pulse", label: "Pulse", d: "M3 12h4l2 7 4-14 2 7h6" },
  { id: "book", label: "Book", d: "M4 4h8a2 2 0 012 2v14a2 2 0 00-2-2H4zM20 4h-8a2 2 0 00-2 2v14a2 2 0 012-2h8z" },
  { id: "briefcase", label: "Briefcase", d: "M4 8h16v11H4zM9 8V5h6v3M4 13h16" },
  { id: "globe", label: "Globe", d: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z" },
  { id: "music", label: "Music", d: "M9 18a3 3 0 100-6 3 3 0 000 6zM9 15V4l11-2v11M18 13a3 3 0 100-6 3 3 0 000 6z" },
  { id: "phone", label: "Phone", d: "M6 3h4l1 5-2.5 1.5a12 12 0 006 6L16 13l5 1v4a2 2 0 01-2 2C10.5 20 4 13.5 4 5a2 2 0 012-2z" },
  { id: "mail", label: "Mail", d: "M4 5h16v14H4zM4 6l8 7 8-7" },
  { id: "cart", label: "Cart", d: "M3 4h2l2.5 12h11L21 8H6M9 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2z" },
  { id: "trophy", label: "Trophy", d: "M7 4h10v5a5 5 0 01-10 0zM7 5H4v2a3 3 0 003 3M17 5h3v2a3 3 0 01-3 3M10 18h4M12 14v4M8 21h8" },
  { id: "diamond", label: "Diamond", d: "M6 3h12l4 6-10 12L2 9z M2 9h20M9 3l3 6 3-6" },
  { id: "flame", label: "Flame", d: "M12 2c1 4-4 4-4 9a4 4 0 008 0c0-2-1-3-1-3s2 1 2 4a6 6 0 01-12 0C5 7 9 6 12 2z" },
  { id: "snow", label: "Snowflake", d: "M12 2v20M4 7l16 10M20 7L4 17M2 12h20" },
  { id: "anchor", label: "Anchor", d: "M12 4a2 2 0 100 4 2 2 0 000-4zM12 8v13M6 13a6 6 0 0012 0M4 13h4M16 13h4" },
  { id: "feather", label: "Feather", d: "M20 4S9 4 6 12c-1.5 4 0 8 4 8 8-3 8-16 8-16zM4 20l7-7" },
  { id: "mountain", label: "Mountain", d: "M2 20l7-12 5 8 3-5 5 9z" },
  { id: "sun", label: "Sun", d: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v3M12 20v3M4.2 4.2l2 2M17.8 17.8l2 2M1 12h3M20 12h3M4.2 19.8l2-2M17.8 6.2l2-2" },
  { id: "moon", label: "Moon", d: "M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" },
  { id: "cloud", label: "Cloud", d: "M7 18a4 4 0 010-8 5 5 0 019.6-1.5A4.5 4.5 0 0117 18z" },
  { id: "check", label: "Shield Check", d: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zM9 12l2 2 4-4" },
  { id: "dog", label: "Paw Circle", d: "M12 22a10 10 0 100-20 10 10 0 000 20zM8 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM9 16c0-2 6-2 6 0" },
  { id: "wrench", label: "Wrench", d: "M14.7 6.3a4 4 0 015.6 5.6L13 19.2a2 2 0 01-2.8 0L4.8 13.8a2 2 0 010-2.8l7.3-7.3a4 4 0 015.6.6" },
  { id: "target", label: "Target", d: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 13a1 1 0 100-2 1 1 0 000 2z" },
];

// Solid background badge shapes drawn behind the logo/text stack.
export const SHAPES = [
  { id: "none", label: "None" },
  { id: "circle", label: "Circle" },
  { id: "rounded-square", label: "Rounded Square" },
  { id: "hexagon", label: "Hexagon" },
  { id: "triangle", label: "Triangle" },
  { id: "ring", label: "Ring" },
];

export const SOLID_COLORS = [
  "#F94144", "#F3722C", "#F9C74F", "#90BE6D", "#43AA8B", "#4D908E",
  "#577590", "#277DA1", "#6C5CE7", "#8E44AD", "#2D3436", "#000000",
  "#FFFFFF", "#EF476F", "#06D6A0", "#118AB2",
];

export const GRADIENTS = [
  ["#6C5CE7", "#00CEC9"],
  ["#F857A6", "#FF5858"],
  ["#43CBFF", "#9708CC"],
  ["#F9D423", "#FF4E50"],
  ["#00B09B", "#96C93D"],
  ["#3A1C71", "#D76D77"],
  ["#0F2027", "#2C5364"],
  ["#FDC830", "#F37335"],
];

export const FONTS = [
  { id: "Poppins", label: "Poppins" },
  { id: "Inter", label: "Inter" },
  { id: "Montserrat", label: "Montserrat" },
  { id: "Playfair Display", label: "Playfair Display" },
  { id: "Roboto Slab", label: "Roboto Slab" },
];

export function iconSvgMarkup(icon, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${icon.d}"/></svg>`;
}
