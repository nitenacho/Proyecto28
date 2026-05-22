# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-22 23:05 UTC (Etapa 7 cierre formal `v0.11.0` + docs `v0.11.1`)
> **Tag activo:** `v0.11.0` (sliders restantes + persistencia localStorage) · `v0.11.1` (docs)
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

Este documento es **autosuficiente**: contiene todo lo necesario para que un
agente IA nuevo continúe desde Etapa 8 sin necesidad de contexto extra.
Pega este documento entero al inicio de la sesión.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
- CMS Strapi Cloud headless para contenido editable.
- Plan completo de evolución en [`PLAN-PROYECTO28-V2.md`](PLAN-PROYECTO28-V2.md) (16 etapas).
- **Etapas 1-7 cerradas**: versionado, schema v2 Strapi, data layer, luz
  controlable, físicas Kirby (default on), cubos + respawn + HUD, y panel
  de tweaks completo (oculto por default, `window.adminMode` gate,
  todos los sliders, persistencia localStorage).
- Polish acumulado (`v0.8.0` → `v0.11.0`): CCD anti-traspaso, respawn
  dinámico sobre `tiles[0]`, sombra anillo con tweak de tamaño, flechas
  + gamepad, sliders de juego (`lightSpeed`, `jumpHeight`, `jumpCount`,
  `gravity`, `velocityCurve`, `mouseFollowDelay`, `fallDuration`,
  `shadowSize`), secciones Streaming + Admin en panel, persistencia
  local del state via `localStorage['p28-tweaks']`.
- Defaults afinados por el owner (`v0.9.2`): `tilt=49`, `yaw=-40`,
  `gravityEnabled=true`, `jumpHeight=1.5`, `gravity=30`, `shadowSize=0.3`.
- **Próximo paso: Etapa 8 — Botón admin secreto**. Reemplazar el gate
  manual por DevTools (`window.adminMode = true`) con un trigger visible
  sólo si el usuario lo conoce — ej. esquina invisible, secuencia de
  teclas tipo Konami, o long-press sobre logo.

---

## 1. Cómo arrancar como nuevo agente IA (paso a paso)

### Paso 1 — Identificar el repo y abrirlo

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"

