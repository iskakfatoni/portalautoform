$ErrorActionPreference = "Stop"

$androidProjectDir = "C:\Users\ISKAK\StudioProjects\ISKAK-AutoForm-Android"
$outputDir = "D:\Cloud\ISKAK\GOOGLE DRIVE\SHARE\APP ANDROID\PORTAL-AUTOFOORM"
$outputApkName = "PORTAL-AutoForm.apk"
$targetApkPath = Join-Path $outputDir $outputApkName

Write-Host "Memulai proses build Android Debug APK..." -ForegroundColor Cyan

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\iskak\AppData\Local\Android\Sdk"

Push-Location $androidProjectDir
Write-Host "Menjalankan Gradle assembleDebug..." -ForegroundColor Yellow
$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c gradlew.bat assembleDebug" -NoNewWindow -Wait -PassThru
Pop-Location

if ($proc.ExitCode -ne 0) {
    Write-Error "Gradle build gagal dengan exit code $($proc.ExitCode)"
    exit $proc.ExitCode
}

$builtApkPath = Join-Path $androidProjectDir "app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $builtApkPath)) {
    Write-Error "File APK hasil build tidak ditemukan di: $builtApkPath"
    exit 1
}

if (-not (Test-Path $outputDir)) {
    Write-Host "Membuat direktori output: $outputDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Write-Host "Menyalin file APK ke: $targetApkPath" -ForegroundColor Cyan
Copy-Item -Path $builtApkPath -Destination $targetApkPath -Force

$fileInfo = Get-Item $targetApkPath
$fileSizeMb = [math]::Round($fileInfo.Length / 1MB, 2)

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "SUKSES! Build APK dan Deploy Berhasil!" -ForegroundColor Green
Write-Host "   - Nama File : $outputApkName" -ForegroundColor Green
Write-Host "   - Target    : $targetApkPath" -ForegroundColor Green
Write-Host "   - Ukuran    : $fileSizeMb MB" -ForegroundColor Green
Write-Host "   - Selesai   : $(Get-Date -Format 'dd-MM-yyyy HH:mm:ss')" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
