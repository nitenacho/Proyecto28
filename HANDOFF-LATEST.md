# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-05-29 (cierre Etapa 14 - `v0.18.0`)
> **Tag activo:** `v0.18.0`
> **Branch:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

> Etapas 1-14 cerradas. Etapa 12 deja operativo el primer pipeline
> `Tweaks -> Strapi SiteSetting`, con auth Google + whitelist, audit log y
> webhook Discord opcional. `v0.16.1` corrige el publish real cuando Google
> entrega `accessToken`/`idToken` en flujos distintos. Etapa 13 agrega export
> Claude Design desde tokens CSS y auto-tag semver en GitHub Actions. `v0.17.1`
> corrige el auto-tag para adjuntar el export zip a la GitHub Release. Etapa
> 14 agrega polish GSAP con timelines reutilizables para cubos, popup, luz,
> HUD y overlay Pixel Streaming.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite),
CMS Strapi Cloud, Google OAuth, whitelist gating, Pixel Streaming
iframe/fallback, pipeline de publicacion de Tweaks y animaciones GSAP.

Estado actual:
- Etapas 1-14 cerradas.
- Bug responsive iPhone/iPad resuelto en `v0.14.6` y confirmado por owner:
  "se arreglo muy bien".
- Etapa 11 cerrada en `v0.15.0`: overlay Pixel Streaming inicial con iframe
  real si hay URL valida y fallback local controlado por `Preview visible`.
- Etapa 12 cerrada en `v0.16.0`: boton `PUBLICAR CAMBIOS` en Tweaks, endpoint
  `POST /api/publish`, validacion Google + whitelist, persistencia en
  SiteSetting y `PublishLog`.
- Hotfix `v0.16.1`: corrige el error `Invalid Google id_token` reportado al
  apretar `PUBLICAR CAMBIOS`. El frontend ahora prefiere `accessToken` y Strapi
  valida `id_token`/`access_token` sin heuristica `includes('.')`.
- Validacion Strapi 2026-05-29 post-cierre: produccion reporta
  `pixelStreamingPreviewEnabled:true`, `pixelStreamingEnabled:true`,
  `adminButtonVisible:true`, `pixelStreamingMode:shared`. Esto refleja el
  estado vivo del CMS tras uso del panel; el tweak **Preview visible** ya
  permite apagar/encender el fallback desde Tweaks.
- Etapa 13 cerrada en `v0.17.0`: `src/styles/tokens.css` queda como fuente de
  verdad Claude Design; `sync-design.yml` exporta `claude-design-export` y
  `auto-tag.yml` crea tags semver para commits `feat:`/`fix:` en `main`.
- Hotfix `v0.17.1`: `auto-tag.yml` ahora genera `claude-design-export.zip` y
  lo adjunta a la GitHub Release del tag automatico.
- Etapa 14 cerrada en `v0.18.0`: `gsap@3.15.0`, timelines reutilizables en
  `src/animations/timelines.js`, entrada secuencial de cubos, activacion con
  lift/scale/glow, popup fade + slide-up, squash/stretch de la luz, rebote HUD
  y micro-entrada del overlay streaming/fallback.

Codigos clave:
- `e8c3f74 feat(admin): publish tweaks to Strapi`
- `c0590e4 fix(auth): support explicit Google admin publish flow`
- `8465330 fix(auth): accept publish access tokens`
- `ec9355d feat(ci): sync Claude Design tokens`
- `fcb488a fix(ci): attach design export to auto tags`
- `pendiente feat(anim): add GSAP polish timelines`
- GitHub Pages run `26425439630` success para `c0590e4`.
- GitHub Pages run `26433985069` success para `8465330`.
- GitHub Pages run `26626392593` success para `ec9355d`.
- Sync Claude Design run `26626392558` success para `ec9355d`.
- Auto-tag run `26626392562` success: creo `v0.17.0`.
- Auto-tag run `26626485820` success: creo `v0.17.1` y Release asset.
- GitHub Pages run `26626485864` success para `fcb488a`.

