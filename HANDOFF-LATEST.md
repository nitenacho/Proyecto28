# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-21 20:55 UTC (preparado para próximo agente IA)
> **Tag activo:** `v0.4.1` (patch documental sobre cierre Etapa 3 `v0.4.0`)
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

Este documento es **autosuficiente**: contiene todo lo necesario para que un
agente IA nuevo continúe desde Etapa 4 sin necesidad de contexto extra.
Pega este documento entero al inicio de la sesión.

---

## 0. Resumen en 30 segundos

- Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
- CMS Strapi Cloud headless para contenido editable.
- Plan completo de evolución en [`PLAN-PROYECTO28-V2.md`](PLAN-PROYECTO28-V2.md) (16 etapas).
- Etapas 1-3 cerradas: versionado, schema v2 Strapi, data layer frontend.
- Próximo paso: **Etapa 4 — Luz controlable** (mini-juego empieza aquí).

---

## 1. Cómo arrancar como nuevo agente IA (paso a paso)

### Paso 1 — Identificar el repo y abrirlo
```bash
# Ruta local en la máquina del owner:
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"

# Verificar estado
git status                              # esperado: clean en main
git describe --tags --abbrev=0          # esperado: v0.4.1
git log --oneline -5
```

Si no estás en ese path, pregunta al owner. El repo remoto es
`https://github.com/nitenacho/Proyecto28`.

### Paso 2 — Leer la documentación clave (en orden)
1. Este archivo: `HANDOFF-LATEST.md` (estás aquí).
2. `PLAN-PROYECTO28-V2.md` — Plan completo de 16 etapas, decisiones,
   arquitectura, riesgos, costos.
3. `VERSIONING.md` — Flujo de branches, Conventional Commits, checklist.
4. `CHANGELOG.md` — Historia versionada.
5. `README.md` — Overview y tabla de etapas.

### Paso 3 — Validar que el sistema está vivo
```bash
# Strapi alive con schema v2
curl -s 'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*' | python -c "import json,sys; d=json.load(sys.stdin); p=d.get('data',[])[0] if d.get('data') else {}; print('projects:', len(d.get('data',[])), '| has unrealEnabled:', 'unrealEnabled' in p)"

curl -s 'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting' | python -c "import json,sys; d=json.load(sys.stdin); s=d.get('data',{}); print('siteSetting has site.game proxy fields:', 'gameLightSpeed' in s and 'pixelStreamingMode' in s)"

# AdminWhitelist privado (debe ser 403)
curl -s -o /dev/null -w "admin-whitelist HTTP: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'

# Sitio live
curl -I https://proyecto28.com | head -3

# CI
gh run list --limit 3 -R nitenacho/Proyecto28
```

### Paso 4 — Empezar Etapa 4
```bash
git checkout main && git pull
git checkout -b etapa-4-luz-controlable
```

Ver §3 para el detalle de la etapa.

### Paso 5 — Al cerrar la etapa
1. Verificar criterios de éxito (ver `PLAN-PROYECTO28-V2.md §4 Etapa 4`).
2. Build local OK (`npm run build` desde la raíz del repo).
3. Commit en formato Conventional Commits con scope `game` o `scene`.
4. `git push -u origin etapa-4-luz-controlable`.
5. `git checkout main && git merge --ff-only etapa-4-luz-controlable && git push origin main`.
6. Tag: `git tag -a v0.5.0 -m "Etapa 4: ..." && git push origin v0.5.0`.
7. Esperar GH Actions verde (`gh run watch <ID>`).
8. Smoke test `proyecto28.com` con DevTools abierto — la luz debe seguir
   al mouse cuando este se mueve y reaccionar a WASD.
9. Actualizar `CHANGELOG.md`, `README.md` (tabla etapas), `HANDOFF-LATEST.md`.
10. Commit docs directo a main, push, tag `v0.5.1` si aplica.
11. Respaldar handoff en Google Doc (ver §13 quirks).

---

## 2. Última etapa cerrada

**Etapa 3 — Data layer frontend (schema v2)** (`v0.4.0`, 2026-05-21, commit `00968cc`)

Entregables:
- `src/data/cms.js`:
  - JSDoc typedefs `Project` y `SiteContent` documentando la shape v2.
  - `normalizeProject` mapea los 7 campos nuevos del Project.
  - `normalizeSite` agrupa los 10 campos nuevos en `site.game`, `site.admin`,
    `site.streaming` (en vez de aplanar sobre `site.defaults`).
  - Helper `num()` para conversión segura a number.
