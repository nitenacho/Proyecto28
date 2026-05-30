# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-05-30 (Etapa 17 Pacman de luz + color admin - `v0.21.0`)
> **Tag activo esperado tras cierre:** `v0.21.0`
> **Branch esperado:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28
> **Produccion canonica:** https://proyecto28.com

Etapas 1-17 cerradas. Proyecto28 queda con web 3D interactiva, Strapi Cloud,
Google OAuth + whitelist, Tweaks publicables, Pixel Streaming iframe/fallback,
sync Claude Design, hardening performance/a11y, documentacion operativa y una
primera mecanica de juego tipo Pacman para la luz controlable.

---

## 0. Resumen en 30 segundos

Estado vigente esperado tras cierre:

- `v0.21.0`: mini-juego de esferas para la luz, cronometro, mejor tiempo local,
  color de luz publicable y schema Strapi `gameLightColor`.
- `v0.20.4`: ultimo tag anterior, restauracion de disponibilidad del admin
  Strapi tras los fixes de `Project.status`.
- `v0.20.1`: hover estable en bordes y `ADMIN-URLS.md`.
- Tres fixes CMS entre `v0.20.2` y `v0.20.4` quedan documentados antes de
  `v0.21.0`:
  normalizacion de `Project.status`, desactivacion de Draft & Publish en
  `Project` y recuperacion del admin Strapi tras el conflicto de schema.
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
```

Esperado despues del cierre:

- branch `main`
- working tree clean
- ultimo tag `v0.21.0`
- build Vite OK

Lectura obligatoria:

1. `HANDOFF-V2.md` - handoff compacto.
2. `ADMIN-URLS.md` - URLs para administrar todos los servicios.
3. `RUNBOOK.md` - operacion, incidentes, rollback, secretos.
4. `DEPLOY.md` - GitHub Pages, Strapi, OAuth, Pixel Streaming, releases.
5. `CHANGELOG.md` - `[0.21.0]`.
6. `PLAN-PROYECTO28-V2.md` - Etapa 17 cerrada.
7. `cms/README.md` - SiteSetting incluye `gameLightColor`.

---

## 2. Cambios v0.21.0

### Mini-juego de recoleccion

- Se agrega `src/game/collectibles.js`.
- Crea 1 esfera pequena por cada cubo oscuro/vacio (`!tile.userData.isProject`).
- En el grid actual son 18 esferas: 24 cubos totales menos 6 cubos proyecto.
- Las esferas flotan sutilmente sobre el cubo, sin popup y sin texto.
- Solo aparecen cuando la luz esta bajo control manual
  (`W/A/S/D`, flechas o gamepad).
- Desaparecen al volver al mouse-follow o al completar la run.
- La recoleccion ocurre por cercania X/Z para que funcione aunque la luz este
  flotando a distinta altura.

### Timer, contador y mejor tiempo

- `src/main.js` mantiene un estado de run:
  `active`, `complete`, `startAt`, `elapsedMs`, `collected`, `bestMs`.
- El timer arranca al controlar la luz.
- Si la luz deja de estar controlada, el contador/timer se reinician y las
  esferas vuelven para la proxima run.
- Si la luz cae al vacio, se resetea el run junto al respawn.
- Al recolectar todas las esferas:
  - el timer se detiene en pantalla;
  - el contador queda en `total/total`;
  - la luz brilla dorada durante 1 segundo;
  - el mejor tiempo se guarda en `localStorage` con key
    `p28-sphere-best-time-ms-v1`.

### HUD

- `src/ui/hud.js` ahora muestra, en formato compacto:
  - `Caidas`
  - `Esferas`
  - `Tiempo`
  - `Mejor`
- El HUD esta pensado para no molestar la vista del juego y seguir siendo
  legible en desktop/gamepad.

### Color de luz

- `src/game/light.js` agrega paletas:
  - `cyan`
  - `red`
  - `green`
- `Admin -> Tweaks -> Juego -> Color luz` ofrece:
  - `Gema cyan`
  - `Gema rojiza`
  - `Gema verde`
- El campo se normaliza desde Strapi como `gameLightColor`.
- El frontend muta `site.game.lightColor` en vivo y llama
  `controlLight.setLightColor(...)`.
- Durante victoria, el color temporal dorado tiene prioridad y luego vuelve a
  la gema seleccionada.

### Strapi / Publicar cambios

Archivos tocados:

- `cms/src/api/site-setting/content-types/site-setting/schema.json`
- `cms/src/api/site-setting/controllers/site-setting.js`
- `cms/src/index.js`
- `src/admin/publish.js`
- `src/data/cms.js`
- `src/data/fallback.js`

Campo agregado:

```text
gameLightColor: enum(cyan, red, green), default cyan
```

Este campo queda permitido en `/api/publish`, se normaliza en el frontend y se
incluye en el bootstrap/default del singleton SiteSetting.

### Estabilidad y rutas

- Las rutas de continuidad se ajustaron al nuevo checkout local:

```text
C:/Users/incon/Downloads/EscritorioNobita/Proyectos_Claude/Claude_P28/Proyecto28
```

- Ya no quedan comandos apuntando a la ruta local anterior.
- El servidor Vite local verificado sale desde la ruta nueva y sirve
  `src/main.js` con `createCollectibleSpheres` y `gameLightColor`.

---

## 3. Validacion realizada antes del cierre

### Local

```powershell
npm run build
```

Resultado:

- OK.
- Warning existente: chunk `three` >500 kB.

Smoke logico de collectibles:

- 24 tiles fake.
- 6 tiles proyecto.
- 18 tiles vacios/oscuros.
- `createCollectibleSpheres(...).total === 18`.
- Con luz alineada en X/Z sobre una esfera:
  - `collectNear(...) === 1`
  - primera esfera queda oculta
  - quedan 17 visibles.

Servidor local:

- `http://127.0.0.1:5173/` responde `HTTP 200`.
- Proceso `node.exe` de Vite apunta a:
  `C:\Users\incon\Downloads\EscritorioNobita\Proyectos_Claude\Claude_P28\Proyecto28`.
