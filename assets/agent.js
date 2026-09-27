// "Ask Leifeng": a portfolio agent that runs entirely in the browser.
// Every answer below is written by hand. The engine matches a visitor's question to the closest
// topic and replies with that answer plus case-study cards. Nothing typed here leaves the page.
// Concept inspired by Studio Nikita (Nikita Rochiramani), studio-nikita.com.

(function () {
  "use strict";

  // ---------- Case study cards ----------
  var CASES = {
    ur: { href: "uncoded-resolve.html", img: "assets/img/ur/final-combat-7.webp", title: "Uncoded Resolve",
          eyebrow: "Simultaneous-Turn Tactics UI",
          sub: "The HUD, icons, and color system for a tactics game where both sides move at once", theme: "theme-ur" },
    ez: { href: "eezy-receipt.html", img: "assets/img/ez/screen-3.webp", title: "Eezy Receipt",
          eyebrow: "Mobile Usability Redesign",
          sub: "A receipt-splitting app where claiming your items is one tap", theme: "theme-ez" },
    hd: { href: "hedron.html", img: "assets/img/hd/card-back.webp", title: "Hedron³",
          eyebrow: "B2B Workflow & Brand Identity",
          sub: "A logo, business card, and a five-step guided workflow for the startup I co-founded", theme: "theme-hd" },
    wc: { href: "warden-creations.html", img: "assets/img/yt/simple-arsenal.webp", title: "Warden Creations",
          eyebrow: "Game UX & Distribution for 3.6M+ Players",
          sub: "In-game tooltip UX, 17.7% peak CTR thumbnails, and shipping updates to 3.6M+ players", theme: "theme-wc" }
  };

  // ---------- Knowledge base ----------
  // The answers themselves live in assets/answers.txt as "Question"="Answer" (see the notes at its top).
  // META adds what plain text can't: matching keywords, case-study cards, pictures, stats, and links,
  // keyed by the same question. A question in the text file without META is matched on its own words.
  // keys: [term, weight]. Single words are stemmed before matching; multi-word terms match as phrases.
  var META = {
    "Who are you?": {
      keys: [["who are you",4], ["who",2], ["yourself",3], ["about you",4], ["introduce",3], ["background",2], ["leifeng",2], ["bio",3]],
      follow: ["Show me your best work", "Can you code?", "Are you looking for an internship?"]
    },
    "Show me your best work": {
      keys: [["work",2], ["project",3], ["portfolio",3], ["case",3], ["studies",3], ["study",2], ["best",2], ["show",1], ["examples",3]],
      cards: ["ur", "ez", "hd", "wc"],
      follow: ["Tell me about Uncoded Resolve", "Tell me about Eezy Receipt", "What's a design mistake you learned from?"]
    },
    "Tell me about Uncoded Resolve": {
      keys: [["uncoded",6], ["resolve",4], ["game",3], ["tactics",4], ["tactical",4], ["strategy",3], ["hud",4], ["unity",2], ["icons",2], ["faction",3]],
      cards: ["ur"],
      follow: ["How did you design the color system?", "What's a design mistake you learned from?", "Do you do motion design?"]
    },
    "How did you design the color system?": {
      keys: [["color",4], ["colour",4], ["palette",5], ["symbol",4], ["visual language",5], ["brand",2]],
      cards: ["ur"],
      images: [["assets/img/ur/palette.webp", "Uncoded Resolve color palette"]],
      follow: ["Show me your visual design", "How do you handle accessibility?", "Tell me about Uncoded Resolve"]
    },
    "Tell me about Eezy Receipt": {
      keys: [["eezy",6], ["easy receipt",6], ["receipt",5], ["split",4], ["splitting",4], ["bill",3], ["mobile",2], ["app",1], ["ios",2]],
      cards: ["ez"],
      stats: [["16", "iOS testers on TestFlight"], ["iOS + web", "one design system, light and dark themes"], ["7", "person team, with me as designer and Scrum Master"]],
      follow: ["How do you use feedback?", "How do you handle accessibility?", "How do you work with a team?"]
    },
    "Tell me about Hedron³": {
      keys: [["hedron",6], ["hedron3",6], ["startup",4], ["founder",4], ["cofounder",4], ["company",2], ["logistics",4], ["export",3], ["business card",5], ["logo",3]],
      cards: ["hd"],
      follow: ["What's your design process?", "How do you use AI?", "Can you code?"]
    },
    "What's a design mistake you learned from?": {
      keys: [["mistake",6], ["fail",5], ["failure",5], ["wrong",4], ["learn",2], ["lesson",4], ["regret",4], ["tutorial",5], ["close",2]],
      cards: ["ur"],
      pair: [["assets/img/ur/tutorial-before.webp", "Before: the only way out was the small X"], ["assets/img/ur/tutorial-after.webp", "After: a labeled continue button"]],
      follow: ["What would you do differently?", "What's a project that flopped?", "How do you use feedback?"]
    },
    "What's a project that flopped?": {
      keys: [["flop",6], ["flopped",6], ["trend",6], ["hype",6], ["golem",6], ["copper golem",8], ["armor trims",8], ["mob vote",8], ["underperform",6]],
      cards: ["wc"],
      images: [["assets/img/wc/copper-golem.webp", "Copper Golem: built for the Mob Vote hype"]],
      follow: ["Tell me about Warden Creations", "What would you do differently?", "What's a design mistake you learned from?"]
    },
    "How do you use feedback?": {
      keys: [["feedback",6], ["research",5], ["user research",6], ["users",2], ["test",3], ["testing",4], ["usability",5], ["survey",5], ["interview",3], ["listen",3]],
      cards: ["ez", "wc"],
      follow: ["Tell me about Eezy Receipt", "Tell me about your YouTube and Minecraft work", "What's your design process?"]
    },
    "How do you handle accessibility?": {
      keys: [["accessibility",6], ["accessible",6], ["a11y",6], ["colorblind",6], ["color blind",6], ["contrast",4], ["inclusive",4], ["dark mode",4]],
      cards: ["ez"],
      images: [["assets/img/ez/finances.webp", "Signed amounts and labels, not just color"]],
      follow: ["Tell me about Eezy Receipt", "How did you design the color system?", "What's your design process?"]
    },
    "What's your design process?": {
      keys: [["process",6], ["approach",5], ["how do you design",6], ["workflow",3], ["method",4], ["start",2], ["steps",2]],
      cards: ["ur", "ez"],
      follow: ["What's a design mistake you learned from?", "How do you use feedback?", "What tools do you use?"]
    },
    "What tools do you use?": {
      keys: [["tools",6], ["tool",5], ["software",4], ["figma",5], ["photoshop",5], ["skills",4], ["stack",3], ["canva",4], ["blockbench",4]],
      follow: ["Can you code?", "Do you do motion design?", "How do you use AI?"]
    },
    "Can you code?": {
      keys: [["code",5], ["coding",5], ["engineer",4], ["engineering",4], ["developer",4], ["program",3], ["programming",4], ["frontend",4], ["front end",4], ["swift",3], ["kotlin",3], ["react",3], ["technical",3], ["build",2]],
      follow: ["How do you use AI?", "What tools do you use?", "Where do you go to school?"]
    },
    "How do you use AI?": {
      keys: [["ai",5], ["artificial",4], ["claude",5], ["agent",4], ["agents",4], ["llm",5], ["chatgpt",5], ["generated",4], ["copilot",4]],
      follow: ["Is this chat an AI?", "Tell me about Uncoded Resolve", "Can you code?"]
    },
    "Is this chat an AI?": {
      keys: [["are you an ai",8], ["are you ai",8], ["you an ai",7], ["is this ai",7], ["is this an ai",8], ["actually ai",6], ["real ai",5], ["hardcoded",6], ["are you chatgpt",8], ["this chat",6], ["chatbot",6], ["bot",5], ["are you real",6], ["how does this work",6], ["gpt",4], ["real person",5]],
      links: [["Studio Nikita", "https://www.studio-nikita.com/"]],
      follow: ["How do you use AI?", "Who are you?", "How can I contact you?"]
    },
    "Show me your visual design": {
      keys: [["visual",5], ["graphic",5], ["thumbnail",6], ["thumbnails",6], ["illustration",4], ["art",3], ["aesthetic",4], ["style",2], ["ctr",5], ["click",3], ["unbreakable",6]],
      cards: ["ur", "wc"],
      images: [["assets/img/yt/unbreakable-armor.webp", "Unbreakable Armor: 17.7% click-through on 96K impressions"]],
      links: [["See all thumbnails", "warden-creations.html#visual"], ["Warden Creations case study", "warden-creations.html"]],
      follow: ["How did you design the in-game tooltips?", "How did you design the color system?", "Do you do motion design?"]
    },
    "Tell me about your YouTube and Minecraft work": {
      keys: [["youtube",6], ["minecraft",6], ["addon",5], ["add-on",5], ["addons",5], ["mods",4], ["mod",4], ["channel",4], ["subscribers",5], ["downloads",5], ["community",4], ["discord",5], ["creator",4]],
      cards: ["wc"],
      stats: [["64.7K", "YouTube subscribers"], ["3.6M+", "add-on downloads"], ["6,000+", "Discord members"]],
      links: [["Case study", "warden-creations.html"], ["YouTube channel", "https://www.youtube.com/@warden-creations"]],
      follow: ["Tell me about Warden Creations", "What's a project that flopped?", "Show me your visual design"]
    },
    "Tell me about Warden Creations": {
      keys: [["warden",6], ["creations",6], ["warden creations",8], ["minecraft add-on",6], ["simple arsenal",6], ["fortify",6]],
      cards: ["wc"],
      stats: [["3.6M+", "downloads across 11 add-ons"], ["64.7K", "YouTube subscribers"], ["17.7%", "peak thumbnail CTR"]],
      follow: ["How did you design the in-game tooltips?", "What's a project that flopped?", "Show me your visual design"]
    },
    "How did you design the in-game tooltips?": {
      keys: [["tooltip",6], ["wiki",6], ["glyph",6], ["inventory",4], ["readability",5], ["readable",4], ["ingame",3], ["badge",4]],
      cards: ["wc"],
      images: [["assets/img/wc/tooltip-nexus-bow.webp", "Nexus Bow tooltip with stat glyphs"]],
      links: [["Watch the Tooltips Update", "https://youtu.be/jPPaBNTnGYE"]],
      follow: ["Tell me about Warden Creations", "How do you handle accessibility?", "Show me your visual design"]
    },
    "Do you do motion design?": {
      keys: [["motion",6], ["video",5], ["animation",5], ["animate",4], ["trailer",6], ["davinci",5], ["editing",4], ["edit",3]],
      videos: [["35AqF1ij6UQ", "Uncoded Resolve trailer", "assets/img/ur/poster-trailer.webp"], ["tGaxgyy-COs", "Eezy Receipt launch video", "assets/img/ez/poster-launch.webp"]],
      follow: ["Show me your visual design", "Tell me about Uncoded Resolve", "What tools do you use?"]
    },
    "How do you work with a team?": {
      keys: [["team",5], ["teamwork",6], ["collaborate",6], ["collaboration",6], ["lead",4], ["leadership",6], ["scrum",5], ["agile",5], ["manage",3], ["engineers",3], ["pm",3]],
      cards: ["ez"],
      follow: ["Tell me about Eezy Receipt", "Tell me about Hedron³", "Can you code?"]
    },
    "What would you do differently?": {
      keys: [["differently",6], ["weakness",6], ["weaknesses",6], ["improve",4], ["growth",4], ["hindsight",5], ["change",2]],
      follow: ["What's a project that flopped?", "What's a design mistake you learned from?", "What's your design process?"]
    },
    "Why UX design?": {
      keys: [["why ux",6], ["why design",6], ["why",2], ["motivation",5], ["passion",4], ["interested",3], ["inspire",3]],
      follow: ["Tell me about your YouTube and Minecraft work", "What's your design process?", "Are you looking for an internship?"]
    },
    "Are you looking for an internship?": {
      keys: [["internship",6], ["intern",6], ["hire",5], ["hiring",5], ["available",5], ["availability",5], ["summer",4], ["job",4], ["relocate",5], ["sponsorship",5], ["visa",5], ["citizen",4], ["graduate",4], ["graduation",4]],
      follow: ["How can I contact you?", "Where do you go to school?", "Show me your best work"]
    },
    "How can I contact you?": {
      keys: [["contact",6], ["email",6], ["reach",5], ["linkedin",5], ["github",5], ["resume",5], ["cv",5], ["talk",3], ["connect",4]],
      links: [["Email me", "mailto:leifengchen123@gmail.com"], ["LinkedIn", "https://www.linkedin.com/in/leifengchen"], ["GitHub", "https://github.com/Redstoneweewee"]],
      follow: ["Are you looking for an internship?", "Show me your best work", "Who are you?"]
    },
    "Where do you go to school?": {
      keys: [["school",5], ["university",5], ["college",5], ["ucsb",5], ["gpa",5], ["degree",5], ["major",4], ["classes",4], ["courses",4], ["education",5]],
      follow: ["Can you code?", "Are you looking for an internship?", "Tell me about Uncoded Resolve"]
    },
    "Hi!": {
      keys: [["hi",4], ["hello",5], ["hey",5], ["yo",3], ["sup",3], ["morning",3], ["afternoon",3]],
      follow: ["Show me your best work", "Who are you?", "Are you looking for an internship?"]
    },
    "Thanks!": {
      keys: [["thanks",5], ["thank",5], ["thx",5], ["cool",2], ["awesome",2], ["nice",2], ["great",2], ["bye",4]],
      links: [["Email me", "mailto:leifengchen123@gmail.com"]],
      follow: ["How can I contact you?", "Show me your best work", "Are you looking for an internship?"]
    },
    "What's the weather like?": {
      keys: [["weather",8], ["rain",5], ["sunny",5], ["temperature",5], ["forecast",6]],
      follow: ["Show me your best work", "Who are you?", "Where do you go to school?"]
    }
  };
  var KB = [];

  var GUIDE = [
    ["Case studies", ["Show me your best work", "Tell me about Uncoded Resolve", "Tell me about Eezy Receipt", "Tell me about Hedron³", "Tell me about Warden Creations", "Show me your visual design"]],
    ["How I work", ["What's your design process?", "What's a design mistake you learned from?", "What's a project that flopped?", "How do you use feedback?", "How do you handle accessibility?", "How do you use AI?"]],
    ["About me", ["Who are you?", "Can you code?", "Tell me about your YouTube and Minecraft work", "Are you looking for an internship?", "How can I contact you?"]]
  ];
  var STARTERS = ["Show me your best work", "What's a design mistake you learned from?", "How do you use feedback?", "Are you looking for an internship?"];

  var FALLBACK = {
    a: [],
    follow: ["Show me your best work", "What's your design process?", "How can I contact you?"],
    links: [["Email me", "mailto:leifengchen123@gmail.com"]]
  };
  // After this many questions the chat admits it isn't an AI and points to the real Leifeng (once per thread).
  var FOURTH_WALL_AT = 5;
  var FOURTH_WALL = {
    a: [],
    follow: ["Are you looking for an internship?", "Show me your best work", "How can I contact you?"],
    links: [["Email me", "mailto:leifengchen123@gmail.com"], ["LinkedIn", "https://www.linkedin.com/in/leifengchen"]]
  };

  // ---------- Matching ----------
  var STOP = new Set("a an the i me my you your u of to in on for and or is are was were be do does did can could would should will what whats which how tell about with at it its this that some any please show give me more".split(" "));

  function norm(s) {
    return (" " + s.toLowerCase().replace(/[’']/g, "").replace(/³/g, "3").replace(/[^a-z0-9+\s-]/g, " ").replace(/\s+/g, " ") + " ");
  }
  function stem(w) {
    return w.replace(/(ing|edly|ed|ies|es|s|ly)$/, function (m) { return m === "ies" ? "y" : ""; }) || w;
  }
  function lev1(a, b) { // true if edit distance <= 1
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  // ---------- Loading answers.txt ----------
  function parseAnswers(txt) {
    var out = {}, re = /"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)"/g, m;
    function unq(x) { return x.replace(/\\(.)/g, "$1"); }
    txt = txt.replace(/\r\n?/g, "\n").replace(/^#.*$/gm, ""); // any line starting with # is a comment
    while ((m = re.exec(txt))) {
      out[unq(m[1]).trim()] = unq(m[2]).trim().split(/\n[ \t]*\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
    }
    return out;
  }

  function buildKB(answers) {
    Object.keys(answers).forEach(function (q) {
      if (q.charAt(0) === "[") return;
      var e = META[q] || {};
      e.q = q;
      e.a = answers[q];
      if (answers["[more] " + q]) e.more = answers["[more] " + q];
      // Without hand-picked keywords, match on the question's own words.
      var keys = e.keys || norm(q).trim().split(" ").filter(function (t) { return t && !STOP.has(t); })
        .map(function (t) { return [t, 3]; });
      e._keys = keys.map(function (k) {
        var phrase = k[0].indexOf(" ") > -1;
        return { phrase: phrase, term: phrase ? " " + k[0] + " " : stem(k[0].replace(/-/g, "")), w: k[1] };
      });
      e._q = norm(q);
      KB.push(e);
    });
    FALLBACK.a = answers["[fallback]"] || ["I don't have an answer written for that one. Email me and I'll answer myself."];
    FOURTH_WALL.a = answers["[fourth wall]"] || [];
  }

  function match(text) {
    var n = norm(text);
    for (var e = 0; e < KB.length; e++) if (KB[e]._q === n) return KB[e]; // a clicked chip or an exact question
    var tokens = n.trim().split(" ").map(function (t) { return t.replace(/-/g, ""); })
      .filter(function (t) { return t && !STOP.has(t); }).map(stem);
    var best = null, bestScore = 0;
    KB.forEach(function (e) {
      var score = 0;
      e._keys.forEach(function (k) {
        if (k.phrase) { if (n.indexOf(k.term) > -1) score += k.w * 1.5; return; }
        for (var i = 0; i < tokens.length; i++) {
          var t = tokens[i];
          if (t === k.term || (k.term.length >= 5 && t.length >= 5 && lev1(t, k.term))) { score += k.w; break; }
        }
      });
      if (score > bestScore) { bestScore = score; best = e; }
    });
    return bestScore >= 4 ? best : null;
  }

  // ---------- Rendering ----------
  var thread = document.getElementById("thread");
  var intro = document.getElementById("intro");
  var form = document.getElementById("ask-form");
  var input = document.getElementById("ask-input");
  var send = form.querySelector(".send");
  var panel = document.getElementById("guide-panel");
  var guideBtn = document.getElementById("guide-btn");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var last = null, busy = false;

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // **bold** and [linked text](url). Web links open in a new tab; site pages (e.g. hedron.html) open in place.
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
      if (/^(javascript|data):/i.test(url)) return text;
      return '<a href="' + url + '"' + (/^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + text + "</a>";
    });
  }
  function block(s) {
    var lines = s.split("\n");
    if (/^\d+\.\s/.test(lines[0])) {
      return "<ol>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^\d+\.\s/, "")) + "</li>"; }).join("") + "</ol>";
    }
    return "<p>" + lines.map(inline).join("<br>") + "</p>";
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function chipButtons(list, cls) {
    var wrap = el("div", cls || "chips");
    list.forEach(function (q) {
      var b = el("button", "chip");
      b.type = "button"; b.textContent = q;
      b.addEventListener("click", function () { ask(q); });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function attachments(entry) {
    var frag = document.createDocumentFragment();
    if (entry.stats) {
      var s = el("div", "attach"); var row = el("div", "stat-row");
      entry.stats.forEach(function (x) { row.appendChild(el("div", null, "<b>" + esc(x[0]) + "</b><span>" + esc(x[1]) + "</span>")); });
      s.appendChild(row); frag.appendChild(s);
    }
    if (entry.pair) {
      var p = el("div", "attach pair");
      entry.pair.forEach(function (x) { p.appendChild(el("figure", null, '<img src="' + x[0] + '" alt="' + esc(x[1]) + '" loading="lazy"><figcaption>' + esc(x[1]) + "</figcaption>")); });
      frag.appendChild(p);
    }
    if (entry.images) {
      var im = el("div", "attach");
      entry.images.forEach(function (x) { im.appendChild(el("figure", null, '<img src="' + x[0] + '" alt="' + esc(x[1]) + '" loading="lazy" style="max-width:360px"><figcaption>' + esc(x[1]) + "</figcaption>")); });
      frag.appendChild(im);
    }
    if (entry.videos) { // [YouTube id, title, local poster]: the same click-to-load player as the case studies (site.js)
      var v = el("div", "attach pair");
      entry.videos.forEach(function (x) {
        v.appendChild(el("figure", null, '<div class="video-frame yt-lite" data-embed="https://www.youtube-nocookie.com/embed/' + x[0] + '?rel=0" data-title="' + esc(x[1]) + '">'
          + '<img src="' + x[2] + '" alt="" loading="lazy" decoding="async">'
          + '<a class="yt-play" href="https://www.youtube.com/watch?v=' + x[0] + '" aria-label="Play video: ' + esc(x[1]) + '">'
          + '<svg viewBox="0 0 68 48" aria-hidden="true"><rect width="68" height="48" rx="0"/><path d="M27 15l18 9-18 9z"/></svg></a></div>'
          + "<figcaption>" + esc(x[1]) + "</figcaption>"));
      });
      frag.appendChild(v);
    }
    if (entry.cards) {
      var c = el("div", "attach cards");
      // The study's color as a slanted edge between picture and text, at the case study banners' angle
      var slant = '<svg class="mini-slant" viewBox="0 0 1000 22" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="cut" d="M0 1.5L1000 21V22H0Z"/><path class="line" d="M0 1.5L1000 21"/></svg>';
      entry.cards.forEach(function (id) {
        var k = CASES[id];
        var eyebrowHtml = k.eyebrow ? '<p class="eyebrow">' + esc(k.eyebrow) + '</p>' : '';
        var a = el("a", "mini-card " + k.theme, '<img src="' + k.img + '" alt="" loading="lazy"><span>' + slant + eyebrowHtml + '<b>' + esc(k.title) + "</b><small>" + esc(k.sub) + "</small><em>View case study →</em></span>");
        a.href = k.href; c.appendChild(a);
      });
      frag.appendChild(c);
    }
    if (entry.links) {
      var l = el("div", "attach"); var r = el("div", "link-row");
      entry.links.forEach(function (x) {
        var a = el("a"); a.href = x[1]; a.textContent = x[0];
        if (/^https?:/.test(x[1])) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        r.appendChild(a);
      });
      l.appendChild(r); frag.appendChild(l);
    }
    return frag;
  }

  function scrollDown(smooth) {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: (reduce || !smooth) ? "instant" : "smooth"
    });
  }

  function addUser(text, instant) {
    var m = el("div", "msg user"); var b = el("div", "bubble"); b.textContent = text;
    m.appendChild(b); thread.appendChild(m);
    if (!instant) scrollDown(true);
  }

  function streamBotChars(b, paragraphs, onComplete, instant) {
    var staging = document.createElement("div");
    staging.innerHTML = paragraphs.map(block).join("");

    if (reduce || instant) {
      b.innerHTML = staging.innerHTML;
      if (onComplete) onComplete();
      return;
    }

    var actions = [];

    function processText(text) {
      var tokens = text.match(/\S+|\s+/g);
      if (!tokens) return;
      tokens.forEach(function (tok) {
        if (/^\s+$/.test(tok)) {
          actions.push({ type: "space", val: tok });
        } else {
          actions.push({ type: "word-start" });
          var chars = Array.from(tok);
          for (var i = 0; i < chars.length; i++) {
            actions.push({ type: "char", val: chars[i] });
          }
          actions.push({ type: "word-end" });
        }
      });
    }

    function walk(n) {
      if (n.nodeType === Node.TEXT_NODE) {
        processText(n.nodeValue);
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        var tag = n.tagName.toLowerCase();
        var attrs = tag === "a" ? { href: n.getAttribute("href"), target: n.getAttribute("target"), rel: n.getAttribute("rel") } : null;
        actions.push({ type: "open", tag: tag, className: n.className, attrs: attrs });
        for (var j = 0; j < n.childNodes.length; j++) {
          walk(n.childNodes[j]);
        }
        actions.push({ type: "close", tag: tag });
      }
    }

    for (var i = 0; i < staging.childNodes.length; i++) {
      walk(staging.childNodes[i]);
    }

    var totalChars = actions.filter(function (a) { return a.type === "char"; }).length;

    b.innerHTML = "";
    var cursor = el("span", "ai-cursor");
    b.appendChild(cursor);

    var stack = [b];
    var currentWord = null;
    var actionIndex = 0;
    var timer = null;
    var finished = false;

    var targetDuration = Math.min(2400, Math.max(800, totalChars * 7));
    var intervalMs = 12;
    var charsPerTick = Math.max(1, Math.round(totalChars / (targetDuration / intervalMs)));

    function applyAction(act) {
      if (act.type === "open") {
        var elem = document.createElement(act.tag);
        if (act.className) elem.className = act.className;
        if (act.attrs) Object.keys(act.attrs).forEach(function (k) { if (act.attrs[k]) elem.setAttribute(k, act.attrs[k]); });
        var parent = stack[stack.length - 1];
        parent.insertBefore(elem, cursor);
        if (act.tag !== "br" && act.tag !== "hr" && act.tag !== "img") {
          stack.push(elem);
          elem.appendChild(cursor);
        }
      } else if (act.type === "close") {
        if (act.tag !== "br" && act.tag !== "hr" && act.tag !== "img") {
          stack.pop();
          stack[stack.length - 1].appendChild(cursor);
        }
      } else if (act.type === "word-start") {
        currentWord = document.createElement("span");
        currentWord.className = "ai-word";
        var curParent = stack[stack.length - 1];
        curParent.insertBefore(currentWord, cursor);
        currentWord.appendChild(cursor);
      } else if (act.type === "char") {
        var span = document.createElement("span");
        span.className = "ai-char";
        span.textContent = act.val;
        if (currentWord) {
          currentWord.insertBefore(span, cursor);
        } else {
          stack[stack.length - 1].insertBefore(span, cursor);
        }
      } else if (act.type === "word-end") {
        var curParent = stack[stack.length - 1];
        curParent.appendChild(cursor);
        currentWord = null;
      } else if (act.type === "space") {
        var curParent = stack[stack.length - 1];
        curParent.insertBefore(document.createTextNode(act.val), cursor);
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      if (timer) { clearTimeout(timer); timer = null; }
      b.removeEventListener("click", finish);
      while (actionIndex < actions.length) {
        applyAction(actions[actionIndex++]);
      }
      if (cursor.parentNode) cursor.remove();
      if (onComplete) onComplete();
    }

    b.addEventListener("click", finish);

    var lastScrollTime = 0;
    function step() {
      if (actionIndex >= actions.length) {
        finish();
        return;
      }

      var charsDone = 0;
      var delay = intervalMs;

      while (actionIndex < actions.length && charsDone < charsPerTick) {
        var act = actions[actionIndex++];
        applyAction(act);
        if (act.type === "char") {
          charsDone++;
          if (act.val === "." || act.val === "!" || act.val === "?") {
            delay = 35;
            break;
          } else if (act.val === "," || act.val === ";" || act.val === ":") {
            delay = 20;
          }
        }
      }

      var now = Date.now();
      if (now - lastScrollTime > 75) {
        var isNearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 160);
        if (isNearBottom) {
          window.scrollTo(0, document.documentElement.scrollHeight);
        }
        lastScrollTime = now;
      }

      timer = setTimeout(step, delay);
    }

    step();
  }

  // instant: render the finished answer at once, with no typing or scrolling (used to replay the thread).
  // then: a second message to send right after this one (its follow-ups replace this one's).
  function addBot(entry, paragraphs, instant, then) {
    var m = el("div", "msg bot");
    m.appendChild(el("img", "avatar")).setAttribute("src", "assets/img/me.webp");
    m.firstChild.alt = "";
    var b = el("div", "bubble", '<span class="dots" aria-label="Typing"><i></i><i></i><i></i></span>');
    m.appendChild(b); thread.appendChild(m);
    if (!instant) scrollDown(true);

    function reply() {
      streamBotChars(b, paragraphs, function () {
        b.appendChild(attachments(entry));
        if (then) { then(); return; }
        var follow = followUps(entry);
        if (follow.length) thread.appendChild(chipButtons(follow, "followups"));
        busy = false;
        send.disabled = !input.value.trim();
        if (!instant) scrollDown(true);
      }, instant);
    }
    if (instant) reply();
    else setTimeout(reply, reduce ? 0 : 300);
  }

  // Three one-tap follow-ups under every answer, so nobody has to type: the answer's own suggestions
  // first, skipping anything already asked, then topped up from the question guide.
  var asked = {};
  function followUps(entry) {
    var list = entry.more ? ["Tell me more"] : []; // the "more" reply itself carries no .more
    function fresh(q) { return q !== entry.q && !asked[q] && list.indexOf(q) === -1; }
    (entry.follow || []).forEach(function (q) { if (fresh(q)) list.push(q); });
    GUIDE.forEach(function (g) { g[1].forEach(function (q) { if (list.length < 3 && fresh(q)) list.push(q); }); });
    // Asked everything already: repeat the answer's own suggestions rather than show nothing.
    (entry.follow || []).forEach(function (q) { if (list.length < 3 && q !== entry.q && list.indexOf(q) === -1) list.push(q); });
    return list.slice(0, 3);
  }

  // The thread is kept for this tab so a visitor who opens a case study can come back to it.
  var LOG_KEY = "portfolio_chat";
  var log = [];
  function saveLog() { try { sessionStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) {} }

  var ready = false, waiting = null; // answers.txt still loading: hold the latest question until it arrives

  function ask(text, instant) {
    text = text.trim();
    if (!text) return;
    if (!ready) { waiting = text; return; }
    if (busy) return;
    busy = true; send.disabled = true; panel.hidden = true; guideBtn.setAttribute("aria-expanded", "false");
    if (intro && !intro.hidden) { intro.hidden = true; document.body.classList.add("chatting"); }
    document.querySelectorAll(".followups").forEach(function (f) { f.remove(); });
    log.push(text); saveLog();
    addUser(text, instant);

    // Enough questions in, own up: it's hardcoded, and the real Leifeng is an email away.
    var reveal = log.length === FOURTH_WALL_AT && FOURTH_WALL.a.length
      ? function () { addBot(FOURTH_WALL, FOURTH_WALL.a, instant); } : null;

    var isMore = /^(tell me more|more|go on|continue|and\??|keep going|elaborate)\b/i.test(text);
    if (isMore && last && last.more) {
      var entry = last; last = null; // so the "Tell me more" chip does not repeat
      addBot({ follow: entry.follow, cards: null, q: entry.q }, entry.more, instant, reveal);
      last = entry; return;
    }
    var hit = match(text) || FALLBACK;
    if (hit.q) asked[hit.q] = true;
    addBot(hit, hit.a, instant, reveal);
    last = hit;
  }

  // ---------- Wire up ----------
  document.getElementById("starters").appendChild(chipButtons(STARTERS));
  GUIDE.forEach(function (g) {
    var sec = el("div");
    sec.appendChild(el("p", "chip-group-label", esc(g[0])));
    sec.appendChild(chipButtons(g[1]));
    panel.querySelector(".guide-groups").appendChild(sec);
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); var t = input.value; input.value = ""; ask(t); });
  input.addEventListener("input", function () { send.disabled = busy || !input.value.trim(); });
  guideBtn.addEventListener("click", function () {
    panel.hidden = !panel.hidden;
    guideBtn.setAttribute("aria-expanded", String(!panel.hidden));
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; guideBtn.setAttribute("aria-expanded", "false"); guideBtn.focus(); } });

  // The thread survives moving around the site (Grid, case studies, back and forth) and is replayed
  // on arrival. Reloading this page starts a fresh chat, and so does closing the tab.
  // Deep link: index.html?q=... asks straight away (used by the "Ask me" buttons on other pages).
  var q = null, saved = [], navType = "";
  try { q = new URLSearchParams(location.search).get("q"); } catch (e) {}
  try { navType = performance.getEntriesByType("navigation")[0].type; } catch (e) {}
  if (navType !== "reload") {
    try { saved = JSON.parse(sessionStorage.getItem(LOG_KEY)) || []; } catch (e) {}
  }
  saveLog();

  function start() {
    ready = true;
    if (saved.length) {
      saved.forEach(function (t) { if (typeof t === "string") ask(t.slice(0, 200), true); });
      // Coming back (back chevron or browser back): where the visitor left off. Otherwise: the latest answer.
      var savedY = null;
      try { savedY = parseInt(sessionStorage.getItem("portfolio_scroll:./"), 10); } catch (e) {}
      if (window.portfolioReturning && savedY > 0 && !q) window.scrollTo({ top: savedY, behavior: "instant" });
      else scrollDown(false);
    }
    if (q) ask(q.slice(0, 200));
    if (waiting) { var t = waiting; waiting = null; ask(t); }
  }

  // The answers are kept for this tab too, so a saved thread is back on the page before its first frame.
  // Arriving from another page slides this one in (style.css, "Page slides"), and the browser cancels the
  // slide if the intro it started with disappears halfway through.
  var ANSWERS = "assets/answers.txt?v=20260929c", ANSWERS_KEY = "portfolio_answers";
  var cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(ANSWERS_KEY)); } catch (e) {}
  if (cached && cached.url === ANSWERS && typeof cached.text === "string") {
    buildKB(parseAnswers(cached.text));
    start();
  } else {
    // Still loading: at least start in the chat layout, so only the thread fills in late.
    if (saved.length && intro) { intro.hidden = true; document.body.classList.add("chatting"); }
    fetch(ANSWERS)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (txt) {
        try { sessionStorage.setItem(ANSWERS_KEY, JSON.stringify({ url: ANSWERS, text: txt })); } catch (e) {}
        buildKB(parseAnswers(txt));
      })
      .catch(function () { FALLBACK.a = ["My answers didn't load, sorry. Try refreshing, or email me and I'll answer myself."]; })
      .then(start);
  }
})();
