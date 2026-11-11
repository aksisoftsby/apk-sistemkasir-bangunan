# Kokoh App Bangunan — Release 1.1.1

Aplikasi kasir (POS) offline untuk toko bangunan. Semua data disimpan lokal di perangkat
(SQLite via sql.js + IndexedDB/FileSystem) — tanpa server, tanpa internet.

## Artefak

| File | Ukuran | Keterangan |
| --- | --- | --- |
| `release/KokohAppBangunan-1.1.1-release.aab` | 5,5 MB | **Upload ke Google Play Console** (App Bundle) |
| `release/KokohAppBangunan-1.1.1-release.apk` | 5,7 MB | Untuk instalasi langsung / testing di HP |

- **applicationId**: `id.aksisoft.kokoh`
- **versionName**: `1.1.1` · **versionCode**: `4`
- **minSdk**: 24 (Android 7.0) · **targetSdk / compileSdk**: 36 (Android 16)
- **Nama aplikasi**: Kokoh App Bangunan

> **Kebijakan Google Play**: sejak 31 Agustus 2026 app baru & update wajib menargetkan
> API 36 (Android 16). Build ini sudah `targetSdkVersion 36`, jadi memenuhi syarat.

### SHA-256

```
AAB  B3763FA15918E2FC9492E3362BA246F315469811C4573BC7635D2B98EF407CD5
APK  3138015C779772F70D5FC55A3507E9070AB43704A5AE3161268EEB143E7A8CD8
```

## Yang baru di 1.1.1

### Perbaikan

- **Versi aplikasi tampil benar** — layar *About* & footer Pengaturan kini membaca
  versi dari satu konstanta (`src/lib/appversion.ts`), sebelumnya tertulis `1.0.0`.
- **Screenshot README diperbarui** — 14 tangkapan layar UI English (default),
  termasuk layar **Databases** yang baru; artefak tab bar di screenshot fullpage dihilangkan.

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
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify release\KokohAppBangunan-1.1.1-release.aab
# → jar verified.

& "E:\Android\LocalAndroid\Sdk\build-tools\<versi>\apksigner.bat" verify --print-certs release\KokohAppBangunan-1.1.1-release.apk
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
| 1.1.1 | 4 | Versi tampil benar (About/footer) via konstanta `APP_VERSION`, screenshot README diperbarui (UI EN + layar Databases) |
