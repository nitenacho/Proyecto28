# PLAN DE EVOLUCIÓN — Proyecto 28 v2

> **Fecha del plan:** 2026-05-21
> **Última actualización operativa:** 2026-05-31 — `v0.24.0` Etapa 20 Split-screen touch joystick
> **Owner:** @nitenacho (cnignacioa@gmail.com / Inconcha@gmail.com)
> **Alcance:** Convertir Proyecto28 en una experiencia 3D inmersiva con juego de plataformas + Pixel Streaming de Unreal Engine + pipeline de publicación admin-only.
> **Status:** En ejecución — etapas 1-20 cerradas. `v0.24.0` reemplaza el control mobile por pantalla dividida tactil: joystick dinamico izquierdo y salto dedicado derecho, habilitados solo por el boton amarillo del HUD.

## Estado del plan al 2026-05-31 America/Santiago

| Etapa | Estado | Tag | Commit |
|---|---|---|---|
| 1 — Fundación versionado | ✅ Cerrada | `v0.2.0` | `0da2c23` |
| 2 — Strapi schema extendido | ✅ Cerrada | `v0.3.0` | `d61fec6` |
| 3 — Frontend data layer | ✅ Cerrada | `v0.4.0` | `00968cc` |
| 4 — Luz controlable | ✅ Cerrada | `v0.5.0` | — |
| 5 — Físicas Kirby | ✅ Cerrada | `v0.6.0` | — |
| 6 — Cubos + respawn + contador | ✅ Cerrada | `v0.7.0` | — |
| 6 polish — CCD + spawn + sombra + tweaks juego | ✅ Cerrada | `v0.8.0` | — |
| 6 polish 2 — sombra anillo + flechas + gamepad | ✅ Cerrada | `v0.9.0` | — |
| 6 polish 3 — defaults persistidos | ✅ Cerrada | `v0.9.2` | — |
| 7 — Tweaks ocultos + adminMode | ✅ Cerrada | `v0.10.0` | — |
| 7 cierre — sliders + localStorage | ✅ Cerrada | `v0.11.0` | — |
| 8 — Botón admin secreto | ✅ Cerrada | `v0.12.0` | — |
| 9 — Google OAuth + whitelist | ✅ Cerrada | `v0.13.0` | — |
| 10 — Popup mejorado + mobile | ✅ Cerrada | `v0.14.0` | — |
| 10 hotfix — Responsive root cause | ✅ Cerrada | `v0.14.6` | `b96ddbb` |
| 10 docs — Handoff completo Google Doc | ✅ Cerrada | `v0.14.7` | — |
| 11 — Pixel Streaming Unreal | ✅ Cerrada | `v0.15.0` | `f5b0c42` |
| 12 — Pipeline Publicar | ✅ Cerrada | `v0.16.0` | `c0590e4` |
| 12 hotfix — Publish Google token | ✅ Cerrada | `v0.16.1` | `8465330` |
| 13 — Sync Claude Design | ✅ Cerrada | `v0.17.0` | `ec9355d` |
| 13 hotfix — Release asset auto-tag | ✅ Cerrada | `v0.17.1` | `fcb488a` |
| 14 — GSAP polish | ✅ Cerrada | `v0.18.0` | `f84a391` |
| 15 — Performance + a11y | ✅ Cerrada | `v0.19.0` | — |
| 16 — Documentación final | ✅ Cerrada | `v0.20.0` | — |
| 17 — Pacman de luz + color admin | ✅ Cerrada | `v0.21.0` | — |
| 18 — Mobile parity + audio interactivo | ✅ Cerrada | `v0.22.0` | — |
| 19 — Control discoverable + gyro/gamepad | ✅ Cerrada | `v0.23.0` | `f386de6` |
| 20 — Split-screen touch joystick | ✅ Cerrada | `v0.24.0` | `b9aaeb5` |

## Decisiones tomadas durante la ejecución (resoluciones al §1)

- **§1.1 Pixel Streaming infra:** ✅ 1 instancia compartida con switch de Level
  desde la stream. Servidor GPU separado (a configurar en pre-requisitos de
  Etapa 11). Budget esperado $50-150/mes.
- **§1.2 Google OAuth:** ✅ Resuelto en Etapa 9. Google Identity Services +
  whitelist Strapi `/api/auth/check` funcionando en producción.
- **§1.3 Discord bot:** ✅ Primer corte resuelto como webhook opcional
  `DISCORD_WEBHOOK_URL`; bot real queda integracion externa si se define.
- **§1.4 Claude Design:** ✅ Resuelto para el primer corte como tokens CSS en
  repo. `src/styles/tokens.css` es fuente de verdad; `sync-design.yml` exporta
  `claude-design-export` como artifact y como release asset en tags `v*`.
- **§1.5 Detalles del juego:** ✅ Defaults documentados en Strapi
  `SiteSetting` y reflejados en `src/data/fallback.js`. Ajustables vía
  panel de tweaks una vez exista (Etapas 7+). Etapa 17 agrega recoleccion de
  esferas, cronometro, mejor tiempo local y color de luz `cyan/red/green`.
  Etapa 18 agrega audio interactivo configurable (`midi/glass/soft` + volumenes)
  y restaura calidad visual desktop en mobile. Etapa 19 agrega boton minimo en
  HUD para tomar/soltar control de la luz, D-pad/flechas de gamepad, giroscopio
  mobile y toque tactil para saltar. Etapa 20 reemplaza giroscopio/touch global
  por split-screen touch: joystick dinamico izquierdo y salto dedicado derecho,
  sin dependencia externa.
- **§1.6 Admin Strapi:** ✅ Admin operativo. Fix aplicado: `Project` no usa
  Draft & Publish para evitar el choque entre el campo editable `status` y el
  `status` interno de Strapi v5.

## Ajustes al flujo aprendidos durante la ejecución

1. **El plan vive ahora dentro del repo** (`Proyecto28/PLAN-PROYECTO28-V2.md`)
   y no en el directorio padre. Esto garantiza que el próximo agente IA lo
   encuentra sin tener que conocer el path local del owner.
2. **Branch por etapa funcionó bien** (etapa-1-versionado, etapa-2-strapi-schema,
   etapa-3-frontend-data-layer). Merge fast-forward a main al cierre.
3. **CHANGELOG + tag al cierre de etapa** es disciplina sostenible.
4. **Cambios solo a docs** (CHANGELOG/README/HANDOFF/PLAN) pueden ir
   directos a main con tag patch `v0.X.Y` si urge. Ya se aplicó: `v0.4.1`
   para los docs de transición a nuevo agente.
5. **Google Doc backup quirks documentados** — ver `HANDOFF-LATEST.md` §9
   para la lista de gotchas y la regla estructural obligatoria: cada respaldo
   debe quedar como subpestaña bajo el tab raíz `Handoff`, nunca como pestaña
   raíz. El próximo agente debe tomar siempre la última subpestaña de
   `Handoff`.
6. **Respaldo Google Doc debe ser completo, no sólo breve** — el cierre
   `v0.14.6` quedó primero demasiado resumido (aprox. 3 páginas). Fue ampliado
   y versionado como `v0.14.7` para que el siguiente agente tenga contexto
   operativo suficiente.

---

## 0. RESUMEN EJECUTIVO

### Lo que se va a construir
Una evolución mayor de proyecto28.com que combina:

1. **Mini-juego de plataformas** sobre el grid de cubos: una "luz" controlable con WASD/espacio que sigue al mouse cuando está quieta, salta estilo Kirby (4 saltos), tiene gravedad, y respawnea al caer.
2. **Pixel Streaming de Unreal Engine** sobre el cubo activo (el que la luz pisa): cada cubo es una instancia distinta de un proyecto Unreal de Proyecto28.
3. **Sistema de tweaks gobernado por rol admin** con Google OAuth, lista blanca de 2 correos, botón secreto debajo del logo, y publicación al CMS vía bot de Discord existente.
4. **Mobile vertical rediseñado** con cubos separados, popup full-screen y double-tap-to-redirect.
5. **Animaciones GSAP** en transiciones, popups y feedback de juego.
6. **CMS Strapi extendido** para gestionar contenido por cubo: imágenes, videos, GLB, URLs de streaming Unreal y assets de popup imagen+texto.

### La regla maestra (versionado)
**Cada cambio funcional sigue este flujo, sin excepciones:**

```
1. Code change (local)
2. git commit + git push (main)
3. GitHub Actions: build + deploy GH Pages
4. Trigger automático: sync Claude Design package
5. Trigger automático: sync Strapi (si cambió schema o seed)
6. Tag semver v0.X.Y
7. Documentar en CHANGELOG.md
```

Sin push no hay deploy. Sin tag no hay versión. Sin sync, los entornos divergen.

---

## 1. DECISIONES BLOQUEANTES (input requerido del user antes de ejecutar)

Estos puntos requieren respuesta explícita o son riesgo de retrabajo grande.

### 1.1 Pixel Streaming — Infraestructura
**El problema:** Unreal Pixel Streaming necesita un servidor con GPU (NVIDIA recomendado), el Unreal Engine corriendo en modo Pixel Streaming + un Signaling Server (Node.js + WebRTC). **NO se puede ejecutar dentro de GitHub Pages (estático)** ni dentro de Strapi Cloud.

| Pregunta | Opciones razonables |
|---|---|
| ¿Dónde correrá el servidor de streaming? | AWS g4dn.xlarge (~$0.50/h), Azure NV6, GCP n1-standard-4 con T4, o servidor on-prem |
| ¿Cuántas instancias simultáneas? | 1 compartida (todos los cubos muestran la misma stream, switch via UE Levels) **vs.** 6 instancias paralelas (1 por cubo, costo x6) |
| ¿Budget mensual aceptable? | Estimado: $50-100/mes con 1 GPU shared / $300-600/mes con 6 GPUs |
| ¿Hay proyectos Unreal ya empaquetados? | Si no, primero hay que crearlos/empaquetarlos antes de poder streamear |
| ¿Quién mantiene el servidor de streaming? | Auto-suspend cuando nadie está jugando para no quemar GPU 24/7 |

**Recomendación técnica:** Empezar con **1 instancia Unreal compartida** que usa Levels o Sub-Levels para alternar entre los 6 "proyectos". Mucho más barato y suficiente para una demo. Si el negocio lo justifica, escalar a multi-instance.

### 1.2 Google OAuth
| Pregunta | Default propuesto |
|---|---|
| ¿Cliente OAuth propio o vía Firebase Auth? | **Google Identity Services (GIS)** plano — menos dependencias, suficiente para 2 correos |
| ¿Qué OAuth scopes? | Solo `openid email profile` |
| ¿Dónde se valida el JWT del lado seguro? | **Strapi custom endpoint** que valida con la public key de Google y compara email contra whitelist |
| Whitelist | `inconcha@gmail.com`, `yk8arts@gmail.com` (hard-coded en backend, no en frontend) |

### 1.3 Discord Bot
| Pregunta | Detalle |
|---|---|
| ¿Token del bot existente? | Necesito saber qué scopes/intents tiene |
| ¿En qué lenguaje está? (Node/Python/Go) | Define cómo extiendo el comando |
| ¿Tiene endpoint HTTP propio o solo escucha mensajes? | Si solo escucha → publicar dispara un webhook a un canal específico → bot lee → ejecuta |
| ¿Permisos en GitHub? | ¿Puede commitear? ¿Solo abre PRs? ¿Tiene PAT propio? |
| ¿Permisos en Strapi? | ¿Tiene API token de Strapi con role custom? |

### 1.4 Claude Design — qué significa "actualizar"
El handoff menciona "actualizar Claude Design" pero no define el mecanismo.

**Pregunta concreta:** ¿Claude Design es:
- (a) Un paquete npm publicado (privado/público)
- (b) Un repo Git separado que se consume vía submodule
- (c) Una carpeta dentro del monorepo
- (d) Tokens CSS sueltos que viven en `src/styles/tokens.css`

**Default asumido en el plan:** (d) — sincronizar significa que cada vez que se cambian tokens en el repo de design, se hace un commit al repo Proyecto28 que copia los archivos actualizados.

### 1.5 Detalles del juego
| Pregunta | Default propuesto |
|---|---|
| ¿Velocidad inicial de la luz? | 8 unidades/seg (ajustable por tweak) |
| ¿Altura de salto base? | 3 unidades (Kirby usa salto pequeño-mediano) |
| ¿Cuántos saltos antes de caer? | 4 (especificado por user) |
| ¿La luz hace daño/score en algo? | No, solo enciende cubos y respawnea al caer |
| ¿Mouse follow desactiva WASD? | No, ambos coexisten: WASD prioriza, mouse follow se activa si pasan >1s sin input WASD |
| ¿El contador de caídas se persiste? | No (resetea on reload), solo display local |

### 1.6 Pendientes heredados del handoff v1
Antes de empezar este plan v2, idealmente:
- Crear admin de Strapi Cloud (`/admin` signup pendiente)
- Validar UI actual en browser (sin probar)
- Confirmar que `.cl` redirige a `.com` post-propagación DNS

---

## 2. ARQUITECTURA OBJETIVO

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USUARIO (browser)                          │
│  - Three.js scene (cubos + luz controlable + popup)                 │
│  - GSAP timelines (entrada, hover, popup, feedback de salto)        │
│  - <iframe> Pixel Streaming sobre cubo activo                       │
│  - Google Identity Services SDK (solo si admin clickea boton)       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│                  GitHub Pages (proyecto28.com)                       │
│  Bundle Vite estático con VITE_CMS_URL embebido                      │
│  Solo lectura: no hay backend aquí                                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ fetch /api/projects /api/site-setting
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│              Strapi Cloud (honest-candy-...strapiapp.com)            │
│  - Project (extendido: campos Unreal, popupImage, popupBody, ...)    │
│  - SiteSetting (extendido: tweaks publicados, gameDefaults, ...)     │
│  - AdminUser (nuevo content type: whitelist Google emails)           │
│  - Endpoint custom: POST /api/publish (auth con Google JWT)          │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ webhook on publish
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│                       Discord Bot (existente)                        │
│  Recibe payload de tweaks → escribe en repo via GitHub API +         │
│  invoca API de Strapi con su token → dispara redeploy GH Pages       │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Pixel Streaming Server (separado, GPU, no GH Pages)                 │
│  - Unreal Engine 5.x con plugin Pixel Streaming                      │
│  - Signaling Server (Node.js + WebRTC)                               │
│  - URL pública: ej. stream.proyecto28.com                            │
│  - Frontend conecta via iframe o WebRTC directo                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Flujos clave

**Flujo "jugar":**
1. Usuario carga `proyecto28.com`
2. Frontend fetch `/api/projects` y `/api/site-setting` → guarda tweaks publicados
3. Three.js render con luz centrada
4. Usuario mueve mouse → luz sigue al mouse
5. Usuario presiona WASD → luz se mueve por física, mouse follow se desactiva
6. Luz cae sobre cubo X → cubo X enciende + iframe Pixel Streaming carga URL del cubo X
7. Luz cae al vacío → animación 1s → respawnea en cubo centro, contador +1

