'use strict';

/**
 * Kaiyi — Rate limit (F10) para los endpoints de ESCRITURA públicos.
 *
 * Objetivo: frenar floods / spoofing masivo de records y sesiones si el token del
 * juego (embebido en el .exe) se extrae. NO se aplica al polling de sesión (el
 * juego lo llama cada 2-3 s) ni a los exports (ya van con token de admin).
 *
 * Diseño pensado para UNA exhibición (instancia única):
 *  - Ventana deslizante EN MEMORIA por IP + ruta (no requiere Redis).
 *  - GENEROSO y configurable por env; los PCs de un mismo recinto comparten IP
 *    (NAT), así que el límite es alto y se puede subir/bajar sin redeploy.
 *  - FAIL-OPEN: ante cualquier error interno deja pasar (nunca rompe el juego).
 *  - Desactivable por completo con KAIYI_RATELIMIT_DISABLED=true.
 *
 * Env:
 *  KAIYI_RATELIMIT_DISABLED   "true" para apagarlo (def: activo)
 *  KAIYI_RATELIMIT_WINDOW_MS  tamaño de la ventana en ms (def: 60000)
 *  KAIYI_RATELIMIT_MAX        máx. solicitudes por IP+ruta en la ventana (def: 60)
 */

const WINDOW_MS = Math.max(1000, Number(process.env.KAIYI_RATELIMIT_WINDOW_MS) || 60000);
const MAX_REQ = Math.max(1, Number(process.env.KAIYI_RATELIMIT_MAX) || 60);
const DISABLED = String(process.env.KAIYI_RATELIMIT_DISABLED || '').toLowerCase() === 'true';

// Map<"ip|ruta", number[]> con timestamps de las solicitudes recientes.
const hits = new Map();

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (DISABLED) {
      return next();
    }

    try {
      const xff = String(ctx.request.headers['x-forwarded-for'] || '').split(',')[0].trim();
      const ip = xff || ctx.request.ip || 'unknown';
      const route = ctx.request.path || 'kaiyi';
      const key = `${ip}|${route}`;
      const now = Date.now();

      const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);

      if (recent.length >= MAX_REQ) {
        strapi.log.warn(`[kaiyi] rate-limit: ${key} (${recent.length}/${MAX_REQ} en ${WINDOW_MS}ms)`);
        ctx.set('Retry-After', String(Math.ceil(WINDOW_MS / 1000)));
        ctx.status = 429;
        ctx.body = {
          error: { status: 429, name: 'TooManyRequests', message: 'Demasiadas solicitudes, intenta de nuevo en un momento.' },
        };
        return; // corta la cadena: no llama a next()
      }

      recent.push(now);
      hits.set(key, recent);

      // Limpieza perezosa para que el Map no crezca sin límite (IPs que ya no llegan).
      if (hits.size > 5000) {
        for (const [k, v] of hits) {
          const fresh = v.filter((t) => now - t < WINDOW_MS);
          if (fresh.length === 0) hits.delete(k);
          else hits.set(k, fresh);
        }
      }
    } catch (e) {
      // Fail-open: nunca bloquear el gameplay por un fallo del rate limiter.
      strapi.log.error(`[kaiyi] rate-limit error (fail-open): ${e && e.message}`);
    }

    return next();
  };
};
