# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-06-02 (Etapa 22 floor ascension - `v0.26.0`)
> **Tag activo esperado tras cierre:** `v0.26.0`
> **Branch esperado:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28
> **Produccion canonica:** https://proyecto28.com
> **Google Doc revision cierre:** `AFwiY1-q2sRKejy3mEhBEeT0VwKev2mnHNxxfoOYJok9C6rE_ijXs9Xl3GpSuqPdXMTl1lPnilJqLTrh-9XZ3gfnJW4KQwtLHCzDlMnI0uE`

Etapas 1-22 cerradas y `v0.26.0` aplicado. Proyecto28 queda con web 3D interactiva, Strapi Cloud,
Google OAuth + whitelist, Tweaks publicables, Pixel Streaming iframe/fallback,
sync Claude Design, hardening performance/a11y, mini-juego Pacman de luz y una
capa de audio interactivo configurable desde Strapi. La luz ahora se puede
tomar/soltar desde un boton minimo en HUD, acepta D-pad/flechas de gamepad y en
mobile usa pantalla dividida tactil: joystick dinamico izquierdo y zona derecha
de salto inmediato. El boot screen ahora muestra `Cargando proyecto N/28`,
mobile pide contenido Strapi fresco con reintentos/timeout, y el logo del
header puede venir desde una imagen `brandLogoImage` en Strapi. La URL limpia
`proyecto28.com` queda protegida con un freshness worker network-first, y las
imagenes de popup mobile ya no desaparecen al reutilizar un asset cargado.
Seleccionar un cubo de proyecto con click/tap/Enter ahora fija el popup y
asienta la luz en el centro superior del cubo hasta que el usuario cierre con
la X del popup. Si el click/tap cae cerca pero no exactamente sobre el cubo,
el radio magnetico `gameTileCaptureRadius` atrae la seleccion al cubo de
proyecto mas cercano para fijar popup + luz.
El mini-juego de luz ahora asciende por pisos: al comer suficientes esferas
aparece una escalera, la camara/mundo simulan subir y el piso anterior queda
visible como InstancedMesh/Grid Ventana optimizado. La meta de esferas, altura
entre pisos y cantidad de pisos visibles son publicables desde Strapi.

---

## 0. Resumen en 30 segundos

Estado vigente esperado tras cierre:

- `v0.26.0`: la luz/personaje come `gameAscendSphereGoal` esferas, genera una
  escalera y asciende de piso; el piso anterior queda visible en fondo como
  InstancedMesh/Grid Ventana con `gameFloorHeight` y `gameGhostFloors`.
  Produccion verificada: Pages run `26797380673`, Auto-tag run `26797380660`,
  commit `5752efe`, tag `v0.26.0`, Strapi expone `6/4.2/3` y Google Doc
  actualizado en tab `t.7lpfc5ado1h`.
- `v0.25.6`: click/tap cercano a un cubo de proyecto usa captura magnetica
  configurable (`gameTileCaptureRadius`) para fijar popup + luz sin exigir
  precision perfecta. QA: `p28TileCaptureMode="magnet"` y
  `p28TileCaptureRadius`.
- `v0.25.5`: click/tap/Enter sobre un cubo de proyecto fija el popup, ancla la
  luz al centro del cubo y solo la X libera la seleccion para volver a flotar.
- `v0.25.4`: `public/p28-sw.js` fuerza navegaciones frescas para la URL limpia,
  mantiene Strapi fuera del worker, y corrige popup images mobile que
  parpadeaban/desaparecian.
- `v0.25.1`: loader principal `Cargando proyecto N/28`, URL CMS runtime,
  reintentos/timeout de Strapi y QA mobile confirmando `Rectangle 7 ->
  Random: Museo MAC` desde CMS vivo.
- `v0.25.0`: loader de progreso sutil, requests Strapi con `cache: no-store`
  + `_p28ts`, URLs de media versionadas, `brandLogoImage` en SiteSetting y
  pixel hints para logo/popup images.
