# PROYECTO 28

Sitio interactivo 3D — Tiles WebGL/Three.js + polish GSAP + popup HUD +
tweaks live, accesibilidad por teclado, lazy Pixel Streaming y contenido
editable desde un Strapi headless.

```
proyecto28/
├── src/                Frontend Vite + Three.js (raíz del sitio)
├── public/CNAME        Dominio principal (proyecto28.com)
├── cms/                Strapi v5 — content types + bootstrap
├── docs/               Diagrama de arquitectura + guion/demo release
├── .github/workflows/  CI: build + deploy a GitHub Pages
├── ADMIN-URLS.md       URLs para administrar sitio, CMS, GitHub, Google y DNS
├── RUNBOOK.md          Operacion, incidentes, rollback y rotacion
└── DEPLOY.md           Pasos para .com / .cl + Strapi Cloud
```

## Dev local

```bash
# Frontend
npm install
npm run dev              # http://localhost:5173

# CMS (en otra terminal)
cd cms
cp .env.example .env     # rellena con secretos aleatorios
npm install
npm run develop          # http://localhost:1337/admin
```

Si el frontend no encuentra el CMS (env `VITE_CMS_URL` no seteado, o CMS caído),
cae a los datos estáticos de `src/data/fallback.js` y el sitio sigue funcionando.

### QA Pixel Streaming

En desarrollo, Etapa 11 permite previsualizar el overlay sin mover la luz:

```bash
npm run dev
# fallback sobre cubo 028.A
http://127.0.0.1:<vite-port>/?streamPreview=028.A

# iframe con mock local que escucha showProject por postMessage
http://127.0.0.1:<vite-port>/?streamPreview=028.A&streamPreviewUrl=http://127.0.0.1:<vite-port>/dev/pixel-stream-mock.html
```

En producción el overlay fallback sólo aparece si Strapi entrega
`pixelStreamingPreviewEnabled` activo en SiteSetting. El iframe real sólo carga
si además `pixelStreamingEnabled` está activo y el Project activo tiene
`unrealEnabled` + una `unrealStreamURL` absoluta (`https://...`).

### Export Claude Design

Los tokens de diseño viven en `src/styles/tokens.css`. Etapa 13 agrega un
export reproducible para Claude Design:

```bash
node scripts/export-claude-design.mjs
```

El comando genera `claude-design-export/` con `tokens.css`, `tokens.json`,
`manifest.json` y `README.md`. GitHub Actions ejecuta el mismo export cuando
cambian los tokens y lo adjunta como artifact; en tags `v*` también lo publica
como asset de GitHub Release.

### Animaciones GSAP

Etapa 14 agrega `gsap` para micro-interacciones del grid 3D:

- entrada secuencial de cubos;
- activación/desactivación con scale + glow;
- popup con contenido fade + slide-up;
- squash/stretch de la luz al saltar, aterrizar y respawnear;
- rebote del contador HUD;
- micro-entrada del preview Pixel Streaming/fallback.

Vite separa GSAP en `assets/gsap-*.js` para que el chunk principal del sitio no
absorba ese peso. El build local de cierre dejó el chunk GSAP en `27.81 kB`
gzip.

### Mini-juego de luz

Etapa 17 convierte la luz controlable en una prueba tipo Pacman enfocada en
desktop/gamepad:

- cuando la luz queda bajo control manual (`W/A/S/D`, flechas o gamepad),
  aparecen esferas pequenas sobre cada cubo oscuro/vacio;
- la recoleccion ocurre por cercania X/Z, sin popup ni click;
- el HUD compacto muestra esferas, cronometro y mejor tiempo local;
- al recolectar todas las esferas, el timer se detiene, la luz brilla dorado
  por 1 segundo y el mejor tiempo queda guardado en `localStorage`;
- si la luz cae o deja de estar controlada, contador/cronometro se reinician y
  las esferas reaparecen en el siguiente run;
