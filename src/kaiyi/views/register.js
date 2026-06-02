/* =========================================================
   Kaiyi — Vista de registro / claim de sesión.
   Estilo tipo Disney+ (card centrada, fondo oscuro con glow).

   D6: sin campo email (Ley 19.628, Chile — pendiente asesoría
   legal). El claim se hace sin datos personales; solo confirma
   que el jugador interactuó con la web.
   ========================================================= */

import { claimSession, getWebContent } from '../api.js';

export async function renderRegister(root, token) {
  root.innerHTML = `
    <div class="kaiyi-register-page">
      <div class="kaiyi-register-card">
        <div class="kaiyi-register-glow" aria-hidden="true"></div>
        <div class="kaiyi-register-brand">KAIYI AUTO</div>
        <h1 class="kaiyi-register-title" id="kaiyi-reg-title">Kaiyi The Game</h1>
        <p class="kaiyi-register-sub" id="kaiyi-reg-sub"></p>
        <div id="kaiyi-reg-body">
          <div class="kaiyi-loading" role="status" aria-live="polite">
            <div class="kaiyi-ring"></div>
          </div>
        </div>
        <a class="kaiyi-register-link" href="/kaiyi/">Ver ranking →</a>
      </div>
    </div>`;

  const titleEl = root.querySelector('#kaiyi-reg-title');
  const subEl   = root.querySelector('#kaiyi-reg-sub');
  const body    = root.querySelector('#kaiyi-reg-body');

  /* Cargar contenido de Strapi en paralelo */
  let content = null;
  try {
    content = await getWebContent();
    if (content?.registrationTitle)    titleEl.textContent = content.registrationTitle;
    if (content?.registrationSubtitle) subEl.textContent   = content.registrationSubtitle;
  } catch {
    /* fallback a textos por defecto */
  }

  const terms = content?.legalTermsText
    ? `<p class="kaiyi-reg-terms">${escapeHtml(content.legalTermsText)}</p>`
    : '';

  body.innerHTML = `
    <div class="kaiyi-reg-form">
      ${terms}
      <button class="kaiyi-btn-primary" id="kaiyi-claim-btn" type="button">
        <span class="kaiyi-btn-text">Kaiyi The Game</span>
        <span class="kaiyi-btn-arrow" aria-hidden="true">↗</span>
      </button>
      <p class="kaiyi-reg-hint">
        Al continuar, tu tiempo quedará guardado en el ranking público de proyecto28.com/kaiyi.
      </p>
    </div>`;

  const btn = body.querySelector('#kaiyi-claim-btn');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.querySelector('.kaiyi-btn-text').textContent = 'Registrando…';
    btn.querySelector('.kaiyi-btn-arrow').textContent = '';

    try {
      await claimSession(token);
      showSuccess(body, content?.registrationSuccessMessage);
    } catch (err) {
      showError(body, err);
    }
  });
}

function showSuccess(body, customMsg) {
  const msg = customMsg || '¡Listo! Vuelve al juego, ya está desbloqueado.';
  body.innerHTML = `
    <div class="kaiyi-reg-success">
      <div class="kaiyi-success-icon" aria-hidden="true">✓</div>
      <p class="kaiyi-success-msg">${escapeHtml(msg)}</p>
    </div>`;
}

function showError(body, err) {
  let msg = 'No se pudo completar el registro. Inténtalo de nuevo.';
  const status = err?.status;
  const errCode = err?.data?.error;

  if (status === 410 || errCode === 'expired') {
    msg = 'Esta sesión ha expirado (10 min). Abre el juego para obtener un nuevo código QR.';
  } else if (status === 409 || errCode === 'already_claimed') {
    msg = 'Esta sesión ya fue utilizada. Vuelve al juego.';
  } else if (status === 404) {
    msg = 'Sesión no encontrada. Verifica el código QR o inicia el juego nuevamente.';
  }

  body.innerHTML = `
    <div class="kaiyi-reg-error">
      <p>${escapeHtml(msg)}</p>
      <button class="kaiyi-btn-ghost" type="button" id="kaiyi-retry">Reintentar</button>
    </div>`;

  body.querySelector('#kaiyi-retry')?.addEventListener('click', () => {
    location.reload();
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
