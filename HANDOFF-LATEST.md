# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-23 02:20 UTC (Etapa 10 cerrada `v0.14.0` + docs `v0.14.1`)
> **Tag activo:** `v0.14.0` (popup robusto + mobile + touch) · `v0.14.1` (docs)
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

Este documento es **autosuficiente**: contiene todo lo necesario para que un
agente IA nuevo continúe desde Etapa 11 sin necesidad de contexto extra.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
- CMS Strapi Cloud headless.
- Plan en [`PLAN-PROYECTO28-V2.md`](PLAN-PROYECTO28-V2.md) (16 etapas).
- **Etapas 1-10 cerradas**: versionado, schema v2 Strapi, data
  layer, luz controlable, físicas Kirby (default on), cubos +
  respawn + HUD, panel de tweaks + localStorage, botón ADMIN bajo
  brand-meta, Google OAuth + whitelist gating, **popup robusto +
  mobile responsive + touch handling** (`v0.14.0`).
- Mobile (`v0.14.0`): media queries `@max-width:768px / pointer:coarse`
  hacen el popup un bottom sheet full-width, colapsan el header,
  achican el botón ADMIN. Touch handling: primer tap muestra
  popup, segundo tap mismo cubo dentro de 500ms navega. Mouse/pen
  conserva click directo (no regresión desktop).
- Popup (`v0.14.0`): `imageURL` con lazy/decoding async, fade-in
  CSS al `onload`, fallback a oculto si `onerror`. Aspect-ratio
  16/9.
- Auth (`v0.13.0` vigente): botón ADMIN → Google Sign-In FedCM →
  whitelist Strapi → panel. `window.adminMode = true` y
  `window.p28SignOut()` como helpers QA.
- **Próximo paso: Etapa 11 — Pixel Streaming Unreal**. Wirear el
  toggle `streaming.enabled` + `mode='shared'` ya existente para
  cargar un iframe/canvas que conecte a una instancia compartida
  de Unreal Pixel Streaming cuando la luz aterriza sobre un cubo
  con `unrealEnabled=true` y `unrealStreamURL`.

---

## 1. Cómo arrancar como nuevo agente IA

