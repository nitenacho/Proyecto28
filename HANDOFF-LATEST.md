# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-21 (cierre Etapa 3)
> **Tag activo:** `v0.4.0`
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com

Este documento es el **handoff incremental** del proyecto. Sustituye el
patrón anterior de regenerar handoffs completos cada sesión. Para pegar al
inicio de una nueva sesión con un agente IA, copia este archivo entero.

El handoff v1 completo (historia detallada del estado inicial) sigue
disponible como referencia y se preserva en el Google Doc oficial.

---

## 1. Estado en una línea

Etapa 3 cerrada. Frontend ya consume el schema v2: cada Project y cada
SiteContent llega con la shape completa documentada en JSDoc. Listos para
empezar Etapa 4 (luz controlable WASD + mouse follow).

## 2. Última etapa cerrada

**Etapa 3 — Data layer frontend (schema v2)** (`v0.4.0`, 2026-05-21,
commit `00968cc`)

Entregables:
- `src/data/cms.js`: JSDoc typedefs `Project` + `SiteContent`,
  `normalizeProject` con 7 campos nuevos, `normalizeSite` con `site.game` /
  `site.admin` / `site.streaming`.
- `src/data/fallback.js`: defaults v2 alineados con el schema de Strapi.
- `src/main.js`: console.log `[p28:v2]` temporal para QA. **TODO Etapa 4:
  remover estos logs cuando empiece el consumo real.**

Build verificado local: 618 KB (+2 KB vs baseline). GH Pages deploy
exitoso (~50s). Smoke test `proyecto28.com` 200 OK.

## 3. Próximo paso exacto

**Empezar Etapa 4 — Luz controlable (sin físicas todavía).**

```bash
git checkout main && git pull
git checkout -b etapa-4-luz-controlable
```

Tareas (ver `PLAN-PROYECTO28-V2.md` §4 Etapa 4):

1. Crear `src/game/light.js` con:
   - `PointLight` + `Mesh` (esfera emissiva pequeña).
   - State: position, velocity, lastWASDInput timestamp.
   - Mouse follow: raycast cursor al plano del grid, lerp suave.
   - WASD: keys activas + update por frame con `site.game.lightSpeed`.
   - Priority: si pasó `<site.game.mouseFollowDelay` desde último WASD →
     ignorar mouse follow.
2. Integrar en `src/scene/scene.js` y `src/main.js`. Inicializar en
   (0, 1, 0) — encima del cubo central.
3. Listeners de teclado: keydown/keyup para W/A/S/D.
4. Reutilizar el listener de pointermove ya existente para raycast.
5. Consumir `site.game.lightSpeed` y `site.game.mouseFollowDelay` desde el
   contexto cargado. Remover los console.log de debug de Etapa 3.
6. Cierre: tag `v0.5.0`.

**Aún no hay gravedad ni saltos.** Eso es Etapa 5.

## 4. Estado de git

```
Repo:    github.com/nitenacho/Proyecto28
Branch:  main
HEAD:    00968cc (cierre Etapa 3) + commit docs siguiente
Tags:    v0.1.0 (f7a3a30 — handoff v1)
         v0.2.0 (0da2c23 — Etapa 1)
         v0.3.0 (d61fec6 — Etapa 2)
         v0.4.0 (00968cc — Etapa 3)
Remote:  origin sincronizado
```

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| Deploy on commit | ✅ activo (no hubo cambios en `cms/` esta etapa) |
| `GET /api/projects?populate=*` | ✅ schema v2 |
| `GET /api/site-setting` | ✅ schema v2 |
| `GET /api/admin-whitelists` | 🔒 HTTP 403 |
| Admin de Strapi | ❌ **Owner pendiente de crear** en `/admin` |

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ Desplegado (último deploy: cierre Etapa 3, ~50s) |
| `proyecto28.com` | ✅ Resuelve 200 OK |
| `proyecto28.cl` | ⏳ Pendiente verificar propagación NIC |
| Console log debug `[p28:v2]` activo | ⚠️ Remover en Etapa 4 |

## 7. Bloqueantes / decisiones pendientes

Ver `PLAN-PROYECTO28-V2.md` §1. Estado actual:

| # | Tema | Estado |
|---|---|---|
| §1.1 | Pixel Streaming infra | ✅ 1 instancia compartida |
| §1.2 | Google OAuth setup | ❌ Crear OAuth Client ID antes de Etapa 9 |
| §1.3 | Discord bot detalles | ⏳ A definir en Etapa 12 |
| §1.4 | Claude Design mecanismo | ⏳ A definir en Etapa 13 |
| §1.5 | Detalles del juego | ✅ Defaults en site.game |
| §1.6 | Admin Strapi creado | ❌ Pendiente owner |
| §1.6 | `.cl` propagación | ⏳ Verificar |

Ninguno bloquea Etapa 4.

## 8. Comandos para verificar el estado al arrancar nueva sesión

```bash
# Repo
git -C "<path>/Proyecto28" status
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.4.0

# Strapi v2 alive
curl -s 'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*' | python -c "import json,sys; d=json.load(sys.stdin); print('projects:', len(d.get('data',[])))"

# GH Actions
gh -C "<path>/Proyecto28" run list --limit 3

# Sitio en vivo + DevTools console esperado:
#   [p28] content source: cms
#   [p28:v2] site.game: {lightSpeed: 8, jumpHeight: 3, ...}
#   [p28:v2] first project v2 fields: {unrealStreamURL: null, ...}
curl -I https://proyecto28.com
```

## 9. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS. Bundle 618 KB.
- **CMS:** Strapi 5.13.1 (Strapi Cloud) — schema v2 desplegado y consumido.
- **Hosting:** GitHub Pages + Strapi Cloud + Cloudflare DNS.
- **Auth:** Pendiente (Etapa 9).
- **Pixel Streaming:** Pendiente (Etapa 11), modo decidido = `shared`.
- **GSAP:** Aún no instalado (Etapa 14).
- **Mini-juego:** Aún no implementado. Empieza Etapa 4.

## 10. Memorias persistidas

En `C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md`, `feedback_language.md`, `project_proyecto28_stack.md`,
  `reference_proyecto28_hosting.md`.

## 11. Secretos y tokens

Sin cambios desde la sección 3 del handoff v1.

## 12. Cómo continuar (próximo agente IA)

1. Pegar este documento al inicio de la sesión.
2. Validar §3 (Próximo paso exacto).
3. Ejecutar comandos de verificación §8.
4. Crear branch `etapa-4-luz-controlable` y empezar.
5. Recordatorio: remover los `console.log('[p28:v2]')` de `src/main.js` al
   empezar a consumir `site.game.*` en el código del juego.
6. Al cerrar la etapa, regenerar este archivo y respaldarlo en el Google Doc.

---

**Fin del handoff. Listo para Etapa 4.**
