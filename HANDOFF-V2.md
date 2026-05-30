# HANDOFF V2 - Proyecto 28

> Ultima actualizacion: 2026-05-29 (fix hover estable + URLs - `v0.20.1`)
> Branch esperado: `main`
> Tag activo esperado tras cierre: `v0.20.1`
> Repo: https://github.com/nitenacho/Proyecto28
> Produccion canonica: https://proyecto28.com

Este handoff es el punto de entrada compacto para un nuevo agente. Para
operacion detallada, leer `RUNBOOK.md`.

---

## 1. Estado ejecutivo

Etapas 1-16 cerradas. Proyecto28 queda como web 3D interactiva con:

- Vite + Three.js + GSAP.
- Strapi Cloud como CMS.
- Google OAuth + Strapi whitelist para admins.
- Tweaks publicables a `SiteSetting`.
- Pixel Streaming iframe/fallback sobre cubos, con preview controlable.
- Sync Claude Design y release assets en GitHub.
- Performance/a11y hardening y documentacion final.
- Fix anti-parpadeo de hover en bordes de cubos y `ADMIN-URLS.md`.

Ultimo codigo funcional:

- `v0.20.1` - hover estable en bordes + URLs operativas.

Cierre documental final:

- `v0.20.0` - Etapa 16 runbook/handoff/assets.

---

## 2. Comandos de entrada

```powershell
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"
git checkout main
git pull --ff-only
git status
git describe --tags --abbrev=0
git log --oneline -12
npm run build
```

Esperado:

- branch `main`
- working tree clean
- tag `v0.20.1`
- build Vite OK

Validacion local previa al cierre `v0.20.1`:

- `npm run build` OK.
- `vite preview` + Chrome headless/CDP: popup visible sobre tile, se mantiene
  a `80ms` tras salir del tile y queda oculto luego de `400ms`.
- Strapi/auth check: `inconcha@gmail.com` owner, `yk8arts@gmail.com` editor.

Validacion de cierre `v0.20.0`:

- `npm run build` OK.
- `node scripts/export-claude-design.mjs` OK (`96` tokens).
- `node scripts/record-demo.mjs` genero `docs/proyecto28-demo.webm`
  (`923482` bytes).
- `docs/architecture.png` generado desde SVG.

---

## 3. Validacion viva minima

```powershell
curl.exe -L -s -o NUL -w "site: %{http_code}`n" "https://proyecto28.com"
curl.exe -L -s -o NUL -w "robots: %{http_code}`n" "https://proyecto28.com/robots.txt"
curl.exe -L -s -o NUL -w "sitemap: %{http_code}`n" "https://proyecto28.com/sitemap.xml"

$base="https://honest-candy-800d1e4a92.strapiapp.com"
curl.exe -s -o NUL -w "projects: %{http_code}`n" "$base/api/projects?populate=*"
curl.exe -s -o NUL -w "site-setting: %{http_code}`n" "$base/api/site-setting"
curl.exe -s -o NUL -w "admin-whitelists: %{http_code}`n" "$base/api/admin-whitelists"
curl.exe -s "$base/api/auth/check?email=inconcha@gmail.com"
curl.exe -s "$base/api/auth/check?email=yk8arts@gmail.com"
```

Esperado:

- site/robots/sitemap `200`
- projects `200`
- site-setting `200`
- admin-whitelists `403`
- inconcha owner permitido
- yk8arts editor permitido

Estos checks fueron verificados antes de pushear el cierre `v0.20.1`.

---

## 4. Archivos fuente de verdad

- `README.md` - vision general, dev local, contenido, etapas.
- `ADMIN-URLS.md` - URLs para administrar sitio, CMS, GitHub, Google, DNS y
  Pixel Streaming.
- `RUNBOOK.md` - operacion, incidentes, rollback, secretos.
- `DEPLOY.md` - GitHub Pages, Strapi Cloud, OAuth, streaming, releases.
- `PLAN-PROYECTO28-V2.md` - plan completo y estado de etapas.
- `CHANGELOG.md` - historial semver.
- `VERSIONING.md` - contrato de ramas/tags/handoff.
- `docs/architecture.png` - diagrama operativo.
- `docs/demo-script.md` - guion demo/release.

---

## 5. Operacion clave

### Admin y publish

Admins permitidos:

- `inconcha@gmail.com` role `owner`.
- `yk8arts@gmail.com` role `editor`.

El panel Tweaks permite cambiar defaults y publicar a Strapi. Si Google
rechaza token, el frontend reintenta con una sesion fresca.

### Pixel Streaming

El sitio no aloja Unreal. GitHub Pages solo monta un iframe cuando Strapi
entrega URL valida:

- `SiteSetting.pixelStreamingEnabled`
- `SiteSetting.pixelStreamingPreviewEnabled`
- `Project.unrealEnabled`
- `Project.unrealStreamURL`
- `Project.unrealLevelName`

El preview/fallback se apaga desde Tweaks:

```text
Admin -> Tweaks -> Streaming -> Preview visible OFF -> PUBLICAR CAMBIOS
```

### Agregar proyecto

Crear/duplicar Project en Strapi, publicar, probar popup/modelo/redirect, y si
usa Unreal conectar `unrealStreamURL` + `unrealLevelName`. Ver `RUNBOOK.md`.

---

## 6. Pendientes conocidos

- `proyecto28.cl` sigue secundario; `.com` es canonico.
- Google Cloud consent screen puede seguir en Testing; si se agregan correos a
  Strapi, tambien agregarlos como test users en GCP.
- Strapi v5 reserva `status` para Draft/Publish en Content Manager. Usar
  `Project.projectStatus` para el estado visible del proyecto.
- GPU Pixel Streaming real depende de infraestructura externa y costos.

---

## 7. Google Doc

El respaldo final debe quedar como subpestana bajo `Handoff` en:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Titulo creado:

```text
2026-05-29 21:30 UTC - v0.20.1 hover-estable-urls
```

Tab id creado y verificado: `t.rox2yd4prf1o` bajo padre `Handoff`
(`t.7lpfc5ado1h`).

Respaldo anterior: `2026-05-29 19:00 UTC - v0.20.0 documentacion-final`, tab id
`t.yau0g6g371sa` bajo padre `Handoff` (`t.7lpfc5ado1h`).

Regla absoluta: nunca crear cierres como pestanas raiz junto a `MISION`,
`Aprender` o `Handoff`.

---

Fin del handoff V2.
