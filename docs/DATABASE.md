# Skema Database

Database: **SQLite 3** dijalankan lewat **sql.js** (WebAssembly), versi skema `1`
(`SCHEMA_VERSION` di `src/lib/schema.ts`).

- **Lokasi file**
  - Web: IndexedDB `kokoh-db` → object store `files` → key `kokoh.sqlite`
  - Android: `Directory.Data/kokoh.sqlite` (privat aplikasi)
- **28 tabel**, **12 indeks**, tanpa `FOREIGN KEY` keras — integritas dijaga di `src/lib/repo.ts`
  agar backup/restore dan migrasi tetap sederhana.
- **Konvensi kolom**
  - `id TEXT PRIMARY KEY` → hasil `uid()`, bukan auto-increment.
  - `tanggal`, `created_at`, `updated_at`, `deleted_at` → ISO lokal `YYYY-MM-DDTHH:mm:ss.sss`.
  - Nominal uang → `INTEGER` rupiah (tanpa desimal).
  - Qty stok → `REAL` dalam **satuan dasar** produk.
  - `deleted_at IS NULL` → data aktif (soft delete).

---

## 1. Peta relasi (ringkas)

```
store_profile                (1 baris profil toko)

users ──────┬── sales.user_id
            ├── cash_shifts.user_id
            └── cash_transactions.user_id

categories ── products.category_id
units ──────┬── products.base_unit_id
            └── product_units.unit_id
price_tiers ── product_prices.price_tier_id

products ───┬── product_units.product_id
            ├── product_prices.product_id
            ├── stock_balances.product_id   (1:1)
            └── stock_movements.product_id

customers ──┬── sales.customer_id
            └── receivable_payments.customer_id

suppliers ──── purchases.supplier_id

sales ──────┬── sale_items.sale_id
            ├── sale_payments.sale_id
            ├── sale_returns.sale_id ── sale_return_items.return_id
            ├── deliveries.sale_id     (1:1)
            └── receivable_payments.sale_id

purchases ──┬── purchase_items.purchase_id
            └── purchase_payments.purchase_id

cash_shifts ── cash_transactions.shift_id
held_orders   (JSON keranjang)
settings      (key/value)
audit_logs    (jejak aksi sensitif)
schema_meta   (versi skema)
```

---

## 2. Master data

### `store_profile`
Profil toko (hanya satu baris, `id = 'store'`).

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | `store` |
| `nama` | TEXT NOT NULL | — | Nama toko (tampil di AppBar & nota) |
| `alamat` | TEXT | `''` | Alamat toko |
| `telp` | TEXT | `''` | Telepon / WA toko |
| `logo` | TEXT | `''` | Path/nama file logo |
| `footer_nota` | TEXT | `'Terima kasih atas kunjungan Anda'` | Teks penutup nota |
| `ppn_persen` | INTEGER | `0` | PPN default (%) |
| `pembulatan` | INTEGER | `0` | Pembulatan ke kelipatan (0/100/500/1000) |

### `users`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `nama` | TEXT NOT NULL | — | Nama kasir/pemilik |
| `pin_hash` | TEXT NOT NULL | — | Hash PIN (bukan plain text) |
| `role` | TEXT NOT NULL | `'KASIR'` | `OWNER` \| `ADMIN` \| `KASIR` |
| `aktif` | INTEGER | `1` | 0 = tidak bisa login |
| `created_at` | TEXT | `datetime('now')` | — |

### `categories`

| Kolom | Tipe | Default |
| --- | --- | --- |
| `id` | TEXT PK | — |
| `nama` | TEXT NOT NULL | — |
| `warna` | TEXT | `'#C2410C'` |

### `units`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | `u-kg`, `u-sak`, `u-m2`, … |
| `nama` | TEXT NOT NULL | — | Kilogram, Sak, Meter persegi |
| `simbol` | TEXT NOT NULL | — | kg, sak, m² |
| `allow_decimal` | INTEGER | `0` | Boleh qty pecahan? |
| `decimal_places` | INTEGER | `0` | Jumlah digit desimal |

### `price_tiers`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | `t-eceran`, `t-grosir`, `t-proyek` |
| `nama` | TEXT NOT NULL | — | Eceran, Grosir, Proyek |
| `urutan` | INTEGER | `0` | Urutan tampil |