- `v0.24.0`: mobile reemplaza giroscopio + toque global por Split-Screen Touch
  solo al presionar el boton amarillo: joystick dinamico izquierdo y salto
  dedicado derecho, con la escena libre fuera de esa zona inferior.
- `v0.22.0`: mobile vuelve a usar calidad visual de desktop; se agregan botones
  pequenos de fullscreen/mute; el sitio sintetiza audio WebAudio tipo MIDI en
  hover de bloques e interacciones; Strapi SiteSetting incluye `audio*`.
- `v0.23.0`: el HUD del mini-juego incluye boton minimo para controlar/soltar
  la luz; gamepad acepta D-pad/flechas.
- `v0.21.0`: mini-juego de esferas para la luz, cronometro, mejor tiempo local
  y color de luz `gameLightColor`.
- Dominio canonico: `https://proyecto28.com`.
- CMS: `https://honest-candy-800d1e4a92.strapiapp.com`.
- `.cl` sigue secundario/pending segun DNS/certificado; no bloquear continuidad
  si `.com` esta sano.

Regla operativa confirmada por el owner: el proyecto no se considera cerrado si
solo funciona local. Cada cambio funcional debe terminar con repo, Pages,
Strapi, docs, handoff y Google Doc sincronizados.

---

## 1. Como arrancar como nuevo agente IA

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
- ultimo tag `v0.26.0`
- build Vite OK
- build Strapi OK

Lectura obligatoria:

1. `HANDOFF-V2.md` - handoff compacto.
2. `ADMIN-URLS.md` - URLs para administrar todos los servicios.
3. `RUNBOOK.md` - operacion, incidentes, rollback, secretos.
4. `DEPLOY.md` - GitHub Pages, Strapi, OAuth, Pixel Streaming, releases.
5. `CHANGELOG.md` - `[0.26.0]`.
6. `PLAN-PROYECTO28-V2.md` - Etapa 22 + patches `v0.25.1`/`v0.25.4`/`v0.25.5`/`v0.25.6` cerrados.
7. `cms/README.md` - SiteSetting incluye `brandLogoImage`, `gameLightColor`
   y `audio*`.

---

## 2. Cambios v0.26.0

### Floor ascension game loop

- Nuevo `src/game/floors.js` crea escalera luminosa, transicion vertical y
  pisos anteriores visibles como `InstancedMesh/Grid Ventana`.
- El HUD suma `Piso`; al reunir suficientes esferas se sube de nivel y se
  reinicia la meta.
- Nuevos SiteSetting publicables desde `Admin -> Tweaks -> Juego`:
  `gameAscendSphereGoal` (`1..18`, recomendado `6`), `gameFloorHeight`
  (`2.8..7.5`, recomendado `4.2`) y `gameGhostFloors` (`1..4`, recomendado
  `3`).
- Documento tecnico: `docs/floor-system.md`.
- QA con `?floor-test=...`:
  `window.p28FloorDebug.state()` y
  `window.p28FloorDebug.triggerAscension()`.
- Build id y Service Worker:
  `v0.26.0-20260602-floor-ascension`.

### Archivos tocados

- `index.html`
- `public/p28-sw.js`
- `src/main.js`
- `src/game/floors.js`
- `src/scene/scene.js`
- `src/ui/hud.js`
- `src/data/cms.js`
- `src/data/fallback.js`
- `src/admin/publish.js`
- `cms/src/index.js`
- `cms/src/api/site-setting/controllers/site-setting.js`
- `cms/src/api/site-setting/content-types/site-setting/schema.json`
- `docs/floor-system.md`

## 3. Cambios v0.25.6

### Captura magnetica de cubos

- `gameTileCaptureRadius` vive en Strapi `SiteSetting` y en fallback local.
  Default recomendado `1.15`, limites `0.8..1.8`.
- `Admin -> Tweaks -> Juego -> Radio captura popup` permite ajustar y publicar
  el radio.
- Click/tap primero intenta impacto exacto del raycaster; si no hay proyecto,
  proyecta el puntero al plano X/Z y captura el cubo de proyecto mas cercano
  dentro del radio.
