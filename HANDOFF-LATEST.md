# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-23 01:15 UTC (Etapa 8 cerrada `v0.12.0` + docs `v0.12.1`)
> **Tag activo:** `v0.12.0` (botón Admin bajo brand-meta) · `v0.12.1` (docs)
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

Este documento es **autosuficiente**: contiene todo lo necesario para que un
agente IA nuevo continúe desde Etapa 9 sin necesidad de contexto extra.
Pega este documento entero al inicio de la sesión.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
- CMS Strapi Cloud headless para contenido editable.
- Plan completo de evolución en [`PLAN-PROYECTO28-V2.md`](PLAN-PROYECTO28-V2.md) (16 etapas).
- **Etapas 1-8 cerradas**: versionado, schema v2 Strapi, data layer, luz
  controlable, físicas Kirby (default on), cubos + respawn + HUD, panel
  de tweaks completo + persistencia localStorage, **botón "Admin"
  anclado bajo "HOLOGRAMA · V0.28.1"** en el header (`v0.12.0`).
- Polish acumulado: CCD anti-traspaso, respawn dinámico sobre
  `tiles[0]`, sombra anillo con tweak de tamaño, flechas + gamepad,
  sliders de juego completos (`lightSpeed`, `jumpHeight`, `jumpCount`,
  `gravity`, `velocityCurve`, `mouseFollowDelay`, `fallDuration`,
  `shadowSize`), secciones Streaming + Admin en panel.
- Defaults afinados por el owner (`v0.9.2`): `tilt=49`, `yaw=-40`,
  `gravityEnabled=true`, `jumpHeight=1.5`, `gravity=30`, `shadowSize=0.3`.
- Admin UX (`v0.12.0`): botón ADMIN visible por default. Toggle
  "Botón admin visible" del panel lo oculta y persiste en
  `localStorage`. `window.adminMode = true` sigue funcionando como
  fallback de QA.
- **Próximo paso: Etapa 9 — Google OAuth**. Reemplazar el control
  manual (botón visible para todos) con autenticación real: sólo
  emails en `AdminWhitelist` ven el botón / acceden al panel.

---

## 1. Cómo arrancar como nuevo agente IA (paso a paso)

### Paso 1 — Identificar el repo y abrirlo

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"

