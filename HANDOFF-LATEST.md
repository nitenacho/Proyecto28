# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-05-25 (cierre Etapa 12 - `v0.16.0`)
> **Tag activo:** `v0.16.0`
> **Branch:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

> Etapas 1-12 cerradas. Etapa 12 deja operativo el primer pipeline
> `Tweaks -> Strapi SiteSetting`, con auth Google + whitelist, audit log y
> webhook Discord opcional.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite),
CMS Strapi Cloud, Google OAuth, whitelist gating, Pixel Streaming
iframe/fallback y pipeline de publicacion de Tweaks.

Estado actual:
- Etapas 1-12 cerradas.
- Bug responsive iPhone/iPad resuelto en `v0.14.6` y confirmado por owner:
  "se arreglo muy bien".
- Etapa 11 cerrada en `v0.15.0`: overlay Pixel Streaming inicial con iframe
  real si hay URL valida y fallback local controlado por `Preview visible`.
- Etapa 12 cerrada en `v0.16.0`: boton `PUBLICAR CAMBIOS` en Tweaks, endpoint
  `POST /api/publish`, validacion Google + whitelist, persistencia en
  SiteSetting y `PublishLog`.
- Produccion mantiene `pixelStreamingPreviewEnabled:false` y
  `pixelStreamingEnabled:false`; no se muestra preview/stream hasta que el
  owner lo active.

Codigos clave:
- `e8c3f74 feat(admin): publish tweaks to Strapi`
- `c0590e4 fix(auth): support explicit Google admin publish flow`
- GitHub Pages run `26425439630` success para `c0590e4`.

Nota honesta de validacion:
- Frontend, backend, schema, CORS, whitelist y Strapi Cloud quedaron
  verificados en produccion.
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
- ultimo tag `v0.16.0`
- ultimos commits de codigo: `c0590e4`, `e8c3f74`

### Paso 2 - Leer docs (orden)

1. `HANDOFF-LATEST.md` (este archivo).
2. `CHANGELOG.md` - entrada `[0.16.0]`.
3. Google Doc oficial - ultima subpestana bajo `Handoff`:
   `2026-05-26 00:45 UTC - v0.16.0 etapa 12 publicar`.
4. `PLAN-PROYECTO28-V2.md` - Etapa 13 queda como siguiente bloque.
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

- Push `e8c3f74` a `main` OK.
- Pages run `26425130576` success.
- Push `c0590e4` a `main` OK.
- Pages run `26425439630` success.
- `https://proyecto28.com` sirve bundle nuevo con:
  - `PUBLICAR CAMBIOS`
  - `/api/publish`
  - `Preview visible`
  - `initTokenClient`

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

Valores SiteSetting produccion tras cierre:
- `pixelStreamingPreviewEnabled:false`
- `pixelStreamingEnabled:false`
- `defaultGravityEnabled:true`
- `gameShadowSize:0.3`
- `gameLightVelocityCurve:kirby`
- `adminButtonVisible:false` en CMS, aunque puede quedar visible por
  localStorage si el navegador del owner lo tenia activado.

---

## 4. Estado de GitHub / deploy

- Branch: `main`
- Codigo Etapa 12:
  - `e8c3f74 feat(admin): publish tweaks to Strapi`
  - `c0590e4 fix(auth): support explicit Google admin publish flow`
- GitHub Pages:
  - `26425130576` success para `e8c3f74`
  - `26425439630` success para `c0590e4`
- Tag esperado al cierre: `v0.16.0`

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

Etapa 13 - Sync automatizado Claude Design + GitHub.

Antes de codear:
1. Validar `git status` clean en `main`.
2. Confirmar `git describe --tags --abbrev=0` => `v0.16.0`.
3. Hacer smoke manual de `PUBLICAR CAMBIOS` en `proyecto28.com`.
4. Confirmar si Claude Design es tokens en repo, paquete npm, repo separado o
   solo nombre interno.

No mezclar Etapa 13 con el tech debt de `Project.status` salvo que bloquee.

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

Fin del handoff `v0.16.0`.