- Al capturar, se reutiliza el flujo `v0.25.5`: popup fijado, luz asentada en
  el centro superior del cubo y X como unica accion para liberar.
- QA invisible:
  - `document.documentElement.dataset.p28TileCaptureMode` => `exact`/`magnet`;
  - `document.documentElement.dataset.p28TileCaptureRadius` => radio activo.

### Archivos tocados

- `index.html`
- `public/p28-sw.js`
- `src/main.js`
- `src/data/cms.js`
- `src/data/fallback.js`
- `src/admin/publish.js`
- `cms/src/index.js`
- `cms/src/api/site-setting/controllers/site-setting.js`
- `cms/src/api/site-setting/content-types/site-setting/schema.json`

## 3. Cambios v0.25.5

### Popup fijo + luz anclada

- Click/tap/Enter sobre un cubo de proyecto fija el popup y deja la luz
  asentandose en el centro superior del cubo.
- Mientras el popup esta fijado, `pointermove`, taps fuera, `pointerleave`,
  mouse-follow y Escape no cambian ni cierran el detalle.
- La X del popup es la unica accion que libera el estado fijado; al cerrar,
  la luz vuelve a flotar y el popup queda oculto.
- QA invisible: `document.documentElement.dataset.p28PinnedProject` indica el
  proyecto fijado, por ejemplo `028.C`.
- La navegacion directa desde click/tap en cubo queda reemplazada por el CTA
  del popup, para que leer el detalle no dependa de hover estable.

### Archivos tocados

- `index.html`
- `public/p28-sw.js`
- `src/game/light.js`
- `src/main.js`
- `src/ui/popup.js`

## 4. Cambios v0.25.4

### Fresh navigation para proyecto28.com

- Nuevo `public/p28-sw.js` en produccion. El worker toma control de
  `proyecto28.com` y responde navegaciones con una request network-first que
  agrega un cache-buster interno, sin cambiar la URL visible.
- `index.html` registra el worker solo en el dominio canonico y recarga una
  vez cuando el worker toma control. Esto reduce el impacto del
  `Cache-Control: max-age=600` que sigue entregando GitHub Pages/Cloudflare.
- El worker no intercepta llamadas cross-origin a Strapi. La capa CMS conserva
  `_p28ts`, `cache: no-store`, timeout y reintentos.

### CMS y popup mobile

- `src/data/cms.js` aumenta timeout a `8s` y evita caer al demo inicial si
  `projects` responde pero `site-setting` se demora.
- `src/ui/popup.js` carga imagenes visibles con prioridad alta y mantiene la
  clase `loaded` cuando el navegador reutiliza el mismo `img.src`.
- Caso validado: URL limpia `https://proyecto28.com`, mobile `390x844`,
  `data-p28-content-source="cms"`, `028.C -> Random: Museo MAC`, popup
  `028.F -> Extrasolar 1er lugar` con imagen visible y estable.

### Archivos tocados

- `index.html`
- `public/p28-sw.js`
- `src/data/cms.js`
- `src/ui/popup.js`

## 5. Cambios v0.25.1

### Loader proyecto 1/28

- `index.html` cambia el mensaje principal del boot screen a
  `Cargando proyecto N/28`.
- El detalle de etapa queda como texto secundario discreto:
  `Conectando Strapi`, `Contenido Strapi listo`, `Preparando escena`,
  `Activando controles`, `Listo`.

### CMS mobile hardening

- `index.html` define `window.__P28_CMS_URL__` con la URL publica de Strapi
  como respaldo runtime.
- `src/data/cms.js` usa `_p28ts` con intento unico, `cache: no-store`,
  `credentials: omit`, `mode: cors`, timeout de `5s` y tres intentos.
- El HTML agrega meta no-cache para reducir HTML viejo en navegadores moviles.
- `document.documentElement.dataset.p28ContentSource` deja trazabilidad de
  `cms` vs `fallback` para QA mobile.

### Archivos tocados

- `index.html`
- `src/data/cms.js`
- `src/styles/three-host.css`