- `src/data/fallback.js`: defaults v2 alineados con el schema de Strapi.
- `src/main.js`: console.log `[p28:v2]` temporal para QA. **TODO Etapa 4:
  REMOVER estos logs cuando empiece el consumo real de `site.game.*`.**

Verificado: build local 618 KB (+2 KB), GH Pages deploy verde, smoke test
`proyecto28.com` 200 OK.

**Patch posterior `v0.4.1`** (este commit): mueve `PLAN-PROYECTO28-V2.md` al
repo + actualiza handoff para continuidad con nuevo agente.

## 3. Próximo paso exacto — Etapa 4

**Etapa 4 — Luz controlable (sin físicas todavía).**

Tareas (detalle en `PLAN-PROYECTO28-V2.md §4 Etapa 4`):

1. Crear `src/game/light.js` (nuevo módulo) con:
   - `THREE.PointLight` + `THREE.Mesh` (esfera emissiva pequeña, color cyan).
   - State: `position` (Vector3), `velocity` (Vector3),
     `lastWASDInput` (timestamp ms), `keysActive` (Set).
   - Mouse follow: raycast del cursor a un plano horizontal en `y = grid surface`,
     lerp suave hacia ese punto.
   - WASD update: cada frame mueve `position.x` y `position.z` por la
     velocidad calculada desde `site.game.lightSpeed`.
   - Priority: si `now - lastWASDInput < site.game.mouseFollowDelay * 1000`
     → ignorar mouse follow.
2. Integrar en `src/scene/scene.js` y `src/main.js`:
   - Inicializar la luz en `(0, 1, 0)` — sobre el cubo central del grid.
   - Llamar `lightUpdate(dt)` en el render loop.
3. Listeners de teclado en `src/main.js`: keydown/keyup para W/A/S/D
   (espacio queda para Etapa 5).
4. Reutilizar el listener `pointermove` ya existente para el raycast.
5. Consumir `site.game.lightSpeed` y `site.game.mouseFollowDelay` desde el
   contexto cargado.
6. **REMOVER los `console.log('[p28:v2]', ...)` de `src/main.js`** —
   están en el bloque marcado con TODO Etapa 4.
7. Build local + smoke test en `localhost:5173`.
8. Cierre: tag `v0.5.0`.

**Criterio de éxito visible:**
- Al cargar `proyecto28.com` se ve una esfera luminosa en el centro del grid.
- Mover el mouse sin tocar WASD → la luz lo sigue suavemente.
- Presionar WASD → la luz se mueve en X/Z.
- Soltar WASD por 1 segundo → vuelve a seguir el mouse.
- Sin gravedad ni saltos todavía (eso es Etapa 5).

**Aún no hay**: gravedad, saltos, respawn, contador, cubos encendidos. Eso
es Etapas 5-6.

## 4. Estado de git

```
Repo:    https://github.com/nitenacho/Proyecto28
Branch:  main (working tree clean)
HEAD:    (commit del v0.4.1 con este handoff y plan en repo)
Tags:    v0.1.0 (f7a3a30 — estado handoff v1)
         v0.2.0 (0da2c23 — cierre Etapa 1: versionado)
         v0.3.0 (d61fec6 — cierre Etapa 2: Strapi schema v2)
         v0.4.0 (00968cc — cierre Etapa 3: data layer frontend)
         v0.4.1 (HEAD     — docs prep para nuevo agente)
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

**Ninguno bloquea Etapa 4.**

## 8. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS modules. Bundle 618 KB
  (warning >500KB — pendiente code-splitting en Etapa 15).
- **CMS:** Strapi 5.13.1 en Strapi Cloud (Postgres managed, plan Free).
  Schema v2 desplegado.
- **Hosting:** GitHub Pages (custom domains `.com` + `.cl`).
- **DNS:** `proyecto28.com` en registrar externo, `proyecto28.cl` en Cloudflare.
- **Auth:** Aún no implementado (Etapa 9).
- **Pixel Streaming:** Aún no implementado (Etapa 11), modo decidido =
  `shared` (1 instancia Unreal Engine compartida).
- **GSAP:** Aún no instalado (Etapa 14).
- **Mini-juego:** Aún no implementado. Empieza en Etapa 4.

## 9. Comandos de verificación rápida

```bash
# Repo limpio en main, tag esperado
git -C "<path>/Proyecto28" status
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.4.1