### `suppliers`

| Kolom | Tipe | Default |
| --- | --- | --- |
| `id` | TEXT PK | — |
| `nama` | TEXT NOT NULL | — |
| `telp` | TEXT | `''` |
| `alamat` | TEXT | `''` |
| `created_at` | TEXT | `datetime('now')` |
| `deleted_at` | TEXT | NULL |

### `customers`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `kode` | TEXT | `''` | Kode pelanggan (opsional) |
| `nama` | TEXT NOT NULL | — | — |
| `telp` | TEXT | `''` | Nomor WA untuk pengingat |
| `alamat` | TEXT | `''` | Alamat kirim default |
| `proyek` | TEXT | `''` | Nama proyek berjalan |
| `price_tier_id` | TEXT | NULL | Tier harga yang dipakai otomatis |
| `limit_kredit` | INTEGER | `0` | Batas kredit (0 = tanpa batas) |
| `catatan` | TEXT | `''` | — |
| `created_at` | TEXT | `datetime('now')` | — |
| `deleted_at` | TEXT | NULL | Soft delete |

---

## 3. Produk & stok

### `products`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `sku` | TEXT | `''` | Kode internal |
| `barcode` | TEXT | `''` | Barcode (bisa discan/diketik) |
| `nama` | TEXT NOT NULL | — | — |
| `category_id` | TEXT | NULL | → `categories.id` |
| `base_unit_id` | TEXT NOT NULL | — | Satuan dasar stok (→ `units.id`) |
| `hpp` | INTEGER | `0` | **HPP per satuan dasar** |
| `stok_min` | INTEGER | `0` | Ambang peringatan stok menipis (satuan dasar) |
| `allow_negative` | INTEGER | `0` | Izinkan stok minus |
| `favorit` | INTEGER | `0` | Tampil di atas katalog kasir |
| `aktif` | INTEGER | `1` | 0 = disembunyikan |
| `catatan` | TEXT | `''` | — |
| `created_at` / `updated_at` | TEXT | `datetime('now')` | — |
| `deleted_at` | TEXT | NULL | Soft delete |

> **Kenapa HPP per satuan dasar?** Semen dibeli Rp 58.000/sak (50 kg) dan bisa dijual per kg.
> Dengan HPP = 1.160/kg, laba selalu benar untuk satuan apa pun yang dipakai saat menjual.

### `product_units`
Satu produk bisa punya banyak satuan (jual & beli).

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | `${product_id}-${unit_id}` |
| `product_id` | TEXT NOT NULL | — | → `products.id` |
| `unit_id` | TEXT NOT NULL | — | → `units.id` |
| `konversi` | REAL NOT NULL | `1` | Jumlah satuan dasar per 1 satuan ini (`sak` = 50) |
| `is_default_jual` | INTEGER | `0` | Satuan default saat menjual |
| `is_default_beli` | INTEGER | `0` | Satuan default saat membeli |
| `urutan` | INTEGER | `0` | Urutan tampil di pemilih satuan |

### `product_prices`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `product_id` | TEXT NOT NULL | — | → `products.id` |
| `product_unit_id` | TEXT NOT NULL | — | → `product_units.id` |
| `price_tier_id` | TEXT NOT NULL | — | → `price_tiers.id` |
| `harga` | INTEGER NOT NULL | `0` | Harga per satuan ini |
| `min_qty` | INTEGER | `0` | Minimal qty untuk harga ini (reserved) |

### `stock_balances`
Saldo stok terkini, satu baris per produk.

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `product_id` | TEXT PK | — | → `products.id` |
| `qty_dasar` | REAL NOT NULL | `0` | Stok dalam satuan dasar |

### `stock_movements`
Kartu stok / ledger — sumber kebenaran setiap perubahan stok.

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `product_id` | TEXT NOT NULL | — | → `products.id` |
| `tipe` | TEXT NOT NULL | — | `STOK_AWAL`, `SALE`, `PURCHASE`, `RETURN_IN`, `ADJUSTMENT`, `VOID` |
| `qty_dasar` | REAL NOT NULL | — | Positif = masuk, negatif = keluar |
| `hpp_unit` | INTEGER | `0` | HPP per satuan dasar saat mutasi |
| `ref_type` | TEXT | `''` | `SALE`, `PURCHASE`, `RETURN`, `PRODUCT` |
| `ref_id` | TEXT | `''` | ID dokumen sumber |
| `tanggal` | TEXT NOT NULL | — | Waktu mutasi |
| `user_id` | TEXT | `''` | Pelaku |
| `catatan` | TEXT | `''` | Keterangan / alasan |

