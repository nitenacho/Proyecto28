# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-05-25 (cierre Etapa 11 - `v0.15.0`)
> **Tag activo:** `v0.15.0`
> **Branch:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

> Etapas 1-11 cerradas. Pixel Streaming queda integrado en primer corte
> iframe/overlay/fallback, con preview apagable desde Strapi/Tweaks.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite),
CMS Strapi Cloud, Google OAuth y whitelist gating funcionando.

Estado actual:
- Etapas 1-11 cerradas.
- Bug responsive iPhone/iPad resuelto en `v0.14.6` y confirmado por owner:
  "se arreglo muy bien".
- Respaldo documental completo y regla de subpestanas Google Doc reforzada en
  `v0.14.7`.
- Etapa 11 cerrada en `v0.15.0` con overlay Pixel Streaming inicial:
  iframe real si hay URL valida, fallback visual local si el preview esta
  habilitado, y estado oculto por default en produccion.
- No hay endpoint Unreal/Pixel Streaming real conectado todavia. El frontend
  queda preparado para recibir `unrealStreamURL` por proyecto desde Strapi.

Lo mas importante del cierre Etapa 11:
- Nuevo overlay HTML proyectado desde el cubo activo de la luz.
- Nuevo iframe shell para Pixel Streaming.
- Fallback visual local usando `videoLoop`, imagen del proyecto o tarjeta
  procedural.
- Nuevo tweak/admin control: `Preview visible`.
- Nuevo campo Strapi `pixelStreamingPreviewEnabled` en SiteSetting.
- Default de produccion: `pixelStreamingPreviewEnabled:false`.
- Si `Preview visible` esta apagado y no hay stream real, no aparece ningun
  preview. Asi el owner controla cuando mostrarlo.
- Si existe stream real valido (`pixelStreamingEnabled:true`,
  `Project.unrealEnabled:true`, `Project.unrealStreamURL:https://...`), el
  iframe se puede mostrar aunque el preview fallback este apagado.

---

## 1. Como arrancar como nuevo agente IA

### Paso 1 - Identificar el repo

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"
git checkout main
git pull --ff-only
git status
git describe --tags --abbrev=0
git log --oneline -12
```

Esperado:
- branch `main`
- working tree clean
- ultimo tag `v0.15.0`
- ultimo codigo funcional Etapa 11: `68130ee feat(streaming): add preview visibility toggle`

### Paso 2 - Leer docs (orden)

1. `HANDOFF-LATEST.md` (este archivo).
2. `CHANGELOG.md` - entrada `[0.15.0]`.
3. Google Doc oficial - ultima subpestana bajo `Handoff`:
   `2026-05-25 00:32 UTC - v0.15.0 etapa 11 pixel streaming`.
4. `PLAN-PROYECTO28-V2.md` - Etapa 12 queda como siguiente bloque.
5. `DEPLOY.md` - seccion Pixel Streaming para subdominio/infra.

### Paso 3 - Validar sistema vivo

```bash
curl -s -o /dev/null -w "projects: %{http_code}\n"          "https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*"
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" "https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists"
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     "https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting"
curl -s -o /dev/null -w "auth inconcha: %{http_code}\n"    "https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=inconcha@gmail.com"
curl -s -o /dev/null -w "auth yk8arts: %{http_code}\n"     "https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com"
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   "https://proyecto28.com"
```

Esperado: `200`, `403`, `200`, `200`, `200`, `200`.

### Paso 4 - Validar responsive en produccion

El owner pidio que las pruebas relevantes se hagan siempre en
`https://proyecto28.com`, no solo localhost.

En consola DevTools de produccion:

```js
({
  body: document.body.scrollWidth,
  html: document.documentElement.scrollWidth,
  inner: window.innerWidth,
  canvas: document.querySelector("#c")?.clientWidth,
  overlayHidden: document.querySelector(".stream-overlay")?.hidden,
  hasDebug: typeof window.p28StreamDebug
})
```

Esperado:
- `body === inner`
- `html === inner`
- `canvas === inner`
- overlay existe pero queda oculto por default
- `hasDebug === "undefined"` en produccion

Si reaparece overflow:

```js
[...document.querySelectorAll("*")]
  .filter((el) => el.scrollWidth > window.innerWidth + 1)
  .map((el) => ({ tag: el.tagName, cls: el.className, w: el.scrollWidth }))
```

---

## 2. Cierre Etapa 11 - Pixel Streaming iframe/fallback

### Commits de la etapa

- `a71958a feat(streaming): add pixel streaming overlay fallback`
- `54cd110 test(streaming): add iframe preview mock`
- `68130ee feat(streaming): add preview visibility toggle`

### Archivos principales

- `src/streaming/pixelStream.js`
  - Crea el shell iframe/fallback.
  - Carga iframe solo con URL `http(s)` valida y stream habilitado.
  - Envia `postMessage` al iframe:
    - `{ command: "showProject", projectId, unrealLevelName, mode }`
    - `{ type: "p28:pixel-stream", payload }`
  - Limpia `src` cuando no hay stream para no cargar WebRTC por accidente.

