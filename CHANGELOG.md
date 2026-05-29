# Changelog

Todos los cambios notables de Proyecto 28 se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este
proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

Cada entrada corresponde a una **etapa** del [PLAN-PROYECTO28-V2.md](../PLAN-PROYECTO28-V2.md)
o a un fix puntual entre etapas.

## [Unreleased]

Sin cambios todavía.

## [0.19.0] — 2026-05-29 — Etapa 15: Performance + responsive + a11y

### Added
- Navegación accesible por teclado para los 6 cubos del grid mediante
  controles DOM espejo: foco visible, `Enter` abre el popup y `Escape` cierra.
- Roles/labels ARIA para canvas, popup, overlay de ruta, feedback del panel
  Tweaks y controles del panel.
- SEO base: canonical, OpenGraph, Twitter cards, `robots.txt` y `sitemap.xml`.

### Changed
- `vite.config.js` separa chunks `three`, `three-addons`, `gsap` y
  `streaming`, y evita preloads iniciales de `streaming-*`/`three-addons-*`.
- Pixel Streaming ahora carga su overlay/iframe de forma diferida con
  `createLazyStreamOverlay`; si `Preview visible` está apagado y no hay stream
  válido, no monta overlay ni descarga el chunk `streaming-*`.
- En viewports móviles o `prefers-reduced-motion`, la escena usa geometría
  simple, pixel ratio acotado, sin sombras caras y sin bloom/post-processing.
  Desktop mantiene rounded cubes + bloom.
- El fallback de Pixel Streaming recupera placeholder si el iframe falla o no
  responde a tiempo, y puede volver a estado `Live` si el iframe carga tarde.
- `PUBLICAR CAMBIOS` ahora reintenta una vez con sesión Google fresca cuando
  Strapi responde token Google inválido, y muestra mensajes claros en español.
- Popup images mantienen lazy/async decode y agregan `fetchPriority=low` +
  `sizes`.

### Verified
- `npm run build` OK.
- Build final:
  - `assets/index-DzLC3Syc.js` `54.19 kB` / `19.64 kB` gzip.
  - `assets/streaming-DWwWXc9J.js` `6.16 kB` / `2.54 kB` gzip.
  - `assets/three-addons-hfx1tmN4.js` `65.32 kB` / `17.93 kB` gzip.
  - `assets/gsap-CzGW6FVa.js` `70.46 kB` / `27.81 kB` gzip.
  - `assets/three-CdxnkpeF.js` `530.20 kB` / `134.12 kB` gzip.
- Lighthouse sobre `vite preview`:
  - Mobile: Performance `80`, Accessibility `100`.
  - Desktop: Performance `98`, Accessibility `100`.
- Responsive smoke con Chrome headless/CDP sobre build producción:
  - `320x568`, `375x812`, `414x896`, `768x1024`, `1024x768`,
    `1440x900`, `1920x1080`: `body/html/canvas == innerWidth`.
  - `320/375/414`: no se cargan chunks `streaming-*` ni `three-addons-*`
    durante el boot normal.
- Browser local:
  - sin preview, `streamOverlayLoaded=false`.
  - con `?streamPreview=028.A`, fallback visible y sin overflow.
  - `Enter` sobre cubo accesible abre popup `Holograma`; `Escape` lo cierra.
- Strapi/producción:
  - `/api/projects?populate=*` => `200`
  - `/api/admin-whitelists` => `403`
  - `/api/site-setting` => `200`
  - `/api/auth/check?email=inconcha@gmail.com` =>
    `{ allowed:true, role:"owner" }`
  - `/api/auth/check?email=yk8arts@gmail.com` =>
    `{ allowed:true, role:"editor" }`
  - `/api/publish` sin token => `401`
  - `https://proyecto28.com` => `200`
- GitHub Pages run `26631677133` OK para `18515bb`.
- Producción post-deploy:
  - `https://proyecto28.com` => `200`
  - `https://proyecto28.com/robots.txt` => `200`
  - `https://proyecto28.com/sitemap.xml` => `200`
  - bundle principal `assets/index-CD085i8n.js`.
- Smoke CDP sobre `https://proyecto28.com`:
  - phone `390x844`, iPad portrait `810x1080` y desktop `1440x900`:
    `body/html/canvas == innerWidth`.
  - boot normal no carga `streaming-*`; `three-addons-*` queda fuera de mobile.

## [0.18.0] — 2026-05-29 — Etapa 14: GSAP polish + animaciones premium

### Added
- Nueva dependencia `gsap@3.15.0`.
- Nuevo módulo `src/animations/timelines.js` con timelines reutilizables:
  `entranceTimeline`, `cubeActivateTimeline`, `cubeDeactivateTimeline`,
  `popupEnterTimeline`, `popupExitTimeline`, `lightSquashTimeline`,
  `lightFallTimeline`, `hudCounterTimeline` y `streamOverlayEnterTimeline`.
- Entrada secuencial del grid al cargar la escena.
- Feedback GSAP de activación/desactivación de cubos: elevación, escala y glow.
- Feedback de salto/aterrizaje/respawn de la luz controlable con squash &
  stretch.
- Rebote GSAP del contador `Luces caídas`.
- Micro-entrada del overlay Pixel Streaming/fallback cuando aparece sobre un
  cubo activo.

### Changed
- El popup mantiene sus placements existentes, pero su contenido ahora entra y
  sale con fade + slide-up orquestado por GSAP.
- El loop principal deja de hacer `lerp` manual para lift/glow de cubos activos
  y delega esos cambios a timelines por transición de estado.
- `vite.config.js` separa GSAP en chunk propio (`assets/gsap-*.js`) para
  mantener el bundle principal estable.

### Verified
- `npm run build` OK.
- Baseline pre-GSAP: `assets/index-D1o2Ydeg.js` `643.59 kB` / `169.43 kB`
  gzip.
- Build con GSAP separado: `assets/index-Cii4NAQW.js` `646.63 kB` /
  `170.33 kB` gzip y `assets/gsap-CzGW6FVa.js` `70.46 kB` / `27.81 kB` gzip.
- Crecimiento del chunk principal: `+3.04 kB` bruto / `+0.90 kB` gzip.
  Carga GSAP aislada: `27.81 kB` gzip, bajo el margen de 50KB gzip definido en
  la etapa.
- Browser local `http://127.0.0.1:5173/?stage14=1`: sin errores/warnings de
  consola.
- Smoke hover desktop: popup visible en cubo `028.C`, `body/html/canvas =
  1280`, sin overflow horizontal.
- Smoke responsive local:
  - phone `390x844`: `body=390`, `html=390`, `canvas=390`.
  - tablet portrait `810x1080`: `body=810`, `html=810`, `canvas=810`.
- GitHub Pages run `26629020837` OK para `f84a391`.
- Auto-tag run `26629020874` OK; creó `v0.18.0`.
- GitHub Release `v0.18.0` contiene `claude-design-export.zip`.
- Producción `https://proyecto28.com` responde `200` y sirve
  `assets/index-CXlJ-Gn6.js` + `assets/gsap-CzGW6FVa.js`.
- Smoke producción:
  - desktop `1280`: `body=1280`, `html=1280`, `canvas=1280`, sin errores de
    consola.
  - phone `390x844`: `body=390`, `html=390`, `canvas=390`.
  - tablet portrait `810x1080`: `body=810`, `html=810`, `canvas=810`.
- Strapi post-deploy:
  - `/api/projects?populate=*` => `200`
  - `/api/admin-whitelists` => `403`
  - `/api/site-setting` => `200`
  - `/api/auth/check?email=inconcha@gmail.com` => `200`
  - `/api/auth/check?email=yk8arts@gmail.com` => `200`

## [0.17.1] — 2026-05-29 — Hotfix CI: release asset en auto-tag

### Fixed
- `auto-tag.yml` ahora genera el paquete `claude-design-export.zip` y lo adjunta
  a la GitHub Release que crea junto al tag automático. Esto evita depender de
  un segundo workflow disparado por el tag creado con `GITHUB_TOKEN`.

### Verified
- Auto-tag run `26626485820` OK para `fcb488a`; creó `v0.17.1`.
- GitHub Release `v0.17.1` contiene `claude-design-export.zip`.
- GitHub Pages run `26626485864` OK para `fcb488a`.

