# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-22 18:30 UTC (cierre sesión — Etapa 7 parcial `v0.10.0` + docs `v0.10.1`)
> **Tag activo:** `v0.10.0` (tweaks panel oculto + window.adminMode gate) · `v0.10.1` (docs)
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

Este documento es **autosuficiente**: contiene todo lo necesario para que un
agente IA nuevo continúe desde Etapa 7 sin necesidad de contexto extra.
Pega este documento entero al inicio de la sesión.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
- CMS Strapi Cloud headless para contenido editable.
- Plan completo de evolución en [`PLAN-PROYECTO28-V2.md`](PLAN-PROYECTO28-V2.md) (16 etapas).
- Etapas 1-6 cerradas: versionado, schema v2 Strapi, data layer frontend,
  luz controlable, físicas Kirby **opt-in**, cubos encendidos + respawn al
  vacío + HUD `LUCES CAÍDAS`.
- Polish post-Etapa 6 (`v0.8.0`): **continuous collision** (anti-traspaso),
  **respawn dinámico** sobre `tiles[0]`, **sombra-decal cyan** debajo de
  la luz, **activeTile** = visual de hover (sube + brilla), **defaults
  más suaves** y **sliders de juego** en vivo (velocidad / altura salto /
  gravedad / mouse-follow delay).
- Polish 2 (`v0.9.0`): **sombra ahora es anillo** (RingGeometry, centro
  transparente), nuevo tweak **"Tamaño sombra"** (mantiene el efecto
  altura), **flechas del teclado** mapeadas a WASD, **gamepad** (stick
  izq + Face Button Bottom para saltar).
- Polish 3 (`v0.9.2`): defaults persistidos en `fallback.js` con los
  valores que el owner validó en vivo (`tilt=49`, `yaw=-40`,
  `gravityEnabled=true`, `jumpHeight=1.5`, `gravity=30`, `shadowSize=0.3`).
- **Etapa 7 parcial** (`v0.10.0`): panel de tweaks oculto por default.
  Toggle via `window.adminMode` desde DevTools console. Mecanismo
  temporal hasta Etapa 8 (botón admin secreto) + Etapa 9 (OAuth).
- Próximo paso: **Etapa 7 cierre formal** — sliders restantes
  (`jumpCount`, `velocityCurve`, `fallDuration`, `streaming.*`,
  `admin.adminButtonVisible`).

---

## 1. Cómo arrancar como nuevo agente IA (paso a paso)

### Paso 1 — Identificar el repo y abrirlo

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"

git status                              # esperado: clean en main
git describe --tags --abbrev=0          # esperado: v0.10.1
git log --oneline -5
```

Si no estás en ese path, pregunta al owner. El repo remoto es
`https://github.com/nitenacho/Proyecto28`.

### Paso 2 — Leer la documentación clave (en orden)

1. Este archivo: `HANDOFF-LATEST.md` (estás aquí).
2. `PLAN-PROYECTO28-V2.md` — Plan completo de 16 etapas.
3. `VERSIONING.md` — Flujo branches + Conventional Commits + checklist.
4. `CHANGELOG.md` — Historia versionada.
5. `README.md` — Overview y tabla de etapas.

### Paso 3 — Validar que el sistema está vivo

```bash
curl -s 'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*' | python -c "import json,sys; d=json.load(sys.stdin); p=d.get('data',[])[0] if d.get('data') else {}; print('projects:', len(d.get('data',[])), '| has unrealEnabled:', 'unrealEnabled' in p)"
curl -s -o /dev/null -w "admin-whitelist HTTP: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -I https://proyecto28.com | head -3
gh run list --limit 3 -R nitenacho/Proyecto28
```

### Paso 4 — Empezar Etapa 7

```bash
git checkout main && git pull
git checkout -b etapa-7-tweaks-ocultos
```

Ver §3 para el detalle de la etapa.

### Paso 5 — Al cerrar la etapa

1. Verificar criterios de éxito (ver `PLAN-PROYECTO28-V2.md §4 Etapa 7`).
2. Build local OK (`npm run build`).
3. Commit en Conventional Commits con scope `ui` (panel de tweaks) o
   `tweaks`. Si agregás un módulo nuevo, scope acorde. Mezclar scopes en
   commits separados si la etapa lo requiere.
