// Shared page behavior: theme toggle, scroll reveals, view persistence, back button, skill highlights.
(function () {
  var root = document.documentElement;
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} }
  function load(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
  function drop(key) { try { sessionStorage.removeItem(key); } catch (e) {} }

  // View state persistence: remember whether user came from Grid (work.html) or Ask me (./)
  var path = window.location.pathname || "";
  var page = path.split("/").pop();
  var homePage = page === "work.html" ? "work.html"
    : (page === "" || page === "index.html" || path.endsWith("/")) ? "./" : null;
  if (homePage) store("portfolio_home", homePage);

  // Update brand link to go to whichever view was selected
  var savedHome = load("portfolio_home") || "./";
  document.querySelectorAll("a.brand").forEach(function (brand) {
    brand.setAttribute("href", savedHome);
  });

  document.querySelectorAll(".view-toggle a").forEach(function (toggleLink) {
    toggleLink.addEventListener("click", function () {
      var href = toggleLink.getAttribute("href");
      if (href) store("portfolio_home", href.indexOf("work.html") !== -1 ? "work.html" : "./");
    });
  });

  // Back chevron on case studies: return to the view the visitor came from, where they left it.
  // The home pages save their scroll position on the way out; the chat page also replays its thread (agent.js).
  document.querySelectorAll("[data-back]").forEach(function (back) {
    var label = savedHome === "work.html" ? "Back to Grid" : "Back to Ask me";
    back.setAttribute("href", savedHome);
    back.setAttribute("aria-label", label);
    back.setAttribute("title", label);
    back.addEventListener("click", function () { store("portfolio_return", savedHome); });
  });

  if (homePage) {
    var navType = "";
    try { navType = performance.getEntriesByType("navigation")[0].type; } catch (e) {}
    // Returning = arrived via the back chevron or the browser's back/forward buttons (or reloading the Grid;
    // reloading Ask me starts a fresh chat, so there is nothing to scroll back to).
    window.portfolioReturning = load("portfolio_return") === homePage || navType === "back_forward"
      || (navType === "reload" && homePage === "work.html");
    drop("portfolio_return");

    var scrollKey = "portfolio_scroll:" + homePage;
    window.addEventListener("pagehide", function () { store(scrollKey, String(window.scrollY)); });
    if (window.portfolioReturning && !location.hash) {
      var y = parseInt(load(scrollKey), 10);
      if (y > 0) {
        var restore = function () { window.scrollTo({ top: y, behavior: "instant" }); };
        if (document.readyState === "complete") restore();
        else window.addEventListener("load", restore);
      }
    }
  }

  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    });
  });

  // ---------- Skill deep links ----------
  // Links like `eezy-receipt.html?skill=Supabase#engineering` (the About toolkit and the GitHub profile)
  // scroll to where that skill is mentioned inside the #section and briefly highlight that sentence.
  // A match that is really a longer skill name is skipped (React inside "React Native").
  var LONGER = { react: /^\s+native/i };

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function findText(scope, phrase) {
    var re;
    try {
      re = new RegExp("(?<![\\w])" + escapeRe(phrase).replace(/\s+/g, "[\\s\\u00a0-]+") + "(?![\\w])", "gi");
    } catch (e) { return null; }
    var skip = LONGER[phrase.toLowerCase()];
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.parentElement.closest("script, style, .sr-only, mark.skill-flash") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var node, m;
    while ((node = walker.nextNode())) {
      re.lastIndex = 0;
      while ((m = re.exec(node.nodeValue))) {
        if (skip && skip.test(node.nodeValue.slice(m.index + m[0].length))) continue;
        return { node: node, start: m.index, end: m.index + m[0].length };
      }
    }
    return null;
  }

  function flashSkill() {
    var skill;
    try { skill = new URLSearchParams(location.search).get("skill"); } catch (e) {}
    if (!skill) return;
    // Drop the parameter so back/forward and reloads do not replay the highlight.
    try { history.replaceState(history.state, "", location.pathname + location.hash); } catch (e) {}

    var target = null;
    try { target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
    var scope = target ? (target.closest(".cs-section, .cs-hero, .proof-card") || target) : null;
    var hit = (scope && findText(scope, skill)) || findText(document.querySelector("main") || document.body, skill);

    if (!hit) {
      if (!target) return;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      target.classList.remove("skill-flash-block");
      void target.offsetWidth;
      target.classList.add("skill-flash-block");
      setTimeout(function () { target.classList.remove("skill-flash-block"); }, 3200);
      return;
    }

    var marks = markSentence(hit);
    if (!marks.length) return;
    marks[0].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

    var done = false;
    function unwrap() {
      if (done) return;
      done = true;
      marks.forEach(function (mark) {
        var parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      });
    }
    marks[marks.length - 1].addEventListener("animationend", unwrap);
    setTimeout(unwrap, 4200);
  }

  // Widen a match to its whole sentence inside the surrounding block (a sentence can run through
  // <b> or <a>), then wrap each text piece of it in a <mark>. Lists without a full stop (a "Tools" row)
  // highlight whole.
  var BLOCK = "p, li, dd, dt, figcaption, h1, h2, h3, h4, blockquote, .proof-tools, .badge-card";
  function markSentence(hit) {
    var block = hit.node.parentElement.closest(BLOCK) || hit.node.parentElement;
    var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    var pieces = [], text = "", at = 0, n;
    while ((n = walker.nextNode())) {
      if (n === hit.node) at = text.length;
      pieces.push({ node: n, offset: text.length });
      text += n.nodeValue;
    }
    function ends(i) { return /[.!?]/.test(text[i]) && (i + 1 >= text.length || /\s/.test(text[i + 1])); }
    var start = at + hit.start, end = at + hit.end;
    while (start > 0 && !ends(start - 1)) start--;
    while (start < text.length && /\s/.test(text[start])) start++;
    while (end < text.length && !ends(end)) end++;
    end = Math.min(end + 1, text.length);
    while (end > start && /\s/.test(text[end - 1])) end--;

    var marks = [];
    pieces.forEach(function (p) {
      var a = Math.max(start - p.offset, 0), b = Math.min(end - p.offset, p.node.nodeValue.length);
      if (a >= b || !p.node.nodeValue.slice(a, b).trim()) return;
      var range = document.createRange();
      range.setStart(p.node, a);
      range.setEnd(p.node, b);
      var mark = document.createElement("mark");
      mark.className = "skill-flash";
      range.surroundContents(mark);
      marks.push(mark);
    });
    return marks;
  }

  // Wait for images above the target to take their space, so the match lands where it will stay.
  function runFlash() { requestAnimationFrame(flashSkill); }
  if (document.readyState === "complete") runFlash();
  else window.addEventListener("load", runFlash);

  // Skill links to a section on the current page highlight in place instead of reloading.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href*='skill=']");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin || url.pathname !== location.pathname) return;
    e.preventDefault();
    history.pushState(null, "", url.pathname + url.search + url.hash);
    flashSkill();
  });

  // ---------- Toolkit tip (once per browser session) ----------
  // The first time the About toolkit scrolls into view, the chips ripple and a tip explains
  // that each one jumps to where the skill is used.
  var toolkit = document.querySelector(".toolkit-groups");
  if (toolkit && !load("portfolio_toolkit_tip") && "IntersectionObserver" in window) {
    var tipWatch = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      tipWatch.disconnect();
      store("portfolio_toolkit_tip", "1");
      showToolkitTip();
    }, { threshold: 0.6 });
    tipWatch.observe(toolkit);
  }

  function showToolkitTip() {
    toolkit.querySelectorAll(".tool-chip").forEach(function (chip, i) { chip.style.setProperty("--i", i); });
    toolkit.classList.add("chips-hint");
    setTimeout(function () { toolkit.classList.remove("chips-hint"); }, 3000);

    var tip = document.createElement("div");
    tip.className = "coach-toast";
    tip.setAttribute("role", "status");
    tip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-4 0"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>'
      + "<p><b>Tip:</b> click any skill to jump to the part of my work where I used it.</p>"
      + '<button type="button">Got it</button>';
    document.body.appendChild(tip);
    requestAnimationFrame(function () { tip.classList.add("in"); });

    var timer = setTimeout(hide, 10000);
    function hide() {
      clearTimeout(timer);
      tip.classList.remove("in");
      setTimeout(function () { tip.remove(); }, 400);
      toolkit.removeEventListener("click", hide);
    }
    tip.querySelector("button").addEventListener("click", hide);
    toolkit.addEventListener("click", hide);
  }

  // ---------- Looping videos (animated GIF replacements) ----------
  // Only the poster loads with the page; the video downloads as it nears the screen and pauses off it.
  // Reduced motion: keep the poster and offer controls instead of autoplaying.
  var videos = document.querySelectorAll("video[data-src]");
  function startVideo(v) {
    if (!v.getAttribute("src")) v.src = v.dataset.src;
    if (reduceMotion) { v.controls = true; return; }
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.controls = true; });
  }
  if (!("IntersectionObserver" in window)) {
    videos.forEach(startVideo);
  } else {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) startVideo(e.target);
        else if (e.target.getAttribute("src")) e.target.pause();
      });
    }, { rootMargin: "300px 0px" });
    videos.forEach(function (v) { vio.observe(v); });
  }

  // ---------- YouTube, loaded on click ----------
  // Each video shows a local thumbnail until played: the YouTube player is ~1 MB of scripts and hundreds of
  // requests, which would otherwise compete with the page's images on a slow connection.
  // Without JavaScript the play button is a plain link to the video on YouTube.
  document.addEventListener("click", function (e) {
    var play = e.target.closest && e.target.closest(".yt-lite .yt-play");
    if (!play || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    var box = play.parentNode;
    var frame = document.createElement("iframe");
    frame.src = box.dataset.embed + (box.dataset.embed.indexOf("?") === -1 ? "?" : "&") + "autoplay=1";
    frame.title = box.dataset.title || "YouTube video";
    frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;
    box.replaceChildren(frame);
    frame.focus();
  });

  // ---------- Copy buttons (the email card) ----------
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.getAttribute("aria-label");
    btn.addEventListener("click", function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(btn.dataset.copy).then(function () {
        btn.classList.add("copied");
        btn.setAttribute("aria-label", "Copied");
        btn.title = "Copied";
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.setAttribute("aria-label", label);
          btn.title = label;
        }, 1800);
      }, function () {});
    });
  });

  // ---------- Scroll reveals ----------
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    root.classList.add("js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

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
