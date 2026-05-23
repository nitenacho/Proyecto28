/* =========================================================
   PROYECTO 28 — Whitelist check (Etapa 9)
   Pega al endpoint público /api/auth/check del CMS Strapi.
   ========================================================= */

const CMS_URL = import.meta.env.VITE_CMS_URL || '';

/**
 * Pregunta a Strapi si el email está en AdminWhitelist.
 * @param {string} email
 * @returns {Promise<{ allowed: boolean, role?: string }>}
 */
export async function checkWhitelist(email) {
  if (!CMS_URL || !email) return { allowed: false };
  try {
    const url = new URL('/api/auth/check', CMS_URL);
    url.searchParams.set('email', email);
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) return { allowed: false };
    const json = await res.json();
    return {
      allowed: !!json.allowed,
      role: typeof json.role === 'string' ? json.role : undefined,
    };
  } catch {
    return { allowed: false };
  }
}
