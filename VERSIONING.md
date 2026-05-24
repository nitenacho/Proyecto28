# Versionado y flujo de trabajo

Este documento es la fuente de verdad del proceso de mantención del repo
Proyecto 28. Todos los agentes (humanos o IA) que toquen el código deben
seguirlo.

## 1. Regla maestra

> **Cada cambio funcional sigue este ciclo, sin excepciones:**
>
> 1. Trabajar en una rama `etapa-N-<slug>` o `fix-<slug>` (nunca directo en main).
> 2. Commits atómicos en formato Conventional Commits (ver §3).
> 3. Push de la rama a `origin`.
> 4. Verificar manualmente que la feature funciona.
> 5. Merge a `main` (squash merge preferido para PRs grandes).
> 6. Tag semver `v0.X.Y` al cierre de etapa o fix.
> 7. Entrada en `CHANGELOG.md`.
> 8. Regenerar `HANDOFF-LATEST.md` con el nuevo estado.
> 9. Respaldar handoff en el Google Doc oficial como subpestaña con fecha/hora
>    bajo el tab raíz `Handoff` (nunca como pestaña raíz del documento).

GitHub Actions se encarga del deploy automático a GitHub Pages. Strapi Cloud
se encarga del rebuild automático cuando hay cambios en `cms/**`. **No hay
deploy manual.**

## 2. Branches

| Patrón | Uso | Vida útil |
|---|---|---|
| `main` | Producción. Siempre verde. | Eterna |
| `etapa-N-<slug>` | Etapa del PLAN-PROYECTO28-V2.md | Hasta merge a main |
| `fix-<slug>` | Patches entre etapas | Hasta merge a main |
| `hotfix-<slug>` | Emergencia en producción | Inmediata |

**No se trabaja directo en `main`.** Excepción única: cambios solo a
documentación (CHANGELOG, README, HANDOFF) pueden ir directo si urge.

## 3. Conventional Commits

Formato:

```
<type>(<scope>): <subject>

[body opcional, ~72 chars por línea]

[footer opcional: refs, breaking changes]
```

### Types
- `feat` — Nueva funcionalidad
- `fix` — Bug fix
- `docs` — Solo documentación
- `chore` — Tareas de mantenimiento, deps, config
- `refactor` — Cambio que no agrega feature ni corrige bug
- `test` — Agregar/modificar tests
- `perf` — Mejora de performance
- `build` — Cambios al sistema de build / dependencies
- `ci` — Cambios al workflow de CI

### Scopes comunes
- `scene` — Three.js scene, cubos, cámara, luces
- `game` — Mecánicas de juego (luz controlable, físicas)
- `popup` — UI del popup
- `tweaks` — Panel de tweaks
- `hud` — Heads-up display (contador, etc.)
- `auth` — Google OAuth, whitelist admin
- `streaming` — Pixel Streaming + Unreal
- `strapi` — Schemas, controllers, bootstrap
- `discord` — Integración con bot
- `a11y` — Accesibilidad
- `mobile` — Responsive móvil
- `release` — Cambios meta de versionado, scripts, CHANGELOG

### Ejemplos

```
feat(game): añadir luz controlable con WASD y mouse follow

Cierra parcial Etapa 4 — falta integrar gravedad (Etapa 5).
```

```
fix(popup): popup no cierra en mobile al tocar fuera
```

```
chore(release): tag v0.4.0 cierra Etapa 4
```

## 4. Semantic Versioning

Mientras estamos en `0.x.y`, la API pública del proyecto se considera
inestable y `x` se incrementa por etapa cerrada.

| Versión | Significado |
|---|---|
| `v0.1.0` | Estado del handoff v1 (retroactivo) |
| `v0.2.0` | Etapa 1: Fundación de versionado |
| `v0.3.0` | Etapa 2: Strapi schema extendido |
| `v0.N.0` | Cierre de Etapa N-1 |
| `v0.N.Z` | Patches dentro de la etapa N |
| `v1.0.0` | Todas las etapas (1-16) verificadas + handoff final |

Patches (`Z`) NO se tagean obligatoriamente. Solo si arreglan algo
suficientemente notable como para querer un rollback target específico.

