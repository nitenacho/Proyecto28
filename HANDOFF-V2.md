# HANDOFF V2 - Proyecto 28

> Ultima actualizacion: 2026-05-31 (Etapa 21 Loader, logo CMS y freshness mobile - `v0.25.0`)
> Branch esperado: `main`
> Tag activo esperado tras cierre: `v0.25.0`
> Repo: https://github.com/nitenacho/Proyecto28
> Produccion canonica: https://proyecto28.com

Este handoff es el punto de entrada compacto para un nuevo agente. Para
operacion detallada, leer `RUNBOOK.md`.

---

## 1. Estado ejecutivo

Etapas 1-21 cerradas. Proyecto28 queda como web 3D interactiva con:

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
- Boton minimo en HUD para tomar/soltar control de la luz y descubrir el
  mini-juego sin conocer WASD.
- Gamepad con stick izquierdo, D-pad/flechas y boton inferior para salto.
- Mobile con Split-Screen Touch al activar el boton amarillo: joystick dinamico
  izquierdo anclado al primer toque y zona derecha dedicada a salto inmediato.
- El giroscopio y el salto tactil global fueron retirados para liberar la
  escena mobile y mantener la experiencia igual de completa que desktop.
- Boot screen con progreso sutil mientras Strapi y la escena terminan de
  cargar.
- Strapi freshness en mobile: requests publicas con `cache: no-store` y
  `_p28ts`, mas URLs de media versionadas.
- Logo del header configurable desde Strapi `SiteSetting.brandLogoImage`;
  `Project.popupImage` es la imagen prioritaria del popup.

Ultimo codigo funcional esperado:

- `v0.25.0` - Loader, logo CMS y freshness mobile.

Tags/commits recientes:

- `v0.25.0` - loader + logo CMS + cache-buster Strapi mobile.
- `v0.24.0` - `b9aaeb5` split-screen touch joystick.
- `v0.23.0` - `f386de6` control discoverable + gyro/gamepad.
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
- tag `v0.25.0`
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

Validado local `v0.25.0`:

- `npm run build` OK. Warning existente: chunk `three` >500 kB.
- `cd cms; npm run build` OK. Warning heredado de Strapi/Node:
  `DEP0187 fs.existsSync`.
- Chrome headless con `VITE_CMS_URL` real:
  - mobile `390x844`: `body/html == 390`, carga desde `cms`,
    `/api/site-setting` y `/api/projects` con `_p28ts`, popup visible.
  - desktop `1440x900`: `body/html == 1440`, carga desde `cms`,
    requests Strapi con `_p28ts`, popup visible.
  - popup mobile con imagen real: `object-fit: cover`, ratio `16 / 9`, URL
    versionada `?v=...`.

Validado postdeploy `v0.25.0`:

- GitHub Pages run `26719864051` OK para `cefbbe7`.
- Auto-tag run `26719864045` OK; tag `v0.25.0`.
- Produccion sirve `assets/index-CSMZXJFR.js` con `_p28ts`,
  `brandLogoImage`, `no-store` y `popupImageURL`; HTML contiene
  `boot-progress`.
- Smoke mobile vivo `390x844`: carga desde `cms`, requests Strapi incluyen
  `_p28ts`, popup `Invasión` visible con imagen `cover` `16 / 9`,
  `body/html == 390`.
- Strapi Cloud postdeploy:
  - `/admin` => `200`
  - `/api/projects?populate=*` => `200`
  - `/api/site-setting?populate=*` => `200`
  - `/api/site-setting?populate[brandLogoImage]=true` => `200`
  - `/api/admin-whitelists` => `403`
  - `/api/auth/check?email=inconcha@gmail.com` => owner permitido
  - `/api/auth/check?email=yk8arts@gmail.com` => editor permitido

Validado postdeploy `v0.24.0`:

- GitHub Pages run `26718658099` OK para `b9aaeb5`.
- Auto-tag run `26718658101` OK; tag `v0.24.0`.
- Produccion sirve `assets/index-yCREtV-Q.js` con:
  - `p28-touch-controls`
  - `p28-touch-zone-left`
  - `p28-joystick`
  - `p28-touch-jump-hint`
  - `setExternalMoveVector`
  - `p28-sphere-best-time-ms-v1`
- Produccion ya no contiene `DeviceOrientationEvent` ni
  `isLightControlSafeTarget`.
- Strapi Cloud postdeploy:
  - `/admin` => `200`
  - `/api/projects?populate=*` => `200` (`6` proyectos)
  - `/api/site-setting` => `200`
  - `/api/admin-whitelists` => `403`
  - `/api/auth/check?email=inconcha@gmail.com` => owner permitido
  - `/api/auth/check?email=yk8arts@gmail.com` => editor permitido

