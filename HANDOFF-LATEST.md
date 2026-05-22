# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-22 03:15 UTC (cierre Etapa 5 + patch CI Node 24 `v0.6.2`)
> **Tag activo:** `v0.6.2` (patch CI: opt-in Node 24 para JS actions, sobre `v0.6.1` docs y `v0.6.0` Etapa 5)
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

Este documento es **autosuficiente**: contiene todo lo necesario para que un
agente IA nuevo continúe desde Etapa 6 sin necesidad de contexto extra.
Pega este documento entero al inicio de la sesión.

---

## 0. Resumen en 30 segundos

- Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
- CMS Strapi Cloud headless para contenido editable.
- Plan completo de evolución en [`PLAN-PROYECTO28-V2.md`](PLAN-PROYECTO28-V2.md) (16 etapas).
- Etapas 1-5 cerradas: versionado, schema v2 Strapi, data layer frontend,
  luz controlable, físicas Kirby **opt-in** (gravityEnabled tweak).
- Próximo paso: **Etapa 6 — Cubos encendidos + respawn + contador HUD**.

---

## 1. Cómo arrancar como nuevo agente IA (paso a paso)

### Paso 1 — Identificar el repo y abrirlo
```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"

git status                              # esperado: clean en main
git describe --tags --abbrev=0          # esperado: v0.6.2
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

### Paso 4 — Empezar Etapa 6
```bash
git checkout main && git pull
git checkout -b etapa-6-cubos-encendidos
```

Ver §3 para el detalle de la etapa.

### Paso 5 — Al cerrar la etapa
1. Verificar criterios de éxito (ver `PLAN-PROYECTO28-V2.md §4 Etapa 6`).
2. Build local OK (`npm run build`).
3. Commit en Conventional Commits con scope `game` (o `scene` si tocas
   solo tiles, o `hud` si separas el contador). Mezclar scopes en
   commits separados si la etapa requiere varios.
4. `git push -u origin etapa-6-cubos-encendidos`.
5. `git checkout main && git merge --ff-only etapa-6-cubos-encendidos && git push origin main`.
6. Tag: `git tag -a v0.7.0 -m "Etapa 6: ..." && git push origin v0.7.0`.
7. Esperar GH Actions verde (`gh run watch <ID>`).
8. Smoke test `proyecto28.com` — al activar el tweak `gravityEnabled`,
   los cubos pisados deben encenderse; caer al vacío respawnea con
   animación y el contador HUD incrementa.
9. Actualizar `CHANGELOG.md`, `README.md` (tabla etapas), `HANDOFF-LATEST.md`.
10. Commit docs directo a main, push, tag `v0.7.1` si aplica.
11. Respaldar handoff en Google Doc (ver §13 quirks).

---

## 2. Última etapa cerrada

**Etapa 5 — Físicas Kirby opt-in** (`v0.6.0`, 2026-05-22, commit `f75a96e`)

Entregables:
- **State machine** en `src/game/light.js`: modos `'floating'` y `'physics'`.
  - `floating` (default): comportamiento Etapa 4 sin cambios — mouse-follow
    a `y=1` + WASD horizontal + `mouseFollowDelay`.
  - `physics` (opt-in): gravedad `config.gravity`, raycast hacia abajo
    sobre `sceneCtx.tiles`, snap a `tile.position.y + TILE_HEIGHT/2 +
    SPHERE_RADIUS`. Saltos con espacio, multipliers Kirby `[1.0, 0.85,
    0.7, 0.55]` indexados por `jumpsUsed` (max = `config.jumpCount=4`).
  - Transiciones: WASD entra a `physics` si `gravityFlag=true`; pointermove
    o `setGravityEnabled(false)` salen.
- **Tweak `gravityEnabled`** en `site.defaults` (default `false`). Toggle
  visible en panel Tweaks → sección "Juego" → "Gravedad + saltos (WASD)".
  - `fallback.js` define el default.
  - `cms.js` mapea `a.defaultGravityEnabled ?? fb.defaults.gravityEnabled`
    (campo futuro de Strapi).
- **API nueva** en `controlLight`: `setGravityEnabled(bool)`,
  `notifyMouseMoved()` (wire en `main.js` con `onChange` y `pointermove`).
- En `floating`, `y` lerpea suave hacia `LIGHT_Y=1` para evitar teleport
  al salir de físicas.

**Decisión de diseño**: el spec original del plan describe gravedad como
default. El owner pidió que el default Etapa 4 quede intacto y la física
sea opt-in. La versión final refleja esa decisión — el plan está
actualizado implícitamente vía este handoff.

Verificado: build 621.67 KB (+0.77 KB), GH Pages deploy verde en 8s,
`proyecto28.com` sirviendo `index-Cdkh2u7j.js`.

**Patch posterior `v0.6.1`** (este commit): docs CHANGELOG + README +
HANDOFF para cierre Etapa 5. Incluye también backfill de la sección
`[0.5.1]` que faltaba en el CHANGELOG.

## 3. Próximo paso exacto — Etapa 6

**Etapa 6 — Cubos encendidos + respawn + contador HUD**

Tareas (detalle en `PLAN-PROYECTO28-V2.md §4 Etapa 6`):

1. **Detección de cubo activo** en `src/game/light.js`:
   - Cada frame en modo `physics`, el raycast hacia abajo ya existe.
     Guardar el `tile` impactado (si está grounded) como `activeTile`.
   - Exponer `activeTile` o emitir callback al cambiar
     (`onActiveTileChange`).
2. **Visual del cubo activo** en `src/scene/scene.js` (o nuevo helper):
   - Aumentar `emissiveIntensity` del cubo activo (~+0.5 a +0.8 sobre el
     baseline `ud.baseEmissive`).
   - Color un cyan más brillante o el copper definido por el cubo.
   - Transición animada de ~200ms (suficiente con lerp en el render loop;
     GSAP queda para Etapa 14).
   - Si ya había otro cubo activo → desactivarlo con la misma transición.
   - **Importante**: el estilo "cubo activo" debe ser distinguible del
     hover normal del mouse (el hover ya usa `hoverEmissive=1.4` y sube
     `position.y` a `hoverY=0.65`). El activo no debería subir el cubo.
3. **Respawn al caer al vacío** en `light.js`:
   - Cuando `mode === 'physics'` y `mesh.position.y < -10` → iniciar
     respawn.
   - Animación: la luz se desvanece (`material.opacity` 1→0 + flag
     `transparent: true`) durante `config.fallDuration` segundos
     mientras sigue cayendo.
   - Al final → reposicionar en `(0, 5, 0)` con `vy=0`, `grounded=false`.
     Fade in (`opacity` 0→1) en 0.3s.
   - Incrementar `fallCounter` y emitir callback `onRespawn(fallCounter)`.
4. **HUD contador** en nuevo módulo `src/ui/hud.js`:
   - Crear elemento DOM en esquina superior derecha (o en HUD existente
     en `index.html` — revisar primero qué hay).
   - Tipografía monospace, color tokens existentes (ver `src/styles/`).
   - Texto: `LUCES CAÍDAS: 003` con padding zero (3 dígitos).
   - Estado en memoria — resetea al recargar.
   - API: `hud.setFallCount(n)`.
5. **Wire en `main.js`**: pasar callbacks a `controlLight`
   (`onActiveTileChange`, `onRespawn`) y conectarlos al HUD + scene.

**Criterio de éxito visible:**
- Tweak `gravityEnabled` ON + WASD → la luz cae y aterriza en un cubo.
- **El cubo bajo la luz se enciende** con un estilo distinguible del
  hover de mouse.
- Caminar a otro cubo → el anterior se apaga, el nuevo se enciende.
- Caminar fuera del grid → la luz se desvanece, respawnea en `(0, 5, 0)`,
  y el contador "LUCES CAÍDAS" sube en 1.
- Activar el tweak OFF mientras está activo: el cubo activo se apaga, la
  luz vuelve a `y=1`, no hay errores.

**Riesgo:** Bajo. Las piezas mecánicas ya existen (raycast en Etapa 5,
hover-style en Etapa 4). El trabajo es de polish visual y un módulo HUD
nuevo (~50 líneas).

**Dependencias:** Etapa 5.

## 4. Estado de git

```
Repo:    https://github.com/nitenacho/Proyecto28
Branch:  main (working tree clean)
HEAD:    (commit del v0.6.1 con docs Etapa 5)
Tags:    v0.1.0 (f7a3a30 — estado handoff v1)
         v0.2.0 (0da2c23 — cierre Etapa 1: versionado)
         v0.3.0 (d61fec6 — cierre Etapa 2: Strapi schema v2)
         v0.4.0 (00968cc — cierre Etapa 3: data layer frontend)
         v0.4.1 (7944030 — docs prep para nuevo agente)
         v0.5.0 (e7390e2 — cierre Etapa 4: luz controlable)
         v0.5.1 (4e9d077 — docs cierre Etapa 4)
         v0.6.0 (f75a96e — cierre Etapa 5: físicas Kirby opt-in)
         v0.6.1 (a26bff1 — docs Etapa 5 + handoff a Etapa 6)
         v0.6.2 (HEAD     — patch CI: opt-in Node 24 para JS actions)