## [0.17.0] — 2026-05-29 — Etapa 13: Sync Claude Design + GitHub

### Added
- Nuevo workflow `.github/workflows/sync-design.yml` para exportar el paquete
  portable `claude-design-export` cuando cambian los tokens de diseño o cuando
  se publica un tag `v*`.
- Nuevo script `scripts/export-claude-design.mjs`:
  - lee `src/styles/tokens.css`;
  - extrae 96 custom properties desde `:root`;
  - genera `tokens.css`, `tokens.json`, `manifest.json` y `README.md`;
  - no requiere dependencias externas.
- Nuevo workflow `.github/workflows/auto-tag.yml`:
  - en `main`, commits `feat:` crean el siguiente minor `v0.X.0`;
  - commits `fix:` crean el siguiente patch;
  - commits `docs:`/`chore:` y commits con `[skip-tag]` no taguean.

### Changed
- `deploy.yml` elimina el job placeholder `sync-claude-design`; la sincronización
  real vive ahora en `sync-design.yml`.
- `VERSIONING.md` documenta el nuevo flujo de export de Claude Design y auto-tag.

### Verified
- `node scripts/export-claude-design.mjs` OK; export local con 96 tokens.
- `tokens.json` parsea correctamente y conserva `bg-0` → `bg-radial-copper`.
- Sync Claude Design run `26626392558` OK; artifact `claude-design-export`
  creado con id `7286242271`.
- Auto-tag run `26626392562` OK; creó `v0.17.0` desde `ec9355d`.
- GitHub Pages run `26626392593` OK para `ec9355d`.

## [0.16.1] — 2026-05-26 — Hotfix: publish Google token

### Fixed
- `PUBLICAR CAMBIOS` ya no prioriza un `idToken` legacy cuando existe o puede
  renovarse un `accessToken` del flujo OAuth explícito.
- Strapi `/api/publish` ya no decide el tipo de token con `includes('.')`;
  detecta JWT real por header base64url y prueba `id_token`/`access_token` en
  orden seguro antes de rechazar.
- Corrige el error reportado en producción por el owner:
  `Invalid Google id_token` al publicar desde Tweaks.

### Verified
- `npm run build` OK.
- `npm run build` en `cms/` OK.
- `cms/src/api/site-setting/controllers/site-setting.js` carga por `require()`.
- GitHub Pages run `26433985069` OK para `8465330`.
- `https://proyecto28.com` sirve bundle `assets/index-CSh7zWl1.js` con
  `/api/publish`, `initTokenClient` y el refresh de token Google.
- Strapi Cloud `/api/publish` ejecuta la nueva validación: con token falso
  punteado responde `Invalid Google token (Invalid Google access_token /
  Invalid Google id_token)`.
- Whitelist Strapi:
  - `/api/auth/check?email=inconcha@gmail.com` => `allowed:true`, `role:owner`
  - `/api/auth/check?email=yk8arts@gmail.com` => `allowed:true`, `role:editor`
- `Admin whitelist` queda privado por API pública (`403`) y editable desde
  Strapi Content Manager (`content-manager.visible:true`).

## [0.16.0] — 2026-05-25 — Etapa 12: Pipeline Publicar Tweaks → Strapi

### Added
- **Etapa 12 / Publicar cambios desde Tweaks**:
  - Nuevo botón `PUBLICAR CAMBIOS` dentro del panel Tweaks, visible cuando el
    admin abre el panel. Incluye estado de carga y feedback success/error.
  - Nuevo cliente frontend `src/admin/publish.js`, que envía snapshot +
    diff de los tweaks actuales a Strapi.
  - Nuevo endpoint Strapi `POST /api/publish`, con allow-list de campos,
    validación de rangos/enums y actualización del singleton SiteSetting.
  - Verificación server-side del token Google contra Google + whitelist
    `AdminWhitelist`. El endpoint acepta `id_token` y `access_token` del flujo
    explícito OAuth (`openid email profile`).
  - Nuevo content type `PublishLog` para auditoría interna de publicaciones:
    email, rol, diff, campos omitidos, estado y resultado del webhook.
  - Webhook Discord opcional vía `DISCORD_WEBHOOK_URL`; si no está configurado
    la publicación no falla.

### Changed
- El login admin dejó de depender sólo de One Tap/FedCM. El botón Admin usa un
  flujo OAuth explícito con selector de cuenta, más confiable para clicks reales.
- El select `Curva de salto` ahora sólo ofrece valores aceptados por Strapi:
  `kirby`, `linear`, `easeOut`, `easeInOut`.
- El schema SiteSetting ahora persiste todos los tweaks visibles del juego:
  `defaultGravityEnabled` y `gameShadowSize` se agregan al CMS.
- El panel Tweaks limpia valores legacy de selects/radios guardados en
  `localStorage` si ya no existen en el schema actual.
- `cms/.env.example` documenta `GOOGLE_CLIENT_ID` y el webhook opcional de
  Discord.

### Verified
- `npm run build` OK.
- `npm run build` en `cms/` OK.
- Smoke local:
  - Panel Tweaks abre desde botón Admin sin `VITE_GOOGLE_CLIENT_ID` local.
  - `PUBLICAR CAMBIOS` aparece.
  - El select de curva ya no incluye `constant`.
  - Sin sesión/CMS local configurado, el botón muestra error controlado.
- Strapi local:
  - `/api/site-setting` => `200`
  - `/api/publish` sin token => `401`
  - `/api/auth/check?email=inconcha@gmail.com` => `allowed:true`, `role:owner`
  - `/api/auth/check?email=yk8arts@gmail.com` => `allowed:true`, `role:editor`
  - `/api/publish-logs` => `403` público/privado correcto
  - `/api/admin-whitelists` => `403` público/privado correcto
- GitHub Pages:
  - Run `26425130576` OK para `e8c3f74`.
  - Run `26425439630` OK para `c0590e4`.
  - `https://proyecto28.com` sirve bundle con `PUBLICAR CAMBIOS`,
    `/api/publish`, `Preview visible` e `initTokenClient`.
- Strapi Cloud:
  - Rebuild propagado después del push; `/api/publish` cambió de `405` a
    `401` sin token, confirmando ruta custom activa.
  - `/api/projects?populate=*` => `200`
  - `/api/site-setting` => `200`
  - SiteSetting producción: `pixelStreamingPreviewEnabled:false`,
    `pixelStreamingEnabled:false`, `defaultGravityEnabled:true`,
    `gameShadowSize:0.3`, `gameLightVelocityCurve:kirby`
  - `/api/admin-whitelists` => `403` público/privado correcto
  - `/api/auth/check?email=inconcha@gmail.com` => `allowed:true`, `role:owner`
  - `/api/auth/check?email=yk8arts@gmail.com` => `allowed:true`, `role:editor`
  - `/api/auth/check?email=cnignacioa@gmail.com` => `allowed:true`,
    `role:owner`
  - Preflight CORS `OPTIONS /api/publish` con
    `Origin: https://proyecto28.com` => `204`,
    `access-control-allow-origin: https://proyecto28.com`
- Límite de validación: desde Chrome automatizado no se completó el popup
  OAuth real sin intervención humana. El frontend, backend, CORS, whitelist,
  schema y estados de producción quedaron verificados; el publish con token
  real debe confirmarlo el owner con click manual en `proyecto28.com`.

## [0.15.0] — 2026-05-25 — Etapa 11: Pixel Streaming iframe/fallback

