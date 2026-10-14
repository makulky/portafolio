/* ==========================================================
   App Terminal (se monta dentro de una ventana del escritorio)
   ========================================================== */
(function () {
  "use strict";

  const { DATA, P, el, line, rich, link, gap, heading, render } = window.PF;
  const HANDLE = P.handle || "guest";
  const HOST = `${HANDLE}@portfolio`;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const MENU_KEY = isMac ? "⌘K" : "Ctrl K";

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

  // Sistema de archivos falso
  const FILES = {
    "sobre_mi.txt": "about",
    "proyectos/": "projects",
    "experiencia.log": "experience",
    "habilidades.cfg": "skills",
    "cursos.md": "courses",
    "contacto.vcf": "contact",
  };

  /* ---------- Almacenamiento (puede fallar en modo privado) ---------- */
  function load(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* sin persistencia */ }
  }

  /* ---------- Tema de la terminal (independiente del modo del SO) ---------- */
  function getTheme() {
    const t = load("pf-term-theme") || load("pf-theme");
    return THEMES[t] ? t : "verde";
  }

  function resolveTheme(name) {
    const n = name.toLowerCase();
    return THEMES[n] ? n : THEME_ALIASES[n];
  }

  function setTheme(name) {
    save("pf-term-theme", name);
    document.dispatchEvent(new CustomEvent("pf:term-theme", { detail: name }));
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ==========================================================
     Monta una terminal en `container`.
     `os`: { open(id, args), close(), setTitle(text), isActive() }
     ========================================================== */
  function mountTerminal(container, os, args) {
    const term = el("div", "app-terminal");
    term.dataset.termTheme = getTheme();
    term.innerHTML = `
      <section class="screen">
        <div class="output" aria-live="polite"></div>
        <form class="prompt-line" autocomplete="off">
          <label class="prompt"></label>
          <div class="input-wrap">
            <span class="typed" aria-hidden="true"><span class="t-before"></span><span class="cursor">&nbsp;</span><span class="t-after"></span><span class="ghost"></span></span>
            <input class="cmd-input" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="Escribe un comando" />
          </div>
        </form>
      </section>`;
    container.append(term);

    const $ = (sel) => term.querySelector(sel);
    const output = $(".output");
    const screen = $(".screen");
    const input = $(".cmd-input");
    const form = $(".prompt-line");
    const promptLabel = $(".prompt");
    const before = $(".t-before");
    const cursorEl = $(".cursor");
    const after = $(".t-after");
    const ghostEl = $(".ghost");

    const inputId = `cmd-input-${Date.now()}`;
    input.id = inputId;
    promptLabel.htmlFor = inputId;

    const cmdHistory = [];
    let historyIndex = 0;
    let busy = false;
    let skip = false;
    let pending = args && args.run ? args.run : null;
    let cwd = "~";
    let destroyed = false;

    /* ---------- Utilidades ---------- */
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

    function scrollToBottom() {
      screen.scrollTop = screen.scrollHeight;
    }

    // Imprime nodos uno a uno con una pequeña animación escalonada
    async function print(nodes, delay = 28) {
      for (const node of [].concat(nodes)) {
        if (destroyed) return;
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
      if (value || destroyed) return;
      skip = false;
      if (os.isActive()) input.focus({ preventScroll: true });
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
      os.setTitle(`${HOST}: ${cwd}`);
    }

    /* ---------- Temas ---------- */
    function onTheme(e) {
      term.dataset.termTheme = e.detail;
    }
    document.addEventListener("pf:term-theme", onTheme);

    /* ---------- Render ---------- */
    function renderBanner() {
      return [
        el("pre", "pre banner", BANNER),
        rich([{ text: P.name, cls: "strong" }, { text: "  ·  ", cls: "muted" }, { text: P.role, cls: "accent" }]),
      ];
    }

    function renderAbout() {
      return render.about([rich([{ text: "Tip: ", cls: "muted" }, "escribe ", cmdButtonInline("projects"), " o ", cmdButtonInline("contact"), "."])]);
    }

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
            line(`Atajos: ↑/↓ historial · Tab o → autocompletar · Ctrl+L limpiar · ${MENU_KEY} menú Inicio`, "muted"),
          ];
        },
      },
      about: { desc: "quién soy", aliases: ["sobremi", "whoami"], run: renderAbout },
      projects: { desc: "proyectos destacados", aliases: ["proyectos"], run: render.projects },
      experience: { desc: "experiencia laboral", aliases: ["experiencia"], run: render.experience },
      skills: { desc: "habilidades técnicas", aliases: ["habilidades"], run: render.skills },
      courses: { desc: "cursos y certificaciones", aliases: ["cursos"], run: render.courses },
      contact: { desc: "cómo contactarme", aliases: ["contacto"], run: render.contact },
      open: {
        desc: "abre una app del escritorio (ej: open proyectos)",
        aliases: ["start", "abrir"],
        run: (args) => {
          const apps = window.PF.apps;
          const id = args[0] && window.PF.resolveApp(args[0]);
          if (!id) {
            const p = el("p", "line");
            Object.keys(apps).forEach((key, i) => {
              if (i) p.appendChild(document.createTextNode("   "));
              p.appendChild(cmdButtonInline(`open ${key}`, key));
            });
            return [
              args[0] ? line(`open: no existe la app '${args[0]}'`, "err") : line("uso: open <app>", "muted"),
              p,
            ];
          }
          os.open(id);
          return [rich([{ text: "✓ ", cls: "primary" }, "Abriendo ", { text: apps[id].title, cls: "accent" }, " …"])];
        },
      },
      games: {
        desc: "minijuegos: snake y buscaminas",
        aliases: ["juegos"],
        run: () => [
          heading("Juegos"),
          rich([cmdButtonInline("open snake", "snake"), "        clásico arcade: come y no choques"]),
          rich([cmdButtonInline("open buscaminas", "buscaminas"), "   despeja el tablero sin pisar una mina"]),
        ],
      },
      theme: {
        desc: "cambia los colores (ej: theme retro)",
        aliases: ["tema"],
        run: (args) => {
          if (!args[0]) {
            const current = getTheme();
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
          setTheme(name);
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
      exit: { desc: "cierra la terminal", run: () => { os.close(); return null; } },
      shutdown: {
        hidden: true,
        run: () => { window.PF.os.shutdown(); return null; },
      },
      sudo: {
        hidden: true,
        run: () => [line(`${HANDLE} no está en el archivo sudoers. Este incidente será reportado.`, "err")],
      },
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
      if (busy || destroyed) return;
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
        await print(line(`comando no encontrado: ${name}. Escribe 'help' para ver la lista.`, "err"));
      } else {
        if (SECTIONS[key]) setSection(key);
        const nodes = COMMANDS[key].run(args, raw);
        if (nodes === null) { busy = false; return; } // el comando gestiona su propio estado
        if (nodes.length) await print(nodes);
      }
      await print(gap(), 0);
      setBusy(false);
    }

    /* ---------- Autocompletado ---------- */
    function completions(value) {
      const m = value.match(/^(\S+)\s+(.*)$/);
      if (m) {
        const cmd = resolve(m[1].toLowerCase());
        const pool = cmd === "cat" ? Object.keys(FILES)
          : cmd === "theme" ? Object.keys(THEMES)
          : cmd === "open" ? Object.keys(window.PF.apps)
          : [];
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

    // Clic en la pantalla enfoca el input (sin romper la selección de texto)
    screen.addEventListener("mouseup", (e) => {
      if (e.target.closest("a, button")) return;
      if (window.getSelection().toString()) return;
      input.focus({ preventScroll: true });
    });

    // Durante animaciones, cualquier tecla o clic las acelera
    screen.addEventListener("click", () => { if (busy) skip = true; });
    term.addEventListener("keydown", () => { if (busy) skip = true; });

    /* ---------- Arranque ---------- */
    // La secuencia completa solo se muestra la primera vez (o con 'reboot')
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
        { text: "Prueba ", cls: "muted" },
        cmdButtonInline("ls"),
        { text: ", ", cls: "muted" },
        cmdButtonInline("open projects"),
        { text: " o ", cls: "muted" },
        cmdButtonInline("theme retro"),
        { text: ".", cls: "muted" },
      ]));
      await print(gap(), 0);
      save("pf-booted", "1");
      setBusy(false);
    }

    function reboot() {
      term.classList.add("off");
      setTimeout(() => {
        if (destroyed) return;
        term.classList.remove("off");
        cmdHistory.length = 0;
        historyIndex = 0;
        busy = false;
        setSection(null);
        boot(true);
      }, reducedMotion ? 0 : 700);
    }

    setSection(null);
    renderInput();
    boot(!load("pf-booted"));

    return {
      focus: () => input.focus({ preventScroll: true }),
      navigate: (a) => { if (a && a.run) run(a.run); },
      destroy: () => {
        destroyed = true;
        document.removeEventListener("pf:term-theme", onTheme);
      },
    };
  }

  window.PF.mountTerminal = mountTerminal;
  window.PF.terminalThemes = THEMES;
  window.PF.getTerminalTheme = getTheme;
  window.PF.setTerminalTheme = setTheme;
})();
