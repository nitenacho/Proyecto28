# HANDOFF V2 - Proyecto 28

> Ultima actualizacion: 2026-05-31 (Etapa 20 Split-screen touch joystick - `v0.24.0`)
> Branch esperado: `main`
> Tag activo esperado tras cierre: `v0.24.0`
> Repo: https://github.com/nitenacho/Proyecto28
> Produccion canonica: https://proyecto28.com

Este handoff es el punto de entrada compacto para un nuevo agente. Para
operacion detallada, leer `RUNBOOK.md`.

---

## 1. Estado ejecutivo

Etapas 1-20 cerradas. Proyecto28 queda como web 3D interactiva con:

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

Ultimo codigo funcional esperado:

- `v0.24.0` - Split-screen touch joystick.

Tags/commits recientes:

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
- tag `v0.24.0`
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

## 4. Cambios v0.24.0

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

## 5. Cambios v0.23.0

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

## 6. Archivos fuente de verdad

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

## 7. Operacion clave

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

## 8. Pendientes conocidos

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

## 9. Google Doc

El respaldo final debe quedar en el Google Doc oficial, sin usar el
Handoff:Kaiyi:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Respaldo insertado al final del tab Proyecto28/Handoff `t.7lpfc5ado1h`.
Revision Google Doc post-insercion:
`AFwiY1-BMO5OtT6yc2WVyVX425LMXusp_GiQwApeM6ybJMpz5PXwR3WSbL4wOUzPsAL5-Am0bVXXLkQ1b8tFPe5fxp7vcxfainCRwUvUYNc`.

Titulo/anchor para este cierre:

```text
2026-05-31 16:58 UTC - v0.24.0 split-touch-joystick
```

---

Fin del handoff V2.