### Paso 1 — Identificar el repo

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"
git status                              # esperado: clean en main
git describe --tags --abbrev=0          # esperado: v0.14.1
git log --oneline -10
```

### Paso 2 — Leer docs (orden)

1. `HANDOFF-LATEST.md` (estás aquí).
2. `PLAN-PROYECTO28-V2.md` — foco en §4 Etapa 11.
3. `VERSIONING.md` / `CHANGELOG.md` / `README.md`.

### Paso 3 — Validar sistema vivo

```bash
curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "auth/check: %{http_code}\n"       'https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'
gh run list -R nitenacho/Proyecto28 --limit 3
```

Esperado: `200`, `403`, `200`, `200`, `200`. `/auth/check` debe retornar `{"allowed":true,"role":"editor"}`.

### Paso 4 — Empezar Etapa 11

```bash
git checkout main && git pull
git checkout -b etapa-11-pixel-streaming
```

### Paso 5 — Al cerrar

1. Build local OK (`npm run build`).
2. Conventional commit con scope `streaming` o `unreal`.
3. Push, merge ff-only, tag `v0.15.0`, push --follow-tags.
4. GH Actions watch + smoke test.
5. Docs (CHANGELOG/README/HANDOFF) + tag `v0.15.1`.
6. Subpestaña nueva en Google Doc (§13).

---

## 2. Última etapa cerrada

**Etapa 10 — popup robusto + mobile responsive + touch** (`v0.14.0`, 2026-05-23)

Commits desde `v0.13.1`:
- `2659d70` feat(ui): popup robusto + mobile responsive + tap/double-tap (Etapa 10) (`v0.14.0`)

Cambios en `v0.14.0`:
- **`src/ui/popup.js`** — `imageURL` con `loading="lazy"`,
  `decoding="async"`, `onload` agrega `.loaded` para fade-in CSS,
  `onerror` oculta wrap + agrega `.failed`, limpia handlers cuando
  next project no tiene imagen.
- **`src/styles/app.css`** — nueva `.popup-image-wrap` con
  `aspect-ratio: 16/9`, overflow hidden, border-radius 8, imagen
  fade-in opacity 0→1. Media query `@media (max-width: 768px),
  (pointer: coarse)` con overrides:
  - `.chrome-top` flex-direction column, brand colapsa.
  - `.admin-btn` 3×8px, 9px font.
  - `.chrome-bottom` muestra sólo Lat+Lon.
  - **Popup → bottom sheet**: ignora side/cursor/corner, full-width
    bottom 0 con `transform: translateY(100% → 0)`, `max-height:
    65vh; overflow-y: auto`, border-radius top.
  - Tweaks panel full-width margen 8px.
- **`src/main.js`** — touch handling: `pointerdown` captura
  `{startX, startY, pointerType}`; `pointerup` calcula delta — si
  <8px tap. **Touch**: primer tap muestra popup como hover,
  segundo tap mismo `tile.id` dentro de 500ms navega; tap fuera
  cierra popup. **Mouse/pen**: navegación inmediata como antes
  (no regresión). Antes `pointerdown` navegaba directamente —
  eliminado en favor del flow up.

Decisión: animaciones via **CSS transitions** (no GSAP). GSAP
queda para Etapa 14 si se quiere algo más coreografiado.

Verificado: build JS 631.48 → **632.22 KB** (+0.7 KB), CSS 19.98
→ **21.71 KB** (+1.7 KB). GH Pages deploy verde (30s). Smoke test
desktop: popup HOLOGRAMA aparece al hover, ADMIN funcional. Mobile
testing visual queda al owner via dispositivo real — Chrome MCP
`resize_window` no afecta el viewport interno.

### Tech debt activo

**Strapi enum legacy — `Project.status` "Invalid status"**: al
editar un proyecto desde admin Strapi aparece error de enum. DB
tiene values fuera del enum actual. Fix recomendado: script
normalización en `cms/src/index.js` bootstrap. Se aborda en Etapa
12.

**Consent screen Testing mode**: si se agrega email nuevo a
`AdminWhitelist`, también agregar como test user en GCP console.

**Mobile testing pendiente**: necesita validación visual real en
device. El `resize_window` de Chrome MCP no propaga viewport.

---

## 3. Próximo paso exacto — Etapa 11: Pixel Streaming Unreal

**Objetivo**: cuando la luz aterriza sobre un cubo con
`unrealEnabled=true` y `unrealStreamURL`, montar un iframe (o
canvas via Pixel Streaming SDK) que conecte a la instancia de
Unreal Engine corriendo en el servidor compartido.

### Estado pre-requisitos

- Infra Pixel Streaming: **resuelto** = 1 instancia compartida
  (§1.1 del handoff v1). Aún no provista — el owner debe
  desplegar el server Unreal antes de que esto sea útil end-to-end,
  pero el frontend puede prepararse contra un URL placeholder.
- Schema Strapi: campos `unrealEnabled`, `unrealStreamURL`,
  `unrealLevelName` ya existen en `Project` (Etapa 2). Defaults en
  fallback: todos `null/false`. El owner setea desde el admin de
  Strapi cuando active la feature por proyecto.
- Toggle global: `site.streaming.enabled` + `site.streaming.mode`
  ya existen en panel (Etapa 7) — sólo persisten, sin efecto. Esta
  etapa los conecta.

### Tareas

1. **Nuevo módulo `src/streaming/pixelStream.js`**:
   - `mountStream({ url, mode })` crea un `<iframe>` (modo
     simple) o conecta vía `@epicgames-ps/lib-pixelstreamingfrontend-ue5.5`
     (modo SDK — más complejo, decidir luego).
   - `setActiveProject(project)` actualiza el stream si project
     tiene `unrealEnabled` + `unrealStreamURL`.
   - `clear()` desconecta y oculta.
2. **`src/main.js`** — wire-up:
   - Al cambiar `activeTile` (callback existente en
     `controlLight`), si el proyecto tiene `unrealEnabled` y
     `site.streaming.enabled`, llamar `stream.setActiveProject()`.
   - Si no, `stream.clear()`.
3. **UI**: el iframe se monta en una capa sobre el grid pero
   debajo del header/popup. `z-index: 30`. Probablemente
   `position: fixed; inset: 0;` con `pointer-events: none` hasta
   que el user clickea (similar al canvas Three.js actual).
4. **Defaults**: `site.streaming.enabled = false` por default
   (no afecta a nadie hasta que el owner active). En el panel
   Streaming, toggle ya existe.
5. **Smoke test con placeholder**:
   - Setear via DevTools console
     `site.game.project = { ...holograma, unrealEnabled: true,
     unrealStreamURL: 'https://example.com' }` y
     `site.streaming.enabled = true` desde el panel.
   - Al aterrizar luz sobre Holograma debería montarse iframe.

### Criterio de éxito visible

- Streaming disabled (default): comportamiento idéntico a
  `v0.14.0`.
- Streaming enabled + project con `unrealEnabled`: iframe se monta
  al aterrizar la luz, se desmonta al moverse.

### Riesgo

Alto. Pixel Streaming SDK es pesado y requiere infra Unreal
funcionando para validar. Recomendación: iniciar con **modo
iframe simple** (URL arbitraria) y posponer SDK a Etapa 15
(performance).

### Dependencias

- Infra Unreal del owner (puede ser placeholder/mock para
  desarrollo).
- Si se elige modo SDK: `npm i @epicgames-ps/lib-pixelstreamingfrontend-ue5.5`
  bumpea el bundle considerablemente.

---

## 4. Estado de git

```
Repo:    https://github.com/nitenacho/Proyecto28
Branch:  main (working tree clean)
HEAD:    v0.14.1 (docs Etapa 10)
Tags relevantes recientes:
  v0.12.0 — Etapa 8: botón Admin bajo brand-meta
  v0.12.1 — docs Etapa 8
  v0.13.0 — Etapa 9: Google OAuth + whitelist gating
  v0.13.1 — docs Etapa 9
  v0.14.0 — Etapa 10: popup robusto + mobile + touch
  v0.14.1 — docs Etapa 10 (HEAD)