- `Admin -> Tweaks -> Juego -> Color luz` permite elegir `Gema cyan`,
  `Gema rojiza` o `Gema verde`, publicable en Strapi como `gameLightColor`.

Etapa 18 mejora la experiencia mobile y suma capa de audio:

- mobile vuelve a usar la misma calidad visual de desktop: cubos redondeados,
  sombras, antialias y bloom/post-processing;
- dos botones muy pequenos quedan disponibles sobre la escena:
  pantalla completa y mute local;
- `src/audio/interactionAudio.js` sintetiza tonos WebAudio sutiles tipo MIDI
  moderno al pasar sobre bloques y en interacciones del juego;
- `Admin -> Tweaks -> Audio` permite publicar en Strapi `audioEnabled`,
  `audioPreset`, `audioMasterVolume`, `audioHoverVolume` y
  `audioInteractionVolume`.

Etapa 19 hace mas descubrible el juego oculto y amplia inputs:

- el HUD compacto suma un boton minimo para tomar o soltar control de la luz;
- el control por gamepad acepta stick izquierdo, D-pad/flechas del pad y boton
  inferior para salto;
- en mobile, la siguiente etapa reemplaza el giroscopio por split-screen touch;
- el modo bloqueado por boton mantiene la luz controlada aunque se mueva el
  mouse, hasta que el jugador vuelva a soltarla.

Etapa 20 reemplaza el input mobile del juego por split-screen touch:

- al pulsar el boton amarillo del HUD aparece una capa tactil inferior,
  invisible salvo feedback minimo;
- la mitad izquierda del espacio inferior crea un joystick dinamico donde el
  jugador toca por primera vez, y mueve la luz con vector X/Z normalizado;
- la mitad derecha dispara salto inmediato en `touchstart`/`pointerdown`,
  soportando saltos multiples tipo Kirby;
- tocar el resto de la pantalla ya no hace saltar la luz, por lo que queda libre
  para inspeccionar cubos o usar UI;
- se implemento sin dependencia externa tipo Nipple.js para mantener bundle y
  comportamiento exactos.

Etapa 22 convierte el mini-juego en sistema de pisos:

- la luz/personaje come una meta configurable de esferas pequenas;
- al completar la meta aparece una escalera luminosa y comienza una transicion
  vertical de camara/mundo;
- el HUD suma `Piso` y reinicia la meta de esferas despues de cada ascenso;
- el piso anterior queda visible en el fondo como `InstancedMesh/Grid Ventana`
  transparente, con escala/opacidad decreciente para profundidad;
- `Admin -> Tweaks -> Juego` permite publicar en Strapi
  `gameAscendSphereGoal`, `gameFloorHeight` y `gameGhostFloors`;
- QA local/produccion: abrir con `?floor-test=...` y usar
  `window.p28FloorDebug.triggerAscension()`.

Etapa 23 hace fisico el loop de escalera/pisos:

- al completar esferas aparece una escalera junto a un cubo aleatorio de la
  orilla de la grilla;
- el ascenso se gatilla cuando la luz llega a la escalera, no al completar la
  meta;
- mientras la escalera esta visible se muestra un preview temporal del proximo
  piso con cubos nuevos, y se elimina al terminar la transicion;
- los pisos impares usan menos cubos aleatorios, siempre con al menos un cubo
  brillante y un cubo normal con esfera; los pares vuelven al layout completo;
- la luz, el respawn, las esferas, hover/click y teclado trabajan solo con el
  piso activo.

### Performance y accesibilidad

Etapa 15 endurece el boot final antes de v1:

- `vite.config.js` separa `three`, `three-addons`, `gsap` y `streaming`.
- Pixel Streaming usa `createLazyStreamOverlay`: el chunk `streaming-*` no se
  descarga si `Preview visible` está apagado y no hay stream válido.
- Mobile ya no baja la calidad de modelos/render: comparte geometría
  redondeada, sombras y bloom con desktop; reduced-motion sigue controlado por
  las timelines de animación.
- Los cubos tienen navegación por teclado: `Tab` recorre proyectos, `Enter`
  abre el popup y `Escape` cierra.
