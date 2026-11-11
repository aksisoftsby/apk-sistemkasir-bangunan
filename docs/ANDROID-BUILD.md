# Panduan Build Android & Rilis ke Play Store

Panduan lengkap dari `npm install` sampai AAB siap upload.

---

## 1. Prasyarat

| Komponen | Versi | Contoh lokasi (mesin ini) |
| --- | --- | --- |
| Node.js | ≥ 20 (diuji 22.20) | — |
| **JDK** | **21** (wajib) | `C:\Program Files\Android\Android Studio\jbr` |
| Android SDK | Platform 36, Build-Tools 36 | `E:\Android\LocalAndroid\Sdk` |
| Gradle | dibundel | `android/gradlew.bat` |

> Capacitor 8 memakai Gradle 8.14 + AGP yang **tidak jalan di JDK 17**.
> JDK default sistem di mesin ini 17 — selalu set `JAVA_HOME` ke JBR Android Studio.

Set variabel setiap sesi PowerShell:

```powershell
$env:JAVA_HOME    = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'E:\Android\LocalAndroid\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
```

Cek cepat:

```powershell
& "$env:JAVA_HOME\bin\java.exe" -version   # harus 21.x
```

---

## 2. Menyiapkan project Android

Folder `android/` **tidak** ikut di repo (lihat `.gitignore`). Buat sekali:

```powershell
npm install
npm run build
npx cap add android      # membuat folder android/
npx cap sync android     # menyalin dist/ + mendaftarkan 7 plugin
```

Setiap kali kode web berubah:

```powershell
npm run build && npx cap sync android
```

`cap sync` = `copy` (dist → `android/app/src/main/assets/public`) + `update` (plugin & Gradle).

---

## 3. Konfigurasi yang perlu diperiksa

### `capacitor.config.ts`

```ts
{
  appId: 'id.aksisoft.kokoh',
  appName: 'Kokoh',
  webDir: 'dist',
  android: { webContentsDebuggingEnabled: false, allowMixedContent: false },
}
```

### `android/variables.gradle`

```gradle
minSdkVersion = 24
compileSdkVersion = 36
targetSdkVersion = 36
```

### `android/app/build.gradle`

```gradle
applicationId "id.aksisoft.kokoh"
versionCode 2
versionName "1.0.1"
```

### `android/app/src/main/AndroidManifest.xml`

```xml
<activity
    android:name=".MainActivity"
    android:screenOrientation="portrait"
    android:windowSoftInputMode="adjustResize"
    ... />
```

`adjustResize` penting supaya numpad/form tidak tertutup keyboard.

---

## 4. Build debug APK

```powershell
cd android
.\gradlew.bat assembleDebug
# android/app/build/outputs/apk/debug/app-debug.apk
```

Instal ke HP (USB debugging aktif):

```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Debug APK ditandatangani dengan debug keystore → **jangan** diunggah ke Play.

---

## 5. Keystore & signing

### 5.1 Memakai keystore yang sudah ada

File keystore **tidak** disimpan di repo. Letakkan di:

```
android/keystore/tukangdigital.keystore
```

Buat `android/keystore.properties` (juga tidak di-commit):

```properties
storeFile=keystore/tukangdigital.keystore
storePassword=********
keyAlias=tukangdigital
keyPassword=********
```

`android/app/build.gradle` membaca file itu otomatis:

```gradle
def keystorePropsFile = rootProject.file('keystore.properties')
def keystoreProps = new Properties()
if (keystorePropsFile.exists()) { keystorePropsFile.withInputStream { keystoreProps.load(it) } }

android {
  signingConfigs {
    release {
      if (keystorePropsFile.exists()) {
        storeFile new File(rootProject.projectDir, keystoreProps.getProperty('storeFile'))
        storePassword keystoreProps.getProperty('storePassword')
        keyAlias keystoreProps.getProperty('keyAlias')
        keyPassword keystoreProps.getProperty('keyPassword')
      }
    }
  }
  buildTypes { release { signingConfig signingConfigs.release } }
}
```

Cek isi keystore (tanpa membuka password asli):

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -list -v `
  -keystore android\keystore\tukangdigital.keystore -storepass ********
