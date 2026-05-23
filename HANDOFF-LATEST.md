# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-23 (cierre sesión — `v0.14.4` + docs `v0.14.5`)
> **Tag activo:** `v0.14.4` (último código) · `v0.14.5` (docs)
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

> ⚠️ **BUG PERSISTENTE BLOQUEA Etapa 11 — leer §3 ANTES de codear.** ⚠️

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
- CMS Strapi Cloud + Google OAuth + whitelist gating funcionando.
- **Etapas 1-10 cerradas en código**, pero la Etapa 10 tiene un
  **bug responsive PERSISTENTE en producción** que el owner
  confirmó con capturas iPhone + iPad sacadas justo al cargar la
  página tras `v0.14.4`. Ver §3.
- Cambios de hoy (3 hotfixes posteriores a Etapa 10 base):
  - `v0.14.2`: botón Admin reemplaza pill engine, HUD mobile más
    chico, cámara más alejada en mobile, popup mobile box-sizing +
    overflow fix.
  - `v0.14.3`: viewfinder oculto en mobile.
  - `v0.14.4`: cámara y canvas adaptive por **aspect-ratio** (no
    width threshold), `visualViewport` listener para pinch zoom,
    canvas con `!important` width/height/inset, `100dvh` para URL
    bar iOS, viewport-fit=cover, overscroll-behavior: none, media
    queries CSS ampliadas a `(max-width: 1024px), (pointer: coarse),
    (max-aspect-ratio: 1/1)`.
- **NINGUNO de los 3 hotfixes resolvió el issue** según el owner.
- Auth + whitelist + tweaks panel + adminButton + popup desktop
  funcionando bien.
- Whitelist Strapi confirmada (`/api/auth/check`): inconcha (owner),
  cnignacioa (owner), yk8arts (editor) — `allowed:true` los 3.

---

## 1. Cómo arrancar como nuevo agente IA

### Paso 1 — Identificar el repo

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"
git status                              # esperado: clean en main
git describe --tags --abbrev=0          # esperado: v0.14.5
git log --oneline -15
```

### Paso 2 — Leer docs (orden)

1. **Este archivo** (HANDOFF-LATEST.md) — foco absoluto en §3.
2. `CHANGELOG.md` — "Known issues" arriba documenta el bug.
3. `PLAN-PROYECTO28-V2.md` — Etapa 11 sigue pendiente pero NO arrancar
   hasta resolver §3.

### Paso 3 — Validar sistema vivo

```bash
curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "auth/check: %{http_code}\n"       'https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'
gh run list -R nitenacho/Proyecto28 --limit 3
```

Esperado: `200`, `403`, `200`, `200`, `200`.

### Paso 4 — ATACAR EL BUG (NO empezar Etapa 11)

```bash
git checkout main && git pull
git checkout -b fix-responsive-root-cause
```

Ver §3 para hipótesis priorizadas.

### Paso 5 — Al cerrar el fix

1. Smoke test en device real iPad + iPhone (pedirle al owner que
   confirme con captura).
2. Build local OK.
3. Conventional commit `fix(ui): root cause responsive — <descripción>`.
4. Push, merge ff-only, tag `v0.14.6` (sigue siendo patch de v0.14).
5. Si OK con owner: proceder a Etapa 11 (`v0.15.0`).

---

## 2. Lo último que se hizo (sin que funcionara)

Sesión 2026-05-23 cerró con 4 commits / 5 tags secuenciales todos
intentando resolver responsive mobile:

- `v0.14.2` ([1735580](https://github.com/nitenacho/Proyecto28/commit/1735580)):
  Admin pill replace + HUD compact + cámara mobile + popup overflow.
- `v0.14.3` ([ac95172](https://github.com/nitenacho/Proyecto28/commit/ac95172)):
  Viewfinder hidden mobile.
- `v0.14.4` ([0b7e77f](https://github.com/nitenacho/Proyecto28/commit/0b7e77f)):
  Cámara/canvas adaptive aspect-ratio + visualViewport + dvh +
  media queries CSS ampliadas. **CAMBIOS MÁS PROFUNDOS — leer
  primero.**
- `v0.14.5` (docs cierre con bug documentado).

Lo que funciona en desktop wide (>1.4 aspect): OK.
Lo que funciona en mobile/iPad: NO según el owner.

### Tech debt activo

- **`Strapi Project.status` enum legacy** — al editar proyecto en
  admin Strapi tira "Invalid status". Fix recomendado: script de
  normalización en `cms/src/index.js` bootstrap. Etapa 12 lo
  aborda formalmente.
- **Consent screen Testing mode** — si se agrega email a whitelist
  Strapi, también agregar como test user en GCP console.

---

## 3. PRÓXIMO PASO — Atacar bug responsive raíz

### El bug (descrito por el owner)

Al cargar `proyecto28.com` en iPhone 15+ Safari y iPad portrait:
- Los cubos del grid se ven enormes — la cámara está demasiado
  cerca aunque `v0.14.4` debería resolver vía aspect-ratio.
- Al hacer pinch zoom-out aparecen **franjas negras laterales**
  (canvas no cubre el viewport visual).
- **PISTA CLAVE NUEVA**: el splash `#boot` (que tiene
  `position: fixed; inset: 0; display: flex; justify-content: center;
  align-items: center`) aparece **alineado a la izquierda** en
  lugar de centrado. Eso indica que el problema está en el layout
  HTML/CSS **antes** de que el JS de Three.js corra.