---

## 4. Penjualan

### `sales`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `no_nota` | TEXT NOT NULL **UNIQUE** | — | `INV-YYYYMMDD-0001` |
| `tanggal` | TEXT NOT NULL | — | Waktu transaksi |
| `customer_id` | TEXT | NULL | NULL = pelanggan umum |
| `user_id` | TEXT NOT NULL | — | Kasir |
| `shift_id` | TEXT | NULL | → `cash_shifts.id` |
| `subtotal` | INTEGER NOT NULL | `0` | Σ subtotal item |
| `diskon` | INTEGER | `0` | Diskon nota |
| `ppn` | INTEGER | `0` | Nominal PPN |
| `biaya_kirim` | INTEGER | `0` | Ongkos kirim |
| `pembulatan` | INTEGER | `0` | Selisih pembulatan (+/−) |
| `total` | INTEGER NOT NULL | `0` | Total akhir |
| `total_bayar` | INTEGER | `0` | Akumulasi pembayaran |
| `sisa` | INTEGER | `0` | **> 0 = piutang** |
| `status` | TEXT NOT NULL | `'LUNAS'` | `LUNAS` \| `TEMPO` \| `DP` \| `BATAL` |
| `jatuh_tempo` | TEXT | NULL | `YYYY-MM-DD` |
| `proyek` | TEXT | `''` | Nama proyek |
| `catatan` | TEXT | `''` | — |
| `created_at` / `updated_at` | TEXT | `datetime('now')` | — |
| `deleted_at` | TEXT | NULL | — |

### `sale_items`
Snapshot item (nama & satuan disalin agar nota lama tidak berubah saat produk diedit).

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `sale_id` | TEXT NOT NULL | — | → `sales.id` |
| `product_id` | TEXT NOT NULL | — | → `products.id` |
| `product_unit_id` | TEXT NOT NULL | — | Satuan yang dipakai |
| `qty` | REAL NOT NULL | — | Qty dalam satuan jual |
| `qty_dasar` | REAL NOT NULL | — | `qty × konversi` |
| `harga_satuan` | INTEGER NOT NULL | — | Harga per satuan jual |
| `diskon` | INTEGER | `0` | Diskon item |
| `subtotal` | INTEGER NOT NULL | — | `qty × harga − diskon` |
| `hpp_saat_jual` | INTEGER | `0` | HPP per satuan dasar saat transaksi (untuk laba historis) |
| `nama_produk` | TEXT NOT NULL | — | Snapshot nama |
| `satuan` | TEXT NOT NULL | — | Snapshot simbol satuan |

### `sale_payments`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `sale_id` | TEXT NOT NULL | — | → `sales.id` |
| `metode` | TEXT NOT NULL | — | `TUNAI` \| `TRANSFER` \| `DP` \| `TEMPO` (repo juga menerima `QRIS`) |
| `jumlah` | INTEGER NOT NULL | — | Nominal dibayar |
| `tanggal` | TEXT NOT NULL | — | — |
| `referensi` | TEXT | `''` | No. referensi transfer |

### `sale_returns` & `sale_return_items`

`sale_returns`:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | TEXT PK | — |
| `sale_id` | TEXT NOT NULL | → `sales.id` |
| `tanggal` | TEXT NOT NULL | Waktu retur |
| `total` | INTEGER NOT NULL | Nilai barang yang diretur |
| `alasan` | TEXT | Alasan retur |
| `kompensasi` | TEXT NOT NULL | `TUNAI` \| `PIUTANG` |
| `user_id` | TEXT | Pelaku |
| `created_at` | TEXT | — |

`sale_return_items`:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | TEXT PK | — |
| `return_id` | TEXT NOT NULL | → `sale_returns.id` |
| `sale_item_id` | TEXT NOT NULL | → `sale_items.id` |
| `qty` | REAL NOT NULL | Qty diretur (satuan jual) |
| `qty_dasar` | REAL NOT NULL | Qty dalam satuan dasar |
| `harga_satuan` | INTEGER NOT NULL | Harga saat retur |
| `subtotal` | INTEGER NOT NULL | Nilai retur |
| `masuk_stok` | INTEGER | 1 = stok dikembalikan |

