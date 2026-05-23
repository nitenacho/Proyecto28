# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-23 01:50 UTC (Etapa 9 cerrada `v0.13.0` + docs `v0.13.1`)
> **Tag activo:** `v0.13.0` (Google OAuth + whitelist gating) · `v0.13.1` (docs)
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

Este documento es **autosuficiente**: contiene todo lo necesario para que un
agente IA nuevo continúe desde Etapa 10 sin necesidad de contexto extra.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
- CMS Strapi Cloud headless para contenido editable.
- Plan completo en [`PLAN-PROYECTO28-V2.md`](PLAN-PROYECTO28-V2.md) (16 etapas).
- **Etapas 1-9 cerradas**: versionado, schema v2 Strapi, data layer,
  luz controlable, físicas Kirby (default on), cubos + respawn + HUD,
  panel de tweaks + localStorage, botón ADMIN bajo brand-meta,
  **Google OAuth + whitelist gating** (`v0.13.0`).
- Auth (`v0.13.0`): el botón ADMIN dispara Google Sign-In (FedCM
  prompt); tras éxito chequea email contra Strapi
  `/api/auth/check`. Sólo emails en `AdminWhitelist` ven el panel.
  Cache en `localStorage['p28-auth']` (validado vs JWT `exp`).
  `window.adminMode = true` sigue funcionando como fallback QA.
- Whitelist actual: `inconcha@gmail.com` (owner),
  `cnignacioa@gmail.com` (owner alterno), `yk8arts@gmail.com`
  (editor). Mismos 3 emails como test users en OAuth consent screen
  (proyecto GCP `spartan-grail-401816`, status Testing).
- **Próximo paso: Etapa 10 — Popup mejorado + mobile**. Refinar
  popup de proyectos (mejor placement, animaciones, manejo del
  imageURL), agregar layout responsive mobile, asegurar interacción
  touch funciona en el grid 3D.

---

## 1. Cómo arrancar como nuevo agente IA (paso a paso)

### Paso 1 — Identificar el repo y abrirlo

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"

