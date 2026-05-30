# HANDOFF V2 - Proyecto 28

> Ultima actualizacion: 2026-05-30 (Etapa 17 Pacman de luz + color admin - `v0.21.0`)
> Branch esperado: `main`
> Tag activo esperado tras cierre: `v0.21.0`
> Repo: https://github.com/nitenacho/Proyecto28
> Produccion canonica: https://proyecto28.com

Este handoff es el punto de entrada compacto para un nuevo agente. Para
operacion detallada, leer `RUNBOOK.md`.

---

## 1. Estado ejecutivo

Etapas 1-17 cerradas. Proyecto28 queda como web 3D interactiva con:

- Vite + Three.js + GSAP.
- Strapi Cloud como CMS.
- Google OAuth + Strapi whitelist para admins.
- Tweaks publicables a `SiteSetting`.
- Pixel Streaming iframe/fallback sobre cubos, con preview controlable.
- Sync Claude Design y release assets en GitHub.
- Performance/a11y hardening y documentacion final.
- Fix anti-parpadeo de hover en bordes de cubos y `ADMIN-URLS.md`.
- Mini-juego de recoleccion para la luz: esferas sobre cubos oscuros,
  cronometro, contador, mejor tiempo local y feedback dorado de victoria.
- Color de luz configurable desde `Admin -> Tweaks -> Juego` y publicable en
  Strapi como `gameLightColor`.

Ultimo codigo funcional esperado:

- `v0.21.0` - Pacman de luz + color admin.

Tags/commits acumulados:

- `v0.20.4` - restauracion de disponibilidad del admin Strapi.
- `v0.20.3` - evita colision entre `Project.status` editable y el `status`
  interno de Strapi v5.
- `v0.20.2` - normalizacion de valores `Project.status`.
- `v0.20.1` - hover estable en bordes + URLs operativas.
- `v0.20.0` - Etapa 16 runbook/handoff/assets.

---

## 2. Comandos de entrada

```powershell
cd "C:/Users/incon/Downloads/EscritorioNobita/Proyectos_Claude/Claude_P28/Proyecto28"
git checkout main
git pull --ff-only
git status
git describe --tags --abbrev=0
git log --oneline -12
npm run build
```

Esperado despues del cierre:

- branch `main`
- working tree clean
- tag `v0.21.0`
- build Vite OK

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

Validado en cierre local/predeploy `v0.21.0`:

- `npm run build` OK.
- Smoke mecanica: 18 esferas para 18 cubos vacios/oscuros; recoleccion por
  cercania X/Z recoge 1 y deja 17 visibles.
- Produccion/Strapi predeploy: site/robots/sitemap `200`, projects `200`,
  site-setting `200`, admin-whitelists `403`, auth owner/editor OK.

Validado postdeploy `v0.21.0`:

- GitHub Pages run `26690318569` OK para `6e8efa0`.
- Produccion sirve `assets/index-Dsng2GHA.js` con
  `p28-sphere-best-time-ms-v1`, `gameLightColor`, `Gema rojiza` y
  `p28-collectible-spheres`.
- Strapi Cloud `/api/site-setting` incluye `"gameLightColor":"cyan"` con
  `updatedAt` `2026-05-30T17:33:05.966Z`.

---

## 4. Cambios v0.21.0

Archivos principales:

- `src/game/collectibles.js`: crea esferas pequenas sobre cubos no-proyecto,
  las anima sutilmente, las oculta fuera de control manual y permite
  recoleccion por cercania X/Z.
- `src/game/light.js`: agrega paletas `cyan/red/green`, flash dorado de
  victoria, callbacks de control/respawn y activacion correcta con
  WASD/flechas/gamepad aunque `gravityEnabled` este apagado.
- `src/main.js`: orquesta run de esferas, cronometro, contador, mejor tiempo
  en `localStorage`, reset por caida/salida de control y fin por victoria.
- `src/ui/hud.js`: HUD compacto con caidas, esferas, tiempo y mejor tiempo.
- `src/animations/timelines.js`: timeline `lightVictoryTimeline`.
- `src/data/*`, `src/admin/publish.js` y `cms/**`: `gameLightColor` en
  fallback, normalizador, publicacion y schema Strapi.
- `README.md`, `RUNBOOK.md`, `PLAN-PROYECTO28-V2.md`, `CHANGELOG.md` y
  handoffs: estado operativo actualizado.

Comportamiento importante:

- Las esferas no aparecen en reposo ni mientras la luz sigue al mouse.
- Aparecen al controlar la luz con teclado/gamepad.
- Si el usuario mueve el mouse y deja el control manual, el run se reinicia.
- Si la luz cae, el run se reinicia; al terminar el respawn se puede empezar
  otra vez.
- Al recolectar todas, el timer queda detenido, la luz brilla dorado 1 segundo
  y el mejor tiempo se guarda localmente.

---

## 5. Archivos fuente de verdad

- `README.md` - vision general, dev local, contenido, etapas.
- `ADMIN-URLS.md` - URLs para administrar sitio, CMS, GitHub, Google, DNS y
  Pixel Streaming.
- `RUNBOOK.md` - operacion, incidentes, rollback, secretos.
- `DEPLOY.md` - GitHub Pages, Strapi Cloud, OAuth, streaming, releases.
- `PLAN-PROYECTO28-V2.md` - plan completo y estado de etapas.
- `CHANGELOG.md` - historial semver.
- `VERSIONING.md` - contrato de ramas/tags/handoff.
- `cms/README.md` - schema y operacion Strapi.
- `docs/architecture.png` - diagrama operativo.
- `docs/demo-script.md` - guion demo/release.

---

## 6. Operacion clave

### Admin y publish

Admins permitidos:

- `inconcha@gmail.com` role `owner`.
- `yk8arts@gmail.com` role `editor`.

El panel Tweaks permite cambiar defaults y publicar a Strapi. Si Google
rechaza token, el frontend reintenta con una sesion fresca.

`Color luz` vive en:

```text
Admin -> Tweaks -> Juego -> Color luz
```

Valores aceptados por Strapi: `cyan`, `red`, `green`.

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

## 7. Pendientes conocidos

- `proyecto28.cl` sigue secundario; `.com` es canonico.
- Google Cloud consent screen puede seguir en Testing; si se agregan correos a
  Strapi, tambien agregarlos como test users en GCP.
- `Project` no usa Draft & Publish para evitar el choque entre el campo
  editable `status` y el `status` interno de Strapi v5.
- GPU Pixel Streaming real depende de infraestructura externa y costos.
- El mejor tiempo del mini-juego es local por navegador; no hay leaderboard
  remoto todavia.

---

## 8. Google Doc

El respaldo final debe quedar como subpestana bajo `Handoff` en:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Titulo esperado para este cierre:

```text
2026-05-30 17:33 UTC - v0.21.0 pacman-luz-color-admin
```

Regla absoluta: nunca crear cierres como pestanas raiz junto a `MISION`,
`Aprender` o `Handoff`.

---

Fin del handoff V2.
