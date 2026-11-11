# Kokoh App Bangunan — Release 1.1.0

Aplikasi kasir (POS) offline untuk toko bangunan. Semua data disimpan lokal di perangkat
(SQLite via sql.js + IndexedDB/FileSystem) — tanpa server, tanpa internet.

## Artefak

| File | Ukuran | Keterangan |
| --- | --- | --- |
| `release/KokohAppBangunan-1.1.0-release.aab` | 5,5 MB | **Upload ke Google Play Console** (App Bundle) |
| `release/KokohAppBangunan-1.1.0-release.apk` | 5,7 MB | Untuk instalasi langsung / testing di HP |

- **applicationId**: `id.aksisoft.kokoh`
- **versionName**: `1.1.0` · **versionCode**: `3`
- **minSdk**: 24 (Android 7.0) · **targetSdk / compileSdk**: 36 (Android 16)
- **Nama aplikasi**: Kokoh App Bangunan
- **Orientasi**: portrait (di layar besar Android 16 lock diabaikan sistem)

> **Kebijakan Google Play**: sejak 31 Agustus 2026 app baru & update wajib menargetkan
> API 36 (Android 16). Build ini sudah `targetSdkVersion 36`, jadi memenuhi syarat.

### SHA-256

```
AAB  C07F83612E412673ED911DF9FD04CA70D89ED1EC98104B31D627ED82920DD687
APK  BE7FBF9335243C1955901588F14833FE0056171578512B2FF367450A98F163EC
```

## Yang baru di 1.1.0

### Dua Bahasa (English default + Bahasa Indonesia)

- **English** adalah bahasa default untuk instalasi baru; **Bahasa Indonesia**
  bisa dipilih kapan saja.
- Pindah bahasa: **More → Databases → Language** (English) atau
  **Lainnya → Database → Bahasa** (Indonesia). Pilihan tersimpan di perangkat.
- Semua layar (± 550 string), nota PDF, surat jalan, dan template WhatsApp
  mengikuti bahasa aktif.
- **Angka & tanggal mengikuti bahasa**:
  - English: `1,250,000` · `2.5` · `Nov 12, 2026`
  - Indonesia: `1.250.000` · `2,5` · `12 Nov 2026`

### Manajer Database

- **Simpan Database Saat Ini** di bawah nama bebas (mis. `stok-opname-nov`)
  — tersimpan di `Documents/databases/` (Android) atau IndexedDB (browser).
- **Daftar Database Tersimpan**: tap **Load** untuk beralih ke file lain
  (salinan pengaman otomatis dibuat sebelum mengganti), **Share** untuk
  mengirim via sistem share sheet (**Telegram, Google Drive, File Manager,
  WhatsApp**, …), **Hapus** untuk membersihkan.
- **Upload File Database**: impor file `.db` dari Download / WhatsApp / Drive,
  lalu muat kapan saja.
- File aktif terakhir ditandai badge **Active**.

## Build

```powershell
npm run build                    # tsc + vite
npx cap sync android
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME='E:\Android\LocalAndroid\Sdk'
cd android
.\gradlew.bat bundleRelease assembleRelease
```

Verifikasi tanda tangan:

```powershell
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify release\KokohAppBangunan-1.1.0-release.aab
# → jar verified.

& "E:\Android\LocalAndroid\Sdk\build-tools\<versi>\apksigner.bat" verify --print-certs release\KokohAppBangunan-1.1.0-release.apk
# → CN=DoniMuslimin, OU=TukangDigital ...
```

## Penandatanganan

- **Keystore**: `android/keystore/tukangdigital.keystore` (tidak ikut repo — di-ignore git).
- **Alias**: `tukangdigital`
- **Sertifikat SHA-256**: `cb0b960fc9e0fc7762a3537671f70413905915d019d275c26da1f2914c5a37bc`
- Password tersimpan di `android/keystore.properties` (juga tidak di-commit).
- **Jangan pernah ganti keystore** — Play Store menolak update dengan sertifikat berbeda.

## Riwayat versi

| Versi | versionCode | Isi |
| --- | --- | --- |
| 1.0.1 | 2 | Rilis awal: kasir lengkap, ikon/splash baru, penandatanganan tukangdigital |
| 1.1.0 | 3 | Dua bahasa (EN default + ID), format angka/tanggal per bahasa, Manajer Database (simpan/muat/upload/bagikan) |
