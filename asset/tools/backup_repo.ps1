<#
.SYNOPSIS
  Skrip Prosedur Backup Repositori PORTAL:AutoForm ke folder /backup
.DESCRIPTION
  Membuat salinan snapshot dan arsip ZIP dari seluruh kode sumber, konfigurasi,
  dan aset ke folder /backup dengan timestamp dan informasi commit git.
#>

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backupDir = Join-Path $repoRoot "backup"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "📦 Memulai Prosedur Backup Repositori PORTAL:AutoForm..." -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Pastikan folder backup tersedia
if (-not (Test-Path $backupDir)) {
    Write-Host "📁 Membuat direktori backup: $backupDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# 2. Ambil informasi Git terakhir
$gitCommit = "unknown"
$gitBranch = "unknown"
try {
    $gitCommit = (git rev-parse --short HEAD) 2>$null
    $gitBranch = (git rev-parse --abbrev-ref HEAD) 2>$null
} catch {}

$zipName = "portalautoform_backup_${timestamp}_commit_${gitCommit}.zip"
$zipPath = Join-Path $backupDir $zipName

# 3. Kumpulkan file yang akan di-backup (mengecualikan .git, backup, node_modules, dist)
Write-Host "🔍 Mengumpulkan file repositori..." -ForegroundColor Yellow

$tempBackupDir = Join-Path $env:TEMP "portalautoform_backup_temp_$timestamp"
if (Test-Path $tempBackupDir) {
    Remove-Item -Path $tempBackupDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempBackupDir -Force | Out-Null

$excludeFolders = @(".git", "backup", "node_modules", "dist", ".gemini")

Get-ChildItem -Path $repoRoot -Force | Where-Object {
    $name = $_.Name
    -not ($excludeFolders -contains $name)
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $tempBackupDir -Recurse -Force
}

# Tambahkan file metadata backup
$metaContent = @"
================================================
PORTAL:AutoForm - Snapshot Backup Info
================================================
Waktu Backup : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Git Branch   : $gitBranch
Git Commit   : $gitCommit
Target Zip   : $zipName
Sumber Repo  : $repoRoot
================================================
"@
$metaPath = Join-Path $tempBackupDir "BACKUP_INFO.txt"
Set-Content -Path $metaPath -Value $metaContent -Encoding UTF8

# 4. Buat arsip ZIP
Write-Host "🗜️  Mengompresi snapshot menjadi file ZIP: $zipName ..." -ForegroundColor Yellow
if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
}
Compress-Archive -Path "$tempBackupDir\*" -DestinationPath $zipPath -CompressionLevel Optimal

# 5. Salin juga ke folder snapshot snapshot_latest
$latestDir = Join-Path $backupDir "snapshot_latest"
if (Test-Path $latestDir) {
    Remove-Item -Path $latestDir -Recurse -Force
}
Copy-Item -Path $tempBackupDir -Destination $latestDir -Recurse -Force

# Bersihkan direktori temp
Remove-Item -Path $tempBackupDir -Recurse -Force

# 6. Hitung ukuran file ZIP
$zipItem = Get-Item $zipPath
$zipSizeMb = [math]::Round($zipItem.Length / 1MB, 2)

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "✅ SUKSES! Backup Repositori Berhasil Disimpan:" -ForegroundColor Green
Write-Host "   - Arsip ZIP : $zipPath" -ForegroundColor Green
Write-Host "   - Ukuran    : $zipSizeMb MB" -ForegroundColor Green
Write-Host "   - Snapshot  : $latestDir" -ForegroundColor Green
Write-Host "   - Commit    : $gitCommit ($gitBranch)" -ForegroundColor Green
Write-Host "   - Waktu     : $(Get-Date -Format 'dd-MM-yyyy HH:mm:ss')" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
