# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-21 (cierre Etapa 2)
> **Tag activo:** `v0.3.0`
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com

Este documento es el **handoff incremental** del proyecto. Sustituye el
patrón anterior de regenerar handoffs completos cada sesión. Para pegar al
inicio de una nueva sesión con un agente IA, copia este archivo entero.

El handoff v1 completo (historia detallada del estado inicial) sigue
disponible como referencia y se preserva en el Google Doc oficial.

---

## 1. Estado en una línea

Etapa 2 cerrada. Strapi tiene el schema v2 desplegado y verificado: Project
con campos Unreal + popup mejorado, SiteSetting con tweaks del juego + admin
toggles, y AdminWhitelist seedeado con los 2 emails autorizados (privado).
Listos para Etapa 3 (consumir esos campos en el frontend).

## 2. Última etapa cerrada

**Etapa 2 — Strapi schema v2** (`v0.3.0`, 2026-05-21, commit `d61fec6`)

Entregables:
- `Project` extendido con 7 campos (unrealStreamURL, unrealLevelName,
  unrealEnabled, popupImage, popupBody, popupCTALabel, videoLoop).
- `SiteSetting` extendido con 10 campos (game* tweaks, adminButtonVisible,
  pixelStreaming*).
- `AdminWhitelist` (nuevo, collection privada) con seed inconcha+yk8arts.
- Bootstrap actualizado: backfill no destructivo de SiteSetting + seed
  whitelist + denegación explícita de permisos públicos sobre whitelist.
- `cms/README.md` documenta los nuevos campos.

Verificado en producción:
- `GET /api/projects?populate=*` → 6 entries, todos los campos v2.
- `GET /api/site-setting` → 10 nuevos campos con defaults aplicados.
- `GET /api/admin-whitelists` → HTTP 403 sin auth.

## 3. Próximo paso exacto

**Empezar Etapa 3 — Capa de datos en frontend.**

```bash
git checkout main && git pull
git checkout -b etapa-3-frontend-data-layer
```

Tareas (ver `PLAN-PROYECTO28-V2.md` §4 Etapa 3):

1. Actualizar `src/data/cms.js` para mapear los campos nuevos (Project + SiteSetting).
2. Actualizar `src/data/fallback.js` con defaults razonables para los nuevos campos.
3. Validar con `console.log` temporal en `main.js` que llegan los nuevos campos.
4. Documentar shape en JSDoc en `cms.js`.
5. Cierre: tag `v0.4.0`.

**Importante:** Etapa 3 es una etapa "ligera" — solo prepara la capa de datos
para que las etapas siguientes (4-11) puedan consumir los nuevos campos.
Sin cambios visibles para el usuario final todavía.

## 4. Estado de git

```
Repo:    github.com/nitenacho/Proyecto28
Branch:  main
HEAD:    d61fec6 (commit del cierre etapa 2)
Tags:    v0.1.0 (handoff v1, en f7a3a30)
         v0.2.0 (cierre Etapa 1, en 0da2c23)
         v0.3.0 (cierre Etapa 2, en d61fec6)
Remote:  origin sincronizado
```

Working tree esperado: clean.

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| Deploy on commit | ✅ activo |
| `GET /api/projects?populate=*` | ✅ 6 entries con schema v2 |
| `GET /api/site-setting` | ✅ schema v2 con defaults |
| `GET /api/admin-whitelists` | 🔒 HTTP 403 (correcto) |
| Admin de Strapi | ❌ **Owner pendiente de crear** en `/admin` |
| Schema actual | v2 (Etapa 2) — Unreal + popup + game tweaks + whitelist |
| Tiempo rebuild | ~4.5 min después del push |

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ Desplegado |
| `proyecto28.com` | ✅ Resuelve, SSL ⏳ provisionando o activo |
| `proyecto28.cl` | ⏳ Verificar propagación NIC + redirect a `.com` |
| Cloudflare zone `.cl` | ⏳ Esperar `status: active` |

## 7. Bloqueantes / decisiones pendientes

Ver `PLAN-PROYECTO28-V2.md` §1. Estado actual:

| # | Tema | Estado |
|---|---|---|
| §1.1 | Pixel Streaming infra | ✅ 1 instancia compartida |
| §1.2 | Google OAuth setup | ❌ Crear OAuth Client ID antes de Etapa 9 |
| §1.3 | Discord bot detalles | ⏳ Se define al llegar a Etapa 12 |
| §1.4 | Claude Design mecanismo | ⏳ Se define al llegar a Etapa 13 |
| §1.5 | Detalles del juego | ✅ Defaults en SiteSetting v2 |
| §1.6 | Admin Strapi creado | ❌ Pendiente owner |
| §1.6 | `.cl` propagación | ⏳ Verificar |

Ninguno bloquea Etapa 3.

## 8. Comandos para verificar el estado al arrancar nueva sesión

```bash
# Repo
git -C "<path>/Proyecto28" status
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.3.0

# Strapi v2 alive
curl -s 'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*' | python -c "import json,sys; d=json.load(sys.stdin); print('projects:', len(d.get('data',[])))"
curl -s https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting | python -c "import json,sys; d=json.load(sys.stdin); print('siteSetting has gameLightSpeed:', 'gameLightSpeed' in d.get('data',{}))"
curl -s -o /dev/null -w "%{http_code}\n" https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists  # esperado 403

# GH Actions
gh -C "<path>/Proyecto28" run list --limit 3

# Sitio en vivo
curl -I https://proyecto28.com
```

## 9. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS modules. Bundle ~616KB
  (warning Vite — pendiente code-splitting en Etapa 15).
- **CMS:** Strapi 5.13.1 en Strapi Cloud. Schema v2 (Etapa 2) desplegado.
- **Hosting:** GitHub Pages + Strapi Cloud + Cloudflare DNS.
- **Auth:** Aún no implementado (Etapa 9).
- **Pixel Streaming:** Aún no implementado (Etapa 11), modo decidido = `shared`.

## 10. Memorias persistidas

En `C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md` — @nitenacho, dueño de proyecto28.com/.cl
- `feedback_language.md` — usuario escribe en español, responder en español
- `project_proyecto28_stack.md` — estructura monorepo, decisiones de stack
- `reference_proyecto28_hosting.md` — punteros a GH Actions / Pages / Strapi Cloud

## 11. Secretos y tokens

**No se cambiaron en esta etapa.** Sección 3 del handoff v1 sigue vigente
(APP_KEYS, API_TOKEN_SALT, etc. en Strapi Cloud env vars, `VITE_CMS_URL` como
GH secret).

El owner los rotará al final de la fase de desarrollo base.

## 12. Cómo continuar (próximo agente IA)

1. Pegar este documento en el inicio de la sesión.
2. Validar el "Próximo paso exacto" (§3).
3. Ejecutar los comandos de verificación (§8).
4. Crear branch `etapa-3-frontend-data-layer` y empezar.
5. Al cerrar la etapa, regenerar este archivo y respaldarlo en el Google Doc.

---

**Fin del handoff. Listo para Etapa 3.**
