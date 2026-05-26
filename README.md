# PROYECTO 28

Sitio interactivo 3D — Tiles WebGL/Three.js + popup HUD + tweaks live,
contenido editable desde un Strapi headless.

```
proyecto28/
├── src/                Frontend Vite + Three.js (raíz del sitio)
├── public/CNAME        Dominio principal (proyecto28.com)
├── cms/                Strapi v5 — content types + bootstrap
├── .github/workflows/  CI: build + deploy a GitHub Pages
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

## Producción

- Frontend → GitHub Pages (custom domains `proyecto28.com` + `proyecto28.cl`)
- CMS → Strapi Cloud (`cms/` como base directory)
- Build automático en cada push a `main`

Ver [`DEPLOY.md`](DEPLOY.md) y [`cms/README.md`](cms/README.md) para el detalle.

## Editar contenido

Una vez Strapi Cloud está corriendo, todo el contenido del grid se administra
desde `/admin`:

- **Proyectos** (1 por cubo) — textos, imagen del popup, modelo `.glb`
  flotante, URL de redirección por color.
- **Ajustes del sitio** — logo (P28 / NEIT / EST), placement por defecto del
  popup, estilo de tiles, inclinación / rotación / drift de cámara, toggles
  del HUD (grilla, scanlines, viewfinder), juego, Admin y Pixel Streaming.
- **Admin whitelist** — correos autorizados para abrir Tweaks y publicar
  cambios (`owner` / `editor`). Esta colección queda editable desde Strapi
  Admin y privada para el público.
- **Publish log** — auditoría interna de cada publicación del panel Tweaks.

El usuario final puede sobreescribir todos los ajustes en tiempo real desde
el panel "Tweaks". Los admins autorizados por Google + whitelist pueden usar
`PUBLICAR CAMBIOS` para persistir el snapshot en Strapi `SiteSetting`; si no
publican, los cambios viven sólo en su sesión.

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
| 13 — Sync Claude Design | ⏳ Pendiente | — |
| 14 — GSAP polish | ⏳ Pendiente | — |
| 15 — Performance + a11y | ⏳ Pendiente | — |
| 16 — Documentación final | ⏳ Pendiente | — |