### Added
- **Etapa 11 / Pixel Streaming inicial**:
  - Nuevo módulo `src/streaming/pixelStream.js` para montar un iframe sólo
    cuando el proyecto tiene `unrealEnabled`, URL absoluta válida y el master
    switch `pixelStreamingEnabled` está activo.
  - Nuevo módulo `src/streaming/streamOverlay.js` para proyectar un overlay
    HTML desde el cubo activo de la luz a coordenadas de pantalla.
  - Fallback visual local sobre el cubo activo cuando Pixel Streaming está
    apagado, falta URL o el cubo no tiene stream habilitado. El fallback usa
    `videoLoop`, imagen del popup/imagen del proyecto o una tarjeta procedural.
  - Helper local de QA en dev: `?streamPreview=028.A` muestra el fallback del
    overlay sin tener que mover la luz manualmente.
  - Helper local de iframe: `?streamPreview=028.A&streamPreviewUrl=<url>`
    fuerza el modo iframe en dev, activa temporalmente streaming y permite
    probar `postMessage` antes de tener Unreal disponible.
  - Mock local `public/dev/pixel-stream-mock.html` para validar que el iframe
    recibe el comando `showProject`.
  - Nuevo campo Strapi `pixelStreamingPreviewEnabled` en SiteSetting para
    mostrar u ocultar el preview/fallback desde el CMS.

### Changed
- El toggle Streaming del panel de tweaks ahora afecta al overlay en vivo.
- El nuevo tweak **Preview visible** controla si aparece el fallback del stream
  cuando no hay URL real o el stream global está apagado. Por defecto queda
  apagado para producción.
- `streamingMode` se normaliza a `shared` / `per-cube`; el valor legacy
  `dedicated` se interpreta como `per-cube`.

### Fixed
- Strapi CORS ahora permite explicitamente `proyecto28.com`, variantes `www`,
  `proyecto28.cl`, GitHub Pages y localhost/127.0.0.1 para QA. Antes la config
  `origin:['*']` no matcheaba origins reales en Strapi 5 y produccion caia al
  fallback por bloqueo CORS del navegador.

### Verified
- `npm run build` OK.
- Preview local fallback en `http://127.0.0.1:5174/?streamPreview=028.A`:
  overlay `fallback`, sin `iframe.src`, sin errores de consola.
- Carga normal local sin `streamPreview`: overlay oculto por default.
- Preview local iframe con
  `?streamPreview=028.A&streamPreviewUrl=http://127.0.0.1:5174/dev/pixel-stream-mock.html`:
  overlay `stream`, iframe cargado y mock recibe `showProject`.
- Responsive local con overlay activo:
  - phone `390x844`: `html=390`, `body=390`, `canvas=390`.
  - tablet portrait `810x1080`: `html=810`, `body=810`, `canvas=810`.
- `npm run build` OK y `npm run build` en `cms/` OK.
- Commit final de cierre en `main`: `f5b0c42`.
- GitHub Actions Pages run `26376864785` OK (`success`) para `68130ee`.
  `f5b0c42` no dispara Pages porque el workflow ignora `cms/**` y docs; el
  bundle publico no cambio despues de `68130ee`.
- `https://proyecto28.com` OK. Producción sirve bundle con overlay creado y
  oculto por default; `window.p28StreamDebug` no existe en producción.
- Responsive producción:
  - phone `390x844`: `html=390`, `body=390`, `canvas=390`, overlay oculto.
  - tablet portrait `810x1080`: `html=810`, `body=810`, `canvas=810`,
    overlay oculto.
- Strapi Cloud:
  - `/api/projects?populate=*` => `200`
  - `/api/site-setting` => `200`, incluye `pixelStreamingPreviewEnabled:false`
  - `/api/admin-whitelists` => `403` público/privado correcto
  - `/api/auth/check?email=inconcha@gmail.com` => `allowed:true`, `role:owner`
  - `/api/auth/check?email=yk8arts@gmail.com` => `allowed:true`, `role:editor`
  - CORS con `Origin: https://proyecto28.com` devuelve
    `access-control-allow-origin: https://proyecto28.com` despues del redeploy
    Strapi.
- Browser production post-CORS: `/api/projects` y `/api/site-setting` cargan
  `200` desde `proyecto28.com`, sin errores/warnings de consola.

## [0.14.7] — 2026-05-24 — Docs: handoff completo Google Doc

Release documental. No cambia código de producción; el último código funcional
sigue siendo `v0.14.6`.

### Fixed
- Google Doc backup corregido dos veces:
  - La pestaña de cierre dejó de estar en la raíz y quedó como subpestaña bajo
    `Handoff`.
  - El primer respaldo era demasiado compacto (aprox. 3 páginas) para servir
    como handoff operativo. Se amplió la subpestaña vigente con un anexo
    completo para que el siguiente agente pueda continuar sin reconstruir
    contexto.

### Documentation
- `HANDOFF-LATEST.md`, `VERSIONING.md`, `README.md` y
  `PLAN-PROYECTO28-V2.md` aclaran que los respaldos del Google Doc deben
  crearse/moverse siempre bajo `Handoff`, nunca como pestañas raíz.
- La subpestaña vigente del Google Doc quedó como:
  `2026-05-24 20:40 UTC - v0.14.7 handoff completo`.
- El contenido ampliado incluye estado actual, comandos de entrada,
  verificación de servicios, diagnóstico responsive, evidencia de cierre,
  plan de Etapa 11, riesgos activos y regla explícita contra respaldos
  resumidos de 3 páginas.

## [0.14.6] — 2026-05-24 — Hotfix: responsive root cause confirmado

Fix confirmado por el owner en device real: el sitio "se arreglo muy
bien". Se desbloquea Etapa 11 después de este cierre.

### Fixed
- **Causa raíz del overflow responsive**: producción mostraba
  `document.documentElement.scrollWidth > window.innerWidth` en
  phone/tablet. El culpable era `.scene-bg-grid` con `inset: -10%`,
  que ensanchaba el documento (`390px → 429px` en phone,
  `810px → 891px` en iPad portrait) antes del render Three.js.
- **`src/styles/three-host.css`**:
  - `html, body` ahora cierran el layout a `100vw`/`max-width:100vw`
    con `overflow:hidden`.
  - `#c`, `#boot`, `.chrome`, `.route-overlay`, `.scene-bg-vignette`
    y `.scene-bg-scanlines` usan las vars `--p28-vv-*` para cubrir
    el visual viewport real.
  - `.scene-bg-grid` queda `position: fixed; inset: 0` y escala con
    `transform: scale(1.2)` para conservar el margen visual sin
    modificar el `scrollWidth` del documento.
  - `#popup` base usa `box-sizing:border-box` y `max-width`; en
    mobile vuelve a `max-width:100vw`.
- **`index.html`**: script temprano sincroniza `window.visualViewport`
  con CSS vars (`--p28-vv-left/top/width/height`) antes del boot.
- **`src/scene/scene.js`**:
  - `getViewportSize()` ahora existe antes de construir renderer,
    cámara y bloom.
  - `renderer.setSize(w, h, false)` evita escribir estilos inline
    sobre el canvas.
  - Cámara portrait ajustada para usar más ancho sin cortar cubos:
    phone `fov 56 / radius 24`, tablet portrait `fov 48 / radius 22`.

### Verified
- `npm run build` OK.
- GitHub Actions deploy a Pages OK.
- Smoke en producción `https://proyecto28.com` OK.
- Métricas de producción:
  - phone `390x844`: `html=390`, `body=390`, `canvas=390`.
  - tablet portrait `810x1080`: `html=810`, `canvas=810`.
  - landscape `1024x768`: `html=1024`, `canvas=1024`.
- Confirmación owner posterior a deploy: "se arreglo muy bien".

## [0.14.4] — 2026-05-23 — Hotfix: cámara + canvas adaptive por aspect-ratio

Feedback owner: en iPad portrait (810-1180px) la cámara seguía cerca
porque no caía en el media query `max-width:768px`. Y al hacer pinch
zoom Safari aparecían franjas negras (canvas no se readjustaba).

### Fixed
- **`src/scene/scene.js`**: `computeCamFov()` y `computeCamRadius()`
  ahora son funciones del **aspect ratio** (no del width):
  - aspect <0.7 → fov 58 / radius 28 (phone portrait estrecho)
  - aspect <0.95 → fov 50 / radius 24 (tablet portrait, iPad)
  - aspect <1.4 → fov 42 / radius 19 (square/laptop)
  - aspect ≥1.4 → fov 34 / radius 15 (desktop wide)
- **`getViewportSize()`** nuevo helper lee `window.visualViewport`
  (cuando está disponible) en lugar de `innerWidth/Height`. Capta
  pinch zoom, virtual keyboard y URL bar collapse de iOS Safari.
