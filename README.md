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
  del HUD (grilla, scanlines, viewfinder).

El usuario final puede sobreescribir todos los ajustes en tiempo real desde
el panel "Tweaks" que aparece en la esquina inferior derecha — esos cambios
viven sólo en su sesión.

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
9. respaldar handoff en Google Doc
```

GitHub Actions se encarga del deploy automático a GH Pages. Strapi Cloud
hace rebuild automático de `cms/**`. **No hay deploy manual.**

El plan completo de evolución vive en `PLAN-PROYECTO28-V2.md` (no commiteado
al repo, lo tiene el owner).

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
| 7 — Tweaks ocultos | ⏳ Pendiente | — |
| 8 — Botón admin secreto | ⏳ Pendiente | — |
| 9 — Google OAuth | ⏳ Pendiente | — |
| 10 — Popup mejorado + mobile | ⏳ Pendiente | — |
| 11 — Pixel Streaming Unreal | ⏳ Pendiente | — |
| 12 — Pipeline Publicar | ⏳ Pendiente | — |
| 13 — Sync Claude Design | ⏳ Pendiente | — |
| 14 — GSAP polish | ⏳ Pendiente | — |
| 15 — Performance + a11y | ⏳ Pendiente | — |
| 16 — Documentación final | ⏳ Pendiente | — |
