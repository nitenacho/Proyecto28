'use strict';

/**
 * Strapi lifecycle hooks.
 *
 * On first boot:
 *  1. Grant Public role read access to /api/projects + /api/site-setting + media
 *     so the static site can fetch content without an API token.
 *     AdminWhitelist se MANTIENE privado (no se expone públicamente).
 *  2. Seed the singleton "Site Setting" + 6 sample projects + admin whitelist
 *     si la tabla está vacía.
 *  3. Backfill: si SiteSetting ya existía pero le faltan campos nuevos del
 *     schema v2 (Etapa 2), aplicar defaults sin sobrescribir lo que ya hay.
 *
 * Re-running boot no duplica datos: chequea existencia antes de crear.
 */

const SAMPLE_PROJECTS = [
  {
    slot: 'Rectangle 9',
    projectId: '028.A', title: 'Holograma', status: 'EN PRODUCCIÓN', color: 'cyan',
    description: 'Bot conversacional con memoria persistente, multi-canal y voz. Vive en 3 servidores de Discord y aprende de cada interacción.',
    tags: ['Discord.js', 'OpenAI', 'Postgres', 'Node 20'],
    redirectURL: 'https://github.com/nitenacho/Proyecto28',
    modelShape: 'icosa', order: 1,
  },
  {
    slot: 'Rectangle 8',
    projectId: '028.B', title: 'Atlas Móvil', status: 'BETA', color: 'cyan',
    description: 'Mapa interactivo 3D para una expedición patagónica. Datos en vivo, capas geoespaciales, captura offline.',
    tags: ['React', 'Mapbox', 'Three.js', 'Supabase'],
    redirectURL: '/proyectos/atlas-movil',
    modelShape: 'torus', order: 2,
  },
  {
    slot: 'Rectangle 7',
    projectId: '028.C', title: 'Saturno Engine', status: 'PROTOTIPO', color: 'cyan',
    description: 'Sandbox de física para un videojuego indie de exploración espacial. Editor de niveles con replays cinemáticos.',
    tags: ['Unreal Engine 5', 'Blueprints', 'C++', 'Niagara'],
    redirectURL: '/proyectos/saturno-engine',
    modelShape: 'octa', order: 3,
  },
  {
    slot: 'Rectangle 6',
    projectId: '028.D', title: 'Línea Cero', status: 'EN PRODUCCIÓN', color: 'cyan',
    description: 'Automatización end-to-end para un estudio de fotografía: ingesta, etiquetado IA, entrega al cliente.',
    tags: ['n8n', 'OpenAI Vision', 'S3', 'Resend'],
    redirectURL: '/proyectos/linea-cero',
    modelShape: 'dodeca', order: 4,
  },
  {
    slot: 'Rectangle 5',
    projectId: '028.E', title: 'Cabina HUD', status: 'EN PRODUCCIÓN', color: 'copper',
    description: 'Dashboard operacional para un equipo de logística. Telemetría en tiempo real, alertas, replay de incidentes.',
    tags: ['Next.js', 'Tailwind', 'WebSockets', 'TimescaleDB'],
    redirectURL: '/proyectos/cabina-hud',
    modelShape: 'tetra', order: 5,
  },
  {
    slot: 'Rectangle 4',
    projectId: '028.F', title: 'Eco Sur', status: 'ARCHIVADO', color: 'copper',
    description: 'Experiencia AR para una muestra de arte contemporánea. WebXR sin app, escaneo de markers impresos.',
    tags: ['WebXR', 'A-Frame', 'GLTF'],
    redirectURL: '/proyectos/eco-sur',
    modelShape: 'torusKnot', order: 6,
  },
];

const ADMIN_WHITELIST_SEED = [
  { email: 'inconcha@gmail.com', role: 'owner', note: 'Dueño del proyecto.' },
  { email: 'cnignacioa@gmail.com', role: 'owner', note: 'Dueño del proyecto (cuenta alterna).' },
  { email: 'yk8arts@gmail.com', role: 'editor', note: 'Editor autorizado.' },
];

const SITE_SETTING_DEFAULTS = {
  // v1 (existentes)
  defaultLogo: 'PROYECTO 28',
  defaultPopupPlacement: 'cursor',
  defaultTileStyle: 'cyan-copper',
  cameraTilt: 58,
  cameraYaw: 0,
  cameraDrift: true,
  showGrid: true,
  showScanlines: false,
  showViewfinder: true,
  // v2 (Etapa 2)
  gameLightSpeed: 8.0,
  gameLightJumpHeight: 3.0,
  gameLightJumpCount: 4,
  gameLightGravity: 20.0,
  gameLightVelocityCurve: 'kirby',
  gameMouseFollowDelay: 1.0,
  gameFallDuration: 1.0,
  adminButtonVisible: false,
  pixelStreamingEnabled: false,
  pixelStreamingMode: 'shared',
};

