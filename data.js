/* ==========================================================
   CONTENIDO DEL PORTAFOLIO
   ----------------------------------------------------------
   Edita solo este archivo para personalizar tu portafolio.
   Todo lo marcado con "TODO" es texto de ejemplo.
   ========================================================== */
window.PORTFOLIO = {
  profile: {
    name: "Miguel Figuerola Alonso",                     // TODO
    handle: "miguel",                    // TODO: se usa en el prompt (tunombre@portfolio)
    role: "Desarrollador Full Stack",    // TODO
    location: "Huelva, España",              // TODO
    photo: "perfil.png",                     // foto de perfil (vacío = iniciales)
    bio: [
      // TODO: cada string es un párrafo
      "Hola, soy desarrollador Full Stack y Técnico Superior en Desarrollo de Aplicaciones Multiplataforma (DAM), con experiencia en desarrollo web, móvil y de escritorio con JavaScript, TypeScript, React, Next.js, Angular, Node.js y C# / .NET.",
      "Soy propietario y desarrollador de PyFactory (pyfactory.es), una plataforma educativa en producción para aprender Python programando robots que automatizan una fábrica en 3D, construida con Three.js, Pyodide (WebAssembly), Supabase y pagos con Stripe.",
      "He desarrollado aplicaciones SaaS multi-tenant con PostgreSQL, herramientas de ciberseguridad (cifrado AES-256-GCM, protección frente a SSRF, análisis TLS y DNS), aplicaciones Android nativas con Kotlin y Jetpack Compose (con IA mediante Google Gemini), PWA con funcionamiento offline y webs para clientes como freelance.",
      "Experiencia en APIs REST, bases de datos SQL, testing (Vitest), Git, despliegue en Vercel y Netlify, Clean Code y metodologías ágiles."
    ],
    email: "miguelfiguerolaalonso@gmail.com",        // TODO
    links: [
      { label: "GitHub",   url: "https://github.com/makulky" },          // TODO
      { label: "LinkedIn", url: "https://www.linkedin.com/in/miguel-figuerola-alonso" }, // TODO
      // Cambia ?v= cada vez que actualices el PDF para que los navegadores no muestren uno antiguo de su caché
      { label: "CV (PDF)", url: "https://makulky.github.io/portafolio/Miguel_Figuerola_Alonso_CV.pdf?v=2026-11-06" }
    ]
  },

  projects: [
    {
      name: "PyFactory",
      description: [
        "Propietario y desarrollador de PyFactory, una plataforma para aprender Python programando robots que automatizan una fábrica en 3D, directamente en el navegador y sin instalar nada.",
        "Incluye 10 lecciones de iniciación con ejecución paso a paso y visualización de variables, un modo historia de 14 niveles (de un simple mover() a laberintos, cadenas de montaje y una fábrica de drones) y un modo sandbox con varios robots a la vez.",
        "El código Python se ejecuta en un Web Worker con Pyodide (WebAssembly) y el editor CodeMirror resalta la línea en ejecución. Cuenta con cuentas de usuario, guardado de partidas en la nube con Supabase y pago único integrado con Stripe."
      ],
      stack: ["JavaScript", "Vite", "Three.js", "Pyodide", "WebAssembly", "Web Workers", "CodeMirror", "Supabase", "Stripe", "Netlify"],
      link: "",
      demo: "https://pyfactory.es/"
    },

    {
      name: "Kora AI",
      description: [
        "App Android nativa de nutrición y entrenamiento con asesor personal de IA (minSdk 26, targetSdk 37).",
        "Registro de comidas con escáner de códigos de barras EAN / UPC (CameraX + ML Kit) y datos nutricionales de Open Food Facts; rutinas de gimnasio con progresión automática y gráficas de progreso.",
        "Asesor con IA mediante la API REST de Gemini Flash con cliente HTTP propio. Arquitectura MVVM + repositorios, lógica de dominio en funciones puras con tests unitarios, inyección de dependencias con Hilt, base de datos Room con migraciones automáticas y sistema de diseño propio en Jetpack Compose."
      ],
      stack: ["Kotlin", "Jetpack Compose", "Material 3", "MVVM", "Hilt", "Coroutines / Flow", "Room", "DataStore", "Retrofit", "OkHttp", "CameraX", "ML Kit", "Vico", "Gemini API"],
      link: "",
      demo: ""
    },

    {
      name: "Alma",
      description: [
        "App Android de registro de lecturas: biblioteca personal con búsqueda de libros y portadas a través de la API de Open Library, ficha de detalle, calendario de lecturas y estadísticas.",
        "Arquitectura por capas con un paquete por pantalla y base de datos local Room con esquemas exportados para probar las migraciones."
      ],
      stack: ["Kotlin", "Jetpack Compose", "Material 3", "Navigation Compose", "ViewModel", "Room", "KSP", "Retrofit", "Coil", "Open Library API"],
      link: "https://github.com/makulky/alma",
      demo: ""
    },

    {
      name: "Digesta",
      description: [
        "PWA instalable para detectar alimentos que sientan mal: registra comidas por ingredientes y síntomas diarios, analiza qué alimentos se repiten antes del malestar y genera un informe PDF para el médico en el propio dispositivo.",
        "Arquitectura offline-first con IndexedDB y sincronización propia con Supabase entre dispositivos (resolución de conflictos por última edición) y datos aislados por usuario.",
        "Tests con Vitest y fake-indexeddb, cabeceras de seguridad que restringen las conexiones a Supabase y carga diferida de las librerías de exportación."
      ],
      stack: ["PWA", "IndexedDB (Dexie)", "Supabase", "PostgreSQL", "jsPDF", "Vitest", "Vercel"],
      link: "",
      demo: "https://digesta.vercel.app/"
    },

    {
      name: "Dron Kiki Studio",
      description: [
        "Diseño y desarrollo de la web de Dron Kiki Studio, un servicio de grabación aérea con dron (vídeo 360° y vuelos FPV) en Huelva.",
        "Sitio de una sola página con intro animada de telemetría, animaciones ligadas al scroll, galería de trabajos filtrable por categoría e imágenes WebP optimizadas."
      ],
      stack: ["HTML", "CSS", "JavaScript", "GSAP", "Lenis", "Vercel"],
      link: "",
      demo: "https://dronkikistudio.es/"
    },

    {
      name: "Agendalia",
      description: [
        "Agendalia es un SaaS de gestión de citas multiempresa pensado para negocios que trabajan con citas (clínicas, centros de estética, consultas, talleres, academias…).",
        "Arquitectura multi-tenant con roles: cada empresa tiene su propio espacio aislado, con varios usuarios, y cada profesional gestiona su agenda, sus clientes y su página pública de reservas.",
        "Las reservas online usan funciones SQL que evitan dobles reservas concurrentes.",
        "Cuenta de demo: prueba@prueba.com - 123456"
      ],
      stack: ["Next.js", "React 19", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS", "Zod", "FullCalendar"],
      link: "https://github.com/makulky/agendalia",
      demo: "https://agendalia-delta.vercel.app/"
    },

    {
      name: "Astra Simulator",
      description: [
        "Astra es una web educativa con laboratorios visuales en 3D para entender cómo funcionan planetas, estrellas y agujeros negros.",
        "En lugar de leer fórmulas, mueves los parámetros y ves al momento qué cambia y por qué. Render por ray marching en shaders GLSL propios, tests unitarios con Vitest y disponible en español e inglés."
      ],
      stack: ["TypeScript", "React 19", "Vite", "Three.js", "React Three Fiber", "Drei", "GLSL", "Zustand", "i18next", "Vitest"],
      link: "https://github.com/makulky/astra",
      demo: "https://astrasimulator.vercel.app/"
    },

    {
      name: "WebSec Analyzer",
      description: [
        "Aplicación web que analiza de forma pasiva la seguridad de un sitio (TLS, cabeceras, DNS y phishing) y estima con una puntuación de confianza si es fiable o un posible scam.",
        "Backend endurecido frente a SSRF e integración con las APIs de Google Safe Browsing y VirusTotal."
      ],
      stack: ["Node.js", "Express", "Cheerio", "JavaScript", "HTML", "CSS", "Google Safe Browsing", "VirusTotal"],
      link: "https://github.com/makulky/webSecAnalyzer",
      demo: "https://websec-analyzer.vercel.app/"
    },

    {
      name: "WhisperLink",
      description: [
        "Comparte secretos mediante enlaces de un solo uso, cifrados de extremo a extremo (AES-256-GCM) en el navegador.",
        "Lectura y borrado atómicos, protección opcional con contraseña y caducidad."
      ],
      stack: ["JavaScript", "Node.js", "Web Crypto API", "Upstash Redis", "SQLite", "HTML", "CSS", "Vercel"],
      link: "https://github.com/makulky/whisperlink",
      demo: "https://whisperlink-phi.vercel.app/"
    },

    {
      name: "Sistema de Control Horario y Fichaje por Código QR",
      description: [
        "Aplicación completa para la gestión y registro automatizado de jornadas laborales mediante escaneo de código QR único por empleado."
      ],
      stack: ["C#", ".NET", "MySQL"],
      link: "",
      demo: ""
    },
  ],

  experience: [
    {
      role: "Propietario y Desarrollador",
      company: "PyFactory",
      period: "Octubre 2026 – Actualidad",
      achievements: [
        "Diseño, desarrollo, despliegue y comercialización de la plataforma educativa pyfactory.es y de su web."
      ]
    },
    {
      role: "Desarrollador y Diseñador Web",
      company: "Freelance",
      period: "Noviembre 2025 – Actualidad",
      achievements: [
        "Proyectos web en trato directo con clientes (p. ej. dronkikistudio.es).",
        "Autonomía, cumplimiento riguroso de plazos y alta orientación al detalle y la calidad."
      ]
    },
    {
      role: "Técnico / Desarrollador de Software",
      company: "Liser Informática",
      period: "Marzo 2026 – Julio 2026",
      achievements: [
        "Optimización de herramientas de gestión empresarial y bases de datos.",
        "Resolución de incidencias técnicas y tareas de soporte."
      ]
    },
    {
      role: "Técnico de Soporte en Tienda y Atención al Cliente",
      company: "El Corte Inglés",
      period: "Marzo 2014 – Julio 2014",
      achievements: [
        "Resolución de incidencias en sistemas TPV, cajas registradoras y periféricos.",
        "Atención al cliente y control de stock en tienda, trabajando en equipo."
      ]
    }
  ],

  // level: 0 a 100
  skills: [
    {
      category: "Lenguajes",
      items: [
        { name: "JavaScript", level: 90 },
        { name: "TypeScript", level: 90 },
        { name: "Java", level: 80 },
        { name: "C#", level: 90 },
        { name: "Python", level: 75 },
        { name: "PHP", level: 75 },
        { name: "SQL", level: 90 },
        { name: "Kotlin", level: 75 },
      ]
    },
    {
      category: "Frontend",
      items: [
        { name: "React", level: 85 },
        { name: "Next.js", level: 80 },
        { name: "Angular", level: 85 },
        { name: "HTML / CSS", level: 90 },
        { name: "Tailwind", level: 75 },
        { name: "Three.js", level: 75 }
      ]
    },
    {
      category: "Móvil",
      items: [
        { name: "Android / Jetpack Compose", level: 75 },
        { name: ".NET MAUI", level: 75 },
        { name: "PWA", level: 80 }
      ]
    },
    {
      category: "Backend y herramientas",
      items: [
        { name: "Node.js", level: 90 },
        { name: "ASP.NET Core", level: 80 },
        { name: "Spring Boot", level: 80 },
        { name: "PostgreSQL / Supabase", level: 80 },
        { name: "Git", level: 90 },
        { name: "Django", level: 75 },
        { name: "Docker", level: 80 },
        { name: "Laravel", level: 75 },
        { name: "Linux", level: 80 }
      ]
    }
  ],

  courses: [
    {
      name: "Técnico Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)",
      institution: "I.E.S. La Marisma",
      year: "2025",
      link: "#"
    },
    {
      name: "Desarrollo Móvil Avanzado (.NET MAUI)",
      institution: "Udemy",
      year: "2025",
      link: "#"
    },
    {
      name: "Desarrollo con Node.js: Testing y Seguridad",
      institution: "Udemy",
      year: "2025",
      link: "#"
    },
    {
      name: "Mejores Prácticas de Seguridad Web",
      institution: "Udemy",
      year: "2025",
      link: "#"
    },
    {
      name: "Python 3: Data Analysis y Matplotlib",
      institution: "Udemy",
      year: "2025",
      link: "#"
    },
    {
      name: "Técnico en Sistemas Microinformáticos y Redes (SMR)",
      institution: "I.E.S. La Marisma",
      year: "2014",
      link: "#"
    },
  ]
};