- `src/streaming/streamOverlay.js`
  - Proyecta la posicion 3D del cubo activo a coordenadas 2D.
  - Usa `visualViewport` para evitar overflow mobile.
  - Normaliza `streaming.mode` a `shared` / `per-cube`.
  - Respeta `streaming.previewEnabled`.
  - Si `previewEnabled:false` y no hay stream real, el overlay permanece oculto.

- `src/main.js`
  - Conecta overlay a `onActiveTileChange`.
  - Agrega Tweaks:
    - `Pixel Streaming activo`
    - `Preview visible`
    - `streamingMode`
  - Agrega helpers solo en `import.meta.env.DEV`:
    - `?streamPreview=028.A`
    - `?streamPreview=028.A&streamPreviewUrl=http://127.0.0.1:<port>/dev/pixel-stream-mock.html`

- `public/dev/pixel-stream-mock.html`
  - Mock local same-origin que recibe el payload `showProject`.

- `src/styles/app.css`
  - Estilos para `.stream-overlay`, `.stream-card`, iframe/fallback y mobile.

- `cms/src/api/site-setting/content-types/site-setting/schema.json`
  - Nuevo campo `pixelStreamingPreviewEnabled`.

- `cms/src/index.js`
  - Backfill/default `pixelStreamingPreviewEnabled:false`.

- `cms/config/middlewares.js`
  - CORS corregido para permitir origins reales:
    `https://proyecto28.com`, variantes `www`, `.cl`, GitHub Pages y
    localhost/127.0.0.1 para QA.
  - Causa: en Strapi 5 `origin:['*']` se interpreta como lista literal; no
    matchea `https://proyecto28.com`, por lo que el navegador bloqueaba fetch
    y el sitio caia al fallback CMS.

- `src/data/cms.js` y `src/data/fallback.js`
  - Mapeo frontend para `streaming.previewEnabled`.

---

## 3. Verificacion Etapa 11

### Build local

- `npm run build` OK.
- `npm run build` dentro de `cms/` OK.
  - Strapi admin build completo.
  - Solo quedo warning deprecado conocido de Node/fs, no bloqueante.

### QA local con Vite

Servidor usado durante QA:
- `http://127.0.0.1:5174/` (5173 estaba ocupado).

Casos validados:
- Carga normal:
  - overlay oculto por default.
  - sin errores de consola.
  - `body/html/inner = 1280`.
- Preview fallback:
  - `http://127.0.0.1:5174/?streamPreview=028.A`
  - overlay visible en fallback.
- Preview iframe mock:
  - `http://127.0.0.1:5174/?streamPreview=028.A&streamPreviewUrl=http://127.0.0.1:5174/dev/pixel-stream-mock.html`
  - overlay `stream`, iframe cargado, mock recibe `showProject`.
- Mobile local:
  - phone `390x844`: `html=390`, `body=390`, `canvas=390`.
  - tablet portrait `810x1080`: `html=810`, `body=810`, `canvas=810`.

### GitHub Pages / produccion

- Commit desplegado: `68130ee`.
- GitHub Actions Pages run: `26376864785`.
- Estado: `completed / success`.
- `https://proyecto28.com` responde `200`.
- HTML produccion `last-modified: Mon, 25 May 2026 00:19:57 GMT`.
- Bundle de produccion incluye `pixelStreamingPreviewEnabled`.

Smoke production fresh load:
- desktop `1280`:
  - `body=1280`
  - `html=1280`
  - overlay existe y queda oculto
  - `window.p28StreamDebug` no existe
- phone `390x844`:
  - `body=390`
  - `html=390`
  - `canvas=390`
  - overlay oculto
- tablet portrait `810x1080`:
  - `body=810`
  - `html=810`
  - `canvas=810`
  - overlay oculto

---

## 4. Estado de Strapi Cloud

URL: `https://honest-candy-800d1e4a92.strapiapp.com`

Validado al cierre:
- `GET /api/projects?populate=*` => `200`
- `GET /api/site-setting` => `200`
- `GET /api/admin-whitelists` => `403` (privado, correcto)
- `GET /api/auth/check?email=inconcha@gmail.com` =>
  `{"allowed":true,"role":"owner"}`
- `GET /api/auth/check?email=yk8arts@gmail.com` =>
  `{"allowed":true,"role":"editor"}`
- CORS con `Origin: https://proyecto28.com` =>
  `access-control-allow-origin: https://proyecto28.com`

SiteSetting en produccion incluye:
- `pixelStreamingEnabled:false`
- `pixelStreamingMode:"shared"`
- `pixelStreamingPreviewEnabled:false`

Whitelist/admin:
- `AdminWhitelist` sigue privado publicamente (`403`).
- Los emails validados por `/api/auth/check`:
  - `inconcha@gmail.com` - owner
  - `yk8arts@gmail.com` - editor
- El content type `admin-whitelist` tiene:
  - `pluginOptions.content-manager.visible = true`
  - `pluginOptions.content-type-builder.visible = true`
- Por lo tanto los registros se pueden editar desde Strapi Admin con un usuario
  admin autenticado.

