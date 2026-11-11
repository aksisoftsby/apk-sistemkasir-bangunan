# Panduan Pemakaian — Kokoh App Bangunan

Panduan harian untuk pemilik toko dan kasir: dari buka toko sampai tutup kas.
Semua menu berbahasa Indonesia. Aplikasi **100% offline** — internet hanya
dibutuhkan untuk membuka tautan WhatsApp.

---

## Daftar Isi

1. [Pertama kali membuka aplikasi](#1-pertama-kali-membuka-aplikasi)
2. [Alur harian singkat](#2-alur-harian-singkat)
3. [Kasir: jualan tunai](#3-kasir-jualan-tunai)
4. [Kasir: tempo / kasbon (DP & piutang)](#4-kasir-tempo--kasbon-dp--piutang)
5. [Keranjang: diskon & biaya kirim](#5-keranjang-diskon--biaya-kirim)
6. [Setelah bayar: nota, WhatsApp, surat jalan](#6-setelah-bayar-nota-whatsapp-surat-jalan)
7. [Riwayat, retur & pembatalan](#7-riwayat-retur--pembatalan)
8. [Pelanggan & penagihan piutang](#8-pelanggan--penagihan-piutang)
9. [Produk & harga bertingkat](#9-produk--harga-bertingkat)
10. [Stok & opname](#10-stok--opname)
11. [Pembelian dari supplier](#11-pembelian-dari-supplier)
12. [Kas & shift (buka / tutup kas)](#12-kas--shift-buka--tutup-kas)
13. [Laporan](#13-laporan)
14. [Backup & pindah HP](#14-backup--pindah-hp)
15. [Pengaturan toko & pengguna](#15-pengaturan-toko--pengguna)
16. [Tips & kebiasaan aman](#16-tips--kebiasaan-aman)

---

## 1. Pertama kali membuka aplikasi

Saat pertama dibuka, aplikasi menampilkan **Setup Toko**:

1. Isi **Nama Toko** (wajib, mis. `Toko Bangunan Makmur`), **Alamat**, **No. Telepon / WA**.
2. Isi **Nama Pemilik** dan **PIN 4–6 digit** dua kali (mis. `1234` + `1234`).
   - PIN minimal 4 digit.
   - Konfirmasi PIN harus sama persis.
3. Tekan **Mulai Gunakan Kokoh**.
   - Data contoh otomatis dibuat: ±26 produk, 15 satuan, 10 kategori,
     3 supplier, 3 pelanggan, tier harga Eceran / Grosir / Kontraktor.
   - Anda langsung masuk sebagai **OWNER**.

Setelah itu setiap membuka aplikasi: masukkan **PIN** lewat numpad → otomatis masuk.

> PIN disimpan sebagai hash, bukan angka aslinya. Jika lupa PIN owner dan tidak ada
> user lain, satu-satunya jalan adalah restore dari backup atau install ulang
> (data hilang). Catat PIN di tempat aman.

---

## 2. Alur harian singkat

| Waktu | Kegiatan | Menu |
| --- | --- | --- |
| Pagi | Buka kas, isi modal laci | **Lainnya → Kas & Shift → Buka Kas** |
| Siang | Jual seperti biasa | **Tab Kasir** |
| Ada barang datang | Catat pembelian | **Lainnya → Pembelian → +** |
| Ada yang kasbon | Jual dengan Tempo | **Kasir → Bayar → Tempo** |
| Ada yang bayar utang | Terima pembayaran | **Tab Pelanggan → Piutang → Bayar** |
| Sore | Tutup kas, hitung selisih | **Kas & Shift → Tutup Kas** |
| Rutin | Backup database | **Lainnya → Backup & Restore** |

---

## 3. Kasir: jualan tunai

Tab **Kasir** (ikon keranjang, kiri bawah):

1. **Cari produk** lewat kolom `Cari nama, kode, atau barcode…`
   - Bisa ketik sebagian nama (`semen`, `paku`), SKU (`SMN-001`), atau barcode.
   - Filter kategori lewat chip (`Semua`, `Semen & Beton`, `Bata & Batako`, …).
2. **Tap produk** → sheet produk terbuka:
   - Pilih **Satuan** (mis. `sak` atau `kg`, `dus` atau `m²`). Harga otomatis mengikuti
     satuan yang dipilih.
   - Atur **qty** dengan tombol `−` / `+`, atau tap angka untuk mengetik via numpad.
   - Ubah **Harga satuan** bila perlu nego (tap nominalnya).
   - Perhatikan label **Stok kurang** bila stok tidak cukup (tetap bisa dijual,
     tapi sebaiknya cek stok).
   - Tekan **Tambah · Rp …**.
3. Ulangi untuk barang lain. Footer menunjukkan jumlah item + total.
4. Tekan **Keranjang** untuk meninjau, atau langsung **Bayar**.
5. Di layar **Pembayaran** pilih metode:
   - **Tunai**: masukkan **Uang Diterima** (ketik via numpad atau tombol cepat
     Rp 50rb / 100rb / 200rb / 500rb, atau tombol **Pas**). Kembalian dihitung otomatis.
     Tombol **Selesai & Simpan** aktif hanya bila uang ≥ total.
   - **Transfer**: catat pembayaran manual. Pastikan dana sudah masuk sebelum menyimpan.
     Tidak ada kembalian.
6. Tekan **Selesai & Simpan** → layar **Transaksi Berhasil**.

Nomor nota otomatis: `INV-20261112-0001` (tanggal + urutan hari itu).

---

## 4. Kasir: tempo / kasbon (DP & piutang)

Dipakai saat pembeli tidak bayar penuh (kasbon, proyek, langganan).

1. Di **Keranjang**, tekan **Pilih Pelanggan (Umum)** → pilih pelanggan.
   - Harga otomatis mengikuti **tier harga** pelanggan
     (Eceran / Grosir / Kontraktor). Tanpa pelanggan = harga Eceran.
   - Bila pelanggan punya nama proyek, kolom proyek terisi otomatis.
2. Tekan **Bayar** → di layar Pembayaran pilih:
   - **Tempo**: seluruh total menjadi piutang. Wajib pilih pelanggan.
   - **DP**: masukkan **Nominal DP** (bisa 10 %, 25 %, 50 %, atau ketik manual).
     Sisanya menjadi piutang. Wajib pilih pelanggan.
3. Tentukan **Jatuh Tempo**: `7 / 14 / 30 / 60 hari` dari hari ini.
4. Tekan **Selesai & Simpan**.
   - Di layar sukses terlihat baris **Sisa piutang (jatuh tempo …)**.
   - Nota tempo otomatis tercatat di **Tab Pelanggan → Piutang**.

> Tanpa memilih pelanggan, tombol Tempo/DP tidak bisa dipakai
> (muncul peringatan *Pilih pelanggan untuk transaksi tempo/DP*).

---

## 5. Keranjang: diskon & biaya kirim

Dari sheet **Keranjang**:

- Tap item untuk ubah **qty** (numpad desimal bila satuan mengizinkan, mis. 2,5 m),
  **harga satuan**, atau **hapus** item (ikon sampah).
- **Kosongkan**: hapus seluruh isi keranjang sekaligus.
- **Pilih Pelanggan (Umum)**: ganti / lepas pelanggan.
- **Diskon Nota**: potongan untuk seluruh nota (mis. Rp 10.000).
- **Biaya Kirim**: ongkos antar (mis. Rp 25.000), menambah total.
- Rincian selalu terlihat: Subtotal − Diskon + PPN + Biaya kirim ± Pembulatan = **Total**.
  PPN & pembulatan mengikuti pengaturan toko (default 0).

---

## 6. Setelah bayar: nota, WhatsApp, surat jalan

Layar **Transaksi Berhasil** (centang hijau):

| Tombol | Fungsi |
| --- | --- |
| **Transaksi Baru** | Kembali ke kasir |
| **Cetak / Bagikan Nota (PDF)** | Membuat nota A5 (logo, item, total, dibayar, sisa, footer). Di Android membuka share sheet (cetak / simpan / kirim); di browser mengunduh PDF |
| **Kirim ke WhatsApp** | Membuka chat WA pelanggan berisi ringkasan tagihan (nomor nota, total, dibayar, sisa + jatuh tempo). Gagal bila pelanggan belum punya nomor WA |
| **Buat Surat Jalan** | Isi **Alamat Kirim** + **Nama Sopir** → surat jalan dibuat (mencetak daftar barang **tanpa harga**). Status awal *Belum dikirim* |
| **Lihat Detail Transaksi** | Buka rincian nota (item, pembayaran, retur, tombol batal) |

**Surat jalan** berikutnya dipantau di **Lainnya → Surat Jalan**. Tap status untuk
memajukan: *Belum dikirim → Dalam perjalanan → Diterima*.

---

## 7. Riwayat, retur & pembatalan

**Tab Kasir → ikon riwayat** (kanan atas) membuka **Riwayat Transaksi**:

- Daftar terbaru dulu (maks. 100 per halaman tampil), lengkap dengan status
  (Lunas / Tempo / DP / Batal) dan sisa piutang.
- Tap nota → **Detail Transaksi**: item, pembayaran, retur sebelumnya.
- **Retur Barang**: pilih item + qty yang dikembalikan, isi alasan, pilih kompensasi:
  - `PIUTANG` → mengurangi sisa piutang nota tersebut.
  - `TUNAI` → hanya mencatat retur (stok kembali, kas tidak otomatis berubah).
  - Stok barang **selalu dikembalikan** (`RETURN_IN`).
- **Batalkan Transaksi**: status menjadi `BATAL`, seluruh stok dikembalikan (`VOID`),
  tercatat di audit log. Tidak menghapus nota (jejak tetap ada untuk laporan).
- **Kirim tagihan via WA** dari detail nota tempo (template otomatis).

---

## 8. Pelanggan & penagihan piutang

**Tab Pelanggan** punya dua sub-tab:

**Pelanggan**

- Daftar + tombol `+` / **Tambah Pelanggan**: Nama (wajib), No. WA, Alamat,
  Proyek, Tingkat Harga (Eceran/Grosir/Kontraktor), Limit Kredit, Catatan.
- Tap pelanggan → detail: total piutang, total belanja, riwayat transaksi,
  daftar piutang, tombol **Ubah Data**, **Tagih via WA**, **Transaksi Baru**.

**Piutang**

- Header menampilkan **Total piutang** + jumlah **nota telat jatuh tempo**.
- Setiap baris: nomor nota, pelanggan, sisa, jatuh tempo + badge
  (`Telat N hari` merah / `Jatuh tempo …` kuning / `Tempo` netral).
- Tombol **Bayar** → masukkan nominal (bisa sebagian) + metode (Tunai/Transfer) → simpan.
  - Bayar sebagian: sisa berkurang, status tetap Tempo/DP.
  - Bayar lunas: status menjadi `LUNAS`.
  - Pembayaran tunai otomatis tercatat di kas.
- Tombol **WA** per baris → template penagihan otomatis:
  `Yth Bpk/Ibu …, tagihan nota INV-… sebesar Rp …, jatuh tempo …`.

---

## 9. Produk & harga bertingkat

**Tab Produk**:

- Cari, filter kategori, filter **Stok menipis**, tombol **Kelola Stok** & **Pembelian**.
- Badge merah **Menipis** bila stok ≤ stok minimum; bintang = favorit (muncul paling atas di kasir).
- `+` / **Tambah Produk** membuka form:
  - **Nama Produk** (wajib), SKU, Barcode, Kategori, **Satuan Dasar**
    (satuan tempat stok dihitung — mis. semen = `kg`, keramik = `m²`).
  - **Satuan & Konversi**: tambah satuan jual/beli + faktor konversi
    (mis. `1 sak = 50 kg`, `1 dus = 1,44 m²`). Tandai satuan default jual & beli.
  - **Harga Jual**: matriks per satuan × per tier (Eceran / Grosir / Kontraktor).
  - **Stok & Modal**: stok minimum, stok awal (hanya produk baru), **HPP per satuan dasar**,
    catatan, toggle favorit & aktif.
- Tap produk → ubah; ikon sampah → hapus (soft delete, riwayat transaksi tetap aman).

**Contoh cara berpikir HPP per satuan dasar:**

> Semen dibeli Rp 58.000/sak isi 50 kg → HPP = Rp 1.160/kg.
> Dijual Rp 65.000/sak atau Rp 1.500/kg — laba per kg tetap benar karena
> sistem selalu menghitung `qty_dasar × HPP`.

---

## 10. Stok & opname

**Tab Produk → Kelola Stok** (atau rute `/stock`):

- Header: **Nilai Stok** total (= Σ stok × HPP) + jumlah **Stok Menipis**.
- Sub-tab **Semua** / **Menipis** + pencarian.
- Tap produk → sheet penyesuaian:
  - **Masuk**: tambah stok (koreksi / temuan).
  - **Keluar**: kurangi stok (rusak / hilang / pakai sendiri).
  - **Opname**: samakan dengan hasil hitung fisik? — Isi qty hasil hitung, sistem
    menyesuaikan selisihnya. (Implementasi saat ini menambah/mengurangi sebesar
    qty yang dimasukkan memakai satuan default beli.)
  - Wajib isi **Catatan** (mis. `Opname 12 Nov`, `Pecah 2 dus`).
- **Riwayat Mutasi** per produk: 20 pergerakan terakhir
  (awal, penjualan, pembelian, retur, penyesuaian, batal).

---

## 11. Pembelian dari supplier

**Lainnya → Pembelian**:

- Header: **Total Hutang Supplier** + **Total Pembelian**.
- `+` / **Pembelian baru**:
  1. Pilih **Supplier** (tambah dulu di master bila belum ada).
  2. **Pilih Barang** → atur qty (satuan beli) + harga beli per satuan beli.
  3. Lihat **Total Pembelian** → isi **Dibayar sekarang**:
     - **Lunas** (= total) → status `LUNAS`.
     - **Hutang semua** (= 0) → status `TEMPO`, seluruhnya hutang.
     - **Setengah** atau ketik manual → sisanya hutang.
  4. Simpan → stok bertambah otomatis + **HPP produk diperbarui**
     mengikuti harga beli terakhir (per satuan dasar).

Pembayaran hutang supplier berikutnya dicatat manual sebagai kas keluar
dengan catatan nomor PO.

---

## 12. Kas & shift (buka / tutup kas)

**Lainnya → Kas & Shift**:

1. **Buka Kas**: isi **Kas Awal / Modal Laci** (mis. Rp 200.000) → shift berjalan.
   - Satu user satu shift aktif. Penjualan tunai & pembayaran piutang tunai
     otomatis masuk ke shift ini.
2. Selama shift berjalan catat:
   - **Kas Masuk**: mis. tambahan modal, kategori bebas + catatan.
   - **Kas Keluar**: mis. operasional, bensin, gaji, setor ke pemilik.
   - Kartu KPI menampilkan Kas Awal, Tunai Penjualan, Kas Masuk, Kas Keluar,
     dan **Kas Sistem Saat Ini** (= awal + masuk − keluar).
3. **Tutup Kas**:
   - Lihat **Kas menurut sistem**, lalu hitung uang fisik di laci dan isi
     **Kas fisik dihitung**.
   - Sistem menampilkan **Selisih** (fisik − sistem): positif = lebih, negatif = kurang.
   - Konfirmasi **Tutup Kas** → shift tersimpan di **Riwayat Shift**.

> Tutup kas setiap hari agar selisih ketahuan cepat. Jangan pinjam uang laci
> tanpa mencatat Kas Keluar.

---

## 13. Laporan

**Tab Laporan** — pilih periode: **Hari ini / Kemarin / 7 hari / Bulan ini**.

- Kartu utama: **Omzet**, Laba kotor, Transaksi, Item terjual.
- Kartu keuangan: Kas Masuk, Kas Keluar, Total Piutang, Nilai Stok.
- **Penjualan Harian**: grafik batang omzet per hari pada periode.
- **Produk Terlaris**: peringkat qty + omzet + laba per produk.

Rumus penting:

- Omzet = Σ total nota (tanpa nota Batal).
- Laba kotor = Σ (subtotal item − HPP saat jual × qty dasar).
- Nilai stok = Σ (stok dasar × HPP).

---

## 14. Backup & pindah HP

**Lainnya → Backup & Restore**:

- **Buat Backup Sekarang** → file `kokoh-backup-YYYY-MM-DD-HH-MM-SS.db`.
  - Android: tersimpan di `Documents/backup/` + share sheet (kirim ke WA sendiri /
    Google Drive).
  - Browser: file terunduh otomatis.
  - Tanggal backup terakhir ditampilkan di bawah tombol.
- **Pilih File Backup** → restore. ⚠️ **Data saat ini diganti seluruhnya.**
  Konfirmasi dulu, lalu aplikasi reload otomatis.

### Manajer Database (Lainnya → Database)

Selain backup, ada halaman **Database** untuk mengelola banyak file data:

- **Simpan Database Saat Ini** dengan nama bebas (mis. `stok-opname-nov`)
  → tersimpan dan muncul di daftar.
- **Load** → beralih ke file lain (salinan pengaman dibuat otomatis dulu).
- **Share** → kirim file ke **Telegram, Google Drive, File Manager, WhatsApp**,
  atau simpan di tempat lain lewat share sheet Android.
- **Upload File .db** → impor file dari Download / WA / Drive, lalu muat.
- **Bahasa** juga diatur di halaman ini: **English (default)** atau
  **Bahasa Indonesia** — semua tulisan, angka (`1,250,000` vs `1.250.000`),
  dan tanggal mengikuti pilihan.

**Rutinitas yang disarankan:**

- Backup **setiap hari** setelah tutup kas.
- Simpan minimal 2 salinan (HP + Google Drive / WA sendiri).
- Sebelum ganti HP: backup di HP lama → install aplikasi di HP baru →
  restore file backup → cek saldo stok & piutang.

---

## 15. Pengaturan toko & pengguna

**Lainnya** (tab kelima):

| Menu | Fungsi |
| --- | --- |
| Profil Toko | Nama, alamat, telepon, footer nota, PPN default (%), pembulatan (0/100/500/1000) |
| Pengguna & PIN | Tambah kasir (nama + PIN + peran OWNER/ADMIN/KASIR), nonaktifkan user. Aksi sensitif (batal nota, tutup kas) tercatat atas nama user login |
| Backup & Restore | Seperti bab 14 |
| Database | Simpan/muat/bagikan file database + pilihan Bahasa (EN default / ID) |
| Kas & Shift | Seperti bab 12 |
| Pembelian | Seperti bab 11 |
| Surat Jalan | Seperti bab 6 |
| Bunyi saat scan / Getar / Backup otomatis | Toggle preferensi + pengingat backup harian |
| Tentang Kokoh | Versi aplikasi |
| Keluar | Kembali ke layar PIN |

---

## 16. Tips & kebiasaan aman

1. **Tutup kas + backup setiap hari.** Dua kebiasaan ini mencegah 90% masalah.
2. **Jangan jual di bawah HPP** tanpa sadar — cek laporan laba mingguan.
3. **Stok menipis itu peringatan, bukan pajangan** — segera buat pembelian.
4. **Tempo selalu pakai pelanggan + jatuh tempo.** Tanpa itu piutang tak tertagih.
5. **Tagih via WA maksimal H-1 jatuh tempo**, lalu H+1 dan H+7 bila telat.
6. **Opname sebulan sekali** untuk barang kecil yang rawan selisih
   (paku, baut, kabel per meter).
7. **Satu HP satu database.** Aplikasi ini tidak sinkron antar HP — bila butuh
   dua kasir, bagi shift dalam satu HP atau pisahkan barang per HP.
8. **Jaga keystore & PIN.** Tanpa keystore, update Play Store mustahil;
   tanpa PIN owner + tanpa backup, data terkunci permanen.

---

*Dokumen terkait: [README](../README.md) · [Skema Database](DATABASE.md) ·
[Referensi Fungsi](FUNCTIONS.md) · [Build Android](ANDROID-BUILD.md)*