Nota honesta de validacion:
- Frontend, backend, schema, CORS, whitelist y Strapi Cloud quedaron
  verificados en produccion. Para `v0.16.1`, el backend nuevo se confirmo con
  token falso punteado; falta solo la confirmacion humana de publish con token
  Google real desde el navegador del owner.
- Chrome automatizado no pudo completar el popup OAuth real sin intervencion
  humana. El owner debe hacer un smoke manual: abrir `proyecto28.com`, click
  `Admin`, seleccionar cuenta Google permitida, click `PUBLICAR CAMBIOS` y
  confirmar feedback verde.

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
- ultimo tag `v0.18.0`
- commit hotfix `8465330`
- ultimos commits de codigo/CI: `feat(anim): add GSAP polish timelines`,
  `fcb488a`, `ec9355d`, `8465330`

### Paso 2 - Leer docs (orden)

1. `HANDOFF-LATEST.md` (este archivo).
2. `CHANGELOG.md` - entradas `[0.18.0]`, `[0.17.1]`, `[0.17.0]`,
   `[0.16.1]` y `[0.16.0]`.
3. Google Doc oficial - ultima subpestana bajo `Handoff`:
   `2026-05-29 08:30 UTC v0.17.1 design`.
   Tab id: `t.l9sl79q157hl` (padre `Handoff`: `t.7lpfc5ado1h`).
4. `PLAN-PROYECTO28-V2.md` - Etapa 15 queda como siguiente bloque.
5. `DEPLOY.md` y `cms/README.md` si se toca deploy/CMS.

### Paso 3 - Validar sistema vivo

```bash
curl -s -o /dev/null -w "projects: %{http_code}\n"          "https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*"
curl -s -o /dev/null -w "admin-whitelists: %{http_code}\n" "https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists"
curl -s -o /dev/null -w "site-setting: %{http_code}\n"     "https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting"
curl -s -o /dev/null -w "auth inconcha: %{http_code}\n"    "https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=inconcha@gmail.com"
curl -s -o /dev/null -w "auth yk8arts: %{http_code}\n"     "https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com"
curl -s -o /dev/null -w "publish no-token: %{http_code}\n" -X POST -H "content-type: application/json" -d "{\"state\":{\"streamingPreviewEnabled\":false}}" "https://honest-candy-800d1e4a92.strapiapp.com/api/publish"
curl -s -o /dev/null -w "proyecto28.com: %{http_code}\n"   "https://proyecto28.com"
```

Esperado: `200`, `403`, `200`, `200`, `200`, `401`, `200`.

### Paso 4 - Smoke manual admin publish

En `https://proyecto28.com`:
1. Click `Admin`.
2. Seleccionar Google `inconcha@gmail.com` o `yk8arts@gmail.com`.
3. Confirmar que abre Tweaks.
4. Confirmar que existe `PUBLICAR CAMBIOS`.
5. Dejar `Streaming > Preview visible` apagado si no se quiere mostrar fallback.
6. Click `PUBLICAR CAMBIOS`.
7. Esperado: feedback verde y cambios persistidos en Strapi.

Si aparece `Invalid Google id_token`, recargar `proyecto28.com` para tomar el
bundle `v0.16.1` y repetir el flujo Google. El bug conocido era que el frontend
podía mandar un token legacy y el backend lo clasificaba con una heuristica
de puntos; ambas rutas quedaron corregidas.

Si el consent screen Google sigue en modo Testing, los correos deben estar
tambien como Test users en Google Cloud Console. Esta sesion verifico la
whitelist server-side en Strapi, pero no tuvo API/permiso directo para leer la
lista de Test users de GCP.

---

## 2. Que se implemento en Etapa 12

### Frontend

- `src/admin/publish.js`
  - Construye snapshot publishable de Tweaks.
  - Calcula diff contra baseline cargado desde SiteSetting.
  - Envia `POST /api/publish` con `Authorization: Bearer <google-token>`.
- `src/ui/tweaks.js`
  - Soporta acciones de footer.
  - Agrega boton `PUBLICAR CAMBIOS`.
  - Muestra loading/success/error.
  - Limpia valores legacy guardados en `localStorage` si ya no estan en las
    opciones actuales.