### Hipótesis priorizadas para investigar

1. **(Alta confianza) El html/body NO ocupa el viewport visible.**
   - `three-host.css` tiene `html, body { width: 100%; height: 100% }`.
     `100%` se calcula respecto al viewport del navegador, PERO si
     algún elemento hijo tiene `width` fijo mayor que el viewport
     mobile, el body puede expandirse y el `position: fixed; inset: 0`
     se ancla al body expandido — moviendo todo a la izquierda.
   - **Probar**: cambiar a `width: 100vw` o `min-width: 100vw`.
   - **Verificar con DevTools**: en iPhone simulator (390px) ver
     `document.body.scrollWidth` vs `window.innerWidth`. Si difieren,
     buscar el culpable con un loop sobre `document.querySelectorAll('*')`
     filtrando `el.scrollWidth > window.innerWidth`.

2. **(Media confianza) El popup default `width: 380px` en `app.css:417`
   sigue activo en el render inicial.**
   - Aunque el media query mobile lo sobrescribe con `width: 100%
     !important`, hay una ventana de tiempo entre carga HTML y CSS
     parse donde el popup puede empujar el body width.
   - El popup está hidden (opacity 0) pero su `width: 380px` y
     `position: fixed; right: 32px` (modos side/corner) puede
     causar overflow horizontal.
   - **Probar**: agregar `max-width: 100vw` a `.popup` base (no
     sólo en mobile).

3. **(Media confianza) El meta `viewport-fit=cover` agregado en
   v0.14.4 interactúa mal con el iPad.**
   - El attribute fue para iPhone notch. En iPad puede causar que
     el viewport reporte ancho del display físico ignorando bars.
   - **Probar**: revertir a `<meta name="viewport" content="width=device-width, initial-scale=1">`.

4. **(Baja confianza) WebGLRenderer.setSize escribe `style.width`/
   `style.height` inline en el canvas con pixel values del initial
   `window.innerWidth`.**
   - `v0.14.4` agregó `!important` en CSS para combatirlo, pero
     puede que el browser priorice el `style` inline durante el
     primer paint.
   - **Probar**: usar `renderer.setSize(w, h, false)` (3er arg =
     updateStyle: false) y dejar el sizing 100% al CSS.

### Plan de ataque sugerido

Hacer las pruebas en este orden, validando con el owner tras cada
intento (pedir captura iPhone + iPad):

1. **Diagnóstico primero** (15 min): inspeccionar con DevTools mobile
   o emulator, identificar el elemento que rompe el width. Logear
   `document.body.scrollWidth`, `document.documentElement.scrollWidth`,
   `window.innerWidth`, `window.visualViewport?.width`. Si hay
   discrepancia, lista los `[...document.querySelectorAll('*')].filter(el => el.scrollWidth > window.innerWidth)`.
2. **Hipótesis 1 + 2 combinadas** (10 min): `html, body { width: 100vw }`
   + `.popup { max-width: 100vw }`. Smoke test.
3. Si sigue: hipótesis 3 (revertir viewport-fit). Smoke test.
4. Si sigue: hipótesis 4 (`setSize(w, h, false)`). Smoke test.

### Criterio de éxito visible

- Owner confirma con captura de iPhone + iPad: grid completo
  visible, splash centrado, sin franjas negras al pinch zoom.

