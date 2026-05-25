/* =========================================================
   Fallback static data — used when Strapi is unreachable
   or the env var VITE_CMS_URL isn't configured.
   Mirrors the schema of /api/projects + /api/site-setting (v2).
   Shape documented in cms.js (JSDoc typedefs Project + SiteContent).
   ========================================================= */

export const FALLBACK_SITE = {
  logoOptions: [
    { value: 'PROYECTO 28', label: 'P28' },
    { value: 'NEIT.',       label: 'NEIT' },
    { value: 'ESTUDIO 028', label: 'EST' },
  ],
  defaults: {
    logo: 'PROYECTO 28',
    popupPlacement: 'cursor',
    tileStyle: 'cyan-copper',
    tilt: 49,                 // v0.9.2: ajuste fino del owner
    yaw: -40,                 // v0.9.2: ajuste fino del owner
    cameraDrift: true,
    showGrid: true,
    showScanlines: false,
    showViewfinder: true,
    gravityEnabled: true,     // v0.9.2: físicas activas por default (antes opt-in)
  },

  // v2 (Etapa 2/3) — match SiteSetting schema defaults
  game: {
    lightSpeed: 5.0,
    jumpHeight: 1.5,           // v0.9.2: ajuste fino del owner (antes 2.5)
    jumpCount: 4,
    gravity: 30.0,             // v0.9.2: ajuste fino del owner (antes 16.0)
    velocityCurve: 'kirby',
    mouseFollowDelay: 1.0,
    fallDuration: 1.0,
    shadowSize: 0.3,           // v0.9.2: ajuste fino del owner (antes 0.45)
  },
  admin: {
    buttonVisible: true,        // v0.12.0: botón admin visible por default (Etapa 8)
  },
  streaming: {
    enabled: false,
    previewEnabled: false,
    mode: 'shared',
  },
};

const V2_PROJECT_DEFAULTS = {
  unrealStreamURL: null,
  unrealLevelName: null,
  unrealEnabled: false,
  popupImageURL: null,
  popupBody: '',
  popupCTALabel: 'Explorar proyecto',
  videoLoopURL: null,
};

export const FALLBACK_PROJECTS = [
  {
    slot: 'Rectangle 9',
    id: '028.A', title: 'Holograma', color: 'cyan', status: 'EN PRODUCCIÓN',
    description: 'Bot conversacional con memoria persistente, multi-canal y voz. Vive en 3 servidores de Discord y aprende de cada interacción.',
    tags: ['Discord.js', 'OpenAI', 'Postgres', 'Node 20'],
    redirectURL: 'https://github.com/nitenacho/Proyecto28',
    imageURL: null,
    modelURL: null,
    modelShape: 'icosa',
    ...V2_PROJECT_DEFAULTS,
  },
  {
    slot: 'Rectangle 8',
    id: '028.B', title: 'Atlas Móvil', color: 'cyan', status: 'BETA',
    description: 'Mapa interactivo 3D para una expedición patagónica. Datos en vivo, capas geoespaciales, captura offline.',
    tags: ['React', 'Mapbox', 'Three.js', 'Supabase'],
    redirectURL: '/proyectos/atlas-movil',
    imageURL: null,
    modelURL: null,
    modelShape: 'torus',
    ...V2_PROJECT_DEFAULTS,
  },
  {
    slot: 'Rectangle 7',
    id: '028.C', title: 'Saturno Engine', color: 'cyan', status: 'PROTOTIPO',
    description: 'Sandbox de física para un videojuego indie de exploración espacial. Editor de niveles con replays cinemáticos.',
    tags: ['Unreal Engine 5', 'Blueprints', 'C++', 'Niagara'],
    redirectURL: '/proyectos/saturno-engine',
    imageURL: null,
    modelURL: null,
    modelShape: 'octa',
    ...V2_PROJECT_DEFAULTS,
  },
  {
    slot: 'Rectangle 6',
    id: '028.D', title: 'Línea Cero', color: 'cyan', status: 'EN PRODUCCIÓN',
    description: 'Automatización end-to-end para un estudio de fotografía: ingesta, etiquetado IA, entrega al cliente.',
    tags: ['n8n', 'OpenAI Vision', 'S3', 'Resend'],
    redirectURL: '/proyectos/linea-cero',
    imageURL: null,
    modelURL: null,
    modelShape: 'dodeca',
    ...V2_PROJECT_DEFAULTS,
  },
  {
    slot: 'Rectangle 5',
    id: '028.E', title: 'Cabina HUD', color: 'copper', status: 'EN PRODUCCIÓN',
    description: 'Dashboard operacional para un equipo de logística. Telemetría en tiempo real, alertas, replay de incidentes.',
    tags: ['Next.js', 'Tailwind', 'WebSockets', 'TimescaleDB'],
    redirectURL: '/proyectos/cabina-hud',
    imageURL: null,
    modelURL: null,
    modelShape: 'tetra',
    ...V2_PROJECT_DEFAULTS,
  },
  {
    slot: 'Rectangle 4',
    id: '028.F', title: 'Eco Sur', color: 'copper', status: 'ARCHIVADO',
    description: 'Experiencia AR para una muestra de arte contemporáneo. WebXR sin app, escaneo de markers impresos.',
    tags: ['WebXR', 'A-Frame', 'GLTF'],
    redirectURL: '/proyectos/eco-sur',
    imageURL: null,
    modelURL: null,
    modelShape: 'torusKnot',
    ...V2_PROJECT_DEFAULTS,
  },
];

export const GRID_SLOTS = [
  ['Rectangle 20', 'Rectangle 9',  'Rectangle 19', 'Rectangle 18', 'Rectangle 17', 'Rectangle 8' ],
  ['Rectangle 16', 'Rectangle 15', 'Rectangle 14', 'Rectangle 7',  'Rectangle 13', 'Rectangle 12'],
  ['Rectangle 11', 'Rectangle 5',  'Rectangle 10', 'Rectangle 21', 'Rectangle 4',  'Rectangle 22'],
  ['Rectangle 23', 'Rectangle 24', 'Rectangle 6',  'Rectangle 25', 'Rectangle 26', 'Rectangle 27'],
];