- El panel Tweaks publica `Streaming > Preview visible`, que permite controlar
  cuándo se muestra el fallback/preview del streaming.

Medición de cierre sobre `vite preview`:

- Lighthouse mobile: Performance `80`, Accessibility `100`.
- Lighthouse desktop: Performance `98`, Accessibility `100`.
- Responsive smoke: `320`, `375`, `414`, `768`, `1024`, `1440`, `1920` px sin
  overflow horizontal (`body/html/canvas == innerWidth`).

## Producción

- Frontend → GitHub Pages (custom domains `proyecto28.com` + `proyecto28.cl`)
- CMS → Strapi Cloud (`cms/` como base directory)
- Build automático en cada push a `main`
- Pixel Streaming → infraestructura GPU externa, referenciada desde Strapi

Ver [`DEPLOY.md`](DEPLOY.md), [`RUNBOOK.md`](RUNBOOK.md) y
[`cms/README.md`](cms/README.md) para el detalle.

## Documentación operativa

- [`RUNBOOK.md`](RUNBOOK.md) — smoke tests, incidentes, OAuth, Strapi,
  Pixel Streaming, secretos y rollback.
- [`ADMIN-URLS.md`](ADMIN-URLS.md) — URLs de administracion para sitio, CMS,
  GitHub, Google, DNS y Pixel Streaming.
- [`DEPLOY.md`](DEPLOY.md) — GitHub Pages, Strapi Cloud, OAuth, subdominio
  `stream`, release assets y dominios.
- [`HANDOFF-LATEST.md`](HANDOFF-LATEST.md) — continuidad vigente.
- [`HANDOFF-V2.md`](HANDOFF-V2.md) — handoff final compacto para nuevos agentes.
- [`docs/architecture.png`](docs/architecture.png) — diagrama de arquitectura.
- [`docs/floor-system.md`](docs/floor-system.md) — documento tecnico del
  sistema de pisos, Grid Ventana, camara/profundidad y QA.
- [`docs/demo-script.md`](docs/demo-script.md) — guion de video/release demo.
- [`docs/proyecto28-demo.webm`](docs/proyecto28-demo.webm) — captura tecnica
  reproducible del canvas WebGL.

## Editar contenido

Una vez Strapi Cloud está corriendo, todo el contenido del grid se administra
desde `/admin`:

- **Proyectos** (1 por cubo) — textos, imagen del popup, modelo `.glb`
  flotante, URL de redirección por color.
- **Ajustes del sitio** — logo textual (P28 / NEIT / EST), imagen de logo
  `brandLogoImage`, placement por defecto del popup, estilo de tiles,
  inclinación / rotación / drift de cámara, toggles del HUD (grilla,
  scanlines, viewfinder), juego, Audio, Admin y Pixel Streaming.
- **Admin whitelist** — correos autorizados para abrir Tweaks y publicar
  cambios (`owner` / `editor`). Esta colección queda editable desde Strapi
  Admin y privada para el público.
- **Publish log** — auditoría interna de cada publicación del panel Tweaks.

El usuario final puede sobreescribir todos los ajustes en tiempo real desde
el panel "Tweaks". Los admins autorizados por Google + whitelist pueden usar
`PUBLICAR CAMBIOS` para persistir el snapshot en Strapi `SiteSetting`; si no
publican, los cambios viven sólo en su sesión.

Desde `v0.25.4`, produccion registra un freshness worker (`/p28-sw.js`) para
que la URL limpia `proyecto28.com` pida HTML fresco con cache-buster interno,
aun cuando GitHub Pages/Cloudflare entreguen `Cache-Control: max-age=600`. La
capa de datos mantiene Strapi fuera del worker y reintenta requests con
timeout/cache-buster. Para QA mobile se puede leer
`document.documentElement.dataset.p28ContentSource` y confirmar que vale `cms`.

