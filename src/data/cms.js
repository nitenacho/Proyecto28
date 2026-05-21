/* =========================================================
   CMS layer — fetches projects + site settings from Strapi.
   Falls back to static data if CMS is unreachable / unset.
   Env: VITE_CMS_URL = https://your-strapi-cloud.com
   ========================================================= */

import { FALLBACK_PROJECTS, FALLBACK_SITE, GRID_SLOTS } from './fallback.js';

const CMS_URL = (import.meta.env.VITE_CMS_URL || '').replace(/\/$/, '');

async function fetchJSON(path) {
  if (!CMS_URL) throw new Error('VITE_CMS_URL not set');
  const res = await fetch(`${CMS_URL}${path}`);
  if (!res.ok) throw new Error(`CMS ${path}: ${res.status}`);
  return res.json();
}

function mediaURL(media) {
  if (!media) return null;
  // Strapi v5: media has { url } (relative or absolute) at top level when populated
  const url = media.url || media.data?.attributes?.url || null;
  if (!url) return null;
  return url.startsWith('http') ? url : `${CMS_URL}${url}`;
}

function normalizeProject(p) {
  // Strapi v5 attributes live at top-level. Tolerate the older shape too.
  const a = p.attributes || p;
  return {
    slot: a.slot,
    id: a.projectId,
    title: a.title,
    color: a.color || 'cyan',
    status: a.status || '—',
    description: a.description || '',
    tags: Array.isArray(a.tags) ? a.tags : (a.tags?.split?.(',').map((s) => s.trim()) || []),
    redirectURL: a.redirectURL || '#',
    imageURL: mediaURL(a.image),
    modelURL: mediaURL(a.model3D),
    modelShape: a.modelShape || 'icosa',
  };
}

function normalizeSite(s) {
  const a = s.attributes || s;
  return {
    defaults: {
      logo: a.defaultLogo || FALLBACK_SITE.defaults.logo,
      popupPlacement: a.defaultPopupPlacement || FALLBACK_SITE.defaults.popupPlacement,
      tileStyle: a.defaultTileStyle || FALLBACK_SITE.defaults.tileStyle,
      tilt: typeof a.cameraTilt === 'number' ? a.cameraTilt : FALLBACK_SITE.defaults.tilt,
      yaw: typeof a.cameraYaw === 'number' ? a.cameraYaw : FALLBACK_SITE.defaults.yaw,
      cameraDrift: a.cameraDrift ?? FALLBACK_SITE.defaults.cameraDrift,
      showGrid: a.showGrid ?? FALLBACK_SITE.defaults.showGrid,
      showScanlines: a.showScanlines ?? FALLBACK_SITE.defaults.showScanlines,
      showViewfinder: a.showViewfinder ?? FALLBACK_SITE.defaults.showViewfinder,
    },
    logoOptions: FALLBACK_SITE.logoOptions,
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
