# scripts/release.ps1
# Cierre de etapa: valida estado, crea tag, abre nueva sección en CHANGELOG.
# Uso: pwsh -File scripts/release.ps1 -Version 0.2.0 -Title "Etapa 1: Fundacion de versionado"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [Parameter(Mandatory=$true)]
    [string]$Title
)

$ErrorActionPreference = 'Stop'

function Fail($msg) {
    Write-Error $msg
    exit 1
}

# 1. Working tree limpio
$status = git status --porcelain
if ($status) {
    Fail "Working tree no esta limpio. Commit o stash antes de releasear.`n$status"
}

# 2. Estamos en main
$branch = (git branch --show-current).Trim()
if ($branch -ne 'main') {
    Fail "Debes estar en main para tagear release. Estas en: $branch"
}

# 3. main al dia con remote
git fetch origin main --quiet
$local = git rev-parse main
$remote = git rev-parse origin/main
if ($local -ne $remote) {
    Fail "main local no coincide con origin/main. Pull o push antes de releasear."
}

# 4. Validar formato del tag
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Fail "Version debe ser semver X.Y.Z (sin la 'v'). Recibido: $Version"
}

$tag = "v$Version"

# 5. Tag no existe
$existing = git tag -l $tag
if ($existing) {
    Fail "Tag $tag ya existe. Elige otro."
}

# 6. Confirmar
Write-Host ""
Write-Host "Resumen del release:" -ForegroundColor Cyan
Write-Host "  Tag:    $tag"
Write-Host "  Titulo: $Title"
Write-Host "  Branch: $branch"
Write-Host "  HEAD:   $local"
Write-Host ""
$confirm = Read-Host "Continuar? (s/N)"
if ($confirm -ne 's' -and $confirm -ne 'S') {
    Write-Host "Cancelado." -ForegroundColor Yellow
    exit 0
}

# 7. Tag firmado (sin -s para no forzar GPG)
git tag -a $tag -m "$Title"
if ($LASTEXITCODE -ne 0) { Fail "Fallo creando tag." }

# 8. Push del tag
git push origin $tag
if ($LASTEXITCODE -ne 0) { Fail "Fallo pusheando tag." }

Write-Host ""
Write-Host "Tag $tag creado y pusheado." -ForegroundColor Green
Write-Host ""
Write-Host "Pendientes manuales:" -ForegroundColor Yellow
Write-Host "  1. Verifica que CHANGELOG.md ya tiene la entrada [$Version]"
Write-Host "  2. Regenera HANDOFF-LATEST.md con el nuevo estado"
Write-Host "  3. Respalda handoff en Google Doc (subpestania fecha/hora)"
Write-Host "  4. Verifica GH Actions verde: gh run list --limit 1"
