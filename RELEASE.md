# Kokoh App Bangunan — Release 1.0.1

Aplikasi kasir (POS) offline untuk toko bangunan. Semua data disimpan lokal di perangkat
(SQLite via sql.js + IndexedDB/FileSystem) — tanpa server, tanpa internet.

## Artefak

| File | Ukuran | Keterangan |
| --- | --- | --- |
| `release/KokohAppBangunan-1.0.1-release.aab` | 5,5 MB | **Upload ke Google Play Console** (App Bundle) |
| `release/KokohAppBangunan-1.0.1-release.apk` | 5,7 MB | Untuk instalasi langsung / testing di HP |

- **applicationId**: `id.aksisoft.kokoh`
- **versionName**: `1.0.1` · **versionCode**: `2`
- **minSdk**: 24 (Android 7.0) · **targetSdk / compileSdk**: 36 (Android 16)
- **Nama aplikasi**: Kokoh App Bangunan
- **Orientasi**: portrait (di layar besar Android 16 lock diabaikan sistem)

> **Kebijakan Google Play**: sejak 31 Agustus 2026 app baru & update wajib menargetkan
> API 36 (Android 16). Build ini sudah `targetSdkVersion 36`, jadi memenuhi syarat.

### SHA-256

```
AAB  7D553A25E9F6B38423237E4E316B2295C0E4AC612C5ED5CFBEF5B361C81A51DA
APK  34D69CE3322261B5393FF3035293FDD294730B690D480022E132E41A6DDA704C
```

### Tanda tangan

- Keystore: `android/keystore/tukangdigital.keystore`
- Alias: `tukangdigital` · RSA · berlaku s/d 25 Feb 2044
- Sertifikat: `CN=DoniMuslimin, OU=TukangDigital, O=TukangDigital, L=Surabaya, ST=JawaTimur, C=62`
- SHA-256 sertifikat: `CB0B960FC9E0FC7762A3537671F70413905915D019D275C26DA1F2914C5A37BC`
- Password: lihat `android/keystore.properties` (jangan dibagikan/commit).
- AAB diverifikasi `jarsigner`, APK diverifikasi `apksigner` (skema v2).

> **PENTING**: simpan `tukangdigital.keystore` + password di tempat aman.
> Tanpa file ini, aplikasi tidak bisa di-update di Play Store.

## Cara build ulang

```powershell
# 1. Build web
npm run build

# 2. Sinkron ke Android
npx cap sync android

# 3. Build signed AAB + APK
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME='E:\Android\LocalAndroid\Sdk'
cd android
.\gradlew.bat bundleRelease assembleRelease
```

Hasil: `android/app/build/outputs/bundle/release/app-release.aab` dan
`android/app/build/outputs/apk/release/app-release.apk`.

JDK wajib 21 (Capacitor 8). JDK bawaan sistem (17) akan gagal.
`android/gradle.properties` sudah dibatasi (`-Xmx1280m`, `workers.max=2`, daemon off)
karena mesin build berspesifikasi rendah — kalau build crash "daemon disappeared",
tutup aplikasi lain dulu.

## Naikkan versi

Edit `android/app/build.gradle`:

```gradle
versionCode 3        // WAJIB naik setiap upload ke Play
versionName "1.0.2"
```

## Ikon & splash

Sumber: `assets/icon-only.png`, `icon-foreground.png`, `icon-background.png`,
`splash.png`, `splash-dark.png` (dibuat oleh `node scripts/gen-assets.cjs` dari
`public/assets/logo.webp`, latar navy `#0B2A63`).

Regenerate resource Android:

```powershell
node scripts/gen-assets.cjs
npx @capacitor/assets generate --android
```

Grafik khusus Play Store (bukan bagian APK) ada di `store-assets/`:
`feature-graphic.jpg`, `banner.webp`.

## Struktur fitur

- **Kasir**: pencarian/favorit/kategori, satuan multi (sak/kg, dus/m², pak/buah), diskon,
  pembayaran tunai / transfer / QRIS / DP / tempo, nomor nota otomatis.
- **Produk**: HPP per satuan dasar, harga per tier (eceran/grosir/proyek), stok minimum,
  penyesuaian stok (opname), nilai stok.
- **Pelanggan**: piutang, jatuh tempo, pengingat WhatsApp, proyek.
- **Pembelian**: barang masuk dari supplier, update stok + HPP otomatis, hutang supplier.
- **Laporan**: omzet, laba kotor, item terjual, kas masuk/keluar, piutang, nilai stok,
  grafik penjualan harian, produk terlaris.
- **Kas & Shift**: buka kas, kas masuk/keluar, tutup kas + selisih, riwayat shift.
- **Lainnya**: profil toko, pengguna & PIN, backup/restore database, surat jalan.

## Catatan pengujian

- Uji end-to-end browser (390×844) lulus: setup toko, login PIN, transaksi tunai, tempo &
  piutang, pembayaran piutang, pembelian supplier, stok opname, shift kas, surat jalan,
  laporan — tanpa error konsol.
- Emulator Android tidak bisa dipakai di mesin ini (crash `X86 DAG->DAG Instruction
  Selection` karena RAM/GPU terbatas), jadi verifikasi native dilakukan pada level build:
  APK/AAB ter-sign, `aapt2 badging` benar, dan aset web (`index.html`, `sql-wasm.wasm`)
  terpaket di `assets/public/`.
