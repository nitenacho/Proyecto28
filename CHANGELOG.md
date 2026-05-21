# Changelog

Todos los cambios notables de Proyecto 28 se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este
proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

Cada entrada corresponde a una **etapa** del [PLAN-PROYECTO28-V2.md](../PLAN-PROYECTO28-V2.md)
o a un fix puntual entre etapas.

## [Unreleased]

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

[Unreleased]: https://github.com/nitenacho/Proyecto28/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/nitenacho/Proyecto28/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nitenacho/Proyecto28/releases/tag/v0.1.0
