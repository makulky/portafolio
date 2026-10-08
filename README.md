# Portafolio — Terminal

Portafolio personal con estética de terminal moderna (prompt por segmentos, pestañas, paleta de comandos y temas). El aspecto CRT original sigue disponible con `theme retro`. HTML, CSS y JavaScript puro: sin dependencias ni build.

## Personalizar
Edita **`data.js`**: perfil, proyectos, experiencia, habilidades (nivel 0–100) y cursos. Todo lo marcado con `TODO` es texto de ejemplo.

## Ver en local
Abre `index.html` en el navegador, o sirve la carpeta:
```
python -m http.server 8000
```

## Comandos
`help`, `about`, `projects`, `experience`, `skills`, `courses`, `contact`, `theme [verde|ambar|dracula|claro|retro]`, `ls`, `cat <archivo>`, `history`, `banner`, `date`, `echo`, `clear`, `reboot` (+ alias en español: `sobremi`, `proyectos`, `experiencia`, `habilidades`, `cursos`, `contacto`, `tema`).

Atajos: ↑/↓ historial · Tab o → autocompletar · Ctrl+K (⌘K) paleta de comandos · Ctrl+L limpiar. Se puede enlazar a una sección con `#projects`, `#skills`, etc. El tema elegido se recuerda, y la secuencia de arranque completa solo aparece en la primera visita (o con `reboot`).

## Publicar en GitHub Pages
1. Sube la carpeta a un repositorio.
2. *Settings → Pages →* rama `main`, carpeta `/ (root)`.