Desde `v0.25.5`, click/tap/Enter sobre un cubo de proyecto fija el popup y
ancla la luz al centro superior del cubo. Mientras está fijado, mover el mouse,
tocar fuera o presionar Escape no cambia el detalle; la X del popup libera la
selección y devuelve la luz a flotar. Para QA se puede leer
`document.documentElement.dataset.p28PinnedProject`.

Desde `v0.25.6`, click/tap cerca de un cubo brillante tambien puede capturarlo
por radio magnetico antes de fijar el popup. El ajuste vive en
`Admin -> Tweaks -> Juego -> Radio captura popup` y se publica a Strapi como
`gameTileCaptureRadius` (`1.15` recomendado, `0.8..1.8`). Para QA:
`p28TileCaptureMode` queda como `exact` o `magnet`.

Recomendaciones de media visibles en Strapi:

- Logo de marca: PNG o WebP transparente, `512 x 512 px`, zona segura central
  de 80%, menos de `300 KB`.
- Imagen principal de popup: `1600 x 900 px` (`16:9`), minimo
  `1200 x 675 px`, JPG/WebP para foto o PNG si requiere transparencia.
- Mantener textos/logos importantes lejos de los bordes: el frontend usa
  `object-fit: cover` para llenar todo el marco del popup.

## Agregar un proyecto nuevo

1. En Strapi, crear o duplicar un registro en **Project**.
2. Completar `slot`, `projectId`, `title`, `status`, `description`, `tags`,
   `redirectURL`, imagen del popup y/o modelo `.glb`.
3. Si usa Unreal, completar `unrealEnabled`, `unrealStreamURL` y
   `unrealLevelName`.
4. Publicar el registro.
5. Si el stream usa instancia compartida, preparar en Unreal el Level/SubLevel
   que coincida con `unrealLevelName`.
6. Probar en `https://proyecto28.com` y en mobile que no aparezca overflow
   horizontal.