- `src/auth/google.js`
  - Mantiene soporte para `id_token`.
  - Agrega flujo explicito OAuth `initTokenClient` con scope
    `openid email profile`.
  - Cachea `accessToken` + email para publicar desde el panel.
- `src/main.js`
  - Wirea la accion publish.
  - Corrige opciones de `gameVelocityCurve`: `kirby`, `linear`, `easeOut`,
    `easeInOut`.

### Strapi

- `cms/src/api/site-setting/routes/01-publish.js`
  - Nueva ruta `POST /api/publish`.
- `cms/src/api/site-setting/controllers/site-setting.js`
  - Verifica token Google (`id_token` o `access_token`).
  - Revisa email contra `AdminWhitelist`.
  - Sanitiza payload con allow-list y rangos.
  - Actualiza SiteSetting.
  - Crea `PublishLog`.
  - Envia webhook Discord si `DISCORD_WEBHOOK_URL` existe.
- `cms/src/api/publish-log/`
  - Nuevo content type editable en Strapi Admin para auditoria.
- `cms/src/api/site-setting/content-types/site-setting/schema.json`
  - Agrega `defaultGravityEnabled` y `gameShadowSize` para que todos los
    tweaks visibles puedan persistirse.
- `cms/src/index.js`
  - Backfill de campos nuevos.
  - Seed mantiene whitelist:
    - `inconcha@gmail.com` owner
    - `cnignacioa@gmail.com` owner
    - `yk8arts@gmail.com` editor
- `cms/.env.example`
  - Documenta `GOOGLE_CLIENT_ID` y `DISCORD_WEBHOOK_URL`.

---

## 3. Validacion realizada

### Build local

- `npm run build` OK.
- `npm run build` en `cms/` OK.

### Smoke local frontend

- Vite local en `http://127.0.0.1:5174`.
- Admin abre Tweaks sin Google cuando no hay `VITE_GOOGLE_CLIENT_ID` local.
- `PUBLICAR CAMBIOS` aparece.
- `Curva de salto` ya no incluye `constant`.
- Sin CMS local configurado, el boton publish muestra error controlado.
- `document.body.scrollWidth === window.innerWidth` en desktop local.

### Smoke local Strapi

- `/api/site-setting` => `200`
- `/api/publish` sin token => `401`
- `/api/auth/check?email=inconcha@gmail.com` =>
  `{"allowed":true,"role":"owner"}`
- `/api/auth/check?email=yk8arts@gmail.com` =>
  `{"allowed":true,"role":"editor"}`
- `/api/publish-logs` => `403`
- `/api/admin-whitelists` => `403`

### Produccion GitHub Pages

- Push `ec9355d` a `main` OK.
- Pages run `26626392593` success.
- Push `fcb488a` a `main` OK.
- Pages run `26626485864` success.
- Push `e8c3f74` a `main` OK.
- Pages run `26425130576` success.
- Push `c0590e4` a `main` OK.
- Pages run `26425439630` success.
- Push `8465330` a `main` OK.
- Pages run `26433985069` success.
- `https://proyecto28.com` sirve bundle nuevo con:
  - `PUBLICAR CAMBIOS`
  - `/api/publish`
  - `Preview visible`
  - `initTokenClient`
- `https://proyecto28.com` sirve bundle hotfix `assets/index-CSh7zWl1.js` con:
  - refresh de token Google antes de publicar
  - preferencia por `accessToken`
  - fallback controlado a `idToken`
- Etapa 13 no cambia bundle funcional del sitio; `proyecto28.com` responde
  `200` y mantiene el asset `assets/index-CSh7zWl1.js`.

### GitHub Actions Etapa 13

- `sync-design.yml` run `26626392558` success:
  - genero artifact `claude-design-export`
  - artifact id `7286242271`
  - export local y CI: 96 tokens desde `src/styles/tokens.css`
- `auto-tag.yml` run `26626392562` success:
  - creo tag automatico `v0.17.0` desde commit `ec9355d`
