/* =========================================================
   CMS layer — fetches projects + site settings from Strapi.
   Falls back to static data if CMS is unreachable / unset.
   Env: VITE_CMS_URL = https://your-strapi-cloud.com
   ========================================================= */

import { FALLBACK_PROJECTS, FALLBACK_SITE, GRID_SLOTS } from './fallback.js';

const CMS_URL = (import.meta.env.VITE_CMS_URL || '').replace(/\/$/, '');

/**
 * @typedef {Object} Project
 * @property {string} slot           Grid slot (Rectangle 4..9)
 * @property {string} id             Short id shown in the HUD (projectId)
 * @property {string} title          Big title in popup
 * @property {'cyan'|'copper'} color
 * @property {string} status         Producción / beta / prototipo / ...
 * @property {string} description    Short paragraph for popup
 * @property {string[]} tags
 * @property {string} redirectURL    Cube click + popup CTA target
 * @property {string|null} imageURL  Cube image (resolved CMS URL)
 * @property {string|null} modelURL  .glb / .gltf for hover model
 * @property {string} modelShape     Fallback procedural shape if no modelURL
 *
 *  -- v2 (Etapa 2/3) campos nuevos --
 * @property {string|null} unrealStreamURL   Pixel Streaming signaling URL for this cube
 * @property {string|null} unrealLevelName   UE Level/SubLevel name (modo 'shared')
 * @property {boolean} unrealEnabled         Toggle streaming on this cube
 * @property {string|null} popupImageURL     Imagen prominente del popup mejorado (Etapa 10)
 * @property {string} popupBody              Richtext markdown del popup
 * @property {string} popupCTALabel          Texto del CTA del popup
 * @property {string|null} videoLoopURL      Video corto alternativo al stream
 */

/**
 * @typedef {Object} SiteContent
 * @property {Object} defaults                  Defaults v1 del Tweaks panel
 * @property {string} defaults.logo
 * @property {string|null} defaults.logoImageURL
 * @property {'side'|'cursor'|'corner'} defaults.popupPlacement
 * @property {string} defaults.tileStyle
 * @property {number} defaults.tilt
 * @property {number} defaults.yaw
 * @property {boolean} defaults.cameraDrift
 * @property {boolean} defaults.showGrid
 * @property {boolean} defaults.showScanlines
 * @property {boolean} defaults.showViewfinder
 * @property {boolean} defaults.gravityEnabled
 *
 * @property {Object} game                       Tweaks del juego (Etapas 4-6)
 * @property {number} game.lightSpeed
 * @property {number} game.jumpHeight
 * @property {number} game.jumpCount
 * @property {number} game.gravity
 * @property {'linear'|'easeOut'|'easeInOut'|'kirby'} game.velocityCurve
 * @property {'cyan'|'red'|'green'} game.lightColor
 * @property {number} game.mouseFollowDelay      Segundos sin WASD antes de seguir mouse
 * @property {number} game.fallDuration          Segundos de caída antes del respawn
 * @property {number} game.shadowSize            Tamaño del anillo de sombra
 *
 * @property {Object} admin                      Toggles admin (Etapas 7-9)
 * @property {boolean} admin.buttonVisible       Botón secreto bajo el logo
 *
 * @property {Object} audio                      Audio interactivo (Etapa 18)
 * @property {boolean} audio.enabled
 * @property {'midi'|'glass'|'soft'} audio.preset
 * @property {number} audio.masterVolume
 * @property {number} audio.hoverVolume
 * @property {number} audio.interactionVolume
 *
 * @property {Object} streaming                  Pixel Streaming (Etapa 11)
 * @property {boolean} streaming.enabled         Master switch global
 * @property {boolean} streaming.previewEnabled  Muestra fallback/preview sin stream activo
 * @property {'shared'|'per-cube'} streaming.mode
 *
 * @property {Array<{value:string,label:string}>} logoOptions
 */