**Flujo "publicar" (admin):**
1. Admin clickea botón secreto (zona invisible bajo el logo)
2. Aparece prompt Google OAuth
3. Google devuelve JWT con email
4. Frontend valida email contra whitelist en cliente (UX) → muestra panel de tweaks
5. Admin ajusta sliders → estado local
6. Admin clickea "Publicar"
7. Frontend POST `/api/publish` con JWT + payload de tweaks
8. Strapi valida JWT con Google + email en whitelist server-side
9. Si OK → Strapi actualiza SiteSetting + emite webhook a Discord bot
10. Discord bot escribe en canal de log + dispara GitHub Action de redeploy (opcional)
11. GitHub Action: build Vite + deploy GH Pages
12. Usuarios nuevos cargan tweaks publicados; usuarios activos opcionalmente reciben WebSocket update (out of scope inicial)

---

## 3. PROTOCOLO DE VERSIONADO (REGLA MAESTRA)

### 3.1 Cada cambio = ciclo completo
```
feature/fix → commit → push origin main → GH Actions deploy → tag → CHANGELOG → sync Claude Design → sync Strapi (si aplica)
```

### 3.2 Convención de tags
- `v0.2.0` — Etapa 2 completada
- `v0.2.1` — Patch dentro de etapa 2
- `v1.0.0` — Cuando todas las etapas del plan estén verificadas

### 3.3 Estructura de commit
```
<type>(<scope>): <subject>

[body]

[footer: refs etapa, breaking changes]
```
- `type`: feat | fix | docs | chore | refactor | test
- `scope`: scene | popup | tweaks | strapi | auth | streaming | discord | a11y

### 3.4 Sincronización automatizada Claude Design
**Mecanismo propuesto** (a definir según respuesta a §1.4):

Si Claude Design vive como tokens CSS en `src/styles/`:
- Job en GitHub Action que, on push a main, copia `src/styles/tokens.css` a un branch separado `claude-design-export` para consumo externo (si aplica).
- Si no hay consumidor externo → este paso es no-op.

Si Claude Design es un repo separado:
- Submodule + workflow `git submodule update --remote` en CI.

### 3.5 Sincronización automatizada Strapi
Strapi Cloud ya hace **"Deploy on commit"** automático cuando se pushea a `main` con cambios en `cms/`. **Esta capa ya funciona**. Solo hay que asegurarse que:
- Cambios de schema (`cms/src/api/**/schema.json`) disparan migration en Strapi Cloud
- Cambios de bootstrap (`cms/src/index.js`) se reflejan en el seed inicial (no re-seedean existentes — el bootstrap actual chequea `count === 0`)

### 3.6 CHANGELOG.md
Archivo a crear en raíz, formato Keep-a-Changelog. Cada tag = una sección.

---

## 4. ETAPAS DE IMPLEMENTACIÓN

> Cada etapa termina con commit + push + tag + (Claude Design sync + Strapi sync si aplica). **Esta regla NO se repite en cada etapa abajo, asumirla siempre.**

---

### ETAPA 1 — Fundación: versionado, CHANGELOG, scripts de sync
**Objetivo:** Establecer la regla maestra antes de tocar features. Sin esto, el resto se desordena.

**Tareas:**
1. Crear `CHANGELOG.md` en raíz con `## [Unreleased]` y la primera entrada `## [0.1.0]` correspondiente al estado actual del handoff v1.
2. Crear `VERSIONING.md` con la convención de commits, tags y el flujo de sync.
3. Crear `scripts/release.ps1` (Windows) y `scripts/release.sh` (POSIX) que:
   - Validan working tree limpio
   - Piden tag semver
   - Crean tag firmado + push
   - Generan entry de CHANGELOG vacío
4. Extender `.github/workflows/deploy.yml` con un job opcional `sync-claude-design` (placeholder por ahora — implementar real en Etapa 13).
5. Documentar todo en `README.md` (sección "Cómo contribuir").

**Archivos nuevos:** `CHANGELOG.md`, `VERSIONING.md`, `scripts/release.ps1`, `scripts/release.sh`
**Archivos modificados:** `README.md`, `.github/workflows/deploy.yml`
**Criterio de éxito:** Existe un tag `v0.1.0` en GitHub correspondiente al estado del handoff. Existe un commit posterior `v0.1.1` que añade los scripts y el CHANGELOG.
**Dependencias:** Ninguna.
**Riesgo:** Bajo. Solo es disciplina de proceso.

---

### ETAPA 2 — Extender modelo de datos en Strapi
**Objetivo:** Antes de implementar features, asegurar que el CMS puede soportarlas.

**Tareas:**
1. Extender content type **Project** con campos nuevos:
   ```
   unrealStreamURL    string       URL del signaling server para este cubo (ej. https://stream.proyecto28.com/cube-1)
   unrealLevelName    string       Nombre del Level/SubLevel en UE si se usa instancia compartida
   unrealEnabled      boolean      Toggle para mostrar streaming o solo imagen
   popupImage         media        Imagen del popup (separada de la imagen principal del cubo)
   popupBody          richtext     Texto/markdown del popup (separado de description corta)
   popupCTALabel      string       Texto del botón redirect ("Ver proyecto", "Abrir demo"...)
   videoLoop          media        Video corto opcional para loop sobre el cubo (alternativa a stream)
   ```
2. Extender content type **SiteSetting** con campos nuevos:
   ```
   gameLightSpeed         decimal  default 8.0
   gameLightJumpHeight    decimal  default 3.0
   gameLightJumpCount     integer  default 4
   gameLightGravity       decimal  default 20.0
   gameLightVelocityCurve enumeration ["linear","easeOut","easeInOut","kirby"]
   gameMouseFollowDelay   decimal  default 1.0  segundos sin input WASD antes de seguir mouse
   gameFallDuration       decimal  default 1.0  segundos de caída antes de respawn
   adminButtonVisible     boolean  default false  toggle del botón secreto bajo el logo
   pixelStreamingEnabled  boolean  default false  master switch global
   pixelStreamingPreviewEnabled boolean default false muestra fallback/preview
   pixelStreamingMode     enumeration ["shared","per-cube"]
   ```
3. Crear nuevo content type **AdminWhitelist** (collection):
   ```
   email      email     unique
   role       enumeration ["owner","editor"]
   addedAt    datetime  auto
   ```
   Seed con `inconcha@gmail.com` (owner) y `yk8arts@gmail.com` (editor).
4. Configurar permisos:
   - `Project`, `SiteSetting` → public read (ya está)
   - `AdminWhitelist` → public read **NO** (solo lectura interna o autenticada)
   - Endpoint custom `/api/publish` (Etapa 12) → autenticado via token Google
5. Actualizar `cms/src/index.js` para seedear los nuevos campos sin sobrescribir datos existentes.
6. Bumpear versión en `cms/package.json` y documentar en `cms/README.md`.

**Archivos modificados:**
- `cms/src/api/project/content-types/project/schema.json`
- `cms/src/api/site-setting/content-types/site-setting/schema.json`
- `cms/src/index.js`
**Archivos nuevos:**
- `cms/src/api/admin-whitelist/` (toda la carpeta: schema + controller + route + service)
**Criterio de éxito:** Después del push:
- `GET /api/projects` devuelve los nuevos campos (vacíos para entries existentes)
- `GET /api/site-setting` devuelve los gameLight* con defaults
- Admin de Strapi muestra los nuevos campos
- `AdminWhitelist` tiene 2 entries
**Dependencias:** Etapa 1 (versionado activo).
**Riesgo:** Medio. Cambios de schema en Strapi Cloud pueden requerir migración manual si Strapi no la genera automáticamente.

---

