# Kokoh App Bangunan — Release 1.2.0

Aplikasi kasir (POS) offline untuk toko bangunan. Semua data disimpan lokal di perangkat
(SQLite via sql.js + IndexedDB/FileSystem) — tanpa server, tanpa internet.

## Artefak

| File | Ukuran | Keterangan |
| --- | --- | --- |
| `release/KokohAppBangunan-1.2.0-release.aab` | 5,5 MB | **Upload ke Google Play Console** (App Bundle) |
| `release/KokohAppBangunan-1.2.0-release.apk` | 5,8 MB | Untuk instalasi langsung / testing di HP |

- **applicationId**: `id.aksisoft.kokoh`
- **versionName**: `1.2.0` · **versionCode**: `5`
- **minSdk**: 24 (Android 7.0) · **targetSdk / compileSdk**: 36 (Android 16)
- **Nama aplikasi**: Kokoh App Bangunan

> **Kebijakan Google Play**: sejak 31 Agustus 2026 app baru & update wajib menargetkan
> API 36 (Android 16). Build ini sudah `targetSdkVersion 36`, jadi memenuhi syarat.

### SHA-256

```
AAB  8ACAF35CE43B1E30DBE476552739246C821714631E639B1504459E54F27B87A1
APK  D2DDA4EC425603537160FE4D490A1387336F57EFCB2BE80EBFB6AEB96405804B
```

## Yang baru di 1.2.0

Rilis ini berisi perbaikan bug prioritas tinggi dan penyempurnaan UI utama
berdasarkan review desain independen.

### Perbaikan bug

- **Toast tidak lagi menutupi tombol aksi.** Notifikasi pindah ke atas layar
  (di bawah app bar) sehingga tombol **Pay / Done & Save** selalu bisa ditekan.
- **Tidak ada lagi teks Indonesia di UI English.** Toast "Transaksi tersimpan"
  diganti `Sale saved`, dan fallback pelanggan "Umum" di riwayat/surat jalan
  sekarang memakai `Walk-in customer` / `Pelanggan Umum`.
- **Pluralisasi benar.** "1 item" (bukan "1 items"), "2 items".
- **Kategori kosong tidak lagi menampilkan "Tanpa Kategori"** di UI English.

### Perbaikan UI

- **Katalog kasir lebih padat.** Banner besar diganti strip ringkasan 48 dp;
  kartu produk menampilkan 8 produk per layar (sebelumnya 6). Ada **toggle
  Grid / Daftar** — pilihan tersimpan di perangkat.
- **Stok tampil dalam satuan jual + konversi dasar.** Contoh: `4 sak (200 kg)`,
  `27.778 dus (40 m²)` — kasir tidak perlu menghitung konversi sendiri.
  Berlaku di Kasir, Produk, dan Stok.
- **Badge hanya untuk stok menipis/habis.** Badge "Safe"/"Aman" yang muncul di
  semua baris dihapus.
- **Tidak ada FAB yang menutupi konten / tombol "+" ganda.** Tombol tambah
  dipindah ke app bar pada Produk, Stok, dan Pembelian.
- **Surat Jalan bisa diubah statusnya langsung.** Tiga chip status
  (Pending / On the way / Received) di tiap baris; alamat tampil penuh.
- **Pengaturan dikelompokkan**: Toko, Operasional, Data & cadangan, Preferensi,
  Tentang.
- **Manajer Database lebih aman**: konfirmasi sebelum Load/Hapus, tombol Load
  disembunyikan untuk file yang sedang aktif (badge **Active** + "Currently in
  use"), dan nama file panjang tampil utuh.
- **Laporan lebih jujur**: grafik satu balok diganti keterangan, "Cash Out Rp 0"
  tidak lagi merah, dan Piutang/Nilai Stok diberi label **Current position**.
- **Kontras diperbaiki** pada kartu gelap (teks hijau/keterangan).

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
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify release\KokohAppBangunan-1.2.0-release.aab
# → jar verified.

& "E:\Android\LocalAndroid\Sdk\build-tools\<versi>\apksigner.bat" verify --print-certs release\KokohAppBangunan-1.2.0-release.apk
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
| 1.2.0 | 5 | P0 bugs (toast, string ID bocor, plural) + UI utama: katalog padat + Grid/Daftar, stok satuan jual, badge selektif, status surat jalan, grup Pengaturan, Database lebih aman, Laporan & kontras |