- **Resize listeners**: `resize`, `orientationchange`,
  `visualViewport.resize`, `visualViewport.scroll`. Más
  `setTimeout(handleResize, 200)` para re-corregir tras carga
  inicial (mobile reporta `innerHeight` chico hasta que la URL bar
  se asienta).
- **CSS media queries**: `@media (max-width: 768px)` →
  `@media (max-width: 1024px), (pointer: coarse), (max-aspect-ratio: 1/1)`.
  Captura iPad portrait + touch devices + cualquier portrait.
  Aplicado a `app.css` y `hud.js`.
- **`index.html`**: meta viewport con `viewport-fit=cover` (notch
  iPhone) y `theme-color #000`.
- **`three-host.css`**:
  - `html/body margin:0 padding:0 100%`, `overscroll-behavior: none`
    (sin rubber-band horizontal en iOS).
  - `#c` con `!important` en width/height/position/inset para
    sobrescribir los `style.width/height` inline que
    `WebGLRenderer.setSize` escribe en el canvas.
  - `height: 100dvh` (dynamic viewport) además de `100vh` para que
    la URL bar de iOS no genere franja negra.
  - `background: #000` en el canvas como red de seguridad.

## [0.14.3] — 2026-05-23 — Hotfix: ocultar viewfinder en mobile

### Fixed
- **Viewfinder con frame que no llega al borde**: el `.viewfinder`
  (4 esquinas HUD con `inset: 80px 32px 80px`) generaba un "recuadro
  decorativo" dentro del viewport mobile que el owner reportó como
  visualmente molesto. Media query mobile en `src/styles/app.css`
  ahora hace `.viewfinder { display: none !important; }` para
  sobrescribir el toggle JS (`applyHudVisibility`). En desktop sigue
  controlable por el panel.

## [0.14.2] — 2026-05-23 — Hotfix mobile UX

Feedback del owner sobre `v0.14.0` en iOS Safari real:

### Fixed
- **Botón ADMIN tapado** por el pill `WEBGL · THREE.JS` (que no tenía
  función): `src/ui/adminButton.js` ahora **reemplaza** al `.engine-pill`
  via `parentNode.replaceChild`. Estilo coherente (pill cyan + dot
  indicador + glass bg). Fallback a `.brand` si no hay pill. El click
  ahora dispara el flujo Google Sign-In normalmente — el Client ID
  ya estaba embebido en el bundle (`grep 644563573486` lo confirma).
- **HUD `LUCES CAÍDAS` solapaba el status**: `src/ui/hud.js` media
  query mobile mueve el HUD a `bottom: 100px; right: 12px`, padding
  y font reducidos, letter-spacing menor.
- **Cámara muy cerca en mobile** (cubos del borde fuera del viewport):
  `src/scene/scene.js` ahora calcula FOV y radius con
  `computeCamFov() = 48° en <768px (vs 34°)` y `computeCamRadius() =
  22 (vs 15)`. El listener `resize` recalcula y llama
  `setCameraFromState`, así rota portrait/landscape sin reload.
- **Popup mobile con "franja oscura" lateral + close × saliendo del
  viewport**: `src/styles/app.css` popup media query:
  - `box-sizing: border-box` (el padding desbordaba el width:100%).
  - `max-width: 100vw` + `overflow-x: hidden` (no escape lateral).
  - `background: rgba(5,8,16,0.96)` sólido + `backdrop-filter: none`
    (eliminamos el blur — el owner lo describió como "filtro oscuro").
  - `.btn-ghost` con `flex: 0 0 auto; width: 38px; height: 38px`
    para que el close no se aplaste ni desborde.

### Notes
- `.admin-btn` mobile actualizado a `padding: 6px 10px; font: 10px`
  para vivir en línea con el flex del `.status-cluster` (antes era
  `position: absolute`).
- Bundle: JS 632.22 → **632.82 KB** (+0.6 KB). CSS 21.71 → **21.98 KB**
  (+0.3 KB).

## [0.14.0] — 2026-05-23 — Etapa 10: popup robusto + mobile responsive + touch handling

### Added
- **`src/styles/app.css`** — `.popup-image-wrap` con `aspect-ratio:
  16/9`, overflow hidden, border-radius. Imagen con `opacity 0→1`
  cuando `.loaded`. Border cyan semi.
- **Media query mobile** (`@media (max-width: 768px), (pointer:
  coarse)`):
  - `.chrome-top` en columna, brand colapsado, status cluster en
    segunda fila.
  - `.admin-btn` más compacto (3×8px, font 9px).
  - `.chrome-bottom` oculta engine + módulo (sólo Lat+Lon).
  - **Popup full-width bottom sheet**: anula `side/cursor/corner`,
    `left:0; right:0; bottom:0; max-height:65vh`, slide-up
    `translateY(100% → 0)`.
  - Tweaks panel full-width modal con margen 8px.

### Changed
- **`src/ui/popup.js`** — imageURL ahora: `loading="lazy"`,
  `decoding="async"`, `onload` marca `wrap.loaded` para fade-in,
  `onerror` oculta wrap + marca `.failed`. Limpia handlers cuando
  el siguiente proyecto no tiene imagen.
- **`src/main.js`** — touch handling vía `pointerdown`/`pointerup`:
  - Captura `startXY` + `pointerType` en down.
  - En up, si delta < 8px se considera tap.
  - **Touch**: primer tap muestra popup (como hover), segundo tap
    sobre el mismo `tile.id` dentro de 500ms navega. Tap fuera de
    cubo cierra popup.
  - **Mouse/pen**: tap = navegación inmediata (no regresión).
  - Antes, `pointerdown` directamente navegaba — eliminado.

### Notes
- Decisión: animaciones via **CSS transitions** (no GSAP). Si en
  futuro se quiere algo más coreografiado, GSAP queda para Etapa
  14 sin migrar lo actual.
- Smoke test producción desktop OK (popup HOLOGRAMA aparece al
  hover, ADMIN sigue funcional). Mobile testing visual queda al
  owner via dispositivo real — Chrome MCP `resize_window` no
  afecta el viewport interno.
- Bundle: JS 631.48 → **632.22 KB** (+0.7 KB). CSS 19.98 → **21.71
  KB** (+1.7 KB).

## [0.13.0] — 2026-05-23 — Etapa 9: Google OAuth + whitelist gating

### Added
- **`src/auth/google.js`** (nuevo): wrapper de Google Identity
  Services. Lazy load del script `https://accounts.google.com/gsi/client`,
  `initGoogleAuth({ clientId })` idempotente que llama
  `initialize({ use_fedcm_for_prompt: true })`, `signIn()` que
  dispara `prompt()` (FedCM/One Tap), `getCurrentUser()` lee cache
  `localStorage['p28-auth']` validado contra `exp` del JWT,
  `signOut()` limpia state local.
- **`src/auth/whitelist.js`** (nuevo): `checkWhitelist(email)` fetch
  a `/api/auth/check` del CMS. Retorna `{ allowed, role? }`. Falla
  silenciosa devuelve `{ allowed: false }`.
- **`cms/src/api/admin-whitelist/routes/01-auth-check.js`** (nuevo):
  ruta custom `GET /api/auth/check?email=...` con `auth: false`.
- **`cms/src/api/admin-whitelist/controllers/admin-whitelist.js`** —
  método `check(ctx)`: valida formato email, queryea por email en
  la collection, retorna `{ allowed: boolean, role?: string }`. NO
  expone la lista completa.

### Changed
- **`src/main.js`**: importa `initGoogleAuth` + helpers; al boot,
  si `VITE_GOOGLE_CLIENT_ID` está seteado inicializa GIS lazy. El
  `onActivate` del `adminButton` ahora es `handleAdminActivate`:
  - User cacheado → `tweaks.show()` inmediato.
  - Sin client ID (dev local) → bypass, abre panel directo.
  - Sin cache + con client ID → `signIn()` → `checkWhitelist()` →
    si `allowed` abre panel; si no `signOut()` + `alert("Acceso
    denegado: …")`.
  - `window.adminMode = true` sigue funcionando como fallback QA.
  - `window.p28SignOut()` expuesto para QA.
