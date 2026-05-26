/* =========================================================
   PROYECTO 28 — Google Identity Services wrapper (Etapa 9)
   Carga el script GIS lazy, expone signIn (popup) + signOut +
   getCurrentUser (cached en localStorage). El idToken es JWT
   firmado por Google; lo decodificamos client-side sólo para
   extraer email + exp (visualmente, no para autorización real;
   la autorización es vía /api/auth/check contra Strapi).
   ========================================================= */

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const STORAGE_KEY = 'p28-auth';

let gisLoading = null;
let clientId = '';
let initialized = false;
let tokenClient = null;
let signInResolvers = [];

function decodeIdToken(idToken) {
  try {
    const [, payloadB64] = idToken.split('.');
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadGisScript() {
  if (gisLoading) return gisLoading;
  if (typeof window.google?.accounts?.id !== 'undefined') {
    gisLoading = Promise.resolve();
    return gisLoading;
  }
  gisLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
  return gisLoading;
}

function onCredential(response) {
  const payload = decodeIdToken(response.credential);
  const resolvers = signInResolvers.splice(0);
  if (!payload?.email) {
    resolvers.forEach((r) => r.reject(new Error('No email in id_token payload')));
    return;
  }
  const user = {
    email: String(payload.email).toLowerCase(),
    idToken: response.credential,
    exp: typeof payload.exp === 'number' ? payload.exp : 0,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
  resolvers.forEach((r) => r.resolve(user));
}

async function fetchUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
  const payload = await res.json();
  if (!payload?.email) throw new Error('No email in Google userinfo payload');
  return payload;
}

/**
 * Inicializa el módulo con el Client ID. Idempotente.
 * @param {{ clientId: string }} opts
 */
export async function initGoogleAuth({ clientId: cid }) {
  if (!cid) throw new Error('initGoogleAuth: clientId required');
  clientId = cid;
  await loadGisScript();
  if (initialized) return;
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: onCredential,
    auto_select: false,
    cancel_on_tap_outside: false,
    use_fedcm_for_prompt: true,
  });
  if (window.google.accounts.oauth2?.initTokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: () => {},
    });
  }
  initialized = true;
}

/**
 * Abre el One Tap / FedCM prompt. Resuelve con { email, idToken, exp }
 * al éxito. Si el browser bloquea el prompt (third-party cookies, FedCM
 * no soportado), rechaza con un error descriptivo — el caller puede
 * fallback a otro flow.
 */
function signInWithIdPrompt() {
  if (!clientId) return Promise.reject(new Error('Google auth not initialized'));
  if (!window.google?.accounts?.id) {
    return Promise.reject(new Error('GIS not loaded'));
  }
  return new Promise((resolve, reject) => {
    signInResolvers.push({ resolve, reject });
    window.google.accounts.id.prompt((notification) => {
      const reason =
        notification.isNotDisplayed?.() ? `not displayed: ${notification.getNotDisplayedReason?.()}` :
        notification.isSkippedMoment?.() ? `skipped: ${notification.getSkippedReason?.()}` :
        notification.isDismissedMoment?.() ? `dismissed: ${notification.getDismissedReason?.()}` :
        null;
      if (reason) {
        const idx = signInResolvers.findIndex((r) => r.resolve === resolve);
        if (idx >= 0) signInResolvers.splice(idx, 1);
        reject(new Error(`Sign-in prompt ${reason}`));
      }
    });
  });
}

function signInWithAccessToken() {
  if (!clientId) return Promise.reject(new Error('Google auth not initialized'));
  if (!tokenClient) return Promise.reject(new Error('Google OAuth token client not available'));

  return new Promise((resolve, reject) => {
    tokenClient.callback = async (response) => {
      if (response?.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }
      try {
        const accessToken = response.access_token;
        const profile = await fetchUserInfo(accessToken);
        const now = Math.floor(Date.now() / 1000);
        const user = {
          email: String(profile.email).toLowerCase(),
          accessToken,
          idToken: '',
          exp: now + Math.max(60, Number(response.expires_in || 3600) - 60),
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
        resolve(user);
      } catch (err) {
        reject(err);
      }
    };
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

export function signIn() {
  if (tokenClient) return signInWithAccessToken();
  return signInWithIdPrompt();
}

/** Limpia el state local. No revoca el token contra Google. */
export function signOut() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  if (window.google?.accounts?.id?.disableAutoSelect) {
    window.google.accounts.id.disableAutoSelect();
  }
}

/**
 * Lee user cacheado en localStorage. Si expiró (exp < now), retorna null
 * y limpia el cache. No hace network call.
 * @returns {{email:string, idToken:string, exp:number}|null}
 */
export function getCurrentUser() {
  let raw;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { return null; }
  if (!raw) return null;
  let user;
  try { user = JSON.parse(raw); } catch { return null; }
  if (!user?.email || (!user.idToken && !user.accessToken)) return null;
  const now = Math.floor(Date.now() / 1000);
  if (user.exp && user.exp < now) {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    return null;
  }
  return user;
}
