#!/usr/bin/env bash
# scripts/release.sh
# Cierre de etapa: valida estado, crea tag, recordatorios para CHANGELOG/handoff.
# Uso: ./scripts/release.sh 0.2.0 "Etapa 1: Fundacion de versionado"

set -euo pipefail

VERSION="${1:-}"
TITLE="${2:-}"

if [[ -z "$VERSION" || -z "$TITLE" ]]; then
  echo "Uso: $0 <version-sin-v> <titulo>"
  echo "Ej:  $0 0.2.0 \"Etapa 1: Fundacion de versionado\""
  exit 1
fi

# 1. Working tree limpio
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree no esta limpio:" >&2
  git status --short
  exit 1
fi

# 2. Estamos en main
BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Debes estar en main. Estas en: $BRANCH" >&2
  exit 1
fi

# 3. main al dia con remote
git fetch origin main --quiet
LOCAL="$(git rev-parse main)"
REMOTE="$(git rev-parse origin/main)"
if [[ "$LOCAL" != "$REMOTE" ]]; then
  echo "main local no coincide con origin/main. Pull o push antes." >&2
  exit 1
fi

# 4. Formato semver
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version debe ser semver X.Y.Z. Recibido: $VERSION" >&2
  exit 1
fi

TAG="v$VERSION"

# 5. Tag no existe
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG ya existe." >&2
  exit 1
fi

# 6. Confirmar
echo ""
echo "Resumen del release:"
echo "  Tag:    $TAG"
echo "  Titulo: $TITLE"
echo "  Branch: $BRANCH"
echo "  HEAD:   $LOCAL"
echo ""
read -p "Continuar? (s/N) " -n 1 -r
echo
if [[ ! "$REPLY" =~ ^[Ss]$ ]]; then
  echo "Cancelado."
  exit 0
fi

# 7. Crear tag
git tag -a "$TAG" -m "$TITLE"

# 8. Push tag
git push origin "$TAG"

echo ""
echo "Tag $TAG creado y pusheado."
echo ""
echo "Pendientes manuales:"
echo "  1. Verifica que CHANGELOG.md ya tiene la entrada [$VERSION]"
echo "  2. Regenera HANDOFF-LATEST.md con el nuevo estado"
echo "  3. Respalda handoff en Google Doc (subpestania fecha/hora)"
echo "  4. Verifica GH Actions verde: gh run list --limit 1"