```

### 5.2 Membuat keystore baru

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore android\keystore\nama-toko.keystore `
  -alias nama-toko -keyalg RSA -keysize 2048 -validity 10000 `
  -dname "CN=Nama Toko, OU=Mobile, O=AKSISOFT, L=Bekasi, ST=Jawa Barat, C=ID"
```

> Simpan file + password di dua tempat (password manager & flashdisk).
> Kehilangan keystore = aplikasi tidak bisa di-update lagi di Play Store.

---

## 6. Build release

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME='E:\Android\LocalAndroid\Sdk'

cd android
.\gradlew.bat bundleRelease assembleRelease
```

| Keluaran | Path |
| --- | --- |
| AAB (Play Store) | `android/app/build/outputs/bundle/release/app-release.aab` |
| APK (testing / bagi langsung) | `android/app/build/outputs/apk/release/app-release.apk` |

Salin ke folder rilis dengan nama jelas:

```powershell
copy app\build\outputs\bundle\release\app-release.aab ..\release\KokohAppBangunan-1.0.1-release.aab
copy app\build\outputs\apk\release\app-release.apk     ..\release\KokohAppBangunan-1.0.1-release.apk
```

### Verifikasi

```powershell
# APK: cek skema tanda tangan + sertifikat
& "$env:JAVA_HOME\bin\java.exe" -jar "$env:ANDROID_HOME\build-tools\36.0.0\lib\apksigner.jar" `
  verify --verbose --print-certs ..\release\KokohAppBangunan-1.0.1-release.apk

# AAB: cek tanda tangan JAR
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify ..\release\KokohAppBangunan-1.0.1-release.aab

# Metadata paket
& "$env:ANDROID_HOME\build-tools\36.0.0\aapt2.exe" dump badging ..\release\KokohAppBangunan-1.0.1-release.apk |
  Select-String "package:|targetSdkVersion|application-label:"
```

Yang harus terlihat:

```
Verifies
Verified using v2 scheme (APK Signature Scheme v2): true
package: name='id.aksisoft.kokoh' versionCode='2' versionName='1.0.1'
targetSdkVersion:'36'
application-label:'Kokoh App Bangunan'
```

---

## 7. Naikkan versi

Setiap upload ke Play Console **wajib** memakai `versionCode` lebih besar.

```gradle
versionCode 3
versionName "1.0.2"
```

Saran penomoran:

| Perubahan | Contoh |
| --- | --- |
| Perbaikan bug | `1.0.2` (code 3) |
| Fitur baru | `1.1.0` (code 4) |
| Perubahan besar | `2.0.0` (code 10) |

---

## 8. Ikon, splash, dan aset Play Store

```powershell
node scripts/gen-assets.cjs                # logo.webp → assets/*.png
npx @capacitor/assets generate --android   # → res/mipmap-* & res/drawable-*
```

- `assets/icon-foreground.png` — konten transparan, dipakai adaptive icon
  (XML generator sudah memberi inset 16,7 % → safe zone 66 %).
- `assets/icon-background.png` — navy `#0B2A63`.
- `assets/icon-only.png` — ikon legacy/store 1024×1024.
- `assets/splash.png` & `splash-dark.png` — 2732×2732.

Aset khusus Play Console (tidak masuk APK) ada di `store-assets/`:

| Aset | Ukuran wajib |
| --- | --- |
| `feature-graphic.jpg` | 1024 × 500 px |
| `banner.webp` | banner promosi |
| Ikon aplikasi Play | 512 × 512 px PNG (ambil dari `assets/icon-only.png`) |
| Screenshot | minimal 2, disarankan 4–8 (ambil dari `docs/screenshots/`) |

---

## 9. Upload ke Google Play Console

