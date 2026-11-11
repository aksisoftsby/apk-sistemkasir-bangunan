# Referensi Fungsi & Komponen

Dokumen ini menjelaskan **setiap fungsi publik** di aplikasi Kokoh App Bangunan: tanda tangan
(signature), parameter, nilai balik, efek samping, dan catatan pemakaian.

- [0. Konvensi umum](#0-konvensi-umum)
- [1. `lib/db.ts` — mesin database](#1-libdbts--mesin-database)
- [2. `lib/repo.ts` — operasi data](#2-libreputs--operasi-data)
  - [2.1 Master data](#21-master-data)
  - [2.2 Produk & harga](#22-produk--harga)
  - [2.3 Stok](#23-stok)
  - [2.4 Pelanggan & piutang](#24-pelanggan--piutang)
  - [2.5 Penjualan](#25-penjualan)
  - [2.6 Retur & surat jalan](#26-retur--surat-jalan)
  - [2.7 Pembelian](#27-pembelian)
  - [2.8 Pesanan ditahan (hold)](#28-pesanan-ditahan-hold)
  - [2.9 Shift kas](#29-shift-kas)
  - [2.10 Pengaturan & pengguna](#210-pengaturan--pengguna)
- [3. `lib/report.ts` — laporan](#3-libreports--laporan)
- [4. `lib/format.ts` — format angka & tanggal](#4-libformatts--format-angka--tanggal)
- [5. `lib/id.ts` — identitas & PIN](#5-libidts--identitas--pin)
- [6. `lib/receipt.ts` — nota, surat jalan, WhatsApp](#6-libreceiptts--nota-surat-jalan-whatsapp)
- [7. `lib/backup.ts` — backup & restore](#7-libbackupts--backup--restore)
- [8. `lib/schema.ts` & `lib/seed.ts`](#8-libschemas--libseedts)
- [9. Stores (Zustand)](#9-stores-zustand)
- [10. Komponen UI](#10-komponen-ui)
- [11. Ikon](#11-ikon)

---

## 0. Konvensi umum

| Aturan | Penjelasan |
| --- | --- |
| **Sinkron** | Hampir semua fungsi di `lib/` bersifat **sinkron** (sql.js berjalan di thread UI). Hanya `initDb`, `flushDb`, `exportDbBytes`, `importDbBytes`, `resetDb`, dan fungsi di `receipt.ts`/`backup.ts` yang `async`. |
| **Prasyarat** | Fungsi `repo.*` dan `report.*` hanya boleh dipanggil **setelah** `await initDb()` selesai (dijamin oleh gate di `App.tsx`). |
| **Auto re-render** | Setiap fungsi tulis memanggil `notifyChange()`. Komponen yang membaca data harus memakai `useDbVersion()` agar ikut ter-render ulang. |
| **Nominal uang** | Selalu `number` **integer rupiah**. Pembulatan dilakukan pemanggil / `Math.round`. |
| **Qty stok** | Selalu dalam **satuan dasar** produk (`qty_dasar = qty × konversi`). |
| **Transaksi** | Operasi multi-tabel dibungkus `begin()/commit()/rollback()` dan akan `throw` bila gagal, sehingga tidak ada data setengah jadi. |
| **Soft delete** | `deleteProduct` / `deleteCustomer` / `deleteUser` hanya mengisi `deleted_at` (data historis tetap utuh). |

Contoh pola pemakaian di komponen:

```tsx
const ver = useDbVersion();
const rows = useMemo(() => listProducts({ search }), [search, ver]);
```

---

## 1. `lib/db.ts` — mesin database

Modul ini adalah satu-satunya tempat yang menyentuh sql.js dan media penyimpanan.

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `initDb` | `() => Promise<void>` | Memuat WASM, membaca file database dari IndexedDB (`kokoh-db` → store `files` → key `kokoh.sqlite`) atau `Filesystem` `Directory.Data/kokoh.sqlite`, menjalankan `SCHEMA_SQL`, lalu seed bila database baru. Aman dipanggil berulang (langsung `return` jika sudah siap). |
| `isReady` | `() => boolean` | `true` bila database sudah diinisialisasi. |
| `all<T>` | `(sql: string, params?: unknown[]) => T[]` | `SELECT` banyak baris → array objek. Mengembalikan `[]` bila kosong. |
| `get<T>` | `(sql: string, params?: unknown[]) => T \| null` | `SELECT` satu baris pertama, `null` bila tidak ada. |
| `run` | `(sql: string, params?: unknown[]) => number` | `INSERT/UPDATE/DELETE`. Mengembalikan `last_insert_rowid()` / jumlah baris bila tersedia. **Tidak** memicu persistensi otomatis — panggil `notifyChange()` sesudahnya. |
| `exec` | `(sql: string) => void` | Menjalankan banyak statement sekaligus (DDL, script). |
| `begin` / `commit` / `rollback` | `() => void` | Transaksi manual. Selalu pakai `try/catch` + `rollback()` di `catch`. |
| `notifyChange` | `() => void` | Menaikkan versi global + menjadwalkan penyimpanan file (debounce 600 ms) + memberi tahu semua subscriber. |
| `useDbVersion` | `() => number` | Hook React (`useSyncExternalStore`) — komponen yang memanggilnya akan re-render setiap data berubah. |
| `flushDb` | `() => Promise<void>` | Memaksa penyimpanan ke disk segera (dipakai sebelum backup, saat app di-background, dan saat tutup shift). |
| `exportDbBytes` | `() => Promise<Uint8Array>` | Mengambil byte database lengkap (untuk backup). `throw` bila belum siap. |
| `importDbBytes` | `(bytes: Uint8Array) => Promise<void>` | Mengganti database aktif dengan byte yang diberikan, menyimpan, lalu `notifyChange()`. |
| `resetDb` | `() => Promise<void>` | Menghapus database dan memulai ulang dari nol (dipakai untuk uji / factory reset). |
| `useAutoSaveOnHide` | `() => void` | Hook yang memanggil `flushDb()` saat `visibilitychange`/`pagehide` — mencegah kehilangan data terakhir. |

**Catatan performa**

- Penyimpanan file memakai mekanisme `saving/saveAgain` agar tidak ada dua penulisan bersamaan.
- `Database.export()` menyalin seluruh file; pada database besar (± 2 MB) prosesnya < 100 ms.
  Karena itu pemanggilan dibatasi dengan debounce 600 ms.

---

## 2. `lib/repo.ts` — operasi data

Berisi 47 fungsi untuk seluruh entitas. Semua yang menulis data akan memicu `notifyChange()`
(baik langsung maupun lewat `applyStockMovement`).

### 2.1 Master data

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `listCategories` | `() => Category[]` | Kategori produk, urut nama. |
| `listUnits` | `() => Unit[]` | Satuan (kg, sak, dus, m², …). |
| `listPriceTiers` | `() => PriceTier[]` | Tier harga (Eceran, Grosir, Proyek), urut `urutan`. |
| `listSuppliers` | `() => Supplier[]` | Supplier aktif (belum dihapus). |
| `getStoreProfile` | `() => StoreProfile \| null` | Profil toko (baris pertama `store_profile`). |
| `saveStoreProfile` | `(p: { nama; alamat; telp; logo?; footer_nota?; ppn_persen?; pembulatan? }) => void` | Simpan/ubah profil toko; dipakai juga oleh layar Setup. |

### 2.2 Produk & harga

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `listProducts` | `(f?: ProductListFilters) => ProductView[]` | Filter: `search` (nama/SKU/barcode), `categoryId`, `favoritOnly`, `lowStockOnly`, `includeInactive`. Hasil sudah berisi `kategori_nama`, `base_unit_simbol`, `stok_dasar`. Urut: favorit dulu, lalu nama. |
| `getProduct` | `(id: string) => ProductView \| null` | Satu produk + join kategori/satuan/stok. |
| `getProductUnits` | `(productId: string) => (ProductUnit & { unit_nama; unit_simbol; allow_decimal; decimal_places })[]` | Semua satuan produk beserta faktor `konversi`. |
| `getProductPrices` | `(productId: string) => ProductPrice[]` | Semua harga (per satuan × per tier). |
| `getPriceFor` | `(productUnitId: string, tierId: string) => number` | Harga untuk kombinasi satuan+tier; fallback ke harga tertinggi satuan tersebut; `0` bila tidak ada. |
| `saveProduct` | `(input: ProductInput) => string` | Insert/update produk **beserta** satuan & harga (delete-then-insert di dalam satu transaksi). Mengembalikan `id`. Bila produk baru dan `stok_awal > 0`, otomatis membuat mutasi `STOK_AWAL`. |
| `deleteProduct` | `(id: string) => void` | Soft delete + `aktif = 0`. |
| `toggleFavorit` | `(id: string, value: number) => void` | Tandai/lepas favorit (`1`/`0`) untuk tampil di atas katalog kasir. |

`ProductInput`:

```ts
{
  id?: string;                 // kosong = produk baru
  sku: string; barcode: string; nama: string;
  category_id: string; base_unit_id: string;
  hpp: number;                 // HPP per SATUAN DASAR
  stok_min: number; favorit: number; aktif: number; catatan: string;
  units: { unit_id: string; konversi: number; is_default_jual: number; is_default_beli: number }[];
  prices: { unit_id: string; tier_id: string; harga: number }[];
  stok_awal?: number;          // hanya untuk produk baru (satuan dasar)
}
```

### 2.3 Stok

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `applyStockMovement` | `(productId, tipe, qtyDasar, hppUnit, refType, refId, catatan, userId?) => void` | **Primitif stok**: menulis satu baris `stock_movements` lalu menambah/mengurangi `stock_balances` secara atomik (`ON CONFLICT … DO UPDATE`). `tipe` ∈ `STOK_AWAL | SALE | PURCHASE | RETURN_IN | ADJUST_IN | ADJUST_OUT | OPNAME | VOID`. Nilai negatif = stok keluar. |
| `stockLabel` | `(stokDasar: number, konversi: number, simbol: string) => string` | Format tampilan stok, mis. `8000 pcs` atau `2,5 kg`. |

### 2.4 Pelanggan & piutang

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `listCustomers` | `(search?: string) => Customer[]` | Cari pada nama/telepon/kode. |
| `getCustomer` | `(id: string) => Customer \| null` | Satu pelanggan. |
| `saveCustomer` | `(c: Omit<Customer, 'id' \| 'created_at' \| 'deleted_at'> & { id?: string }) => string` | Insert/update. Mengembalikan `id`. |
| `deleteCustomer` | `(id: string) => void` | Soft delete. |
| `listReceivables` | `(customerId?: string) => ReceivableRow[]` | Nota dengan `sisa > 0` + nama pelanggan, sisa, jatuh tempo, umur keterlambatan. |
| `totalReceivable` | `(customerId?: string) => number` | Total sisa piutang (opsional per pelanggan). |
| `payReceivable` | `(saleId: string, jumlah: number, metode: string, userId: string) => void` | Terima pembayaran piutang. `jumlah` dipotong ke `sisa`; menulis `receivable_payments`, memperbarui `sales.total_bayar/sisa/status` (jadi `LUNAS` bila lunas). Bila `metode === 'TUNAI'` juga mencatat `cash_transactions` kategori `Pelunasan Piutang`. `throw` bila transaksi tidak ada atau `jumlah <= 0`. |

### 2.5 Penjualan

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `nextNotaNumber` | `() => string` | `INV-YYYYMMDD-NNNN`, urut per hari (berdasarkan jumlah nota hari itu). |
| `createSale` | `(input: SaleInput, userId: string, shiftId: string \| null) => Sale` | **Inti transaksi.** Menghitung subtotal, diskon, PPN, biaya kirim, pembulatan; menentukan status `LUNAS/TEMPO/DP`; menulis `sales`, `sale_items`, `sale_payments`, mengurangi stok (`SALE`), dan mencatat kas bila tunai. Semua dalam satu transaksi DB. |
| `listSales` | `(opts?: { from?; to?; search?; status?; customerId?; limit? }) => SaleView[]` | Riwayat transaksi + `customer_nama`, `kasir_nama`, `item_count`. Default limit 100, urut terbaru. `to` otomatis dijadikan `23:59:59`. |
| `getSale` | `(id: string) => Sale \| null` | Header transaksi. |
| `getSaleItems` | `(saleId: string) => SaleItem[]` | Item transaksi (menyimpan `nama_produk`, `satuan`, `hpp_saat_jual` sebagai snapshot). |
| `getSalePayments` | `(saleId: string) => SalePayment[]` | Daftar pembayaran (metode, jumlah, waktu). |
| `voidSale` | `(saleId: string, userId: string, alasan: string) => void` | Batalkan transaksi: status `BATAL`, stok dikembalikan (`VOID`), dan menulis audit log. |

`SaleInput`:

```ts
{
  customer_id: string | null; proyek: string; catatan: string;
  diskon: number; biaya_kirim: number; ppn_persen: number; pembulatan: number;
  metode: 'TUNAI' | 'TRANSFER' | 'QRIS' | 'TEMPO' | 'DP';
  dibayar: number;                 // diabaikan/dipaksa = total untuk TUNAI/TRANSFER/QRIS
  jatuh_tempo: string | null;      // 'YYYY-MM-DD'
  items: { product_id; product_unit_id; unit_id; unit_simbol;
           qty; konversi; harga_satuan; diskon; nama_produk; hpp }[];
}
```

### 2.6 Retur & surat jalan

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `createSaleReturn` | `(saleId, items: { sale_item_id; qty; harga_satuan; qty_dasar; subtotal }[], kompensasi, alasan, userId) => string` | Catat retur. Stok dikembalikan (`RETURN_IN`). `kompensasi` menentukan efek ke nota: `PIUTANG` mengurangi sisa piutang, `TUNAI` hanya menyesuaikan sisa. |
| `listSaleReturns` | `(saleId: string) => { id; tanggal; total; kompensasi; alasan }[]` | Riwayat retur sebuah nota. |
| `getDelivery` | `(saleId: string) => Delivery \| null` | Surat jalan terakhir untuk nota (1 nota = 1 surat jalan aktif). |
| `saveDelivery` | `(d: { sale_id; alamat_kirim; sopir; status }) => void` | Insert atau update surat jalan (upsert berdasarkan `sale_id`). |
| `listDeliveries` | `() => (Delivery & { no_nota; customer_nama })[]` | Semua pengiriman + nomor nota & pelanggan, terbaru dulu. |

### 2.7 Pembelian

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `listPurchases` | `() => (Purchase & { supplier_nama })[]` | Semua pembelian + nama supplier. |
| `createPurchase` | `(input, userId) => string` | Catat barang masuk: menulis `purchases` + `purchase_items`, menambah stok (`PURCHASE`), dan **memperbarui HPP** produk menjadi `harga_beli / konversi` (per satuan dasar). Status `LUNAS` bila `total_bayar >= total`, selain itu `TEMPO` dengan `sisa`. |

Input: `{ supplier_id, total_bayar, jatuh_tempo, items: { product_id; product_unit_id; unit_id; qty; konversi; harga_satuan; nama_produk; satuan }[] }`.

### 2.8 Pesanan ditahan (hold)

Fungsi tersedia di lapisan data, tetapi **belum ada tombol di antarmuka**. Berguna bila nanti
ingin menambah fitur "tahan pesanan".

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `listHeldOrders` | `() => HeldOrder[]` | Daftar pesanan yang ditahan. |
| `saveHeldOrder` | `(label: string, dataJson: string) => string` | Simpan isi keranjang sebagai JSON. |
| `deleteHeldOrder` | `(id: string) => void` | Hapus pesanan ditahan. |

### 2.9 Shift kas

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `getOpenShift` | `(userId: string) => CashShift \| null` | Shift yang belum ditutup milik user. |
| `openShift` | `(userId: string, kasAwal: number) => string` | Buka shift baru, mengembalikan `id`. |
| `shiftCashInOut` | `(shiftId: string \| null, tipe: 'MASUK'\|'KELUAR', kategori: string, jumlah: number, catatan: string, userId: string) => void` | Catat kas masuk/keluar (boleh tanpa shift → `shift_id = NULL`). |
| `shiftSummary` | `(shiftId: string) => ShiftSummary` | `{ shift, masuk, keluar, sistem, tunai_penjualan, transactions }`; `sistem = kas_awal + masuk − keluar`. |
| `closeShift` | `(shiftId: string, kasFisik: number) => void` | Tutup shift: hitung `kas_akhir_sistem`, `selisih = kasFisik − sistem`, simpan `tutup_at`. `throw` bila shift sudah ditutup. |
| `listClosedShifts` | `(limit = 20) => CashShift[]` | Riwayat shift yang sudah ditutup. |

### 2.10 Pengaturan & pengguna

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `getSetting` | `(key: string, fallback = '') => string` | Baca `settings` (dipakai untuk `active_shift`, dsb). |
| `setSetting` | `(key: string, value: string) => void` | Tulis/ubah setting. |
| `listUsers` | `() => { id; nama; role; aktif; created_at }[]` | Daftar pengguna (tanpa hash PIN). |
| `saveUser` | `(u: { id?: string; nama: string; pin: string; role: string }, hashPin: (p: string) => string) => string` | Tambah/ubah pengguna. Fungsi `hashPin` di-inject agar `repo` tidak bergantung pada `id.ts`. |
| `deleteUser` | `(id: string) => void` | Hapus pengguna (tidak boleh menghapus owner terakhir — dicek di layar). |
| `getUserByPin` | `(pinHash: string) => User \| null` | Cari user aktif berdasarkan hash PIN (dipakai login). |

---

## 3. `lib/report.ts` — laporan

Semua fungsi menerima rentang tanggal `'YYYY-MM-DD'` dan **mengabaikan** transaksi `BATAL`
maupun yang di-soft-delete.

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `dailySummary` | `(from: string, to: string) => Summary` | `{ omzet, laba_kotor, transaksi, item_terjual, kas_masuk, piutang_baru }`. Laba = `Σ(subtotal − hpp_saat_jual × qty_dasar)`. |
| `salesByDay` | `(from, to) => DailyPoint[]` | `{ tanggal, omzet, transaksi }` per hari untuk grafik. |
| `topProducts` | `(from, to, limit = 20) => ProductSales[]` | Produk terlaris: `{ product_id, nama_produk, qty, omzet, laba }`, urut omzet. |
| `stockValue` | `() => { total_qty; total_nilai; item_count }` | Nilai stok = `Σ(qty_dasar × hpp)`. |
| `lowStockProducts` | `() => { id; nama; stok; min; simbol }[]` | Produk dengan `stok ≤ stok_min`, urut paling kritis. |
| `cashSummary` | `(from, to) => { masuk; keluar }` | Total kas masuk/keluar pada periode. |
| `stockMutation` | `(productId, limit = 50) => { id; tanggal; tipe; qty_dasar; catatan; ref_id }[]` | Riwayat pergerakan stok produk. |
| `rangeFor` | `(period: string) => { from: string; to: string }` | Periode siap pakai: `'today'`, `'yesterday'`, `'7d'`, `'30d'`, `'month'` (default). |

---

## 4. `lib/format.ts` — format angka & tanggal

| Fungsi | Signature | Contoh |
| --- | --- | --- |
| `formatNumber` | `(n: number) => string` | `1250000` → `1.250.000` |
| `formatRupiah` | `(n: number) => string` | → `Rp 1.250.000` |
| `formatRupiahShort` | `(n: number) => string` | tanpa prefix `Rp` (untuk kolom sempit) |
| `parseRupiahInput` | `(s: string) => number` | `"Rp 1.250.000"` → `1250000` |
| `formatQty` | `(n: number) => string` | `2.5` → `2,5` · `3` → `3` · `1.44` → `1,44` |
| `parseQtyInput` | `(s: string) => number` | `"2,5"` / `"2.5"` → `2.5` |
| `roundTo` | `(n: number, decimals = 3) => number` | `roundTo(1.23456, 3)` → `1.235` |
| `formatDate` | `(iso: string) => string` | `12 Nov 2026` |
| `formatDateTime` | `(iso: string) => string` | `12 Nov, 14.05` |
| `formatTime` | `(iso: string) => string` | `14.05` |
| `todayIso` | `() => string` | `'2026-11-12'` |
| `daysFromNow` | `(days: number) => string` | tanggal `+n` hari (untuk jatuh tempo) |
| `isLate` | `(jatuhTempo: string \| null) => boolean` | `true` bila sudah lewat hari ini |
| `daysLate` | `(jatuhTempo: string \| null) => number` | jumlah hari keterlambatan (0 bila belum) |
| `initials` | `(name: string) => string` | `"Budi Santoso"` → `BS` (avatar) |

---

## 5. `lib/id.ts` — identitas & PIN

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `uid` | `() => string` | ID unik pendek (timestamp + random base36 + counter). Dipakai sebagai primary key. |
| `nowIso` | `() => string` | Timestamp ISO lokal (`2026-11-12T14:05:33.123`), dipakai untuk `tanggal`/`created_at`. |
| `hashPin` | `(pin: string) => string` | Hash PIN (dengan salt internal). PIN tidak pernah disimpan plain. |
| `verifyPin` | `(pin: string, stored: string) => boolean` | Membandingkan PIN input dengan hash tersimpan. |

---

## 6. `lib/receipt.ts` — nota, surat jalan, WhatsApp

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `shareReceipt` | `(data: ReceiptData) => Promise<void>` | Membuat PDF nota A5 (jsPDF + autoTable), menyimpan di `Directory.Cache` pada Android lalu membuka share sheet; di web memicu unduhan. |
| `shareSuratJalan` | `(data: ReceiptData) => Promise<void>` | Sama seperti di atas, tetapi layout surat jalan (tanpa harga, ada kolom qty & tanda tangan). |
| `buildReceiptDataUri` | `(data: ReceiptData) => string` | Menghasilkan PDF sebagai data URI (untuk pratinjau/embed). |
| `shareText` | `(text: string) => Promise<void>` | Bagikan teks lewat `@capacitor/share`; fallback ke clipboard di web. |
| `whatsappLink` | `(phone: string, text: string) => string` | Membentuk `https://wa.me/62…?text=…` (nomor `08…` otomatis jadi `628…`). |
| `openExternal` | `(url: string) => Promise<void>` | Membuka tautan: `Browser.open()` di Android, `window.open` di web. Wajib dipakai untuk WhatsApp. |

`ReceiptData`:

```ts
{
  store: StoreProfile;
  sale: Sale;
  items: SaleItem[];
  customer: Customer | null;
  kasir: string;
  payments?: SalePayment[];
}
```

---

## 7. `lib/backup.ts` — backup & restore

| Fungsi | Signature | Keterangan |
| --- | --- | --- |
| `backupDatabase` | `() => Promise<string>` | Android: menulis `Documents/backup/kokoh-backup-YYYY-MM-DD-HH-MM-SS.db` lalu membuka share sheet; web: memicu unduhan. Mengembalikan nama file / URI. |
| `restoreDatabaseFromFile` | `(file: File) => Promise<void>` | Restore dari `File` yang dipilih pengguna (input file di `BackupScreen`). **Menimpa** seluruh database. |
| `readBackupFromBase64` | `(b64: string) => Promise<void>` | Restore dari string base64 (dipakai bila backup dikirim via chat). |

---

## 8. `lib/schema.ts` & `lib/seed.ts`

| Export | Isi |
| --- | --- |
| `SCHEMA_VERSION` | Versi struktur database (saat ini `1`), disimpan di tabel `schema_meta`. |
| `SCHEMA_SQL` | DDL lengkap 28 tabel + 12 indeks. Idempoten (`IF NOT EXISTS`) sehingga aman dijalankan setiap start. |
| `SEED_UNITS` | 15 satuan: kg, sak, dus, buah, pak, m², m, m³, liter, batang, lembar, roll, kaleng, pail, set. |
| `SEED_CATEGORIES` | 10 kategori: Semen & Beton, Bata & Batako, Keramik & Lantai, Cat & Finishing, Besi & Baja, Pipa & Plumbing, Kabel & Listrik, Paku & Alat, Pasir & Agregat, Atap & Genteng. |
| `SEED_PRICE_TIERS` | Eceran, Grosir, Proyek. |
| `SEED_PRODUCTS` | 26 produk contoh dengan multi-satuan, HPP per satuan dasar, harga per tier, stok minimum. |
| `SEED_CUSTOMERS` | 3 pelanggan contoh (umum, kontraktor, proyek). |
| `SEED_SUPPLIERS` | 3 supplier contoh. |
| `seedOwner` | Membuat objek user `OWNER` default (PIN diisi saat Setup). |
| `DEFAULT_SETTINGS` | Pengaturan awal: `active_shift`, `ppn`, `footer_nota`, dll. |

---

## 9. Stores (Zustand)

### 9.1 `stores/session.ts`

| Export | Keterangan |
| --- | --- |
| `useSession` | Store sesi: `user`, `shiftId`, `setUser(user)`, `setShift(id)`, `logout()`. Persisted (`kokoh_session_v1`) agar tidak perlu login ulang setiap membuka app. |
| `isOwner()` | `true` bila peran user saat ini `OWNER`. |
| `canManage()` | `true` untuk `OWNER` dan `ADMIN` (menentukan akses menu pengaturan). |

### 9.2 `stores/cart.ts`

| Export | Keterangan |
| --- | --- |
| `useCart` | Keranjang persisten (`kokoh_cart_v1`). Aksi: `add`, `setQty`, `setPrice`, `setDiskon`, `remove`, `clear`, `setCustomer`, `setDiskonNota`, `setBiayaKirim`, `setProyek`, `setCatatan`, `loadCart`. Menambah produk dengan `product_unit_id` yang sama akan **menggabungkan qty**. |
| `cartTotals(s, ppnPersen, pembulatan)` | Menghitung `{ subtotal, diskon, ppn, total, pembulatan, itemCount }` — logika identik dengan `createSale` agar angka di layar = angka tersimpan. |

### 9.3 `stores/toast.ts`

| Export | Keterangan |
| --- | --- |
| `useToast` | State daftar toast (`push`, `dismiss`). |
| `toast` | Helper siap pakai: `toast.success(msg)`, `toast.danger(msg)`, `toast.warning(msg)`, `toast.info(msg)`. Durasi tampil ± 3 detik. |

---

## 10. Komponen UI (`components/ui.tsx`)

| Komponen | Props utama | Fungsi |
| --- | --- | --- |
| `AppBar` | `title`, `subtitle?`, `onBack?`, `right?`, `light?`, `noSticky?`, `hideBack?` | Header dengan tombol kembali otomatis; `hideBack` dipakai pada lima layar tab. |
| `BottomSheet` | `open`, `onClose`, `title?`, `footer?`, `children` | Panel bawah dengan backdrop, animasi, dan area scroll. |
| `Modal` | `open`, `onClose`, `title?`, `children` | Dialog tengah. |
| `ConfirmDialog` | `open`, `title`, `message`, `confirmLabel`, `danger?`, `onConfirm`, `onClose` | Konfirmasi berbahaya (batal transaksi, tutup kas). |
| `Numpad` | `value`, `onChange`, `allowDecimal?`, `prefix?` | Keypad numerik besar (tanpa keyboard sistem). |
| `NumberSheet` | `open`, `title`, `value`, `prefix?`, `allowDecimal?`, `quickAmounts?`, `onConfirm`, `onClose` | BottomSheet + Numpad, dipakai untuk qty, harga, diskon, nominal bayar. |
| `Segmented` | `value`, `onChange`, `options: { value, label }[]` | Tab kecil (Tunai/Tempo, Pelanggan/Piutang). |
| `Switch` | `on`, `onChange`, `disabled?` | Toggle. |
| `Field` | `label`, `children` | Pembungkus label + input. |
| `EmptyState` | `title`, `message?`, `image?`, `action?` | Ilustrasi + pesan kosong + tombol aksi. |
| `ToastHost` | — | Menampilkan antrean toast (dipasang sekali di `App`). |
| `Money` | `value`, `size?: 'sm'\|'md'\|'lg'\|'xl'`, `className?` | Angka rupiah dengan tipografi tabular. |
| `HeroBanner` | `image`, `title`, `subtitle?`, `onClick?` | Kartu banner di atas katalog kasir. |

---

## 11. Ikon (`components/icons.tsx`)

24 ikon SVG inline (tanpa paket ikon, ukuran mengikuti prop `size`):

`IconCart`, `IconBox`, `IconUsers`, `IconChart`, `IconSettings`, `IconSearch`, `IconBack`,
`IconPlus`, `IconMinus`, `IconTrash`, `IconPause`, `IconClock`, `IconShare`, `IconPrint`,
`IconCheck`, `IconX`, `IconTruck`, `IconWallet`, `IconUser`, `IconLogout`, `IconDownload`,
`IconUpload`, `IconStar`, `IconWarning`.

Contoh: `<IconPlus size={22} />` — semua memakai `currentColor`, sehingga warna mengikuti teks
induk dan aman di mode terang/gelap.
