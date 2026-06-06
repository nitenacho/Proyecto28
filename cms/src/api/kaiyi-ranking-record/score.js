'use strict';

/* =========================================================
   Kaiyi — Cálculo del puntaje del ranking (única fuente de verdad).
   Lo usan el controller (al crear un record) y el bootstrap (backfill),
   para que ambos calculen EXACTAMENTE igual y no diverjan.

   Puntaje ACOTADO a [1000, 9999], MAYOR es mejor:
     - tiempo 0 (o totalmente compensado por letras) => 9999
     - tiempo >= SCORE_BASE_TIME                      => 1000
     - lineal entre medio (bien distribuido)
   Cada letra recogida descuenta SCORE_LETTER_BONUS segundos efectivos
   (premia recolectar K-A-I-Y-I).

   Administrable por variables de entorno en Strapi Cloud (sin redeploy):
     KAIYI_SCORE_BASE_TIME    seg que mapean al puntaje mínimo (def. 180)
     KAIYI_SCORE_LETTER_BONUS seg efectivos por letra recogida (def. 12)
   ========================================================= */

const SCORE_MIN = 1000;
const SCORE_MAX = 9999;

// Tiempo (seg) que corresponde al puntaje mínimo (1000). Tiempos iguales o
// mayores caen al piso. Math.max(1, …) evita división por cero / valores absurdos.
const SCORE_BASE_TIME = Math.max(1, Number(process.env.KAIYI_SCORE_BASE_TIME) || 180);

// Segundos efectivos que descuenta cada letra recogida antes de calcular el puntaje.
const SCORE_LETTER_BONUS = Number(process.env.KAIYI_SCORE_LETTER_BONUS) || 12;

function computeScore(completionTimeSeconds, collectedLettersCount) {
  const time = Number(completionTimeSeconds) || 0;
  const letters = Number(collectedLettersCount) || 0;

  const effective = Math.max(0, time - letters * SCORE_LETTER_BONUS);
  const frac = Math.min(1, effective / SCORE_BASE_TIME); // 0 (rápido) .. 1 (lento)
  const score = SCORE_MAX - frac * (SCORE_MAX - SCORE_MIN);

  return Math.round(Math.min(SCORE_MAX, Math.max(SCORE_MIN, score)));
}

module.exports = { computeScore, SCORE_MIN, SCORE_MAX, SCORE_BASE_TIME, SCORE_LETTER_BONUS };
