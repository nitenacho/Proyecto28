<#
  OneDrive "Files On-Demand" marks cloud-only files as reparse points,
  which Strapi's loader skips. This script reads every file under src/
  and config/ and writes the bytes back to itself, forcing OneDrive to
  materialize each file locally so Node's `Dirent.isFile()` returns true.

  Run this once after cloning if cms/ lives inside a OneDrive folder.

  Usage:  pwsh -File scripts/unwrap-onedrive.ps1
#>

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$targets = @('src', 'config', 'public', 'package.json', '.env', '.env.example', 'favicon.ico')
foreach ($t in $targets) {
  if (-not (Test-Path -LiteralPath $t)) { continue }
  if ((Get-Item -LiteralPath $t).PSIsContainer) {
    Get-ChildItem -Path $t -Recurse -File -Force | ForEach-Object {
      try {
        $bytes = [IO.File]::ReadAllBytes($_.FullName)
        [IO.File]::WriteAllBytes($_.FullName, $bytes)
      } catch {
        Write-Warning "skip $($_.FullName): $_"
      }
    }
  } else {
    try {
      $bytes = [IO.File]::ReadAllBytes($t)
      [IO.File]::WriteAllBytes($t, $bytes)
    } catch {
      Write-Warning "skip ${t}: $_"
    }
  }
}

Write-Output "OneDrive files materialized."
