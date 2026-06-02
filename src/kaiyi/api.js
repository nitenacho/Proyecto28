/* =========================================================
   Kaiyi API layer — lee de Strapi (mismo CMS que proyecto28).
   Usa VITE_CMS_URL en build; fallback al dominio de producción.
   ========================================================= */

const CMS_BASE = (
  import.meta.env.VITE_CMS_URL ||
  'https://honest-candy-800d1e4a92.strapiapp.com'
).replace(/\/$/, '');

const TIMEOUT_MS = 8000;

async function fetchJSON(path, init = {}) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${CMS_BASE}${path}`, {
      cache: 'no-store',
      credentials: 'omit',
      mode: 'cors',
      signal: ctrl.signal,
      headers: { accept: 'application/json', ...init.headers },
      ...init,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.message || `HTTP ${res.status}`;
      throw Object.assign(new Error(msg), { status: res.status, data: json });
    }
    return json;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Timeout: ${path}`);
    throw err;
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Ranking público: todos los récords ordenados por tiempo ascendente.
 * @returns {Promise<{data: Array, meta: {pagination: object}}>}
 */
export async function getRanking({ page = 1, pageSize = 100 } = {}) {
  return fetchJSON(
    `/api/kaiyi-ranking-records?sort=completionTimeSeconds:asc` +
    `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
  );
}

/**
 * Contenido web editable desde Strapi (títulos, mensajes, términos).
 * @returns {Promise<object>}
 */
export async function getWebContent() {
  const json = await fetchJSON('/api/kaiyi-web-content');
  return json.data;
}

/**
 * Claim de sesión desde la web del jugador.
 * D6: sin campo email por ahora (Ley 19.628, Chile — pendiente asesoría legal).
 * @param {string} token
 */
export async function claimSession(token) {
  return fetchJSON(
    `/api/kaiyi/sessions/${encodeURIComponent(token)}/claim`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }
  );
}

/**
 * Polling de sesión (para debug / futuro uso desde la web).
 * @param {string} token
 */
export async function pollSession(token) {
  return fetchJSON(`/api/kaiyi/sessions/${encodeURIComponent(token)}`);
}
