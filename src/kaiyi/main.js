/* =========================================================
   Kaiyi — entry point.
   Ruta:  ?session=TOKEN  → vista de registro (claim)
   Ruta:  (sin session)   → vista de ranking público
   ========================================================= */

import { renderRanking }  from './views/ranking.js';
import { renderRegister } from './views/register.js';

const root = document.getElementById('kaiyi-app');
const params = new URLSearchParams(window.location.search);
const sessionToken = params.get('session');

if (sessionToken) {
  renderRegister(root, sessionToken);
} else {
  renderRanking(root);
}