- **`cms/src/index.js`** — `seedIfEmpty()` ahora hace **upsert por
  email** para `AdminWhitelist` (antes seed sólo si tabla vacía).
  Agrega `cnignacioa@gmail.com` como `owner` alterno (además de
  `inconcha@gmail.com`).
- **`.github/workflows/deploy.yml`** — step build recibe
  `VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}`
  además del `VITE_CMS_URL` ya existente.

### Notes
- **Pre-requisitos resueltos en esta sesión** (no en este commit):
  OAuth Client ID `644563573486-…apps.googleusercontent.com` creado
  en Google Cloud (project `spartan-grail-401816`); 3 emails como
  test users en OAuth consent screen
  (`inconcha@gmail.com`, `cnignacioa@gmail.com`, `yk8arts@gmail.com`);
  secret `VITE_GOOGLE_CLIENT_ID` agregado al repo en GitHub Actions
  Secrets.
- El consent screen está en modo **Testing** (no publicado): sólo
  los test users pueden completar OAuth. Si se agrega un email
  nuevo a `AdminWhitelist`, también hay que agregarlo como test
  user en GCP (o publicar la app).
- Bundle: 630.75 → **631.48 KB** (+0.7 KB). 32 módulos (antes 30).

## [0.12.0] — 2026-05-23 — Etapa 8: botón Admin bajo brand-meta

### Added
- **`src/ui/adminButton.js`** (nuevo): `mountAdminButton({ onActivate,
  visible })` crea un `<button class="admin-btn">` con
  `position:absolute` anclado bajo `.brand` (top: 100% + 6px, left:
  48px para alinear con `.brand-name`). Estilo mono uppercase 10px,
  border cyan semi-transparente, hover intensifica. Inyecta CSS
  scoped al primer mount. Expone `setVisible(bool)` y `destroy()`.

### Changed
- **`src/main.js`** — importa `mountAdminButton`, lo monta tras
  `mountTweaks` con `onActivate: () => tweaks.show()`. El `onChange`
  del panel ahora llama `adminButton.setVisible(state.adminButtonVisible)`
  para sincronizar la visibilidad en vivo. `let adminButton = null`
  declarado antes de `mountTweaks` para que el closure del `onChange`
  pueda referenciarlo (chequea `if (adminButton)` para la primera
  emisión inicial).