4. `git push -u origin etapa-7-tweaks-ocultos`.
5. `git checkout main && git merge --ff-only etapa-7-tweaks-ocultos && git push origin main`.
6. Tag: `git tag -a v0.8.0 -m "Etapa 7: tweaks ocultos + sliders v2" && git push origin v0.8.0`.
7. Esperar GH Actions verde (`gh run watch <ID>`).
8. Smoke test `proyecto28.com` — al cargar fresh, no se ve el panel ni
   la rueda. `window.adminMode = true` en consola debería mostrarlo
   (placeholder hasta Etapa 9). Los sliders nuevos deben estar.
9. Actualizar `CHANGELOG.md`, `README.md` (tabla etapas), `HANDOFF-LATEST.md`.
10. Commit docs directo a main, push, tag `v0.8.1` si aplica.
11. Respaldar handoff en Google Doc (ver §13 quirks).

---

## 2. Última etapa cerrada

**Etapa 7 parcial — tweaks panel oculto + window.adminMode gate** (`v0.10.0`, 2026-05-22)

Commits desde `v0.9.0`:
- `173885c` feat(defaults): ajustes finos del owner como defaults persistentes (v0.9.2)
- `95cfc58` docs: CHANGELOG [0.9.2] (v0.9.2 docs)
- `2ab3077` feat(tweaks): panel oculto por default + gate por window.adminMode (v0.10.0)

Cambios en `v0.10.0`:
- `src/ui/tweaks.js`: `mountTweaks` acepta `initiallyVisible` (default
  `false`). Expone `show()`/`hide()`/`isVisible()`. Cuando hidden,
  ni el panel ni el FAB engranaje se renderizan.
- `src/main.js`: `Object.defineProperty(window, 'adminMode')` con
  getter/setter — asignar desde DevTools llama `tweaks.show()/hide()`.

Cambios en `v0.9.2` (ajustes finos persistidos en `fallback.js`):
- `defaults.tilt` 58 → 49
- `defaults.yaw` 0 → -40
- `defaults.gravityEnabled` false → **true** (físicas activas desde el inicio)
- `game.jumpHeight` 2.5 → 1.5
- `game.gravity` 16.0 → 30.0
- `game.shadowSize` 0.45 → 0.3

Cierre anterior (`v0.9.0`):
- `135e59f` feat(game): sombra anillo + arrow keys + gamepad (stick izq + face bottom)
- `cbb27da` feat(ui): slider 'Tamaño sombra' + actualiza label gravedad con inputs

### Tech debt detectado en esta sesión

**Strapi enum legacy — `Project.status` "Invalid status"**: al editar
cualquier proyecto desde el admin Strapi (incluso cambiar solo el
título), aparece "Warning: Validation error: Invalid status". El
dropdown muestra el valor seleccionado bien, pero la DB tiene values
fuera del enum actual (`["EN PRODUCCIÓN", "BETA", "PROTOTIPO",
"ARCHIVADO", "EN PAUSA"]`). Hipótesis: seed inicial guardó sin tilde
(`EN PRODUCCION`) y al promover a enumeration ahora falla todo update.

**Fix recomendado** (no aplicado): script de normalización en
`cms/src/index.js` bootstrap — iterar los 6 records, si status está
fuera del enum, escribir el valor válido del fallback. Se aborda en
**Etapa 12** (Pipeline Publicar) que re-toca Strapi en serio.

Cambios:
- **Sombra anillo**: `CircleGeometry` → `RingGeometry(0.78, 1.0, 48)`.
  Argolla cyan con centro transparente. Geometry unitaria; tamaño final
  vía `mesh.scale = config.shadowSize * (1 + heightAbove*0.18)`.
- **Tweak `shadowSize`** (slider 0.15-1.2, step 0.05, default 0.45)
  multiplica el scale base sin afectar el efecto de altura.
- **Flechas ↑↓←→** mapeadas a `w/s/a/d` via `arrowToWASD(key)` en
  `onKeyDown/Up`. `preventDefault()` evita scroll. Comparten `keysActive`
  con WASD.
- **Gamepad** (Web Gamepad API, standard mapping):
  - `readGamepad()` polling cada frame en `update()`.
  - Stick izq (`axes[0]`, `axes[1]`) con deadzone 0.18, mezclado con
    teclado por `getMoveVector()` (normalizado si magnitud > 1).
  - Botón 0 (Face Button Bottom: A / X / B) con edge detection para
    `tryJump()`.
  - Gamepad input + `gravityFlag` activa physics igual que WASD.

Cierre anterior (`v0.8.0`):
- `fda4246` fix(game): continuous collision + spawn sobre tile[0] + shadow decal + defaults más suaves
- `3ffef61` feat(ui): activeTile se eleva como hover + sliders de juego en vivo

