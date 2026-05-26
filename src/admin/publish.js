import { getCurrentUser, signIn } from '../auth/google.js';

const CMS_URL = (import.meta.env.VITE_CMS_URL || '').replace(/\/$/, '');

const PUBLISHABLE_KEYS = new Set([
  'logo',
  'popupPlacement',
  'tileStyle',
  'tilt',
  'yaw',
  'cameraDrift',
  'showGrid',
  'showScanlines',
  'showViewfinder',
  'gravityEnabled',
  'gameLightSpeed',
  'gameJumpHeight',
  'gameJumpCount',
  'gameGravity',
  'gameVelocityCurve',
  'gameMouseFollowDelay',
  'gameFallDuration',
  'gameShadowSize',
  'streamingEnabled',
  'streamingPreviewEnabled',
  'streamingMode',
  'adminButtonVisible',
]);

function normalizeComparable(value) {
  if (Number.isFinite(value)) return Number(value.toFixed(4));
  return value;
}

function pickPublishable(state) {
  const picked = {};
  for (const [key, value] of Object.entries(state || {})) {
    if (PUBLISHABLE_KEYS.has(key)) picked[key] = value;
  }
  return picked;
}

function diffStates(current, baseline) {
  const diff = {};
  const publishable = pickPublishable(current);
  for (const [key, value] of Object.entries(publishable)) {
    const from = normalizeComparable(baseline?.[key]);
    const to = normalizeComparable(value);
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      diff[key] = { from: baseline?.[key] ?? null, to: value };
    }
  }
  return diff;
}

function errorMessageFromResponse(status, payload) {
  return (
    payload?.error?.message ||
    payload?.message ||
    payload?.detail ||
    `Publish failed (${status})`
  );
}

async function getPublishBearerToken() {
  let user = getCurrentUser();
  if (user?.accessToken) return user.accessToken;

  // v0.16.1: sesiones antiguas podían tener sólo idToken cacheado. Para
  // publicar, preferimos renovar con el flujo OAuth explícito y mandar accessToken.
  if (!user?.idToken) {
    user = await signIn();
    const token = user?.accessToken || user?.idToken || '';
    if (token) return token;
    throw new Error('Inicia sesión con Google antes de publicar.');
  }

  try {
    const refreshed = await signIn();
    const token = refreshed?.accessToken || refreshed?.idToken || '';
    if (token) return token;
  } catch (err) {
    console.warn('[p28 publish] could not refresh Google token:', err.message);
  }

  return user.idToken;
}

export async function publishTweaksSnapshot({ state, baseline }) {
  if (!CMS_URL) {
    throw new Error('CMS no configurado: falta VITE_CMS_URL.');
  }

  const bearerToken = await getPublishBearerToken();

  const snapshot = pickPublishable(state);
  const diff = diffStates(snapshot, baseline);
  const res = await fetch(`${CMS_URL}/api/publish`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({ state: snapshot, diff }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.ok === false) {
    throw new Error(errorMessageFromResponse(res.status, payload));
  }

  return { ...payload, diff };
}