### `deliveries` (surat jalan)

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `sale_id` | TEXT NOT NULL | — | → `sales.id` |
| `alamat_kirim` | TEXT | `''` | Alamat tujuan |
| `sopir` | TEXT | `''` | Nama sopir / pengantar |
| `status` | TEXT | `'BELUM_DIKIRIM'` | `BELUM_DIKIRIM` \| `DALAM_PERJALANAN` \| `DITERIMA` |
| `tanggal` | TEXT NOT NULL | — | Tanggal kirim |
| `created_at` | TEXT | `datetime('now')` | — |

---

## 5. Pembelian

### `purchases`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `no_po` | TEXT NOT NULL | — | `PO-YYYYMMDD-0001` |
| `supplier_id` | TEXT | NULL | → `suppliers.id` |
| `tanggal` | TEXT NOT NULL | — | — |
| `total` | INTEGER NOT NULL | `0` | Nilai pembelian |
| `total_bayar` | INTEGER | `0` | Dibayar |
| `sisa` | INTEGER | `0` | **> 0 = hutang supplier** |
| `status` | TEXT NOT NULL | `'LUNAS'` | `LUNAS` \| `TEMPO` |
| `jatuh_tempo` | TEXT | NULL | — |
| `created_at` / `updated_at` | TEXT | `datetime('now')` | — |

### `purchase_items`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | TEXT PK | — |
| `purchase_id` | TEXT NOT NULL | → `purchases.id` |
| `product_id` | TEXT NOT NULL | → `products.id` |
| `product_unit_id` | TEXT NOT NULL | Satuan beli |
| `qty` | REAL NOT NULL | Qty satuan beli |
| `qty_dasar` | REAL NOT NULL | Qty satuan dasar (menambah stok) |
| `harga_satuan` | INTEGER NOT NULL | Harga beli per satuan beli |
| `subtotal` | INTEGER NOT NULL | — |
| `nama_produk` | TEXT NOT NULL | Snapshot |
| `satuan` | TEXT NOT NULL | Snapshot |

### `purchase_payments`

| Kolom | Tipe | Default |
| --- | --- | --- |
| `id` | TEXT PK | — |
| `purchase_id` | TEXT NOT NULL | — |
| `jumlah` | INTEGER NOT NULL | — |
| `tanggal` | TEXT NOT NULL | — |
| `metode` | TEXT | `'TRANSFER'` |
| `referensi` | TEXT | `''` |

---

## 6. Keuangan

### `cash_shifts`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `user_id` | TEXT NOT NULL | — | Kasir pemilik shift |
| `buka_at` | TEXT NOT NULL | — | Waktu buka |
| `tutup_at` | TEXT | NULL | NULL = shift berjalan |
| `kas_awal` | INTEGER | `0` | Modal laci |
| `kas_akhir_sistem` | INTEGER | `0` | Kas menurut perhitungan sistem |
| `kas_akhir_fisik` | INTEGER | `0` | Hasil hitung uang di laci |
| `selisih` | INTEGER | `0` | `fisik − sistem` |

### `cash_transactions`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `shift_id` | TEXT | NULL | NULL = di luar shift |
| `tipe` | TEXT NOT NULL | — | `MASUK` \| `KELUAR` |
| `kategori` | TEXT | `''` | `Penjualan`, `Operasional`, `Gaji`, … |
| `jumlah` | INTEGER NOT NULL | — | Nominal |
| `catatan` | TEXT | `''` | Keterangan |
| `tanggal` | TEXT NOT NULL | — | — |
| `user_id` | TEXT | NULL | Pelaku |

### `receivable_payments`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | TEXT PK | — | — |
| `customer_id` | TEXT NOT NULL | — | → `customers.id` |
| `sale_id` | TEXT | NULL | → `sales.id` |
| `jumlah` | INTEGER NOT NULL | — | Nominal diterima |
| `tanggal` | TEXT NOT NULL | — | — |
| `metode` | TEXT | `'TUNAI'` | — |
| `referensi` | TEXT | `''` | — |
| `user_id` | TEXT | NULL | — |

