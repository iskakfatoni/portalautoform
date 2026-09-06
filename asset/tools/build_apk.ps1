# Script Build Debug APK & Copy to Output Directory
# PORTAL:AutoForm Android App

$ErrorActionPreference = "Stop"

$androidProjectDir = "c:\Users\iskak\Antigravity-Projetcs\PORTAL-AutoForm-ANDROID"
$outputDir = "D:\Cloud\ISKAK\GOOGLE DRIVE\SHARE\APP ANDROID\PORTAL-AUTOFOORM"
$outputApkName = "PORTAL-AutoForm.apk"
$targetApkPath = Join-Path $outputDir $outputApkName

Write-Host "🚀 Memulai proses build Android Debug APK..." -ForegroundColor Cyan

# 1. Konfigurasi Environment Java & Android SDK
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\iskak\AppData\Local\Android\Sdk"

# 2. Masuk ke direktori project Android & jalankan Gradle assembleDebug
Push-Location $androidProjectDir
try {
    Write-Host "📦 Menjalankan Gradle assembleDebug..." -ForegroundColor Yellow
    ./gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle build gagal dengan exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

# 3. Lokasi hasil kompilasi debug APK
$builtApkPath = Join-Path $androidProjectDir "app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $builtApkPath)) {
    throw "File APK hasil build tidak ditemukan di: $builtApkPath"
}

# 4. Buat direktori tujuan jika belum ada
if (-not (Test-Path $outputDir)) {
    Write-Host "📁 Membuat direktori output: $outputDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# 5. Salin dan timpa file APK ke target
Write-Host "🚚 Menyalin file APK ke: $targetApkPath" -ForegroundColor Cyan
Copy-Item -Path $builtApkPath -Destination $targetApkPath -Force

$fileInfo = Get-Item $targetApkPath
$fileSizeMb = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host "✅ SUKSES! File APK berhasil dibuat dan disalin:" -ForegroundColor Green
Write-Host "   - Lokasi: $targetApkPath" -ForegroundColor Green
Write-Host "   - Ukuran: $fileSizeMb MB" -ForegroundColor Green
Write-Host "   - Waktu : $(Get-Date -Format 'dd-MM-yyyy HH:mm:ss')" -ForegroundColor Green
