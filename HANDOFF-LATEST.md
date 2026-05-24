# HANDOFF — Proyecto 28

> **Última actualización:** 2026-05-24 (cierre fix responsive root cause — `v0.14.6`)
> **Tag activo:** `v0.14.6`
> **Branch de trabajo:** `main` (sin etapa abierta)
> **Owner:** @nitenacho — cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

> ✅ **BUG RESPONSIVE iPhone/iPad RESUELTO Y CONFIRMADO POR OWNER.**
> Próximo agente puede retomar Etapa 11, pero debe validar producción antes de codear.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite).
CMS Strapi Cloud + Google OAuth + whitelist gating funcionando.

Estado actual:
- Etapas 1-10 cerradas.
- Hotfix responsive raíz cerrado en `v0.14.6`.
- Owner confirmó en device real: "se arreglo muy bien".
- Etapa 11 (Pixel Streaming Unreal) queda desbloqueada.

Qué se resolvió:
- En producción `html.scrollWidth` era mayor que `window.innerWidth`.
- Causa raíz: `.scene-bg-grid` con `inset: -10%` agrandaba el documento
  antes de que Three.js corriera.
- Síntomas eliminados: splash `#boot` corrido/izquierdo, franjas laterales
  al pinch zoom, grid que no aprovechaba bien el ancho mobile.
- Se ajustó además el encuadre portrait para usar más ancho sin cortar cubos.

---

## 1. Cómo arrancar como nuevo agente IA

### Paso 1 — Identificar el repo

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"
git status
git describe --tags --abbrev=0          # esperado: v0.14.6
git log --oneline -15
```

Esperado:
- branch `main`
- working tree clean
- último tag `v0.14.6`

### Paso 2 — Leer docs (orden)

1. `HANDOFF-LATEST.md` (este archivo).
2. `CHANGELOG.md` — entrada `[0.14.6]`.
3. `PLAN-PROYECTO28-V2.md` — Etapa 11 es el siguiente bloque.
4. `DEPLOY.md` si vas a tocar hosting/domains.

### Paso 3 — Validar sistema vivo

```bash
curl -s -o /dev/null -w "projects: %{http_code}\n"          "https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*"
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" "https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists"
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     "https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting"
curl -s -o /dev/null -w "auth/check: %{http_code}\n"       "https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com"
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   "https://proyecto28.com"
```

Esperado: `200`, `403`, `200`, `200`, `200`.

### Paso 4 — Validar responsive antes de Etapa 11

El owner pidió explícitamente que las pruebas relevantes se hagan siempre en
`proyecto28.com`, no sólo en localhost.

En consola DevTools de producción:

```js
({
  body: document.body.scrollWidth,
  html: document.documentElement.scrollWidth,
  inner: window.innerWidth,
  visual: window.visualViewport?.width
})
```

Esperado:
- `body === inner`
- `html === inner`
- canvas cubre todo el viewport visible
- `Luces caídas` queda anclado a la derecha
- grid visible completo y usando más ancho en mobile

Si reaparece overflow:

```js
[...document.querySelectorAll("*")]
  .filter((el) => el.scrollWidth > window.innerWidth + 1)
  .map((el) => ({ tag: el.tagName, cls: el.className, w: el.scrollWidth }))
```

---

## 2. Lo último que se hizo

### `v0.14.6` — fix responsive root cause

Commit de código:
- `b96ddbb fix(ui): root cause responsive viewport framing`

Cambios principales:
- `index.html`
  - Script temprano sincroniza `window.visualViewport` a CSS vars:
    `--p28-vv-left`, `--p28-vv-top`, `--p28-vv-width`, `--p28-vv-height`.
- `src/styles/three-host.css`
  - `html, body` cierran layout a `100vw` / `max-width:100vw`.
  - `#c` y `#boot` se dimensionan con visual viewport.
  - `.scene-bg-grid` dejó de usar `inset:-10%`; ahora es fixed full viewport
    y mantiene margen visual con `transform: scale(1.2)`.
  - `.chrome`, `.route-overlay`, `.scene-bg-vignette`, `.scene-bg-scanlines`
    también quedan ligados al viewport real.
  - `#popup` base protegido con `box-sizing:border-box` y `max-width`.
- `src/scene/scene.js`
  - `getViewportSize()` disponible antes de renderer/cámara/bloom.
  - `renderer.setSize(w, h, false)` para no escribir estilos inline del canvas.
  - Cámara portrait ajustada:
    - phone portrait: `fov 56`, `radius 24`
    - tablet portrait: `fov 48`, `radius 22`

### Verificación realizada

- `npm run build` OK.
- Push a `main` OK.
- GitHub Actions Pages run `26371087435` OK (`success`).
- Producción `https://proyecto28.com` servía HTML actualizado
  (`last-modified: Sun, 24 May 2026 19:50:03 GMT`).
- Métricas producción:
  - phone `390x844`: `html=390`, `body=390`, `canvas=390`
  - tablet portrait `810x1080`: `html=810`, `canvas=810`
  - landscape `1024x768`: `html=1024`, `canvas=1024`
- Owner confirmó después de mirar device real: "se arreglo muy bien".

---

## 3. Estado actual de git

Repo: `https://github.com/nitenacho/Proyecto28`

Esperado al entrar:

```text
Branch: main
Tag:    v0.14.6
Estado: clean
```

Tags recientes:
- `v0.13.0` — Etapa 9: Google OAuth + whitelist gating
- `v0.13.1` — docs Etapa 9
- `v0.14.0` — Etapa 10: popup robusto + mobile + touch
- `v0.14.1` — docs Etapa 10
- `v0.14.2` — hotfix mobile UX
- `v0.14.3` — hotfix viewfinder mobile
- `v0.14.4` — hotfix camera+canvas adaptive aspect-ratio
- `v0.14.5` — docs cierre con bug responsive persistente
- `v0.14.6` — fix responsive root cause confirmado

