# HANDOFF - Proyecto 28

> **Ultima actualizacion:** 2026-05-29 (cierre Etapa 16 - `v0.20.0`)
> **Tag activo esperado tras cierre:** `v0.20.0`
> **Branch esperado:** `main`
> **Owner:** @nitenacho - cnignacioa@gmail.com / Inconcha@gmail.com
> **Repo:** https://github.com/nitenacho/Proyecto28
> **Produccion canonica:** https://proyecto28.com

Etapas 1-16 cerradas. Proyecto28 queda con web 3D interactiva, Strapi Cloud,
Google OAuth + whitelist, Tweaks publicables, Pixel Streaming iframe/fallback,
sync Claude Design, hardening performance/a11y y documentacion final.

---

## 0. Resumen en 30 segundos

Estado vigente:

- `v0.19.0`: ultimo codigo funcional de performance/a11y.
- `v0.20.0`: cierre documental final con `RUNBOOK.md`, `HANDOFF-V2.md`,
  diagrama, guion/demo y release assets.
- Dominio canonico: `https://proyecto28.com`.
- CMS: `https://honest-candy-800d1e4a92.strapiapp.com`.
- `.cl` sigue secundario/pending segun DNS/certificado; no bloquear continuidad
  si `.com` esta sano.

---

## 1. Como arrancar como nuevo agente IA

```powershell
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"
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
- ultimo tag `v0.20.0`
- build Vite OK

Lectura obligatoria:

1. `HANDOFF-V2.md` - handoff final compacto.
2. `RUNBOOK.md` - operacion, incidentes, rollback, secretos.
3. `DEPLOY.md` - GitHub Pages, Strapi, OAuth, Pixel Streaming, releases.
4. `CHANGELOG.md` - `[0.20.0]`.
5. `PLAN-PROYECTO28-V2.md` - Etapa 16 cerrada.

---

## 2. Cambios de Etapa 16

Archivos principales:

- `RUNBOOK.md`: smoke tests, operacion normal, agregar proyecto, incidentes,
  rotacion de secretos y rollback.
- `HANDOFF-V2.md`: handoff final para agentes nuevos.
- `README.md`: stack final, docs operativas, flujo para agregar proyectos.
- `DEPLOY.md`: variables productivas, OAuth, `stream.proyecto28.com`,
  webhook Discord opcional y release assets.
- `PLAN-PROYECTO28-V2.md`: Etapa 16 marcada como cerrada.
- `docs/architecture.svg` y `docs/architecture.png`: diagrama operativo.
- `docs/demo-script.md`: guion para video demo.
- `scripts/record-demo.mjs`: helper para generar WebM tecnico desde el canvas.
- `.github/workflows/sync-design.yml`: adjunta assets documentales al release
  en tags `v*` cuando existen.
- `.github/workflows/deploy.yml`: ignora docs/runbook/handoff/assets para
  evitar deploys Pages por cambios puramente documentales.

---

## 3. Validacion viva esperada

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
- `inconcha@gmail.com` permitido como `owner`
- `yk8arts@gmail.com` permitido como `editor`

Verificado localmente antes del cierre:

- `npm run build` OK.
- `node scripts/export-claude-design.mjs` OK (`96` tokens).
- `node scripts/record-demo.mjs` genero `docs/proyecto28-demo.webm`
  (`923482` bytes).
- `docs/architecture.png` generado y revisado.
- `https://proyecto28.com`, `robots.txt`, `sitemap.xml`: `200`.
- Strapi: projects `200`, site-setting `200`, admin-whitelists `403`.
- Auth check: `inconcha@gmail.com` owner, `yk8arts@gmail.com` editor.

---

## 4. Operacion clave

### Admin / Tweaks / publicar

El boton `Admin` abre Google OAuth. Strapi whitelist permite:

- `inconcha@gmail.com` - owner
- `yk8arts@gmail.com` - editor

`PUBLICAR CAMBIOS` persiste snapshots al singleton `SiteSetting` via
`/api/publish`. Si el token Google vence, el frontend reintenta una vez con
sesion fresca.

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

## 5. Riesgos y pendientes

- `proyecto28.cl` no es canonico hasta cerrar DNS/certificado/redirect.
- Google OAuth consent screen puede seguir en Testing; al agregar emails a
  Strapi, tambien agregarlos como test users en Google Cloud.
- Tech debt Strapi: si aparece `Invalid status` al editar Project, normalizar
  valores legacy de `Project.status`.
- Pixel Streaming real depende de servidor GPU externo, TLS, costos y
  auto-suspend.
- `gh` CLI local no estaba autenticado en cierres previos; usar API publica o
  GitHub UI para validar Actions si sigue asi.

---

## 6. Google Doc

Respaldo final esperado como subpestana bajo `Handoff` en:

https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Titulo:

```text
2026-05-29 19:00 UTC - v0.20.0 documentacion-final
```

Tab id creado y verificado: `t.yau0g6g371sa` bajo padre `Handoff`
(`t.7lpfc5ado1h`).

Regla: nunca crear cierres como pestanas raiz. El siguiente agente debe tomar
la ultima subpestana bajo `Handoff`.

---

Fin del handoff `v0.20.0`.
