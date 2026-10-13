/* ==========================================================
   PortfolioOS: gestor de ventanas, barra de tareas, menú Inicio,
   escritorio, pantalla de bloqueo y ajustes
   ========================================================== */
(function () {
  "use strict";

  const PF = window.PF;
  const { P, DATA, el, icon, glyph, norm } = PF;
  const APPS = PF.apps;

  const root = document.documentElement;
  const $ = (sel) => document.querySelector(sel);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tabletMQ = window.matchMedia("(max-width: 700px)");
  const isTablet = () => tabletMQ.matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const DESKTOP_APPS = ["about", "projects", "experience", "skills", "courses", "contact", "cv", "terminal", "settings"];
  const PINNED = ["about", "projects", "terminal", "contact", "cv"];
  const MIN_W = 340;
  const MIN_H = 240;

  /* ---------- Almacenamiento (puede fallar en modo privado) ---------- */
  function load(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* sin persistencia */ }
  }

  /* ==========================================================
     Ajustes (fondo, modo claro/oscuro y color de énfasis)
     ========================================================== */
  const WALLPAPERS = { bloom: "Bloom", aurora: "Aurora", atardecer: "Atardecer", nebulosa: "Nebulosa", grafito: "Grafito" };
  const ACCENTS = ["#0078d4", "#0099bc", "#00b294", "#10893e", "#ca5010", "#e81123", "#c239b3", "#8764b8"];
  const lightMQ = window.matchMedia("(prefers-color-scheme: light)");

  const settings = {
    mode: ["light", "dark", "system"].includes(load("pf-mode")) ? load("pf-mode") : "system",
    wallpaper: WALLPAPERS[load("pf-wallpaper")] ? load("pf-wallpaper") : "bloom",
    accent: load("pf-accent") || ACCENTS[0],
  };

  function resolvedMode() {
    return settings.mode === "system" ? (lightMQ.matches ? "light" : "dark") : settings.mode;
  }

  function applySettings() {
    const mode = resolvedMode();
    root.dataset.mode = mode;
    root.style.colorScheme = mode;
    root.dataset.wallpaper = settings.wallpaper;
    root.style.setProperty("--os-accent", settings.accent);
    $("#mode-btn").replaceChildren(glyph(mode === "dark" ? "moon" : "sun"));
    $("#mode-btn").title = mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    document.dispatchEvent(new CustomEvent("pf:settings"));
  }

  function setSetting(key, value) {
    settings[key] = value;
    save(`pf-${key}`, value);
    applySettings();
  }

  function toggleMode() {
    setSetting("mode", resolvedMode() === "dark" ? "light" : "dark");
  }

  lightMQ.addEventListener("change", () => { if (settings.mode === "system") applySettings(); });

  /* ==========================================================
     Ventanas
     ========================================================== */
  const layer = $("#windows");
  const tpl = $("#window-tpl");
  const snapPreview = $("#snap-preview");
  const wins = new Map(); // id -> estado de la ventana
  let z = 10;
  let activeId = null;
  let cascade = 0;

  function area() {
    return { w: layer.clientWidth, h: layer.clientHeight };
  }

  function applyRect(s) {
    const st = s.node.style;
    st.left = `${s.rect.x}px`;
    st.top = `${s.rect.y}px`;
    st.width = `${s.rect.w}px`;
    st.height = `${s.rect.h}px`;
  }

  // Mantiene la ventana dentro del área visible
  function clampRect(s) {
    const { w: aw, h: ah } = area();
    const r = s.rect;
    r.w = Math.min(Math.max(r.w, Math.min(MIN_W, aw)), aw);
    r.h = Math.min(Math.max(r.h, Math.min(MIN_H, ah)), ah);
    r.x = Math.min(Math.max(r.x, 120 - r.w), aw - 120);
    r.y = Math.min(Math.max(r.y, 0), ah - 40);
  }

  function animateGeometry(s) {
    if (reducedMotion) return;
    s.node.classList.add("animating");
    clearTimeout(s.animTimer);
    s.animTimer = setTimeout(() => s.node.classList.remove("animating"), 260);
  }

  // mode: null (normal) | "max" | "left" | "right"
  function setMode(s, mode, animate) {
    if (animate) animateGeometry(s);
    s.mode = mode;
    s.node.classList.toggle("max", mode === "max");
    s.node.classList.toggle("snap-l", mode === "left");
    s.node.classList.toggle("snap-r", mode === "right");
    const maxBtn = s.node.querySelector('[data-action="maximize"]');
    maxBtn.classList.toggle("restore", mode === "max");
    maxBtn.setAttribute("aria-label", mode === "max" ? "Restaurar" : "Maximizar");
    maxBtn.title = maxBtn.getAttribute("aria-label");
  }

  function makeCtx(s) {
    return {
      open,
      close: () => close(s.id),
      setTitle: (text) => { s.node.querySelector(".win-title").textContent = text; },
      isActive: () => activeId === s.id && !s.minimized,
    };
  }

  function open(id, args) {
    const app = APPS[id];
    if (!app) return;
    closeStart();
    closeCtx();
    const existing = wins.get(id);
    if (existing) {
      if (existing.minimized) setMinimized(existing, false);
      focus(id);
      if (args && existing.api.navigate) existing.api.navigate(args);
      return;
    }

    const node = tpl.content.firstElementChild.cloneNode(true);
    const s = { id, app, node, rect: null, mode: null, minimized: false, api: {} };
    node.dataset.app = id;
    node.setAttribute("aria-label", app.title);
    node.querySelector(".win-icon").append(icon(app.icon));
    node.querySelector(".win-title").textContent = app.title;

    const { w: aw, h: ah } = area();
    const w = Math.min(app.size[0], aw - 32);
    const h = Math.min(app.size[1], ah - 32);
    const off = (cascade++ % 6) * 26 - 52;
    s.rect = { x: Math.round((aw - w) / 2 + off), y: Math.round(Math.max(12, (ah - h) / 2 + off)), w, h };
    s.rect.y = Math.min(s.rect.y, Math.max(0, ah - h));
    clampRect(s);
    applyRect(s);
    wireWindow(s);

    wins.set(id, s);
    layer.append(node);
    s.api = app.render(node.querySelector(".win-body"), makeCtx(s), args) || {};

    if (!reducedMotion) {
      node.classList.add("opening");
      node.addEventListener("animationend", () => node.classList.remove("opening"), { once: true });
    }
    focus(id);
    renderTaskbar();
  }

  function close(id) {
    const s = wins.get(id);
    if (!s) return;
    wins.delete(id);
    if (s.api.destroy) s.api.destroy();
    const remove = () => s.node.remove();
    if (reducedMotion) remove();
    else {
      s.node.classList.add("closing");
      s.node.addEventListener("animationend", remove, { once: true });
      setTimeout(remove, 400);
    }
    if (activeId === id) {
      activeId = null;
      focusTop();
    }
    renderTaskbar();
    updateHash();
  }

  function focus(id) {
    const s = wins.get(id);
    if (!s) return;
    if (activeId !== id) {
      s.node.style.zIndex = ++z;
      activeId = id;
      wins.forEach((w) => w.node.classList.toggle("active", w === s));
      renderTaskbar();
      updateHash();
    }
    if (!s.node.contains(document.activeElement)) {
      if (s.api.focus) s.api.focus();
      else s.node.focus({ preventScroll: true });
    }
  }

  // Enfoca la ventana visible más alta (o ninguna)
  function focusTop() {
    let top = null;
    wins.forEach((s) => {
      if (!s.minimized && (!top || +s.node.style.zIndex > +top.node.style.zIndex)) top = s;
    });
    if (top) focus(top.id);
    else {
      activeId = null;
      wins.forEach((w) => w.node.classList.remove("active"));
      renderTaskbar();
      updateHash();
    }
  }

  function setMinimized(s, value) {
    s.minimized = value;
    s.node.classList.toggle("minimized", value);
    if (value && activeId === s.id) {
      activeId = null;
      s.node.classList.remove("active");
      focusTop();
    }
    renderTaskbar();
  }

  function closeAll() {
    [...wins.keys()].forEach(close);
  }

  function showDesktop() {
    const visible = [...wins.values()].filter((s) => !s.minimized);
    if (visible.length) visible.forEach((s) => setMinimized(s, true));
    else wins.forEach((s) => setMinimized(s, false));
    focusTop();
  }

  /* ---------- Arrastrar, redimensionar y acoplar ---------- */
  function snapAt(px, py, aw) {
    if (py <= 2) return "max";
    if (px <= 4) return "left";
    if (px >= aw - 5) return "right";
    return null;
  }

  function showSnap(mode) {
    snapPreview.className = "snap-preview" + (mode ? ` show ${mode}` : "");
  }

  function startDrag(s, e) {
    if (e.button !== 0 || isTablet() || e.target.closest("button")) return;
    e.preventDefault();
    const bar = e.currentTarget;
    bar.setPointerCapture(e.pointerId);
    const L = layer.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    let { x, y } = s.rect;
    let moved = false;
    let snap = null;

    const move = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved) {
        if (Math.abs(dx) + Math.abs(dy) < 4) return;
        moved = true;
        layer.classList.add("interacting");
        if (s.mode) {
          // Restaura el tamaño normal manteniendo el puntero en el mismo punto relativo de la barra
          const r = s.node.getBoundingClientRect();
          const ratio = (startX - r.left) / r.width;
          setMode(s, null);
          x = startX - L.left - s.rect.w * ratio;
          y = startY - L.top - 16;
        }
      }
      const { w: aw, h: ah } = area();
      s.rect.x = Math.min(Math.max(x + dx, 120 - s.rect.w), aw - 120);
      s.rect.y = Math.min(Math.max(y + dy, 0), ah - 40);
      applyRect(s);
      snap = snapAt(ev.clientX - L.left, ev.clientY - L.top, aw);
      showSnap(snap);
    };

    const up = () => {
      bar.removeEventListener("pointermove", move);
      bar.removeEventListener("pointerup", up);
      bar.removeEventListener("pointercancel", up);
      layer.classList.remove("interacting");
      showSnap(null);
      if (snap) setMode(s, snap, true);
    };

    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
    bar.addEventListener("pointercancel", up);
  }

  function startResize(s, e) {
    if (e.button !== 0 || isTablet()) return;
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    const dir = handle.dataset.dir;
    if (s.mode) {
      // Si estaba maximizada o acoplada, parte de su tamaño actual
      const r = s.node.getBoundingClientRect();
      const L = layer.getBoundingClientRect();
      s.rect = { x: r.left - L.left, y: r.top - L.top, w: r.width, h: r.height };
      setMode(s, null);
      applyRect(s);
    }
    handle.setPointerCapture(e.pointerId);
    layer.classList.add("interacting");
    const start = { ...s.rect };
    const sx = e.clientX;
    const sy = e.clientY;

    const move = (ev) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      const { w: aw, h: ah } = area();
      const r = { ...start };
      if (dir.includes("e")) r.w = Math.min(Math.max(MIN_W, start.w + dx), aw - start.x);
      if (dir.includes("s")) r.h = Math.min(Math.max(MIN_H, start.h + dy), ah - start.y);
      if (dir.includes("w")) {
        r.w = Math.max(MIN_W, start.w - dx);
        r.x = start.x + start.w - r.w;
      }
      if (dir.includes("n")) {
        r.h = Math.max(MIN_H, start.h - dy);
        r.y = start.y + start.h - r.h;
        if (r.y < 0) { r.h += r.y; r.y = 0; }
      }
      s.rect = r;
      applyRect(s);
    };

    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      layer.classList.remove("interacting");
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  }

  function wireWindow(s) {
    const { node } = s;
    const bar = node.querySelector(".win-titlebar");

    node.addEventListener("pointerdown", () => { if (activeId !== s.id) focus(s.id); }, true);
    node.addEventListener("focusin", () => { if (activeId !== s.id) focus(s.id); });
    bar.addEventListener("pointerdown", (e) => startDrag(s, e));
    bar.addEventListener("dblclick", (e) => {
      if (e.target.closest("button") || isTablet()) return;
      setMode(s, s.mode === "max" ? null : "max", true);
    });
    node.querySelectorAll(".rz").forEach((h) => h.addEventListener("pointerdown", (e) => startResize(s, e)));

    node.querySelector(".win-back").addEventListener("click", () => close(s.id));
    node.querySelector('[data-action="minimize"]').addEventListener("click", () => setMinimized(s, true));
    node.querySelector('[data-action="maximize"]').addEventListener("click", () => setMode(s, s.mode === "max" ? null : "max", true));
    node.querySelector('[data-action="close"]').addEventListener("click", () => close(s.id));
  }

  // Al cambiar el tamaño de la página, las ventanas siguen siendo alcanzables
  window.addEventListener("resize", () => {
    wins.forEach((s) => { clampRect(s); applyRect(s); });
    closeCtx();
  });

  /* ==========================================================
     Barra de tareas
     ========================================================== */
  const taskApps = $("#task-apps");
  const taskButtons = new Map();

  function taskButton(id) {
    const b = el("button", "task-btn");
    b.type = "button";
    b.title = APPS[id].label || APPS[id].title;
    b.setAttribute("aria-label", b.title);
    b.append(icon(APPS[id].icon), el("span", "task-ind"));
    b.addEventListener("click", () => {
      const s = wins.get(id);
      if (!s) open(id);
      else if (s.minimized) { setMinimized(s, false); focus(id); }
      else if (activeId === id) setMinimized(s, true);
      else focus(id);
    });
    b.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const s = wins.get(id);
      const r = b.getBoundingClientRect();
      openCtx(r.left, r.top - 8, [
        { label: s ? "Mostrar" : "Abrir", glyph: "open", run: () => open(id) },
        s && { label: "Cerrar ventana", glyph: "power", run: () => close(id) },
      ], true);
    });
    return b;
  }

  function renderTaskbar() {
    const ids = PINNED.concat([...wins.keys()].filter((id) => !PINNED.includes(id)));
    taskButtons.forEach((b, id) => {
      if (!ids.includes(id)) { b.remove(); taskButtons.delete(id); }
    });
    ids.forEach((id) => {
      let b = taskButtons.get(id);
      if (!b) {
        b = taskButton(id);
        taskButtons.set(id, b);
        taskApps.append(b);
      }
      const s = wins.get(id);
      b.classList.toggle("running", !!s);
      b.classList.toggle("active", id === activeId);
      b.setAttribute("aria-pressed", String(id === activeId));
    });
  }

  /* ---------- Reloj ---------- */
  function tick() {
    const now = new Date();
    const time = now.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    $("#clock-time").textContent = time;
    $("#clock-date").textContent = now.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" });
    $("#lock-time").textContent = time;
    const date = now.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
    $("#lock-date").textContent = date.charAt(0).toUpperCase() + date.slice(1);
  }

  /* ==========================================================
     Menú Inicio
     ========================================================== */
  const start = $("#start");
  const startBtn = $("#start-btn");
  const startInput = $("#start-input");
  const startHome = $("#start-home");
  const startResults = $("#start-results");
  let results = [];
  let resultSel = 0;

  function startItem(cls, ico, title, sub, run) {
    const b = el("button", cls);
    b.type = "button";
    const text = el("span", "rec-text");
    text.append(el("span", "rec-title", title));
    if (sub) text.append(el("span", "rec-sub", sub));
    b.append(ico, text);
    b.addEventListener("click", run);
    return b;
  }

  function buildStart() {
    const pinned = $("#start-pinned");
    DESKTOP_APPS.forEach((id) => {
      const b = el("button", "start-app");
      b.type = "button";
      b.append(icon(APPS[id].icon), el("span", null, APPS[id].label || APPS[id].title));
      b.addEventListener("click", () => open(id));
      pinned.append(b);
    });

    const recs = $("#start-recs");
    DATA.projects.forEach((proj, i) => {
      if (!proj.demo) return;
      recs.append(startItem("rec", icon("globe"), proj.name, "Proyecto · demo online", () => open("projects", { project: i })));
    });
    recs.append(startItem("rec", icon("pdf"), APPS.cv.title, "Documento PDF", () => open("cv")));

    PF.fillAvatar($("#start-avatar"));
    $("#start-name").textContent = P.name;
  }

  // Coincidencia difusa: las letras de la búsqueda aparecen en orden
  function fuzzy(query, text) {
    let i = 0;
    for (const ch of text) {
      if (ch === query[i]) i++;
      if (i === query.length) return true;
    }
    return query.length === 0;
  }

  function searchEntries(raw) {
    const list = [];
    Object.entries(APPS).forEach(([id, app]) => list.push({ title: app.label || app.title, sub: "Aplicación", ico: app.icon, keys: id, run: () => open(id) }));
    DATA.projects.forEach((proj, i) => list.push({ title: proj.name, sub: "Proyecto", ico: "folder", keys: (proj.stack || []).join(" "), run: () => open("projects", { project: i }) }));
    list.push({ title: "Modo oscuro", sub: "Configuración", ico: "gear", keys: "tema dark", run: () => setSetting("mode", "dark") });
    list.push({ title: "Modo claro", sub: "Configuración", ico: "gear", keys: "tema light", run: () => setSetting("mode", "light") });
    Object.entries(WALLPAPERS).forEach(([key, label]) => list.push({ title: `Fondo ${label}`, sub: "Configuración", ico: "gear", keys: "wallpaper", run: () => setSetting("wallpaper", key) }));
    const q = norm(raw);
    const found = list
      .filter((e) => fuzzy(q, norm(`${e.title} ${e.keys}`)))
      .sort((a, b) => norm(b.title).startsWith(q) - norm(a.title).startsWith(q));
    found.push({ title: `Ejecutar «${raw}» en la Terminal`, sub: "Comando", ico: "terminal", keys: "", run: () => open("terminal", { run: raw }) });
    return found;
  }

  function renderResults() {
    const raw = startInput.value.trim();
    startHome.hidden = !!raw;
    startResults.hidden = !raw;
    if (!raw) return;
    results = searchEntries(raw);
    resultSel = 0;
    startResults.replaceChildren(...results.map((r, i) => {
      const b = startItem("rec result", icon(r.ico), r.title, r.sub, () => { closeStart(); r.run(); });
      b.setAttribute("role", "option");
      b.addEventListener("mousemove", () => { if (resultSel !== i) { resultSel = i; highlight(); } });
      return b;
    }));
    highlight();
  }

  function highlight() {
    [...startResults.children].forEach((n, i) => {
      n.classList.toggle("sel", i === resultSel);
      n.setAttribute("aria-selected", String(i === resultSel));
    });
    const sel = startResults.children[resultSel];
    if (sel) sel.scrollIntoView({ block: "nearest" });
  }

  function openStart() {
    if (root.dataset.state !== "desktop") return;
    closeCtx();
    start.hidden = false;
    startBtn.classList.add("active");
    startBtn.setAttribute("aria-expanded", "true");
    startInput.value = "";
    renderResults();
    startInput.focus();
  }

  function closeStart() {
    if (start.hidden) return;
    start.hidden = true;
    startBtn.classList.remove("active");
    startBtn.setAttribute("aria-expanded", "false");
  }

  function toggleStart() {
    if (start.hidden) openStart(); else closeStart();
  }

  startInput.addEventListener("input", renderResults);
  startInput.addEventListener("keydown", (e) => {
    if (startResults.hidden) return;
    if (e.key === "ArrowDown") { e.preventDefault(); resultSel = (resultSel + 1) % results.length; highlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); resultSel = (resultSel - 1 + results.length) % results.length; highlight(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[resultSel];
      closeStart();
      if (r) r.run();
    }
  });
  startBtn.addEventListener("click", toggleStart);
  $("#search-btn").addEventListener("click", toggleStart);
  $("#start-power").addEventListener("click", () => shutdown());
  $("#start-user").addEventListener("click", () => lock());

  /* ==========================================================
     Menú contextual
     ========================================================== */
  const ctx = $("#ctx");

  // `above`: el menú se abre hacia arriba desde (x, y)
  function openCtx(x, y, items, above) {
    closeStart();
    ctx.replaceChildren();
    items.filter(Boolean).forEach((item) => {
      if (item === "sep") { ctx.append(el("div", "ctx-sep")); return; }
      const b = el("button", "ctx-item");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.append(glyph(item.glyph), el("span", null, item.label));
      b.addEventListener("click", () => { closeCtx(); item.run(); });
      ctx.append(b);
    });
    ctx.hidden = false;
    const w = ctx.offsetWidth;
    const h = ctx.offsetHeight;
    const top = above ? y - h : y;
    ctx.style.left = `${Math.max(4, Math.min(x, innerWidth - w - 4))}px`;
    ctx.style.top = `${Math.max(4, Math.min(top, innerHeight - h - 4))}px`;
    ctx.querySelector(".ctx-item").focus();
  }

  function closeCtx() {
    ctx.hidden = true;
  }

  ctx.addEventListener("keydown", (e) => {
    const items = [...ctx.querySelectorAll(".ctx-item")];
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });

  /* ==========================================================
     Escritorio
     ========================================================== */
  const desktop = $("#desktop");
  const desktopIcons = $("#desktop-icons");
  let lastPointer = "mouse";

  function renderDesktop() {
    desktopIcons.replaceChildren(...DESKTOP_APPS.map((id) => {
      const li = el("li");
      const b = el("button", "dicon");
      b.type = "button";
      b.dataset.app = id;
      b.append(icon(APPS[id].icon), el("span", "dicon-label", APPS[id].label || APPS[id].title));
      li.append(b);
      return li;
    }));
  }

  function selectIcon(b) {
    desktopIcons.querySelectorAll(".dicon.sel").forEach((n) => n.classList.remove("sel"));
    if (b) b.classList.add("sel");
  }

  desktop.addEventListener("pointerdown", (e) => {
    lastPointer = e.pointerType;
    if (!e.target.closest(".dicon, .widget")) selectIcon(null);
  });

  desktopIcons.addEventListener("click", (e) => {
    const b = e.target.closest(".dicon");
    if (!b) return;
    selectIcon(b);
    // Un toque (o Enter con el teclado) abre directamente
    if (lastPointer === "touch" || isTablet() || e.detail === 0) open(b.dataset.app);
  });
  desktopIcons.addEventListener("dblclick", (e) => {
    const b = e.target.closest(".dicon");
    if (b) open(b.dataset.app);
  });

  desktop.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const b = e.target.closest(".dicon");
    if (b) {
      selectIcon(b);
      openCtx(e.clientX, e.clientY, [{ label: "Abrir", glyph: "open", run: () => open(b.dataset.app) }]);
      return;
    }
    const dark = resolvedMode() === "dark";
    openCtx(e.clientX, e.clientY, [
      { label: "Actualizar", glyph: "refresh", run: refreshDesktop },
      "sep",
      { label: "Abrir en Terminal", glyph: "prompt", run: () => open("terminal") },
      { label: "Personalizar", glyph: "brush", run: () => open("settings") },
      { label: dark ? "Modo claro" : "Modo oscuro", glyph: dark ? "sun" : "moon", run: toggleMode },
    ]);
  });

  function refreshDesktop() {
    desktopIcons.classList.remove("refresh");
    void desktopIcons.offsetWidth; // reinicia la animación
    desktopIcons.classList.add("refresh");
  }

  // Tarjeta de presentación sobre el escritorio
  function renderWidget() {
    const w = $("#widget");
    const head = el("div", "widget-head");
    const who = el("div");
    who.append(el("p", "widget-hello", `Hola, soy ${P.name.split(" ")[0]}`), el("p", "widget-role", P.role));
    head.append(PF.avatar("avatar-lg"), who);
    const bio = el("p", "widget-bio", PF.paragraphs(P.bio)[0] || "");
    const actions = el("div", "card-links");
    actions.append(
      PF.button("Ver proyectos", () => open("projects"), "btn-primary"),
      PF.button("Sobre mí", () => open("about")),
      PF.button("Contacto", () => open("contact"))
    );
    w.append(head, bio, actions);
  }

  /* ==========================================================
     Arranque y pantalla de bloqueo
     ========================================================== */
  const lockEl = $("#lock");
  let bootTimer = null;

  function setState(state) {
    root.dataset.state = state;
  }

  function boot() {
    closeStart();
    closeCtx();
    setState("boot");
    clearTimeout(bootTimer);
    bootTimer = setTimeout(showLock, reducedMotion ? 400 : 2200);
  }

  function showLock() {
    closeStart();
    closeCtx();
    lockEl.classList.remove("login", "welcome");
    $("#login-btn").disabled = false;
    setState("lock");
    lockEl.focus({ preventScroll: true });
  }

  function showLogin() {
    if (lockEl.classList.contains("login")) return;
    lockEl.classList.add("login");
    setTimeout(() => $("#login-btn").focus({ preventScroll: true }), 50);
  }

  function login() {
    $("#login-btn").disabled = true;
    lockEl.classList.add("welcome");
    setTimeout(enterDesktop, reducedMotion ? 200 : 1100);
  }

  function enterDesktop() {
    setState("desktop");
    save("pf-os-booted", "1");
    focusTop();
  }

  function lock() {
    showLock();
  }

  function shutdown() {
    closeAll();
    boot();
  }

  lockEl.addEventListener("click", (e) => { if (!e.target.closest(".lock-login")) showLogin(); });
  lockEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lockEl.classList.contains("welcome")) { lockEl.classList.remove("login"); lockEl.focus(); return; }
    if (!lockEl.classList.contains("login") && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); showLogin(); }
  });
  // Deslizar hacia arriba también desbloquea
  let swipeY = null;
  lockEl.addEventListener("pointerdown", (e) => { swipeY = e.clientY; });
  lockEl.addEventListener("pointerup", (e) => { if (swipeY != null && swipeY - e.clientY > 60) showLogin(); swipeY = null; });
  $("#login-btn").addEventListener("click", login);

  /* ==========================================================
     Enlaces, atajos y URL
     ========================================================== */
  // Refleja la ventana activa en la URL para poder compartir enlaces (#projects)
  function updateHash() {
    try {
      window.history.replaceState(null, "", activeId ? `#${activeId}` : location.pathname + location.search);
    } catch (_) { /* file:// puede fallar */ }
  }

  // Los enlaces a PDF se abren en el visor (salvo descargas o Ctrl/⌘+clic)
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (a.hasAttribute("download") || a.dataset.external != null) return;
    if (/\.pdf($|[?#])/i.test(a.getAttribute("href"))) {
      e.preventDefault();
      open("cv");
    }
  });

  // Cierra menús al pulsar fuera
  document.addEventListener("pointerdown", (e) => {
    if (!ctx.hidden && !ctx.contains(e.target)) closeCtx();
    if (!start.hidden && !start.contains(e.target) && !e.target.closest("#start-btn, #search-btn")) closeStart();
  });

  let metaAlone = false;
  document.addEventListener("keydown", (e) => {
    metaAlone = e.key === "Meta" && !isMac;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      toggleStart();
    } else if (e.key === "Escape") {
      if (!ctx.hidden) closeCtx();
      else if (!start.hidden) { closeStart(); if (activeId) focus(activeId); }
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Meta" && metaAlone) toggleStart();
    metaAlone = false;
  });

  $("#mode-btn").addEventListener("click", toggleMode);
  $("#show-desktop").addEventListener("click", showDesktop);

  /* ==========================================================
     Inicio
     ========================================================== */
  PF.os = { open, close, focus, settings, setSetting, toggleMode, shutdown, lock, WALLPAPERS, ACCENTS };

  document.title = `${P.name} — PortfolioOS`;
  PF.fillAvatar($("#lock-avatar"));
  $("#lock-name").textContent = P.name;
  applySettings();
  renderDesktop();
  renderWidget();
  buildStart();
  renderTaskbar();
  tick();
  setInterval(tick, 10000);

  // #projects, #contact… abre esa ventana directamente (sin arranque)
  const hashId = PF.resolveApp(decodeURIComponent(location.hash.slice(1)));
  if (hashId) {
    enterDesktop();
    open(hashId);
  } else if (load("pf-os-booted")) {
    enterDesktop();
  } else {
    boot();
  }
})();