---

## 4. Estado de Strapi Cloud

URL: `https://honest-candy-800d1e4a92.strapiapp.com`

Estado esperado:
- `GET /api/projects?populate=*`: `200`
- `GET /api/site-setting`: `200`
- `GET /api/admin-whitelists`: `403` (privado, correcto)
- `GET /api/auth/check?email=...`: `200`
- Whitelist confirmada:
  - `inconcha` / owner
  - `cnignacioa` / owner
  - `yk8arts` / editor

Tech debt:
- `Project.status` enum legacy: al editar proyecto en admin Strapi puede tirar
  "Invalid status". Fix recomendado en Etapa 12: normalizar registros en
  `cms/src/index.js` bootstrap o script puntual.
- Consent screen GCP sigue en Testing: si se agrega email a whitelist Strapi,
  agregarlo también como test user en Google Cloud.

---

## 5. Estado de hosting

- GitHub Pages: deploy automático desde `main`.
- Dominio principal: `https://proyecto28.com`
- Dominio secundario: `proyecto28.cl` pendiente/verificar según DNS.
- Workflow: `.github/workflows/deploy.yml`
- CNAME: `public/CNAME` con `proyecto28.com`.

Nota importante:
- Cloudflare/GitHub pueden cachear HTML/assets durante minutos.
- Para validar un deploy real, usar query string (`?verify=<timestamp>`) y
  confirmar que el HTML contiene el script `syncVisualViewport`.

---

## 6. Próximo paso recomendado

### Etapa 11 — Pixel Streaming Unreal (`v0.15.0`)

Ahora sí puede retomarse Etapa 11. Antes de codear:
1. Confirmar una vez más `proyecto28.com` en iPhone + iPad reales.
2. Leer `PLAN-PROYECTO28-V2.md` § Pixel Streaming.
3. Confirmar infraestructura:
   - instancia GPU compartida
   - signaling server
   - URL/endpoint de stream
   - estrategia de fallback si stream no está disponible
4. Crear rama:

```bash
git checkout main
git pull --ff-only
git checkout -b etapa-11-pixel-streaming
```

No mezclar Etapa 11 con tech debt de Strapi salvo que bloquee.

---

## 7. Stack actual

- Frontend: Vite 6 + Three.js 0.176 + vanilla JS.
- Hosting: GitHub Pages + custom domain.
- CMS: Strapi 5.13.1 en Strapi Cloud.
- Auth: Google Identity Services + endpoint `/api/auth/check`.
- UI actual: grid WebGL, popup robusto, touch/double-tap, tweaks panel, admin
  button gated por OAuth/whitelist.
- Responsive: confirmado OK en `v0.14.6`.

---

## 8. Secretos y tokens

No guardar secretos en docs.

Ya existen:
- GitHub Secrets:
  - `VITE_CMS_URL = https://honest-candy-800d1e4a92.strapiapp.com`
  - `VITE_GOOGLE_CLIENT_ID = 644563573486-...apps.googleusercontent.com`
- Cloudflare zone ID documentado previamente por owner.
- Google Cloud project: `spartan-grail-401816`.
- OAuth Client: "Proyecto 28 Web".

Si aparece un token/API key en chat o logs: tratarlo como comprometido y pedir
revocación.

---

## 9. Google Doc backup

Documento de respaldo:
`https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit`

Estructura obligatoria:
- El respaldo debe quedar SIEMPRE como subpestaña dentro del tab raíz `Handoff`.
- Nunca crear el respaldo como pestaña raíz del documento.
- El próximo agente debe abrir la última subpestaña bajo `Handoff` y continuar
  desde ahí.
- Formato recomendado de título: `YYYY-MM-DD HH:mm UTC - vX.Y.Z <slug>`.
- Si una pestaña queda creada por error en la raíz, moverla bajo `Handoff`
  antes de cerrar la sesión.

Estado corregido 2026-05-24:
- La subpestaña correcta es `2026-05-24 19:50 UTC - v0.14.6 responsive`.
- Está bajo el tab raíz `Handoff`.
- Si se usa Google Docs API, el `tabId` actual del padre `Handoff` es
  `t.7lpfc5ado1h` (verificar de nuevo si el documento se reestructura).

Contenido que debe quedar respaldado:
- Este handoff `v0.14.6`.
- Confirmación de que el bug responsive quedó resuelto.
- Siguiente etapa desbloqueada: Etapa 11 / Pixel Streaming Unreal.

Gotchas ya conocidos:
1. `navigator.clipboard.writeText` no propaga bien en Docs.
2. `type >4KB` puede dar timeout CDP; usar chunks de 3-4 KB.
3. Google Docs puede autocorregir guiones; aceptable.
4. Subpestañas pueden crearse genéricas; renombrar manualmente si hace falta.
5. Si el respaldo queda como pestaña raíz, es un error: moverlo bajo `Handoff`
   antes de entregar.

---

## 10. Reglas de mantención

- No trabajar directo en `main` salvo docs-only urgente.
- Branch por etapa o fix.
- Conventional Commits.
- `npm run build` antes de cerrar.
- Push a `main` dispara deploy.
- Validar `https://proyecto28.com` para responsive/hosting.
- Actualizar `CHANGELOG.md`, `README.md`, `HANDOFF-LATEST.md`.
- Tag semver al cierre.
- Respaldar handoff en Google Doc como subpestaña bajo `Handoff`, nunca como
  pestaña raíz.

---

Fin del handoff `v0.14.6`.
