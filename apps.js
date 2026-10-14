/* ==========================================================
   Apps del escritorio: iconos, registro y contenido de cada ventana
   ========================================================== */
(function () {
  "use strict";

  const PF = window.PF;
  const { DATA, P, el, link, btnLink, heading, render, projectCard, paragraphs } = PF;

  /* ---------- Iconos de app (colores planos, estilo Fluent) ---------- */
  const ICONS = {
    user: `<rect x="4" y="6" width="40" height="36" rx="6" fill="#3a96dd"/><circle cx="24" cy="20" r="7" fill="#fff"/><path d="M11 38c1.5-7 7-10 13-10s11.5 3 13 10z" fill="#fff"/>`,
    folder: `<path d="M4 12a4 4 0 0 1 4-4h11l5 5h16a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#e8a317"/><path d="M4 18a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#ffc83d"/>`,
    briefcase: `<rect x="17" y="7" width="14" height="10" rx="3" fill="none" stroke="#8a5a2b" stroke-width="3"/><rect x="4" y="14" width="40" height="28" rx="5" fill="#c47c3b"/><rect x="4" y="14" width="40" height="13" rx="5" fill="#dd9450"/><rect x="21" y="23" width="6" height="7" rx="1.5" fill="#ffe0b8"/>`,
    chart: `<rect x="4" y="4" width="40" height="40" rx="8" fill="#107c41"/><rect x="11" y="26" width="6" height="11" rx="1.5" fill="#fff"/><rect x="21" y="18" width="6" height="19" rx="1.5" fill="#fff"/><rect x="31" y="11" width="6" height="26" rx="1.5" fill="#9fe7b8"/>`,
    cap: `<path d="M24 8 2 19l22 11 22-11z" fill="#8764b8"/><path d="M12 25v9c0 3 5.5 6 12 6s12-3 12-6v-9l-12 6z" fill="#6b4ea0"/><path d="M42 20v12" stroke="#c3a8ec" stroke-width="2.5" stroke-linecap="round"/><circle cx="42" cy="33" r="2.5" fill="#c3a8ec"/>`,
    mail: `<rect x="4" y="10" width="40" height="30" rx="5" fill="#0f6cbd"/><path d="m7 14 17 12 17-12" fill="none" stroke="#cfe4fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    terminal: `<rect x="4" y="7" width="40" height="34" rx="6" fill="#2b2b2b"/><rect x="4.75" y="7.75" width="38.5" height="32.5" rx="5.25" fill="none" stroke="#555" stroke-width="1.5"/><path d="m12 18 7 6-7 6" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 31h12" stroke="#e6e6e6" stroke-width="3" stroke-linecap="round"/>`,
    gear: `<circle cx="24" cy="24" r="15" fill="none" stroke="#6e6e6e" stroke-width="7" stroke-dasharray="5.89 5.89"/><circle cx="24" cy="24" r="13" fill="#8f8f8f"/><circle cx="24" cy="24" r="5.5" fill="#e8e8e8"/>`,
    pdf: `<path d="M11 4h19l11 11v26a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="#f3f3f3"/><path d="M30 4v8a3 3 0 0 0 3 3h8z" fill="#c8c8c8"/><rect x="4" y="24" width="29" height="13" rx="2.5" fill="#d13438"/><text x="18.5" y="33.6" font-size="8.5" font-weight="700" text-anchor="middle" fill="#fff" font-family="Segoe UI, Arial, sans-serif">PDF</text>`,
    globe: `<circle cx="24" cy="24" r="19" fill="#0f6cbd"/><path d="M5 24h38M24 5c6.5 6 6.5 32 0 38M24 5c-6.5 6-6.5 32 0 38M8 14h32M8 34h32" fill="none" stroke="#9fd0ff" stroke-width="2.2"/>`,
    gamepad: `<path d="M14 13h20c6 0 10 5 11 12l1 7c.6 4.5-4.3 7.2-7.6 4.1L33 31H15l-5.4 5.1C6.3 39.2 1.4 36.5 2 32l1-7c1-7 5-12 11-12z" fill="#5c5cc8"/><path d="M14 19v8m-4-4h8" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="20.5" r="2.4" fill="#ffd166"/><circle cx="37" cy="25.5" r="2.4" fill="#ef6f6c"/>`,
    snake: `<rect x="4" y="4" width="40" height="40" rx="8" fill="#16302a"/><path d="M12 34V22a5 5 0 0 1 5-5h9a5 5 0 0 0 5-5v0" fill="none" stroke="#4ade80" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="31" cy="12" r="4.2" fill="#86efac"/><circle cx="35" cy="33" r="4" fill="#f25b5b"/>`,
    mine: `<rect x="4" y="4" width="40" height="40" rx="8" fill="#c8ccd2"/><rect x="4" y="4" width="40" height="40" rx="8" fill="none" stroke="#9aa0a8" stroke-width="2"/><path d="M24 10v28M10 24h28M14 14l20 20M34 14 14 34" stroke="#222" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="24" r="9" fill="#222"/><circle cx="21" cy="21" r="2.6" fill="#fff"/>`,
  };

  function icon(name) {
    const span = el("span", "ico");
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = `<svg viewBox="0 0 48 48">${ICONS[name] || ICONS.folder}</svg>`;
    return span;
  }

  /* ---------- Iconos de interfaz (monocromo) ---------- */
  const GLYPHS = {
    search: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>`,
    back: `<path d="M20 12H5m6-6-6 6 6 6"/>`,
    up: `<path d="M12 20V5m-6 6 6-6 6 6"/>`,
    chevron: `<path d="m9 6 6 6-6 6"/>`,
    power: `<path d="M12 3v8"/><path d="M6.6 6.6a8 8 0 1 0 10.8 0"/>`,
    sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
    moon: `<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>`,
    wifi: `<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>`,
    volume: `<path d="M4 9h3l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>`,
    battery: `<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 10.5v3"/><rect x="4.5" y="9.5" width="11" height="5" rx="1" fill="currentColor" stroke="none"/>`,
    external: `<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>`,
    download: `<path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/>`,
    refresh: `<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>`,
    brush: `<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1.1.2-2.2 1.4-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>`,
    prompt: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m5 0h5"/>`,
    lock: `<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
    pin: `<path d="M12 21s-7-6.3-7-11.5a7 7 0 0 1 14 0C19 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>`,
    open: `<path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>`,
  };

  function glyph(name, cls) {
    const span = el("span", "glyph" + (cls ? " " + cls : ""));
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[name]}</svg>`;
    return span;
  }

  // Botón con el aspecto de los botones del SO
  function button(label, onClick, cls) {
    const b = el("button", "btn" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function content(body, nodes, cls) {
    const c = el("div", "app-content" + (cls ? " " + cls : ""));
    c.append(...nodes);
    body.append(c);
    return c;
  }

  // Detecta pantallas táctiles pequeñas (donde un clic abre directamente)
  const compact = () => window.matchMedia("(max-width: 700px)").matches;

  /* ==========================================================
     Sobre mí
     ========================================================== */
  function aboutApp(body, os) {
    const hero = el("section", "about-hero");
    const info = el("div", "about-info");
    const loc = el("p", "about-loc");
    loc.append(glyph("pin"), P.location);
    info.append(el("h1", "about-name", P.name), el("p", "about-role", P.role), loc);
    const links = el("div", "card-links");
    links.append(btnLink("✉ Escríbeme", `mailto:${P.email}`, true));
    P.links.forEach((l) => links.append(btnLink(l.label, l.url)));
    info.append(links);
    hero.append(PF.avatar("avatar-xl"), info);

    const bio = el("section", "about-bio");
    paragraphs(P.bio).forEach((p) => bio.append(el("p", "para", p)));

    const techs = new Set();
    DATA.skills.forEach((g) => g.items.forEach((s) => techs.add(s.name)));
    const stats = el("section", "about-stats");
    [
      [DATA.projects.length, "proyectos", "projects"],
      [techs.size, "tecnologías", "skills"],
      [DATA.courses.length, "cursos", "courses"],
    ].forEach(([n, label, target]) => {
      const b = el("button", "stat");
      b.type = "button";
      b.append(el("span", "stat-n", String(n)), el("span", "stat-l", label));
      b.addEventListener("click", () => os.open(target));
      stats.append(b);
    });

    content(body, [hero, stats, bio]);
  }

  /* ==========================================================
     Explorador de proyectos
     ========================================================== */
  function explorerApp(body, os, args) {
    const root = el("div", "explorer");
    root.innerHTML = `
      <div class="ex-bar">
        <button type="button" class="ex-nav" data-nav="back" aria-label="Atrás"></button>
        <button type="button" class="ex-nav" data-nav="up" aria-label="Subir un nivel"></button>
        <nav class="ex-address" aria-label="Ruta"></nav>
        <label class="ex-search"><input type="search" placeholder="Buscar en Proyectos" aria-label="Buscar en Proyectos" /></label>
      </div>
      <div class="ex-main">
        <nav class="ex-side" aria-label="Acceso rápido"></nav>
        <div class="ex-view"></div>
      </div>
      <div class="ex-status"></div>`;
    body.append(root);

    const $ = (s) => root.querySelector(s);
    const view = $(".ex-view");
    const address = $(".ex-address");
    const status = $(".ex-status");
    const search = $(".ex-search input");
    const backBtn = $('[data-nav="back"]');
    const upBtn = $('[data-nav="up"]');
    backBtn.append(glyph("back"));
    upBtn.append(glyph("up"));
    $(".ex-search").prepend(glyph("search"));

    let current = null; // índice del proyecto abierto o null
    const history = [];

    // Panel lateral: accesos a las demás secciones
    const side = $(".ex-side");
    [["projects", "Proyectos"], ["about", "Sobre mí"], ["experience", "Experiencia"], ["skills", "Habilidades"], ["courses", "Cursos"], ["contact", "Contacto"], ["cv", "CV"], ["games", "Juegos"]].forEach(([id, label]) => {
      const b = el("button", id === "projects" ? "current" : null);
      b.type = "button";
      b.append(icon(PF.apps[id].icon), el("span", null, label));
      b.addEventListener("click", () => (id === "projects" ? go(null) : os.open(id)));
      side.append(b);
    });

    function crumb(label, onClick) {
      const b = el("button", "ex-crumb", label);
      b.type = "button";
      b.addEventListener("click", onClick);
      return b;
    }

    function renderAddress() {
      const parts = [icon("folder"), crumb("Este equipo", () => go(null)), glyph("chevron", "ex-sep"), crumb("Proyectos", () => go(null))];
      if (current != null) parts.push(glyph("chevron", "ex-sep"), crumb(DATA.projects[current].name, () => {}));
      address.replaceChildren(...parts);
      backBtn.disabled = !history.length;
      upBtn.disabled = current == null;
    }

    function matches(proj, q) {
      if (!q) return true;
      const text = [proj.name, ...paragraphs(proj.description), ...(proj.stack || [])].join(" ").toLowerCase();
      return text.includes(q);
    }

    function renderGrid() {
      const q = search.value.trim().toLowerCase();
      const grid = el("div", "ex-grid");
      grid.setAttribute("role", "listbox");
      grid.setAttribute("aria-label", "Proyectos");
      let count = 0;
      DATA.projects.forEach((proj, i) => {
        if (!matches(proj, q)) return;
        count++;
        const item = el("button", "ex-item");
        item.type = "button";
        item.setAttribute("role", "option");
        item.append(icon("folder"), el("span", "ex-name", proj.name));
        item.append(el("span", "ex-badge", proj.demo ? "demo online" : proj.link ? "código" : "privado"));
        item.addEventListener("click", (e) => {
          grid.querySelectorAll(".sel").forEach((n) => n.classList.remove("sel"));
          item.classList.add("sel");
          status.textContent = `${count} elementos · 1 seleccionado`;
          if (compact() || e.detail === 0) go(i); // toque en móvil o Enter con el teclado
        });
        item.addEventListener("dblclick", () => go(i));
        grid.append(item);
      });
      if (!count) grid.append(el("p", "ex-empty", "Ningún elemento coincide con la búsqueda."));
      view.replaceChildren(grid);
      status.textContent = `${count} elemento${count === 1 ? "" : "s"}`;
    }

    function renderDetail() {
      const proj = DATA.projects[current];
      const c = el("div", "app-content ex-detail");
      c.append(projectCard(proj, current));
      view.replaceChildren(c);
      status.textContent = `${proj.name} · ${(proj.stack || []).length} tecnologías`;
    }

    function go(index, fromHistory) {
      if (index === current) return;
      if (!fromHistory) history.push(current);
      current = index;
      os.setTitle(index == null ? "Proyectos" : `${DATA.projects[index].name} — Proyectos`);
      renderAddress();
      if (index == null) renderGrid(); else renderDetail();
      view.scrollTop = 0;
    }

    backBtn.addEventListener("click", () => { if (history.length) go(history.pop(), true); });
    upBtn.addEventListener("click", () => go(null));
    search.addEventListener("input", () => { if (current != null) go(null); else renderGrid(); });

    renderAddress();
    renderGrid();
    if (args && args.project != null) go(args.project);

    return { navigate: (a) => { if (a && a.project != null) go(a.project); } };
  }

  /* ==========================================================
     Configuración
     ========================================================== */
  function settingsApp(body) {
    const os = PF.os;
    const page = el("div", "app-content settings");

    function card(title, desc, control) {
      const c = el("section", "set-card");
      const head = el("div", "set-head");
      const text = el("div", "set-text");
      text.append(el("h3", "set-label", title));
      if (desc) text.append(el("p", "set-desc", desc));
      head.append(text);
      c.append(head);
      if (control) c.append(control);
      return c;
    }

    function option(cls, value, label, onClick) {
      const b = el("button", cls);
      b.type = "button";
      b.dataset.value = value;
      b.setAttribute("aria-pressed", "false");
      if (label) b.setAttribute("aria-label", label);
      b.addEventListener("click", onClick);
      return b;
    }

    // Fondo
    const wpGrid = el("div", "wp-grid");
    Object.entries(os.WALLPAPERS).forEach(([key, label]) => {
      const b = option(`wp-thumb wp-${key}`, key, `Fondo ${label}`, () => os.setSetting("wallpaper", key));
      b.dataset.group = "wallpaper";
      b.append(el("span", "wp-name", label));
      wpGrid.append(b);
    });

    // Modo
    const modes = el("div", "segmented");
    [["light", "Claro", "sun"], ["dark", "Oscuro", "moon"], ["system", "Sistema", "prompt"]].forEach(([key, label, g]) => {
      const b = option("seg-opt", key, null, () => os.setSetting("mode", key));
      b.dataset.group = "mode";
      b.append(glyph(g), el("span", null, label));
      modes.append(b);
    });

    // Color de énfasis
    const swatches = el("div", "swatches");
    os.ACCENTS.forEach((color) => {
      const b = option("swatch", color, `Color ${color}`, () => os.setSetting("accent", color));
      b.dataset.group = "accent";
      b.style.setProperty("--c", color);
      swatches.append(b);
    });

    // Tema de la terminal
    const themes = el("div", "chips");
    Object.entries(PF.terminalThemes).forEach(([key, label]) => {
      const b = option("chip", key, null, () => PF.setTerminalTheme(key));
      b.dataset.group = "term";
      b.textContent = label;
      themes.append(b);
    });

    // Acerca de
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? "Microsoft Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador";
    const about = el("dl", "set-rows");
    [
      ["Nombre del dispositivo", `${P.handle || "guest"}-portfolio`],
      ["Propietario", P.name],
      ["Sistema", "PortfolioOS 11 · versión 2.0"],
      ["Navegador", browser],
      ["Pantalla", `${screen.width} × ${screen.height}`],
    ].forEach(([k, v]) => about.append(el("dt", null, k), el("dd", null, v)));

    page.append(
      el("h1", "set-title", "Personalización"),
      card("Fondo", "Se usa en el escritorio y en la pantalla de bloqueo.", wpGrid),
      card("Modo de color", "Elige claro, oscuro o el que use tu sistema.", modes),
      card("Color de énfasis", "Botones, selección y detalles de la interfaz.", swatches),
      card("Tema de la Terminal", "También puedes cambiarlo con el comando theme.", themes),
      el("h2", "set-subtitle", "Acerca de"),
      card("Especificaciones", null, about)
    );
    body.append(page);

    function sync() {
      const values = {
        wallpaper: os.settings.wallpaper,
        mode: os.settings.mode,
        accent: os.settings.accent,
        term: PF.getTerminalTheme(),
      };
      page.querySelectorAll("[data-group]").forEach((b) => {
        const on = values[b.dataset.group] === b.dataset.value;
        b.classList.toggle("selected", on);
        b.setAttribute("aria-pressed", String(on));
      });
    }
    sync();
    document.addEventListener("pf:settings", sync);
    document.addEventListener("pf:term-theme", sync);

    return {
      destroy() {
        document.removeEventListener("pf:settings", sync);
        document.removeEventListener("pf:term-theme", sync);
      },
    };
  }

  /* ==========================================================
     Visor de PDF (CV)
     ========================================================== */
  const CV_FILE = decodeURIComponent((PF.cvUrl.split(/[?#]/)[0].split("/").pop() || "CV.pdf"));

  function cvApp(body) {
    const root = el("div", "pdf");
    const bar = el("div", "pdf-bar");
    const name = el("span", "pdf-name");
    name.append(icon("pdf"), el("span", null, CV_FILE));
    const openTab = link("", PF.cvUrl, "btn");
    openTab.dataset.external = "";
    openTab.append(glyph("external"), " Abrir en pestaña");
    const download = link("", PF.cvUrl, "btn btn-primary");
    download.setAttribute("download", CV_FILE);
    download.append(glyph("download"), " Descargar");
    bar.append(name, el("span", "pdf-spacer"), openTab, download);
    root.append(bar);

    // Los navegadores móviles no suelen mostrar PDF dentro de un iframe
    if (window.matchMedia("(max-width: 700px), (pointer: coarse)").matches) {
      const fallback = el("div", "pdf-fallback");
      fallback.append(icon("pdf"), el("p", null, "Tu navegador no puede mostrar el PDF aquí."), el("p", "muted", "Ábrelo en una pestaña nueva o descárgalo con los botones de arriba."));
      root.append(fallback);
    } else {
      const frame = el("iframe");
      frame.src = PF.cvUrl;
      frame.title = `CV de ${P.name}`;
      root.append(frame);
    }
    body.append(root);
  }

  /* ==========================================================
     Registro de apps
     ========================================================== */
  const section = (key) => (body) => { content(body, render[key]()); };

  PF.apps = {
    about: { title: "Sobre mí", icon: "user", size: [760, 600], render: aboutApp },
    projects: { title: "Proyectos", icon: "folder", size: [900, 620], render: explorerApp },
    experience: { title: "Experiencia", icon: "briefcase", size: [760, 620], render: section("experience") },
    skills: { title: "Habilidades", icon: "chart", size: [700, 640], render: section("skills") },
    courses: { title: "Cursos", icon: "cap", size: [720, 580], render: section("courses") },
    contact: { title: "Contacto", icon: "mail", size: [620, 460], render: section("contact") },
    cv: { title: CV_FILE, label: "CV.pdf", icon: "pdf", size: [860, 760], render: cvApp },
    terminal: { title: "Terminal", icon: "terminal", size: [880, 580], render: (body, os, args) => PF.mountTerminal(body, os, args) },
    settings: { title: "Configuración", icon: "gear", size: [820, 680], render: settingsApp },
  };

  const APP_ALIASES = {
    sobremi: "about", whoami: "about", yo: "about",
    proyectos: "projects", explorador: "projects", explorer: "projects",
    experiencia: "experience", trabajo: "experience",
    habilidades: "skills",
    cursos: "courses", formacion: "courses",
    contacto: "contact", email: "contact",
    curriculum: "cv", pdf: "cv",
    cmd: "terminal", bash: "terminal", shell: "terminal", consola: "terminal",
    ajustes: "settings", configuracion: "settings", config: "settings",
    juegos: "games", juego: "games",
    serpiente: "snake",
    buscaminas: "minesweeper", minas: "minesweeper", mines: "minesweeper",
  };

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\s_-]+/g, "");

  PF.resolveApp = (name) => {
    if (!name) return null;
    const n = norm(name);
    if (PF.apps[n]) return n;
    if (APP_ALIASES[n]) return APP_ALIASES[n];
    return Object.keys(PF.apps).find((id) => norm(PF.apps[id].title) === n) || null;
  };

  PF.icon = icon;
  PF.glyph = glyph;
  PF.button = button;
  PF.norm = norm;
})();