## 6. Cambios v0.25.0

### Loader + feedback de carga

- `index.html` agrega porcentaje y barra fina en el boot screen.
- `src/main.js` reporta hitos: conexión Strapi, contenido listo, escena,
  controles y listo.
- Si Strapi demora, el usuario ve avance progresivo en lugar de una pantalla
  muda.

### Mobile freshness Strapi

- `src/data/cms.js` usa `fetch(..., { cache: 'no-store' })`.
- Cada request publica agrega `_p28ts` para evitar cache viejo en mobile.
- Las URLs de media agregan `?v=` con `hash`/`updatedAt` cuando Strapi lo
  entrega.

### Logo + pixelaje en Strapi

- `SiteSetting` incorpora `brandLogoImage` para cambiar el logo/icono del
  header desde Strapi.
- Recomendacion logo: PNG/WebP transparente `512 x 512 px`, zona segura central
  80%, menos de `300 KB`.
- `Project.image` y `Project.popupImage` incluyen descripciones con
  recomendacion `1600 x 900 px` (`16:9`), minimo `1200 x 675 px`.
- El popup prioriza `popupImage` y rellena el marco `16:9` con
  `object-fit: cover`.

### Archivos tocados

- `index.html`
- `src/data/cms.js`
- `src/data/fallback.js`
- `src/main.js`
- `src/ui/popup.js`
- `src/styles/app.css`
- `src/styles/three-host.css`
- `cms/src/api/site-setting/content-types/site-setting/schema.json`
- `cms/src/api/project/content-types/project/schema.json`
- `README.md`
- `cms/README.md`
- `CHANGELOG.md`
- `PLAN-PROYECTO28-V2.md`

## 6. Cambios v0.24.0

### Split-screen touch joystick

- Nuevo `src/ui/touchControls.js`.
- La capa tactil mobile/coarse pointer vive sutilmente en la zona inferior y se
  activa solo cuando el boton amarillo del HUD toma control de la luz.
- Mitad izquierda: joystick dinamico. El primer toque fija el centro y el
  movimiento del dedo calcula vector X/Z normalizado con radio maximo y zona
  muerta.
- Mitad derecha: zona invisible de salto. Ejecuta `controlLight.jump()` en
  `pointerdown`, sin esperar `touchend`, para permitir saltos multiples.
- El joystick no usa Nipple.js: se implementa con Pointer Events para no sumar
  dependencias ni peso al bundle.

### Mobile input

- Se elimina el giroscopio mobile (`DeviceOrientationEvent`) como control del
  juego oculto.
- Se elimina el salto tactil global sobre toda la escena.
- Fuera de la zona inferior, mobile vuelve a quedar libre para inspeccionar la
  escena y abrir popups sin saltos accidentales.

### Archivos tocados

- `src/ui/touchControls.js`
- `src/main.js`
- `README.md`
- `CHANGELOG.md`
- `PLAN-PROYECTO28-V2.md`

---

## 7. Cambios v0.23.0

### Control discoverable

- `src/ui/hud.js` agrega `.p28-control-toggle`: boton pequeno junto a
  `Caidas`, `Esferas`, `Tiempo` y `Mejor`.
- El boton alterna `aria-pressed` y texto accesible entre `Controlar luz` y
  `Soltar luz`.
- Click/tap sobre el boton llama `controlLight.toggleControl()`.
- Mientras el boton mantiene el control bloqueado, el movimiento del mouse ya
  no saca la luz del modo fisico; el jugador debe soltarla con el mismo boton.

### Gamepad ampliado

- `src/game/light.js` mantiene stick izquierdo y boton 0 para salto.
- Nuevo soporte para botones standard D-pad:
  - 12 arriba;
  - 13 abajo;
  - 14 izquierda;
  - 15 derecha.
- Fallback para D-pad expuesto como ejes `axes[6]` / `axes[7]`.
- El vector de movimiento normaliza teclado, stick, D-pad y sensores externos.

### Mobile gyro + touch jump

