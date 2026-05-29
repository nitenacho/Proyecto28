# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-05-29 (cierre Etapa 15 - `v0.19.0`)
> **Tag activo:** `v0.19.0`
> **Branch esperado:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28

Etapas 1-15 cerradas. Etapa 15 deja el sitio endurecido en performance,
responsive, accesibilidad, SEO basico y manejo de errores antes de la
documentacion final de Etapa 16.

---

## 0. Resumen en 30 segundos

Web 3D interactiva en `proyecto28.com` con grid de cubos (Three.js + Vite),
CMS Strapi Cloud, Google OAuth, whitelist gating, Pixel Streaming
iframe/fallback, pipeline `Tweaks -> Strapi SiteSetting`, Claude Design export,
GSAP polish y hardening final de performance/accesibilidad.

Estado actual:
- Etapas 1-15 cerradas.
- Responsive root cause iPhone/iPad resuelto en `v0.14.6` y confirmado por
  owner.
- Pixel Streaming inicial cerrado en `v0.15.0`: iframe real si hay URL valida y
  fallback local controlado por `Streaming > Preview visible`.
- Pipeline publicar cerrado en `v0.16.0` y hotfix `v0.16.1`: Strapi acepta
  `access_token`/`id_token` Google y valida contra whitelist.
- Etapa 15 `v0.19.0`:
  - code splitting `three`, `three-addons`, `gsap`, `streaming`;
  - lazy overlay streaming;
  - mobile/reduced-motion con geometria simple, sin sombras caras ni bloom;
  - navegacion por teclado de cubos;
  - SEO: canonical, OG/Twitter, `robots.txt`, `sitemap.xml`;
  - retry de `PUBLICAR CAMBIOS` con token Google fresco si Strapi rechaza token
    vencido/legacy.

---

## 1. Como arrancar como nuevo agente IA

```bash
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"
git checkout main
git pull --ff-only
git status
git describe --tags --abbrev=0
git log --oneline -12
```

Esperado despues del cierre:
- branch `main`
- working tree clean
- ultimo tag `v0.19.0`
- `CHANGELOG.md`, `README.md`, `PLAN-PROYECTO28-V2.md` y este handoff
  actualizados.

Lectura recomendada:
1. `HANDOFF-LATEST.md`
2. `CHANGELOG.md` - `[0.19.0]`
3. `PLAN-PROYECTO28-V2.md` - Etapa 15 cerrada, Etapa 16 pendiente
4. Google Doc oficial - ultima subpestana bajo `Handoff`:
   `2026-05-29 10:08 UTC v0.19.0 performance-a11y`
   Tab id: `t.p174shum7lw` (padre `Handoff`: `t.7lpfc5ado1h`)

---

## 2. Cambios de Etapa 15

### Performance

- `vite.config.js` ahora separa chunks:
  - `three`
  - `three-addons`
  - `gsap`
  - `streaming`
- Se filtra `modulepreload` para no precargar `streaming-*` ni `three-addons-*`
  durante el boot normal.
- `src/streaming/lazyStreamOverlay.js` evita importar el overlay/iframe de
  Pixel Streaming hasta que exista un stream valido o el preview este activo.
- `src/scene/scene.js` aplica modo ligero en mobile/reduced-motion:
  - `BoxGeometry` simple en vez de `RoundedBoxGeometry`;
  - pixel ratio max `1.25`;
  - sombras caras desactivadas;
  - render directo sin `EffectComposer`/Bloom.
- Desktop conserva rounded cubes + bloom/post-processing.

### Streaming preview

- El tweak `Streaming > Preview visible` queda como control efectivo para
  prender/apagar el fallback/preview.
- Si `Preview visible=false` y no hay stream valido, no se monta overlay y no se
  descarga `assets/streaming-*.js`.
- Si un iframe de streaming falla o no responde, se muestra placeholder; si
  carga tarde, vuelve a estado `Live`.

### Publicar Cambios / Google token

- `src/admin/publish.js` reintenta una vez con sesion Google fresca cuando el
  backend responde token invalido.
- Errores de publish se muestran en espanol:
  - sesion Google rechazada/vencida;
  - cuenta no autorizada en whitelist.

### Accesibilidad

- Nuevo `src/ui/cubeA11y.js`: controles DOM espejo para los 6 cubos.
- `Tab` recorre cubos, `Enter` abre popup, `Escape` cierra.
- Canvas, popup, route overlay y Tweaks tienen roles/labels ARIA.
- `prefers-reduced-motion` respeta animaciones reducidas CSS + modo ligero 3D.

### SEO

- `index.html`: canonical, OG, Twitter cards.
- `public/robots.txt`
- `public/sitemap.xml`

---

## 3. Validacion local de cierre

Build:

```bash
npm run build
```

Resultado OK. Chunks finales:
- `assets/index-DzLC3Syc.js` `54.19 kB` / `19.64 kB` gzip
- `assets/streaming-DWwWXc9J.js` `6.16 kB` / `2.54 kB` gzip
- `assets/three-addons-hfx1tmN4.js` `65.32 kB` / `17.93 kB` gzip
- `assets/gsap-CzGW6FVa.js` `70.46 kB` / `27.81 kB` gzip
- `assets/three-CdxnkpeF.js` `530.20 kB` / `134.12 kB` gzip

Lighthouse sobre `vite preview`:
- Mobile: Performance `80`, Accessibility `100`
- Desktop: Performance `98`, Accessibility `100`

Responsive CDP sobre build produccion:
- `320x568`, `375x812`, `414x896`, `768x1024`, `1024x768`, `1440x900`,
  `1920x1080`
