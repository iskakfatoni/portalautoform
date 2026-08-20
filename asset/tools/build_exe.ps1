# PowerShell Build Script for PORTAL AutoForm.exe
$ErrorActionPreference = "Stop"

$workspaceRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$sourceFile = Join-Path $PSScriptRoot "Launcher.cs"
$iconFile = Join-Path $workspaceRoot "asset\image\logo-smkn1jetis.ico"
$outputExe = Join-Path $workspaceRoot "asset\app\PORTAL AutoForm.exe"

$cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $cscPath)) {
    $cscPath = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}

if (-not (Test-Path $cscPath)) {
    throw "C# compiler (csc.exe) tidak ditemukan di sistem .NET Framework!"
}

Write-Host "🔨 Mengompilasi $sourceFile ..."
Write-Host "📦 Output: $outputExe"
Write-Host "🎨 Icon: $iconFile"

$outputDir = Split-Path -Parent $outputExe
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$compileArgs = @(
    "/nologo",
    "/target:winexe",
    "/optimize+",
    "/platform:anycpu",
    "/r:System.dll",
    "/r:System.Windows.Forms.dll",
    "/win32icon:$iconFile",
    "/out:$outputExe",
    "$sourceFile"
)

& $cscPath $compileArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Kompilasi berhasil! File executable diperbarui di: $outputExe"
} else {
    throw "❌ Kompilasi gagal dengan exit code $LASTEXITCODE"
}