- `src/main.js` agrega deteccion mobile/coarse pointer.
- Al activar el boton del HUD en mobile, se solicita
  `DeviceOrientationEvent.requestPermission()` cuando el navegador lo exige.
- El giroscopio se calibra con la primera orientacion recibida y aplica zona
  muerta para que la luz no tiemble.
- En modo controlado, tocar la escena hace saltar la luz.
- El touch jump ignora objetivos UI: boton de control, fullscreen/mute, Tweaks,
  Admin, popup y route overlay.

### Archivos tocados

- `src/game/light.js`
- `src/main.js`
- `src/ui/hud.js`
- `README.md`
- `CHANGELOG.md`
- `PLAN-PROYECTO28-V2.md`

---

## 8. Cambios v0.22.0

### Mobile parity visual

- `src/scene/scene.js` ya no usa `isConstrainedViewport`.
- Mobile/tablet/coarse pointer usan la misma base visual que desktop:
  - `RoundedBoxGeometry`;
  - antialias activo;
  - DPR maximo `2`;
  - sombras activas;
  - `EffectComposer` + `UnrealBloomPass`.
- La camara adaptativa sigue vigente para encuadre mobile.
- `src/styles/app.css` ya no fuerza ocultar `.viewfinder` en mobile y recupera
  blur/saturacion en popup y stream card.

### Controles pequenos

- Nuevo `src/ui/systemControls.js`.
- Monta dos botones discretos sobre la escena:
  - `Pantalla completa`;
  - `Sonido activado/desactivado`.
- El mute es local al navegador y usa `localStorage` key:
  `p28-audio-muted-v1`.

### Audio WebAudio

- Nuevo `src/audio/interactionAudio.js`.
- Sintetizador sin assets externos:
  - preset `midi` como default;
  - preset `glass`;
  - preset `soft`;
  - notas breves tipo teclado MIDI moderno al pasar sobre cada bloque;
  - sonidos minimalistas para tap, entrar en control, recolectar, ganar, caer y
    UI.
- Importante: por politicas del navegador, el audio se desbloquea despues de
  una primera interaccion real (`pointerdown`, tecla o boton de UI). Antes de
  eso no se programan tonos para evitar sonidos acumulados.

### Tweaks / Strapi

Nueva seccion:

```text
Admin -> Tweaks -> Audio
```

Campos publicables:

```text
audioEnabled
audioPreset              midi | glass | soft
audioMasterVolume        0..1
audioHoverVolume         0..1
audioInteractionVolume   0..1
```

Archivos tocados:

- `cms/src/api/site-setting/content-types/site-setting/schema.json`
- `cms/src/api/site-setting/controllers/site-setting.js`
- `cms/src/index.js`
- `src/admin/publish.js`
- `src/data/cms.js`
- `src/data/fallback.js`
- `src/main.js`
- `src/audio/interactionAudio.js`
- `src/ui/systemControls.js`
- `src/scene/scene.js`
- `src/styles/app.css`

---

## 9. Validacion realizada antes del cierre

### Local v0.25.6

```powershell
npm run build
cd cms
npm run build
```

Resultado:

- Frontend OK. Warning existente: chunk `three` >500 kB.
- Strapi admin build OK. Warning heredado: `DEP0187 fs.existsSync`.
- Build local `v0.25.6` genera `assets/index-B9LWKLuG.js` y copia
  `public/p28-sw.js` a `dist/p28-sw.js`.

Servidor local:

- `http://127.0.0.1:5176/` responde `HTTP 200` sirviendo build preview.
- QA usa la URL CMS runtime `window.__P28_CMS_URL__` desde:
  `C:/Users/incon/Downloads/EscritorioNobita/Proyectos_Claude/Claude_P28/Proyecto28`.

Chrome CDP smoke:

- Mobile `390x844`:
  - boot temprano: `Cargando proyecto 6/28`, detalle `Conectando Strapi`;
  - carga desde `cms`;
  - `/api/site-setting` y `/api/projects` incluyen `_p28ts=...-0`;
  - `body/html == 390`, sin overflow horizontal;
  - `028.C` muestra `Random: Museo MAC`;
  - popup `Random: Museo MAC`;
  - no aparece `Saturno Engine`.
