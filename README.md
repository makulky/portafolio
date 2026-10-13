# Portafolio — PortfolioOS

Portafolio personal con forma de sistema operativo al estilo de Windows 11: pantalla de arranque y de bloqueo, escritorio con iconos, ventanas que se pueden mover, redimensionar y acoplar, barra de tareas, menú Inicio con buscador, ajustes de fondo, modo claro/oscuro y color de énfasis, y un visor de PDF para el CV. La terminal anterior sigue disponible como app. HTML, CSS y JavaScript puro: sin dependencias ni build.

## Personalizar
Edita **`data.js`**: perfil, proyectos, experiencia, habilidades (nivel 0–100) y cursos. Todo lo marcado con `TODO` es texto de ejemplo.

## Estructura
- `ui.js`: utilidades DOM y vistas de cada sección (las comparten las ventanas y la terminal).
- `apps.js`: iconos y apps del escritorio (Sobre mí, Proyectos, Experiencia, Habilidades, Cursos, Contacto, CV, Terminal, Configuración).
- `terminal.js`: la app Terminal.
- `os.js`: gestor de ventanas, barra de tareas, menú Inicio, escritorio, bloqueo y ajustes.

## Ver en local
Sirve la carpeta (el visor de PDF y algunos navegadores lo necesitan):
```
python -m http.server 8000
```

## Uso
- Doble clic en un icono abre la app (un toque en móvil). Clic derecho en el escritorio abre el menú contextual.
- Arrastra una ventana al borde izquierdo o derecho para acoplarla y arriba para maximizarla. Doble clic en la barra de título maximiza o restaura.
- **Ctrl+K** (⌘K) abre el menú Inicio, que busca apps, proyectos y ajustes, o ejecuta lo escrito en la Terminal.
- Enlaces directos: `#projects`, `#skills`, `#contact`, `#cv`, `#terminal`… abren esa ventana y se saltan el arranque.
- En pantallas de menos de 700 px se activa el modo tablet: las apps se ven en cuadrícula y las ventanas ocupan toda la pantalla.
- La secuencia de arranque y bloqueo solo aparece en la primera visita; se puede repetir con el botón de apagado del menú Inicio.

## Comandos de la Terminal
`help`, `about`, `projects`, `experience`, `skills`, `courses`, `contact`, `open <app>`, `theme [verde|ambar|dracula|claro|retro]`, `ls`, `cat <archivo>`, `history`, `banner`, `date`, `echo`, `clear`, `reboot`, `exit` (+ alias en español: `sobremi`, `proyectos`, `experiencia`, `habilidades`, `cursos`, `contacto`, `tema`, `abrir`).

## Publicar en GitHub Pages
1. Sube la carpeta a un repositorio.
2. *Settings → Pages →* rama `main`, carpeta `/ (root)`.
