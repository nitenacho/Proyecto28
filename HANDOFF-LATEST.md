# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-05-31 (Etapa 20 Split-screen touch joystick - `v0.24.0`)
> **Tag activo esperado tras cierre:** `v0.24.0`
> **Branch esperado:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28
> **Produccion canonica:** https://proyecto28.com

Etapas 1-20 cerradas. Proyecto28 queda con web 3D interactiva, Strapi Cloud,
Google OAuth + whitelist, Tweaks publicables, Pixel Streaming iframe/fallback,
sync Claude Design, hardening performance/a11y, mini-juego Pacman de luz y una
capa de audio interactivo configurable desde Strapi. La luz ahora se puede
tomar/soltar desde un boton minimo en HUD, acepta D-pad/flechas de gamepad y en
mobile usa pantalla dividida tactil: joystick dinamico izquierdo y zona derecha
de salto inmediato.

---

## 0. Resumen en 30 segundos

Estado vigente esperado tras cierre:

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
- ultimo tag `v0.24.0`
- build Vite OK
- build Strapi OK

Lectura obligatoria:

1. `HANDOFF-V2.md` - handoff compacto.
2. `ADMIN-URLS.md` - URLs para administrar todos los servicios.
3. `RUNBOOK.md` - operacion, incidentes, rollback, secretos.
4. `DEPLOY.md` - GitHub Pages, Strapi, OAuth, Pixel Streaming, releases.
5. `CHANGELOG.md` - `[0.24.0]`.
6. `PLAN-PROYECTO28-V2.md` - Etapa 20 cerrada.
7. `cms/README.md` - SiteSetting incluye `gameLightColor` y `audio*`.

---

## 2. Cambios v0.24.0

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

## 3. Cambios v0.23.0

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

## 4. Cambios v0.22.0

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

## 5. Validacion realizada antes del cierre

### Local

```powershell
npm run build
```

Resultado:

- Frontend OK. Warning existente: chunk `three` >500 kB.
- No hubo cambios en `cms/**`; Strapi no requiere rebuild para esta etapa.

Servidor local:

- `http://127.0.0.1:5173/` responde `HTTP 200`.
- Dev server Vite levantado desde:
  `C:/Users/incon/Downloads/EscritorioNobita/Proyectos_Claude/Claude_P28/Proyecto28`.
- Bundle local `dist/assets/index-gCm6b1gG.js` contiene:
  - `p28-touch-controls`
  - `p28-touch-zone-left`
  - `p28-joystick`
  - `p28-touch-jump-hint`
  - `setExternalMoveVector`
- Bundle local no contiene:
  - `DeviceOrientationEvent`
  - `isLightControlSafeTarget`

Chrome CDP smoke:

- Mobile `390x844`:
  - boton amarillo cambia `aria-pressed:false -> true`;
  - `.p28-touch-controls` queda activo;
  - joystick se ancla al primer toque en la mitad izquierda;
  - nub responde a vector `34,-22`;
  - zona derecha dispara pulso de salto inmediato;
  - `body/html == 478`, sin overflow horizontal.
- Screenshot headless mobile confirma joystick minimo abajo izquierda, indicador
  de salto discreto abajo derecha y HUD intacto.

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

### Produccion postdeploy v0.24.0

- Commit desplegado por Pages: `b9aaeb5`.
- GitHub Pages run: `26718658099` => success.
- Auto-tag run: `26718658101` => success.
- Tag: `v0.24.0`.
- Produccion:
  - `https://proyecto28.com` => `200`
  - `https://proyecto28.com/robots.txt` => `200`
  - `https://proyecto28.com/sitemap.xml` => `200`
- Bundle vivo:
  - asset `assets/index-yCREtV-Q.js`
  - contiene `p28-touch-controls`
  - contiene `p28-touch-zone-left`
  - contiene `p28-joystick`
  - contiene `p28-touch-jump-hint`
  - contiene `setExternalMoveVector`
  - contiene `p28-sphere-best-time-ms-v1`
  - no contiene `DeviceOrientationEvent`
  - no contiene `isLightControlSafeTarget`
- Strapi Cloud postdeploy:
  - `/admin` => `200`
  - `/api/projects?populate=*` => `200`
  - `/api/site-setting` => `200`
  - `/api/admin-whitelists` => `403`
  - `/api/auth/check?email=inconcha@gmail.com` =>
    `{ allowed:true, role:"owner" }`
  - `/api/auth/check?email=yk8arts@gmail.com` =>
    `{ allowed:true, role:"editor" }`

---

## 6. Operacion clave

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

## 7. Deploy esperado

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

Para `v0.24.0`:

- Rama usada: `etapa-20-mobile-split-touch-joystick`.
- Commit funcional: `b9aaeb5 feat: add mobile split touch joystick`.
- Pages run: `26718658099`.
- Auto-tag run: `26718658101`.

---

## 8. Riesgos y pendientes

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

## 9. Google Doc

Respaldo oficial:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Regla:

- Actualizar el tab de Proyecto28/Handoff vigente al final del documento.
- No usar el Handoff:Kaiyi para esta etapa.
- Respaldo insertado al final del tab Proyecto28/Handoff `t.7lpfc5ado1h`.
- Revision Google Doc post-insercion:
  `AFwiY1-BMO5OtT6yc2WVyVX425LMXusp_GiQwApeM6ybJMpz5PXwR3WSbL4wOUzPsAL5-Am0bVXXLkQ1b8tFPe5fxp7vcxfainCRwUvUYNc`.
- Titulo/anchor:

```text
2026-05-31 16:58 UTC - v0.24.0 split-touch-joystick
```

---

Fin del handoff `v0.24.0`.