1. Buka **Play Console → aplikasi → Production → Create new release**.
2. Upload `KokohAppBangunan-1.0.1-release.aab`.
3. Isi **Release notes** (contoh: “Rilis pertama: kasir, stok multi-satuan, piutang, surat jalan, laporan.”).
4. Periksa **App content** (wajib sebelum rilis pertama):
   - Privacy policy (aplikasi offline, tidak mengumpulkan data → tetap wajib diisi).
   - **Data safety**: pilih “No data collected / shared”.
   - Target audience, ads (tidak ada iklan), content rating.
   - Government apps, financial features → biasanya “none”.
5. **Store listing**: nama, deskripsi pendek/panjang, ikon 512 px, feature graphic, screenshot.
6. **Countries/regions** → pilih Indonesia (atau semua).
7. Rollout → **Review** → **Start rollout to Production**.

### Kebijakan target API level

Sejak **31 Agustus 2026**, aplikasi baru dan update **wajib** menargetkan **API 36 (Android 16)**
atau lebih tinggi. AAB ini sudah `targetSdkVersion 36`, jadi tidak akan ditolak.

Catatan: Play Console menaikkan persyaratan ini setiap tahun (Agustus). Sebelum rilis berikutnya,
cek `variables.gradle` dan naikkan `compileSdkVersion` / `targetSdkVersion` bila perlu.

---

## 10. Troubleshooting build

| Pesan error | Penyebab | Solusi |
| --- | --- | --- |
| `Unsupported class file major version 65` | Gradle memakai JDK 17 | Set `JAVA_HOME` ke JBR (JDK 21) |
| `SDK location not found` | `ANDROID_HOME` kosong | Set env var, atau buat `android/local.properties` berisi `sdk.dir=E:\\Android\\LocalAndroid\\Sdk` |
| `Gradle build daemon disappeared unexpectedly` | RAM habis (mesin kecil) | Tutup Chrome/emulator; `android/gradle.properties` sudah `-Xmx1280m`, `workers.max=2`, daemon off |
| `Keystore was tampered with, or password was incorrect` | Password/alias salah | Cek `keystore.properties`; alias bisa dilihat dengan `keytool -list` |
| `AAPT2 aapt2-…-windows.jar daemon #0: Daemon startup failed` | Path berisi karakter aneh / antivirus | Pindahkan project ke path pendek, jalankan sebagai admin sekali |
| `app-release.apk is not signed` | `keystore.properties` tidak ada | Buat file tersebut, lalu rebuild |
| Build sukses tapi layar putih | `dist/` belum di-build | `npm run build && npx cap sync android` |
| Perubahan kode tidak muncul | Lupa sync | `npm run build && npx cap sync android`, lalu rebuild |
| Ikon masih lama setelah install | Cache launcher | Uninstall aplikasi, install ulang |

### Menguji di HP tanpa emulator

```powershell
adb devices                       # pastikan HP terdeteksi
cd android
.\gradlew.bat installRelease      # build + install sekaligus
adb logcat | Select-String "Capacitor|kokoh"
```

Emulator API 36 butuh RAM ≥ 4 GB; pada mesin 8 GB dengan GPU Intel HD sering crash
(`X86 DAG->DAG Instruction Selection`). Uji di HP fisik lebih andal.

---

## 11. Checklist sebelum rilis

- [ ] `npm run build` bersih (0 error TypeScript)
- [ ] Uji alur: setup → login → jual tunai → jual tempo → bayar piutang → pembelian → tutup kas
- [ ] `versionCode` naik, `versionName` diperbarui
- [ ] AAB ter-sign dengan keystore rilis (`jarsigner -verify` → `jar verified`)
- [ ] `aapt2 dump badging` menunjukkan `targetSdkVersion:'36'`
- [ ] Ikon & splash tampil benar di HP
- [ ] Backup database diuji (buat file → restore)
- [ ] Store listing & Data safety lengkap
- [ ] Hash SHA-256 AAB dicatat di `RELEASE.md`
- [ ] Salinan keystore + password disimpan di tempat aman