- Desktop `1440x900`:
  - carga desde `cms`;
  - requests Strapi incluyen `_p28ts`;
  - `body/html == 1440`, sin overflow horizontal;
  - popup visible.
- Popup mobile con imagen real `Invasión`:
  - `object-fit: cover`;
  - ratio `16 / 9`;
  - URL de media versionada `?v=invasion1_d43ddbe31e`;
  - sin overflow horizontal.
- Popup mobile local con `028.F`:
  - titulo `Extrasolar 1er lugar`;
  - imagen `extrasolarframe_854244c860.png` con clase `loaded`;
  - `opacity: 1`;
  - rect `352 x 198 px`;
  - se mantiene visible varios segundos despues.

- Pinned popup local con `028.C`:
  - `p28PinnedProject="028.C"`;
  - popup `.pinned.visible`;
  - mouse move + Escape no cierran el popup;
  - click en X limpia `p28PinnedProject` y deja `aria-hidden="true"`.
- Magnetic capture local:
  - viewport mobile `390x844`;
  - tap sintetico cercano en `x=284, y=326` fija `028.B`;
  - `p28TileCaptureMode="magnet"`;
  - `p28TileCaptureRadius="1.15"`;
  - mouse move + Escape mantienen popup `.pinned.visible`;
  - X libera el pin.

### Produccion/Strapi predeploy

- `https://proyecto28.com` => `200`
- `https://proyecto28.com/robots.txt` => `200`
- `https://proyecto28.com/sitemap.xml` => `200`
- `/api/projects?populate=*` => `200`
- `/api/site-setting` => `200`
- `/api/admin-whitelists` => `403`
- `/api/auth/check?email=inconcha@gmail.com` =>
  `{ allowed:true, role:"owner" }`
- `/api/auth/check?email=yk8arts@gmail.com` =>
  `{ allowed:true, role:"editor" }`

### Produccion postdeploy v0.25.6

- Commit funcional: `abd6d93 fix: add magnetic popup capture radius`.
- Tag activo: `v0.25.6`.
- GitHub Actions:
  - Pages run `26794558779` OK;
  - Auto tag run `26794558812` OK.
- Produccion:
  - `https://proyecto28.com` => `200`
  - HTML vivo contiene `v0.25.6-20260601-magnetic-popup-capture`
  - `/p28-sw.js` contiene `v0.25.6-20260601-magnetic-popup-capture`
- Smoke mobile vivo `390x844`:
  - carga desde `cms`;
  - Service Worker activo: `/p28-sw.js?build=v0.25.6...`;
  - tap cercano fija `028.B · Invasión` con `p28TileCaptureMode="magnet"`;
  - `p28TileCaptureRadius="1.15"`;
  - `Random: Museo MAC` sigue visible desde Strapi;
  - mouse move + Escape no cierran el popup;
  - X libera el pin.
- Strapi Cloud postdeploy:
  - `/admin` => `200`
  - `/api/projects?populate=*` => `200`
  - `/api/site-setting?populate=*` => `200`
  - `SiteSetting.gameTileCaptureRadius=1.15`
  - `/api/admin-whitelists` => `403`

### Produccion postdeploy v0.25.5

- Commit funcional: `deaceb7 fix: pin light and popup on project select`.
- Tag activo: `v0.25.5`.
- GitHub Actions:
  - Pages run `26790907351` OK;
  - Auto tag run `26790907349` OK.
- Produccion:
  - `https://proyecto28.com` => `200`
  - HTML vivo contiene `v0.25.5-20260601-pinned-popup-light`
  - `/p28-sw.js` contiene `v0.25.5-20260601-pinned-popup-light`