git status                              # esperado: clean en main
git describe --tags --abbrev=0          # esperado: v0.11.1
git log --oneline -8
```

### Paso 2 — Leer la documentación clave (en orden)

1. Este archivo: `HANDOFF-LATEST.md` (estás aquí).
2. `PLAN-PROYECTO28-V2.md` — Plan completo de 16 etapas (foco en §4 Etapa 8).
3. `VERSIONING.md` — Flujo branches + Conventional Commits + checklist.
4. `CHANGELOG.md` — Historia versionada.
5. `README.md` — Overview y tabla de etapas.

### Paso 3 — Validar que el sistema está vivo

```bash
curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'
gh run list -R nitenacho/Proyecto28 --limit 3
```

Esperado: `200`, `403`, `200`, `200`, 3 runs `completed success`.

### Paso 4 — Empezar Etapa 8

```bash
git checkout main && git pull
git checkout -b etapa-8-boton-admin-secreto
```

Ver §3 para el detalle de la etapa.

### Paso 5 — Al cerrar la etapa

1. Verificar criterios de éxito (ver §3 + `PLAN-PROYECTO28-V2.md §4 Etapa 8`).
2. Build local OK (`npm run build`).
3. Commit Conventional Commits con scope `ui` o `admin`.
4. `git push -u origin etapa-8-boton-admin-secreto`.
5. `git checkout main && git merge --ff-only etapa-8-boton-admin-secreto && git push origin main --follow-tags`.
6. Tag: `git tag -a v0.12.0 -m "Etapa 8: botón admin secreto" && git push origin v0.12.0`.
7. Esperar GH Actions verde (`gh run watch <ID>`).
8. Smoke test `proyecto28.com` — al cargar fresh el panel sigue oculto.
   El trigger secreto (a definir en §3) lo abre sin tocar DevTools.
   `window.adminMode = true` debe seguir funcionando como fallback.
9. Actualizar `CHANGELOG.md`, `README.md` (tabla etapas), `HANDOFF-LATEST.md`.
10. Commit docs directo a main, push, tag `v0.12.1` si aplica.
11. Respaldar handoff en Google Doc (ver §13 quirks).

---

## 2. Última etapa cerrada

**Etapa 7 cierre formal — sliders restantes + persistencia localStorage** (`v0.11.0`, 2026-05-22)

Commits desde `v0.10.1`:
- `bfa9018` feat(tweaks): sliders restantes + persistencia localStorage (v0.11.0)

Cambios en `v0.11.0`:
- **`src/main.js`** — `tweakDefaults` ahora incluye 6 keys nuevas
  (`gameJumpCount`, `gameVelocityCurve`, `gameFallDuration`,
  `streamingEnabled`, `streamingMode`, `adminButtonVisible`). El
  `onChange` mapea cada una a `site.game.* / site.streaming.* /
  site.admin.buttonVisible` por mutación in place.
- **Sección "Juego"** gana 3 controles: `jumpCount` (slider 1-6),
  `velocityCurve` (select: kirby/linear/constant), `fallDuration`
  (slider 0.2-3s, unit `s`).
- **Nueva sección "Streaming"**: `enabled` (toggle) + `mode` (select:
  shared/dedicated). Sólo persiste state — efectos en Etapa 11.
- **Nueva sección "Admin"**: `adminButtonVisible` (toggle). Sólo
  persiste state — el botón en sí se implementa en Etapa 8 (próxima).
- **`src/ui/tweaks.js`** — nueva opción `storageKey` (default
  `'p28-tweaks'`) en `mountTweaks`. Al montar hidrata desde
  `localStorage` filtrando claves ajenas al schema (defensivo ante
  upgrades). En cada `setKey` escribe el state completo a localStorage.
  Try/catch para modo privado / quota.

Etapas previas relevantes (no cierre pero contexto):
- `v0.10.0` (Etapa 7 parcial): panel oculto por default +
  `window.adminMode` gate via `Object.defineProperty`.
- `v0.9.2` (polish 3): defaults afinados (`tilt=49`, `yaw=-40`,
  `gravityEnabled=true`, etc.).
- `v0.9.0` (polish 2): sombra anillo + tweak `shadowSize` + flechas
  + gamepad (stick izq + Face Button Bottom).
- `v0.8.0` (polish 1): continuous collision + spawn dinámico + sombra
  decal + sliders de juego en vivo.

### Tech debt activo

**Strapi enum legacy — `Project.status` "Invalid status"**: al editar
cualquier proyecto desde el admin Strapi (incluso cambiar solo el
título), aparece `Warning: Validation error: Invalid status`. El
dropdown del campo `status` muestra el valor seleccionado bien, pero
la DB tiene values fuera del enum actual (`["EN PRODUCCIÓN", "BETA",
"PROTOTIPO", "ARCHIVADO", "EN PAUSA"]`).

**Hipótesis**: el seed inicial cargó valores sin tilde
(`EN PRODUCCION`) y al promover a `enumeration` ahora falla todo
update.

**Fix recomendado** (no aplicado): script de normalización en
`cms/src/index.js` bootstrap — iterar los 6 records, si `status` está
fuera del enum, escribir el valor válido del fallback. Se aborda
formalmente en **Etapa 12** (Pipeline Publicar) que re-toca Strapi en
serio.

Verificado en `v0.11.0`: build 627.69 → **629.37 KB** (+1.7 KB).
GH Pages deploy verde (35s).

---

## 3. Próximo paso exacto — Etapa 8: Botón admin secreto

**Objetivo**: reemplazar el toggle manual `window.adminMode = true` por
un trigger discreto en la página, sólo visible/usable si el usuario lo
conoce. El gate `window.adminMode` sigue como fallback de QA.

**Diseño a decidir con el owner antes de implementar** (ver Bloqueantes):

| Opción | Pros | Contras |
|---|---|---|
| Hot-corner invisible (10x10px en esquina inferior-derecha) | Simple, no requiere input device especial | Discoverable accidental al pasar cursor |
| Secuencia tipo Konami (`↑↑↓↓←→←→ba`) | 0 elementos visibles, brando seguro | Necesita teclado físico |
| Long-press sobre el logo `P28` (3s) | Mobile-friendly | Más fricción para el owner |
| Triple-click sobre el viewfinder | Casi invisible, cross-device | Puede colisionar con interacciones futuras |

**Recomendación**: combinar **hot-corner + Konami code** — hot-corner
para escritorio rápido del owner; Konami como hidden-deep-cut.
Confirmar con el owner antes de implementar.

### Tareas (asumiendo hot-corner + Konami)

1. **Nuevo módulo `src/ui/adminTrigger.js`** que exporta
   `mountAdminTrigger({ onActivate })`:
   - Crea un `<div>` 12x12 px `position:fixed;right:0;bottom:0;` con
     `opacity:0`. Al `click` llama `onActivate()`.
   - Adjunta listener `keydown` global que matchea Konami code; al
     completar la secuencia llama `onActivate()`.
   - Sólo se monta si `site.admin.buttonVisible === true`. (Esa flag ya
     existe en el state del panel desde `v0.11.0`).
2. **`src/main.js`** — después de crear `tweaks`, llamar
   `mountAdminTrigger({ onActivate: () => tweaks.show() })` condicional
   a `site.admin.buttonVisible`.
3. **Persistencia del toggle**: el panel ya guarda
   `adminButtonVisible` en `localStorage` (`v0.11.0`), así que reload
   respeta la elección del owner aunque el panel siga oculto.
4. **Bootstrap inicial**: cuando `site.admin.buttonVisible === true`
   en el primer arranque (default actual: `false`), el trigger se
   monta. El owner lo activa una vez via DevTools (`window.adminMode
   = true` → mover toggle "Botón admin visible") y a partir de ahí
   sobrevive entre sesiones.
5. **Smoke test**:
   - Fresh load incógnito → panel oculto, hot-corner no responde
     (porque `buttonVisible=false` y `localStorage` vacío).
   - `window.adminMode = true` → panel aparece → activar toggle Admin →
     hot-corner empieza a funcionar.
   - Cerrar panel (`tweaks.hide()`), click en hot-corner → panel
     reaparece.
   - Reload → panel oculto pero hot-corner sigue activo (localStorage
     preservó la flag).
   - Konami code funciona en cualquier momento independientemente del
     toggle (es hardcoded).

### Criterio de éxito visible

- Al cargar fresh sin estado previo: panel oculto, sin elementos
  visibles que delaten admin.
- Después de habilitar `adminButtonVisible`: el owner puede abrir el
  panel sin DevTools.
- Konami code funciona como ultimate fallback.
- `window.adminMode = true` sigue funcionando (no regresión).

### Riesgo

Bajo. Los hooks existen (`tweaks.show()`, `site.admin.buttonVisible`,
localStorage persistente). El trabajo es un módulo nuevo aislado y
una llamada en `main.js`.

### Dependencias

- Etapa 7 (`v0.11.0`) — `site.admin.buttonVisible` ya está en el panel
  y persistido.
- Decisión de UX con el owner sobre qué trigger usar.

---

## 4. Estado de git

```
Repo:    https://github.com/nitenacho/Proyecto28
Branch:  main (working tree clean)
HEAD:    (commit del v0.11.1 con docs Etapa 7 cierre)
Tags:    v0.1.0  (f7a3a30 — handoff v1)
         v0.2.0  (0da2c23 — Etapa 1: versionado)
         v0.3.0  (d61fec6 — Etapa 2: Strapi schema v2)
         v0.4.0  (00968cc — Etapa 3: data layer frontend)
         v0.5.0  (e7390e2 — Etapa 4: luz controlable)
         v0.6.0  (f75a96e — Etapa 5: físicas Kirby opt-in)
         v0.7.0  (99bce02 — Etapa 6: cubos + respawn + HUD)
         v0.8.0  (3ffef61 — polish: CCD + spawn + sombra + tweaks juego)
         v0.9.0  (cbb27da — polish 2: sombra anillo + tamaño + flechas + gamepad)
         v0.9.2  (173885c — polish 3: defaults persistidos del owner)
         v0.10.0 (2ab3077 — Etapa 7 parcial: panel oculto + window.adminMode)
         v0.10.1 (23c460b — docs cierre sesión)
         v0.11.0 (bfa9018 — Etapa 7 cierre: sliders restantes + localStorage)
         v0.11.1 (HEAD     — docs Etapa 7 cierre)
