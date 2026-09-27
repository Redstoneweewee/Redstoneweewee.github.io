// Shared page behavior: theme toggle, case study banner, view persistence, back button, skill highlights, page slides.
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

  // ---------- Toolkit tip ----------
  // The first time the About toolkit scrolls into view, the margin note fades in and the TypeScript chip pulses.
  // After that the note stays for the rest of the session (coming back from a case study shows it at
  // once, without replaying); a refresh clears it so both play again.
  var toolkit = document.querySelector(".toolkit-groups");
  var toolkitTip = document.querySelector(".toolkit-tip");
  if (toolkit && toolkitTip) {
    drawTipArrow();
    if ("ResizeObserver" in window) new ResizeObserver(drawTipArrow).observe(toolkit.parentNode);
    if (document.fonts) document.fonts.ready.then(drawTipArrow);

    var nav = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    if (nav && nav.type === "reload") drop("portfolio_toolkit_tip");
    if (load("portfolio_toolkit_tip") || !("IntersectionObserver" in window)) {
      toolkitTip.classList.add("in", "shown");
    } else {
      var tipWatch = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        tipWatch.disconnect();
        store("portfolio_toolkit_tip", "1");
        showToolkitTip();
      }, { threshold: 0.6 });
      tipWatch.observe(toolkit);
    }
  }

  function showToolkitTip() {
    toolkitTip.classList.add("in");
    var chip = toolkit.querySelector("[data-tip-target]");
    if (!chip) return;
    chip.classList.add("tip-pulse");
    setTimeout(function () { chip.classList.remove("tip-pulse"); }, 3200);
  }

  // Places the note, then draws a straight arrow from its bottom middle, aimed at the center of the target
  // chip and stopping where it would enter the chip (plus a small gap), so it always lands on it.
  // It runs on load and resize, before and after the chip pulse.
  function drawTipArrow() {
    var note = toolkitTip.querySelector(".toolkit-note");
    var path = toolkitTip.querySelector(".toolkit-arrow path");
    var chip = toolkit.querySelector("[data-tip-target]");
    if (!note || !path || !chip) return;
    var col = toolkit.parentNode;
    var box = col.getBoundingClientRect();
    var c = chip.getBoundingClientRect();

    // Center the note about 100px right of the chip, kept inside the column and clear of the heading
    // text beside it; it only wraps if even that space is too narrow.
    var heading = col.querySelector("h3");
    var text = document.createRange();
    text.selectNodeContents(heading);
    var minLeft = text.getBoundingClientRect().right - box.left + 16;
    note.style.whiteSpace = "";
    note.style.maxWidth = "";
    var w = note.offsetWidth, room = col.clientWidth - minLeft;
    if (w > room) {
      note.style.whiteSpace = "normal";
      note.style.maxWidth = room + "px";
      w = note.offsetWidth;
    }
    var left = c.left - box.left + c.width / 2 + 100 - w / 2;
    left = Math.max(minLeft, Math.min(left, col.clientWidth - w));
    note.style.left = left + "px";
    note.style.right = "auto";

    var n = note.getBoundingClientRect();
    var x1 = n.left + n.width / 2 - box.left, y1 = n.bottom - box.top + 8;
    var cx = c.left + c.width / 2 - box.left, cy = c.top + c.height / 2 - box.top;
    var dx = cx - x1, dy = cy - y1, gap = 6;
    // Entry point into the chip's box grown by the gap (slab method)
    var tx = dx ? (dx - Math.sign(dx) * (c.width / 2 + gap)) / dx : 0;
    var ty = dy ? (dy - Math.sign(dy) * (c.height / 2 + gap)) / dy : 0;
    var t = Math.max(tx, ty);
    var x2 = x1 + dx * t, y2 = y1 + dy * t;
    if (t <= 0 || Math.hypot(x2 - x1, y2 - y1) < 14) { path.setAttribute("d", ""); return; }
    var a = Math.atan2(dy, dx), head = 11, spread = Math.PI / 5;
    var hx1 = x2 - head * Math.cos(a - spread), hy1 = y2 - head * Math.sin(a - spread);
    var hx2 = x2 - head * Math.cos(a + spread), hy2 = y2 - head * Math.sin(a + spread);
    // The shaft stops a little short of the tip so its flat end hides inside the head's mitered point
    var sx = x2 - 3 * Math.cos(a), sy = y2 - 3 * Math.sin(a);
    function f(v) { return v.toFixed(1); }
    path.setAttribute("d", "M" + f(x1) + " " + f(y1) + "L" + f(sx) + " " + f(sy)
      + "M" + f(hx1) + " " + f(hy1) + "L" + f(x2) + " " + f(y2) + "L" + f(hx2) + " " + f(hy2));
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

  // ---------- Case study banner: fades into the page as you scroll ----------
  // Writes scroll progress (0 at the top, 1 once the banner has scrolled past) to --p; style.css does the fade.
  var banner = document.querySelector(".cs-banner");
  if (banner && !reduceMotion) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var p = Math.min(Math.max(window.scrollY / banner.offsetHeight, 0), 1);
      banner.style.setProperty("--p", p.toFixed(3));
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // ---------- Page slides (style.css, "Page slides") ----------
  // The site is one row of pages: Ask me, Grid, then the case studies in "Next case study" order. Moving right
  // along the row slides the new page in from the right; moving left, from the left. The case studies loop
  // (the last one's "Next" is the first), so each one's neighbors are a single step away in either direction.
  var ROW = ["", "work.html", "uncoded-resolve.html", "eezy-receipt.html", "hedron.html", "warden-creations.html"];
  var FIRST_CASE = 2, CASE_COUNT = ROW.length - FIRST_CASE;
  function place(url) {
    var file = new URL(url, location.href).pathname.split("/").pop();
    return ROW.indexOf(file === "index.html" ? "" : file);
  }
  function slideDirection(from, to) {
    if (from >= FIRST_CASE && to >= FIRST_CASE) {
      var step = (to - from + CASE_COUNT) % CASE_COUNT;
      if (step === 1) return "forward";
      if (step === CASE_COUNT - 1) return "back";
    }
    return to > from ? "forward" : "back";
  }

  // Each word of the shared Ask me / Grid title flies to its new spot, but only when the title is on screen as
  // the page is left; otherwise the words ride along with the sliding page.
  window.addEventListener("pageswap", function (e) {
    var title = document.querySelector(".hero-title");
    if (!e.viewTransition || !title) return;
    var r = title.getBoundingClientRect();
    title.classList.toggle("vt-off", !title.offsetParent || r.bottom < 0 || r.top > window.innerHeight);
  });
  window.addEventListener("pagereveal", function (e) {
    if (!e.viewTransition) return;
    var fromUrl = "";
    try { fromUrl = navigation.activation.from.url; } catch (err) {}
    var from = place(fromUrl || document.referrer || location.href), to = place(location.href);
    // A page linking to itself (the brand link) has nowhere to slide to.
    if (from < 0 || to < 0 || from === to) { e.viewTransition.skipTransition(); return; }
    root.dataset.slide = slideDirection(from, to);
    e.viewTransition.finished.then(function () { delete root.dataset.slide; }, function () { delete root.dataset.slide; });
  });

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
