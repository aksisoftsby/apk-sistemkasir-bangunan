export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS store_profile (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  alamat TEXT DEFAULT '',
  telp TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  footer_nota TEXT DEFAULT 'Terima kasih atas kunjungan Anda',
  ppn_persen INTEGER DEFAULT 0,
  pembulatan INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'KASIR',
  aktif INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  warna TEXT DEFAULT '#C2410C'
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  simbol TEXT NOT NULL,
  allow_decimal INTEGER DEFAULT 0,
  decimal_places INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS price_tiers (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  urutan INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT DEFAULT '',
  barcode TEXT DEFAULT '',
  nama TEXT NOT NULL,
  category_id TEXT,
  base_unit_id TEXT NOT NULL,
  hpp INTEGER DEFAULT 0,
  stok_min INTEGER DEFAULT 0,
  allow_negative INTEGER DEFAULT 0,
  favorit INTEGER DEFAULT 0,
  aktif INTEGER DEFAULT 1,
  catatan TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS product_units (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  konversi REAL NOT NULL DEFAULT 1,
  is_default_jual INTEGER DEFAULT 0,
  is_default_beli INTEGER DEFAULT 0,
  urutan INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_prices (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_unit_id TEXT NOT NULL,
  price_tier_id TEXT NOT NULL,
  harga INTEGER NOT NULL DEFAULT 0,
  min_qty INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  kode TEXT DEFAULT '',
  nama TEXT NOT NULL,
  telp TEXT DEFAULT '',
  alamat TEXT DEFAULT '',
  proyek TEXT DEFAULT '',
  price_tier_id TEXT,
  limit_kredit INTEGER DEFAULT 0,
  catatan TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  telp TEXT DEFAULT '',
  alamat TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS stock_balances (
  product_id TEXT PRIMARY KEY,
  qty_dasar REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  tipe TEXT NOT NULL,
  qty_dasar REAL NOT NULL,
  hpp_unit INTEGER DEFAULT 0,
  ref_type TEXT DEFAULT '',
  ref_id TEXT DEFAULT '',
  tanggal TEXT NOT NULL,
  user_id TEXT DEFAULT '',
  catatan TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  no_nota TEXT NOT NULL UNIQUE,
  tanggal TEXT NOT NULL,
  customer_id TEXT,
  user_id TEXT NOT NULL,
  shift_id TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  diskon INTEGER DEFAULT 0,
  ppn INTEGER DEFAULT 0,
  biaya_kirim INTEGER DEFAULT 0,
  pembulatan INTEGER DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  total_bayar INTEGER DEFAULT 0,
  sisa INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'LUNAS',
  jatuh_tempo TEXT,
  proyek TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_unit_id TEXT NOT NULL,
  qty REAL NOT NULL,
  qty_dasar REAL NOT NULL,
  harga_satuan INTEGER NOT NULL,
  diskon INTEGER DEFAULT 0,
  subtotal INTEGER NOT NULL,
  hpp_saat_jual INTEGER DEFAULT 0,
  nama_produk TEXT NOT NULL,
  satuan TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  metode TEXT NOT NULL,
  jumlah INTEGER NOT NULL,
  tanggal TEXT NOT NULL,
  referensi TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS sale_returns (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  total INTEGER NOT NULL,
  alasan TEXT DEFAULT '',
  kompensasi TEXT NOT NULL,
  user_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sale_return_items (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL,
  sale_item_id TEXT NOT NULL,
  qty REAL NOT NULL,
  qty_dasar REAL NOT NULL,
  harga_satuan INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  masuk_stok INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  alamat_kirim TEXT DEFAULT '',
  sopir TEXT DEFAULT '',
  status TEXT DEFAULT 'BELUM_DIKIRIM',
  tanggal TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  no_po TEXT NOT NULL,
  supplier_id TEXT,
  tanggal TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  total_bayar INTEGER DEFAULT 0,
  sisa INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'LUNAS',
  jatuh_tempo TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_unit_id TEXT NOT NULL,
  qty REAL NOT NULL,
  qty_dasar REAL NOT NULL,
  harga_satuan INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  nama_produk TEXT NOT NULL,
  satuan TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_payments (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  jumlah INTEGER NOT NULL,
  tanggal TEXT NOT NULL,
  metode TEXT DEFAULT 'TRANSFER',
  referensi TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS cash_shifts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  buka_at TEXT NOT NULL,
  tutup_at TEXT,
  kas_awal INTEGER DEFAULT 0,
  kas_akhir_sistem INTEGER DEFAULT 0,
  kas_akhir_fisik INTEGER DEFAULT 0,
  selisih INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cash_transactions (
  id TEXT PRIMARY KEY,
  shift_id TEXT,
  tipe TEXT NOT NULL,
  kategori TEXT DEFAULT '',
  jumlah INTEGER NOT NULL,
  catatan TEXT DEFAULT '',
  tanggal TEXT NOT NULL,
  user_id TEXT
);

CREATE TABLE IF NOT EXISTS receivable_payments (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  sale_id TEXT,
  jumlah INTEGER NOT NULL,
  tanggal TEXT NOT NULL,
  metode TEXT DEFAULT 'TUNAI',
  referensi TEXT DEFAULT '',
  user_id TEXT
);

CREATE TABLE IF NOT EXISTS held_orders (
  id TEXT PRIMARY KEY,
  label TEXT DEFAULT '',
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  aksi TEXT NOT NULL,
  entitas TEXT DEFAULT '',
  detail TEXT DEFAULT '',
  waktu TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_nama ON products(nama);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_kategori ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_units_product ON product_units(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_unit ON product_prices(product_unit_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_sales_tanggal ON sales(tanggal);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_receivable_customer ON receivable_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_customers_nama ON customers(nama);
`;