git status                              # esperado: clean en main
git describe --tags --abbrev=0          # esperado: v0.12.1
git log --oneline -8
```

### Paso 2 — Leer la documentación clave (en orden)

1. Este archivo: `HANDOFF-LATEST.md` (estás aquí).
2. `PLAN-PROYECTO28-V2.md` — Plan completo de 16 etapas (foco en §4 Etapa 9).
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

### Paso 4 — Empezar Etapa 9

```bash
git checkout main && git pull
git checkout -b etapa-9-google-oauth
```

Ver §3 para el detalle.

### Paso 5 — Al cerrar la etapa

1. Verificar criterios de éxito (ver §3 + `PLAN-PROYECTO28-V2.md §4 Etapa 9`).
2. Build local OK (`npm run build`).
3. Commit Conventional Commits con scope `auth` o `ui`.
4. `git push -u origin etapa-9-google-oauth`.
5. `git checkout main && git merge --ff-only etapa-9-google-oauth && git push origin main --follow-tags`.
6. Tag: `git tag -a v0.13.0 -m "Etapa 9: Google OAuth" && git push origin v0.13.0`.
7. Esperar GH Actions verde (`gh run watch <ID>`).
8. Smoke test `proyecto28.com` — usuario anónimo no ve el botón
   ADMIN ni puede abrir el panel. Tras OAuth con email en
   `AdminWhitelist`, ve el botón y puede usar el panel.
9. Actualizar `CHANGELOG.md`, `README.md` (tabla etapas), `HANDOFF-LATEST.md`.
10. Commit docs directo a main, push, tag `v0.13.1` si aplica.
11. Respaldar handoff en Google Doc (ver §13 quirks).

---

## 2. Última etapa cerrada

**Etapa 8 — botón "Admin" bajo brand-meta** (`v0.12.0`, 2026-05-23)

Commits desde `v0.11.1`:
- `54d77c7` feat(ui): botón Admin bajo brand-meta (Etapa 8) (`v0.12.0`)

Cambios en `v0.12.0`:
- **`src/ui/adminButton.js`** (nuevo módulo) — `mountAdminButton({
  onActivate, visible })` crea un `<button class="admin-btn">` con
  `position:absolute` anclado bajo `.brand` (top: 100% + 6px, left:
  48px para alinear con `.brand-name`). Estilo mono uppercase 10px,
  border cyan semi, hover intensifica. Inyecta CSS scoped al primer
  mount. Expone `setVisible(bool)` y `destroy()`.
- **`src/main.js`** — importa `mountAdminButton`, lo monta tras
  `mountTweaks` con `onActivate: () => tweaks.show()`. El `onChange`
  del panel llama `adminButton.setVisible(state.adminButtonVisible)`
  para sync en vivo. Patrón: `let adminButton = null` declarado
  antes de `mountTweaks` para que el closure del `onChange` pueda
  referenciarlo (chequea `if (adminButton)` para la primera
  emisión cuando aún no se montó).
- **`src/data/fallback.js`** — `defaults.admin.buttonVisible`:
  `false` → **`true`** para que el botón aparezca desde el primer
  load fresh.

Verificado en `v0.12.0`: build 629.37 → **630.75 KB** (+1.4 KB).
GH Pages deploy verde (28s). Smoke test en producción: el botón
ADMIN aparece bajo "HOLOGRAMA · V0.28.1", click abre el panel
completo con todas las secciones (MARCA, POPUP, TILES 3D, HUD,
JUEGO, STREAMING, ADMIN).

### Tech debt activo

**Strapi enum legacy — `Project.status` "Invalid status"**: al editar
cualquier proyecto desde el admin Strapi, aparece `Warning: Validation
error: Invalid status`. La DB tiene values fuera del enum actual
(`["EN PRODUCCIÓN", "BETA", "PROTOTIPO", "ARCHIVADO", "EN PAUSA"]`).

**Hipótesis**: el seed inicial cargó valores sin tilde
(`EN PRODUCCION`) y al promover a `enumeration` ahora falla todo
update.

**Fix recomendado** (no aplicado): script de normalización en
`cms/src/index.js` bootstrap — iterar los 6 records, si `status`
está fuera del enum, escribir el valor válido del fallback. Se
aborda formalmente en **Etapa 12** (Pipeline Publicar).

---

## 3. Próximo paso exacto — Etapa 9: Google OAuth

**Objetivo**: cambiar el control de acceso al panel de tweaks. Hoy
cualquier visitante ve el botón ADMIN; queremos que sólo emails
listados en `AdminWhitelist` (Strapi) lo vean y puedan abrir el panel.

**Pre-requisito bloqueante (§7 Bloqueantes)**: el owner debe
crear un **Google OAuth Client ID** y agregarlo como secret de
GitHub (`VITE_GOOGLE_CLIENT_ID`). Sin eso, no se puede arrancar.

### Tareas

1. **Setup Google OAuth Client ID** (acción del owner):
   - Ir a console.cloud.google.com → APIs & Services → Credentials.
   - Create OAuth Client ID → tipo Web Application.
   - Authorized JavaScript origins: `https://proyecto28.com`,
     `https://proyecto28.cl`, `http://localhost:5173`.
   - Authorized redirect URIs: none (usamos GIS popup/implicit flow).
   - Copiar Client ID → GitHub repo → Settings → Secrets and variables
     → Actions → New secret `VITE_GOOGLE_CLIENT_ID`.
   - Agregar a `.github/workflows/deploy.yml` el env var en el step
     de build.
2. **Nuevo módulo `src/auth/google.js`** que exporta:
   - `initGoogleAuth({ clientId })` — carga Google Identity Services
     (`https://accounts.google.com/gsi/client`) lazy.
   - `signIn()` — abre popup OAuth, retorna `{ email, idToken }`.
   - `signOut()` — limpia state local.
   - `getCurrentUser()` — desde localStorage si existe.
   - Persistencia: `localStorage['p28-auth'] = JSON.stringify({ email,
     idToken, exp })`. Validar `exp` antes de devolver el user.
3. **Whitelist check via Strapi**:
   - Endpoint actual `/api/admin-whitelists` retorna `403` sin token.
   - Opción A: cambiar permisos del content-type a público (sólo
     campo `email`, no expone IDs internos). Simple pero los emails
     son públicos al fetch.
   - Opción B: nuevo endpoint público `/api/auth/check?email=...`
     que retorna `{ allowed: true/false }`. Más seguro.
   - Recomendado: **Opción B**. Crear custom controller en
     `cms/src/api/admin-whitelist/controllers/admin-whitelist.js`.