Bugs corregidos:
- **Traspaso de cubos**: el raycast original solo hacía snap si la luz
  ya estaba apoyada. Con `vy*dt` grande, la luz cruzaba el cubo en un
  frame sin ser detectada. Fix: raycast desde `prevY` con `far =
  (prevY-newY) + SPHERE_RADIUS + ε` (continuous collision).
- **Respawn al vacío**: `(0,5,0)` cae sobre la celda central que es empty
  (slot `Rectangle 21`). Fix: `RESPAWN_XZ` se calcula desde `tiles[0]`
  (top-left del grid).

Features:
- **Sombra-decal cyan** debajo de la luz (mesh circular, raycast hacia
  abajo cada frame). Escala/opacidad varían con altura. Da feedback de
  dónde caerá la luz incluso en floating mode.
- **Cubo bajo la luz** se trata visualmente como hover: sube a `hoverY`
  y brilla a `hoverEmissive`. Eliminada la distinción visual anterior
  (que lo dejaba plano).
- **Sliders de juego** en sección "Juego" del panel: Velocidad,
  Altura salto, Gravedad, Delay mouse-follow. Mutan `site.game` in
  place — `controlLight` ve los nuevos valores en el siguiente frame.
- **Defaults más suaves**: `lightSpeed` 8→5, `jumpHeight` 3→2.5,
  `gravity` 20→16.

Tweak previo (Etapa 6 base `v0.7.0`): el contador HUD `LUCES CAÍDAS`,
el callback `onActiveTileChange` y el respawn con fade siguen vigentes.
La propiedad `ud.activeEmissive` agregada en `v0.7.0` ya no se usa en el
render loop pero se dejó en `userData` por compatibilidad — limpieza
opcional.

Verificado: build 626.51 KB (+2.19 KB), GH Pages deploy verde.

**Patch posterior `v0.8.1`** (este commit): docs CHANGELOG + README +
HANDOFF.

---

## 3. Próximo paso exacto — Etapa 7 cierre formal

**Etapa 7 cierre — sliders restantes (streaming, admin, etc.)**

Estado: los puntos 1 + 2 del scope ya están en `v0.10.0` (panel oculto
+ `window.adminMode` gate). Los 4 sliders principales de juego ya
están en `v0.8.0` (`lightSpeed`, `jumpHeight`, `gravity`,
`mouseFollowDelay`) + `shadowSize` en `v0.9.0`. Faltan los sliders
restantes (streaming/admin/jumpCount/velocityCurve/fallDuration).

Tareas (detalle en `PLAN-PROYECTO28-V2.md §4 Etapa 7`):

1. ✅ Panel oculto + show/hide API + window.adminMode gate (ya en `v0.10.0`).
2. ✅ Sin trigger visible (FAB también oculto cuando `visible=false`).
3. **Pendiente** — Agregar al panel:
   - **Game (resto)**: `jumpCount` (slider int 1-6), `velocityCurve`
     (dropdown — single option `kirby` por ahora), `fallDuration`
     (slider 0.2-3s).
   - **Streaming** (nueva sección): `enabled` (toggle), `mode`
     (dropdown).
   - **Admin** (nueva sección): `adminButtonVisible` (toggle —
     meta-control de Etapa 8).
4. **Pendiente** — Persistencia local en `localStorage`:
   `localStorage.setItem('p28-tweaks', JSON.stringify(state))` en cada
   cambio; al cargar `mountTweaks` lee de `localStorage` antes de caer
   al `defaults` del prop. La persistencia real al CMS llega en Etapa 12.

**Criterio de éxito visible**:
- Al cargar fresh `proyecto28.com`, no se ve el panel ni la rueda.
- `window.adminMode = true` en DevTools console → aparece el panel
  (mecanismo temporal de QA, antes de Etapa 9).
- Los sliders nuevos están y reflejan en vivo en la luz / cubos / cámara.
- Reload sin tocar `adminMode` → panel oculto otra vez.

**Riesgo**: Bajo-medio. El módulo `mountTweaks` en `src/ui/tweaks.js` ya
existe y acepta `controls: [...]` declarativos. La complejidad está en
agregar los sliders sin romper los wirings existentes en `main.js`
(`onChange`), y en exponer setters en vivo para que los sliders del juego
muten `site.game` y/o llamen `controlLight.setConfig(...)` si hace falta.

**Dependencias**: Etapa 3 (data layer ya expone los campos v2 via
`site.game/streaming/admin`).

