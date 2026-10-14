/* ==========================================================
   Juegos: carpeta de juegos, Snake y Buscaminas
   ========================================================== */
(function () {
  "use strict";

  const PF = window.PF;
  const { el, icon } = PF;

  /* ---------- Utilidades ---------- */
  function load(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* sin persistencia */ }
  }

  const compact = () => window.matchMedia("(max-width: 700px)").matches;
  const coarse = () => window.matchMedia("(pointer: coarse)").matches;

  function gameButton(label, onClick, cls) {
    const b = el("button", "btn" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  // Convierte cualquier color CSS (incluido color-mix y var()) a rgb() para el canvas
  function resolveColor(probe, value) {
    probe.style.color = value;
    return getComputedStyle(probe).color;
  }

  /* ==========================================================
     Carpeta de juegos
     ========================================================== */
  const GAMES = [
    { id: "snake", desc: "Arcade" },
    { id: "minesweeper", desc: "Puzle" },
  ];

  function gamesApp(body, os) {
    const grid = el("div", "ex-grid games-grid");
    grid.setAttribute("role", "listbox");
    grid.setAttribute("aria-label", "Juegos");
    GAMES.forEach((g) => {
      const app = PF.apps[g.id];
      const item = el("button", "ex-item");
      item.type = "button";
      item.setAttribute("role", "option");
      item.append(icon(app.icon), el("span", "ex-name", app.title), el("span", "ex-badge", g.desc));
      item.addEventListener("click", (e) => {
        grid.querySelectorAll(".sel").forEach((n) => n.classList.remove("sel"));
        item.classList.add("sel");
        if (compact() || e.detail === 0) os.open(g.id); // toque en móvil o Enter con el teclado
      });
      item.addEventListener("dblclick", () => os.open(g.id));
      grid.append(item);
    });
    const status = el("div", "ex-status", "Haz doble clic en un juego para abrirlo");
    const root = el("div", "games-folder");
    root.append(grid, status);
    body.append(root);
  }

  /* ==========================================================
     Snake
     ========================================================== */
  const SNAKE_N = 20; // celdas por lado
  const DIRS = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
  };
  const KEY_DIRS = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
  };

  function snakeApp(body, os) {
    const root = el("div", "game snake");
    root.tabIndex = 0;
    root.setAttribute("aria-label", "Snake. Usa las flechas para moverte, Espacio para pausar y R para reiniciar.");

    const scoreEl = el("span", "game-num", "0");
    const bestEl = el("span", "game-num", "0");
    const pauseBtn = gameButton("Pausa", () => (state === "playing" ? pause() : start()));
    const bar = el("div", "game-bar");
    const scoreBox = el("span", "game-stat");
    scoreBox.append("Puntos ", scoreEl);
    const bestBox = el("span", "game-stat");
    bestBox.append("Récord ", bestEl);
    bar.append(scoreBox, bestBox, el("span", "game-spacer"), pauseBtn, gameButton("Reiniciar", () => { reset(); start(); }));

    const stage = el("div", "snake-stage");
    const canvas = el("canvas", "snake-canvas");
    const overlay = el("div", "game-overlay");
    const probe = el("span", "game-probe");
    stage.append(canvas, overlay, probe);

    const pad = el("div", "snake-pad");
    [["up", "▲"], ["left", "◀"], ["down", "▼"], ["right", "▶"]].forEach(([d, label]) => {
      const b = el("button", `pad-btn pad-${d}`, label);
      b.type = "button";
      b.setAttribute("aria-label", { up: "Arriba", down: "Abajo", left: "Izquierda", right: "Derecha" }[d]);
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); turn(d); });
      pad.append(b);
    });

    root.append(bar, stage, pad);
    body.append(root);

    const ctx = canvas.getContext("2d");
    let best = +load("pf-snake-best") || 0;
    bestEl.textContent = best;

    let snake, dir, queue, food, score, step, state, acc, last, raf;
    let colors = {};
    let cell = 16;

    function readColors() {
      colors = {
        bg: resolveColor(probe, "var(--os-card)"),
        grid: resolveColor(probe, "var(--os-stroke)"),
        body: resolveColor(probe, "var(--os-accent-fg)"),
        head: resolveColor(probe, "var(--os-text)"),
        food: "#f25b5b",
      };
      draw();
    }

    function randomFree() {
      const taken = new Set(snake.map((p) => p.y * SNAKE_N + p.x));
      const free = [];
      for (let i = 0; i < SNAKE_N * SNAKE_N; i++) if (!taken.has(i)) free.push(i);
      const i = free[Math.floor(Math.random() * free.length)];
      return { x: i % SNAKE_N, y: Math.floor(i / SNAKE_N) };
    }

    function reset() {
      const mid = Math.floor(SNAKE_N / 2);
      snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
      dir = "right";
      queue = [];
      score = 0;
      step = 125; // ms por movimiento
      food = randomFree();
      state = "ready";
      scoreEl.textContent = "0";
      showOverlay("Snake", "Come la fruta y no choques con las paredes ni contigo mismo.", "Empezar");
      draw();
    }

    function showOverlay(title, text, action) {
      overlay.replaceChildren(el("p", "game-ov-title", title), el("p", "game-ov-text", text));
      if (action) overlay.append(gameButton(action, () => { if (state === "over") reset(); start(); }, "btn-primary"));
      if (!coarse()) overlay.append(el("p", "game-ov-hint", "Flechas o WASD · Espacio pausa · R reinicia"));
      overlay.hidden = false;
    }

    function start() {
      if (state === "over") reset();
      state = "playing";
      overlay.hidden = true;
      pauseBtn.textContent = "Pausa";
      last = performance.now();
      acc = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
      root.focus({ preventScroll: true });
    }

    function pause() {
      if (state !== "playing") return;
      state = "paused";
      pauseBtn.textContent = "Seguir";
      cancelAnimationFrame(raf);
      showOverlay("Pausa", "Pulsa Espacio o el botón para seguir.", "Seguir");
    }

    function gameOver() {
      state = "over";
      cancelAnimationFrame(raf);
      const record = score > best;
      if (record) {
        best = score;
        bestEl.textContent = best;
        save("pf-snake-best", best);
      }
      showOverlay("Game over", record ? `¡Nuevo récord: ${score} puntos!` : `Has hecho ${score} puntos.`, "Jugar otra vez");
    }

    function turn(d) {
      if (state === "ready" || state === "paused") start();
      if (state !== "playing" || queue.length >= 2) return;
      const prev = DIRS[queue.length ? queue[queue.length - 1] : dir];
      const next = DIRS[d];
      if (prev.x + next.x === 0 && prev.y + next.y === 0) return; // giro de 180°
      if (prev === next) return;
      queue.push(d);
    }

    function tick() {
      if (queue.length) dir = queue.shift();
      const head = { x: snake[0].x + DIRS[dir].x, y: snake[0].y + DIRS[dir].y };
      const eats = head.x === food.x && head.y === food.y;
      const bodyToCheck = eats ? snake : snake.slice(0, -1); // la cola se mueve si no come
      if (head.x < 0 || head.y < 0 || head.x >= SNAKE_N || head.y >= SNAKE_N ||
          bodyToCheck.some((p) => p.x === head.x && p.y === head.y)) {
        gameOver();
        return;
      }
      snake.unshift(head);
      if (eats) {
        score++;
        scoreEl.textContent = score;
        step = Math.max(60, step - 3);
        if (snake.length === SNAKE_N * SNAKE_N) { draw(); gameOver(); return; }
        food = randomFree();
      } else {
        snake.pop();
      }
    }

    function loop(now) {
      if (!os.isActive()) { pause(); return; }
      acc += Math.min(now - last, 250);
      last = now;
      while (acc >= step && state === "playing") {
        acc -= step;
        tick();
      }
      draw();
      if (state === "playing") raf = requestAnimationFrame(loop);
    }

    function draw() {
      if (!snake) return;
      const size = cell * SNAKE_N;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = colors.grid;
      for (let y = 0; y < SNAKE_N; y++) {
        for (let x = (y % 2); x < SNAKE_N; x += 2) ctx.fillRect(x * cell, y * cell, cell, cell);
      }
      // fruta
      ctx.fillStyle = colors.food;
      ctx.beginPath();
      ctx.arc((food.x + 0.5) * cell, (food.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
      ctx.fill();
      // serpiente
      const pad = Math.max(1, cell * 0.08);
      snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? colors.head : colors.body;
        ctx.beginPath();
        ctx.roundRect(p.x * cell + pad, p.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.28);
        ctx.fill();
      });
    }

    function resize() {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      cell = Math.max(8, Math.floor(Math.min(w, h) / SNAKE_N));
      const size = cell * SNAKE_N;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = canvas.style.height = `${size}px`;
      canvas.width = canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    // Teclado: solo cuando esta ventana está activa
    const win = body.closest(".win") || body;
    function onKey(e) {
      if (!os.isActive() || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if ((k === " " || k === "Enter") && e.target.closest("button, select")) return; // lo gestiona el botón
      if (KEY_DIRS[k]) { e.preventDefault(); turn(KEY_DIRS[k]); }
      else if (k === " ") { e.preventDefault(); state === "playing" ? pause() : start(); }
      else if (k === "r") { e.preventDefault(); reset(); start(); }
    }
    win.addEventListener("keydown", onKey);

    // Pausa al cambiar de ventana o de pestaña (además de la comprobación del bucle)
    const onFocusOut = (e) => { if (!win.contains(e.relatedTarget)) setTimeout(() => { if (!os.isActive()) pause(); }, 0); };
    const onVisibility = () => { if (document.hidden) pause(); };
    win.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVisibility);

    // Deslizar sobre el tablero (móvil)
    let touch = null;
    stage.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") touch = { x: e.clientX, y: e.clientY }; });
    stage.addEventListener("pointerup", (e) => {
      if (!touch) return;
      const dx = e.clientX - touch.x;
      const dy = e.clientY - touch.y;
      touch = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    });

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    document.addEventListener("pf:settings", readColors);

    reset();
    readColors();

    return {
      focus: () => root.focus({ preventScroll: true }),
      destroy() {
        cancelAnimationFrame(raf);
        ro.disconnect();
        win.removeEventListener("keydown", onKey);
        win.removeEventListener("focusout", onFocusOut);
        document.removeEventListener("visibilitychange", onVisibility);
        document.removeEventListener("pf:settings", readColors);
      },
    };
  }

  /* ==========================================================
     Buscaminas
     ========================================================== */
  const LEVELS = {
    beginner: { label: "Principiante", rows: 9, cols: 9, mines: 10 },
    intermediate: { label: "Intermedio", rows: 16, cols: 16, mines: 40 },
    expert: { label: "Experto", rows: 16, cols: 30, mines: 99 },
  };
  const FACES = { play: "🙂", press: "😮", lost: "😵", won: "😎" };

  function minesweeperApp(body, os) {
    const root = el("div", "game mines");

    // Barra superior
    const counter = el("span", "mines-lcd", "010");
    const face = el("button", "mines-face", FACES.play);
    face.type = "button";
    face.setAttribute("aria-label", "Nueva partida");
    const timerEl = el("span", "mines-lcd", "000");
    const panel = el("div", "mines-panel");
    panel.append(counter, face, timerEl);

    const levelSel = el("select", "mines-level");
    levelSel.setAttribute("aria-label", "Nivel");
    Object.entries(LEVELS).forEach(([key, l]) => {
      const o = el("option", null, `${l.label} · ${l.cols}×${l.rows}`);
      o.value = key;
      levelSel.append(o);
    });
    const modeBtn = gameButton("⛏ Descubrir", () => setFlagMode(!flagMode), "mines-mode");
    const bestEl = el("span", "mines-best");
    const bar = el("div", "game-bar");
    bar.append(levelSel, modeBtn, el("span", "game-spacer"), bestEl);

    const wrap = el("div", "mines-wrap");
    const board = el("div", "mines-board");
    board.setAttribute("role", "grid");
    wrap.append(board);
    const status = el("p", "mines-status");
    status.setAttribute("aria-live", "polite");

    root.append(bar, panel, wrap, status);
    body.append(root);

    let level = LEVELS[load("pf-mines-level")] ? load("pf-mines-level") : "beginner";
    levelSel.value = level;
    let cells, buttons, rows, cols, mines, state, flags, opened, seconds, timer, flagMode = false, focusIdx = 0;

    const idx = (r, c) => r * cols + c;
    function neighbors(i) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const out = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(idx(nr, nc));
        }
      }
      return out;
    }

    const pad3 = (n) => String(Math.max(-99, Math.min(999, n))).padStart(3, "0");

    function setFlagMode(v) {
      flagMode = v;
      modeBtn.textContent = v ? "🚩 Bandera" : "⛏ Descubrir";
      modeBtn.classList.toggle("btn-primary", v);
    }

    function showBest() {
      const b = load(`pf-mines-best-${level}`);
      bestEl.textContent = b ? `Mejor tiempo: ${b} s` : "";
    }

    function newGame() {
      ({ rows, cols, mines } = LEVELS[level]);
      cells = Array.from({ length: rows * cols }, () => ({ mine: false, n: 0, open: false, flag: false }));
      state = "ready";
      flags = 0;
      opened = 0;
      seconds = 0;
      clearInterval(timer);
      counter.textContent = pad3(mines);
      timerEl.textContent = pad3(0);
      face.textContent = FACES.play;
      status.textContent = "";
      focusIdx = Math.min(focusIdx, rows * cols - 1);

      board.style.setProperty("--cols", cols);
      buttons = cells.map((_, i) => {
        const b = el("button", "mc");
        b.type = "button";
        b.dataset.i = i;
        b.tabIndex = i === focusIdx ? 0 : -1;
        return b;
      });
      board.replaceChildren(...buttons);
      buttons.forEach((_, i) => paint(i));
      fit();
      showBest();
    }

    // Coloca las minas tras el primer clic, lejos de la celda pulsada
    function placeMines(safe) {
      const banned = new Set([safe, ...neighbors(safe)]);
      const pool = [];
      for (let i = 0; i < cells.length; i++) if (!banned.has(i)) pool.push(i);
      for (let k = 0; k < mines; k++) {
        const j = k + Math.floor(Math.random() * (pool.length - k));
        [pool[k], pool[j]] = [pool[j], pool[k]];
        cells[pool[k]].mine = true;
      }
      cells.forEach((cl, i) => { cl.n = neighbors(i).filter((j) => cells[j].mine).length; });
      state = "playing";
      timer = setInterval(() => { seconds++; timerEl.textContent = pad3(seconds); }, 1000);
    }

    function paint(i) {
      const cl = cells[i];
      const b = buttons[i];
      const r = Math.floor(i / cols) + 1;
      const c = (i % cols) + 1;
      let cls = "mc";
      let text = "";
      let label;
      if (cl.open) {
        cls += " open";
        if (cl.mine) { cls += " mine"; text = "💣"; label = "mina"; }
        else if (cl.n) { cls += ` n${cl.n}`; text = cl.n; label = `${cl.n} mina${cl.n > 1 ? "s" : ""} cerca`; }
        else label = "vacía";
      } else if (cl.flag) {
        cls += " flag"; text = "🚩"; label = "bandera";
      } else {
        label = "sin descubrir";
      }
      if (cl.boom) cls += " boom";
      if (cl.wrong) { cls += " wrong"; text = "❌"; label = "bandera incorrecta"; }
      b.className = cls;
      b.textContent = text;
      b.setAttribute("aria-label", `Fila ${r}, columna ${c}: ${label}`);
    }

    function reveal(i) {
      if (state === "won" || state === "lost") return;
      if (state === "ready") placeMines(i);
      const cl = cells[i];
      if (cl.flag) return;
      if (cl.open) { chord(i); return; }
      if (cl.mine) { lose(i); return; }
      // Expansión iterativa de las zonas vacías
      const queue = [i];
      while (queue.length) {
        const j = queue.pop();
        const c = cells[j];
        if (c.open || c.flag) continue;
        c.open = true;
        opened++;
        paint(j);
        if (c.n === 0) neighbors(j).forEach((k) => { if (!cells[k].open) queue.push(k); });
      }
      if (opened === cells.length - mines) win();
    }

    // Clic sobre un número con sus banderas completas: descubre las vecinas
    function chord(i) {
      const cl = cells[i];
      if (!cl.n) return;
      const around = neighbors(i);
      if (around.filter((j) => cells[j].flag).length !== cl.n) return;
      for (const j of around) {
        if (state !== "playing") return;
        if (!cells[j].open && !cells[j].flag) reveal(j);
      }
    }

    function toggleFlag(i) {
      if (state !== "playing" && state !== "ready") return;
      const cl = cells[i];
      if (cl.open) return;
      cl.flag = !cl.flag;
      flags += cl.flag ? 1 : -1;
      counter.textContent = pad3(mines - flags);
      paint(i);
    }

    function lose(i) {
      state = "lost";
      clearInterval(timer);
      cells[i].boom = true;
      cells.forEach((cl, j) => {
        if (cl.mine && !cl.flag) cl.open = true;
        if (!cl.mine && cl.flag) cl.wrong = true;
        paint(j);
      });
      face.textContent = FACES.lost;
      status.textContent = "¡Boom! Pulsa la carita para volver a intentarlo.";
    }

    function win() {
      state = "won";
      clearInterval(timer);
      cells.forEach((cl, j) => { if (cl.mine && !cl.flag) { cl.flag = true; paint(j); } });
      counter.textContent = pad3(0);
      face.textContent = FACES.won;
      const key = `pf-mines-best-${level}`;
      const prev = load(key);
      const record = prev == null || seconds < +prev;
      if (record) save(key, seconds);
      status.textContent = record ? `¡Has ganado en ${seconds} s! Nuevo mejor tiempo.` : `¡Has ganado en ${seconds} s!`;
      showBest();
    }

    // Ajusta el tamaño de las casillas al espacio disponible
    function fit() {
      const w = wrap.clientWidth - 16 - 12 - 2 * (cols - 1); // padding, borde del tablero y huecos
      const h = wrap.clientHeight - 16 - 12 - 2 * (rows - 1);
      const size = Math.max(16, Math.min(36, Math.floor(Math.min(w / cols, h / rows))));
      board.style.setProperty("--cell", `${size}px`);
    }

    function moveFocus(i) {
      buttons[focusIdx].tabIndex = -1;
      focusIdx = i;
      buttons[i].tabIndex = 0;
      buttons[i].focus();
    }

    /* ---------- Eventos del tablero ---------- */
    let longPress = null;
    let suppressClick = false;
    let lastPointer = "mouse";

    board.addEventListener("click", (e) => {
      const b = e.target.closest(".mc");
      if (!b) return;
      if (suppressClick) { suppressClick = false; return; }
      const i = +b.dataset.i;
      if (flagMode && !cells[i].open) toggleFlag(i);
      else reveal(i);
    });
    board.addEventListener("contextmenu", (e) => {
      const b = e.target.closest(".mc");
      if (!b) return;
      e.preventDefault();
      if (lastPointer !== "mouse") return; // en táctil la bandera va con la pulsación larga
      toggleFlag(+b.dataset.i);
    });
    board.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".mc");
      lastPointer = e.pointerType;
      if (!b || (state !== "playing" && state !== "ready")) return;
      if (e.button === 0) face.textContent = FACES.press;
      if (e.pointerType !== "mouse") {
        clearTimeout(longPress);
        longPress = setTimeout(() => {
          longPress = "done";
          suppressClick = true;
          toggleFlag(+b.dataset.i);
          if (navigator.vibrate) navigator.vibrate(30);
        }, 450);
      }
    });
    const endPress = () => {
      if (state === "playing" || state === "ready") face.textContent = FACES.play;
      if (longPress !== "done") clearTimeout(longPress);
      setTimeout(() => { longPress = null; }, 0);
    };
    board.addEventListener("pointerup", endPress);
    board.addEventListener("pointerleave", endPress);
    board.addEventListener("pointercancel", endPress);

    board.addEventListener("keydown", (e) => {
      const b = e.target.closest(".mc");
      if (!b) return;
      const i = +b.dataset.i;
      const r = Math.floor(i / cols);
      const c = i % cols;
      const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (moves[e.key]) {
        e.preventDefault();
        const nr = Math.min(rows - 1, Math.max(0, r + moves[e.key][0]));
        const nc = Math.min(cols - 1, Math.max(0, c + moves[e.key][1]));
        moveFocus(idx(nr, nc));
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFlag(i);
      }
    });
    board.addEventListener("focusin", (e) => {
      const b = e.target.closest(".mc");
      if (b && +b.dataset.i !== focusIdx) {
        buttons[focusIdx].tabIndex = -1;
        focusIdx = +b.dataset.i;
        b.tabIndex = 0;
      }
    });

    face.addEventListener("click", newGame);
    levelSel.addEventListener("change", () => {
      level = levelSel.value;
      save("pf-mines-level", level);
      focusIdx = 0;
      newGame();
    });

    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    newGame();

    return {
      destroy() {
        clearInterval(timer);
        clearTimeout(longPress);
        ro.disconnect();
      },
    };
  }

  /* ---------- Registro ---------- */
  Object.assign(PF.apps, {
    games: { title: "Juegos", icon: "gamepad", size: [520, 360], render: gamesApp },
    snake: { title: "Snake", icon: "snake", size: [520, 620], render: snakeApp },
    minesweeper: { title: "Buscaminas", icon: "mine", size: [620, 600], render: minesweeperApp },
  });
})();
