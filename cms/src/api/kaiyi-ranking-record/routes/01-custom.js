'use strict';

/**
 * Rutas custom de Kaiyi — Ranking Records.
 *
 * POST /api/kaiyi/records       — el juego envía un récord (requiere X-Kaiyi-Token)
 * GET  /api/kaiyi/records/export — descarga CSV (requiere X-Kaiyi-Admin-Token; F10)
 *
 * auth: false porque la validación se hace con X-Kaiyi-Token en el controlador.
 * El permiso público para GET /api/kaiyi-ranking-records (lista pública) se otorga
 * en el bootstrap vía grantPublicReadAccess (acción find del core router).
 */
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/kaiyi/records',
      handler: 'api::kaiyi-ranking-record.kaiyi-ranking-record.submitRecord',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::kaiyi-rate-limit'], // F10: anti-flood de records
      },
    },
    {
      method: 'GET',
      path: '/kaiyi/records/export',
      handler: 'api::kaiyi-ranking-record.kaiyi-ranking-record.exportCsv',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
