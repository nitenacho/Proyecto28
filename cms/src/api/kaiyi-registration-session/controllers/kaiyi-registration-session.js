'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { randomUUID } = require('crypto');

const SESSION_TTL_MINUTES = 10;

module.exports = createCoreController(
  'api::kaiyi-registration-session.kaiyi-registration-session',
  ({ strapi }) => ({

    /**
     * POST /api/kaiyi/sessions
     * El juego crea una sesión y recibe { sessionToken, qrDataUrl, expiresAt }.
     * Requiere header X-Kaiyi-Token.
     */
    async createSession(ctx) {
      const token = ctx.request.headers['x-kaiyi-token'];
      const expectedToken = process.env.KAIYI_GAME_TOKEN;

      if (!expectedToken || token !== expectedToken) {
        return ctx.unauthorized('Token inválido.');
      }

      const sessionToken = randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_TTL_MINUTES * 60 * 1000);

      await strapi.entityService.create(
        'api::kaiyi-registration-session.kaiyi-registration-session',
        { data: { sessionToken, claimed: false, expiresAt } }
      );

      const baseUrl = process.env.KAIYI_WEB_URL || 'https://proyecto28.com/kaiyi';
      const sessionUrl = `${baseUrl}?session=${sessionToken}`;

      let qrDataUrl = null;
      try {
        const QRCode = require('qrcode');
        qrDataUrl = await QRCode.toDataURL(sessionUrl, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      } catch (err) {
        strapi.log.warn('[kaiyi] qrcode package no disponible — devolviendo solo la URL.');
      }

      strapi.log.info(`[kaiyi] sesión creada: ${sessionToken}`);

      ctx.body = {
        sessionToken,
        sessionUrl,
        qrDataUrl,
        expiresAt: expiresAt.toISOString(),
      };
    },

    /**
     * GET /api/kaiyi/sessions/:token
     * El juego hace polling para saber si el jugador ya escaneó y se registró.
     * Público (sin token).
     */
    async pollSession(ctx) {
      const { token } = ctx.params;

      if (!token || typeof token !== 'string') {
        return ctx.badRequest('token requerido.');
      }

      const session = await strapi.db
        .query('api::kaiyi-registration-session.kaiyi-registration-session')
        .findOne({ where: { sessionToken: token } });

      if (!session) {
        return ctx.notFound('Sesión no encontrada.');
      }

      const now = new Date();
      const expired = session.expiresAt && new Date(session.expiresAt) < now;

      ctx.body = {
        sessionToken: session.sessionToken,
        claimed: session.claimed,
        expired,
        claimedAt: session.claimedAt || null,
      };
    },

    /**
     * POST /api/kaiyi/sessions/:token/claim
     * La web llama a este endpoint cuando el jugador acepta los términos.
     * Público. D6: no almacena email todavía (pendiente asesoría legal Ley 19.628 Chile).
     */
    async claimSession(ctx) {
      const { token } = ctx.params;

      if (!token || typeof token !== 'string') {
        return ctx.badRequest('token requerido.');
      }

      const session = await strapi.db
        .query('api::kaiyi-registration-session.kaiyi-registration-session')
        .findOne({ where: { sessionToken: token } });

      if (!session) {
        return ctx.notFound('Sesión no encontrada.');
      }

      const now = new Date();
      if (session.expiresAt && new Date(session.expiresAt) < now) {
        return ctx.badRequest('La sesión ha expirado. Vuelve al juego para generar un nuevo QR.');
      }

      if (session.claimed) {
        ctx.body = { ok: true, alreadyClaimed: true };
        return;
      }

      await strapi.entityService.update(
        'api::kaiyi-registration-session.kaiyi-registration-session',
        session.id,
        { data: { claimed: true, claimedAt: now } }
      );

      strapi.log.info(`[kaiyi] sesión reclamada: ${token}`);

      // D6: cuando el email sea legal, recibirlo aquí y guardarlo en session + record.
      // Por ahora solo marcamos como claimed.

      ctx.body = { ok: true, alreadyClaimed: false };
    },
  })
);
