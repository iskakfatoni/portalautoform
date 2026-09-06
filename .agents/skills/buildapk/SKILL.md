---
name: buildapk
description: Membangun Android Debug APK (PORTAL:AutoForm) dan menyalin hasilnya ke D:\Cloud\ISKAK\GOOGLE DRIVE\SHARE\APP ANDROID\PORTAL-AUTOFOORM\PORTAL-AutoForm.apk (menimpa file jika sudah ada).
---

# 🤖 Prosedur Perintah /buildapk

Instruksi ketika pengguna menjalankan perintah `/buildapk`:

1. **Jalankan script otomatis** [`asset/tools/build_apk.ps1`](file:///c:/Users/iskak/Antigravity-Projetcs/portalautoform/asset/tools/build_apk.ps1) melalui PowerShell:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "c:\Users\iskak\Antigravity-Projetcs\portalautoform\asset\tools\build_apk.ps1"
   ```

2. **Atau jalankan langkah manual berikut:**
   * Konfigurasi Environment:
     ```powershell
     $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
     $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
     $env:ANDROID_HOME = "C:\Users\iskak\AppData\Local\Android\Sdk"
     ```
   * Masuk ke folder Android:
     `c:\Users\iskak\Antigravity-Projetcs\PORTAL-AutoForm-ANDROID`
   * Jalankan Gradle build:
     `./gradlew.bat assembleDebug`
   * Salin file APK hasil build:
     Dari: `c:\Users\iskak\Antigravity-Projetcs\PORTAL-AutoForm-ANDROID\app\build\outputs\apk\debug\app-debug.apk`  
     Ke: `D:\Cloud\ISKAK\GOOGLE DRIVE\SHARE\APP ANDROID\PORTAL-AUTOFOORM\PORTAL-AutoForm.apk`  
     *(Gunakan flag `-Force` untuk menimpa file lama).*

3. **Laporkan hasil build** kepada pengguna (status keberhasilan, path target, ukuran file, dan timestamp).
