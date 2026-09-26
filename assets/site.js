// Shared page behavior: theme toggle, scroll reveals, and view persistence.
(function () {
  var root = document.documentElement;

  // View state persistence: remember whether user came from Grid (work.html) or Ask me (./)
  var path = window.location.pathname || "";
  var page = path.split("/").pop();
  if (page === "work.html") {
    try { sessionStorage.setItem("portfolio_home", "work.html"); } catch (e) {}
  } else if (page === "" || page === "index.html" || path.endsWith("/")) {
    try { sessionStorage.setItem("portfolio_home", "./"); } catch (e) {}
  }

  // Update brand link to go to whichever view was selected
  try {
    var savedHome = sessionStorage.getItem("portfolio_home") || "./";
    document.querySelectorAll("a.brand").forEach(function (brand) {
      brand.setAttribute("href", savedHome);
    });
  } catch (e) {}

  document.querySelectorAll(".view-toggle a").forEach(function (toggleLink) {
    toggleLink.addEventListener("click", function () {
      var href = toggleLink.getAttribute("href");
      if (href) {
        try {
          if (href.indexOf("work.html") !== -1) {
            sessionStorage.setItem("portfolio_home", "work.html");
          } else {
            sessionStorage.setItem("portfolio_home", "./");
          }
        } catch (e) {}
      }
    });
  });

  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    });
  });

  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.classList.add("js");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (el) { io.observe(el); });

  // Open all external links in a new tab with secure rel
  function ensureExternalLinks() {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (/^(?:https?:)?\/\//i.test(href)) {
        try {
          var targetHost = new URL(a.href, window.location.href).hostname;
          if (targetHost && targetHost !== window.location.hostname) {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener noreferrer");
          }
        } catch (e) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureExternalLinks);
  } else {
    ensureExternalLinks();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (a && a.href) {
      var href = a.getAttribute("href") || "";
      if (/^(?:https?:)?\/\//i.test(href)) {
        try {
          var targetHost = new URL(a.href, window.location.href).hostname;
          if (targetHost && targetHost !== window.location.hostname) {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
          }
        } catch (e) {}
      }
    }
  }, true);
})();