- `auto-tag.yml` run `26626485820` success:
  - creo tag automatico `v0.17.1` desde commit `fcb488a`
  - creo GitHub Release `v0.17.1`
  - adjunto `claude-design-export.zip`
  - descarga: `https://github.com/nitenacho/Proyecto28/releases/download/v0.17.1/claude-design-export.zip`

### Etapa 14 - GSAP polish

Implementado:
- `gsap@3.15.0` instalado.
- `src/animations/timelines.js` creado con:
  - `entranceTimeline`
  - `cubeActivateTimeline`
  - `cubeDeactivateTimeline`
  - `popupEnterTimeline`
  - `popupExitTimeline`
  - `lightSquashTimeline`
  - `lightFallTimeline`
  - `hudCounterTimeline`
  - `streamOverlayEnterTimeline`
- `main.js` usa GSAP para entrada del grid y cambios de estado lit/unlit de
  cubos.
- `popup.js` anima el contenido sin romper placements `side`/`cursor`/`corner`.
- `light.js` anima salto, aterrizaje y respawn sin tocar la fisica base.
- `hud.js` reemplaza el pulse CSS del contador por timeline GSAP.
- `streamOverlay.js` agrega micro-entrada del iframe/fallback.
- `vite.config.js` separa GSAP en chunk propio `assets/gsap-*.js`.

Validacion local:
- Baseline pre-GSAP: `assets/index-D1o2Ydeg.js` `643.59 kB` / `169.43 kB`
  gzip.
- Build cierre: `assets/index-Cii4NAQW.js` `646.63 kB` / `170.33 kB` gzip.
- Chunk GSAP: `assets/gsap-CzGW6FVa.js` `70.46 kB` / `27.81 kB` gzip.
- Crecimiento del chunk principal: `+3.04 kB` bruto / `+0.90 kB` gzip.
- Browser local `http://127.0.0.1:5173/?stage14=1` sin errores/warnings de
  consola.
- Desktop local: hover en cubo `028.C`, popup `Saturno Engine` visible,
  `body/html/canvas = 1280`, sin overflow.
- Responsive local:
  - phone `390x844`: `body=390`, `html=390`, `canvas=390`.
  - tablet portrait `810x1080`: `body=810`, `html=810`, `canvas=810`.

### Produccion Strapi Cloud

- Despues del deploy, `/api/publish` cambio de `405` a `401` sin token:
  confirma ruta custom activa.
- `/api/projects?populate=*` => `200`
- `/api/site-setting` => `200`
- `/api/admin-whitelists` => `403` publico/privado correcto
- `/api/auth/check?email=inconcha@gmail.com` => `allowed:true`, `role:owner`
- `/api/auth/check?email=yk8arts@gmail.com` => `allowed:true`, `role:editor`
- `/api/auth/check?email=cnignacioa@gmail.com` => `allowed:true`, `role:owner`
- CORS preflight:
  - `OPTIONS /api/publish`
  - `Origin: https://proyecto28.com`
  - Resultado `204`
  - `access-control-allow-origin: https://proyecto28.com`
- Validacion `v0.16.1`:
  - Token falso `ya29.fake.with.dots` ya no cae como `id_token` por heuristica
    de puntos.
  - Respuesta esperada y observada: `Invalid Google token (Invalid Google
    access_token / Invalid Google id_token)`.

Valores SiteSetting produccion validados 2026-05-29:
- `pixelStreamingPreviewEnabled:true`
- `pixelStreamingEnabled:true`
- `pixelStreamingMode:shared`
- `gameShadowSize:0.25`
- `gameLightVelocityCurve:kirby`
- `adminButtonVisible:true`

---

## 4. Estado de GitHub / deploy

- Branch: `main`
- Codigo Etapa 12:
  - pendiente `feat(anim): add GSAP polish timelines`
  - `fcb488a fix(ci): attach design export to auto tags`
  - `ec9355d feat(ci): sync Claude Design tokens`
  - `8465330 fix(auth): accept publish access tokens`
  - `e8c3f74 feat(admin): publish tweaks to Strapi`
  - `c0590e4 fix(auth): support explicit Google admin publish flow`