**Hints**:
- `controlLight` toma `config: site.game` en el constructor. Si captura
  la referencia (en vez de copiarla), mutar `site.game.X` en el `onChange`
  basta para que el siguiente frame use el nuevo valor. Verificar.
- Para `jumpCount` mid-air, cuidado: si el slider lo baja por debajo de
  `jumpsUsed`, no romper. Reset implícito al aterrizar es suficiente.
- `streaming.enabled` y `mode` no tienen consumer todavía (Etapa 11) — los
  sliders son no-op pero deben persistirse en el estado del panel.
- Para `window.adminMode`, el toggle más limpio es exponer `show/hide`
  desde `mountTweaks` y usar `Object.defineProperty(window, 'adminMode', …)`
  para llamar al setter automáticamente cuando se asigna desde DevTools.

---

## 4. Estado de git

```
Repo:    https://github.com/nitenacho/Proyecto28
Branch:  main (working tree clean)
HEAD:    (commit del v0.7.1 con docs Etapa 6)
Tags:    v0.1.0 (f7a3a30 — estado handoff v1)
         v0.2.0 (0da2c23 — cierre Etapa 1: versionado)
         v0.3.0 (d61fec6 — cierre Etapa 2: Strapi schema v2)
         v0.4.0 (00968cc — cierre Etapa 3: data layer frontend)
         v0.4.1 (7944030 — docs prep para nuevo agente)
         v0.5.0 (e7390e2 — cierre Etapa 4: luz controlable)
         v0.5.1 (4e9d077 — docs cierre Etapa 4)
         v0.6.0 (f75a96e — cierre Etapa 5: físicas Kirby opt-in)
         v0.6.1 (a26bff1 — docs cierre Etapa 5)
         v0.6.2 (7f59252 — patch CI: opt-in Node 24 para JS actions)
         v0.7.0 (99bce02 — cierre Etapa 6: cubos + respawn + HUD)
         v0.7.1 (56d79ea — docs Etapa 6 + handoff a Etapa 7)
         v0.8.0 (3ffef61 — polish Etapa 6: CCD + spawn + sombra + tweaks juego)
         v0.8.1 (e747a27 — docs v0.8.0 + handoff actualizado)
         v0.9.0 (cbb27da — polish 2: sombra anillo + tamaño + flechas + gamepad)
         v0.9.1 (2d2736d — docs v0.9.0 + handoff actualizado)
         v0.9.2 (173885c — polish 3: ajustes finos del owner como defaults)
         v0.10.0 (2ab3077 — Etapa 7 parcial: tweaks panel oculto + window.adminMode)
         v0.10.1 (HEAD     — docs v0.10.0 + handoff cierre sesión)
Remote:  origin sincronizado
```

---

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| Deploy on commit | ✅ activo cuando hay cambios en `cms/**` |
| `GET /api/projects?populate=*` | ✅ schema v2 (7 campos nuevos: unreal*, popup*, videoLoop) |
| `GET /api/site-setting` | ✅ schema v2 (10 campos: game*, admin*, pixelStreaming*) |
| `GET /api/admin-whitelists` | 🔒 HTTP 403 (correctamente bloqueado público) |
| Admin de Strapi | ⚠️ Owner inició registro pero no completó (sesión 2026-05-22) |
| Seed AdminWhitelist | ✅ inconcha@gmail.com (owner) + yk8arts@gmail.com (editor) |

---

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ desplegado |
| `proyecto28.com` | ✅ resuelve 200 OK |
| `proyecto28.cl` | ⏳ verificar propagación NIC y redirect a `.com` |
| Cloudflare zone `.cl` | ⏳ esperar `status: active` |
| GH Actions workflow | ✅ `Build and deploy frontend to GitHub Pages` activo |
| Node 20 deprecation | ✅ resuelto en `v0.6.2` (flag `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`) |

---

## 7. Bloqueantes / decisiones pendientes

| # | Tema | Estado | Bloquea desde |
|---|---|---|---|
| §1.1 | Pixel Streaming infra | ✅ resuelto: 1 instancia compartida | — |
| §1.2 | Google OAuth Client ID | ❌ pendiente | Etapa 9 |
| §1.3 | Discord bot detalles | ⏳ definir al llegar | Etapa 12 |
| §1.4 | Claude Design mecanismo | ⏳ definir al llegar | Etapa 13 |
| §1.5 | Detalles del juego | ✅ defaults en `site.game` | — |
| §1.6 | Admin Strapi creado | ❌ pendiente | Edición visual en Strapi |
| §1.6 | `.cl` propagación | ⏳ verificar | — |

