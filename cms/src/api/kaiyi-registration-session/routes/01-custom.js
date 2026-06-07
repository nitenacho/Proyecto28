'use strict';

/**
 * Rutas custom de Kaiyi — Sesiones QR.
 *
 * POST /api/kaiyi/sessions              — juego crea sesión + QR (requiere X-Kaiyi-Token)
 * GET  /api/kaiyi/sessions/:token       — juego hace polling de estado (público)
 * POST /api/kaiyi/sessions/:token/claim — web reclama sesión al registrarse (público)
 * GET  /api/kaiyi/registrations/export  — CSV emails+consentimientos (requiere X-Kaiyi-Admin-Token; F10)
 *
 * auth: false en todos; la validación del token del juego se hace en el controlador.
 */
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/kaiyi/sessions',
      handler: 'api::kaiyi-registration-session.kaiyi-registration-session.createSession',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/kaiyi/sessions/:token',
      handler: 'api::kaiyi-registration-session.kaiyi-registration-session.pollSession',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/kaiyi/sessions/:token/claim',
      handler: 'api::kaiyi-registration-session.kaiyi-registration-session.claimSession',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/kaiyi/registrations/export',
      handler: 'api::kaiyi-registration-session.kaiyi-registration-session.exportRegistrations',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
