# HANDOFF V2 - Proyecto 28

> Ultima actualizacion: 2026-05-31 (Etapa 18 Mobile parity + audio interactivo - `v0.22.0`)
> Branch esperado: `main`
> Tag activo esperado tras cierre: `v0.22.0`
> Repo: https://github.com/nitenacho/Proyecto28
> Produccion canonica: https://proyecto28.com

Este handoff es el punto de entrada compacto para un nuevo agente. Para
operacion detallada, leer `RUNBOOK.md`.

---

## 1. Estado ejecutivo

Etapas 1-18 cerradas. Proyecto28 queda como web 3D interactiva con:

- Vite + Three.js + GSAP.
- Strapi Cloud como CMS.
- Google OAuth + Strapi whitelist para admins.
- Tweaks publicables a `SiteSetting`.
- Pixel Streaming iframe/fallback sobre cubos, con preview controlable.
- Sync Claude Design y release assets en GitHub.
- Performance/a11y hardening y documentacion final.
- Mini-juego de recoleccion para la luz: esferas sobre cubos oscuros,
  cronometro, contador, mejor tiempo local y feedback dorado de victoria.
- Color de luz configurable desde `Admin -> Tweaks -> Juego` como
  `gameLightColor`.
- Mobile con la misma calidad visual que desktop: cubos redondeados, sombras,
  antialias y bloom/post-processing.
- Botones pequenos de pantalla completa y mute local.
- Audio WebAudio sintetizado para hover de bloques e interacciones, configurable
  desde `Admin -> Tweaks -> Audio` y Strapi (`audio*`).

Ultimo codigo funcional esperado:

- `v0.22.0` - Mobile parity + audio interactivo.

Tags/commits recientes:

- `v0.22.0` - `936717b` mobile parity + audio interactivo.
- `v0.21.0` - Pacman de luz + color admin.
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
cd cms
npm run build
```

Esperado despues del cierre:

- branch `main`
- working tree clean
- tag `v0.22.0`
- build Vite OK
- build Strapi OK

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

Validado postdeploy `v0.22.0`:

- GitHub Pages run `26708867215` OK para `936717b`.
- Auto-tag run `26708867220` OK.
- Produccion sirve `assets/index-BwOh2oIH.js` con:
  - `p28-audio-muted-v1`
  - `audioPreset`
  - `MIDI moderno`
  - `p28-system-controls`
  - `RoundedBoxGeometry`
  - `UnrealBloomPass`
- Strapi Cloud `/api/site-setting` incluye:
  - `audioEnabled: true`
  - `audioPreset: "midi"`
  - `audioMasterVolume: 0.24`
  - `audioHoverVolume: 0.2`
  - `audioInteractionVolume: 0.18`
  - `updatedAt: 2026-05-31T09:29:14.831Z`

---

## 4. Cambios v0.22.0

Archivos principales:

- `src/scene/scene.js`: elimina modo visual reducido por mobile/coarse pointer;
  usa geometria redondeada, sombras, antialias y bloom en mobile y desktop.
- `src/styles/app.css`: mobile mantiene viewfinder y recupera blur/saturacion
  de popup/stream card.
- `src/audio/interactionAudio.js`: sintetizador WebAudio con presets
  `midi`, `glass`, `soft`, notas por bloque y feedback minimalista de juego/UI.
- `src/ui/systemControls.js`: botones pequenos de fullscreen y mute local.
- `src/main.js`: monta audio/controles, dispara sonidos en hover de bloques,
  tap, control, pickup, caida y victoria.
- `src/data/*`, `src/admin/publish.js` y `cms/**`: campos `audio*` en
  fallback, normalizador, publicacion, schema Strapi y bootstrap.
- `README.md`, `PLAN-PROYECTO28-V2.md`, `CHANGELOG.md` y handoffs:
  estado operativo actualizado.

Comportamiento importante:

- El audio no suena antes de la primera interaccion real del usuario por
  politicas de autoplay del navegador.
- El mute es local por navegador (`p28-audio-muted-v1`).
- `audioEnabled` en Strapi permite apagar globalmente el sintetizador.
- Mobile queda visualmente al nivel de desktop; si un celular tiene gamepad, el
  mini-juego sigue siendo jugable.

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

Rutas clave:

```text
Admin -> Tweaks -> Juego -> Color luz
Admin -> Tweaks -> Audio
Admin -> Tweaks -> Streaming -> Preview visible
```

### Pixel Streaming

El sitio no aloja Unreal. GitHub Pages solo monta un iframe cuando Strapi
entrega URL valida:

- `SiteSetting.pixelStreamingEnabled`
- `SiteSetting.pixelStreamingPreviewEnabled`
- `Project.unrealEnabled`
- `Project.unrealStreamURL`
- `Project.unrealLevelName`

### Agregar proyecto

Crear/duplicar Project en Strapi, publicar, probar popup/modelo/redirect, y si
usa Unreal conectar `unrealStreamURL` + `unrealLevelName`. Ver `RUNBOOK.md`.

---

## 7. Pendientes conocidos

- Audio: requiere primera interaccion real antes de sonar.
- Mobile con calidad desktop puede exigir mas GPU en equipos muy viejos.
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

El respaldo final debe quedar en el Google Doc oficial, sin usar el
Handoff:Kaiyi:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Titulo esperado para este cierre:

```text
2026-05-31 09:29 UTC - v0.22.0 mobile-audio-controls
```

---

Fin del handoff V2.
