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
        // Alias es PÚBLICO (se muestra en el ranking); el juego lo usa para el
        // indicador en pantalla. El email NUNCA se devuelve aquí (private).
        playerAlias: session.playerAlias || null,
      };
    },

    /**
     * POST /api/kaiyi/sessions/:token/claim
     * La web llama a este endpoint cuando el jugador completa el registro.
     * Público. Body: { alias, email, consent } (D6 resuelto, Ley 19.628 Chile):
     *  - alias: público (se muestra en el ranking).
     *  - email: PRIVADO (se guarda con private:true; nunca se expone por la API).
     *  - consent: consentimiento informado obligatorio (checkbox de la web).
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

      // --- Datos del registro (D6 resuelto: email privado + alias público + consentimientos) ---
      const body = ctx.request.body || {};
      const asBool = (v) => v === true || v === 'true';

      // Privacidad: OBLIGATORIO para registrarse (acepta el nuevo campo o el legacy `consent`).
      const consentPrivacy = asBool(body.consentPrivacy) || asBool(body.consent);
      if (!consentPrivacy) {
        return ctx.badRequest('Debes aceptar las políticas de privacidad para registrarte.');
      }

      const alias = typeof body.alias === 'string' ? body.alias.trim() : '';
      if (alias.length < 2 || alias.length > 40) {
        return ctx.badRequest('Alias inválido (entre 2 y 40 caracteres).');
      }

      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!EMAIL_RE.test(email) || email.length > 254) {
        return ctx.badRequest('Email inválido.');
      }

      // Marketing: general + los 5 granulares (opcionales). Normalizamos a booleans.
      const consentMarketing = asBool(body.consentMarketing);
      const mc = (body.marketingConsents && typeof body.marketingConsents === 'object') ? body.marketingConsents : {};
      const marketingConsents = {
        personalizadas:    asBool(mc.personalizadas),
        localizacion:      asBool(mc.localizacion),
        terceros:          asBool(mc.terceros),
        cesionTerceros:    asBool(mc.cesionTerceros),
        productosKaufmann: asBool(mc.productosKaufmann),
      };

      // Alias ÚNICO: si ya existe en una sesión reclamada, añadir sufijo " 2", " 3"...
      let finalAlias = alias;
      let suffix = 1;
      // eslint-disable-next-line no-await-in-loop
      while (true) {
        const dup = await strapi.db
          .query('api::kaiyi-registration-session.kaiyi-registration-session')
          .findOne({ where: { claimed: true, playerAlias: finalAlias } });
        if (!dup) break;
        suffix += 1;
        finalAlias = `${alias} ${suffix}`;
        if (suffix > 9999) break; // guarda de seguridad
      }

      // Claim ATÓMICO: solo actualiza si la sesión sigue sin reclamar. Evita el
      // borde de dos personas escaneando el MISMO QR a la vez (feria).
      const updated = await strapi.db
        .query('api::kaiyi-registration-session.kaiyi-registration-session')
        .updateMany({
          where: { id: session.id, claimed: false },
          data: {
            claimed: true,
            claimedAt: now,
            playerAlias: finalAlias,
            playerEmail: email,
            consentAccepted: true,
            consentPrivacy: true,
            consentMarketing,
            marketingConsents,
          },
        });

      if (!updated || updated.count === 0) {
        // Otra persona reclamó esta sesión primero.
        ctx.body = { ok: true, alreadyClaimed: true };
        return;
      }

      strapi.log.info(`[kaiyi] sesión reclamada: ${token} (alias=${finalAlias}, marketing=${consentMarketing})`);

      ctx.body = { ok: true, alreadyClaimed: false, playerAlias: finalAlias };
    },

    /**
     * GET /api/kaiyi/registrations/export
     * CSV de TODAS las sesiones reclamadas: alias + email + consentimientos. Incluye
     * a quien se registró aunque no haya completado carreras.
     *
     * SEGURIDAD (F10): este CSV contiene EMAILS (dato personal, Ley 19.628). Por eso
     * NO se protege con el token del juego (KAIYI_GAME_TOKEN va EMBEBIDO en el .exe y
     * es extraíble), sino con un token de ADMINISTRACIÓN aparte (KAIYI_ADMIN_TOKEN)
     * que solo conoce el operador y NUNCA viaja en el cliente. Header: X-Kaiyi-Admin-Token.
     * Falla cerrado: si KAIYI_ADMIN_TOKEN no está configurado, el export queda deshabilitado.
     */
    async exportRegistrations(ctx) {
      const adminToken = process.env.KAIYI_ADMIN_TOKEN;
      const provided = ctx.request.headers['x-kaiyi-admin-token'];
      if (!adminToken) {
        return ctx.forbidden('Export deshabilitado: falta configurar KAIYI_ADMIN_TOKEN.');
      }
      if (provided !== adminToken) {
        return ctx.unauthorized('Token de administración inválido.');
      }

      const sessions = await strapi.entityService.findMany(
        'api::kaiyi-registration-session.kaiyi-registration-session',
        { filters: { claimed: true }, sort: { claimedAt: 'asc' }, limit: -1 }
      );

      const cell = (v) => {
        const s = String(v == null ? '' : v);
        return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const yn = (b) => (b ? 'Sí' : 'No');

      const lines = [
        'Alias,Email,Privacidad,Marketing,MC_Personalizadas,MC_Localizacion,MC_Terceros,MC_CesionTerceros,MC_ProductosKaufmann,Fecha',
      ];
      sessions.forEach((s) => {
        const mc = s.marketingConsents || {};
        lines.push([
          cell(s.playerAlias), cell(s.playerEmail),
          yn(s.consentPrivacy), yn(s.consentMarketing),
          yn(mc.personalizadas), yn(mc.localizacion), yn(mc.terceros),
          yn(mc.cesionTerceros), yn(mc.productosKaufmann),
          cell(s.claimedAt),
        ].join(','));
      });

      ctx.set('Content-Type', 'text/csv; charset=utf-8');
      ctx.set('Content-Disposition', `attachment; filename="kaiyi-registros-${new Date().toISOString().slice(0, 10)}.csv"`);
      ctx.body = '﻿' + lines.join('\r\n'); // BOM UTF-8 para Excel
    },
  })
);