4. **`src/main.js`** — flujo de auth al boot:
   - Si hay user en `getCurrentUser()` y su email está en whitelist
     (chequear cached o fetchear), montar `adminButton` con
     `visible: true`.
   - Si no, no montar `adminButton`. `window.adminMode` se mantiene
     como fallback de QA (sigue funcionando local).
   - Si user cambia de estado (sign in/out), re-evaluar y mostrar/
     ocultar botón.
5. **UI**: el botón ADMIN abre el panel directamente si ya está
   autenticado. Si no, primero abre popup OAuth. Tras éxito, valida
   whitelist; si pasa, monta el botón + abre panel.
6. **Smoke test**:
   - Anónimo: no ve botón ADMIN. Panel inaccesible (excepto via
     `window.adminMode = true` en DevTools).
   - Email NO en whitelist: tras OAuth ve "Acceso denegado" toast,
     no se muestra panel ni botón.
   - Email en whitelist (`inconcha@gmail.com` o `yk8arts@gmail.com`):
     botón aparece, click abre panel.
   - Sign out: botón desaparece, localStorage `p28-auth` limpio.
   - Reload tras sign in: botón sigue visible (auth cached, validado
     contra exp).

### Criterio de éxito visible

- Fresh load incógnito: sin botón ADMIN, sin acceso al panel.
- Login con `inconcha@gmail.com` → botón aparece → panel se abre.
- Login con email random → "no autorizado".
- `window.adminMode = true` aún funciona (fallback QA).

### Riesgo

Medio. Primer touch con auth real en el proyecto. Hay que decidir
flujo (Google Identity Services moderno vs OAuth2 implicit clásico)
y exponer el endpoint de whitelist sin filtrar la lista entera.

### Dependencias

- **Google OAuth Client ID** (acción del owner antes de codear).
- Strapi `AdminWhitelist` ya seedeado con 2 emails (`v0.3.0`).
- `site.admin.buttonVisible` toggle del panel sigue siendo el override
  manual del owner — el flag visible/oculto pasa a depender de auth
  AND toggle (AND lógico).

---

## 4. Estado de git

```
Repo:    https://github.com/nitenacho/Proyecto28
Branch:  main (working tree clean)
HEAD:    (commit del v0.12.1 con docs Etapa 8)
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
         v0.11.1 (55e3ab8 — docs Etapa 7 cierre)
         v0.12.0 (54d77c7 — Etapa 8: botón Admin bajo brand-meta)
         v0.12.1 (HEAD     — docs Etapa 8)
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
| Seed AdminWhitelist | ✅ `inconcha@gmail.com` (owner) + `yk8arts@gmail.com` (editor) — listo para Etapa 9 |

---

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ desplegado |
| `proyecto28.com` | ✅ resuelve 200 OK |
| `proyecto28.cl` | ⏳ verificar propagación NIC y redirect a `.com` |
| Cloudflare zone `.cl` | ⏳ esperar `status: active` |
| GH Actions workflow | ✅ `Build and deploy frontend to GitHub Pages` activo (28-35s) |
| Node 20 deprecation | ✅ resuelto en `v0.6.2` (flag `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`) |

---

## 7. Bloqueantes / decisiones pendientes

| # | Tema | Estado | Bloquea desde |
|---|---|---|---|
| §1.1 | Pixel Streaming infra | ✅ resuelto: 1 instancia compartida | — |
| **§1.2** | **Google OAuth Client ID** | ❌ **pendiente — bloquea Etapa 9** | Etapa 9 |
| §1.3 | Discord bot detalles | ⏳ definir al llegar | Etapa 12 |
| §1.4 | Claude Design mecanismo | ⏳ definir al llegar | Etapa 13 |
| §1.5 | Detalles del juego | ✅ defaults en `site.game` (afinados `v0.9.2`) | — |
| §1.6 | Admin Strapi creado | ❌ pendiente | Edición visual en Strapi |
| §1.6 | `.cl` propagación | ⏳ verificar | — |
| ~~§1.7~~ | ~~Mecanismo del botón admin~~ | ✅ resuelto (botón visible bajo brand-meta, `v0.12.0`) | — |

**Tech debt prioritario**: Strapi `Project.status` enum legacy — fix
formal en Etapa 12, pero considerar tocarlo si se rompe el flujo del
owner antes.

---

## 8. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS modules. Bundle
  **630.75 KB** (warning >500KB — code-splitting en Etapa 15).
- **CMS:** Strapi 5.13.1 en Strapi Cloud (Postgres managed, plan Free).
  Schema v2 desplegado.
- **Hosting:** GitHub Pages (custom domains `.com` + `.cl`).
- **DNS:** `proyecto28.com` en registrar externo, `proyecto28.cl` en Cloudflare.
- **Auth:** Aún no implementado (próxima Etapa 9). `window.adminMode`
  + botón ADMIN visible = fallback de QA, persistente via
  `localStorage['p28-tweaks']`.
- **Pixel Streaming:** Aún no implementado (Etapa 11), modo decidido
  = `shared`. Toggle ya existe en panel pero es no-op.
- **GSAP:** Aún no instalado (Etapa 14).
- **Mini-juego (post `v0.12.0`):** luz + físicas Kirby ON default +
  cubos encendidos + respawn al vacío + HUD `LUCES CAÍDAS` + CCD +
  spawn dinámico + sombra anillo + flechas + gamepad + panel de
  tweaks completo (oculto por default, abierto por botón ADMIN o
  `window.adminMode`) con persistencia localStorage.

---

## 9. Comandos de verificación rápida

```bash
git -C "<path>/Proyecto28" status
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.12.1

