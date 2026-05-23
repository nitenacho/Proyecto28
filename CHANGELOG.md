# Changelog

Todos los cambios notables de Proyecto 28 se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este
proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

Cada entrada corresponde a una **etapa** del [PLAN-PROYECTO28-V2.md](../PLAN-PROYECTO28-V2.md)
o a un fix puntual entre etapas.

## [Unreleased]

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