git status                              # esperado: clean en main
git describe --tags --abbrev=0          # esperado: v0.13.1
git log --oneline -8
```

### Paso 2 — Leer la documentación clave (en orden)

1. Este archivo: `HANDOFF-LATEST.md`.
2. `PLAN-PROYECTO28-V2.md` — Plan completo de 16 etapas (foco en §4 Etapa 10).
3. `VERSIONING.md` — Flujo branches + Conventional Commits.
4. `CHANGELOG.md` — Historia versionada.
5. `README.md` — Overview + tabla de etapas.

### Paso 3 — Validar que el sistema está vivo

```bash
curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "auth/check (yk8arts): %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'
gh run list -R nitenacho/Proyecto28 --limit 3
```

Esperado: `200`, `403`, `200`, `200`, `200`. El `/auth/check` debe
devolver `{ "allowed": true, "role": "editor" }` para `yk8arts`.

### Paso 4 — Empezar Etapa 10

```bash
git checkout main && git pull
git checkout -b etapa-10-popup-mobile
```

Ver §3 para el detalle.

### Paso 5 — Al cerrar la etapa

1. Verificar criterios de éxito (§3 + `PLAN-PROYECTO28-V2.md §4 Etapa 10`).
2. Build local OK (`npm run build`).
3. Conventional Commit con scope `ui` o `mobile`.
4. Push branch, merge ff-only a main, tag `v0.14.0`, push --follow-tags.
5. GH Actions watch + smoke test en producción (incluido mobile via DevTools device emulation).
6. Docs (CHANGELOG, README tabla, HANDOFF regenerado), tag `v0.14.1`.
7. Subpestaña nueva en Google Doc (§13).

---

## 2. Última etapa cerrada

**Etapa 9 — Google OAuth + whitelist gating** (`v0.13.0`, 2026-05-23)

Commits desde `v0.12.1`:
- `e0e7134` feat(auth): Google OAuth + whitelist gating del botón Admin (Etapa 9) (`v0.13.0`)

Cambios en `v0.13.0`:
- **`src/auth/google.js`** (nuevo): wrapper GIS. `initGoogleAuth({
  clientId })` idempotente, lazy load del script
  `accounts.google.com/gsi/client`, `initialize({
  use_fedcm_for_prompt: true })`. `signIn()` dispara prompt
  FedCM/One Tap y resuelve `{ email, idToken, exp }`.
  `getCurrentUser()` lee cache `localStorage['p28-auth']` validado
  contra `exp`. `signOut()` limpia state local + disableAutoSelect.
- **`src/auth/whitelist.js`** (nuevo): `checkWhitelist(email)` →
  fetch a `/api/auth/check?email=...`. Falla silenciosa = `allowed: false`.
- **`cms/src/api/admin-whitelist/routes/01-auth-check.js`** (nuevo):
  ruta `GET /api/auth/check` con `auth: false` (pública).
- **`cms/src/api/admin-whitelist/controllers/admin-whitelist.js`**:
  método `check(ctx)` — valida formato email, queryea, retorna
  `{ allowed, role? }`. NO expone la lista.
- **`src/main.js`**: `handleAdminActivate` con 3 ramas (cache hit /
  bypass dev / sign-in + whitelist). `window.p28SignOut` expuesto
  para QA.
- **`cms/src/index.js`**: bootstrap ahora **upsert por email**
  (antes seed sólo si vacío). Agrega `cnignacioa@gmail.com` como
  owner.
- **`.github/workflows/deploy.yml`**: pasa `VITE_GOOGLE_CLIENT_ID`
  al build (además del `VITE_CMS_URL` existente).

**Pre-requisitos resueltos en esta sesión (no en commit)**:
- OAuth Client ID `644563573486-…apps.googleusercontent.com`
  creado en Google Cloud project `spartan-grail-401816`.
  Type Web Application, JS origins: `proyecto28.com`,
  `proyecto28.cl`, `localhost:5173`. Sin redirect URIs.
- 3 test users agregados en OAuth consent screen (`inconcha`,
  `cnignacioa`, `yk8arts` — todos @gmail.com).
- GitHub repo secret `VITE_GOOGLE_CLIENT_ID` en
  `nitenacho/Proyecto28` → Settings → Secrets and variables →
  Actions.

Verificado en `v0.13.0`: build 630.75 → **631.48 KB** (+0.7 KB),
32 módulos (+2). GH Pages deploy verde (39s). Strapi Cloud deploy
on commit (cms/**) — `/api/auth/check` activo tras unos minutos
de propagación.

### Tech debt activo

**Strapi enum legacy — `Project.status` "Invalid status"**: al
editar un proyecto desde el admin Strapi aparece `Warning:
Validation error: Invalid status`. La DB tiene values fuera del
enum actual (`["EN PRODUCCIÓN", "BETA", "PROTOTIPO", "ARCHIVADO",
"EN PAUSA"]`). Hipótesis: seed inicial sin tilde, ahora el enum
los rechaza. Fix recomendado: script de normalización en
`cms/src/index.js` bootstrap. Se aborda en Etapa 12 (Pipeline
Publicar).

**Consent screen Testing mode**: si se agrega un email nuevo a
`AdminWhitelist`, también hay que agregarlo como test user en GCP
console → APIs & Services → OAuth consent screen → Audience → Add
users. Hasta publicar la app, ese paso queda manual.

---

## 3. Próximo paso exacto — Etapa 10: Popup mejorado + mobile

**Objetivo**: refinar el popup de proyectos y hacer el sitio usable
en mobile (touch + layout responsive).

### Tareas

1. **Popup** (`src/ui/popup.js`):
   - Soporte robusto para `imageURL`: lazy load, fallback si 404,
     aspect ratio fijo.
   - Animación entrada/salida más fluida (fade + slight scale).
   - Mejor manejo del `corner` placement (esquina, no actualmente
     stable según handoff anterior).
   - Posibilidad de "pinear" el popup al hacer click sostenido.
2. **Mobile layout** (`src/styles/app.css` + media queries):
   - Brand header colapsa a 2 líneas en <600px.
   - Coords/hint en `.chrome-bottom` ocultos o reducidos en mobile.
   - Popup full-width sticky bottom en mobile (no flotando).
   - Botón ADMIN sigue accesible pero más pequeño.
3. **Touch del grid 3D** (`src/main.js`):
   - `pointerdown` + `pointerup` con threshold de movimiento para
     distinguir tap de drag.
   - Hover state en mobile: primer tap = hover (muestra popup),
     segundo tap en mismo cubo = navigate.
   - Considerar disable de `cameraDrift` en mobile (cubo target
     más estable para touch).
4. **Smoke test**:
   - Desktop: todo sigue igual que `v0.13.0`.
   - Mobile (DevTools device emulation iPhone/Android): popup se
     ve, touch en cubos abre popup, segundo tap navega.
   - Botón ADMIN sigue accesible y funcional.

### Criterio de éxito visible

- Fresh load mobile: brand legible, grid 3D ocupa viewport,
  primer tap sobre cubo muestra popup, segundo tap navega.
- Popup con imagen carga y mantiene aspect ratio sin saltos.
- Botón ADMIN visible en mobile (puede ser más pequeño/iconográfico).

### Riesgo

Medio. El touch en three.js raycaster + el cambio de layout puede
romper interacciones desktop si no se separa bien con media queries
+ pointerType.

### Dependencias

- Etapa 9 cerrada (auth ya funciona — no se rompe en mobile).
- Decisión opcional: ¿agregamos GSAP para las animaciones del
  popup, o seguimos con CSS transitions? Si GSAP, esto se mueve a
  Etapa 14.

---

## 4. Estado de git

```
Repo:    https://github.com/nitenacho/Proyecto28
Branch:  main (working tree clean)
HEAD:    (commit del v0.13.1 con docs Etapa 9)
Tags:    v0.1.0  — handoff v1
         v0.2.0  — Etapa 1: versionado
         v0.3.0  — Etapa 2: Strapi schema v2
         v0.4.0  — Etapa 3: data layer frontend
         v0.5.0  — Etapa 4: luz controlable
         v0.6.0  — Etapa 5: físicas Kirby opt-in
         v0.7.0  — Etapa 6: cubos + respawn + HUD
         v0.8.0  — polish: CCD + spawn + sombra + tweaks juego
         v0.9.0  — polish 2: sombra anillo + tamaño + flechas + gamepad
         v0.9.2  — polish 3: defaults persistidos del owner
         v0.10.0 — Etapa 7 parcial: panel oculto + window.adminMode
         v0.10.1 — docs cierre sesión
         v0.11.0 — Etapa 7 cierre: sliders restantes + localStorage
         v0.11.1 — docs Etapa 7 cierre
         v0.12.0 — Etapa 8: botón Admin bajo brand-meta
         v0.12.1 — docs Etapa 8
         v0.13.0 — Etapa 9: Google OAuth + whitelist gating
         v0.13.1 — docs Etapa 9 (HEAD)
