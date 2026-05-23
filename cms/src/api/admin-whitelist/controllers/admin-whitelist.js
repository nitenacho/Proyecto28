'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

/**
 * Etapa 9 — controller custom para el endpoint público /api/auth/check.
 * No expone la lista de emails. Sólo responde { allowed, role? } para un
 * email concreto que viene en query. Las rutas core (find/findOne) siguen
 * privadas (403 anónimo) gracias al bootstrap que no asigna permisos al
 * rol public.
 */
module.exports = createCoreController('api::admin-whitelist.admin-whitelist', ({ strapi }) => ({
  async check(ctx) {
    const raw = ctx.query?.email;
    const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ctx.badRequest('email query param required');
    }
    const record = await strapi.db.query('api::admin-whitelist.admin-whitelist').findOne({
      where: { email },
      select: ['role'],
    });
    if (!record) {
      ctx.body = { allowed: false };
      return;
    }
    ctx.body = { allowed: true, role: record.role };
  },
}));