Remote:  origin sincronizado
```

---

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| Deploy on commit | ✅ activo cuando hay cambios en `cms/**` |
| `GET /api/projects?populate=*` | ✅ schema v2 (6 records, 7 campos nuevos) |
| `GET /api/site-setting` | ✅ schema v2 (10 campos) |
| `GET /api/admin-whitelists` | 🔒 HTTP 403 (correctamente bloqueado público) |
| Admin de Strapi | ⚠️ Owner inició registro pero no completó (sesión 2026-05-22) |
| **Tech debt** | ⚠️ editar `Project` tira "Invalid status" (enum legacy) — fix en Etapa 12 |
| Seed AdminWhitelist | ✅ inconcha@gmail.com (owner) + yk8arts@gmail.com (editor) |

---

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ desplegado |
| `proyecto28.com` | ✅ resuelve 200 OK |
| `proyecto28.cl` | ⏳ verificar propagación NIC y redirect a `.com` |
| Cloudflare zone `.cl` | ⏳ esperar `status: active` |
| GH Actions workflow | ✅ `Build and deploy frontend to GitHub Pages` activo (35s) |
| Node 20 deprecation | ✅ resuelto en `v0.6.2` (flag `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`) |

---

## 7. Bloqueantes / decisiones pendientes

| # | Tema | Estado | Bloquea desde |
|---|---|---|---|
| §1.1 | Pixel Streaming infra | ✅ resuelto: 1 instancia compartida | — |
| §1.2 | Google OAuth Client ID | ❌ pendiente | Etapa 9 |
| §1.3 | Discord bot detalles | ⏳ definir al llegar | Etapa 12 |
| §1.4 | Claude Design mecanismo | ⏳ definir al llegar | Etapa 13 |
| §1.5 | Detalles del juego | ✅ defaults en `site.game` (afinados `v0.9.2`) | — |
| §1.6 | Admin Strapi creado | ❌ pendiente | Edición visual en Strapi |
| §1.6 | `.cl` propagación | ⏳ verificar | — |
| **§1.7** | **Mecanismo del botón admin (Etapa 8)** | ❌ definir con owner | Etapa 8 |

**Tech debt prioritario**: Strapi `Project.status` enum legacy — fix
formal en Etapa 12, pero considerar tocarlo si se rompe el flujo del
owner antes.

---

## 8. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS modules. Bundle
  **629.37 KB** (warning >500KB — code-splitting en Etapa 15).
- **CMS:** Strapi 5.13.1 en Strapi Cloud (Postgres managed, plan Free).
  Schema v2 desplegado.
- **Hosting:** GitHub Pages (custom domains `.com` + `.cl`).
- **DNS:** `proyecto28.com` en registrar externo, `proyecto28.cl` en Cloudflare.
- **Auth:** Aún no implementado (Etapa 9). `window.adminMode` =
  fallback de QA, persistente via `localStorage['p28-tweaks']`.
- **Pixel Streaming:** Aún no implementado (Etapa 11), modo decidido =
  `shared`. Toggle ya existe en panel pero es no-op.
- **GSAP:** Aún no instalado (Etapa 14).
- **Mini-juego (post `v0.11.0`):** luz + físicas Kirby ON default +
  cubos encendidos + respawn al vacío + HUD `LUCES CAÍDAS` + CCD +
  spawn dinámico + sombra anillo + flechas + gamepad + panel de
  tweaks completo (8 sliders de juego + streaming + admin) oculto por
  default con persistencia localStorage.

---

## 9. Comandos de verificación rápida

```bash
git -C "<path>/Proyecto28" status
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.11.1

# Sistema vivo (4 endpoints)
curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'

gh run list -R nitenacho/Proyecto28 --limit 3

# DevTools console esperado:
#   [p28] content source: cms  (o fallback si Strapi durmiendo)
#   window.adminMode = true    → panel aparece
#   window.adminMode = false   → panel desaparece
#   localStorage.getItem('p28-tweaks')  → JSON con el state actual
```

---

## 10. Estructura del repo

```
Proyecto28/
├── README.md                          Overview + tabla de etapas
├── CHANGELOG.md                       Versionado Keep-a-Changelog
├── VERSIONING.md                      Flujo branches + Conventional Commits
├── HANDOFF-LATEST.md                  Este archivo
├── PLAN-PROYECTO28-V2.md              Plan completo de 16 etapas
├── DEPLOY.md                          DNS + GH Pages + Strapi Cloud setup
├── index.html                         Entry HTML
├── package.json                       vite + three
├── vite.config.js
├── public/CNAME                       → proyecto28.com
├── scripts/
│   ├── release.ps1                    Helper de tag al cierre
│   └── release.sh
├── src/
│   ├── main.js                        Bootstrap + raycaster + render loop + window.adminMode gate
│   ├── scene/scene.js                 Three.js scene + tiles + activeEmissive (legacy)
│   ├── scene/hoverModel.js            Modelo procedural al hover
│   ├── game/
│   │   └── light.js                   Etapas 4-6 + polish: floating/physics, CCD, sombra anillo, gamepad
│   ├── ui/
│   │   ├── popup.js                   Popup HUD
│   │   ├── tweaks.js                  Panel oculto + storageKey + show/hide API
│   │   └── hud.js                     HUD LUCES CAÍDAS (Etapa 6)
│   ├── data/
│   │   ├── cms.js                     Fetch Strapi + JSDoc typedefs
│   │   └── fallback.js                Defaults v2 (afinados `v0.9.2`)
│   └── styles/                        Design tokens + app CSS
├── cms/                               Strapi 5.13.1
│   ├── package.json
│   ├── README.md
│   ├── config/
│   ├── scripts/unwrap-onedrive.ps1    Workaround Windows OneDrive
│   └── src/
│       ├── index.js                   Bootstrap: permisos + seed
│       └── api/
│           ├── project/               Schema v2
│           ├── site-setting/          Schema v2
│           └── admin-whitelist/       Etapa 2, privado
└── .github/workflows/deploy.yml       CI: build Vite + GH Pages
```

---

## 11. Memorias persistidas (en máquina del owner)

`C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md` — @nitenacho, dueño de proyecto28.com/.cl
- `feedback_language.md` — usuario escribe en español, responder en español
- `project_proyecto28_stack.md` — estructura monorepo, decisiones de stack
- `reference_proyecto28_hosting.md` — punteros a GH Actions / Pages / Strapi Cloud
- `feedback_opt_in_features.md` — features que cambian la página = default opt-in

Estas memorias son por-máquina (no viajan al repo). Un agente IA en otra
máquina las regenerará automáticamente.

---

## 12. Secretos y tokens

Sin cambios desde el handoff v1. Resumen para arrancar:

- **Strapi Cloud env vars** (APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET,
  TRANSFER_TOKEN_SALT, JWT_SECRET, ENCRYPTION_KEY) — ya configuradas, ver
  `cms/README.md`.
- **GitHub Secret** `VITE_CMS_URL` = `https://honest-candy-800d1e4a92.strapiapp.com`.
- **Cloudflare** zone ID `fc59cb7669ebe62ff13ea1968c0d9796` (proyecto28.cl).

Owner rotará todos antes de salir de "desarrollo base".

---

## 13. Quirks del Google Doc backup

El handoff de cada cierre de etapa se respalda en una subpestaña del Google Doc:
https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Estructura: subpestañas debajo de la pestaña "Handoff", una por etapa,
nombre `YYYY-MM-DD HH:MM UTC - Etapa N cierre`.

### Gotchas observadas

1. **`navigator.clipboard.writeText` no propaga**: el clipboard JS de
   Google Docs aparece vacío en `readText`. NO confiar en clipboard.
2. **`type` con strings grandes (>4KB) puede dar timeout** de CDP.
   Partir el contenido en chunks de 3-4 KB dentro de `browser_batch`.
3. **Autocorrige `--` a `–`** (em-dash). Rompe ejemplos de comandos con
   `--flag`. Aceptable.
4. **Renumeración automática de listas**: si una lista termina con
   `12.` y la siguiente empieza con `1.`, Google Docs renumera la
   segunda como `13.`. Aceptable.
5. **Las subpestañas se crean con nombre genérico** (`Pestaña N`) y hay
   que renombrarlas vía menú contextual.
6. **La conexión del Chrome MCP puede caer entre batches grandes**.
   Reconectar y continuar desde `ctrl+End`.
7. **Para REEMPLAZAR contenido de subpestaña existente**: click body,
   ctrl+a, Delete, type nuevo.

---

## 14. Reglas de mantención (recordatorio)

De `VERSIONING.md`:
- **Nunca trabajar directo en main** (excepto cambios solo a docs).
- **Branch por etapa** `etapa-N-<slug>`.
- **Conventional Commits** con scope adecuado.
- **CHANGELOG + tag** al cierre de cada etapa.
- **HANDOFF-LATEST.md regenerado** al cierre de cada etapa.
- **Respaldo en Google Doc** al cierre de cada etapa (ver §13).
- **GitHub Actions + Strapi Cloud + (futuro) Claude Design syncs son
  automáticos** — no haces deploys manuales.

---

## 15. Cómo continuar (resumen para el próximo agente IA)

1. Pegar este documento entero al inicio de la sesión.
2. Validar §1 paso 3 (sistema vivo) — debe pasar.
3. **Antes de codear**: alinear con el owner sobre el mecanismo del
   botón admin (§3 tabla de opciones).
4. Crear branch `etapa-8-boton-admin-secreto` (§1 paso 4).
5. Ejecutar tareas §3 una por una. Marcar tasks completed conforme
   avances.
6. Al cierre, seguir §1 paso 5 al pie de la letra. Bumpear tag a
   `v0.12.0` + docs `v0.12.1`.
7. Crear nueva subpestaña en el Google Doc (§13).

**Tech debt prioritario**: si tocas Strapi por cualquier razón antes de
Etapa 12, considera resolver el bug del enum status — script de
normalización en `cms/src/index.js` bootstrap.

**Si algo del sistema (Strapi, GH Actions, DNS) no responde como espera
el §9, NO empezar la etapa — diagnosticar primero con el owner.**

---

**Fin del handoff (`v0.11.1`). Listo para Etapa 8.**