**Ninguno bloquea Etapa 7.**

---

## 8. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS modules. Bundle 624.32 KB
  (warning >500KB — pendiente code-splitting en Etapa 15).
- **CMS:** Strapi 5.13.1 en Strapi Cloud (Postgres managed, plan Free).
  Schema v2 desplegado.
- **Hosting:** GitHub Pages (custom domains `.com` + `.cl`).
- **DNS:** `proyecto28.com` en registrar externo, `proyecto28.cl` en Cloudflare.
- **Auth:** Aún no implementado (Etapa 9).
- **Pixel Streaming:** Aún no implementado (Etapa 11), modo decidido =
  `shared`.
- **GSAP:** Aún no instalado (Etapa 14).
- **Mini-juego:** Etapas 4-6 cerradas — luz controlable, físicas Kirby
  opt-in, cubos encendidos + respawn + contador.

---

## 9. Comandos de verificación rápida

```bash
git -C "<path>/Proyecto28" status
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.7.1

curl -s 'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*' | python -c "import json,sys; d=json.load(sys.stdin); print('projects:', len(d.get('data',[])))"
curl -s -o /dev/null -w "admin-whitelist: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'

gh run list -R nitenacho/Proyecto28 --limit 3

# DevTools console esperado:
#   [p28] content source: cms
# (no debe haber logs [p28:v2] — fueron removidos en v0.5.0)
curl -I https://proyecto28.com
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
│   ├── main.js                        Bootstrap + raycaster + render loop
│   ├── scene/scene.js                 Three.js scene + tiles + activeEmissive
│   ├── scene/hoverModel.js            Modelo procedural al hover
│   ├── game/
│   │   └── light.js                   Etapas 4-6: floating/physics + activeTile + respawn
│   ├── ui/popup.js                    Popup HUD
│   ├── ui/tweaks.js                   Panel de tweaks (próximo target Etapa 7)
│   ├── ui/hud.js                      HUD LUCES CAÍDAS (Etapa 6)
│   ├── data/
│   │   ├── cms.js                     Fetch Strapi + JSDoc typedefs
│   │   └── fallback.js                Defaults v2 cuando Strapi cae
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
│           └── admin-whitelist/       NEW Etapa 2, privado
└── .github/workflows/deploy.yml       CI: build Vite + GH Pages
```

---

## 11. Memorias persistidas (en máquina del owner)

`C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md` — @nitenacho, dueño de proyecto28.com/.cl
- `feedback_language.md` — usuario escribe en español, responder en español
- `project_proyecto28_stack.md` — estructura monorepo, decisiones de stack
- `reference_proyecto28_hosting.md` — punteros a GH Actions / Pages / Strapi Cloud

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
2. **`type` con strings grandes (>4KB) puede dar timeout** de CDP. Partir
   el contenido en 3-4 chunks dentro de un `browser_batch`.
3. **Autocorrige `--` a `–`** (em-dash). Rompe ejemplos de comandos con
   `--flag`. Aceptable.
4. **Renumeración automática de listas**: si una lista termina con `12.`
   y la siguiente empieza con `1.`, Google Docs renumera la segunda como
   `13.`. Aceptable.
5. **Las subpestañas se crean con nombre genérico** (`Pestaña N`) y hay
   que renombrarlas vía menú contextual.

### Pasos para crear nueva subpestaña al cerrar una etapa

```
1. tabs_context_mcp para tener tabId
2. navigate al Google Doc URL
3. find "Handoff tab in left sidebar"
4. right_click sobre la treeitem
5. find "Añadir subpestaña" + left_click
6. find "Opciones de pestaña" del nuevo Pestaña N
7. left_click → menu → "Cambiar nombre"
8. ctrl+a, type "YYYY-MM-DD HH:MM UTC - Etapa N cierre", Return
9. Click en el body del doc para focus
10. type del contenido en chunks de ~2KB dentro de browser_batch
```

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
3. Crear branch `etapa-7-tweaks-ocultos` (§1 paso 4).
4. Ejecutar tareas §3 una por una. Marcar tasks completed conforme avances.
5. Al cierre, seguir §1 paso 5 al pie de la letra.
6. Regenerar este archivo. Bumpear tag a `v0.8.0`.
7. Crear nueva subpestaña en el Google Doc (§13).

**Si algo del sistema (Strapi, GH Actions, DNS) no responde como espera el
§9, NO empezar la etapa — diagnosticar primero con el owner.**

---

**Fin del handoff. Listo para Etapa 7.**
