'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

// Puntaje acotado [1000-9999], MAYOR es mejor. Única fuente de verdad compartida
// con el backfill del bootstrap (cms/src/index.js) para que no diverjan.
const { computeScore } = require('../score');

const VALID_VEHICLE_IDS = ['Vehicle_01', 'Vehicle_02', 'Vehicle_03', 'Vehicle_04'];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const cs = Math.round((totalSeconds - Math.floor(totalSeconds)) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

// Escapa un valor para una celda CSV (alias/email pueden traer comas o comillas).
function csvCell(value) {
  const s = String(value == null ? '' : value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

module.exports = createCoreController(
  'api::kaiyi-ranking-record.kaiyi-ranking-record',
  ({ strapi }) => ({

    /**
     * POST /api/kaiyi/records
     * Recibe un récord desde el juego. Requiere header X-Kaiyi-Token.
     */
    async submitRecord(ctx) {
      const token = ctx.request.headers['x-kaiyi-token'];
      const expectedToken = process.env.KAIYI_GAME_TOKEN;

      if (!expectedToken || token !== expectedToken) {
        return ctx.unauthorized('Token inválido.');
      }

      const {
        vehicleId,
        completionTimeSeconds,
        completionDate,
        collectedLettersCount,
        bCollectedAllLetters,
        sessionToken,
      } = ctx.request.body;

      if (!VALID_VEHICLE_IDS.includes(vehicleId)) {
        return ctx.badRequest(`vehicleId inválido. Valores permitidos: ${VALID_VEHICLE_IDS.join(', ')}`);
      }
      if (typeof completionTimeSeconds !== 'number' || completionTimeSeconds <= 0 || completionTimeSeconds > 7200) {
        return ctx.badRequest('completionTimeSeconds inválido (debe ser número > 0 y < 7200).');
      }
      if (!completionDate || typeof completionDate !== 'string') {
        return ctx.badRequest('completionDate requerida (string ISO 8601).');
      }
      if (typeof collectedLettersCount !== 'number' || collectedLettersCount < 0 || collectedLettersCount > 5) {
        return ctx.badRequest('collectedLettersCount inválido (0–5).');
      }
      if (typeof bCollectedAllLetters !== 'boolean') {
        return ctx.badRequest('bCollectedAllLetters debe ser boolean.');
      }

      // Adjuntar alias/email desde la sesión de registro SERVER-SIDE: el email
      // nunca viaja de vuelta al juego (privacidad / minimización de datos, Ley
      // 19.628). Tolerante a fallos: si no hay una sesión válida y reclamada, el
      // récord se guarda igual (anónimo) para no perder el tiempo del jugador.
      let playerAlias = null;
      let playerEmail = null;
      if (sessionToken && typeof sessionToken === 'string') {
        const session = await strapi.db
          .query('api::kaiyi-registration-session.kaiyi-registration-session')
          .findOne({ where: { sessionToken } });
        if (session && session.claimed) {
          playerAlias = session.playerAlias || null;
          playerEmail = session.playerEmail || null;
        }
      }

      const score = computeScore(completionTimeSeconds, collectedLettersCount);

      const record = await strapi.entityService.create(
        'api::kaiyi-ranking-record.kaiyi-ranking-record',
        {
          data: {
            vehicleId,
            completionTimeSeconds,
            completionDate,
            collectedLettersCount,
            bCollectedAllLetters,
            playerAlias,
            playerEmail,
            score,
          },
        }
      );

      strapi.log.info(
        `[kaiyi] record creado: ${vehicleId} — ${formatTime(completionTimeSeconds)}${playerAlias ? ` (alias=${playerAlias})` : ' (anónimo)'}`
      );

      ctx.body = {
        data: {
          id: record.id,
          vehicleId: record.vehicleId,
          completionTimeSeconds: record.completionTimeSeconds,
          formattedTime: formatTime(record.completionTimeSeconds),
          completionDate: record.completionDate,
          collectedLettersCount: record.collectedLettersCount,
          bCollectedAllLetters: record.bCollectedAllLetters,
          playerAlias: record.playerAlias, // alias público (el email NO se devuelve)
          score: record.score,
        },
      };
    },

    /**
     * GET /api/kaiyi/records/export
     * Descarga CSV de todos los récords ordenados por puntaje.
     *
     * SEGURIDAD (F10): el CSV incluye EMAILS (dato personal, Ley 19.628). NO se
     * protege con el token del juego (KAIYI_GAME_TOKEN va embebido en el .exe y es
     * extraíble), sino con un token de ADMINISTRACIÓN aparte (KAIYI_ADMIN_TOKEN) que
     * solo conoce el operador y nunca viaja en el cliente. Header: X-Kaiyi-Admin-Token.
     * Falla cerrado: sin KAIYI_ADMIN_TOKEN configurado, el export queda deshabilitado.
     */
    async exportCsv(ctx) {
      const adminToken = process.env.KAIYI_ADMIN_TOKEN;
      const provided = ctx.request.headers['x-kaiyi-admin-token'];
      if (!adminToken) {
        return ctx.forbidden('Export deshabilitado: falta configurar KAIYI_ADMIN_TOKEN.');
      }
      if (provided !== adminToken) {
        return ctx.unauthorized('Token de administración inválido.');
      }

      const records = await strapi.entityService.findMany(
        'api::kaiyi-ranking-record.kaiyi-ranking-record',
        {
          sort: { score: 'desc' }, // mayor puntaje = mejor, va primero
          limit: -1,
        }
      );

      const lines = [
        'Puesto,Puntaje,Alias,Email,Vehículo,Tiempo,Tiempo (seg),Letras,Todas las Letras,Fecha',
      ];
      records.forEach((r, i) => {
        const allLetters = r.bCollectedAllLetters ? 'Sí' : 'No';
        const score = (r.score === null || r.score === undefined) ? '' : r.score;
        lines.push(
          `${i + 1},${score},${csvCell(r.playerAlias)},${csvCell(r.playerEmail)},${r.vehicleId},${formatTime(r.completionTimeSeconds)},${r.completionTimeSeconds},${r.collectedLettersCount}/5,${allLetters},${r.completionDate}`
        );
      });

      ctx.set('Content-Type', 'text/csv; charset=utf-8');
      ctx.set('Content-Disposition', `attachment; filename="kaiyi-ranking-${new Date().toISOString().slice(0, 10)}.csv"`);
      ctx.body = '﻿' + lines.join('\r\n'); // BOM UTF-8 para Excel
    },
  })
);