- **`src/data/fallback.js`** — `defaults.admin.buttonVisible`:
  `false` → **`true`** para que el botón aparezca desde el primer
  load. El owner puede ocultarlo desde el panel ("Botón admin
  visible" toggle); la elección se persiste en localStorage
  (`p28-tweaks`).

### Notes
- Posicionamiento per request del owner: "justo debajo del texto
  HOLOGRAMA · V0.28.1" del header.
- `window.adminMode = true` sigue funcionando como fallback de QA
  (no regresión).
- Bundle: 629.37 → **630.75 KB** (+1.4 KB). 30 módulos transformados
  (antes 29).

## [0.11.0] — 2026-05-22 — Etapa 7 cierre: sliders restantes + persistencia localStorage

### Added
- **`src/main.js`** — controles que faltaban en el panel de tweaks:
  - Sección **Juego**: `gameJumpCount` (slider 1-6), `gameVelocityCurve`
    (select: `kirby` / `linear` / `constant`), `gameFallDuration`
    (slider 0.2-3s).
  - Nueva sección **Streaming**: `streamingEnabled` (toggle) +
    `streamingMode` (select: `shared` / `dedicated`). Sólo persiste
    state; los efectos en pixel streaming se conectan en **Etapa 11**.
  - Nueva sección **Admin**: `adminButtonVisible` (toggle). Sólo
    persiste state; el botón admin secreto en sí se implementa en
    **Etapa 8**.
- **`src/ui/tweaks.js`** — nueva opción `storageKey` (default
  `'p28-tweaks'`) en `mountTweaks`. Al montar, hidrata el state desde
  `localStorage` filtrando claves ajenas al schema actual (defensivo
  ante upgrades del defaults). En cada `setKey` escribe el state
  completo a `localStorage`. Try/catch para modo privado / quota.

### Changed
- Las mutaciones a `site.streaming.*` y `site.admin.buttonVisible`
  ahora se reflejan en vivo desde el panel (antes ninguna ruta UI las
  tocaba; ahora el panel actualiza el objeto compartido en memoria).
- `tweakDefaults` ahora incluye 6 keys nuevas: `gameJumpCount`,
  `gameVelocityCurve`, `gameFallDuration`, `streamingEnabled`,
  `streamingMode`, `adminButtonVisible`.

### Notes
- Cierra los puntos pendientes de **Etapa 7** (PLAN-PROYECTO28-V2.md §4).
  El panel sigue oculto por default (no regresión sobre v0.10.0); el
  gate por `window.adminMode` no cambió.
- Smoke test: reload sin tocar `adminMode` → panel sigue oculto, pero
  si en una sesión previa moviste sliders y luego setás
  `window.adminMode = true`, ves los valores guardados.
- Bundle: 627.69 KB → **629.37 KB** (+1.7 KB).

## [0.10.0] — 2026-05-22 — Etapa 7 parcial: tweaks panel oculto por default

### Changed
- **`src/ui/tweaks.js`**: `mountTweaks` ahora acepta `initiallyVisible`
  (default `false`). Cuando es `false`, ni el panel ni el FAB (engranaje)
  se renderizan al cargar. Expone `show()` / `hide()` / `isVisible()`
  en el objeto retornado.
- **`src/main.js`**: define `window.adminMode` con getter/setter via
  `Object.defineProperty`. Asignar `window.adminMode = true` desde la
  DevTools console llama `tweaks.show()`; `false` lo oculta. Mecanismo
  temporal de QA hasta Etapa 8 (botón admin secreto) + Etapa 9 (OAuth).

### Notes
- Adelanta los puntos 1 + 2 del scope original de Etapa 7
  (PLAN-PROYECTO28-V2.md §4). Los sliders restantes (`jumpCount`,
  `velocityCurve`, `fallDuration`, `streaming.*`, `admin.adminButtonVisible`)
  siguen pendientes para el cierre formal de Etapa 7.

### Tech debt — Strapi enum legacy
- Bug reportado por el owner al intentar editar `Project` desde el admin
  Strapi: "Warning: Validation error: Invalid status" al guardar
  cualquier cambio (incluso al editar el título). El dropdown del campo
  `status` muestra el valor seleccionado correctamente, pero la
  validación falla.
- **Hipótesis**: el seed inicial cargó valores como `EN PRODUCCION` sin
  tilde, mientras que el schema actual exige el enum
  `["EN PRODUCCIÓN", "BETA", "PROTOTIPO", "ARCHIVADO", "EN PAUSA"]` (con
  tilde). Los 6 records de la DB tienen valores legacy fuera del enum.
- **Fix recomendado** (no aplicado en este cierre): script de
  normalización en `cms/src/index.js` (bootstrap) que use
  `strapi.db.query('api::project.project').findMany()` + `update` con
  status válido. Mantener no destructivo (solo escribir si valor está
  fuera del enum).
- Se aborda formalmente en **Etapa 12 — Pipeline Publicar**, donde se
  re-toca Strapi para el flujo de save desde la web.

## [0.9.2] — 2026-05-22 — Patch: ajustes finos del owner como defaults

### Changed
- `src/data/fallback.js` — tras validar valores en vivo con los sliders
  del panel, el owner pidió persistirlos como defaults nuevos:
  - `defaults.tilt`            58   → 49
  - `defaults.yaw`             0    → -40
  - `defaults.gravityEnabled`  false→ **true** (físicas activas desde el inicio)
  - `game.jumpHeight`          2.5  → 1.5
  - `game.gravity`             16.0 → 30.0
  - `game.shadowSize`          0.45 → 0.3
- `lightSpeed` (5.0) y `mouseFollowDelay` (1.0) ya estaban en los valores
  deseados.

### Notes
- Strapi `SiteSetting` sigue con los defaults originales del schema v2
  (lightSpeed=8.0, jumpHeight=3.0, gravity=20.0, etc). Cuando el owner
  cree el admin Strapi (pendiente §1.6) debe replicar estos valores
  ahí para que el sitio con CMS activo arranque con la misma
  configuración. Por ahora el sitio parece estar usando `fallback` (el
  Strapi Cloud Free plan suele dormirse) — el slider "Velocidad: 5"
  visible confirma que fallback manda.

## [0.9.0] — 2026-05-22 — Polish: sombra anillo + tweak tamaño + flechas + gamepad

### Changed
- **Sombra anillo** (`src/game/light.js`): `CircleGeometry` → `RingGeometry(0.78, 1.0, 48)`.
  Argolla cyan en vez de círculo relleno — el centro queda transparente
  para no tapar el tile bajo la luz. Geometry unitaria; el tamaño final
  se aplica vía `mesh.scale` para preservar el efecto de altura.
- **Toggle "Gravedad + saltos"** ahora documenta los 3 inputs soportados:
  `WASD / ↑↓←→ / Pad` (label del tweak).

### Added
- **Tweak `shadowSize`** (`src/data/fallback.js` + `src/main.js`): nuevo
  slider en panel "Juego" → "Tamaño sombra" (0.15-1.2, step 0.05, default
  0.45). Multiplica el scale base de la sombra. El efecto de crecer/
  achicar con la altura se mantiene multiplicativo encima.
- **Flechas del teclado** mapeadas a WASD (`src/game/light.js`):
  `arrowToWASD()` traduce `ArrowUp/Down/Left/Right` → `w/s/a/d`. Llama
  `preventDefault()` para evitar scroll de la página. Comparten el mismo
  `keysActive` que WASD — el usuario puede mezclar ambos sets.
- **Gamepad** (Web Gamepad API, standard mapping):
  - `readGamepad()` cada frame en `update()`. Toma el primer pad
    conectado y devuelve `{x, z, jumpEdge}`.
  - Stick izquierdo (`axes[0]`, `axes[1]`) con deadzone `0.18`. Se mezcla
    con el teclado vía `getMoveVector()`; magnitud > 1 se normaliza para
    evitar diagonales más rápidas.
  - Botón `0` = **Face Button Bottom** (A / X / B según vendor) con edge
    detection (`prevJumpButton`) para `tryJump()` — no dispara saltos
    repetidos al mantener el botón.
  - Si hay input de gamepad en `floating` + `gravityFlag`, entra a
    `physics` automáticamente (paridad con el comportamiento de WASD).

### Notes
- Web Gamepad API requiere user interaction inicial (botón) para empezar
  a poblar `navigator.getGamepads()` en algunos browsers. Comportamiento
  estándar — el polling es no-op hasta que el browser activa el pad.
- Standard mapping verificado en Xbox / DualShock / DualSense / Pro
  Controller. Pads sin standard mapping pueden necesitar remapeo manual
  (no implementado).
- Build: 627.69 KB (+1.18 KB vs `0.8.x`).

### Verified
- Build local OK.
- Smoke test post-deploy esperado: tweak `gravityEnabled` ON; mover con
  WASD, flechas, o stick izq del gamepad; saltar con espacio o Face
  Button Bottom; sombra ahora visible como anillo, slider "Tamaño sombra"
  cambia el radio en vivo manteniendo el efecto de altura.

## [0.8.0] — 2026-05-22 — Polish Etapa 6: CCD + spawn + sombra + tweaks juego

### Fixed
- **Bug de traspaso (`src/game/light.js`)**: con `vy*dt` grande la luz
  atravesaba los cubos porque el raycast solo hacía snap si la luz ya
  estaba apoyada (`lightBottomY <= tileTopY + ε`) — no detectaba el
  cruce ocurrido durante el frame. Reemplazado por **continuous collision**:
  raycast desde `prevY` hacia abajo con `far = (prevY-newY) + SPHERE_RADIUS + ε`.
  Si hay hit, snap al top del tile.
- **Respawn en (0,5,0) caía al vacío**: la celda central del grid es
  empty (slot `Rectangle 21`) y la luz aparecía justo encima sin tener
  cubo debajo. Fix: `RESPAWN_XZ` se calcula en el constructor a partir de
  `tiles[0]` (top-left del grid) — la luz aparece encima de un cubo real
  y aterriza ahí.

### Changed
- **Cubo bajo la luz se eleva como hover** (`src/main.js`): el cubo activo
  ahora recibe el mismo trato visual que el hover — sube a `ud.hoverY` y
  brilla a `ud.hoverEmissive`. Eliminada la distinción visual previa que
  lo dejaba plano. Una luz que pisa un cubo se siente como "contacto"
  fuerte, equivalente al cursor encima.
- **Defaults más suaves** (`src/data/fallback.js`):
  - `lightSpeed`: 8.0 → 5.0 (movimiento más lento)
  - `jumpHeight`: 3.0 → 2.5 (saltos menos exagerados)
  - `gravity`:    20.0 → 16.0 (arco más flotante, feel Kirby pulido)

### Added
- **Sombra-decal cyan debajo de la luz** (`src/game/light.js`): mesh
  `CircleGeometry` orientada horizontal, raycast hacia abajo cada frame
  para posicionarla en `hit.point.y + 0.012` (sobre tile o floor). Escala
  y opacidad varían con la altura: más alto = mayor radio + más translúcida.
  Visible siempre que la luz esté sobre el escenario; se oculta durante
  respawn al vacío. Resuelve el feedback de "dónde caerá la luz".
- **Sliders de juego en el panel de tweaks** (`src/main.js`): sección
  "Juego" expone 4 controles nuevos en vivo —
  - Velocidad (1-12, step 0.5)
  - Altura salto (0.5-6, step 0.25)
  - Gravedad (5-40, step 0.5)
  - Delay mouse-follow (0-3s, step 0.1)
  `onChange` muta `site.game` in place; `controlLight` captura la
  referencia y usa los nuevos valores en el siguiente frame sin reinit.

### Notes
- El cubo `activeEmissive` que se agregó en Etapa 6 (`v0.7.0`) ya no se
  usa en el render loop, pero la propiedad sigue en `userData` para no
  hacer trabajo de cleanup en este patch — puede removerse en un futuro
  patch puramente cosmético.
- Build: 626.51 KB (+2.19 KB vs `0.7.x`). Warning >500 KB persiste —
  pendiente Etapa 15.

### Verified
- Build local OK.
- Smoke test post-deploy esperado: tweak `gravityEnabled` ON → la luz
  cae sobre un cubo (no al vacío), no traspasa al aterrizar desde
  saltos altos, el cubo bajo se eleva y brilla, la sombra cyan sigue
  la posición, los sliders de Juego cambian el feel en vivo.

## [0.7.0] — 2026-05-22 — Etapa 6: Cubos encendidos + respawn + HUD

### Added
- **`src/game/light.js`** (Etapa 6 encima de Etapa 5):
  - Tracking de `activeTile`: en modo physics, cada frame con `landed=true`
    expone el cubo bajo la luz (sólo project tiles) vía callback nuevo
    `onActiveTileChange(tile|null)`.
  - **Respawn al caer al vacío** (`mesh.position.y < -10` en modo physics):
    fade-out durante `config.fallDuration` mientras sigue cayendo, snap a
    `(0, 5, 0)` con `vy=0` / `grounded=false`, fade-in de 0.3s. Incrementa
    `fallCount` y emite `onRespawn(n)` post fade-out. Input WASD y saltos
    bloqueados durante el respawn.
  - Material ahora `transparent:true` y `PointLight.intensity` sigue la
    `opacity` para que el fade afecte la iluminación de la escena.
- **`src/scene/scene.js`**: `ud.activeEmissive` distinguible del hover
  (`0.95` default / `0.25` en mono — entre `baseEmissive` y `hoverEmissive`).
  `applyTileStyle` lo recomputa al cambiar de paleta.
- **`src/ui/hud.js`** (módulo nuevo): contador `LUCES CAÍDAS · 000` en
  esquina sup-der. Tipografía mono + token cyan, padding-zero a 3 dígitos,
  pulse copper-bright al incrementar para feedback visible. CSS inyectado
  vía `<style>` para evitar tocar `app.css`. API: `mountHud().setFallCount(n)`.
- **`src/main.js`**: cablea `onActiveTileChange` / `onRespawn` al estado
  del render loop y al HUD. `targetGlow` ahora prioriza
  `hover > activeTile > baseGlow`; el cubo activo **no** levanta la altura
  (distingue visualmente del hover, que sí sube a `hoverY=0.65`).

### Notes
- Empty tiles no se marcan como activos (no son `isProject`). El
  `PointLight` ya los ilumina implícitamente, sin necesidad de emissive
  boost.
- Decisión de diseño: el activo usa `emissiveIntensity` intermedio (≈0.95)
  entre base (0.35) y hover (1.4). Combinado con la altura plana del
  activo (vs. hover levantado), las dos señales se distinguen sin
  ambigüedad incluso si el mouse pasa sobre el cubo activo (hover gana
  en ese caso).
- Estado del contador en memoria — se resetea al recargar (intencional
  para Etapa 6; persistencia queda fuera de scope).
- Build: 624.32 KB (+2.65 KB vs `0.6.x`). Warning >500 KB persiste — se
  aborda en Etapa 15.

### Verified
- Build local OK.
- GH Pages deploy verde (run TBD).
- Smoke test post-deploy: tweak `gravityEnabled` ON + WASD → la luz cae
  y aterriza, el cubo bajo se enciende con un tono cyan intermedio sin
  levantarse, caminar entre cubos transfiere el "activo", caer al vacío
  desvanece la luz, respawnea en `(0,5,0)`, y el HUD `LUCES CAÍDAS` sube
  con pulse copper.

## [0.6.2] — 2026-05-22 — Patch CI: opt-in Node 24 para JS actions

### Changed
- `.github/workflows/deploy.yml`: agrega `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'`
  a nivel workflow. Silencia el deprecation warning de Node 20 que GitHub
  forzará el 2026-06-02 sin esperar a bumps formales de cada action.

### Verified
- Run de CI post-merge verde. Warning de GitHub cambió de "are running on
  Node.js 20" → "are being forced to run on Node.js 24" — el flag empuja
  a Node 24 hoy. La anotación residual desaparecerá cuando los vendors
  actualicen `runs.using` en sus `action.yml` (antes del 2026-06-02).

### Notes
- Reversible vía `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION: true` si algo
  se rompe.
- Bump de versiones formales (`actions/checkout@v5`, `setup-node@v5`,
  etc.) queda para Etapa 15 dentro del hardening general.

## [0.6.1] — 2026-05-22 — Patch documental: cierre Etapa 5

### Added
- Sección [0.6.0] de este CHANGELOG con detalle de la física Kirby opt-in
  y la decisión de diseño (default Etapa 4 intacto + opt-in vía tweak).
- Sección [0.5.1] backfill (faltaba del cierre Etapa 4).

### Changed
- `README.md`: tabla de etapas marca Etapa 5 como cerrada con tag `v0.6.0`
  (etiqueta "Físicas Kirby (opt-in)").
- `HANDOFF-LATEST.md`: regenerado apuntando a Etapa 6 (cubos encendidos
  + respawn + contador HUD). §3 lista las tareas; §15 incluye hint para
  el próximo agente sobre cómo aprovechar el raycast existente.

## [0.6.0] — 2026-05-22 — Etapa 5: Físicas Kirby opt-in

### Added
- **Tweak `gravityEnabled`** (toggle "Gravedad + saltos (WASD)" en una nueva
  sección "Juego" del panel). Default `false` → comportamiento Etapa 4 intacto.
- `src/game/light.js`: state machine `'floating' | 'physics'`.
  - `floating` (default): Etapa 4 sin cambios — mouse-follow + WASD a `y=1`,
    `mouseFollowDelay` activo, sin gravedad, sin saltos.
  - `physics` (opt-in vía tweak): se entra cuando el tweak está ON y el
    usuario presiona WASD por primera vez; se sale cuando el mouse se mueve
    o el tweak se apaga. Gravedad `config.gravity`, raycast hacia abajo
    sobre `sceneCtx.tiles` para detectar grounded y snap a la superficie
    del cubo. Saltos con espacio (`e.preventDefault`, `e.repeat` ignorado)
    con multipliers Kirby `[1.0, 0.85, 0.7, 0.55]` indexados por
    `jumpsUsed` (max `config.jumpCount=4`).
- `controlLight.setGravityEnabled(bool)` y `controlLight.notifyMouseMoved()`:
  API para wire desde main.js.
- `src/data/fallback.js`: `defaults.gravityEnabled = false`.
- `src/data/cms.js`: mapeo `a.defaultGravityEnabled ?? fb.defaults.gravityEnabled`
  (campo futuro del schema Strapi — por ahora siempre cae al fallback).

### Changed
- `src/main.js`:
  - Pasa `gravityEnabled` inicial al constructor de `createControllableLight`.
  - Listener `pointermove` ahora llama `controlLight.notifyMouseMoved()`.
  - `onChange` del panel de tweaks ahora wire-ea
    `controlLight.setGravityEnabled(state.gravityEnabled)`.

### Notes
- **Desvío del plan original**: el spec de Etapa 5 en `PLAN-PROYECTO28-V2.md`
  describe gravedad como comportamiento default. Durante la implementación
  el owner pidió que el default Etapa 4 quede intacto y la física sea
  opt-in vía tweak — esta versión refleja esa decisión.
- En `floating`, la `y` lerpea suave hacia `LIGHT_Y=1` con la misma tasa
  exponencial del mouse-follow (`rate=6`), evitando teleport visible al
  salir del modo físicas.
- En el modo físicas no hay respawn al caer al vacío: si la luz pierde
  todos los cubos abajo, sigue cayendo. Eso se aborda en Etapa 6.
- Build: 621.67 KB (+0.77 KB vs `0.5.x`).

### Verified
- Smoke test localhost + GH Pages deploy verde en 8s.
- `proyecto28.com` sirviendo `index-Cdkh2u7j.js`.
- Default visual: idéntico a Etapa 4 (esfera flotando en `(0,1,0)`).
- Toggle ON + WASD: cae y aterriza. Espacio: hasta 4 saltos.
- Mover mouse en modo físicas: regresa smooth a `y=1`.

## [0.5.1] — 2026-05-22 — Patch documental: cierre Etapa 4

### Added
- Sección [0.5.0] de este CHANGELOG con detalle de la luz controlable
  (Etapa 4) y la nota de tech debt sobre actions Node 20.

### Changed
- `README.md`: tabla de etapas marca Etapa 4 como cerrada con tag `v0.5.0`.
- `HANDOFF-LATEST.md`: regenerado apuntando a Etapa 5 (físicas Kirby).
  Documenta el deprecation de Node 20 en CI con fecha 2026-06-02.

### Notes
- Sin cambios de código del frontend / CMS.

## [0.5.0] — 2026-05-22 — Etapa 4: Luz controlable

### Added
- `src/game/light.js` (nuevo módulo): `createControllableLight({ scene, config })`.
  - `THREE.PointLight` cyan + `THREE.Mesh` esfera emissiva a y=1 sobre el grid.
  - Modo WASD: input normalizado × `site.game.lightSpeed`, integración por
    frame `position += velocity * dt`.
  - Modo mouse-follow: raycast a plano horizontal `y=1`, lerp exponencial
    frame-rate independiente (rate=6).
  - Switch de modo: si hay tecla WASD presionada **o** el último input fue
    hace menos de `site.game.mouseFollowDelay` segundos → WASD; en otro
    caso → mouse-follow. Esto evita snap-back al soltar las teclas.
- `src/main.js`:
  - Import + instanciación de `createControllableLight` tras `createScene`.
  - Listeners `keydown` / `keyup` para W/A/S/D (espacio reservado para Etapa 5).
  - Llamada `controlLight.update(dt, now, raycaster)` dentro del render loop
    después de `raycaster.setFromCamera`.

### Removed
- Los 4 `console.log('[p28:v2]', …)` de QA Etapa 3 que estaban marcados con
  `TODO(Etapa 4)`. La verificación que hacían ahora la cubre el comportamiento
  visible de la luz (que consume `site.game.lightSpeed` y `mouseFollowDelay`).

### Verified
- Build local: `620.24 KB` (+2 KB vs `0.4.x`). Warning Vite >500 KB persiste
  (se aborda en Etapa 15).
- GH Actions deploy verde en 11s, `proyecto28.com` sirviendo el bundle nuevo.
- Smoke test: esfera visible, sigue mouse, responde a WASD, vuelve a seguir
  mouse después de 1s sin teclado.

### Notes
- Sin gravedad, salto, ni respawn todavía — eso es Etapa 5.
- Tech debt menor detectado en CI: actions Node.js 20 deprecated. Fecha de
  cambio forzado: 2026-06-02 (12 días). Bumpear `actions/checkout@v4` +
  `actions/setup-node@v4` + `actions/configure-pages@v5` +
  `actions/upload-artifact@v4` en Etapa 15 o como patch puntual antes.

## [0.4.1] — 2026-05-21 — Patch documental: prep para nuevo agente IA

### Added
- `PLAN-PROYECTO28-V2.md` ahora vive **dentro del repo** (antes en
  directorio padre del owner, no versionado). Esto garantiza que cualquier
  agente IA que clone el repo encuentra el plan completo.
- `HANDOFF-LATEST.md` reescrito como documento **autosuficiente** con:
  - §1 "Cómo arrancar como nuevo agente IA" (paso a paso explícito)
  - §3 Detalle expandido de Etapa 4 con criterios de éxito visibles
  - §10 Estructura del repo
  - §13 Quirks documentados del backup en Google Doc (clipboard, type
    grande con timeout, autocorrect)
  - §15 "Cómo continuar" para el próximo agente

### Changed
- `PLAN-PROYECTO28-V2.md`: encabezado actualizado con tabla de estado
  (etapas 1-3 cerradas con tags y commits), decisiones tomadas (§1.1
  resuelto), ajustes al flujo aprendidos durante la ejecución.

### Notes
- Sin cambios al código del frontend ni al CMS.
- Tag patch `v0.4.1` permite rollback puntual a este estado documental
  si algo se rompiera en Etapa 4 sin afectar `v0.4.0`.

## [0.4.0] — 2026-05-21 — Etapa 3: Data layer frontend (schema v2)

### Added
- `src/data/cms.js`:
  - JSDoc typedefs `Project` y `SiteContent` documentando la shape v2.
  - `normalizeProject` mapea los 7 campos nuevos (`unrealStreamURL`,
    `unrealLevelName`, `unrealEnabled`, `popupImageURL`, `popupBody`,
    `popupCTALabel`, `videoLoopURL`).
  - `normalizeSite` agrupa los 10 campos nuevos en `site.game` /
    `site.admin` / `site.streaming` (en vez de aplanarlos sobre
    `site.defaults`).
  - Helper `num()` para conversión segura a number con fallback.
- `src/data/fallback.js`:
  - `FALLBACK_SITE.game/admin/streaming` con defaults idénticos al schema
    de Strapi.
  - `V2_PROJECT_DEFAULTS` aplicado a los 6 proyectos del fallback.
- `src/main.js`: console.log temporal `[p28:v2]` para verificar que los
  campos llegan. Marcado con TODO para remover en Etapa 4.

### Changed
- Bundle: 618 KB (+2 KB vs baseline 616 KB) — overhead aceptable del data
  layer. Code-splitting pendiente Etapa 15.

### Notes
- Sin cambios visibles para el usuario final. Esta etapa es preparatoria.
- Etapa 4 (luz controlable) consumirá `site.game.lightSpeed` y los demás.

## [0.3.0] — 2026-05-21 — Etapa 2: Strapi schema v2

### Added
- **Project**: 7 campos nuevos (`unrealStreamURL`, `unrealLevelName`,
  `unrealEnabled`, `popupImage`, `popupBody`, `popupCTALabel`, `videoLoop`).
- **SiteSetting**: 10 campos nuevos (`gameLightSpeed`, `gameLightJumpHeight`,
  `gameLightJumpCount`, `gameLightGravity`, `gameLightVelocityCurve`,
  `gameMouseFollowDelay`, `gameFallDuration`, `adminButtonVisible`,
  `pixelStreamingEnabled`, `pixelStreamingMode`).
- **AdminWhitelist** (nuevo content type, collection privada): `email` (unique),
  `role` (owner/editor), `note`. Seed inicial con 2 emails autorizados.
- Bootstrap actualizado:
  - Backfill no destructivo de SiteSetting (solo escribe campos faltantes).
  - Seed de AdminWhitelist solo si la tabla está vacía.
  - Permisos públicos explícitamente denegados sobre `admin-whitelist` endpoints.

### Verified post-deploy
- `GET /api/projects?populate=*` devuelve 6 entries con los 7 nuevos campos.
- `GET /api/site-setting` devuelve los 10 nuevos campos con valores default.
- `GET /api/admin-whitelists` responde HTTP 403 sin auth.
- Strapi Cloud rebuild OK en ~4.5 min después del push.

### Notes
- Los campos `media` (`popupImage`, `videoLoop`) están null hasta que el owner
  los suba desde el admin de Strapi por cada proyecto.
- Etapa 3 (data layer frontend) consume estos nuevos campos.

## [0.2.0] — 2026-05-21 — Etapa 1: Fundación de versionado

### Added
- `CHANGELOG.md` con convención Keep-a-Changelog + SemVer.
- `VERSIONING.md` que documenta el flujo de branches por etapa, formato de
  commits, criterio de tags y checklist de cierre.
- `scripts/release.ps1` y `scripts/release.sh` para automatizar tag + push +
  apertura de nueva sección en CHANGELOG.
- `HANDOFF-LATEST.md` como handoff incremental (sustituye el patrón de
  regenerar handoffs completos cada sesión).
- Sección "Cómo contribuir" en `README.md` con el flujo de trabajo oficial.
- Job placeholder `sync-claude-design` en `.github/workflows/deploy.yml`
  (no-op hasta Etapa 13 según resolución de §1.4 del plan).

### Changed
- `.github/workflows/deploy.yml`: pequeñas anotaciones para reflejar el nuevo
  protocolo (sin cambios funcionales en el deploy).

### Notes
- Tag `v0.1.0` retroactivo en el commit `f7a3a30` marca el estado del handoff v1.
- Strapi Cloud sigue desplegando automáticamente con cada push a `main` que
  toque `cms/**` (esa pieza del flujo ya funcionaba).

## [0.1.0] — 2026-05-21 — Estado del handoff v1

### Added
- Frontend Vite + Three.js con grid 3D de cubos, popup HUD, tweaks panel.
- Strapi 5.13.1 con content types `Project` (6 entries seeded) y `SiteSetting`.
- Workflow `Build and deploy frontend to GitHub Pages`.
- DNS para `proyecto28.com` (registrar externo) y `proyecto28.cl` (Cloudflare).
- Strapi Cloud `honest-candy-800d1e4a92.strapiapp.com` con deploy-on-commit.
- Docs: `README.md`, `DEPLOY.md`, `cms/README.md`.

### Known issues
- Bundle ~616KB, warning de Vite por >500KB (pendiente code-splitting).
- Admin de Strapi no creado todavía (signup pendiente del owner).
- `.cl` esperando propagación NIC al momento del handoff.

[Unreleased]: https://github.com/nitenacho/Proyecto28/compare/v0.10.0...HEAD
[0.10.0]: https://github.com/nitenacho/Proyecto28/compare/v0.9.2...v0.10.0
[0.9.2]: https://github.com/nitenacho/Proyecto28/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/nitenacho/Proyecto28/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/nitenacho/Proyecto28/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/nitenacho/Proyecto28/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/nitenacho/Proyecto28/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/nitenacho/Proyecto28/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/nitenacho/Proyecto28/compare/v0.6.2...v0.7.0
[0.6.2]: https://github.com/nitenacho/Proyecto28/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/nitenacho/Proyecto28/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/nitenacho/Proyecto28/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/nitenacho/Proyecto28/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/nitenacho/Proyecto28/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/nitenacho/Proyecto28/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/nitenacho/Proyecto28/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/nitenacho/Proyecto28/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/nitenacho/Proyecto28/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nitenacho/Proyecto28/releases/tag/v0.1.0