- En todos: `body == html == canvas == innerWidth`
- En `320/375/414`: `streamingChunkLoaded=false`, `addonsChunkLoaded=false`
- `cubeButtons=6`, `popupRole=dialog`

Browser local:
- sin preview: `streamOverlayLoaded=false`
- `?streamPreview=028.A`: fallback visible, sin overflow
- `Enter` en cubo accesible abre popup `Holograma`; `Escape` lo cierra

---

## 4. Validacion Strapi / OAuth / whitelist

Servicios verificados el 2026-05-29:

```bash
GET /api/projects?populate=*                         => 200
GET /api/admin-whitelists                            => 403
GET /api/site-setting                                => 200
GET /api/auth/check?email=inconcha@gmail.com         => 200 { allowed:true, role:"owner" }
GET /api/auth/check?email=yk8arts@gmail.com          => 200 { allowed:true, role:"editor" }
POST /api/publish sin token                          => 401
GET https://proyecto28.com                           => 200
```

`Admin whitelist` en schema Strapi:
- `content-manager.visible: true`
- `content-type-builder.visible: true`
- campos editables: `email`, `role`, `note`
- API publica core privada (`/api/admin-whitelists => 403`)

Estado vivo de SiteSetting antes del deploy `v0.19.0`:

```json
{
  "pixelStreamingEnabled": true,
  "pixelStreamingPreviewEnabled": true,
  "pixelStreamingMode": "shared",
  "adminButtonVisible": true,
  "defaultPopupPlacement": "side",
  "showGrid": true,
  "showScanlines": false,
  "showViewfinder": false
}
```

Nota importante:
- El repo confirma whitelist Strapi para `inconcha@gmail.com` y
  `yk8arts@gmail.com`.
- La consola Google Cloud / OAuth consent screen no se pudo leer desde CLI
  porque `gcloud` no esta instalado y no hay API/browser autenticado disponible
  en esta sesion. Si el OAuth prompt rechazara un correo pese a estar permitido
  por Strapi, revisar manualmente que ambos correos sigan como Test users en
  Google Cloud project `spartan-grail-401816`.
- Para apagar el preview en produccion: abrir `proyecto28.com` -> `Admin` ->
  cuenta permitida -> Tweaks -> `Streaming > Preview visible` OFF ->
  `PUBLICAR CAMBIOS`.

---

## 5. Validacion hosting/GitHub

Commit de etapa:
- `18515bb feat(perf): harden performance and a11y [skip-tag]`

GitHub Actions:
- `Build and deploy frontend to GitHub Pages` run `26631677133` => `success`
- `Auto tag semantic releases` run `26631677112` => `success` / skip por
  `[skip-tag]`; tag `v0.19.0` se dejo manual al cierre.
- `gh` CLI local no tiene sesion (`gh auth login` pendiente), por lo que la
  validacion de Actions se hizo con GitHub API publica.

Produccion despues del deploy:
- `https://proyecto28.com` => `200`
- `https://proyecto28.com/robots.txt` => `200`
- `https://proyecto28.com/sitemap.xml` => `200`
- HTML de produccion sirve bundle `assets/index-CD085i8n.js` junto a
  `three-CdxnkpeF.js`, `gsap-CzGW6FVa.js` y CSS `index-Dj54e5kw.css`.

Smoke Chrome headless/CDP sobre `https://proyecto28.com`:
- phone `390x844`: `html=390`, `body=390`, `canvas=390`,
  `streamingChunkLoaded=false`, `addonsChunkLoaded=false`.
- iPad portrait `810x1080`: `html=810`, `body=810`, `canvas=810`,
  `streamingChunkLoaded=false`, `addonsChunkLoaded=false`.
- desktop `1440x900`: `html=1440`, `body=1440`, `canvas=1440`,
  `streamingChunkLoaded=false`, `addonsChunkLoaded=true`.
- `cubeButtons=6`, `popupRole=dialog`.

---

## 6. Proximo paso

Etapa 16 - Documentacion final, runbook y handoff:
- actualizar README final de operacion;
- crear `RUNBOOK.md`;
- documentar caida de Pixel Streaming, Strapi quota, OAuth y rollback;
- dejar flujo para agregar proyecto nuevo (Strapi + UE Level + assets).

No mezclar con tech debt Strapi salvo que bloquee.

---

## 7. Riesgos y pendientes

- `three` core sigue siendo un chunk grande (`530.20 kB`, `134.12 kB` gzip),
  pero queda aislado. Lighthouse mobile cumple target tras modo ligero.
- `proyecto28.cl` seguia pendiente de DNS/certificado en handoffs previos.
- Tech debt Strapi: enum legacy `Project.status` puede bloquear edicion de
  proyectos en admin. Resolver formalmente en Etapa 16/17 si sigue vigente.
- Google OAuth consent screen sigue en Testing segun handoffs previos; si se
  agrega email a Strapi, tambien agregarlo como Test user en GCP.

---

## 8. Reglas de continuidad

- No trabajar directo en `main` salvo docs-only urgente.
- Branch por etapa/fix.
- Conventional Commits.
- `npm run build` antes de cerrar.
- Push a `main` dispara GitHub Pages.
- Validar siempre `https://proyecto28.com` tras deploy.
- Actualizar `CHANGELOG.md`, `README.md`, `PLAN-PROYECTO28-V2.md` y
  `HANDOFF-LATEST.md`.
- Respaldar Google Doc como subpestana bajo `Handoff`, nunca como pestana raiz.

Fin del handoff `v0.19.0`.