## 5. Checklist de cierre de etapa

Antes de mergear una rama `etapa-N-*` a `main`, todos estos puntos deben
estar OK. **Si alguno falla, la etapa NO se cierra.**

- [ ] Todos los criterios de éxito de la etapa (§4 del plan) verificados manualmente.
- [ ] `npm run build` exitoso sin warnings nuevos.
- [ ] No hay `console.log` de debugging dejados en el código.
- [ ] CHANGELOG.md actualizado con la entrada de esta versión.
- [ ] HANDOFF-LATEST.md regenerado.
- [ ] Si hubo cambio de schema Strapi → entry en `cms/README.md`.
- [ ] Si hubo cambio de env vars → entry en `.env.example` correspondiente.
- [ ] PR merged (o squash merge a main si trabajamos directo).
- [ ] Tag `v0.N.0` creado y pusheado.
- [ ] GitHub Actions verde en `main` después del merge.
- [ ] Strapi Cloud verde (si tocamos `cms/**`).
- [ ] Smoke test en `https://proyecto28.com` — el sitio carga.
- [ ] Handoff respaldado en Google Doc como subpestaña fecha/hora bajo
  `Handoff` (nunca pestaña raíz).

## 5.1 Regla Google Doc

El Google Doc oficial usa el tab raíz `Handoff` como contenedor permanente de
continuidad. Cada cierre de etapa o sesión debe crear/mover una subpestaña
dentro de `Handoff`.

Formato recomendado de título:

```text
YYYY-MM-DD HH:mm UTC - vX.Y.Z <slug>
```

El próximo agente debe tomar siempre la última subpestaña bajo `Handoff`.
Si un respaldo queda como pestaña raíz, corregirlo antes de entregar.

## 6. Comandos rápidos

```bash
# Iniciar etapa N
git checkout main && git pull
git checkout -b etapa-N-slug

# Commits intermedios
git add <files>
git commit -m "feat(scope): descripción corta"

# Cierre de etapa
git checkout main && git merge --squash etapa-N-slug
# (o usar PR vía gh pr create)
git commit -m "feat: cierre Etapa N — <título>"
git push origin main
git tag -a v0.N.0 -m "Etapa N cerrada"
git push origin v0.N.0

# Verificar deploy
gh run list --limit 1
gh run watch <ID>

# Verificar Strapi
curl https://honest-candy-800d1e4a92.strapiapp.com/api/projects | jq

# Smoke test
curl -I https://proyecto28.com
```

## 7. Sync automatizado (qué hace CI, no tú)

| Sistema | Cuándo se actualiza | Mecanismo |
|---|---|---|
| GitHub Pages | Push a `main` que toque frontend | `.github/workflows/deploy.yml` |
| Strapi Cloud | Push a `main` que toque `cms/**` | Strapi Cloud "Deploy on commit" |
| Claude Design | Push a `main` que toque `src/styles/**` | `.github/workflows/sync-claude-design.yml` (placeholder, se activa en Etapa 13) |
| Discord bot | "Publicar" desde panel admin | Endpoint Strapi `/api/publish` → webhook → bot (Etapa 12) |

**Si alguno de estos sync no se ejecutó después de un push, es un bug del
workflow, no falta tuya.** Diagnosticar en GitHub Actions logs.

## 8. Rollback

Si una etapa se mergea y rompe producción:

```bash
git checkout main
git revert -m 1 <merge-sha>
git push origin main
# GH Actions auto-redeploya el estado anterior
```

Alternativa: tag al estado bueno y revert por tag.

## 9. Quién puede merge a main

- **Owner (@nitenacho)** siempre.
- **Agentes IA** solo con confirmación explícita del owner en la sesión.
- **Bots automatizados (Discord bot, Strapi webhook)** solo a través de
  endpoints definidos, nunca con commits directos.

## 10. Decisiones bloqueantes pendientes

Ver §1 del [PLAN-PROYECTO28-V2.md](../PLAN-PROYECTO28-V2.md). Algunas etapas
requieren input del owner antes de empezar — están listadas ahí.