- `http://127.0.0.1:5173/src/main.js` incluye
  `createCollectibleSpheres`, `gameLightColor`, `BEST_TIME_KEY` y
  `startSphereRun`.

### Produccion/Strapi predeploy

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

Resultado predeploy:

- site `200`
- robots `200`
- sitemap `200`
- projects `200`
- site-setting `200`
- admin-whitelists `403`
- `inconcha@gmail.com` => `{ allowed:true, role:"owner" }`
- `yk8arts@gmail.com` => `{ allowed:true, role:"editor" }`

Nota: antes del deploy de `v0.21.0`, Strapi Cloud todavia puede no exponer
`gameLightColor` en `/api/site-setting`. Eso se espera hasta que Strapi Cloud
reconstruya `cms/**` desde `main`.

### Produccion postdeploy v0.21.0

- Commit desplegado por Pages: `6e8efa0`.
- GitHub Pages run: `26690318569` => success.
- Auto-tag run: `26690318568` => success con `[skip-tag]`; tag manual al final
  del cierre.
- Produccion:
  - `https://proyecto28.com` => `200`
  - `https://proyecto28.com/robots.txt` => `200`
  - `https://proyecto28.com/sitemap.xml` => `200`
- Bundle vivo:
  - asset `assets/index-Dsng2GHA.js`
  - contiene `p28-sphere-best-time-ms-v1`
  - contiene `gameLightColor`
  - contiene `Gema rojiza`
  - contiene `p28-collectible-spheres`
- Strapi Cloud:
  - `/api/site-setting` incluye `"gameLightColor":"cyan"`
  - `updatedAt` => `2026-05-30T17:33:05.966Z`

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

Valores aceptados:

- `cyan`
- `red`
- `green`

### Como probar el mini-juego

1. Abrir `https://proyecto28.com` despues del deploy.
2. Hacer hard refresh si el navegador conserva assets viejos.
3. Controlar la luz con `W/A/S/D`, flechas o gamepad.
4. Las esferas deben aparecer solo mientras la luz esta controlada.
5. Tocar cada esfera por cercania.
6. Confirmar contador `Esferas`, `Tiempo` y `Mejor`.
7. Al terminar todas, el timer queda detenido y la luz brilla dorado 1 segundo.
8. Mover el mouse o caer al vacio debe reiniciar timer/contador y ocultar o
   reaparecer esferas segun corresponda.

### Pixel Streaming

GitHub Pages no ejecuta Unreal. El stream vive en infraestructura GPU externa y
el frontend solo monta iframe si Strapi entrega configuracion valida.

Para apagar el preview/fallback:

```text
Admin -> Tweaks -> Streaming -> Preview visible OFF -> PUBLICAR CAMBIOS
```

### Agregar proyecto

Crear/duplicar Project en Strapi, completar contenido/popup/modelo/redirect y,
si aplica, `unrealStreamURL` + `unrealLevelName`. Procedimiento completo:
`RUNBOOK.md` seccion "Agregar un proyecto nuevo".

---

## 5. Deploy esperado

Flujo correcto:

1. Trabajar en rama `etapa-17-pacman-luz`.
2. Commit funcional/documental.
3. Push de rama.
4. Merge a `main` con commit `feat(...) [skip-tag]` para evitar auto-tag antes
   de validar produccion.
5. GitHub Pages despliega porque se tocaron `src/**` - OK run `26690318569`.
6. Strapi Cloud reconstruye porque se tocaron `cms/**` - OK,
   `/api/site-setting` incluye `gameLightColor`.
7. Verificar `https://proyecto28.com` y endpoints Strapi - OK.
8. Actualizar handoff con evidencia final - OK.
9. Crear/pushear tag `v0.21.0`.
10. Copiar handoff al Google Doc como subpestana bajo `Handoff`.

---

## 6. Riesgos y pendientes

- `proyecto28.cl` no es canonico hasta cerrar DNS/certificado/redirect.
- Google OAuth consent screen puede seguir en Testing; al agregar emails a
  Strapi, tambien agregarlos como test users en Google Cloud.
- `Project` no usa Draft & Publish para evitar el choque entre el campo
  editable `status` y el `status` interno de Strapi v5.
- Pixel Streaming real depende de servidor GPU externo, TLS, costos y
  auto-suspend.
- El mejor tiempo del mini-juego es local por navegador; no existe leaderboard
  remoto todavia.
- La etapa 17 esta enfocada en desktop/gamepad. Mobile solo entra si el
  navegador/dispositivo expone gamepad compatible.

---

## 7. Google Doc

Respaldo oficial:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Regla:

- Crear/copiar el cierre como subpestana bajo `Handoff`.
- No crear cierres como pestanas raiz.
- Titulo esperado:

```text
2026-05-30 17:33 UTC - v0.21.0 pacman-luz-color-admin
```

Respaldo anterior:

```text
2026-05-29 21:30 UTC - v0.20.1 hover-estable-urls
```

Tab id anterior: `t.rox2yd4prf1o` bajo padre `Handoff` (`t.7lpfc5ado1h`).

---

Fin del handoff `v0.21.0`.