### ETAPA 3 — Capa de datos en frontend para los nuevos campos
**Objetivo:** Que el bundle entienda y propague los nuevos campos sin usarlos todavía.

**Tareas:**
1. Actualizar `src/data/cms.js` para mapear los campos nuevos (Project + SiteSetting).
2. Actualizar `src/data/fallback.js` con defaults razonables para los nuevos campos.
3. Validar con un `console.log` temporal en `main.js` que llegan los nuevos campos.
4. Tipar mentalmente la shape (no hay TS pero documentar en JSDoc en `cms.js`).

**Criterio de éxito:** Sin cambios visibles. `console.log` de prueba muestra los nuevos campos. CI verde.
**Dependencias:** Etapa 2 desplegada.
**Riesgo:** Bajo.

---

### ETAPA 4 — Sistema de luz controlable (sin físicas todavía)
**Objetivo:** Una esfera luminosa en la escena Three.js que responde a mouse (follow) y a WASD (movimiento direccional plano, sin gravedad aún).

**Tareas:**
1. Crear `src/game/light.js` (nuevo módulo) con:
   - `PointLight` + `Mesh` (esfera emissiva pequeña) para visibilidad
   - State: position (x,y,z), velocity (vx,vy,vz), lastWASDInput timestamp
   - Mouse follow: raycast del cursor al plano del grid, lerp suave hacia ese punto
   - WASD: Set de keys activas + update por frame con velocidad de tweaks
   - Priority: si pasó <1s desde último WASD → ignorar mouse follow
2. Integrar en `src/scene/scene.js` y `src/main.js`:
   - Inicializar la luz en el centro del grid (0, 1, 0) — encima del cubo central
   - Llamar `lightUpdate(dt)` en el render loop
3. Listeners de teclado en `src/main.js`: keydown/keyup para W/A/S/D (y luego espacio en Etapa 5).
4. Listener de mousemove ya existe para el raycast de hover de cubos — reutilizarlo.
5. Tweaks placeholder (no editables aún): leer `gameLightSpeed` desde SiteSetting.

**Criterio de éxito:**
- Al cargar, hay una esfera luminosa visible en el centro del grid
- Mover el mouse mueve la luz (sigue suavemente)
- Presionar WASD mueve la luz en X/Z (sin gravedad)
- Después de soltar WASD por 1s, vuelve a seguir el mouse
**Dependencias:** Etapa 3.
**Riesgo:** Bajo-medio. El cálculo de raycast-to-plane puede tener offset si la cámara no está alineada.

---

### ETAPA 5 — Físicas estilo Kirby (gravedad + saltos múltiples)
**Objetivo:** Sumar gravedad al eje Y de la luz, salto con espacio, hasta 4 saltos en aire estilo Kirby.

**Tareas:**
1. Extender `src/game/light.js` con:
   - `vy` (velocidad vertical)
   - `grounded` (boolean)
   - `jumpsUsed` (int, max 4)
   - Constantes desde SiteSetting: `gravity`, `jumpHeight`, `jumpCount`
2. Update loop por frame:
   - `vy -= gravity * dt`
   - `y += vy * dt`
   - Detectar grounded: si está sobre un cubo (raycast hacia abajo desde la luz) → snap a la superficie del cubo, `vy = 0`, `grounded = true`, `jumpsUsed = 0`
   - Si no detecta cubo abajo → seguir cayendo (este caso lo maneja Etapa 6 con respawn)
3. Listener space: si `jumpsUsed < jumpCount` → `vy = sqrt(2 * gravity * jumpHeight)`, `jumpsUsed++`, `grounded = false`
4. "Kirby feel": cada salto en aire es más débil que el anterior (multiplier 1.0 / 0.85 / 0.7 / 0.55 sobre la altura). Configurable en tweaks futuros.
5. Velocity curve aplicada al input WASD (linear default, otras opciones implementan curva sobre el ramp-up de velocidad).
6. Animación visual: ligera deformación de la esfera al saltar (squash + stretch) con GSAP, opcional, dejar TODO si toma tiempo.

**Criterio de éxito:**
- La luz cae si no hay cubo abajo
- Espacio salta si está sobre cubo
- En el aire, espacio salta hasta 4 veces, cada vez más bajo
- Al tocar cubo, los saltos se resetean
- WASD funciona en el aire (control aéreo, como Kirby)
**Dependencias:** Etapa 4.
**Riesgo:** Medio. El feel es subjetivo, va a requerir tuning. Documentar valores que se sienten bien.

---

### ETAPA 6 — Cubos encendidos + respawn + contador
**Objetivo:** Interacción luz-cubo + sistema de respawn al caer al vacío + contador HUD.

**Tareas:**
1. En cada frame, detectar qué cubo (si alguno) tiene la luz encima.
2. Si hay cubo → marcar ese cubo como `active`:
   - Aumentar emissive intensity del cubo
   - Cambiar color a un cyan más brillante o el copper definido por el cubo
   - Animar con GSAP (escala +5%, glow +50%) en transición de 200ms
   - Si ya había otro cubo activo → des-activarlo con transición de 200ms
3. Si NO hay cubo y la luz cae más allá de y < -10:
   - Iniciar animación de respawn:
     - GSAP timeline: la luz se desvanece (alpha 1→0) en 1s mientras sigue cayendo
     - Al final → reposicionar en (0, 5, 0) sobre cubo centro (slot Rectangle 7 ó 6, según layout actual)
     - Fade in (alpha 0→1) en 0.3s
   - `fallCounter++` y actualizar HUD
4. HUD: nuevo elemento DOM en `index.html` o creado dinámicamente:
   - Posición esquina superior derecha
   - Estilo: tokens de Claude Design (font monospace, fg-secondary, bg semi-transparente)
   - Texto: `LUCES CAÍDAS: 003`
   - Persistir solo en memoria (resetea on reload, según §1.5)
5. Estilo visual del "cubo activo" debe ser distinguible del hover normal (que es lo que pasa al pasar el mouse sin luz encima).

**Archivos nuevos:** `src/ui/hud.js`
**Archivos modificados:** `src/game/light.js`, `src/scene/scene.js`, `src/styles/app.css`
**Criterio de éxito:**
- Cubo bajo la luz se enciende visiblemente
- Solo un cubo a la vez encendido
- Caer del grid respawnea con animación y suma contador
- Contador visible en HUD
**Dependencias:** Etapa 5.
**Riesgo:** Bajo.

---

### ETAPA 7 — Tweaks panel: ocultar por default + sliders nuevos
**Objetivo:** El panel de tweaks NO debe verse al cargar. Solo se hace visible cuando el botón admin secreto está habilitado y el usuario está autenticado.

**Tareas:**
1. Modificar `src/ui/tweaks.js`:
   - Estado inicial: `display: none`
   - Exportar API `tweaks.show()` / `tweaks.hide()` / `tweaks.isVisible()`
   - Estado controlado por `window.adminMode` (boolean, default false)
2. Eliminar cualquier botón visible que abra tweaks por default (la "rueda de comandos" actual queda detrás del gate de admin).
3. Agregar al panel los sliders nuevos correspondientes a SiteSetting nuevos:
   - Game: lightSpeed, jumpHeight, jumpCount, gravity, velocityCurve (dropdown), mouseFollowDelay, fallDuration
   - Streaming: enabled (toggle), mode (dropdown)
   - Admin: adminButtonVisible (toggle, requiere ya estar como admin para verlo)
4. Persistencia local (localStorage) solo para preview en sesión actual. La persistencia real va por "Publicar" → Strapi.

**Criterio de éxito:**
- Al cargar fresh, no se ve panel ni rueda de tweaks
- `window.adminMode = true` en consola lo muestra (para QA temporal)
- Los nuevos sliders aparecen en el panel
**Dependencias:** Etapa 3.
**Riesgo:** Bajo.