Remote:  origin sincronizado
```

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| Deploy on commit | ✅ activo cuando hay cambios en `cms/**` |
| `GET /api/projects?populate=*` | ✅ schema v2 (7 campos nuevos: unreal*, popup*, videoLoop) |
| `GET /api/site-setting` | ✅ schema v2 (10 campos: game*, admin*, pixelStreaming*) |
| `GET /api/admin-whitelists` | 🔒 HTTP 403 (correctamente bloqueado público) |
| Admin de Strapi | ❌ **Owner pendiente de crear** en `/admin` |
| Seed AdminWhitelist | ✅ inconcha@gmail.com (owner) + yk8arts@gmail.com (editor) |

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ desplegado |
| `proyecto28.com` | ✅ resuelve 200 OK |
| `proyecto28.cl` | ⏳ verificar propagación NIC y redirect a `.com` |
| Cloudflare zone `.cl` | ⏳ esperar `status: active` |
| GH Actions workflow | ✅ `Build and deploy frontend to GitHub Pages` activo |
| Node.js 20 actions | ✅ mitigado en `v0.6.2` vía `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`; bumps formales en Etapa 15 |

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
| CI | Node 20 actions deprecated | ✅ mitigado en `v0.6.2` | — |

**Ninguno bloquea Etapa 6.**

## 8. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS modules. Bundle 621.67 KB
  (warning >500KB — pendiente code-splitting en Etapa 15).
- **CMS:** Strapi 5.13.1 en Strapi Cloud (Postgres managed, plan Free).
  Schema v2 desplegado.
- **Hosting:** GitHub Pages (custom domains `.com` + `.cl`).
- **DNS:** `proyecto28.com` en registrar externo, `proyecto28.cl` en Cloudflare.
- **Auth:** Aún no implementado (Etapa 9).
- **Pixel Streaming:** Aún no implementado (Etapa 11), modo decidido =
  `shared`.
- **GSAP:** Aún no instalado (Etapa 14).
- **Mini-juego:** Etapa 4 cerrada — esfera de luz controlable.
  Etapa 5 cerrada — físicas Kirby opt-in. Etapa 6 agrega cubos encendidos
  + respawn + contador.

## 9. Comandos de verificación rápida

```bash
git -C "<path>/Proyecto28" status
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.6.2

curl -s 'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*' | python -c "import json,sys; d=json.load(sys.stdin); print('projects:', len(d.get('data',[])))"
curl -s -o /dev/null -w "admin-whitelist: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'

gh run list -R nitenacho/Proyecto28 --limit 3

# DevTools console esperado:
#   [p28] content source: cms
# (no debe haber logs [p28:v2] — fueron removidos en v0.5.0)
curl -I https://proyecto28.com
```

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
│   ├── scene/scene.js                 Three.js scene + tiles
│   ├── scene/hoverModel.js            Modelo procedural al hover
│   ├── game/
│   │   └── light.js                   Etapa 4 + 5: state machine floating/physics
│   ├── ui/popup.js                    Popup HUD
│   ├── ui/tweaks.js                   Panel de tweaks
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

## 11. Memorias persistidas (en máquina del owner)

`C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md` — @nitenacho, dueño de proyecto28.com/.cl
- `feedback_language.md` — usuario escribe en español, responder en español
- `project_proyecto28_stack.md` — estructura monorepo, decisiones de stack
- `reference_proyecto28_hosting.md` — punteros a GH Actions / Pages / Strapi Cloud

Estas memorias son por-máquina (no viajan al repo). Un agente IA en otra
máquina las regenerará automáticamente.

## 12. Secretos y tokens

Sin cambios desde el handoff v1. Resumen para arrancar:

- **Strapi Cloud env vars** (APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET,
  TRANSFER_TOKEN_SALT, JWT_SECRET, ENCRYPTION_KEY) — ya configuradas, ver
  `cms/README.md`.
- **GitHub Secret** `VITE_CMS_URL` = `https://honest-candy-800d1e4a92.strapiapp.com`.
- **Cloudflare** zone ID `fc59cb7669ebe62ff13ea1968c0d9796` (proyecto28.cl).

Owner rotará todos antes de salir de "desarrollo base".

## 13. Quirks del Google Doc backup (importante para próximo agente)

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

## 15. Cómo continuar (resumen para el próximo agente IA)

1. Pegar este documento entero al inicio de la sesión.
2. Validar §1 paso 3 (sistema vivo) — debe pasar.
3. Crear branch `etapa-6-cubos-encendidos` (§1 paso 4).
4. Ejecutar tareas §3 una por una. Marcar tasks completed conforme avances.
5. Al cierre, seguir §1 paso 5 al pie de la letra.
6. Regenerar este archivo. Bumpear tag a `v0.7.0`.
7. Crear nueva subpestaña en el Google Doc (§13).

**Si algo del sistema (Strapi, GH Actions, DNS) no responde como espera el
§9, NO empezar la etapa — diagnosticar primero con el owner.**

**Hint para Etapa 6**: el raycast hacia abajo en `light.js` (mode physics)
ya identifica el cubo bajo la luz. Esa data es la base del "cubo activo"
— sólo hay que exponerla via callback. El respawn aprovecha el mismo
mode + `mesh.position.y < -10` como trigger. El contador es DOM puro.

---

**Fin del handoff. Listo para Etapa 6.**