---

## 4. Cambios v0.25.0

Archivos principales:

- `index.html` y `src/styles/three-host.css`: boot screen con barra fina,
  porcentaje y estados de progreso.
- `src/data/cms.js`: `fetch` a Strapi con `cache: no-store`, `_p28ts` y
  versionado de media por `hash`/`updatedAt`.
- `src/main.js`: aplica `brandLogoImage` al `.brand-mark` sin persistirlo en
  Tweaks/localStorage.
- `src/ui/popup.js`: usa `popupImageURL || imageURL`.
- `cms/src/api/site-setting/content-types/site-setting/schema.json`: nuevo
  media field `brandLogoImage`.
- `cms/src/api/project/content-types/project/schema.json`: descripciones de
  pixelaje para imagenes de proyecto/popup.

Comportamiento importante:

- Si Strapi demora, el usuario ve progreso continuo y estados discretos en vez
  de quedar sin feedback.
- Mobile ya no depende del cache HTTP normal para contenido CMS: cada carga
  pide JSON fresco y evita respuestas viejas.
- El logo del header puede cambiarse desde Strapi subiendo una imagen
  recomendada `512 x 512 px`, PNG/WebP transparente.
- Para popups, subir `1600 x 900 px` (`16:9`, minimo `1200 x 675 px`) permite
  usar todo el marco sin bandas; el frontend rellena con `object-fit: cover`.

## 5. Cambios v0.24.0

Archivos principales:

- `src/ui/touchControls.js`: nueva capa inferior mobile/coarse pointer con dos
  zonas invisibles, joystick dinamico izquierdo y salto derecho inmediato.
- `src/main.js`: integra la capa tactil solo cuando el boton amarillo activa la
  luz; elimina giroscopio mobile y salto global sobre toda la escena.
- `README.md`, `PLAN-PROYECTO28-V2.md`, `CHANGELOG.md` y handoffs: estado
  operativo actualizado.

Comportamiento importante:

- El boton amarillo del HUD sigue siendo la entrada al juego oculto.
- Al activarlo en mobile aparece una zona inferior sutil:
  - mitad izquierda: el primer toque fija el centro del joystick;
  - `touchmove`/`pointermove` calcula vector X/Z normalizado con zona muerta;
  - mitad derecha: cualquier toque ejecuta salto en `pointerdown`.
- Al soltar el boton o perder control, la capa tactil desaparece y el vector se
  resetea a cero.
- La escena mobile vuelve a quedar libre para inspeccion/taps fuera de las
  zonas inferiores.

---

## 6. Cambios v0.23.0

Archivos principales:

- `src/game/light.js`: control lock explicito, API `toggleControl`,
  `setExternalMoveVector`, `jump`, soporte D-pad standard y fallback de ejes.
- `src/ui/hud.js`: boton minimo `.p28-control-toggle` con `aria-pressed`.
- `src/main.js`: integra boton HUD, giroscopio mobile y touch jump sin
  interferir con controles UI.
- `README.md`, `PLAN-PROYECTO28-V2.md`, `CHANGELOG.md` y handoffs:
  estado operativo actualizado.

Comportamiento importante:

- El boton del HUD entra/sale del modo controlado y hace visible el juego
  oculto sin depender de teclado.
- Con control bloqueado por boton, mover el mouse no libera la luz.
- D-pad/flechas de gamepad mueven la luz igual que el stick.
- En mobile, el primer evento de orientacion calibra el giroscopio; tocar la
  escena salta la luz.
- Si el navegador no permite sensores, teclado/gamepad y boton siguen
  funcionando.

---

## 7. Archivos fuente de verdad

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

## 8. Operacion clave

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

## 9. Pendientes conocidos

- Audio: requiere primera interaccion real antes de sonar.
- Mobile split-touch: la capa aparece solo con el boton amarillo activo; si se
  intenta controlar sin ese boton, el juego debe seguir respondiendo por
  teclado/gamepad.
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

## 10. Google Doc

El respaldo final debe quedar en el Google Doc oficial, sin usar el
Handoff:Kaiyi:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Respaldo insertado al final del tab Proyecto28/Handoff `t.7lpfc5ado1h`.
Revision Google Doc post-insercion:
`AFwiY1_TXlf3FoswqooNxLXGtXcXZfEIrg8-6ShBAQRxVW-msmWHGrErSDaGxjF6-ipR_G9V3H42vYOPPJRDiE_dySqPTLCkhjLiNrRZVoo`.

Titulo/anchor para este cierre:

```text
2026-05-31 17:50 UTC - v0.25.0 loader-logo-mobile-cms
```

---

Fin del handoff V2.