---

### ETAPA 8 — Botón admin secreto debajo del logo
**Objetivo:** Una zona invisible/oculta debajo del logo de Proyecto28 que, al ser clickeada, inicia el flujo de auth admin.

**Tareas:**
1. Identificar la zona del logo en el DOM (probable `header` o similar en `index.html`).
2. Agregar un `<button>` posicionado absolutamente justo debajo del logo:
   - `opacity: 0`, sin border, sin bg, cursor default (no pointer para no delatarse)
   - Tamaño: 32x32px (un cuadrado pequeño, descubrible por accidente al clickear cerca del logo)
   - Aria-label: "Modo administrador" para accesibilidad
3. Comportamiento del botón:
   - Si `pixelStreamingEnabled` / `adminMode` toggles ya están activos → click muestra/oculta la "rueda de comandos" (entry point a tweaks)
   - Si NO está autenticado → click dispara flujo Google Sign-In (Etapa 9)
4. La "rueda de comandos" misma se implementa como un FAB (Floating Action Button) que, una vez visible, permite abrir el panel de tweaks.
5. UX: una vez autenticado y con admin activo, el click en el botón secreto solo togglea la rueda. Re-auth no se pide en cada click.

**Archivos modificados:** `index.html`, `src/ui/admin-button.js` (nuevo), `src/styles/app.css`
**Criterio de éxito:**
- Usuario regular nunca ve nada raro bajo el logo
- Click bajo el logo (sabiendo dónde) dispara el flujo
- Una vez admin: click togglea rueda de comandos
**Dependencias:** Etapa 7.
**Riesgo:** Bajo.

---

### ETAPA 9 — Google OAuth + whitelist
**Objetivo:** Login con Google que solo permite a 2 correos hardcoded acceder al modo admin.

**Tareas:**
1. **Setup en Google Cloud Console** (manual, requiere user):
   - Crear OAuth Client ID (web application)
   - Authorized JavaScript origins: `https://proyecto28.com`, `https://proyecto28.cl`, `http://localhost:5173` (dev)
   - Authorized redirect URIs: las mismas (GIS no usa redirect en flow popup pero por compatibilidad)
   - Copiar `client_id`
2. Agregar `client_id` como `VITE_GOOGLE_CLIENT_ID` secret en GH Actions + en `.env.example`.
3. Implementar en frontend (`src/auth/google.js` nuevo):
   - Cargar GIS script lazy (solo cuando se clickea botón secreto)
   - Llamar `google.accounts.id.prompt()` o `renderButton()`
   - On success → obtener `credential` (JWT id_token)
   - Decodificar JWT en cliente (solo para UX, no validación de seguridad)
   - Verificar email contra whitelist local (UX rápido)
   - Si OK → `window.adminMode = true`, `tweaks.show()`, mostrar rueda
4. Implementar validación server-side en Strapi (`cms/src/api/admin-whitelist/controllers/`):
   - Nuevo endpoint custom `POST /api/admin/verify` que:
     - Recibe el JWT
     - Lo valida contra Google public keys (librería `google-auth-library`)
     - Verifica email en whitelist (collection AdminWhitelist)
     - Devuelve un Strapi-issued JWT con scope `admin:publish`
5. Sesión: guardar el Strapi JWT en `sessionStorage` (no localStorage por seguridad). Expira on tab close.
6. Logout: botón en panel de tweaks que limpia sesión + recarga.

**Archivos nuevos:** `src/auth/google.js`, `cms/src/api/admin-whitelist/controllers/verify.js`, `cms/src/api/admin-whitelist/routes/verify.js`
**Criterio de éxito:**
- Clickear botón secreto abre Google Sign-In
- Login con `inconcha@gmail.com` → admin mode ON
- Login con cualquier otro correo → error visible "no autorizado"
- Refresh → sigue auth en misma tab; cerrar tab → re-auth
**Dependencias:** Etapa 8, Etapa 2 (AdminWhitelist content type).
**Riesgo:** Medio. OAuth siempre tiene fricciones de config (origins, CSP, COOP/COEP headers — GIS necesita `Cross-Origin-Opener-Policy: same-origin-allow-popups`).

---

### ETAPA 10 — Popup mejorado (imagen + texto, mobile vertical)
**Objetivo:** Rediseñar el popup para soportar imagen prominente + texto rico + comportamiento mobile distinto.

**Tareas:**
1. Diseño visual del popup (desktop):
   - Layout: imagen a la izquierda (40%), texto a la derecha (60%)
   - `popupImage` del Project + `popupBody` (richtext) + `popupCTALabel`
   - Fallback: si no hay imagen, layout solo texto
2. Mobile vertical (<768px):
   - Popup ocupa 90% de viewport
   - Position: fixed centro
   - Imagen arriba (40% alto), texto abajo (60%)
   - Font auto-scale para legibilidad (clamp(14px, 4vw, 18px))
   - Backdrop semi-transparente al rededor
3. Comportamiento de interacción:
   - **Desktop:** hover sobre cubo → popup aparece (igual que ahora). Click cubo → redirect.
   - **Mobile vertical:** Tap cubo → popup aparece (en lugar de hover). Tap fuera del popup → cierra. Tap dentro del popup → redirect a `redirectURL`.
4. Detección mobile: media query + `pointer: coarse` para detectar touch.
5. Animaciones GSAP:
   - Entrada del popup: fade + slide-up (200ms ease-out)
   - Salida: fade + slide-down (150ms ease-in)
6. Espaciado de cubos en mobile vertical:
   - En `src/scene/scene.js`, detectar viewport orientation
   - Si `aspectRatio < 0.7` → aumentar gap entre cubos en 50% y alejar cámara
   - Recalcular en `window.resize`

**Archivos modificados:** `src/ui/popup.js`, `src/scene/scene.js`, `src/styles/app.css`, `src/styles/three-host.css`
**Criterio de éxito:**
- Desktop: hover muestra popup nuevo con imagen+texto, click redirige
- Mobile: tap muestra popup, tap fuera cierra, tap dentro redirige
- Cubos separados en mobile vertical
- Font siempre legible (test en 320px width mínimo)
**Dependencias:** Etapa 2 (campos popupImage/popupBody en Strapi).
**Riesgo:** Medio. UX mobile requiere testing real en dispositivo.

---

### ETAPA 11 — Pixel Streaming: integración inicial (1 instancia compartida)
**Objetivo:** Cuando la luz está sobre un cubo, mostrar el streaming de Unreal Engine encima del cubo (overlay o iframe en posición 3D).

**Estado cierre `v0.15.0`:** cerrado el primer corte solicitado por owner:
iframe/overlay/fallback. No se conecto aun un endpoint Unreal real, pero el
frontend ya queda preparado para cargarlo desde Strapi cuando exista
`unrealStreamURL` valida. El preview fallback se controla con
`pixelStreamingPreviewEnabled` / tweak **Preview visible** y queda apagado por
default en produccion.

