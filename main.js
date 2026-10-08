/* ==========================================================
   Motor de la terminal
   ========================================================== */
(function () {
  "use strict";

  const DATA = window.PORTFOLIO;
  const P = DATA.profile;
  const HANDLE = P.handle || "guest";
  const HOST = `${HANDLE}@portfolio`;

  const $ = (sel) => document.querySelector(sel);
  const root = document.documentElement;
  const win = $("#window");
  const output = $("#output");
  const screen = $("#screen");
  const input = $("#cmd-input");
  const form = $("#prompt-form");
  const promptLabel = $("#prompt-label");
  const before = $("#typed-before");
  const cursorEl = $("#cursor");
  const after = $("#typed-after");
  const ghostEl = $("#ghost");
  const tabs = document.querySelectorAll(".tabs [data-cmd]");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const PALETTE_KEY = isMac ? "⌘K" : "Ctrl K";

  const cmdHistory = [];
  let historyIndex = 0;
  let busy = false;
  let skip = false;
  let pending = null;
  let cwd = "~";

  // Sección -> directorio que se muestra en el prompt
  const SECTIONS = {
    about: "sobre-mi",
    projects: "proyectos",
    experience: "experiencia",
    skills: "habilidades",
    courses: "cursos",
    contact: "contacto",
  };

  const THEMES = {
    verde: "Verde (por defecto)",
    ambar: "Ámbar",
    dracula: "Dracula",
    claro: "Claro",
    retro: "Retro CRT",
  };
  const THEME_ALIASES = { green: "verde", amber: "ambar", "ámbar": "ambar", light: "claro", crt: "retro" };

  const BANNER = String.raw`
 ____   ___  ____ _____  _    _____ ___  _     ___ ___
|  _ \ / _ \|  _ \_   _|/ \  |  ___/ _ \| |   |_ _/ _ \
| |_) | | | | |_) || | / _ \ | |_ | | | | |    | | | | |
|  __/| |_| |  _ < | |/ ___ \|  _|| |_| | |___ | | |_| |
|_|    \___/|_| \_\|_/_/   \_\_|   \___/|_____|___\___/
`.replace(/^\n/, "");

  /* ---------- Almacenamiento (puede fallar en modo privado) ---------- */
  function load(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* sin persistencia */ }
  }

  /* ---------- Utilidades de DOM ---------- */
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function line(text, cls) {
    return el("p", "line" + (cls ? " " + cls : ""), text);
  }

  // Construye una línea a partir de partes: strings, nodos o {text, cls, href}
  function rich(parts, cls) {
    const p = el("p", "line" + (cls ? " " + cls : ""));
    parts.forEach((part) => {
      if (part == null) return;
      if (typeof part === "string") p.appendChild(document.createTextNode(part));
      else if (part instanceof Node) p.appendChild(part);
      else if (part.href) p.appendChild(link(part.text, part.href));
      else p.appendChild(el("span", part.cls, part.text));
    });
    return p;
  }

  function link(text, href, cls) {
    const a = el("a", cls, text);
    a.href = href;
    if (/^https?:/.test(href)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    return a;
  }

  function btnLink(text, href, primary) {
    return link(text, href, "btn" + (primary ? " btn-primary" : ""));
  }

  function gap() {
    return el("div", "gap");
  }

  function heading(text) {
    return el("h2", "heading", text);
  }

  function kv(key, value) {
    const row = el("div", "kv-row");
    const val = el("span", "kv-val");
    val.append(value);
    row.append(el("span", "kv-key", key), val);
    return row;
  }

  function cmdButton(cmd) {
    const b = el("button", null, cmd);
    b.type = "button";
    b.addEventListener("click", () => run(cmd));
    return b;
  }

  function cmdButtonInline(cmd, label) {
    const b = cmdButton(cmd);
    b.className = "inline-cmd";
    if (label) b.textContent = label;
    return b;
  }

  // Tono estable por tecnología para colorear las etiquetas
  function hue(text) {
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  const paragraphs = (value) => [].concat(value || []);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function scrollToBottom() {
    screen.scrollTop = screen.scrollHeight;
  }

  // Imprime nodos uno a uno con una pequeña animación escalonada
  async function print(nodes, delay = 28) {
    for (const node of [].concat(nodes)) {
      if (!reducedMotion && node.classList) node.classList.add("reveal");
      output.appendChild(node);
      scrollToBottom();
      if (!skip && !reducedMotion && delay > 0) await sleep(delay);
    }
  }

  // Tipea texto carácter a carácter (solo para mensajes cortos)
  async function typeLine(text, cls, speed = 14) {
    const p = line("", cls);
    output.appendChild(p);
    if (skip || reducedMotion) {
      p.textContent = text;
    } else {
      for (const ch of text) {
        p.textContent += ch;
        scrollToBottom();
        if (skip) { p.textContent = text; break; }
        await sleep(speed);
      }
    }
    scrollToBottom();
  }

  function setBusy(value) {
    busy = value;
    form.classList.toggle("busy", value);
    if (value) return;
    skip = false;
    if (palette.hidden) input.focus({ preventScroll: true });
    scrollToBottom();
    if (pending) {
      const cmd = pending;
      pending = null;
      setTimeout(() => submit(cmd));
    }
  }

  // Ejecuta un comando en cuanto la terminal quede libre (acelera la animación en curso)
  function run(cmd) {
    if (!busy) return submit(cmd);
    skip = true;
    pending = cmd;
  }

  /* ---------- Prompt ---------- */
  function promptNode() {
    const p = el("span", "prompt");
    p.append(
      el("span", "seg seg-user", HANDLE),
      el("span", "seg seg-dir", cwd),
      el("span", "seg seg-git", "⎇ main"),
      el("span", "chev", "❯")
    );
    return p;
  }

  function renderPrompt() {
    promptLabel.replaceChildren(...promptNode().childNodes);
  }

  function setSection(key) {
    cwd = SECTIONS[key] ? `~/${SECTIONS[key]}` : "~";
    renderPrompt();
    tabs.forEach((t) => {
      const active = t.dataset.cmd === key;
      t.classList.toggle("active", active);
      if (active) {
        t.setAttribute("aria-current", "page");
        t.scrollIntoView({ block: "nearest", inline: "nearest" });
      } else t.removeAttribute("aria-current");
    });
    $("#sb-mode").textContent = SECTIONS[key] ? SECTIONS[key].replace("-", " ") : "inicio";
    $("#titlebar-text").textContent = `${HOST}: ${cwd}`;
  }

  /* ---------- Temas ---------- */
  function currentTheme() {
    return THEMES[root.dataset.theme] ? root.dataset.theme : "verde";
  }

  function resolveTheme(name) {
    const n = name.toLowerCase();
    return THEMES[n] ? n : THEME_ALIASES[n];
  }

  function applyTheme(name) {
    root.dataset.theme = name;
    save("pf-theme", name);
    $("#sb-theme").textContent = name;
  }

  /* ---------- Render de secciones ---------- */
  function renderBanner() {
    return [
      el("pre", "pre banner", BANNER),
      rich([{ text: P.name, cls: "strong" }, { text: "  ·  ", cls: "muted" }, { text: P.role, cls: "accent" }]),
    ];
  }

  function renderAbout() {
    const nodes = [heading("Sobre mí")];
    nodes.push(kv("nombre", P.name), kv("rol", P.role), kv("ubicación", P.location), gap());
    paragraphs(P.bio).forEach((para) => nodes.push(line(para, "para"), gap()));
    nodes.push(rich([{ text: "Tip: ", cls: "muted" }, "escribe ", cmdButtonInline("projects"), " o ", cmdButtonInline("contact"), "."]));
    return nodes;
  }

  function renderProjects() {
    const nodes = [heading("Proyectos"), line(`${DATA.projects.length} proyectos · los que tienen demo se pueden probar online`, "muted")];
    DATA.projects.forEach((proj, i) => {
      const card = el("article", "card");

      const head = el("div", "card-head");
      head.append(el("span", "card-idx", String(i + 1).padStart(2, "0")), el("h3", "card-title", proj.name));
      card.append(head);

      const body = el("div", "card-body");
      paragraphs(proj.description).forEach((t) => body.append(el("p", null, t)));
      card.append(body);

      const tags = el("div", "tags");
      (proj.stack || []).forEach((t) => {
        const tag = el("span", "tag", t);
        tag.style.setProperty("--h", hue(t));
        tags.append(tag);
      });
      card.append(tags);

      const links = el("div", "card-links");
      if (proj.demo) links.append(btnLink("↗ demo", proj.demo, true));
      if (proj.link) links.append(btnLink("</> código", proj.link));
      if (!proj.demo && !proj.link) links.append(el("span", "muted", "proyecto privado"));
      card.append(links);

      nodes.push(card);
    });
    return nodes;
  }

  function renderExperience() {
    const nodes = [heading("Experiencia")];
    DATA.experience.forEach((job, i) => {
      const item = el("div", "tl-item" + (i === 0 ? " current" : ""));
      const head = el("p", "tl-head");
      head.append(el("span", "tl-role", job.role));
      if (job.company) head.append(el("span", "muted", " @ "), el("span", "tl-company", job.company));
      item.append(head);
      if (job.period) item.append(el("p", "tl-period", job.period));
      const list = el("ul", "tl-list");
      job.achievements.forEach((a) => list.append(el("li", null, a)));
      item.append(list);
      nodes.push(item);
    });
    return nodes;
  }

  function renderSkills() {
    const nodes = [heading("Habilidades")];
    DATA.skills.forEach((group) => {
      nodes.push(el("p", "skill-group", group.category));
      group.items.forEach((s) => {
        const level = Math.max(0, Math.min(100, s.level));
        const row = el("div", "skill-row");
        const track = el("span", "skill-track");
        const fill = el("span", "skill-fill");
        fill.style.setProperty("--lv", `${level}%`);
        track.setAttribute("aria-hidden", "true");
        track.append(fill);
        row.append(el("span", "skill-name", s.name), track, el("span", "skill-pct", `${level}%`));
        nodes.push(row);
      });
      nodes.push(gap());
    });
    return nodes;
  }

  function renderCourses() {
    const nodes = [heading("Cursos y certificaciones")];
    DATA.courses.forEach((c) => {
      const row = el("div", "course");
      const info = el("div");
      info.append(el("p", "course-name", c.name));
      const meta = el("p", "course-inst", c.institution);
      if (c.link && c.link !== "#") meta.append("  ·  ", link("certificado ↗", c.link));
      info.append(meta);
      row.append(el("span", "year", c.year), info);
      nodes.push(row);
    });
    return nodes;
  }

  function renderContact() {
    const nodes = [heading("Contacto")];
    nodes.push(kv("email", link(P.email, `mailto:${P.email}`)));
    P.links.forEach((l) => nodes.push(kv(l.label.toLowerCase(), link(l.url.replace(/^https?:\/\//, ""), l.url))));
    nodes.push(gap());
    const actions = el("div", "card-links");
    actions.append(btnLink("✉ Escríbeme", `mailto:${P.email}`, true));
    P.links.filter((l) => /cv/i.test(l.label)).forEach((l) => actions.append(btnLink("↓ Descargar CV", l.url)));
    nodes.push(actions);
    return nodes;
  }

  /* ---------- Sistema de archivos falso ---------- */
  const FILES = {
    "sobre_mi.txt": "about",
    "proyectos/": "projects",
    "experiencia.log": "experience",
    "habilidades.cfg": "skills",
    "cursos.md": "courses",
    "contacto.vcf": "contact",
  };

  /* ---------- Comandos ---------- */
  const COMMANDS = {
    help: {
      desc: "muestra esta ayuda",
      run: () => {
        const grid = el("div", "help-grid");
        Object.entries(COMMANDS).forEach(([name, c]) => {
          if (c.hidden) return;
          grid.appendChild(cmdButton(name));
          grid.appendChild(el("span", "d", c.desc + (c.aliases ? `  (alias: ${c.aliases.join(", ")})` : "")));
        });
        return [
          heading("Comandos disponibles"),
          grid,
          gap(),
          line(`Atajos: ↑/↓ historial · Tab o → autocompletar · ${PALETTE_KEY} paleta de comandos · Ctrl+L limpiar`, "muted"),
        ];
      },
    },
    about: { desc: "quién soy", aliases: ["sobremi", "whoami"], run: renderAbout },
    projects: { desc: "proyectos destacados", aliases: ["proyectos"], run: renderProjects },
    experience: { desc: "experiencia laboral", aliases: ["experiencia"], run: renderExperience },
    skills: { desc: "habilidades técnicas", aliases: ["habilidades"], run: renderSkills },
    courses: { desc: "cursos y certificaciones", aliases: ["cursos"], run: renderCourses },
    contact: { desc: "cómo contactarme", aliases: ["contacto"], run: renderContact },
    theme: {
      desc: "cambia los colores (ej: theme retro)",
      aliases: ["tema"],
      run: (args) => {
        if (!args[0]) {
          const current = currentTheme();
          const nodes = [heading("Temas")];
          Object.entries(THEMES).forEach(([key, label]) => {
            const active = key === current;
            nodes.push(rich([
              { text: active ? "● " : "○ ", cls: active ? "primary" : "muted" },
              cmdButtonInline(`theme ${key}`, key),
              { text: `  ${label}`, cls: "muted" },
            ]));
          });
          nodes.push(gap(), line("uso: theme <nombre>", "muted"));
          return nodes;
        }
        const name = resolveTheme(args[0]);
        if (!name) return [line(`theme: tema desconocido '${args[0]}'. Escribe 'theme' para ver la lista.`, "err")];
        applyTheme(name);
        return [rich([{ text: "✓ ", cls: "primary" }, "Tema cambiado a ", { text: THEMES[name], cls: "accent" }])];
      },
    },
    ls: {
      desc: "lista los archivos",
      run: () => {
        const p = el("p", "line");
        Object.keys(FILES).forEach((f, i) => {
          if (i) p.appendChild(document.createTextNode("   "));
          p.appendChild(cmdButtonInline(`cat ${f}`, f));
        });
        return [p];
      },
    },
    cat: {
      desc: "muestra un archivo (ej: cat cursos.md)",
      run: (args) => {
        if (!args[0]) return [line("uso: cat <archivo>   (prueba 'ls')", "warn")];
        const target = FILES[args[0]] || FILES[args[0] + "/"];
        if (!target) return [line(`cat: ${args[0]}: No existe el archivo o el directorio`, "err")];
        setSection(target);
        return COMMANDS[target].run([]);
      },
    },
    banner: { desc: "muestra el banner", run: renderBanner },
    history: {
      desc: "historial de comandos",
      run: () => cmdHistory.length
        ? cmdHistory.map((h, i) => line(`${String(i + 1).padStart(4)}  ${h}`))
        : [line("historial vacío", "muted")],
    },
    date: { desc: "fecha y hora actual", run: () => [line(new Date().toLocaleString("es"))] },
    echo: { desc: "repite un texto", run: (args, raw) => [line(raw.replace(/^\s*echo\s?/, ""))] },
    clear: { desc: "limpia la pantalla", aliases: ["cls"], run: () => { output.replaceChildren(); return []; } },
    reboot: { desc: "reinicia la terminal", run: () => { reboot(); return null; } },
    sudo: {
      hidden: true,
      run: () => [line(`${HANDLE} no está en el archivo sudoers. Este incidente será reportado.`, "err")],
    },
    exit: { hidden: true, run: () => [line("No hay salida. Solo más código. (prueba 'reboot')", "warn")] },
    cd: { hidden: true, run: () => [line("cd: aquí todo está en ~ — usa 'ls' y 'cat'", "muted")] },
    pwd: { hidden: true, run: () => [line(`/home/${HANDLE}${cwd.slice(1)}`)] },
    rm: { hidden: true, run: () => [line("rm: operación no permitida. Buen intento ;)", "err")] },
  };

  // Mapa de alias -> comando
  const ALIASES = {};
  Object.entries(COMMANDS).forEach(([name, c]) => (c.aliases || []).forEach((a) => (ALIASES[a] = name)));

  function resolve(name) {
    return COMMANDS[name] ? name : ALIASES[name];
  }

  /* ---------- Ejecución ---------- */
  function echoCommand(raw) {
    const p = el("p", "line cmd-echo");
    p.append(promptNode(), el("span", null, raw));
    output.appendChild(p);
  }

  async function submit(raw) {
    if (busy) return;
    raw = raw.trim();
    input.value = "";
    renderInput();
    echoCommand(raw);
    if (!raw) { scrollToBottom(); return; }

    cmdHistory.push(raw);
    historyIndex = cmdHistory.length;

    const [name, ...args] = raw.split(/\s+/);
    const key = resolve(name.toLowerCase());

    setBusy(true);
    if (!key) {
      await print(line(`comando no encontrado: ${name}. Escribe 'help' o pulsa ${PALETTE_KEY}.`, "err"));
    } else {
      if (SECTIONS[key]) setSection(key);
      const nodes = COMMANDS[key].run(args, raw);
      if (nodes === null) return; // el comando gestiona su propio estado (reboot)
      if (nodes.length) await print(nodes);
      updateHash(key);
    }
    await print(gap(), 0);
    setBusy(false);
  }

  // Refleja la sección actual en la URL para poder compartir enlaces (#projects)
  function updateHash(key) {
    if (SECTIONS[key]) {
      try { window.history.replaceState(null, "", `#${key}`); } catch (_) { /* file:// puede fallar */ }
    }
  }

  /* ---------- Autocompletado ---------- */
  function completions(value) {
    const m = value.match(/^(\S+)\s+(.*)$/);
    if (m) {
      const cmd = resolve(m[1].toLowerCase());
      const pool = cmd === "cat" ? Object.keys(FILES) : cmd === "theme" ? Object.keys(THEMES) : [];
      return { base: m[1] + " ", partial: m[2], candidates: pool.filter((f) => f.startsWith(m[2])) };
    }
    const partial = value.toLowerCase();
    const all = Object.keys(COMMANDS).filter((c) => !COMMANDS[c].hidden).concat(Object.keys(ALIASES));
    return { base: "", partial, candidates: partial ? all.filter((c) => c.startsWith(partial)) : [] };
  }

  // Texto sugerido en gris tras lo que se ha escrito
  function suggestion(value) {
    if (!value.trim()) return "";
    const { partial, candidates } = completions(value);
    return candidates.length ? candidates[0].slice(partial.length) : "";
  }

  function commonPrefix(list) {
    return list.reduce((acc, s) => {
      let i = 0;
      while (i < acc.length && acc[i] === s[i]) i++;
      return acc.slice(0, i);
    });
  }

  function autocomplete() {
    const value = input.value;
    const { base, partial, candidates } = completions(value);
    if (candidates.length === 1) {
      input.value = base + candidates[0] + (base ? "" : " ");
    } else if (candidates.length > 1) {
      const common = commonPrefix(candidates);
      if (common.length > partial.length) {
        input.value = base + common;
      } else {
        echoCommand(value);
        output.appendChild(line(candidates.join("   "), "muted"));
        scrollToBottom();
      }
    }
    renderInput();
  }

  /* ---------- Entrada visible ---------- */
  function renderInput() {
    const v = input.value;
    const pos = input.selectionStart ?? v.length;
    const ghost = pos >= v.length ? suggestion(v) : "";
    before.textContent = v.slice(0, pos);
    cursorEl.textContent = ghost ? ghost[0] : v[pos] || " ";
    cursorEl.classList.toggle("on-ghost", !!ghost);
    ghostEl.textContent = ghost.slice(1);
    after.textContent = v.slice(pos + 1);
  }

  input.addEventListener("input", renderInput);
  input.addEventListener("keyup", renderInput);
  input.addEventListener("click", renderInput);
  input.addEventListener("focus", () => form.classList.add("focused"));
  input.addEventListener("blur", () => form.classList.remove("focused"));

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) historyIndex--;
      input.value = cmdHistory[historyIndex] || "";
      setTimeout(() => { input.setSelectionRange(input.value.length, input.value.length); renderInput(); });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < cmdHistory.length) historyIndex++;
      input.value = cmdHistory[historyIndex] || "";
      renderInput();
    } else if (e.key === "Tab") {
      e.preventDefault();
      autocomplete();
    } else if (e.key === "ArrowRight" && cursorEl.classList.contains("on-ghost")) {
      e.preventDefault();
      input.value += suggestion(input.value);
      renderInput();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      output.replaceChildren();
    } else if (e.key === "c" && e.ctrlKey && !window.getSelection().toString()) {
      e.preventDefault();
      echoCommand(input.value + "^C");
      input.value = "";
      renderInput();
      scrollToBottom();
    }
    requestAnimationFrame(renderInput);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(input.value);
  });

  // Pestañas
  tabs.forEach((b) => b.addEventListener("click", () => run(b.dataset.cmd)));

  // Botón de tema: pasa al siguiente
  $("#theme-btn").addEventListener("click", () => {
    const keys = Object.keys(THEMES);
    run(`theme ${keys[(keys.indexOf(currentTheme()) + 1) % keys.length]}`);
  });

  // Clic en la pantalla enfoca el input (sin romper la selección de texto)
  screen.addEventListener("mouseup", (e) => {
    if (e.target.closest("a, button")) return;
    if (window.getSelection().toString()) return;
    input.focus({ preventScroll: true });
  });

  // Durante animaciones, cualquier tecla o clic las acelera
  screen.addEventListener("click", () => { if (busy) skip = true; });

  /* ---------- Paleta de comandos ---------- */
  const palette = $("#palette");
  const palInput = $("#palette-input");
  const palList = $("#palette-list");
  let palItems = [];
  let palSel = 0;

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // Coincidencia difusa: las letras de la búsqueda aparecen en orden
  function fuzzy(query, text) {
    let i = 0;
    for (const ch of text) {
      if (ch === query[i]) i++;
      if (i === query.length) return true;
    }
    return query.length === 0;
  }

  function paletteEntries() {
    const list = [];
    Object.entries(COMMANDS).forEach(([name, c]) => { if (!c.hidden) list.push({ cmd: name, desc: c.desc }); });
    Object.entries(THEMES).forEach(([key, label]) => list.push({ cmd: `theme ${key}`, desc: `Tema: ${label}` }));
    return list;
  }

  function renderPalette() {
    const q = norm(palInput.value.trim());
    palItems = paletteEntries()
      .filter((e) => fuzzy(q, norm(`${e.cmd} ${e.desc}`)))
      .sort((a, b) => norm(b.cmd).startsWith(q) - norm(a.cmd).startsWith(q));
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    palList.replaceChildren();
    if (!palItems.length) {
      palList.append(el("li", "pal-empty", "Sin resultados"));
      return;
    }
    palItems.forEach((e, i) => {
      const li = el("li", "pal-item");
      li.setAttribute("role", "option");
      li.append(el("span", "pal-cmd", e.cmd), el("span", "pal-desc", e.desc));
      li.addEventListener("mousemove", () => { if (palSel !== i) { palSel = i; highlight(); } });
      li.addEventListener("click", () => runPalette(i));
      palList.append(li);
    });
    highlight();
  }

  function highlight() {
    [...palList.children].forEach((li, i) => {
      li.classList.toggle("sel", i === palSel);
      li.setAttribute("aria-selected", i === palSel);
    });
    const sel = palList.children[palSel];
    if (sel) sel.scrollIntoView({ block: "nearest" });
  }

  function openPalette() {
    palette.hidden = false;
    palInput.value = "";
    palSel = 0;
    renderPalette();
    palInput.focus();
  }

  function closePalette() {
    palette.hidden = true;
    input.focus({ preventScroll: true });
  }

  function runPalette(i) {
    const entry = palItems[i];
    closePalette();
    if (entry) run(entry.cmd);
  }

  palInput.addEventListener("input", () => { palSel = 0; renderPalette(); });
  palInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); palSel = (palSel + 1) % Math.max(1, palItems.length); highlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); palSel = (palSel - 1 + palItems.length) % Math.max(1, palItems.length); highlight(); }
    else if (e.key === "Enter") { e.preventDefault(); runPalette(palSel); }
    else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
  });
  palette.addEventListener("mousedown", (e) => { if (e.target === palette) closePalette(); });
  $("#sb-palette").addEventListener("click", openPalette);
  $("#palette-kbd").textContent = PALETTE_KEY;

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (palette.hidden) openPalette(); else closePalette();
      return;
    }
    if (busy && palette.hidden) skip = true;
  });

  /* ---------- Reloj ---------- */
  const clock = $("#clock");
  function tick() {
    clock.textContent = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Arranque ---------- */
  // La secuencia completa solo se muestra en la primera visita (o con 'reboot')
  async function boot(full) {
    setBusy(true);
    output.replaceChildren();
    if (full) {
      const steps = [
        "Iniciando PORTFOLIO-OS v2.0 ...",
        "Comprobando memoria ............ 640K OK",
        "Cargando módulo sobre_mi ....... [ OK ]",
        "Cargando módulo proyectos ...... [ OK ]",
        "Cargando módulo experiencia .... [ OK ]",
        "Cargando módulo habilidades .... [ OK ]",
        "Cargando módulo cursos ......... [ OK ]",
        "Estableciendo conexión ......... [ OK ]",
      ];
      for (const s of steps) {
        await print(line(s, "muted"), 0);
        if (!skip && !reducedMotion) await sleep(50 + Math.random() * 70);
      }
      await print(gap(), 0);
    }
    await print(renderBanner(), 40);
    await print(gap(), 0);
    await typeLine("Bienvenido/a. Escribe 'help' para ver los comandos disponibles.", "accent");
    await print(rich([
      { text: "O usa las pestañas de arriba, o pulsa ", cls: "muted" },
      { text: PALETTE_KEY, cls: "kbd" },
      { text: " para abrir la paleta de comandos.", cls: "muted" },
    ]));
    await print(gap(), 0);
    save("pf-booted", "1");

    // Abre la sección indicada en la URL (#projects, #skills, ...)
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash && resolve(hash) && !pending) pending = hash;
    setBusy(false);
  }

  function reboot() {
    win.classList.add("off");
    setTimeout(() => {
      win.classList.remove("off");
      cmdHistory.length = 0;
      historyIndex = 0;
      busy = false;
      setSection(null);
      boot(true);
    }, reducedMotion ? 0 : 700);
  }

  document.title = `${P.name} — Terminal`;
  $("#sb-theme").textContent = currentTheme();
  setSection(null);
  renderInput();
  boot(!load("pf-booted"));
})();
