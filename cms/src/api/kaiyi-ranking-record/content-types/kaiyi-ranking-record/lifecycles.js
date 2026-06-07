'use strict';

/**
 * Lifecycle de Kaiyi — Récord de Carrera.
 *
 * Calcula `score` automáticamente al CREAR o ACTUALIZAR un record, usando la
 * MISMA fórmula que el juego (controller submitRecord) y el backfill del
 * bootstrap: cms/src/api/kaiyi-ranking-record/score.js (única fuente de verdad).
 *
 * Gracias a esto, los records creados/editados A MANO desde el admin de Strapi
 * quedan con un `score` válido y ORDENABLE → se ven bien en la web y en Unreal
 * (ambos ordenan por score desc) sin tener que calcularlo a mano. El record que
 * envía el juego ya trae score; recalcularlo aquí da el MISMO valor (idempotente).
 */

const { computeScore } = require('../../score');

async function applyDerivedFields(event) {
  const data = event.params && event.params.data;
  if (!data) return;

  let time = data.completionTimeSeconds;
  let letters = data.collectedLettersCount;

  // En updates parciales (editar 1 campo en el admin) puede faltar uno de los dos:
  // leemos el record actual para no calcular el score con datos incompletos.
  const missingOne = time === undefined || letters === undefined;
  if (missingOne && event.params.where) {
    const existing = await strapi.db
      .query('api::kaiyi-ranking-record.kaiyi-ranking-record')
      .findOne({ where: event.params.where });
    if (existing) {
      if (time === undefined) time = existing.completionTimeSeconds;
      if (letters === undefined) letters = existing.collectedLettersCount;
    }
  }

  if (time !== undefined && time !== null) {
    data.score = computeScore(time, letters || 0);
  }

  // Coherencia: deriva "todas las letras" de las 5 si no se especificó.
  if (
    data.bCollectedAllLetters === undefined &&
    data.collectedLettersCount !== undefined &&
    data.collectedLettersCount !== null
  ) {
    data.bCollectedAllLetters = Number(data.collectedLettersCount) >= 5;
  }
}

module.exports = {
  async beforeCreate(event) {
    await applyDerivedFields(event);
  },
  async beforeUpdate(event) {
    await applyDerivedFields(event);
  },
};