**Tareas pre-requisito (infra, requiere user):**
1. Levantar servidor GPU con Unreal Engine empaquetado en modo Pixel Streaming.
2. Levantar Signaling Server (Node.js — el oficial de Epic).
3. Configurar TLS para el signaling server (Let's Encrypt).
4. Publicar en `stream.proyecto28.com` (subdominio nuevo en Cloudflare).
5. Validar que `https://stream.proyecto28.com` carga la stream desde un browser test.

**Tareas en el repo:**
1. Crear módulo `src/streaming/pixelStream.js`:
   - Embebe el player oficial de Pixel Streaming (Epic provee un JS player) o usa WebRTC directo
   - Acepta una URL de signaling y monta el video en un `<canvas>` o `<video>` overlay
2. Crear un overlay HTML/Three.js sobre el cubo activo:
   - Opción A: `<iframe>` HTML posicionado en pantalla mediante proyección 3D→2D de la posición del cubo (más simple)
   - Opción B: textura WebRTC aplicada como material de un plano 3D sobre el cubo (más complejo pero más immersivo)
   - **Recomendación:** Empezar con A.
3. Logic de switch:
   - Cuando un cubo se vuelve activo (Etapa 6), enviar comando al Unreal Engine vía Pixel Streaming "input channel" (`emitUIInteraction`) para cambiar el Level/SubLevel.
   - Mensaje: `{"command":"showProject","projectId":"028.A"}`
   - El Blueprint en UE escucha y conmuta Level.
4. Toggle global en SiteSetting (`pixelStreamingEnabled`): si está OFF, el sistema no carga el iframe y usa un placeholder (la imagen del Project actual sobre el cubo).

**Archivos nuevos:** `src/streaming/pixelStream.js`, `src/streaming/streamOverlay.js`
**Criterio de éxito:**
- Con `pixelStreamingEnabled = true` y URL válida, al pisar un cubo aparece el iframe sobre él
- Cambiar de cubo → el iframe recibe `postMessage` con `showProject`
- Con `pixelStreamingPreviewEnabled = false` y sin URL real → no se carga preview ni WebRTC
- Con preview habilitado en dev → fallback visible y responsive sin reabrir overflow
**Dependencias:** Primer corte repo cerrado. Servidor GPU/signaling real queda como dependencia externa para conectar stream verdadero.
**Riesgo:** **ALTO**. Esta es la etapa más compleja del plan. Latencia, NAT traversal, costos GPU, ancho de banda, autenticación del signaling server. Documentar todo.

---

### ETAPA 12 — Pipeline "Publicar": Tweaks → Discord Bot → Strapi
**Objetivo:** Que el admin pueda ajustar sliders + clickear "Publicar" y se persistan en Strapi + se redespliegue el sitio.

**Estado 2026-05-25:** CERRADA en `v0.16.0`. Primer corte implementado como
Tweaks → Strapi + `PublishLog`; Discord queda opcional vía webhook si existe
`DISCORD_WEBHOOK_URL`.

**Tareas:**
1. Botón "Publicar" en panel de tweaks (visible solo en admin mode):
   - Texto: "PUBLICAR CAMBIOS"
   - Loading state mientras se procesa
   - Success/error feedback
2. Frontend → Strapi (`POST /api/publish`):
   - Headers: `Authorization: Bearer <google-id-token-or-access-token>` (del
     flujo Google admin)
   - Body: snapshot completo de tweaks actuales + diff vs SiteSetting actual
3. Strapi endpoint custom `POST /api/publish`:
   - Verificar token Google contra Google + `AdminWhitelist`
   - Validar payload (allow-list de campos modificables)
   - Actualizar SiteSetting
   - Emitir webhook Discord opcional (URL desde env var `DISCORD_WEBHOOK_URL`)
   - Devolver 200 con el nuevo estado
4. Discord bot (modificación externa al repo del frontend):
   - Recibe webhook con payload
   - Postea mensaje en canal `#proyecto28-deploys` con resumen de cambios
   - (Opcional) Dispara `gh workflow run` para redeploy si hubo cambios que requieren rebuild (ej. cambios de imágenes)
5. Frontend live update (opcional, simple):
   - Después de publicar, frontend hace `fetch /api/site-setting` y aplica cambios en caliente sin reload
6. Audit log (opcional pero recomendado):
   - Strapi guarda cada publish en un nuevo content type `PublishLog` con timestamp + email + diff

**Archivos nuevos:**
- `cms/src/api/site-setting/routes/01-publish.js`
- `cms/src/api/publish-log/`
- `src/admin/publish.js` (lógica frontend)
**Archivos modificados:** `src/ui/tweaks.js`, `src/auth/google.js`,
`src/main.js`, `src/data/cms.js`, `cms/src/api/site-setting/controllers/site-setting.js`,
`cms/src/api/site-setting/content-types/site-setting/schema.json`,
`cms/src/index.js`.
**Criterio de éxito:**
- Admin clickea "Publicar" → tweaks se guardan en Strapi.
- Otros usuarios al recargar ven los nuevos valores.
- Audit log visible en admin Strapi.
- Discord recibe mensaje si `DISCORD_WEBHOOK_URL` está configurado.
**Dependencias:** Etapa 9, Etapa 7. Discord bot existente accesible.
**Riesgo residual:** Medio. La integración con bot real depende de su arquitectura (§1.3 sin respuesta); el webhook no bloquea publish.

---

### ETAPA 13 — Sync automatizado Claude Design + GitHub
**Objetivo:** Cerrar el ciclo de "actualizar Claude Design y Strapi después de cada push".

**Estado 2026-05-29:** CERRADA en `v0.17.0` usando la opcion segura
`Claude Design = tokens CSS en repo`.

**Tareas (depende de respuesta §1.4):**

**Si Claude Design = tokens CSS en repo:**
1. Workflow `.github/workflows/sync-design.yml`:
   - On push to main que toque `src/styles/tokens.css`
   - Exporta `claude-design-export` con `tokens.css`, `tokens.json`,
     `manifest.json` y `README.md`
   - Publica como workflow artifact y como release asset en GH Releases del
     propio repo para tags `v*`

**Si Claude Design = paquete npm:**
1. Workflow que en push a main bumpa version, publica a npm registry, y triggers downstream consumers via repository_dispatch.

**Si Claude Design = no aplica (solo nombre interno):**
1. Skip esta sub-etapa, documentar.

**Strapi sync (ya automático vía Strapi Cloud "deploy on commit"):**
1. Verificar que `cms/` cambia disparan redeploy.
2. Si no, configurar webhook GitHub → Strapi Cloud build.

**Tareas adicionales:**
3. Workflow `.github/workflows/auto-tag.yml`:
   - On push to main con mensaje `feat:` o `fix:` → calcular siguiente semver y crear tag automático
   - Reemplaza o complementa el script manual de Etapa 1

**Criterio de éxito:**
- Push de feature dispara: GH Pages deploy + Claude Design sync (si toca tokens/workflow/script) + tag automático. Strapi Cloud sigue como deploy-on-commit para cambios `cms/**`.
**Dependencias:** §1.4 resuelto, Etapa 1.
**Riesgo:** Bajo si §1.4 es claro. Alto si hay sistemas externos sin acceso.

---

### ETAPA 14 — GSAP polish + animaciones premium
**Objetivo:** Elevar la sensación de calidad con animaciones bien orquestadas.

**Estado:** ✅ Cerrada en `v0.18.0` (2026-05-29).

**Resultado implementado:**
- `gsap@3.15.0` instalado.
- `src/animations/timelines.js` creado con timelines reutilizables para grid,
  cubos, popup, luz, HUD y overlay Pixel Streaming.
- Entrada secuencial de cubos con stagger `80ms`.
- Activación/desactivación de cubos con lift, scale y glow via GSAP.
- Popup mantiene placements `side`/`cursor`/`corner`, pero anima contenido con
  fade + slide-up.
- Luz controlable recibe squash/stretch al saltar, aterrizar y respawnear.
- HUD `Luces caídas` rebota con timeline GSAP.
- Overlay Pixel Streaming/fallback entra con scale + blur sutil.
- `vite.config.js` separa GSAP en chunk `assets/gsap-*.js`.

**Validación local cierre:**
- `npm run build` OK.
- Chunk principal post-GSAP: `646.63 kB` / `170.33 kB` gzip.
- Chunk GSAP separado: `70.46 kB` / `27.81 kB` gzip.
- Desktop local: hover cubo `028.C`, popup visible, sin errores de consola.
- Responsive local:
  - phone `390x844`: `body=390`, `html=390`, `canvas=390`.
  - tablet portrait `810x1080`: `body=810`, `html=810`, `canvas=810`.

**Tareas:**
1. Instalar GSAP (`npm i gsap`) — desde 2024 es 100% gratuito incluyendo SplitText y MorphSVG.
2. Crear `src/animations/timelines.js` con timelines reutilizables:
   - `entranceTimeline()`: aparición secuencial de los 6 cubos al cargar la página (stagger 80ms, ease.out)
   - `cubeActivateTimeline(cube)`: scale + glow al activarse
   - `cubeDeactivateTimeline(cube)`: reverse del anterior
   - `popupEnterTimeline(popup)`: fade + slide-up
   - `popupExitTimeline(popup)`: reverse
   - `lightSquashTimeline(light)`: squash & stretch al saltar (Etapa 5)
   - `lightFallTimeline(light)`: animación de caída + respawn (Etapa 6)
   - `hudCounterTimeline(value)`: rebote del número en HUD al incrementar
3. Integrar en cada etapa anterior:
   - Reemplazar los `lerp` improvisados o transitions CSS por timelines GSAP donde tenga sentido
4. ScrollTrigger (opcional): si hay scroll en mobile, hacer parallax sutil del fondo.

**Criterio de éxito:**
- La página "se siente" más viva, con transiciones suaves
- No hay jank — GPU layer correctamente
- Bundle no crece más de 50KB por GSAP
**Dependencias:** Etapas 4, 6, 10 (lo que se quiera animar).
**Riesgo:** Bajo. GSAP es estable y bien documentado.

---

### ETAPA 15 — Performance, responsive deep-dive, accesibilidad
**Estado:** ✅ Cerrada en `v0.19.0`.
**Objetivo:** Hardening final antes de v1.0.0.

**Tareas:**
1. **Performance:**
   - Code-splitting en Vite (`vite.config.js`): separar Three.js, GSAP, Pixel Streaming en chunks
   - Lazy load de Pixel Streaming player (solo si admin lo habilita o usuario interactúa)
   - Image optimization: webp para popupImage, lazy load
   - Lighthouse perf target: >85 desktop, >70 mobile
2. **Responsive:**
   - Test en 320px, 375px, 414px, 768px, 1024px, 1440px, 1920px
   - Mobile vertical (Pixel/iPhone real): cubos separados, popup full-screen, tap funcional
   - Mobile horizontal: layout estándar
   - Tablet: layout intermedio
3. **Accesibilidad:**
   - Tab navigation por los cubos (focus visible)
   - Enter abre popup, Escape cierra
   - Reduced motion respect (`prefers-reduced-motion`)
   - Contraste WCAG AA en HUD + popup
   - Screen reader: aria-labels en cubos, popup, botón admin
4. **SEO:**
   - `<meta>` description, OG tags, Twitter cards
   - Sitemap.xml
   - robots.txt
5. **Error handling:**
   - Si Strapi cae → usar fallback estático sin romper UX
   - Si Pixel Streaming falla → mostrar placeholder
   - Si Google OAuth falla → mensaje claro al admin
6. **Browser testing:**
   - Chrome, Firefox, Safari, Edge en desktop
   - Safari iOS, Chrome Android

**Criterio de éxito:**
- Lighthouse perf ≥85 desktop / ≥70 mobile
- Lighthouse a11y ≥95
- No errores en consola en navegadores principales
- UX consistente en 320px–1920px

**Resultado v0.19.0:**
- Code-splitting final: `three`, `three-addons`, `gsap` y `streaming` en
  chunks separados; `streaming-*` y `three-addons-*` no se precargan en mobile
  durante boot normal.
- Pixel Streaming usa lazy overlay y respeta el tweak `Preview visible`; si
  está apagado y no hay stream válido, no descarga ni monta preview.
- Mobile/reduced-motion usa modo ligero sin bloom/sombras caras y con pixel
  ratio acotado.
- Lighthouse `vite preview`: mobile Performance `80` / Accessibility `100`;
  desktop Performance `98` / Accessibility `100`.
- Responsive CDP: `320`, `375`, `414`, `768`, `1024`, `1440`, `1920` px con
  `body/html/canvas == innerWidth`.
- Accesibilidad: navegación `Tab` por cubos, `Enter` abre popup, `Escape`
  cierra, roles/labels ARIA en canvas/popup/ruta/tweaks.
- SEO base agregado: canonical, OG, Twitter cards, `robots.txt`, `sitemap.xml`.

**Dependencias:** Todas las etapas previas.
**Riesgo:** Medio. Pixel Streaming + Three.js pueden saturar mobiles low-end. Documentar mínimo de hardware soportado.

---

### ETAPA 16 — Documentación, runbook y handoff
**Estado:** ✅ Cerrada en `v0.20.0`.

**Objetivo:** Que cualquier futuro agente o desarrollador pueda continuar.

**Tareas:**
1. Actualizar `README.md` con:
   - Nuevo stack completo (GSAP, Pixel Streaming, Google OAuth)
   - Cómo correr local con todos los componentes
   - Cómo agregar un proyecto nuevo (Strapi + UE Level + ...)
2. Crear `RUNBOOK.md`:
   - Procedimiento si Pixel Streaming server cae
   - Procedimiento si Strapi se queda sin quota
   - Procedimiento si OAuth deja de funcionar
   - Cómo rotar secretos
3. Actualizar `DEPLOY.md` con nuevos pasos (subdominio stream, OAuth client, Discord webhook).
4. Crear `HANDOFF-V2.md` (sucesor del actual) con estado final.
5. Diagrama de arquitectura como imagen (Figma o draw.io exportado a PNG en `docs/`).
6. Video corto (1-2 min) demostrando el flujo completo, subido como GH Release asset.

**Criterio de éxito:** Otro agente IA puede leer el handoff y continuar sin preguntas básicas.
**Dependencias:** Todas las etapas.
**Riesgo:** Bajo.

**Resultado v0.20.0:**
- `RUNBOOK.md` creado con smoke tests, operacion normal, incidentes,
  OAuth/Strapi/Pixel Streaming, rotacion de secretos y rollback.
- `DEPLOY.md` actualizado con variables productivas, OAuth, webhook Discord,
  subdominio `stream` y release assets.
- `README.md` actualizado con stack final, docs operativas y flujo para agregar
  proyectos nuevos.
- `HANDOFF-V2.md` creado como handoff final compacto; `HANDOFF-LATEST.md`
  apunta al cierre vigente.
- Diagrama de arquitectura versionado en `docs/architecture.svg` y
  `docs/architecture.png`.
- Guion de demo en `docs/demo-script.md`, script auxiliar
  `scripts/record-demo.mjs` y asset tecnico `docs/proyecto28-demo.webm`.
- Workflow `sync-design.yml` sube assets documentales (`architecture.png`,
  `proyecto28-demo.webm` si existe) al GitHub Release en tags `v*`.

---

## 5. RIESGOS Y MITIGACIONES

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Pixel Streaming es prohibitivamente caro | Alta | Alto | Empezar con 1 instancia compartida + auto-suspend. Fallback a video loop si user lo prefiere. |
| R2 | Discord bot existente no soporta el comando | Media | Medio | Documentar requisitos en §1.3. Si no soporta → escribir un endpoint Node simple como reemplazo. |
| R3 | Google OAuth bloquea por COOP/COEP en GH Pages | Media | Medio | Configurar headers en `_headers` (Cloudflare Pages) o usar redirect-flow en vez de popup. |
| R4 | Three.js + iframe overlay no se alinean bien en 3D | Media | Bajo | Etapa 11 opción A (HTML overlay 2D) en vez de textura WebRTC. |
| R5 | Mobile vertical sigue rompiendo con tantos overlays | Alta | Alto | Testing real en dispositivo desde Etapa 10. No confiar en DevTools mobile emulation. |
| R6 | Strapi Free tier se queda corto con AdminWhitelist + PublishLog | Baja | Medio | Pagar Strapi Cloud Pro si pasa. Plan B: SQLite + servidor propio. |
| R7 | Latencia Pixel Streaming en Sudamérica (servidor GPU en US) | Alta | Medio | Probar GCP región `southamerica-east1` (São Paulo) o AWS `sa-east-1`. |
| R8 | Bundle crece más de 1MB | Media | Bajo | Code-splitting en Etapa 15. Lazy load agresivo. |
| R9 | Tweaks panel publicado por admin rompe el sitio | Media | Alto | Validar payload server-side. Botón "Resetear a defaults" siempre disponible. |
| R10 | GitHub Action falla en deploy automático | Baja | Bajo | Mantener fallback de deploy manual documentado en RUNBOOK. |

---

## 6. DEPENDENCIAS EXTERNAS Y COSTOS ESTIMADOS

| Componente | Costo aproximado | Notas |
|---|---|---|
| GitHub Pages | $0 | Free para repos públicos / privados ≤1GB |
| Strapi Cloud Free | $0 | Suficiente para development; pasar a Pro ($15/mes) si se necesitan más entornos |
| Cloudflare DNS | $0 | Free tier |
| Google OAuth | $0 | Gratuito |
| GSAP | $0 | Free desde 2024 |
| Pixel Streaming server (1x GPU) | **$50-150/mes** | g4dn.xlarge AWS spot ~$0.20/h con auto-suspend; reservada ~$340/mes |
| Discord bot hosting | $0 si ya existe | Si self-hosted, considerar |
| Dominio .com renewal | ~$12/año | |
| Dominio .cl renewal | ~$12/año NIC.cl | |
| **Total recurrente estimado** | **~$50-150/mes** | Dominado por Pixel Streaming |

---

## 7. CRITERIOS DE ACEPTACIÓN GLOBALES (Definition of Done)

Antes de tag `v1.0.0`:
- [ ] Todas las etapas 1-18 completadas y mergeadas a main
- [ ] Lighthouse perf ≥85 desktop / ≥70 mobile
- [ ] Lighthouse a11y ≥95
- [ ] Funciona en Chrome / Firefox / Safari / Edge
- [ ] Funciona en iOS Safari + Chrome Android (test real)
- [ ] Admin puede ajustar tweaks → publicar → ver reflejado
- [ ] No-admin no ve botón admin ni rueda de tweaks
- [x] Pixel Streaming activable/desactivable sin romper UX en primer corte iframe/fallback
- [x] Contador de luces caídas funciona
- [ ] CHANGELOG.md actualizado con todas las versiones
- [ ] HANDOFF-V2.md escrito y aprobado por user
- [ ] Backup de Strapi Cloud descargado

---

## 8. ORDEN SUGERIDO DE EJECUCIÓN

**Sprint 1 (fundación, 1-2 sesiones):**
- Etapa 1 — Versionado
- Etapa 2 — Strapi schema
- Etapa 3 — Frontend data layer

**Sprint 2 (juego básico, 2-3 sesiones):**
- Etapa 4 — Luz controlable
- Etapa 5 — Físicas Kirby
- Etapa 6 — Cubos encendidos + respawn + contador

**Sprint 3 (admin gating, 2 sesiones):**
- Etapa 7 — Tweaks ocultos
- Etapa 8 — Botón admin secreto
- Etapa 9 — Google OAuth

**Sprint 4 (UX, 2 sesiones):**
- Etapa 10 — Popup mejorado + mobile
- Etapa 14 — GSAP polish (puede ser paralelo)

**Sprint 5 (Pixel Streaming, 3-4 sesiones, infra-dependiente):**
- Pre-requisitos infra (§1.1)
- Etapa 11 — Integración Pixel Streaming

**Sprint 6 (pipeline, 2 sesiones):**
- Etapa 12 — Publicar via Strapi + webhook opcional
- Etapa 13 — Sync automatizado

**Sprint 7 (hardening, 2-3 sesiones):**
- Etapa 15 — Performance/responsive/a11y
- Etapa 16 — Documentación

**Total estimado:** 14-19 sesiones de trabajo, dependiendo de complejidad real y decisiones bloqueantes.

---

## 9. CHECKLIST PRE-EJECUCIÓN (acción del user antes de empezar)

- [ ] Responder §1.1 — Pixel Streaming infra y budget
- [ ] Responder §1.3 — Discord bot detalles
- [ ] Responder §1.4 — Qué es "Claude Design" en términos operativos
- [x] Crear OAuth Client ID en Google Cloud Console (§1.2)
- [x] Confirmar emails whitelist correctos: `inconcha@gmail.com` + `yk8arts@gmail.com`
- [ ] Crear admin en Strapi Cloud (pendiente del handoff v1)
- [ ] Confirmar `.cl` propagado y redirigiendo a `.com`
- [ ] Validar UI actual en browser real (test post-handoff v1)

---

## 10. ANEXO — Mapeo prompt original → etapas

Para asegurar que nada del prompt original quedó sin cubrir:

| Requerimiento del prompt | Etapa(s) |
|---|---|
| Push a GitHub siempre | Regla maestra + Etapa 1 |
| Actualizar Claude Design + Strapi después | Etapa 13 |
| Mantener versionado | Etapa 1 + Regla maestra |
| GSAP + Claude Design + Three.js + Strapi + GitHub + Pixel Streaming + Unreal | Etapas 11, 13, 14 |
| Luz inicia en centro, sigue al mouse en movimiento | Etapa 4 |
| WASD + espacio | Etapas 4, 5 |
| 4 saltos estilo Kirby + gravedad | Etapa 5 |
| Tweaks de salto/velocidad/curva | Etapas 2, 7 |
| Luz enciende cubo al pisarlo | Etapa 6 |
| Cae al infinito 1s + respawn en centro | Etapa 6 |
| Contador de luces caídas | Etapa 6 |
| Unreal corriendo sobre cubo activo | Etapa 11 |
| Switch de transmisión al cambiar cubo | Etapa 11 |
| Responsive mobile vertical: cubos alejados, popup full | Etapa 10, 15 |
| Tap fuera cierra popup, tap dentro redirige | Etapa 10 |
| Tweaks ocultos por default | Etapa 7 |
| Strapi con imágenes/videos/GLB/streams por cubo | Etapa 2 |
| Botón admin secreto bajo logo | Etapa 8 |
| Tweak que habilita el botón | Etapas 7, 8 |
| Solo admin ve tweaks (rueda de comandos gated) | Etapas 8, 9 |
| Cambiar imagen del popup desde tweaks | Etapas 2, 7, 10 |
| Estilo popup imagen + texto | Etapa 10 |
| Modificar contenidos desde tweaks | Etapas 7, 12 |
| Login Google solo 2 correos | Etapa 9 |
| Botón "Publicar" → Strapi vía Discord bot | Etapa 12 |
| Actualizar automáticamente herramientas (Claude Design, GitHub, ...) | Etapas 12, 13 |

**Cobertura: 100%.** Todo lo del prompt mapea a una etapa concreta.

---

**Fin del plan. Esperando confirmación / ajustes antes de empezar Etapa 1.**