Remote:  origin sincronizado
```

---

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| Deploy on commit | ✅ activo cuando hay cambios en `cms/**` |
| `GET /api/projects?populate=*` | ✅ schema v2 (6 records) |
| `GET /api/site-setting` | ✅ schema v2 (10 campos) |
| `GET /api/admin-whitelists` | 🔒 HTTP 403 (privado) |
| `GET /api/auth/check?email=...` | ✅ NUEVO Etapa 9, público |
| Admin de Strapi | ⚠️ Owner aún no completó registro |
| **Tech debt** | ⚠️ editar `Project` tira "Invalid status" — fix en Etapa 12 |
| Seed AdminWhitelist | ✅ inconcha, cnignacioa, yk8arts (3 emails) |

---

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ desplegado |
| `proyecto28.com` | ✅ 200 OK |
| `proyecto28.cl` | ⏳ verificar propagación |
| Cloudflare zone `.cl` | ⏳ status: active |
| GH Actions workflow | ✅ build & deploy (~30-40s) |
| Node 20 deprecation | ✅ resuelto v0.6.2 |

---

## 7. Bloqueantes / decisiones pendientes

| # | Tema | Estado | Bloquea |
|---|---|---|---|
| §1.1 | Pixel Streaming infra | ✅ resuelto: 1 instancia compartida | — |
| ~~§1.2~~ | ~~Google OAuth Client ID~~ | ✅ resuelto `v0.13.0` | — |
| §1.3 | Discord bot detalles | ⏳ definir al llegar | Etapa 12 |
| §1.4 | Claude Design mecanismo | ⏳ definir al llegar | Etapa 13 |
| §1.5 | Detalles del juego | ✅ defaults afinados `v0.9.2` | — |
| §1.6 | Admin Strapi creado | ❌ pendiente | Edición visual Strapi |
| §1.6 | `.cl` propagación | ⏳ verificar | — |
| **§1.8** | **GSAP en Etapa 10 o 14** | ⏳ definir con owner | Etapa 10 |

**Tech debt prioritario**: Strapi `Project.status` enum legacy (fix
Etapa 12). Consent screen Testing (publicar app o mantener test
users sincronizados con whitelist).

---

## 8. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS modules.
  Bundle **631.48 KB** (warning >500KB — code-splitting Etapa 15).
- **CMS:** Strapi 5.13.1 en Strapi Cloud. Schema v2 + endpoint
  custom `/api/auth/check`.
- **Hosting:** GitHub Pages (custom domains `.com` + `.cl`).
- **DNS:** `.com` registrar externo, `.cl` en Cloudflare.
- **Auth:** **Google Identity Services** (`v0.13.0`). FedCM prompt
  + JWT id_token decode client-side + whitelist check vía Strapi
  custom endpoint. Cache localStorage `p28-auth` validado vs JWT
  `exp`. Sin server session.
- **Pixel Streaming:** no implementado (Etapa 11), modo `shared`.
- **GSAP:** no instalado (Etapa 14, o Etapa 10 si se decide).
- **Mini-juego (post `v0.13.0`):** sin cambios desde `v0.12.0`.
  Botón ADMIN ahora gated por OAuth + whitelist.

---

## 9. Comandos de verificación rápida

```bash
git -C "<path>/Proyecto28" status
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.13.1

# Sistema vivo (5 endpoints)
curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "auth/check: %{http_code}\n"       'https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'

gh run list -R nitenacho/Proyecto28 --limit 3

# DevTools console esperado en proyecto28.com:
#   [p28] content source: cms
#   Click botón ADMIN → Google sign-in popup
#   Si email en whitelist → panel se abre
#   localStorage.getItem('p28-auth') → JSON { email, idToken, exp }
#   window.adminMode = true → bypass (panel directo)
#   window.p28SignOut() → limpia cache
```

---

## 10. Estructura del repo

```
Proyecto28/
├── README.md / CHANGELOG.md / VERSIONING.md / HANDOFF-LATEST.md
├── PLAN-PROYECTO28-V2.md / DEPLOY.md
├── index.html (.brand-meta = "Holograma · v0.28.1")
├── package.json / vite.config.js
├── public/CNAME → proyecto28.com
├── src/
│   ├── main.js                Bootstrap + render loop + adminButton + auth flow
│   ├── auth/
│   │   ├── google.js          NEW Etapa 9: GIS wrapper (initGoogleAuth/signIn/signOut/getCurrentUser)
│   │   └── whitelist.js       NEW Etapa 9: checkWhitelist → /api/auth/check
│   ├── scene/scene.js         Three.js + tiles
│   ├── scene/hoverModel.js    Modelo procedural hover
│   ├── game/light.js          Etapas 4-6 + polish
│   ├── ui/
│   │   ├── popup.js           Popup HUD (target Etapa 10)
│   │   ├── tweaks.js          Panel oculto + storageKey
│   │   ├── adminButton.js     Etapa 8 — botón bajo .brand
│   │   └── hud.js             HUD LUCES CAÍDAS
│   ├── data/cms.js            Fetch Strapi
│   ├── data/fallback.js       Defaults v2 (admin.buttonVisible=true v0.12.0)
│   └── styles/                Design tokens + app CSS
├── cms/                       Strapi 5.13.1
│   ├── src/index.js           Bootstrap permisos + seed upsert (v0.13.0)
│   └── src/api/
│       ├── project/
│       ├── site-setting/
│       └── admin-whitelist/
│           ├── routes/admin-whitelist.js   Core (privado)
│           ├── routes/01-auth-check.js     NEW Etapa 9: público
│           └── controllers/admin-whitelist.js  check() method
└── .github/workflows/deploy.yml CI con VITE_CMS_URL + VITE_GOOGLE_CLIENT_ID
```

---

## 11. Memorias persistidas

`C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md` / `feedback_language.md` / `project_proyecto28_stack.md` /
  `reference_proyecto28_hosting.md` / `feedback_opt_in_features.md`

Por-máquina. Se regeneran en otra máquina.

---

## 12. Secretos y tokens

- **Strapi Cloud env vars** ya configuradas.
- **GitHub Secrets**:
  - `VITE_CMS_URL` = `https://honest-candy-800d1e4a92.strapiapp.com`
  - `VITE_GOOGLE_CLIENT_ID` = `644563573486-5pe2jvatetd46oke9ns8gskdt0jgsfi6.apps.googleusercontent.com` (Etapa 9)
- **Cloudflare** zone ID `fc59cb7669ebe62ff13ea1968c0d9796` (proyecto28.cl).
- **Google Cloud** project `spartan-grail-401816` ("My First Project"),
  OAuth Client "Proyecto 28 Web", consent screen Testing mode con 3
  test users.

Owner rotará todos antes de salir de "desarrollo base".

---

## 13. Quirks del Google Doc backup

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Subpestañas bajo "Handoff", una por etapa. Nombre `YYYY-MM-DD HH:MM UTC - Etapa N cierre`.

### Gotchas

1. `navigator.clipboard.writeText` no propaga en Google Docs.
2. `type` >4KB puede dar timeout CDP. Chunks de 3-4 KB en `browser_batch`.
3. Autocorrige `--` → `—` (em-dash). Aceptable.
4. Renumeración automática de listas. Aceptable.
5. Subpestañas se crean con nombre genérico (`Pestaña N`) — renombrar via menú contextual.
6. Chrome MCP puede caer entre batches grandes. Reconectar.
7. REEMPLAZAR contenido existente: click body, ctrl+a, Delete, type nuevo.

---

## 14. Reglas de mantención

- Nunca trabajar directo en main (excepto docs only).
- Branch por etapa `etapa-N-<slug>`.
- Conventional Commits + CHANGELOG + tag al cierre.
- HANDOFF regenerado al cierre.
- Respaldo Google Doc al cierre.
- GH Actions + Strapi Cloud syncs automáticos.

---

## 15. Cómo continuar (resumen)

1. Pegar este documento al inicio.
2. Validar §1 paso 3 — debe pasar.
3. Crear branch `etapa-10-popup-mobile`.
4. Ejecutar §3.
5. Cerrar siguiendo §1 paso 5. Tag `v0.14.0` + docs `v0.14.1`.
6. Subpestaña nueva en Google Doc.

**Tech debt prioritario**: Strapi `Project.status` enum legacy. Si
agregás emails a whitelist, sincronizar como test users en GCP
consent screen hasta publicar la app.

**Si algo del sistema no responde como espera §9, NO empezar la
etapa — diagnosticar con el owner.**

---

**Fin del handoff (`v0.13.1`). Listo para Etapa 10.**
