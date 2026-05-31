# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-05-31 (Etapa 18 Mobile parity + audio interactivo - `v0.22.0`)
> **Tag activo esperado tras cierre:** `v0.22.0`
> **Branch esperado:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28
> **Produccion canonica:** https://proyecto28.com

Etapas 1-18 cerradas. Proyecto28 queda con web 3D interactiva, Strapi Cloud,
Google OAuth + whitelist, Tweaks publicables, Pixel Streaming iframe/fallback,
sync Claude Design, hardening performance/a11y, mini-juego Pacman de luz y una
capa de audio interactivo configurable desde Strapi.

---

## 0. Resumen en 30 segundos

Estado vigente esperado tras cierre:

- `v0.22.0`: mobile vuelve a usar calidad visual de desktop; se agregan botones
  pequenos de fullscreen/mute; el sitio sintetiza audio WebAudio tipo MIDI en
  hover de bloques e interacciones; Strapi SiteSetting incluye `audio*`.
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
- ultimo tag `v0.22.0`
- build Vite OK
- build Strapi OK

Lectura obligatoria:

1. `HANDOFF-V2.md` - handoff compacto.
2. `ADMIN-URLS.md` - URLs para administrar todos los servicios.
3. `RUNBOOK.md` - operacion, incidentes, rollback, secretos.
4. `DEPLOY.md` - GitHub Pages, Strapi, OAuth, Pixel Streaming, releases.
5. `CHANGELOG.md` - `[0.22.0]`.
6. `PLAN-PROYECTO28-V2.md` - Etapa 18 cerrada.
7. `cms/README.md` - SiteSetting incluye `gameLightColor` y `audio*`.

---

## 2. Cambios v0.22.0

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

## 3. Validacion realizada antes del cierre

### Local

```powershell
npm run build
cd cms
npm run build
```

Resultado:

- Frontend OK. Warning existente: chunk `three` >500 kB.
- Strapi OK. Warning existente de Node/Strapi: `DEP0187 fs.existsSync`.

Servidor local:

- `http://127.0.0.1:5173/` responde `HTTP 200`.
- Dev server Vite levantado desde:
  `C:/Users/incon/Downloads/EscritorioNobita/Proyectos_Claude/Claude_P28/Proyecto28`.

Chrome CDP smoke:

- Desktop `1365x768`:
  - WebGL activo;
  - canvas full viewport;
  - HUD/status/controles dentro del viewport.
- Mobile `390x844`:
  - WebGL activo;
  - canvas full viewport;
  - cubos redondeados + sombras + bloom visibles;
  - HUD/status/controles dentro del viewport;
  - `body/html == 390`, sin overflow horizontal.

Capturas locales ignoradas por git:

```text
artifacts/qa/etapa18-desktop-cdp.png
artifacts/qa/etapa18-mobile-cdp.png
```

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

### Produccion postdeploy v0.22.0

- Commit desplegado por Pages: `936717b`.
- GitHub Pages run: `26708867215` => success.
- Auto-tag run: `26708867220` => success.
- Tag: `v0.22.0`.
- Produccion:
  - `https://proyecto28.com` => `200`
  - `https://proyecto28.com/robots.txt` => `200`
  - `https://proyecto28.com/sitemap.xml` => `200`
- Bundle vivo:
  - asset `assets/index-BwOh2oIH.js`
  - contiene `p28-audio-muted-v1`
  - contiene `audioPreset`
  - contiene `MIDI moderno`
  - contiene `p28-system-controls`
  - contiene `RoundedBoxGeometry`
  - contiene `UnrealBloomPass`
- Strapi Cloud postdeploy:
  - `/api/site-setting` incluye:
    - `audioEnabled: true`
    - `audioPreset: "midi"`
    - `audioMasterVolume: 0.24`
    - `audioHoverVolume: 0.2`
    - `audioInteractionVolume: 0.18`
  - `updatedAt` => `2026-05-31T09:29:14.831Z`

---

## 4. Operacion clave

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

### Como probar el mini-juego + audio

1. Abrir `https://proyecto28.com`.
2. Hacer hard refresh si el navegador conserva assets viejos.
3. Hacer una primera interaccion real (click/tecla/boton) para desbloquear
   audio del navegador.
4. Pasar el mouse por los bloques: debe sonar una nota sutil por bloque.
5. Controlar la luz con `W/A/S/D`, flechas o gamepad.
6. Las esferas deben aparecer solo mientras la luz esta controlada.
7. Recolectar cada esfera por cercania.
8. Confirmar contador `Esferas`, `Tiempo` y `Mejor`.
9. Al terminar todas, el timer queda detenido, la luz brilla dorado 1 segundo
   y suena feedback de victoria.
10. Mover el mouse o caer al vacio debe reiniciar timer/contador y ocultar o
    reaparecer esferas segun corresponda.

### Pixel Streaming

GitHub Pages no ejecuta Unreal. El stream vive en infraestructura GPU externa y
el frontend solo monta iframe si Strapi entrega configuracion valida.

Para apagar el preview/fallback:

```text
Admin -> Tweaks -> Streaming -> Preview visible OFF -> PUBLICAR CAMBIOS
```

---

## 5. Deploy esperado

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

Para `v0.22.0`:

- Rama usada: `etapa-18-mobile-audio-controls`.
- Commit funcional: `936717b feat: add mobile parity and interactive audio`.
- Pages run: `26708867215`.
- Auto-tag run: `26708867220`.

---

## 6. Riesgos y pendientes

- Audio en navegadores: no puede sonar antes de la primera interaccion real por
  politicas de autoplay. Esto es esperado.
- Mobile ahora usa calidad desktop; si aparece fatiga en dispositivos low-end,
  evaluar un toggle admin futuro de calidad, pero no volver a degradar por
  defecto.
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

## 7. Google Doc

Respaldo oficial:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Regla:

- Actualizar el tab de Proyecto28/Handoff vigente al final del documento.
- No usar el Handoff:Kaiyi para esta etapa.
- Respaldo insertado al final del tab Proyecto28/Handoff `t.7lpfc5ado1h`.
- Revision Google Doc post-insercion:
  `AFwiY19mqPWmJBzPup_n5adbiB1dPowVET1SxxFj9M-8XIH5oDXXI4KHyA7ihYotx0pmTC1t3KDHLbTnHAFrJFPlXQ6y7sDEBF9sKSlcR84`.
- Titulo/anchor:

```text
2026-05-31 09:29 UTC - v0.22.0 mobile-audio-controls
```

---

Fin del handoff `v0.22.0`.