# Sistema vivo (4 endpoints)
curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'

gh run list -R nitenacho/Proyecto28 --limit 3

# DevTools console esperado en proyecto28.com:
#   [p28] content source: cms  (o fallback si Strapi durmiendo)
#   Botón ADMIN visible bajo "HOLOGRAMA · V0.28.1"
#   Click → panel se abre con todas las secciones
#   window.adminMode = true    → panel aparece (fallback)
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
├── index.html                         Entry HTML (.brand-meta = "Holograma · v0.28.1")
├── package.json                       vite + three
├── vite.config.js
├── public/CNAME                       → proyecto28.com
├── scripts/
│   ├── release.ps1                    Helper de tag al cierre
│   └── release.sh
├── src/
│   ├── main.js                        Bootstrap + raycaster + render loop + adminButton + window.adminMode gate
│   ├── scene/scene.js                 Three.js scene + tiles + activeEmissive (legacy)
│   ├── scene/hoverModel.js            Modelo procedural al hover
│   ├── game/
│   │   └── light.js                   Etapas 4-6 + polish: floating/physics, CCD, sombra anillo, gamepad
│   ├── ui/
│   │   ├── popup.js                   Popup HUD
│   │   ├── tweaks.js                  Panel oculto + storageKey + show/hide API
│   │   ├── adminButton.js             NEW Etapa 8: botón ADMIN bajo .brand
│   │   └── hud.js                     HUD LUCES CAÍDAS (Etapa 6)
│   ├── data/
│   │   ├── cms.js                     Fetch Strapi + JSDoc typedefs
│   │   └── fallback.js                Defaults v2 (afinados v0.9.2, admin.buttonVisible=true v0.12.0)
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
│           └── admin-whitelist/       Etapa 2, privado (target Etapa 9: endpoint check público)
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
- **PENDIENTE Etapa 9**: `VITE_GOOGLE_CLIENT_ID` (Google OAuth Web
  Application Client ID).

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
3. **Autocorrige `--` a `–`** (em-dash). Rompe ejemplos de comandos
   con `--flag`. Aceptable.
4. **Renumeración automática de listas**: si una lista termina con
   `12.` y la siguiente empieza con `1.`, Google Docs renumera la
   segunda como `13.`. Aceptable.
5. **Las subpestañas se crean con nombre genérico** (`Pestaña N`) y
   hay que renombrarlas vía menú contextual.
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
3. **Bloqueante**: confirmar con el owner que ya creó el
   `VITE_GOOGLE_CLIENT_ID` (§7 §1.2). Sin eso, no se puede arrancar
   Etapa 9.
4. Crear branch `etapa-9-google-oauth` (§1 paso 4).
5. Ejecutar tareas §3 una por una. Marcar tasks completed conforme
   avances.
6. Al cierre, seguir §1 paso 5 al pie de la letra. Bumpear tag a
   `v0.13.0` + docs `v0.13.1`.
7. Crear nueva subpestaña en el Google Doc (§13).

**Tech debt prioritario**: si tocas Strapi por cualquier razón antes
de Etapa 12, considera resolver el bug del enum status — script de
normalización en `cms/src/index.js` bootstrap.

**Si algo del sistema (Strapi, GH Actions, DNS) no responde como
espera el §9, NO empezar la etapa — diagnosticar primero con el
owner.**

---

**Fin del handoff (`v0.12.1`). Listo para Etapa 9.**
