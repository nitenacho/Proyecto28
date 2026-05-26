'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  '644563573486-5pe2jvatetd46oke9ns8gskdt0jgsfi6.apps.googleusercontent.com';

const FIELD_MAP = {
  logo: 'defaultLogo',
  popupPlacement: 'defaultPopupPlacement',
  tileStyle: 'defaultTileStyle',
  tilt: 'cameraTilt',
  yaw: 'cameraYaw',
  cameraDrift: 'cameraDrift',
  showGrid: 'showGrid',
  showScanlines: 'showScanlines',
  showViewfinder: 'showViewfinder',
  gravityEnabled: 'defaultGravityEnabled',
  gameLightSpeed: 'gameLightSpeed',
  gameJumpHeight: 'gameLightJumpHeight',
  gameJumpCount: 'gameLightJumpCount',
  gameGravity: 'gameLightGravity',
  gameVelocityCurve: 'gameLightVelocityCurve',
  gameMouseFollowDelay: 'gameMouseFollowDelay',
  gameFallDuration: 'gameFallDuration',
  gameShadowSize: 'gameShadowSize',
  streamingEnabled: 'pixelStreamingEnabled',
  streamingPreviewEnabled: 'pixelStreamingPreviewEnabled',
  streamingMode: 'pixelStreamingMode',
  adminButtonVisible: 'adminButtonVisible',
};

const RULES = {
  defaultLogo: { type: 'enum', values: ['PROYECTO 28', 'NEIT.', 'ESTUDIO 028'] },
  defaultPopupPlacement: { type: 'enum', values: ['side', 'cursor', 'corner'] },
  defaultTileStyle: { type: 'enum', values: ['cyan-copper', 'cyan-only', 'copper-only', 'mono'] },
  cameraTilt: { type: 'int', min: 30, max: 75 },
  cameraYaw: { type: 'int', min: -60, max: 60 },
  cameraDrift: { type: 'bool' },
  showGrid: { type: 'bool' },
  showScanlines: { type: 'bool' },
  showViewfinder: { type: 'bool' },
  defaultGravityEnabled: { type: 'bool' },
  gameLightSpeed: { type: 'number', min: 1, max: 30 },
  gameLightJumpHeight: { type: 'number', min: 0.5, max: 10 },
  gameLightJumpCount: { type: 'int', min: 1, max: 8 },
  gameLightGravity: { type: 'number', min: 5, max: 60 },
  gameLightVelocityCurve: { type: 'enum', values: ['linear', 'easeOut', 'easeInOut', 'kirby'] },
  gameMouseFollowDelay: { type: 'number', min: 0, max: 5 },
  gameFallDuration: { type: 'number', min: 0.2, max: 3 },
  gameShadowSize: { type: 'number', min: 0.15, max: 1.2 },
  adminButtonVisible: { type: 'bool' },
  pixelStreamingEnabled: { type: 'bool' },
  pixelStreamingPreviewEnabled: { type: 'bool' },
  pixelStreamingMode: { type: 'enum', values: ['shared', 'per-cube'] },
};