- Smoke mobile vivo `390x844`:
  - carga desde `cms`;
  - Service Worker activo: `/p28-sw.js?build=v0.25.5...`;
  - `028.C · Random: Museo MAC`;
  - seleccionar el cubo fija `p28PinnedProject="028.C"`;
  - popup `Random: Museo MAC` queda `.pinned.visible`;
  - mouse move + Escape no lo cierran;
  - X libera el pin y deja el popup `aria-hidden="true"`.
- Strapi Cloud postdeploy:
  - `/admin` => `200`
  - `/api/projects?populate=*` => `200`
  - `/api/site-setting?populate=*` => `200`
  - `/api/admin-whitelists` => `403`

### Produccion postdeploy v0.25.4

- Commit funcional: `d88f583 fix: force fresh navigations and persist popup images`.
- Commit hotfix: `ddd62aa fix: keep Strapi API outside freshness worker`.
- Commit version worker: `05b0d31 chore: align freshness worker build id`.
- Tag activo: `v0.25.4`.
- Produccion:
  - `https://proyecto28.com` => `200`
  - `https://proyecto28.com/robots.txt` => `200`
  - `https://proyecto28.com/sitemap.xml` => `200`
- Bundle vivo:
  - asset `assets/index-D70WiNam.js`
  - HTML vivo contiene `v0.25.4-20260601-fresh-nav-popup-image`
  - `/p28-sw.js` contiene `v0.25.4-20260601-fresh-nav-popup-image`
  - contiene `_p28ts`
  - contiene `p28ContentSource`
  - contiene timeout CMS `8000`
  - HTML vivo contiene `Cargando proyecto 1/28`
  - HTML vivo contiene `__P28_CMS_URL__`
- Smoke mobile vivo `390x844`:
  - carga desde `cms`
  - Service Worker activo: `/p28-sw.js?build=v0.25.4...`
  - requests `/api/site-setting` y `/api/projects` incluyen `_p28ts=...-0`
  - `028.C · Random: Museo MAC · PROTOTIPO`
  - no aparece `Saturno Engine`
  - popup `028.F · Extrasolar 1er lugar`
  - imagen de popup `extrasolarframe_854244c860.png` visible con clase
    `loaded`, `opacity: 1`, rect `352 x 198 px`, estable varios segundos
    despues
  - `body/html == 390`, sin overflow horizontal
- Strapi Cloud postdeploy:
  - `/admin` => `200`
  - `/api/projects?populate=*` => `200`
  - `/api/site-setting?populate=*` => `200`
  - `/api/site-setting?populate[brandLogoImage]=true` => `200`
  - `/api/admin-whitelists` => `403`
  - `/api/auth/check?email=inconcha@gmail.com` =>
    `{ allowed:true, role:"owner" }`
  - `/api/auth/check?email=yk8arts@gmail.com` =>
    `{ allowed:true, role:"editor" }`

---

## 10. Operacion clave

### Admin / Tweaks / publicar

El boton `Admin` abre Google OAuth. Strapi whitelist permite:

- `inconcha@gmail.com` - owner
- `yk8arts@gmail.com` - editor

`PUBLICAR CAMBIOS` persiste snapshots al singleton `SiteSetting` via
`/api/publish`. Si el token Google vence, el frontend reintenta una vez con
sesion fresca.

Color de luz:

```text
Admin -> Tweaks -> Juego -> Color luz
```

Audio:

```text
Admin -> Tweaks -> Audio
```

Valores `audioPreset` aceptados:

- `midi`
- `glass`
- `soft`

### Como probar el mini-juego + audio/input

1. Abrir `https://proyecto28.com`.
2. Hacer hard refresh si el navegador conserva assets viejos.
3. Hacer una primera interaccion real (click/tecla/boton) para desbloquear
   audio del navegador.
4. Pasar el mouse por los bloques: debe sonar una nota sutil por bloque.
5. Controlar la luz con el boton pequeno del HUD, `W/A/S/D`, flechas,
   stick izquierdo o D-pad/flechas de gamepad.
6. Las esferas deben aparecer solo mientras la luz esta controlada.
7. En mobile, activar el boton amarillo; la zona inferior izquierda debe crear
   el joystick dinamico donde toca el dedo y la zona derecha debe saltar en el
   primer toque.