- GitHub Pages:
  - `26626485864` success para `fcb488a`
  - `26626392593` success para `ec9355d`
  - `26425130576` success para `e8c3f74`
  - `26425439630` success para `c0590e4`
  - `26433985069` success para `8465330`
- Tags Etapa 13:
  - `v0.17.0` auto-tag para `ec9355d`
  - `v0.17.1` auto-tag para `fcb488a`, con Release asset
- Tag Etapa 14:
  - `v0.18.0` esperado por auto-tag tras merge del commit `feat(anim): add GSAP
    polish timelines`

`gh` local no estaba autenticado en esta maquina; los runs se validaron por la
API publica de GitHub.

---

## 5. Estado de Strapi Cloud

URL: `https://honest-candy-800d1e4a92.strapiapp.com`

Content types relevantes:
- `Project`
- `SiteSetting`
- `AdminWhitelist`
- `PublishLog`

Whitelist verificada por endpoint publico seguro `/api/auth/check`:
- `inconcha@gmail.com` => owner
- `cnignacioa@gmail.com` => owner
- `yk8arts@gmail.com` => editor

`AdminWhitelist` y `PublishLog` siguen privados para anonimos (`403`) y son
editables desde Strapi Admin por usuarios con permisos de Content Manager.
El content type `Admin whitelist` tiene `content-manager.visible:true` y campos
editables `email`, `role`, `note`.

Variables recomendadas en Strapi Cloud:
- `GOOGLE_CLIENT_ID=644563573486-5pe2jvatetd46oke9ns8gskdt0jgsfi6.apps.googleusercontent.com`
- `DISCORD_WEBHOOK_URL` opcional. Si falta, publish funciona igual.

---

## 6. Pendientes y riesgos

- Confirmacion manual owner del publish real con popup Google:
  - Automatizacion Chrome no pudo completar el popup OAuth sin intervencion.
  - El flujo fue reforzado con `initTokenClient`; smoke humano requerido.
- Google Cloud consent screen:
  - Si sigue en modo Testing, confirmar manualmente en GCP que
    `inconcha@gmail.com` y `yk8arts@gmail.com` estan como Test users.
  - Esta sesion no tuvo `gcloud` ni API directa para leer esa lista.
- Discord:
  - Webhook opcional implementado, pero no habia `DISCORD_WEBHOOK_URL`
    validable en esta sesion.
- Tech debt Strapi:
  - `Project.status` enum legacy puede seguir mostrando `Invalid status` al
    editar proyectos antiguos. No bloqueo Etapa 12.
- `proyecto28.cl`:
  - Mantener `.com` como canonico hasta corregir certificado/DNS `.cl`.

---

## 7. Proximo paso

Etapa 15 - Performance, responsive deep-dive y accesibilidad.

Antes de codear:
1. Validar `git status` clean en `main`.
2. Confirmar `git describe --tags --abbrev=0` => `v0.18.0`.
3. Hacer smoke manual de `PUBLICAR CAMBIOS` en `proyecto28.com`.
4. Leer `CHANGELOG.md` entradas `[0.18.0]`, `[0.17.1]` y `[0.17.0]`.
5. Revisar el warning Vite de chunk `>500 kB`: queda como tema natural para
   Etapa 15.

No mezclar Etapa 15 con el tech debt de `Project.status` salvo que bloquee.

---

## 8. Cierre esperado de futuras etapas

- Rama por etapa/fix.
- Conventional Commits.
- `npm run build`.
- `npm run build` en `cms/` si toca Strapi.
- Push a `main`.
- GitHub Pages verde.
- Strapi Cloud propagado si toca `cms/**`.
- Smoke test en `https://proyecto28.com`.
- `CHANGELOG.md`, `README.md`, `PLAN-PROYECTO28-V2.md` y
  `HANDOFF-LATEST.md` actualizados.
- Google Doc respaldado como subpestana bajo `Handoff`.
- Tag semver al cierre.

Fin del handoff `v0.18.0`.