async function fetchJSON(path) {
  if (!CMS_URL) throw new Error('VITE_CMS_URL not set');
  const url = new URL(`${CMS_URL}${path}`);
  url.searchParams.set('_p28ts', String(Date.now()));
  const res = await fetch(url.toString(), {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`CMS ${path}: ${res.status}`);
  return res.json();
}

function mediaURL(media) {
  if (!media) return null;
  // Strapi v5: media has { url } (relative or absolute) at top level when populated
  const asset = media.data?.attributes || media;
  const url = asset.url || null;
  if (!url) return null;
  const resolved = url.startsWith('http') ? url : `${CMS_URL}${url}`;
  const version = asset.hash || asset.updatedAt || asset.id || asset.documentId;
  if (!version) return resolved;
  const sep = resolved.includes('?') ? '&' : '?';
  return `${resolved}${sep}v=${encodeURIComponent(String(version))}`;
}

/** @returns {Project} */
function normalizeProject(p) {
  // Strapi v5 attributes live at top-level. Tolerate the older shape too.
  const a = p.attributes || p;
  return {
    slot: a.slot,
    id: a.projectId,
    title: a.title,
    color: a.color || 'cyan',
    status: a.projectStatus || a.status || '—',
    description: a.description || '',
    tags: Array.isArray(a.tags) ? a.tags : (a.tags?.split?.(',').map((s) => s.trim()) || []),
    redirectURL: a.redirectURL || '#',
    imageURL: mediaURL(a.image),
    modelURL: mediaURL(a.model3D),
    modelShape: a.modelShape || 'icosa',

    // v2 (Etapa 2/3)
    unrealStreamURL: a.unrealStreamURL || null,
    unrealLevelName: a.unrealLevelName || null,
    unrealEnabled: !!a.unrealEnabled,
    popupImageURL: mediaURL(a.popupImage),
    popupBody: a.popupBody || '',
    popupCTALabel: a.popupCTALabel || 'Explorar proyecto',
    videoLoopURL: mediaURL(a.videoLoop),
  };
}

function num(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** @returns {SiteContent} */
function normalizeSite(s) {
  const a = s.attributes || s;
  const fb = FALLBACK_SITE;
  return {
    defaults: {
      logo: a.defaultLogo || fb.defaults.logo,
      logoImageURL: mediaURL(a.brandLogoImage) || null,
      popupPlacement: a.defaultPopupPlacement || fb.defaults.popupPlacement,
      tileStyle: a.defaultTileStyle || fb.defaults.tileStyle,
      tilt: num(a.cameraTilt, fb.defaults.tilt),
      yaw: num(a.cameraYaw, fb.defaults.yaw),
      cameraDrift: a.cameraDrift ?? fb.defaults.cameraDrift,
      showGrid: a.showGrid ?? fb.defaults.showGrid,
      showScanlines: a.showScanlines ?? fb.defaults.showScanlines,
      showViewfinder: a.showViewfinder ?? fb.defaults.showViewfinder,
      gravityEnabled: a.defaultGravityEnabled ?? fb.defaults.gravityEnabled,
    },
    game: {
      lightSpeed: num(parseFloat(a.gameLightSpeed), fb.game.lightSpeed),
      jumpHeight: num(parseFloat(a.gameLightJumpHeight), fb.game.jumpHeight),
      jumpCount: num(a.gameLightJumpCount, fb.game.jumpCount),
      gravity: num(parseFloat(a.gameLightGravity), fb.game.gravity),
      velocityCurve: a.gameLightVelocityCurve || fb.game.velocityCurve,
      lightColor: ['cyan', 'red', 'green'].includes(a.gameLightColor) ? a.gameLightColor : fb.game.lightColor,
      mouseFollowDelay: num(parseFloat(a.gameMouseFollowDelay), fb.game.mouseFollowDelay),
      fallDuration: num(parseFloat(a.gameFallDuration), fb.game.fallDuration),
      shadowSize: num(parseFloat(a.gameShadowSize), fb.game.shadowSize),
    },
    admin: {
      buttonVisible: a.adminButtonVisible ?? fb.admin.buttonVisible,
    },
    audio: {
      enabled: a.audioEnabled ?? fb.audio.enabled,
      preset: ['midi', 'glass', 'soft'].includes(a.audioPreset) ? a.audioPreset : fb.audio.preset,
      masterVolume: num(parseFloat(a.audioMasterVolume), fb.audio.masterVolume),
      hoverVolume: num(parseFloat(a.audioHoverVolume), fb.audio.hoverVolume),
      interactionVolume: num(parseFloat(a.audioInteractionVolume), fb.audio.interactionVolume),
    },
    streaming: {
      enabled: a.pixelStreamingEnabled ?? fb.streaming.enabled,
      previewEnabled: a.pixelStreamingPreviewEnabled ?? fb.streaming.previewEnabled,
      mode: a.pixelStreamingMode || fb.streaming.mode,
    },
    logoOptions: fb.logoOptions,
  };
}

export async function loadContent() {
  // No CMS configured → static fallback
  if (!CMS_URL) {
    return { site: FALLBACK_SITE, projects: FALLBACK_PROJECTS, grid: GRID_SLOTS, source: 'fallback' };
  }
  try {
    const [siteRes, projRes] = await Promise.all([
      fetchJSON('/api/site-setting?populate=*'),
      fetchJSON('/api/projects?populate=*&pagination[pageSize]=50'),
    ]);
    const site = normalizeSite(siteRes.data || siteRes);
    const projects = (projRes.data || []).map(normalizeProject).filter((p) => p.slot);
    return { site, projects, grid: GRID_SLOTS, source: 'cms' };
  } catch (err) {
    console.warn('[cms] failed, using fallback:', err.message);
    return { site: FALLBACK_SITE, projects: FALLBACK_PROJECTS, grid: GRID_SLOTS, source: 'fallback' };
  }
}