function extractBearer(ctx) {
  const header = ctx.get('authorization') || ctx.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeValue(value, rule) {
  if (rule.type === 'bool') {
    if (typeof value === 'boolean') return { ok: true, value };
    if (value === 'true') return { ok: true, value: true };
    if (value === 'false') return { ok: true, value: false };
    return { ok: false, reason: 'expected boolean' };
  }

  if (rule.type === 'enum') {
    if (rule.values.includes(value)) return { ok: true, value };
    return { ok: false, reason: `expected one of: ${rule.values.join(', ')}` };
  }

  if (rule.type === 'number' || rule.type === 'int') {
    const n = Number(value);
    if (!Number.isFinite(n)) return { ok: false, reason: 'expected number' };
    if (n < rule.min || n > rule.max) {
      return { ok: false, reason: `expected ${rule.min}..${rule.max}` };
    }
    if (rule.type === 'int') {
      if (!Number.isInteger(n)) return { ok: false, reason: 'expected integer' };
      return { ok: true, value: n };
    }
    return { ok: true, value: Number(n.toFixed(4)) };
  }

  return { ok: false, reason: 'unsupported rule' };
}

function normalizePayload(state) {
  const patch = {};
  const ignored = {};
  for (const [stateKey, value] of Object.entries(state || {})) {
    const siteKey = FIELD_MAP[stateKey];
    if (!siteKey) {
      ignored[stateKey] = 'not publishable';
      continue;
    }
    const result = sanitizeValue(value, RULES[siteKey]);
    if (!result.ok) {
      ignored[stateKey] = result.reason;
      continue;
    }
    patch[siteKey] = result.value;
  }
  return { patch, ignored };
}

function comparableForField(key, value) {
  const rule = RULES[key];
  if (!rule) return value;
  if (rule.type === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? Number(n.toFixed(4)) : value;
  }
  if (rule.type === 'int') {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  return value;
}

function diffPatch(current, patch) {
  const changed = {};
  for (const [key, to] of Object.entries(patch)) {
    const from = current?.[key] ?? null;
    if (JSON.stringify(comparableForField(key, from)) !== JSON.stringify(comparableForField(key, to))) {
      changed[key] = { from, to };
    }
  }
  return changed;
}

async function verifyGoogleUser(strapi, idToken) {
  if (!idToken) {
    const err = new Error('Missing Google id_token');
    err.status = 401;
    throw err;
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) {
    const err = new Error('Invalid Google id_token');
    err.status = 401;
    throw err;
  }

  const token = await res.json();
  const email = String(token.email || '').trim().toLowerCase();
  if (token.aud !== GOOGLE_CLIENT_ID || !emailLooksValid(email) || String(token.email_verified) !== 'true') {
    const err = new Error('Google token rejected');
    err.status = 401;
    throw err;
  }

  const record = await strapi.db.query('api::admin-whitelist.admin-whitelist').findOne({
    where: { email },
    select: ['role'],
  });
  if (!record) {
    const err = new Error('Email not allowed');
    err.status = 403;
    throw err;
  }

  return { email, role: record.role || 'editor' };
}

async function sendDiscordWebhook({ user, changed }) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { configured: false, sent: false };

  const keys = Object.keys(changed);
  const content = keys.length
    ? `Proyecto28: ${user.email} publico ${keys.length} cambio(s) en Tweaks.`
    : `Proyecto28: ${user.email} publico Tweaks sin cambios nuevos.`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content,
        embeds: [
          {
            title: 'Proyecto28 publish',
            description: keys.slice(0, 12).join(', ') || 'Sin diferencias respecto al estado publicado.',
            color: 6545354,
          },
        ],
      }),
    });
    return { configured: true, sent: res.ok, status: res.status };
  } catch (err) {
    return { configured: true, sent: false, error: err.message };
  }
}

module.exports = createCoreController('api::site-setting.site-setting', ({ strapi }) => ({
  async publish(ctx) {
    let user;
    try {
      user = await verifyGoogleUser(strapi, extractBearer(ctx));
    } catch (err) {
      if (err.status === 403) return ctx.forbidden(err.message);
      return ctx.unauthorized(err.message || 'Unauthorized');
    }

    const state = ctx.request.body?.state || ctx.request.body?.snapshot;
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return ctx.badRequest('state object required');
    }

    const { patch, ignored } = normalizePayload(state);
    if (!Object.keys(patch).length) {
      return ctx.badRequest('No publishable fields in payload');
    }

    const current = await strapi.db.query('api::site-setting.site-setting').findOne({});
    const changed = diffPatch(current, patch);
    const data = current
      ? await strapi.entityService.update('api::site-setting.site-setting', current.id, { data: patch })
      : await strapi.entityService.create('api::site-setting.site-setting', { data: patch });

    const webhook = await sendDiscordWebhook({ user, changed });

    try {
      await strapi.entityService.create('api::publish-log.publish-log', {
        data: {
          email: user.email,
          role: user.role,
          status: 'success',
          changed,
          ignored,
          payload: {
            keys: Object.keys(state),
            diff: ctx.request.body?.diff || null,
          },
          webhookSent: !!webhook.sent,
          message: `Published ${Object.keys(changed).length} changed field(s).`,
        },
      });
    } catch (err) {
      strapi.log.warn(`[publish] audit log failed: ${err.message}`);
    }

    ctx.body = {
      ok: true,
      email: user.email,
      role: user.role,
      changed,
      ignored,
      webhook,
      data,
    };
  },
}));
