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
          sub: "A drag-only MVP testers couldn't figure out, redesigned into a split anyone can finish", theme: "theme-ez" },
    hd: { href: "hedron.html", img: "assets/img/hd/card-back.webp", title: "Hedron³",
          eyebrow: "B2B Workflow & Brand Identity",
          sub: "A logo, business card, and a five-step guided workflow for the startup I co-founded", theme: "theme-hd" },
    wc: { href: "warden-creations.html", img: "assets/img/yt/simple-arsenal.webp", title: "Warden Creations",
          eyebrow: "Game UX & Distribution for 3.6M+ Players",
          sub: "In-game tooltip UX, 17.7% peak CTR thumbnails, and shipping updates to 3.6M+ players", theme: "theme-wc" }
  };

  // ---------- Knowledge base (hand-written answers) ----------
  // keys: [term, weight]. Single words are stemmed before matching; multi-word terms match as phrases.
  var KB = [
    {
      id: "intro", q: "Who are you?",
      keys: [["who are you", 4], ["who", 2], ["yourself", 3], ["about you", 4], ["introduce", 3], ["background", 2], ["leifeng", 2], ["bio", 3]],
      a: ["I'm Leifeng, a third-year Computer Science student at UC Santa Barbara who works where design meets engineering. I design interfaces, icons, and visual systems, and I can build them too.",
          "I started designing for real people as a kid, building Minecraft maps for my best friend. That grew into Minecraft add-ons with **3.6M+ downloads** and a YouTube channel with **64K+ subscribers**. These days I also work on the Daily Nexus's iOS and Android apps and co-founded a startup, Hedron³."],
      follow: ["Show me your best work", "What's your design process?", "Are you looking for an internship?"]
    },
    {
      id: "work", q: "Show me your best work",
      keys: [["work", 2], ["project", 3], ["portfolio", 3], ["case", 3], ["studies", 3], ["study", 2], ["best", 2], ["show", 1], ["examples", 3]],
      a: ["Here are my four case studies. Each one keeps the messy middle in: the mockups, the feedback, and what I changed because of it.",
          "If you only read one section, read the tutorial part of Uncoded Resolve or the tooltip UX in Warden Creations."],
      cards: ["ur", "ez", "hd", "wc"],
      follow: ["What's a design mistake you learned from?", "How do you use feedback?"]
    },
    {
      id: "ur", q: "Tell me about Uncoded Resolve",
      keys: [["uncoded", 6], ["resolve", 4], ["game", 3], ["tactics", 4], ["tactical", 4], ["strategy", 3], ["hud", 4], ["unity", 2], ["icons", 2], ["faction", 3]],
      a: ["Uncoded Resolve is a tactics game where you and the enemy pick your moves at the same time, then watch them play out together. I designed it solo: the game design, HUD, 2D art, icons, logos, and a color system where every side owns one color.",
          "I proved the combat was fun as a text-only terminal program before drawing anything, then took the combat HUD through several rounds of mockups, from bounding boxes to annotated versions. It shipped as a playable gold master for Windows and Mac, with a trailer and press kit."],
      cards: ["ur"],
      more: ["The part I learned the most from was the tutorial. Tips closed only with a small X, nobody noticed it, and players got stuck on the screens meant to help them. Now every tip has a labeled \"SPACE Continue\" button, and the tutorial blocks everything except the action it's teaching.",
             "Credit where it's due: the 3D character models and animations were commissioned from Filbyte under my art direction, and a friend helped build levels 2 and 3."],
      follow: ["What's a design mistake you learned from?", "How did you design the color system?"]
    },
    {
      id: "color", q: "How did you design the color system?",
      keys: [["color", 4], ["colour", 4], ["palette", 5], ["symbol", 4], ["visual language", 5], ["brand", 2]],
      a: ["In Uncoded Resolve, color carries meaning, not decoration. Every side owns a color and it shows up everywhere that side appears: health bars, tiles, icons, and dialogue. **Purple** is the Black Ledger, the player's faction, so most of the UI is purple. **Blue** is robots and AI. **Red** is Marek and **cream** is Evelyn Voss.",
          "The faction symbols follow the same idea. The Black Ledger mark is sharp and full of arrows because they sabotage and command. Aerodyne's is rounded outside to look friendly and rigid inside, because underneath it's still a machine."],
      images: [["assets/img/ur/palette.webp", "Uncoded Resolve color palette"]],
      cards: ["ur"]
    },
    {
      id: "ez", q: "Tell me about Eezy Receipt",
      keys: [["eezy", 6], ["easy receipt", 6], ["receipt", 5], ["split", 4], ["splitting", 4], ["bill", 3], ["mobile", 2], ["app", 1], ["ios", 2]],
      a: ["Eezy Receipt splits a group receipt. You scan it, everyone claims their own items from their phone, and it tracks who has paid. I designed every screen, flow, and the logo for our team of 7, and I was the Scrum Master.",
          "Our first version made you drag items onto people. When we surveyed testers on v2.0.0, **3 of 5 couldn't tell how to assign items**. So I added tap-to-select with a \"Claim N items\" button, and split the app into separate Assign and Edit modes."],
      stats: [["3 of 5", "testers couldn't tell how to assign items"], ["2.8 / 5", "average confidence finishing a split alone"], ["16", "iOS testers on TestFlight"]],
      cards: ["ez"],
      follow: ["How do you handle accessibility?", "How do you use feedback?"]
    },
    {
      id: "hd", q: "Tell me about Hedron³",
      keys: [["hedron", 6], ["hedron3", 6], ["startup", 4], ["founder", 4], ["cofounder", 4], ["company", 2], ["logistics", 4], ["export", 3], ["business card", 5], ["logo", 3]],
      a: ["Hedron³ is the startup I co-founded with one partner. We're building a desktop app that turns a shipment's scanned contracts into export paperwork, with AI-assisted extraction and a required human review step.",
          "I designed the logo, the business card, and the app's workflow: five numbered steps that unlock in order, so nobody has to learn a new tool before they can use it. My co-founder built most of our marketing site, hedron3.com. I cleaned it up, made it look better, and polished its browser-only demo of the workflow."],
      cards: ["hd"],
      more: ["The step I cared most about is human review. Extracted data lands in a workbook where yellow cells need checking, red issues block generation, and amber issues need a look. The AI never sends a document on its own."]
    },
    {
      id: "mistake", q: "What's a design mistake you learned from?",
      keys: [["mistake", 6], ["fail", 5], ["failure", 5], ["wrong", 4], ["learn", 2], ["lesson", 4], ["regret", 4], ["tutorial", 5], ["close", 2]],
      a: ["My favorite one: in Uncoded Resolve's first playable build, the tutorial tips closed only with a small X in the corner. I thought it looked clean. Nobody knew to press it, so players got stuck on the very screens meant to help them.",
          "Now every tip has a labeled \"SPACE Continue\" button, and the tutorial blocks every action except the one it's teaching. My rule since then: never hide a control behind an unlabeled X, and build the tutorial alongside each mechanic, not in the last week.",
          "It's also why this chat shows its starter questions up front instead of hiding them behind a button."],
      pair: [["assets/img/ur/tutorial-before.webp", "Before: the only way out was the small X"], ["assets/img/ur/tutorial-after.webp", "After: a labeled continue button"]],
      cards: ["ur"],
      follow: ["What's a project that flopped?", "What would you do differently?"]
    },
    {
      id: "flop", q: "What's a project that flopped?",
      keys: [["flop", 6], ["flopped", 6], ["trend", 6], ["hype", 6], ["golem", 6], ["copper golem", 8], ["armor trims", 8], ["mob vote", 8], ["underperform", 6]],
      a: ["Two of my Minecraft add-ons. In late 2021, during Mojang's Mob Vote, I rushed out a Copper Golem add-on, and when Mojang announced Armor Trims I rushed out an Armor Trims add-on to ride the news. Both underperformed everything else on the channel, and players uninstalled them quickly.",
          "Chasing a trend meant building for curiosity, not utility. The Copper Golem had about 10 minutes of novel behavior and nothing for survival progression. Fortify and Simple Arsenal worked because they filled a permanent gap in Minecraft's combat. My rule since then: **never build for hype; build deep systems players actually depend on.**"],
      images: [["assets/img/wc/copper-golem.webp", "Copper Golem: built for the Mob Vote hype"]],
      cards: ["wc"],
      follow: ["What's a design mistake you learned from?", "Tell me about Warden Creations"]
    },
    {
      id: "feedback", q: "How do you use feedback?",
      keys: [["feedback", 6], ["research", 5], ["user research", 6], ["users", 2], ["test", 3], ["testing", 4], ["usability", 5], ["survey", 5], ["interview", 3], ["listen", 3]],
      a: ["I haven't run a formal usability study yet, but I've always built feedback into what I make.",
          "For my Minecraft add-ons, my 6,000-member Discord and more than 1,100 YouTube comment replies were my usability lab. A Discord suggestion showed me Fortify had too many late-game sets and not enough early ones. Players confused by the controls (Bedrock add-ons can't add custom keybinds) shaped how I wrote tutorial text and tooltip verbs later.",
          "On Eezy Receipt we surveyed testers on v2.0.0: 3 of 5 couldn't tell how to assign items, and average confidence in finishing a split without help was 2.8 out of 5. That survey is what drove our redesign.",
          "Learning proper research methods from experienced researchers is a big reason I want a UX internship."],
      cards: ["ez", "wc"]
    },
    {
      id: "a11y", q: "How do you handle accessibility?",
      keys: [["accessibility", 6], ["accessible", 6], ["a11y", 6], ["colorblind", 6], ["color blind", 6], ["contrast", 4], ["inclusive", 4], ["dark mode", 4]],
      a: ["A few examples. In Eezy Receipt, money never relies on red and green alone: every amount carries a + or − sign and a plain label like \"You Owe\" or \"You Are Owed,\" so red-green colorblind users read it correctly. Colors are named theme tokens, so light and dark mode stay readable everywhere.",
          "In Uncoded Resolve, status effects show a tooltip on hover, so players never have to memorize what an icon means."],
      images: [["assets/img/ez/finances.webp", "Signed amounts and labels, not just color"]],
      cards: ["ez"]
    },
    {
      id: "process", q: "What's your design process?",
      keys: [["process", 6], ["approach", 5], ["how do you design", 6], ["workflow", 3], ["method", 4], ["start", 2], ["steps", 2]],
      a: ["Roughly five steps:",
          "1. **Prove the core idea as cheaply as possible.** Uncoded Resolve's combat started as a text-only program in the terminal.\n2. **Sketch the whole flow** before any polished screen.\n3. **Mock up, annotate, and iterate.** The combat HUD went from bounding boxes to annotated versions.\n4. **Put it in front of people** and watch where they get stuck.\n5. **Fix the cause, not the symptom.** Testers couldn't find the drag, so we added a visible button instead of a hint."],
      cards: ["ur", "ez"]
    },
    {
      id: "tools", q: "What tools do you use?",
      keys: [["tools", 6], ["tool", 5], ["software", 4], ["figma", 5], ["photoshop", 5], ["skills", 4], ["stack", 3], ["canva", 4], ["blockbench", 4]],
      a: ["**Design:** Figma, Photoshop, Paint.net, Canva.\n**3D and motion:** Blockbench, DaVinci Resolve (10 years of video editing).\n**Front end:** HTML, CSS, JavaScript, TypeScript, React Native.\n**Native and games:** Swift, Kotlin, Unity and C#."]
    },
    {
      id: "code", q: "Can you code?",
      keys: [["code", 5], ["coding", 5], ["engineer", 4], ["engineering", 4], ["developer", 4], ["program", 3], ["programming", 4], ["frontend", 4], ["front end", 4], ["swift", 3], ["kotlin", 3], ["react", 3], ["technical", 3], ["build", 2]],
      a: ["Yes. I'm a CS major with a 4.0 GPA, and I work as a mobile engineer on the Daily Nexus app in Swift and Kotlin. On Eezy Receipt I built the shared React Native component library and the light and dark theming. I also hand-wrote 7,000+ lines of C# for my puzzle game, Cable Conundrum.",
          "So when I design something, I usually know what it will cost to build, which makes me a useful partner for engineers."]
    },
    {
      id: "ai", q: "How do you use AI?",
      keys: [["ai", 5], ["artificial", 4], ["claude", 5], ["agent", 4], ["agents", 4], ["llm", 5], ["chatgpt", 5], ["generated", 4], ["copilot", 4]],
      a: ["I use AI coding agents like Claude Code a lot, as tools I direct. For Uncoded Resolve I wrote the specifications and architecture, and agents wrote the code, gated by 300+ automated tests.",
          "I'm careful to say what AI made. The game's character concept art was AI-generated, so it isn't in this portfolio, and the Hostile Analysis card was hand-edited over an AI reference image. This site's code was written with Claude Code too."],
      follow: ["Is this chat an AI?"]
    },
    {
      id: "bot", q: "Is this chat an AI?",
      keys: [["this chat", 6], ["chatbot", 6], ["bot", 5], ["are you real", 6], ["are you ai", 6], ["how does this work", 6], ["gpt", 4], ["real person", 5]],
      a: ["Not quite. I wrote every answer here myself, and the page matches your question to the closest one. It runs entirely in your browser, so nothing you type is sent anywhere, and it can't make up facts about me.",
          "The idea of a portfolio you can talk to comes from Studio Nikita by Nikita Rochiramani. Her site is worth a look."],
      links: [["Studio Nikita", "https://www.studio-nikita.com/"]]
    },
    {
      id: "visual", q: "Show me your visual design",
      keys: [["visual", 5], ["graphic", 5], ["thumbnail", 6], ["thumbnails", 6], ["illustration", 4], ["art", 3], ["aesthetic", 4], ["style", 2], ["ctr", 5], ["click", 3], ["unbreakable", 6]],
      a: ["Most of my visual work lives in two places: game UI and YouTube thumbnails.",
          "For my Minecraft add-on videos I designed every thumbnail: one readable title and the add-on's items front and center. Across six videos they drew **8.9% to 17.7% click-through on 1.67M impressions**. The best, Unbreakable Armor, hit 17.7%."],
      images: [["assets/img/yt/unbreakable-armor.webp", "Unbreakable Armor: 17.7% click-through on 96K impressions"]],
      links: [["See all thumbnails", "warden-creations.html#visual"], ["Warden Creations case study", "warden-creations.html"]],
      cards: ["ur", "wc"]
    },
    {
      id: "audience", q: "Tell me about your YouTube and Minecraft work",
      keys: [["youtube", 6], ["minecraft", 6], ["addon", 5], ["add-on", 5], ["addons", 5], ["mods", 4], ["mod", 4], ["channel", 4], ["subscribers", 5], ["downloads", 5], ["community", 4], ["discord", 5], ["creator", 4]],
      a: ["Most of my design instincts come from here. In 2017 my best friend Devin Leung and I started building custom Minecraft challenge maps and co-editing videos of our playthroughs. In June 2021 I switched to Minecraft Bedrock add-ons under the name Warden Creations.",
          "The channel has **64.7K subscribers** and 1.7M views, and my add-ons have **3.6M+ downloads**. I ran a 6,000-member Discord, replied to more than 1,100 comments, and kept a running list of player suggestions that shaped every update. That's where I learned to design for people who will never read the manual."],
      stats: [["64.7K", "YouTube subscribers"], ["3.6M+", "add-on downloads"], ["6,000+", "Discord members"]],
      cards: ["wc"],
      links: [["Case study", "warden-creations.html"], ["YouTube channel", "https://www.youtube.com/@warden-creations"]]
    },
    {
      id: "wc", q: "Tell me about Warden Creations",
      keys: [["warden", 6], ["creations", 6], ["warden creations", 8], ["minecraft add-on", 6], ["simple arsenal", 6], ["fortify", 6]],
      a: ["Warden Creations is the Minecraft add-on studio and channel I ran from 2021 to 2025. Across 11 add-ons it reached **3.6M+ downloads**, **64.7K subscribers**, and a 6,000-member Discord.",
          "The core UX challenge was in-game readability: instead of forcing players to keep an external wiki open, I built a custom tooltip system with Unicode glyph icons so weapon stats, cooldowns, and rarity tiers were readable right inside the inventory."],
      stats: [["3.6M+", "downloads across 11 add-ons"], ["64.7K", "YouTube subscribers"], ["17.7%", "peak thumbnail CTR"]],
      cards: ["wc"],
      more: ["It started with Minecraft Fortify, an overhaul of Minecraft's stale armor and weapon progression that became my breakout project. Simple Arsenal pushed combat further with modular weapons and custom crafting benches. When it dropped, CurseForge downloads jumped from a 200-a-day baseline to **39,267 in 2 days**.",
             "Running 11 live add-ons plus videos was like running a live-service game studio alone, so as my UCSB studies picked up I wound down add-on work in 2025 and moved that energy into software and product: the Daily Nexus apps, Uncoded Resolve, Eezy Receipt, and Hedron³."],
      follow: ["How did you design the in-game tooltips?", "What's a project that flopped?", "Show me your visual design"]
    },
    {
      id: "tooltips", q: "How did you design the in-game tooltips?",
      keys: [["tooltip", 6], ["wiki", 6], ["glyph", 6], ["inventory", 4], ["readability", 5], ["readable", 4], ["ingame", 3], ["badge", 4], ["rarity", 5]],
      a: ["Minecraft Bedrock's item tooltips only show a name and durability, but my weapons had windups, cooldowns, area attacks, and status effects like poison and stun. Players shouldn't have to alt-tab to a wiki to learn what a sword does.",
          "So I overrode Minecraft's font sheet with custom Unicode private-use glyphs, which let me put 16×16 pixel-art icons for damage, windup, cooldown, and effects straight into the item description, next to color-coded rarity tiers. In play sessions, players stopped asking \"what does this weapon do?\" and started asking which weapon counters which mob."],
      images: [["assets/img/wc/rarity-colors.webp", "Rarity colors: Common, Rare, Epic, and Legendary"]],
      links: [["Watch the Tooltips Update", "https://youtu.be/jPPaBNTnGYE"]],
      cards: ["wc"]
    },
    {
      id: "motion", q: "Do you do motion design?",
      keys: [["motion", 6], ["video", 5], ["animation", 5], ["animate", 4], ["trailer", 6], ["davinci", 5], ["editing", 4], ["edit", 3]],
      a: ["Yes. I have 10 years of video editing experience, including 5.5+ years in DaVinci Resolve with Fusion and Fairlight. It started with co-editing Minecraft videos with my best friend in 2017, and I cut the Uncoded Resolve trailer myself.",
          "In the game itself, getting simultaneous actions to feel responsive took about 40 animation variants."],
      links: [["Watch the trailer", "https://youtu.be/35AqF1ij6UQ"]]
    },
    {
      id: "team", q: "How do you work with a team?",
      keys: [["team", 5], ["teamwork", 6], ["collaborate", 6], ["collaboration", 6], ["lead", 4], ["leadership", 6], ["scrum", 5], ["agile", 5], ["manage", 3], ["engineers", 3], ["pm", 3]],
      a: ["On Eezy Receipt I was the Scrum Master for a team of 7: I ran three sprints of planning, standups, and retros, owned the Kanban board, and was also the top contributor to the code. At Hedron³ it's just me and my co-founder, so we split everything.",
          "Being an engineer myself helps. I can talk through tradeoffs with developers, and I annotate mockups so the intent survives the handoff."],
      cards: ["ez"]
    },
    {
      id: "differently", q: "What would you do differently?",
      keys: [["differently", 6], ["weakness", 6], ["weaknesses", 6], ["improve", 4], ["growth", 4], ["hindsight", 5], ["change", 2]],
      a: ["Four things I've changed:",
          "1. **Onboarding is core product work.** I left Uncoded Resolve's tutorial and sound for the last two weeks, and both suffered.\n2. **Test discoverability before building the interaction.** A five-minute test with a sketch would have caught Eezy Receipt's drag problem weeks earlier.\n3. **Take one big risk per project.** I spent three weeks on a reinforcement-learning enemy AI when a simpler one would have left time for playtesting.\n4. **Build for utility, not hype.** My rushed trend add-ons (Copper Golem, Armor Trims) flopped, while the deep combat systems became my biggest hits."],
      follow: ["What's a project that flopped?"]
    },
    {
      id: "why", q: "Why UX design?",
      keys: [["why ux", 6], ["why design", 6], ["why", 2], ["motivation", 5], ["passion", 4], ["interested", 3], ["inspire", 3]],
      a: ["The part I've always liked most is watching someone use a thing I made without needing help. I started by designing Minecraft maps around what would surprise my best friend next, and later I read over a thousand comments about my add-ons.",
          "I'm an engineer too, but I want to get better at the part that comes before the code: understanding people."]
    },
    {
      id: "internship", q: "Are you looking for an internship?",
      keys: [["internship", 6], ["intern", 6], ["hire", 5], ["hiring", 5], ["available", 5], ["availability", 5], ["summer", 4], ["job", 4], ["relocate", 5], ["sponsorship", 5], ["visa", 5], ["citizen", 4], ["graduate", 4], ["graduation", 4]],
      a: ["Yes! I'm looking for **Summer 2027** internships in UX design and UX engineering.",
          "I'm available full time from June 14 to September 17, 2027, happy to relocate, and I'm a U.S. citizen, so no sponsorship is needed. I expect to graduate from UCSB in 2028."],
      follow: ["How can I contact you?"]
    },
    {
      id: "contact", q: "How can I contact you?",
      keys: [["contact", 6], ["email", 6], ["reach", 5], ["linkedin", 5], ["github", 5], ["resume", 5], ["cv", 5], ["talk", 3], ["connect", 4]],
      a: ["The best way is email: **leifengchen123@gmail.com**. You can also find me on LinkedIn and GitHub."],
      links: [["Email me", "mailto:leifengchen123@gmail.com"], ["LinkedIn", "https://www.linkedin.com/in/leifengchen"], ["GitHub", "https://github.com/Redstoneweewee"]]
    },
    {
      id: "school", q: "Where do you go to school?",
      keys: [["school", 5], ["university", 5], ["college", 5], ["ucsb", 5], ["gpa", 5], ["degree", 5], ["major", 4], ["classes", 4], ["courses", 4], ["education", 5]],
      a: ["I'm a third-year Computer Science student at UC Santa Barbara with a 4.0 GPA and Dean's Honors every eligible quarter. Uncoded Resolve started in a 10-week game development course, and Eezy Receipt came out of our software engineering project course."]
    },
    {
      id: "hello", q: "Hi!",
      keys: [["hi", 4], ["hello", 5], ["hey", 5], ["yo", 3], ["sup", 3], ["morning", 3], ["afternoon", 3]],
      a: ["Hi! Thanks for stopping by. Ask me about my case studies, my process, or the mistakes I learned from."],
      follow: ["Show me your best work", "Who are you?"]
    },
    {
      id: "thanks", q: "Thanks!",
      keys: [["thanks", 5], ["thank", 5], ["thx", 5], ["cool", 2], ["awesome", 2], ["nice", 2], ["great", 2], ["bye", 4]],
      a: ["Thanks for reading! If you'd like to talk, my email is leifengchen123@gmail.com."],
      links: [["Email me", "mailto:leifengchen123@gmail.com"]]
    },
    {
      id: "weather", q: "What's the weather like?",
      keys: [["weather", 8], ["rain", 5], ["sunny", 5], ["temperature", 5], ["forecast", 6]],
      a: ["I can't check the weather, but it's probably sunny in Santa Barbara. Anything I can tell you about my work instead?"],
      follow: ["Show me your best work"]
    }
  ];

  var GUIDE = [
    ["Case studies", ["Show me your best work", "Tell me about Uncoded Resolve", "Tell me about Eezy Receipt", "Tell me about Hedron³", "Tell me about Warden Creations", "Show me your visual design"]],
    ["How I work", ["What's your design process?", "What's a design mistake you learned from?", "What's a project that flopped?", "How do you use feedback?", "How do you handle accessibility?", "How do you use AI?"]],
    ["About me", ["Who are you?", "Can you code?", "Tell me about your YouTube and Minecraft work", "Are you looking for an internship?", "How can I contact you?"]]
  ];
  var STARTERS = ["Show me your best work", "What's a design mistake you learned from?", "How do you use feedback?", "Are you looking for an internship?"];

  var FALLBACK = {
    id: "fallback",
    a: ["I don't have an answer written for that one. I only know about my own work, and I'd rather say nothing than guess. Try one of these, or email me and I'll answer myself."],
    follow: ["Show me your best work", "What's your design process?", "How can I contact you?"],
    links: [["Email me", "mailto:leifengchen123@gmail.com"]]
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

  // Pre-stem single-word keys once.
  KB.forEach(function (e) {
    e._keys = e.keys.map(function (k) {
      var phrase = k[0].indexOf(" ") > -1;
      return { phrase: phrase, term: phrase ? " " + k[0] + " " : stem(k[0].replace(/-/g, "")), w: k[1] };
    });
  });

  function match(text) {
    var n = norm(text);
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
  function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
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
    if (entry.cards) {
      var c = el("div", "attach cards");
      entry.cards.forEach(function (id) {
        var k = CASES[id];
        var eyebrowHtml = k.eyebrow ? '<p class="eyebrow">' + esc(k.eyebrow) + '</p>' : '';
        var a = el("a", "mini-card " + k.theme, '<img src="' + k.img + '" alt="" loading="lazy"><span>' + eyebrowHtml + '<b>' + esc(k.title) + "</b><small>" + esc(k.sub) + "</small><em>View case study →</em></span>");
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
      behavior: (reduce || !smooth) ? "auto" : "smooth"
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
        actions.push({ type: "open", tag: tag, className: n.className });
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
  function addBot(entry, paragraphs, instant) {
    var m = el("div", "msg bot");
    m.appendChild(el("img", "avatar")).setAttribute("src", "assets/img/me.webp");
    m.firstChild.alt = "";
    var b = el("div", "bubble", '<span class="dots" aria-label="Typing"><i></i><i></i><i></i></span>');
    m.appendChild(b); thread.appendChild(m);
    if (!instant) scrollDown(true);

    function reply() {
      streamBotChars(b, paragraphs, function () {
        b.appendChild(attachments(entry));
        var follow = (entry.more && last !== entry) ? ["Tell me more"] : [];
        follow = follow.concat((entry.follow || []).filter(function (q) { return q !== entry.q; }));
        if (follow.length) thread.appendChild(chipButtons(follow.slice(0, 3), "followups"));
        busy = false;
        send.disabled = !input.value.trim();
        if (!instant) scrollDown(true);
      }, instant);
    }
    if (instant) reply();
    else setTimeout(reply, reduce ? 0 : 300);
  }

  // The thread is kept for this tab so a visitor who opens a case study can come back to it.
  var LOG_KEY = "portfolio_chat";
  var log = [];
  function saveLog() { try { sessionStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) {} }

  function ask(text, instant) {
    text = text.trim();
    if (!text || busy) return;
    busy = true; send.disabled = true; panel.hidden = true; guideBtn.setAttribute("aria-expanded", "false");
    if (intro && !intro.hidden) { intro.hidden = true; document.body.classList.add("chatting"); }
    document.querySelectorAll(".followups").forEach(function (f) { f.remove(); });
    log.push(text); saveLog();
    addUser(text, instant);

    var isMore = /^(tell me more|more|go on|continue|and\??|keep going|elaborate)\b/i.test(text);
    if (isMore && last && last.more) {
      var entry = last; last = null; // so the "Tell me more" chip does not repeat
      addBot({ follow: entry.follow, cards: null, q: entry.q }, entry.more, instant);
      last = entry; return;
    }
    var hit = match(text) || FALLBACK;
    addBot(hit, hit.a, instant);
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

  // Deep link: index.html?q=... asks straight away (used by the "Ask me" buttons on other pages).
  // Otherwise, a visitor coming back (back chevron, browser back, reload) gets their thread replayed as it was.
  var q = null, saved = [];
  try { q = new URLSearchParams(location.search).get("q"); } catch (e) {}
  if (!q && window.portfolioReturning) {
    try { saved = JSON.parse(sessionStorage.getItem(LOG_KEY)) || []; } catch (e) {}
  }
  saveLog();
  if (q) ask(q.slice(0, 200));
  else if (saved.length) {
    saved.forEach(function (t) { if (typeof t === "string") ask(t.slice(0, 200), true); });
    // site.js restores the saved scroll position on load; without one, land on the latest answer.
    var savedY = null;
    try { savedY = sessionStorage.getItem("portfolio_scroll:./"); } catch (e) {}
    if (!(parseInt(savedY, 10) > 0)) scrollDown(false);
  }
})();