8. Recolectar cada esfera por cercania.
9. Confirmar contador `Esferas`, `Tiempo` y `Mejor`.
10. Al terminar todas, el timer queda detenido, la luz brilla dorado 1 segundo
   y suena feedback de victoria.
11. Soltar desde el boton o caer al vacio debe reiniciar timer/contador y
    ocultar o reaparecer esferas segun corresponda.

### Pixel Streaming

GitHub Pages no ejecuta Unreal. El stream vive en infraestructura GPU externa y
el frontend solo monta iframe si Strapi entrega configuracion valida.

Para apagar el preview/fallback:

```text
Admin -> Tweaks -> Streaming -> Preview visible OFF -> PUBLICAR CAMBIOS
```

---

## 11. Deploy esperado

Flujo correcto para una etapa nueva:

1. Trabajar en rama `etapa-N-slug`.
2. Commit funcional/documental.
3. Merge fast-forward a `main`.
4. Push a `origin/main`.
5. GitHub Pages despliega si se tocaron `src/**`.
6. Strapi Cloud reconstruye si se tocaron `cms/**`.
7. Verificar `https://proyecto28.com` y endpoints Strapi.
8. Actualizar handoff local + Google Doc.
9. Confirmar tag semver.

Para `v0.25.6`:

- Rama usada: `main`.
- Commit funcional: `abd6d93 fix: add magnetic popup capture radius`.
- Tag automatico final: `v0.25.6`.
- Build id: `v0.25.6-20260601-magnetic-popup-capture`.

Para `v0.25.5`:

- Rama usada: `main`.
- Commit funcional: `deaceb7 fix: pin light and popup on project select`.
- Tag automatico final: `v0.25.5`.
- Build id: `v0.25.5-20260601-pinned-popup-light`.

Para `v0.25.4`:

- Rama usada: `main`.
- Commit funcional: `d88f583 fix: force fresh navigations and persist popup images`.
- Commit hotfix: `ddd62aa fix: keep Strapi API outside freshness worker`.
- Commit final build id: `05b0d31 chore: align freshness worker build id`.
- Tag manual final: `v0.25.4` apuntando a `05b0d31`.

---

## 12. Riesgos y pendientes

- Audio en navegadores: no puede sonar antes de la primera interaccion real por
  politicas de autoplay. Esto es esperado.
- Mobile ahora usa calidad desktop; si aparece fatiga en dispositivos low-end,
  evaluar un toggle admin futuro de calidad, pero no volver a degradar por
  defecto.
- Split-touch aparece solo con el boton amarillo activo. Sin ese boton, mobile
  no debe capturar la escena; teclado/gamepad siguen funcionando.
- `proyecto28.cl` no es canonico hasta cerrar DNS/certificado/redirect.
- Google OAuth consent screen puede seguir en Testing; al agregar emails a
  Strapi, tambien agregarlos como test users en Google Cloud.
- `Project` no usa Draft & Publish para evitar el choque entre el campo
  editable `status` y el `status` interno de Strapi v5.
- Pixel Streaming real depende de servidor GPU externo, TLS, costos y
  auto-suspend.
- El mejor tiempo del mini-juego es local por navegador; no existe leaderboard
  remoto todavia.

---

## 13. Google Doc

Respaldo oficial:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Regla:

- Actualizar el tab de Proyecto28/Handoff vigente al final del documento.
- No usar el Handoff:Kaiyi para esta etapa.
- Respaldo insertado al final del tab Proyecto28/Handoff `t.7lpfc5ado1h`.
- Revision Google Doc post-insercion:
`AFwiY182Hz9zXVz3y_kZY-brLpbEUuhBz4puvRhy6WSrJOBtXt5750E-VQ93vKeeJ1Pm4Y8fDnrXSAiC9l0Ygo7HsArSdnBldhSzQ1f41P0`.
- Titulo/anchor:

```text
2026-06-02 02:30 UTC - v0.25.6 magnetic-popup-capture
```

---

Fin del handoff `v0.25.6`.
