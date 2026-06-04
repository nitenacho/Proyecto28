/* =========================================================
   Kaiyi — Vista de registro / claim de sesión.
   Estilo tipo Disney+ (card centrada, fondo oscuro con glow).

   D6 resuelto (Ley 19.628, Chile): alias público + email privado +
   consentimientos (privacidad obligatoria + marketing Kaufmann con
   5 consentimientos granulares "Gestiona aquí"). El email se guarda
   con private:true en Strapi y nunca se expone por la API pública.
   ========================================================= */

import { claimSession, getWebContent } from '../api.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Textos legales (editables aquí; movibles a Strapi más adelante). */
const PRIVACY_LABEL   = 'Acepto las políticas de privacidad de datos.';
const MARKETING_LABEL = 'Acepto recibir comunicaciones comerciales del grupo Kaufmann.';
const MANAGE_LABEL    = 'Gestiona aquí tus consentimientos';

/* Los 5 consentimientos granulares (clave -> texto), pre-marcados. */
const MARKETING_DETAILS = [
  ['personalizadas',    'Acepto recibir comunicaciones comerciales personalizadas del grupo Kaufmann basados en los datos que se están entregando, tráfico, navegación e interacciones.'],
  ['localizacion',      'Acepto recibir comunicaciones comerciales personalizadas del grupo Kaufmann basadas en datos de localización. Trataremos este dato hasta un plazo de 5 años.'],
  ['terceros',          'Acepto recibir comunicaciones comerciales del grupo Kaufmann sobre terceros con los que tenga acuerdos.'],
  ['cesionTerceros',    'Acepto ceder o comunicar mis datos personales a terceros con los cuales grupo Kaufmann tenga acuerdos para recibir información del tercero de acuerdo a su interés.'],
  ['productosKaufmann', 'Acepto ceder o comunicar mis datos al Grupo Kaufmann para envío de Comunicaciones Comerciales de productos y servicios distintos o similares a los contratados.'],
];

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

  /* Cargar contenido editable de Strapi */
  let content = null;
  try {
    content = await getWebContent();
    if (content?.registrationTitle)    titleEl.textContent = content.registrationTitle;
    if (content?.registrationSubtitle) subEl.textContent   = content.registrationSubtitle;
  } catch {
    /* fallback a textos por defecto */
  }

  const aliasLabel = content?.registrationAliasLabel || 'Tu nombre o alias (visible en el ranking)';
  const emailLabel = content?.registrationEmailLabel || 'Tu correo electrónico (privado, no se muestra)';

  const terms = content?.legalTermsText
    ? `<div class="kaiyi-reg-terms">${escapeHtml(content.legalTermsText)}</div>`
    : '';

  const detailRows = MARKETING_DETAILS.map(([key, text]) => `
    <label class="kaiyi-consent kaiyi-consent--sub">
      <input type="checkbox" data-mc="${key}" checked />
      <span>${escapeHtml(text)}</span>
    </label>`).join('');

  body.innerHTML = `
    <form class="kaiyi-reg-form" id="kaiyi-reg-form" novalidate>
      ${terms}
      <label class="kaiyi-field">
        <span class="kaiyi-field-label">${escapeHtml(aliasLabel)}</span>
        <input type="text" id="kaiyi-alias" class="kaiyi-text-input"
               maxlength="40" autocomplete="nickname" required />
      </label>
      <label class="kaiyi-field">
        <span class="kaiyi-field-label">${escapeHtml(emailLabel)}</span>
        <input type="email" id="kaiyi-email" class="kaiyi-text-input"
               maxlength="254" autocomplete="email" inputmode="email" required />
      </label>

      <div class="kaiyi-consent-group">
        <label class="kaiyi-consent">
          <input type="checkbox" id="kaiyi-consent-privacy" checked />
          <span>${escapeHtml(PRIVACY_LABEL)}</span>
        </label>

        <label class="kaiyi-consent">
          <input type="checkbox" id="kaiyi-consent-marketing" checked />
          <span>${escapeHtml(MARKETING_LABEL)}
            <button type="button" class="kaiyi-manage-link" id="kaiyi-manage-toggle"
                    aria-expanded="false">${escapeHtml(MANAGE_LABEL)}</button>
          </span>
        </label>

        <div class="kaiyi-manage-panel" id="kaiyi-manage-panel" hidden>
          <p class="kaiyi-manage-title">Detalle consentimiento:</p>
          ${detailRows}
        </div>
      </div>

      <p class="kaiyi-reg-error-inline" id="kaiyi-reg-err" role="alert" hidden></p>
      <button class="kaiyi-btn-primary" id="kaiyi-claim-btn" type="submit" disabled>
        <span class="kaiyi-btn-text">Kaiyi The Game</span>
        <span class="kaiyi-btn-arrow" aria-hidden="true">↗</span>
      </button>
      <p class="kaiyi-reg-hint">
        Tu correo es privado y no se muestra en el ranking. Tu tiempo quedará
        guardado en proyecto28.com/kaiyi con el nombre que elijas.
      </p>
    </form>`;

  const form     = body.querySelector('#kaiyi-reg-form');
  const aliasEl  = form.querySelector('#kaiyi-alias');
  const emailEl  = form.querySelector('#kaiyi-email');
  const privacy  = form.querySelector('#kaiyi-consent-privacy');
  const marketing= form.querySelector('#kaiyi-consent-marketing');
  const toggle   = form.querySelector('#kaiyi-manage-toggle');
  const panel    = form.querySelector('#kaiyi-manage-panel');
  const btn      = form.querySelector('#kaiyi-claim-btn');
  const errEl    = form.querySelector('#kaiyi-reg-err');

  // "Gestiona aquí tus consentimientos": despliega/oculta el detalle inline.
  toggle.addEventListener('click', () => {
    const open = panel.hasAttribute('hidden');
    if (open) { panel.removeAttribute('hidden'); } else { panel.setAttribute('hidden', ''); }
    toggle.setAttribute('aria-expanded', String(open));
  });

  function isValid() {
    const alias = aliasEl.value.trim();
    const email = emailEl.value.trim();
    // Solo la privacidad es obligatoria; el marketing es opcional.
    return alias.length >= 2 && alias.length <= 40 && EMAIL_RE.test(email) && privacy.checked;
  }
  function refresh() { btn.disabled = !isValid(); }

  aliasEl.addEventListener('input', refresh);
  emailEl.addEventListener('input', refresh);
  privacy.addEventListener('change', refresh);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isValid()) return;

    btn.disabled = true;
    errEl.hidden = true;
    btn.querySelector('.kaiyi-btn-text').textContent = 'Registrando…';
    btn.querySelector('.kaiyi-btn-arrow').textContent = '';

    const marketingConsents = {};
    panel.querySelectorAll('input[data-mc]').forEach((el) => {
      marketingConsents[el.dataset.mc] = el.checked;
    });

    try {
      const res = await claimSession(token, {
        alias: aliasEl.value.trim(),
        email: emailEl.value.trim(),
        consentPrivacy: privacy.checked,
        consentMarketing: marketing.checked,
        marketingConsents,
      });
      if (res && res.alreadyClaimed) {
        showAlreadyClaimed(body);
      } else {
        showSuccess(body, content?.registrationSuccessMessage);
      }
    } catch (err) {
      errEl.textContent = err?.message || 'No se pudo completar el registro. Inténtalo de nuevo.';
      errEl.hidden = false;
      btn.disabled = false;
      btn.querySelector('.kaiyi-btn-text').textContent = 'Kaiyi The Game';
      btn.querySelector('.kaiyi-btn-arrow').textContent = '↗';
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

function showAlreadyClaimed(body) {
  body.innerHTML = `
    <div class="kaiyi-reg-error">
      <p>Este código QR ya fue usado por otro jugador. Pide al operador un código nuevo para registrarte.</p>
    </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