Tech debt activo:
- `Project.status` enum legacy: al editar proyecto en admin Strapi puede tirar
  "Invalid status". Fix recomendado en Etapa 12: normalizar registros en
  `cms/src/index.js` bootstrap o script puntual.
- Consent screen GCP sigue en Testing: si se agrega email a whitelist Strapi,
  agregarlo tambien como test user en Google Cloud.

---

## 5. Estado de hosting

- GitHub Pages: deploy automatico desde `main`.
- Dominio principal/canonico: `https://proyecto28.com`.
- Dominio secundario: `proyecto28.cl` pendiente.
  - Ultimo chequeo conocido: HTTPS falla por certificado/wrong principal y
    HTTP responde 404 de GitHub Pages.
  - Mantener `.com` como canonico hasta corregir DNS/redirect/certificado `.cl`.
- Workflow: `.github/workflows/deploy.yml`.
- CNAME: `public/CNAME` con `proyecto28.com`.

Nota:
- GitHub/Cloudflare pueden cachear HTML/assets durante minutos.
- Para validar deploy real, usar query string (`?verify=<timestamp>`) y
  confirmar bundle actual.

---

## 6. Google Doc backup

Documento:
`https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit`

Estructura obligatoria:
- El respaldo debe quedar SIEMPRE como subpestana dentro del tab raiz
  `Handoff`.
- Nunca crear cierres como pestanas raiz.
- El proximo agente debe abrir la ultima subpestana bajo `Handoff`.
- Formato recomendado de titulo:
  `YYYY-MM-DD HH:mm UTC - vX.Y.Z <slug>`.

Estado esperado tras este cierre:
- Nueva subpestana bajo `Handoff`:
  `2026-05-25 00:32 UTC - v0.15.0 etapa 11 pixel streaming`.
- Debe contener este handoff completo y evidencia de:
  - build local
  - deploy GitHub Pages
  - smoke test produccion
  - Strapi site-setting con `pixelStreamingPreviewEnabled:false`
  - whitelist `inconcha@gmail.com` / `yk8arts@gmail.com`

Referencia anterior:
- Padre `Handoff` tenia `tabId` verificado `t.7lpfc5ado1h` en la sesion
  `v0.14.7`. Verificar de nuevo si el documento se reorganiza.

Gotchas:
1. `navigator.clipboard.writeText` no propaga bien en Docs.
2. `type >4KB` puede dar timeout CDP; usar chunks de 3-4 KB.
3. Google Docs puede autocorregir guiones; aceptable.
4. Si el respaldo queda como pestana raiz, moverlo bajo `Handoff` antes de
   entregar.
5. Un respaldo de 3 paginas no es suficiente; debe ser operativo.

---

## 7. Proximo paso recomendado

### Etapa 12 - Pipeline "Publicar" / Discord Bot

No iniciar hasta que el owner acepte el cierre `v0.15.0` en produccion.

Objetivo previsto:
- Admin ajusta Tweaks.
- Boton "Publicar" persiste cambios en Strapi.
- Discord bot registra/aprueba cambios.
- GitHub Actions/Strapi quedan sincronizados segun corresponda.

Mantener fuera de Etapa 12 salvo bloqueo:
- Infra real Pixel Streaming/GPU.
- Correcciones de `proyecto28.cl`.
- Refactors no relacionados.

---

## 8. Stack actual

- Frontend: Vite 6 + Three.js 0.176 + vanilla JS.
- Hosting: GitHub Pages + custom domain `.com`.
- CMS: Strapi 5.13.1 en Strapi Cloud.
- Auth: Google Identity Services + endpoint `/api/auth/check`.
- UI: grid WebGL, popup robusto, touch/double-tap, tweaks panel, admin button
  gated por OAuth/whitelist, overlay Pixel Streaming iframe/fallback.
- Responsive: confirmado OK desde `v0.14.6`; revalidado con overlay en
  `v0.15.0`.

---

## 9. Secretos y tokens

No guardar secretos en docs.

Ya existen:
- GitHub Secrets:
  - `VITE_CMS_URL = https://honest-candy-800d1e4a92.strapiapp.com`
  - `VITE_GOOGLE_CLIENT_ID = 644563573486-...apps.googleusercontent.com`
- Cloudflare zone ID documentado previamente por owner.
- Google Cloud project: `spartan-grail-401816`.
- OAuth Client: "Proyecto 28 Web".

Si aparece un token/API key en chat o logs: tratarlo como comprometido y pedir
revocacion.

---

## 10. Reglas de mantencion

- No trabajar directo en `main` salvo docs-only urgente.
- Branch por etapa o fix.
- Conventional Commits.
- `npm run build` antes de cerrar.
- Push a `main` dispara deploy.
- Validar `https://proyecto28.com` para responsive/hosting.
- Actualizar `CHANGELOG.md`, `README.md`, `PLAN-PROYECTO28-V2.md`,
  `HANDOFF-LATEST.md` y docs de deploy/CMS si aplica.
- Tag semver al cierre.
- Respaldar handoff en Google Doc como subpestana bajo `Handoff`, nunca como
  pestana raiz.

---

Fin del handoff `v0.15.0`.