El procedimiento detallado vive en [`RUNBOOK.md`](RUNBOOK.md#3-agregar-un-proyecto-nuevo).

## Cómo contribuir

Este repo sigue un protocolo estricto de versionado documentado en
[VERSIONING.md](VERSIONING.md). Lectura obligatoria antes de tocar código.

Resumen del flujo:

```
1. git checkout -b etapa-N-slug      (nunca trabajar en main)
2. commits atómicos con Conventional Commits
3. push de la rama
4. verificar manualmente la feature
5. merge a main
6. tag v0.N.0 (scripts/release.ps1 o .sh lo automatiza)
7. CHANGELOG.md actualizado
8. HANDOFF-LATEST.md regenerado
9. respaldar handoff en Google Doc como subpestaña bajo `Handoff`
```

GitHub Actions se encarga del deploy automático a GH Pages. Strapi Cloud
hace rebuild automático de `cms/**`. **No hay deploy manual.**

Regla operativa: despues de cada cambio funcional, el repo, `proyecto28.com`,
Strapi Cloud y el handoff deben quedar sincronizados. Un cambio que existe solo
en local no se considera cerrado.

Regla de continuidad: el Google Doc oficial no usa pestañas raíz para cierres.
Cada respaldo debe quedar como subpestaña dentro del tab raíz `Handoff`, con
formato `YYYY-MM-DD HH:mm UTC - vX.Y.Z <slug>`.

El respaldo del Google Doc debe ser un handoff operativo completo, no un
resumen corto. Si queda en 3 páginas y faltan comandos, validaciones,
evidencia, riesgos o próximos pasos, hay que ampliarlo antes de entregar.

El plan completo de evolución vive en `PLAN-PROYECTO28-V2.md`.

### Estado de etapas

| Etapa | Estado | Tag |
|---|---|---|
| Handoff v1 | ✅ Cerrado | `v0.1.0` |
| 1 — Fundación versionado | ✅ Cerrado | `v0.2.0` |
| 2 — Strapi schema extendido | ✅ Cerrado | `v0.3.0` |
| 3 — Frontend data layer | ✅ Cerrado | `v0.4.0` |
| 4 — Luz controlable | ✅ Cerrado | `v0.5.0` |
| 5 — Físicas Kirby (opt-in) | ✅ Cerrado | `v0.6.0` |
| 6 — Cubos + respawn + contador | ✅ Cerrado | `v0.7.0` |
| 6 polish — CCD + spawn + sombra + tweaks juego | ✅ Cerrado | `v0.8.0` |
| 6 polish 2 — sombra anillo + tweak tamaño + flechas + gamepad | ✅ Cerrado | `v0.9.0` |
| 6 polish 3 — defaults persistidos (tilt/yaw/gravity/shadow) | ✅ Cerrado | `v0.9.2` |
| 7 parcial — Tweaks panel oculto + `window.adminMode` gate | ✅ Cerrado | `v0.10.0` |
| 7 cierre — sliders restantes + persistencia localStorage | ✅ Cerrado | `v0.11.0` |
| 8 — Botón Admin bajo brand-meta | ✅ Cerrado | `v0.12.0` |
| 9 — Google OAuth + whitelist gating | ✅ Cerrado | `v0.13.0` |
| 10 — Popup robusto + mobile responsive + touch | ✅ Cerrado | `v0.14.0` |
| 10 hotfix — Admin pill + cámara mobile + popup overflow | ✅ Cerrado | `v0.14.2` |
| 10 hotfix — Responsive root cause iPhone/iPad | ✅ Cerrado | `v0.14.6` |
| 10 docs — Handoff completo Google Doc | ✅ Cerrado | `v0.14.7` |
| 11 — Pixel Streaming Unreal | ✅ Cerrado — overlay iframe/fallback | `v0.15.0` |
| 12 — Pipeline Publicar | ✅ Cerrado — Tweaks → Strapi + audit log | `v0.16.0` |
| 12 hotfix — Publish Google token | ✅ Cerrado — accessToken/idToken robusto | `v0.16.1` |
| 13 — Sync Claude Design | ✅ Cerrado — export tokens + auto-tag | `v0.17.0` |
| 13 hotfix — Release asset auto-tag | ✅ Cerrado — export zip en GitHub Release | `v0.17.1` |
| 14 — GSAP polish | ✅ Cerrado — timelines + polish premium | `v0.18.0` |
| 15 — Performance + a11y | ✅ Cerrado — Lighthouse + responsive + teclado | `v0.19.0` |
| 16 — Documentación final | ✅ Cerrado — runbook + handoff V2 + assets | `v0.20.0` |
| 17 — Pacman de luz + color admin | ✅ Cerrado — esferas, timer, best time y Strapi `gameLightColor` | `v0.21.0` |
| 18 — Mobile parity + audio interactivo | ✅ Cerrado — calidad desktop en mobile, fullscreen/mute y audio Strapi | `v0.22.0` |
| 19 — Control discoverable + gyro/gamepad | ✅ Cerrado — boton HUD, D-pad y giroscopio mobile | `v0.23.0` |
| 20 — Split-screen touch joystick | ✅ Cerrado — joystick dinamico izquierdo y salto derecho mobile | `v0.24.0` |
| 21 — Loader + logo CMS + freshness mobile | ✅ Cerrado — progreso sutil, Strapi no-store/cache-buster, logo media y pixel hints | `v0.25.0` |
| 21 hotfix — Loader 1/28 + CMS mobile hardening | ✅ Cerrado — mensaje `Cargando proyecto N/28`, runtime CMS fallback y QA `Random: Museo MAC` | `v0.25.1` |
| 21 hotfix 2 — Fresh navigation + popup images mobile | ✅ Cerrado — Service Worker network-first, Strapi fuera del worker e imagenes popup estables | `v0.25.4` |
| 21 hotfix 3 — Pinned popup + light anchor | ✅ Cerrado — click/tap fija popup y luz hasta cerrar con X | `v0.25.5` |
| 21 hotfix 4 — Magnetic popup capture radius | ✅ Cerrado — tap/click cercano captura cubo y fija popup + luz | `v0.25.6` |
