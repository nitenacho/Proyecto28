# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-21 (cierre Etapa 1)
> **Tag activo:** `v0.2.0`
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com

Este documento es el **handoff incremental** del proyecto. Sustituye el
patrón anterior de regenerar handoffs completos cada sesión. Para pegar al
inicio de una nueva sesión con un agente IA, copia este archivo entero
(~10KB en lugar de los 60KB del handoff v1).

El handoff v1 completo (historia detallada del estado inicial) sigue
disponible como referencia y se preserva en el Google Doc oficial.

---

## 1. Estado en una línea

Etapa 1 cerrada. Versionado, CHANGELOG, scripts de release y plantilla de
handoff incremental ya en `main`. Listos para arrancar Etapa 2 (extender
schema de Strapi).

## 2. Última etapa cerrada

**Etapa 1 — Fundación de versionado** (`v0.2.0`, 2026-05-21)

Entregables:
- `CHANGELOG.md` (Keep a Changelog + SemVer).
- `VERSIONING.md` (flujo branches, commits, checklist cierre).
- `scripts/release.ps1` y `scripts/release.sh`.
- Job placeholder `sync-claude-design` en workflow (off hasta Etapa 13).
- README con sección "Cómo contribuir" + tabla de estado de etapas.
- Este archivo `HANDOFF-LATEST.md`.

Commits del cierre: ver `git log v0.1.0..v0.2.0`.

## 3. Próximo paso exacto

**Empezar Etapa 2 — Extender modelo de datos en Strapi.**

```bash
git checkout main && git pull
git checkout -b etapa-2-strapi-schema
```

Tareas (ver `PLAN-PROYECTO28-V2.md` §4 Etapa 2 para detalle):

1. Extender content type **Project** con: `unrealStreamURL`, `unrealLevelName`,
   `unrealEnabled`, `popupImage`, `popupBody` (richtext), `popupCTALabel`,
   `videoLoop`.
2. Extender content type **SiteSetting** con: `gameLightSpeed`, `gameLightJumpHeight`,
   `gameLightJumpCount`, `gameLightGravity`, `gameLightVelocityCurve`,
   `gameMouseFollowDelay`, `gameFallDuration`, `adminButtonVisible`,
   `pixelStreamingEnabled`, `pixelStreamingMode`.
3. Crear content type **AdminWhitelist** (collection) con seed:
   `inconcha@gmail.com` (owner) + `yk8arts@gmail.com` (editor).
4. Configurar permisos: Project/SiteSetting siguen públicos read,
   AdminWhitelist NO público.
5. Actualizar `cms/src/index.js` para seedear nuevos campos sin
   sobrescribir entries existentes.
6. Push → Strapi Cloud rebuild automático.
7. Verificar `/api/projects` y `/api/site-setting` devuelven nuevos campos.
8. Cierre: tag `v0.3.0`.

## 4. Estado de git

```
Repo:    github.com/nitenacho/Proyecto28
Branch:  main
HEAD:    (commit del cierre etapa 1, ver git log)
Tags:    v0.1.0 (handoff v1, en f7a3a30)
         v0.2.0 (cierre Etapa 1)
Remote:  origin sincronizado
```

Working tree esperado: clean.

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| Deploy on commit | ✅ activo |
| `GET /api/projects` | ✅ responde con 6 entries |
| `GET /api/site-setting` | ✅ responde |
| Admin de Strapi | ❌ **Owner pendiente de crear** en `/admin` |
| Schema actual | v1 (sin campos Unreal/popup/admin agregados todavía) |

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ Desplegado |
| `proyecto28.com` | ✅ Resuelve, SSL ⏳ provisionando o activo |
| `proyecto28.cl` | ⏳ Verificar propagación NIC + redirect a `.com` |
| Cloudflare zone `.cl` | ⏳ Esperar `status: active` |

## 7. Bloqueantes / decisiones pendientes

Ver `PLAN-PROYECTO28-V2.md` §1. Los relevantes para etapas próximas:

| # | Tema | Resuelto |
|---|---|---|
| §1.1 | Pixel Streaming infra | ✅ 1 instancia compartida |
| §1.2 | Google OAuth setup | ❌ Crear OAuth Client ID antes de Etapa 9 |
| §1.3 | Discord bot detalles | ⏳ Se define al llegar a Etapa 12 |
| §1.4 | Claude Design mecanismo | ⏳ Se define al llegar a Etapa 13 |
| §1.5 | Detalles del juego | ✅ Defaults del plan |
| §1.6 | Admin Strapi creado | ❌ Pendiente owner |
| §1.6 | `.cl` propagación | ⏳ Verificar antes de cerrar Etapa 2 |

## 8. Comandos para verificar el estado al arrancar nueva sesión

```bash
# Repo limpio en main
git -C "<path>/Proyecto28" status

# Ultimo tag
git -C "<path>/Proyecto28" describe --tags --abbrev=0

# Strapi vivo
curl https://honest-candy-800d1e4a92.strapiapp.com/api/projects | jq '.data | length'

# GH Actions
gh -C "<path>/Proyecto28" run list --limit 3

# Sitio en vivo
curl -I https://proyecto28.com
```

## 9. Stack actual (recordatorio rápido)

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS modules. Bundle ~616KB
  (warning Vite — pendiente code-splitting en Etapa 15).
- **CMS:** Strapi 5.13.1 en Strapi Cloud, Postgres managed, plan Free.
- **Hosting:** GitHub Pages (frontend) + Strapi Cloud (CMS) + Cloudflare DNS (`.cl`).
- **Auth:** Aún no implementado (Etapa 9 trae Google OAuth + whitelist).

## 10. Memorias persistidas

En `C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md` — @nitenacho, dueño de proyecto28.com/.cl
- `feedback_language.md` — usuario escribe en español, responder en español
- `project_proyecto28_stack.md` — estructura monorepo, decisiones de stack
- `reference_proyecto28_hosting.md` — punteros a GH Actions / Pages / Strapi Cloud

## 11. Secretos y tokens

**No se cambiaron en esta etapa.** Sección 3 del handoff v1 sigue vigente
(APP_KEYS, API_TOKEN_SALT, etc. en `cms/.env` local y Strapi Cloud env vars,
`VITE_CMS_URL` como GH secret).

El owner los rotará al final de la fase de desarrollo base.

## 12. Cómo continuar (próximo agente IA)

1. Pegar este documento en el inicio de la sesión.
2. Validar el "Próximo paso exacto" (§3).
3. Ejecutar los comandos de verificación (§8).
4. Si hay bloqueantes (§7) que afectan la etapa que toca → resolverlos con el owner.
5. Crear branch `etapa-N-<slug>` y empezar.
6. Al cerrar la etapa, regenerar este archivo y respaldarlo en el Google Doc.

---

**Fin del handoff. Listo para Etapa 2.**