```

---

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| `GET /api/projects?populate=*` | ✅ schema v2 (6 records) |
| `GET /api/site-setting` | ✅ schema v2 (10 campos) |
| `GET /api/admin-whitelists` | 🔒 HTTP 403 (privado) |
| `GET /api/auth/check` | ✅ público (Etapa 9) |
| Admin Strapi | ⚠️ owner sin completar registro |
| Tech debt | ⚠️ Project.status enum legacy — fix Etapa 12 |
| Seed AdminWhitelist | ✅ inconcha, cnignacioa, yk8arts |

---

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ desplegado |
| `proyecto28.com` | ✅ 200 OK |
| `proyecto28.cl` | ⏳ verificar propagación |
| GH Actions | ✅ ~30s |

---

## 7. Bloqueantes / decisiones pendientes

| # | Tema | Estado |
|---|---|---|
| §1.1 | Pixel Streaming infra | ✅ decidido shared, infra owner TBD |
| §1.2 | OAuth Client ID | ✅ Etapa 9 |
| §1.3 | Discord bot | ⏳ Etapa 12 |
| §1.4 | Claude Design | ⏳ Etapa 13 |
| §1.5 | Defaults juego | ✅ v0.9.2 |
| §1.6 | Admin Strapi creado | ❌ pendiente |
| §1.6 | `.cl` propagación | ⏳ verificar |
| **§1.9** | **Pixel Streaming modo: iframe simple vs SDK** | ⏳ definir al arrancar Etapa 11 |

---

## 8. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS. Bundle
  **632.22 KB** JS / 21.71 KB CSS.
- **CMS:** Strapi 5.13.1 (Cloud). Schema v2 + `/api/auth/check`.
- **Hosting:** GitHub Pages, custom domains `.com` + `.cl`.
- **Auth:** Google Identity Services (v0.13.0). FedCM + cache
  localStorage validado por JWT exp.
- **Popup:** v0.14.0 con imageURL robusto + fade-in.
- **Mobile:** v0.14.0 con bottom sheet popup, layout collapse,
  touch tap/double-tap.
- **Pixel Streaming:** placeholder en panel (no-op). Próxima
  Etapa 11.
- **GSAP:** no instalado. Decisión Etapa 10 = CSS transitions OK.

---

## 9. Comandos de verificación rápida

```bash
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.14.1

curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "auth/check: %{http_code}\n"       'https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'

gh run list -R nitenacho/Proyecto28 --limit 3

