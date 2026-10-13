/* ==========================================================
   Utilidades de DOM y vistas de cada sección
   (las comparten la terminal y las ventanas del escritorio)
   ========================================================== */
(function () {
  "use strict";

  const DATA = window.PORTFOLIO;
  const P = DATA.profile;

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

  // Tono estable por tecnología para colorear las etiquetas
  function hue(text) {
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  const paragraphs = (value) => [].concat(value || []);

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  // Rellena un avatar con la foto de perfil (o las iniciales si no hay o no carga)
  function fillAvatar(node) {
    node.textContent = initials(P.name);
    if (!P.photo) return node;
    const img = el("img");
    img.src = P.photo;
    img.alt = P.name;
    img.addEventListener("error", () => img.remove());
    node.append(img); // tapa las iniciales al cargar
    return node;
  }

  function avatar(cls) {
    return fillAvatar(el("div", "avatar" + (cls ? " " + cls : "")));
  }

  const cvLink = P.links.find((l) => /cv/i.test(l.label));

  /* ---------- Vistas ---------- */
  // `extra`: nodos opcionales que se añaden al final (la terminal pone un tip)
  function renderAbout(extra) {
    const nodes = [heading("Sobre mí")];
    nodes.push(kv("nombre", P.name), kv("rol", P.role), kv("ubicación", P.location), gap());
    paragraphs(P.bio).forEach((para) => nodes.push(line(para, "para"), gap()));
    return nodes.concat(extra || []);
  }

  function tagList(stack) {
    const tags = el("div", "tags");
    (stack || []).forEach((t) => {
      const tag = el("span", "tag", t);
      tag.style.setProperty("--h", hue(t));
      tags.append(tag);
    });
    return tags;
  }

  function projectCard(proj, i) {
    const card = el("article", "card");

    const head = el("div", "card-head");
    head.append(el("span", "card-idx", String(i + 1).padStart(2, "0")), el("h3", "card-title", proj.name));
    card.append(head);

    const body = el("div", "card-body");
    paragraphs(proj.description).forEach((t) => body.append(el("p", null, t)));
    card.append(body, tagList(proj.stack));

    const links = el("div", "card-links");
    if (proj.demo) links.append(btnLink("↗ demo", proj.demo, true));
    if (proj.link) links.append(btnLink("</> código", proj.link));
    if (!proj.demo && !proj.link) links.append(el("span", "muted", "proyecto privado"));
    card.append(links);
    return card;
  }

  function renderProjects() {
    const nodes = [heading("Proyectos"), line(`${DATA.projects.length} proyectos · los que tienen demo se pueden probar online`, "muted")];
    DATA.projects.forEach((proj, i) => nodes.push(projectCard(proj, i)));
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
    if (cvLink) {
      // Los enlaces a PDF se abren en el visor del escritorio; el de descarga no
      const download = btnLink("↓ Descargar CV", cvLink.url);
      download.setAttribute("download", "");
      actions.append(btnLink("Ver CV", cvLink.url), download);
    }
    nodes.push(actions);
    return nodes;
  }

  window.PF = {
    DATA,
    P,
    cvUrl: cvLink ? cvLink.url : "",
    el,
    line,
    rich,
    link,
    btnLink,
    gap,
    heading,
    kv,
    hue,
    paragraphs,
    initials,
    avatar,
    fillAvatar,
    tagList,
    projectCard,
    render: {
      about: renderAbout,
      projects: renderProjects,
      experience: renderExperience,
      skills: renderSkills,
      courses: renderCourses,
      contact: renderContact,
    },
  };
})();