# Strapi v2 alive con todos los endpoints
curl -s 'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*' | python -c "import json,sys; d=json.load(sys.stdin); print('projects:', len(d.get('data',[])))"
curl -s -o /dev/null -w "admin-whitelist: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'

# CI
gh run list -R nitenacho/Proyecto28 --limit 3

# Sitio en vivo + DevTools console esperado:
#   [p28] content source: cms
#   [p28:v2] site.game: {lightSpeed: 8, jumpHeight: 3, ...}
#   [p28:v2] first project v2 fields: {...}
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
│   ├── ui/popup.js                    Popup HUD
│   ├── ui/tweaks.js                   Panel de tweaks (vanilla port)
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
máquina las regenerará automáticamente a medida que aprenda del owner.

## 12. Secretos y tokens

Sin cambios desde el handoff v1 (sección 3 del documento original en el
Google Doc). Resumen para arrancar:

- **Strapi Cloud env vars** (APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET,
  TRANSFER_TOKEN_SALT, JWT_SECRET, ENCRYPTION_KEY) — ya configuradas, ver
  `cms/README.md` para los valores actuales.
- **GitHub Secret** `VITE_CMS_URL` = `https://honest-candy-800d1e4a92.strapiapp.com`
  (configurado en repo Settings → Secrets → Actions).
- **Cloudflare** zone ID `fc59cb7669ebe62ff13ea1968c0d9796` (proyecto28.cl).

Owner rotará todos antes de salir de "desarrollo base".

## 13. Quirks del Google Doc backup (importante para próximo agente)

El handoff de cada cierre de etapa se respalda en una subpestaña del Google Doc:
https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Estructura: subpestañas debajo de la pestaña "Handoff", una por etapa,
nombre con formato `YYYY-MM-DD HH:MM UTC - Etapa N cierre`.

### Gotchas observadas (resolver con paciencia, no son bugs del agente)

1. **`navigator.clipboard.writeText` no propaga**: el clipboard JS de la
   página Google Docs aparece como vacío al hacer `readText` después de
   escribir. Conclusión: NO confiar en clipboard para pegar el handoff.
2. **`type` con strings grandes (>4KB) puede dar timeout** de CDP
   (`dispatchKeyEvent`). Solución: partir el contenido en 3-4 chunks
   dentro de un `browser_batch`.
3. **Google Docs autocorrige `--` a `–`** (em-dash). Esto rompe los
   ejemplos de comandos shell con `--flag`. Aceptable, el contenido sigue
   legible.
4. **Renumeración automática de listas**: si una lista termina con `12.` y
   la siguiente empieza con `1.`, Google Docs renumera la segunda como
   `13.`. Aceptable.
5. **Las subpestañas se crean con nombre genérico** (`Pestaña 5`,
   `Pestaña 6`...) y hay que renombrarlas vía menú contextual → Cambiar
   nombre → ctrl+A → type → Enter.

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
10. type del contenido del HANDOFF-LATEST.md en chunks de ~2KB cada uno
    dentro de browser_batch
```

## 14. Reglas de mantención (recordatorio)

De `VERSIONING.md`:
- **Nunca trabajar directo en main** (excepto cambios solo a docs si urge).
- **Branch por etapa** `etapa-N-<slug>`.
- **Conventional Commits** con scope adecuado (`game`, `scene`, `popup`,
  `tweaks`, `auth`, `streaming`, `strapi`, `discord`, `a11y`, `mobile`,
  `release`).
- **CHANGELOG + tag** al cierre de cada etapa.
- **HANDOFF-LATEST.md regenerado** al cierre de cada etapa.
- **Respaldo en Google Doc** al cierre de cada etapa (ver §13).
- **GitHub Actions + Strapi Cloud + (futuro) Claude Design syncs son
  automáticos** — no haces deploys manuales.

## 15. Cómo continuar (resumen para el próximo agente IA)

1. Pegar este documento entero al inicio de la sesión.
2. Validar §1 paso 3 (sistema vivo) — debe pasar.
3. Crear branch `etapa-4-luz-controlable` (§1 paso 4).
4. Ejecutar tareas §3 una por una. Marcar tasks completed conforme avances.
5. Al cierre, seguir §1 paso 5 al pie de la letra.
6. Regenerar este archivo. Bumpear tag a `v0.5.0`.
7. Crear nueva subpestaña en el Google Doc (§13).

**Si algo del sistema (Strapi, GH Actions, DNS) no responde como espera el
§9, NO empezar la etapa — diagnosticar primero con el owner.**

---

**Fin del handoff. Listo para Etapa 4.**