### NO HACER antes de resolver

- ❌ Etapa 11 (Pixel Streaming) — agregar iframe encima de un layout
  roto va a complicar el diagnóstico.
- ❌ Más hotfixes mobile sin diagnóstico previo — ya hicimos 3 que
  no funcionaron.

---

## 4. Estado de git

```
Repo:    https://github.com/nitenacho/Proyecto28
Branch:  main (working tree clean)
HEAD:    v0.14.5 (docs cierre sesión)
Tags más recientes:
  v0.13.0 — Etapa 9: Google OAuth + whitelist gating
  v0.13.1 — docs Etapa 9
  v0.14.0 — Etapa 10: popup robusto + mobile + touch
  v0.14.1 — docs Etapa 10
  v0.14.2 — hotfix mobile (admin pill, hud, cámara, popup overflow)
  v0.14.3 — hotfix viewfinder mobile
  v0.14.4 — hotfix camera+canvas adaptive aspect-ratio (último código)
  v0.14.5 — docs cierre sesión con bug responsive registrado (HEAD)
```

---

## 5. Estado de Strapi Cloud

| Item | Estado |
|---|---|
| URL | `https://honest-candy-800d1e4a92.strapiapp.com` |
| `GET /api/projects?populate=*` | ✅ 200 (6 records) |
| `GET /api/site-setting` | ✅ 200 |
| `GET /api/admin-whitelists` | 🔒 403 (privado) |
| `GET /api/auth/check?email=...` | ✅ 200 (Etapa 9) |
| Tech debt | ⚠️ Project.status enum legacy — fix Etapa 12 |
| Whitelist | ✅ inconcha (owner), cnignacioa (owner), yk8arts (editor) |

---

## 6. Estado de hosting

| Item | Estado |
|---|---|
| GitHub Pages | ✅ desplegado (`v0.14.4` bundle activo) |
| `proyecto28.com` | ✅ 200 |
| `proyecto28.cl` | ⏳ verificar |
| GH Actions | ✅ ~27-30s |

---

## 7. Bloqueantes / decisiones pendientes

| # | Tema | Estado |
|---|---|---|
| **§1.0** | **BUG RESPONSIVE iPad/iPhone** | ❌ **NO RESUELTO — prioridad #1** |
| §1.1 | Pixel Streaming infra | ✅ decidido shared, infra owner TBD |
| §1.2 | OAuth Client ID | ✅ Etapa 9 |
| §1.3 | Discord bot | ⏳ Etapa 12 |
| §1.4 | Claude Design | ⏳ Etapa 13 |
| §1.5 | Defaults juego | ✅ v0.9.2 |
| §1.6 | Admin Strapi creado | ❌ pendiente |
| §1.6 | `.cl` propagación | ⏳ verificar |
| §1.9 | Pixel Streaming modo | ⏳ definir (NO bloquea hoy) |

---

## 8. Stack actual

- **Frontend:** Vite 6 + Three.js 0.176 + vanilla JS. Bundle ~633 KB.
- **CMS:** Strapi 5.13.1 + endpoint custom `/api/auth/check`.
- **Hosting:** GitHub Pages (.com + .cl).
- **Auth:** Google Identity Services + whitelist Strapi (Etapa 9).
- **Mobile responsive:** **roto en producción según owner** —
  aunque `v0.14.4` aplicó: aspect-ratio camera, visualViewport
  listener, 100dvh canvas, viewport-fit=cover, media queries
  ampliadas. Hipótesis: root cause en layout HTML/CSS base, no en
  Three.js.

---

## 9. Comandos de verificación rápida

```bash
git -C "<path>/Proyecto28" describe --tags --abbrev=0   # esperado: v0.14.5

curl -s -o /dev/null -w "projects: %{http_code}\n"          'https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*'
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" 'https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists'
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     'https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting'
curl -s -o /dev/null -w "auth/check: %{http_code}\n"       'https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com'
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   'https://proyecto28.com'

gh run list -R nitenacho/Proyecto28 --limit 3

# Para diagnosticar el bug responsive:
# Abrir DevTools en mobile simulator (iPhone 14 / iPad 11 portrait).
# En console:
#   ({ body: document.body.scrollWidth, html: document.documentElement.scrollWidth, inner: window.innerWidth, visual: window.visualViewport?.width })
# Si body o html > inner, hay overflow horizontal. Identificar culpable:
#   [...document.querySelectorAll('*')].filter(el => el.scrollWidth > window.innerWidth + 1).map(el => ({tag: el.tagName, cls: el.className, w: el.scrollWidth}))
```

