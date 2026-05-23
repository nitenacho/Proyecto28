'use strict';

/**
 * Etapa 9 — ruta custom pública.
 * GET /api/auth/check?email=foo@bar.com
 *   → 200 { allowed: true, role: "owner" | "editor" }
 *   → 200 { allowed: false }
 *   → 400 si el email es inválido o falta.
 *
 * auth.scope se setea acá Y se autoriza el rol public en el bootstrap
 * (cms/src/index.js). El handler vive en el controller default.
 */
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/auth/check',
      handler: 'api::admin-whitelist.admin-whitelist.check',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
