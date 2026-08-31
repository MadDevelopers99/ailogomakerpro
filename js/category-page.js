// Shared script for /logo-maker/<category>.html landing pages.
(function () {
  var catId = document.body.getAttribute("data-category");
  var el = document.getElementById("tileGrid");
  if (!catId || !el) return;

  fetch("../data/logos.json")
    .then(function (r) { return r.json(); })
    .then(function (logos) {
      var list = logos.filter(function (l) { return l.categoryId === catId; });
      var countEl = document.getElementById("catCount");
      if (countEl) countEl.textContent = list.length.toLocaleString();

      var step = Math.max(1, Math.floor(list.length / 6));
      var picks = [];
      for (var i = 0; i < 6 && i * step < list.length; i++) picks.push(list[i * step]);

      el.innerHTML = picks.map(function (l, i) {
        return '<div class="tile' + (i === 2 ? " center" : "") + '">' +
          '<img src="../' + l.image + '" alt="' + l.name + '" loading="lazy" onload="this.classList.add(\'img-loaded\')" onerror="this.classList.add(\'img-loaded\')">' +
          '<div class="lbl">BRAND NAME</div><div class="sub">SLOGAN HERE</div></div>';
      }).join("");
      el.querySelectorAll("img").forEach(function (img) { if (img.complete) img.classList.add("img-loaded"); });
    });

  document.querySelectorAll("[data-yearnow]").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  var revealTargets = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(function (t) { revealObserver.observe(t); });
    setTimeout(function () { revealTargets.forEach(function (t) { t.classList.add("is-visible"); }); }, 2500);
  } else {
    revealTargets.forEach(function (t) { t.classList.add("is-visible"); });
  }
})();