---

## 10. Estructura del repo

```
Proyecto28/
├── README.md / CHANGELOG.md / VERSIONING.md / HANDOFF-LATEST.md
├── PLAN-PROYECTO28-V2.md / DEPLOY.md
├── index.html  (viewport-fit=cover desde v0.14.4)
├── package.json / vite.config.js
├── public/CNAME → proyecto28.com
├── src/
│   ├── main.js           Bootstrap + render + touch handlers + auth + adminButton
│   ├── auth/
│   │   ├── google.js     GIS wrapper (Etapa 9)
│   │   └── whitelist.js  /api/auth/check fetch (Etapa 9)
│   ├── scene/
│   │   ├── scene.js      Three.js + camera adaptive aspect (v0.14.4) + visualViewport
│   │   └── hoverModel.js
│   ├── game/light.js     Floating/physics + CCD + sombra anillo + gamepad
│   ├── ui/
│   │   ├── popup.js      imageURL robusto (v0.14.0)
│   │   ├── tweaks.js     Panel oculto + storageKey
│   │   ├── adminButton.js  Reemplaza .engine-pill (v0.14.2)
│   │   └── hud.js        LUCES CAÍDAS + media query mobile (v0.14.2)
│   ├── data/cms.js
│   ├── data/fallback.js  Defaults v2 (admin.buttonVisible=true v0.12.0)
│   └── styles/
│       ├── tokens.css
│       ├── app.css       Mobile media query con max-width:1024 + coarse + portrait (v0.14.4)
│       └── three-host.css  Canvas !important + 100dvh (v0.14.4)
├── cms/                  Strapi 5.13.1 (auth/check endpoint Etapa 9)
└── .github/workflows/deploy.yml VITE_CMS_URL + VITE_GOOGLE_CLIENT_ID
```

---

## 11. Memorias persistidas (máquina del owner)

`C:\Users\incon\.claude\projects\C--Users-incon-OneDrive-Desktop-Proyectos-Claude-Claude-P28\memory\`:
- `user_profile.md` / `feedback_language.md` / `project_proyecto28_stack.md`
- `reference_proyecto28_hosting.md` / `feedback_opt_in_features.md`

Por-máquina. Se regeneran en otra máquina.

---

## 12. Secretos y tokens

- Strapi Cloud env vars ya configuradas.
- GitHub Secrets:
  - `VITE_CMS_URL` = `https://honest-candy-800d1e4a92.strapiapp.com`
  - `VITE_GOOGLE_CLIENT_ID` = `644563573486-…apps.googleusercontent.com`
- Cloudflare zone ID `fc59cb7669ebe62ff13ea1968c0d9796`.
- Google Cloud project `spartan-grail-401816`, OAuth Client
  "Proyecto 28 Web", consent screen Testing con 3 test users.

---

## 13. Quirks del Google Doc backup

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Subpestañas bajo "Handoff", una por etapa o por cierre de sesión.

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
- Branch por etapa o por fix `fix-<slug>` / `hotfix-vX.Y.Z`.
- Conventional Commits + CHANGELOG + tag.
- HANDOFF regenerado al cierre.
- Respaldo Google Doc al cierre.

---

## 15. Cómo continuar (PRÓXIMO AGENTE — LEER ESTO)

1. Pegar este documento al inicio.
2. Validar §1 paso 3 (sistema vivo).
3. **NO ARRANCAR ETAPA 11.** Atacar primero el bug responsive
   descrito en §3.
4. Crear branch `fix-responsive-root-cause`.
5. Empezar por DIAGNÓSTICO (DevTools mobile simulator, hipótesis 1
   primero). NO hacer más hotfixes a ciegas — ya hicimos 3 sin
   éxito.
6. Validar fix con OWNER pidiendo captura iPhone + iPad antes de
   merge.
7. Tag `v0.14.6` cuando confirme.
8. Sólo entonces avanzar a Etapa 11 (`v0.15.0`).

**Tech debt menor**: Strapi Project.status enum legacy (Etapa 12).
Si agregás emails a whitelist, sincronizar con GCP consent screen.

---

**Fin del handoff (`v0.14.5`). Próximo agente: ver §3 y NO arrancar
Etapa 11 hasta resolver el responsive en device real.**