# DevTools console esperado en proyecto28.com:
#   [p28] content source: cms
#   Hover cubo → popup
#   Click cubo (mouse) → navega
#   En mobile: tap cubo → popup; segundo tap mismo cubo → navega
#   Click ADMIN → Google sign-in → panel si whitelist OK
```

---

## 10. Estructura del repo

```
Proyecto28/
├── README.md / CHANGELOG.md / VERSIONING.md / HANDOFF-LATEST.md
├── PLAN-PROYECTO28-V2.md / DEPLOY.md
├── index.html / package.json / vite.config.js
├── public/CNAME → proyecto28.com
├── src/
│   ├── main.js                Bootstrap + render loop + touch handlers + auth + adminButton
│   ├── auth/
│   │   ├── google.js          GIS wrapper (Etapa 9)
│   │   └── whitelist.js       /api/auth/check fetch (Etapa 9)
│   ├── scene/scene.js         Three.js + tiles
│   ├── scene/hoverModel.js    Hover model procedural
│   ├── game/light.js          Floating/physics + CCD + sombra anillo + gamepad
│   ├── ui/
│   │   ├── popup.js           Popup con imageURL robusto (Etapa 10)
│   │   ├── tweaks.js          Panel oculto + storageKey
│   │   ├── adminButton.js     Botón bajo .brand (Etapa 8)
│   │   └── hud.js             HUD LUCES CAÍDAS
│   ├── data/cms.js            Fetch Strapi
│   ├── data/fallback.js       Defaults v2
│   └── styles/                tokens.css + app.css + three-host.css
├── cms/                       Strapi 5.13.1
│   ├── src/index.js           Bootstrap permisos + seed upsert (Etapa 9)
│   └── src/api/
│       ├── project/
│       ├── site-setting/
│       └── admin-whitelist/
│           ├── routes/admin-whitelist.js   (privado)
│           ├── routes/01-auth-check.js     NEW Etapa 9: público
│           └── controllers/admin-whitelist.js  check() method
└── .github/workflows/deploy.yml CI con VITE_CMS_URL + VITE_GOOGLE_CLIENT_ID
```

---

## 11. Memorias persistidas

`C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md` / `feedback_language.md` / `project_proyecto28_stack.md`
- `reference_proyecto28_hosting.md` / `feedback_opt_in_features.md`

Por-máquina; se regeneran en otra máquina.

---

## 12. Secretos y tokens

- **Strapi Cloud env vars** ya configuradas.
- **GitHub Secrets**:
  - `VITE_CMS_URL` = `https://honest-candy-800d1e4a92.strapiapp.com`
  - `VITE_GOOGLE_CLIENT_ID` = `644563573486-…apps.googleusercontent.com` (Etapa 9)
- **Cloudflare** zone ID `fc59cb7669ebe62ff13ea1968c0d9796`.
- **Google Cloud** project `spartan-grail-401816`, OAuth Client
  "Proyecto 28 Web", consent screen Testing con 3 test users.

---

## 13. Quirks del Google Doc backup

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Subpestañas bajo "Handoff", una por etapa, `YYYY-MM-DD HH:MM UTC - Etapa N cierre`.

### Gotchas

1. `navigator.clipboard.writeText` no propaga en Docs.
2. `type` >4KB puede dar timeout CDP. Chunks 3-4 KB.
3. Autocorrige `--` → `—`. Aceptable.
4. Renumeración automática de listas. Aceptable.
5. Subpestañas se crean genéricas (`Pestaña N`) — renombrar.
6. Chrome MCP puede caer entre batches. Reconectar.
7. REEMPLAZAR contenido: click body, ctrl+a, Delete, type.

---

## 14. Reglas de mantención

- Nunca trabajar directo en main (excepto docs only).
- Branch por etapa `etapa-N-<slug>`.
- Conventional Commits + CHANGELOG + tag.
- HANDOFF regenerado al cierre.
- Respaldo Google Doc al cierre.

---

## 15. Cómo continuar

1. Pegar este documento al inicio.
2. Validar §1 paso 3.
3. **Decidir** con owner: Pixel Streaming modo (iframe simple vs SDK).
4. Crear branch `etapa-11-pixel-streaming`.
5. Ejecutar §3. Cerrar siguiendo §1 paso 5. Tag `v0.15.0` + docs `v0.15.1`.
6. Subpestaña nueva Google Doc.

**Tech debt prioritario**: Strapi `Project.status` enum legacy. Si
se agregan emails a whitelist, sincronizar con GCP consent screen
test users.

**Si algo del §9 no responde, NO empezar la etapa — diagnosticar
con el owner.**

---

**Fin del handoff (`v0.14.1`). Listo para Etapa 11.**
