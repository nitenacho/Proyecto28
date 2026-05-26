import { getCurrentUser } from '../auth/google.js';

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

export async function publishTweaksSnapshot({ state, baseline }) {
  if (!CMS_URL) {
    throw new Error('CMS no configurado: falta VITE_CMS_URL.');
  }

  const user = getCurrentUser();
  if (!user?.idToken) {
    throw new Error('Inicia sesión con Google antes de publicar.');
  }

  const snapshot = pickPublishable(state);
  const diff = diffStates(snapshot, baseline);
  const res = await fetch(`${CMS_URL}/api/publish`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${user.idToken}`,
    },
    body: JSON.stringify({ state: snapshot, diff }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.ok === false) {
    throw new Error(errorMessageFromResponse(res.status, payload));
  }

  return { ...payload, diff };
}