---

## 7. Pendukung

### `held_orders`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | TEXT PK | — |
| `label` | TEXT | Nama/label pesanan (mis. "Pak Andi – keramik") |
| `data_json` | TEXT NOT NULL | Snapshot keranjang (`CartData`) |
| `created_at` | TEXT NOT NULL | — |

### `settings`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `key` | TEXT PK | Nama setting |
| `value` | TEXT NOT NULL | Nilai (string) |

Setting yang dipakai: `active_shift` (id shift berjalan), `last_backup_at`, `ppn_default`.

### `audit_logs`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | TEXT PK | — |
| `user_id` | TEXT | Pelaku |
| `aksi` | TEXT NOT NULL | `VOID_SALE`, `RETURN`, `CLOSE_SHIFT`, `RESTORE_DB`, … |
| `entitas` | TEXT | Nama tabel/objek |
| `detail` | TEXT | Detail JSON/teks |
| `waktu` | TEXT NOT NULL | — |

### `schema_meta`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `key` | TEXT PK | `version` |
| `value` | TEXT | Versi skema saat ini (`1`) |

---

## 8. Indeks

| Indeks | Tabel | Kolom |
| --- | --- | --- |
| `idx_products_nama` | products | `nama` |
| `idx_products_barcode` | products | `barcode` |
| `idx_products_kategori` | products | `category_id` |
| `idx_product_units_product` | product_units | `product_id` |
| `idx_product_prices_unit` | product_prices | `product_unit_id` |
| `idx_stock_movements_product` | stock_movements | `product_id, tanggal` |
| `idx_sales_tanggal` | sales | `tanggal` |
| `idx_sales_customer` | sales | `customer_id` |
| `idx_sale_items_sale` | sale_items | `sale_id` |
| `idx_receivable_customer` | receivable_payments | `customer_id` |
| `idx_purchases_supplier` | purchases | `supplier_id` |
| `idx_customers_nama` | customers | `nama` |

---

## 9. Query yang sering dipakai

```sql
-- Total piutang berjalan
SELECT COALESCE(SUM(sisa),0) FROM sales WHERE status <> 'BATAL' AND sisa > 0;

-- Laba kotor periode
SELECT COALESCE(SUM(si.subtotal - si.hpp_saat_jual * si.qty_dasar),0)
FROM sale_items si JOIN sales s ON s.id = si.sale_id
WHERE s.status <> 'BATAL' AND s.tanggal BETWEEN '2026-11-01' AND '2026-11-30T23:59:59';

-- Nilai stok
SELECT COALESCE(SUM(sb.qty_dasar * p.hpp),0)
FROM stock_balances sb JOIN products p ON p.id = sb.product_id
WHERE p.deleted_at IS NULL;

-- Stok menipis
SELECT p.nama, sb.qty_dasar, p.stok_min
FROM products p LEFT JOIN stock_balances sb ON sb.product_id = p.id
WHERE p.deleted_at IS NULL AND p.aktif = 1 AND COALESCE(sb.qty_dasar,0) <= p.stok_min;

-- Kas sistem shift berjalan
SELECT kas_awal
     + COALESCE((SELECT SUM(jumlah) FROM cash_transactions WHERE shift_id = s.id AND tipe='MASUK'),0)
     - COALESCE((SELECT SUM(jumlah) FROM cash_transactions WHERE shift_id = s.id AND tipe='KELUAR'),0) AS sistem
FROM cash_shifts s WHERE s.id = ?;
```

---

## 10. Migrasi skema

Saat ini `SCHEMA_VERSION = 1`. Bila struktur berubah:

1. Tambahkan kolom/tabel baru ke `SCHEMA_SQL` dengan pola idempoten
   (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN` dijaga di kode migrasi).
2. Naikkan `SCHEMA_VERSION`.
3. Tambahkan blok migrasi di `initDb()` setelah `db.run(SCHEMA_SQL)`:

```ts
const from = current;           // versi tersimpan
if (from < 2) { /* migrasi ke v2 */ }
run('UPDATE schema_meta SET value = ? WHERE key = ?', [String(SCHEMA_VERSION), 'version']);
```

4. Uji dengan database lama (ambil file backup v1) sebelum rilis.