async function grantPublicReadAccess(strapi) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!publicRole) return;

  const allow = [
    'api::project.project.find',
    'api::project.project.findOne',
    'api::site-setting.site-setting.find',
    'plugin::upload.content-api.find',
    'plugin::upload.content-api.findOne',
  ];

  for (const action of allow) {
    const existing = await strapi
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: publicRole.id } });
    if (existing) {
      if (!existing.enabled) {
        await strapi
          .query('plugin::users-permissions.permission')
          .update({ where: { id: existing.id }, data: { enabled: true } });
      }
    } else {
      await strapi
        .query('plugin::users-permissions.permission')
        .create({ data: { action, enabled: true, role: publicRole.id } });
    }
  }

  // AdminWhitelist: explicit DENY for public. Si el endpoint existe pero el
  // permiso público está deshabilitado o ausente, las llamadas no autenticadas
  // devuelven 403. Aquí solo nos aseguramos de NO crearlo enabled.
  const denyActions = [
    'api::admin-whitelist.admin-whitelist.find',
    'api::admin-whitelist.admin-whitelist.findOne',
    'api::admin-whitelist.admin-whitelist.create',
    'api::admin-whitelist.admin-whitelist.update',
    'api::admin-whitelist.admin-whitelist.delete',
  ];
  for (const action of denyActions) {
    const existing = await strapi
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: publicRole.id } });
    if (existing && existing.enabled) {
      await strapi
        .query('plugin::users-permissions.permission')
        .update({ where: { id: existing.id }, data: { enabled: false } });
    }
  }

  strapi.log.info('[bootstrap] permissions ensured (public read + admin-whitelist private).');
}

async function seedIfEmpty(strapi) {
  // 1. Projects (collection)
  const projectCount = await strapi.db.query('api::project.project').count();
  if (projectCount === 0) {
    strapi.log.info('[bootstrap] seeding 6 sample projects...');
    for (const data of SAMPLE_PROJECTS) {
      await strapi.entityService.create('api::project.project', {
        data: { ...data, publishedAt: new Date() },
      });
    }
  }

  // 2. SiteSetting (singleton): si no existe → crear con defaults v1+v2.
  //    Si existe → backfill solo los campos v2 que estén null/undefined.
  const site = await strapi.db.query('api::site-setting.site-setting').findOne({});
  if (!site) {
    strapi.log.info('[bootstrap] seeding site-setting singleton with v1+v2 defaults...');
    await strapi.entityService.create('api::site-setting.site-setting', {
      data: SITE_SETTING_DEFAULTS,
    });
  } else {
    // Backfill: solo escribe campos que estén faltantes (null/undefined).
    const patch = {};
    for (const [key, value] of Object.entries(SITE_SETTING_DEFAULTS)) {
      if (site[key] === null || site[key] === undefined) {
        patch[key] = value;
      }
    }
    if (Object.keys(patch).length > 0) {
      strapi.log.info(
        `[bootstrap] backfilling site-setting fields: ${Object.keys(patch).join(', ')}`
      );
      await strapi.entityService.update('api::site-setting.site-setting', site.id, {
        data: patch,
      });
    }
  }

  // 3. AdminWhitelist (collection): upsert por email para que el seed se
  //    aplique aunque la tabla ya tenga registros (ej. cuando agregamos un
  //    email nuevo al array y queremos backfill en producción).
  for (const data of ADMIN_WHITELIST_SEED) {
    const existing = await strapi.db
      .query('api::admin-whitelist.admin-whitelist')
      .findOne({ where: { email: data.email } });
    if (!existing) {
      strapi.log.info(`[bootstrap] seeding admin whitelist: ${data.email} (${data.role})`);
      await strapi.entityService.create('api::admin-whitelist.admin-whitelist', { data });
    }
  }
}

module.exports = {
  register() {},
  async bootstrap({ strapi }) {
    try {
      await grantPublicReadAccess(strapi);
      await seedIfEmpty(strapi);
    } catch (err) {
      strapi.log.error('[bootstrap] failed', err);
    }
  },
};
