export type Role = 'OWNER' | 'ADMIN' | 'KASIR';

export interface StoreProfile {
  id: string;
  nama: string;
  alamat: string;
  telp: string;
  logo: string;
  footer_nota: string;
  ppn_persen: number;
  pembulatan: number;
}

export interface User {
  id: string;
  nama: string;
  pin_hash: string;
  role: Role;
  aktif: number;
  created_at: string;
}

export interface Category {
  id: string;
  nama: string;
  warna: string;
}

export interface Unit {
  id: string;
  nama: string;
  simbol: string;
  allow_decimal: number;
  decimal_places: number;
}

export interface PriceTier {
  id: string;
  nama: string;
  urutan: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  nama: string;
  category_id: string;
  base_unit_id: string;
  hpp: number;
  stok_min: number;
  allow_negative: number;
  favorit: number;
  aktif: number;
  catatan: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductUnit {
  id: string;
  product_id: string;
  unit_id: string;
  konversi: number;
  is_default_jual: number;
  is_default_beli: number;
  urutan: number;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  product_unit_id: string;
  price_tier_id: string;
  harga: number;
  min_qty: number;
}

export interface Customer {
  id: string;
  kode: string;
  nama: string;
  telp: string;
  alamat: string;
  proyek: string;
  price_tier_id: string | null;
  limit_kredit: number;
  catatan: string;
  created_at: string;
  deleted_at: string | null;
}

export interface Supplier {
  id: string;
  nama: string;
  telp: string;
  alamat: string;
  created_at: string;
  deleted_at: string | null;
}

export interface StockBalance {
  product_id: string;
  qty_dasar: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  tipe: string;
  qty_dasar: number;
  hpp_unit: number;
  ref_type: string;
  ref_id: string;
  tanggal: string;
  user_id: string;
  catatan: string;
}

export type SaleStatus = 'LUNAS' | 'TEMPO' | 'DP' | 'BATAL';

export interface Sale {
  id: string;
  no_nota: string;
  tanggal: string;
  customer_id: string | null;
  user_id: string;
  shift_id: string | null;
  subtotal: number;
  diskon: number;
  ppn: number;
  biaya_kirim: number;
  pembulatan: number;
  total: number;
  total_bayar: number;
  sisa: number;
  status: SaleStatus;
  jatuh_tempo: string | null;
  proyek: string;
  catatan: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_unit_id: string;
  qty: number;
  qty_dasar: number;
  harga_satuan: number;
  diskon: number;
  subtotal: number;
  hpp_saat_jual: number;
  nama_produk: string;
  satuan: string;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  metode: string;
  jumlah: number;
  tanggal: string;
  referensi: string;
}

export interface SaleReturn {
  id: string;
  sale_id: string;
  tanggal: string;
  total: number;
  alasan: string;
  kompensasi: string;
  user_id: string;
  created_at: string;
}

export interface Delivery {
  id: string;
  sale_id: string;
  alamat_kirim: string;
  sopir: string;
  status: string;
  tanggal: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  no_po: string;
  supplier_id: string | null;
  tanggal: string;
  total: number;
  total_bayar: number;
  sisa: number;
  status: 'LUNAS' | 'TEMPO' | 'BATAL';
  jatuh_tempo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_unit_id: string;
  qty: number;
  qty_dasar: number;
  harga_satuan: number;
  subtotal: number;
  nama_produk: string;
  satuan: string;
}

export interface CashShift {
  id: string;
  user_id: string;
  buka_at: string;
  tutup_at: string | null;
  kas_awal: number;
  kas_akhir_sistem: number;
  kas_akhir_fisik: number;
  selisih: number;
}

export interface CashTransaction {
  id: string;
  shift_id: string | null;
  tipe: 'MASUK' | 'KELUAR';
  kategori: string;
  jumlah: number;
  catatan: string;
  tanggal: string;
  user_id: string;
}

export interface ReceivablePayment {
  id: string;
  customer_id: string;
  sale_id: string | null;
  jumlah: number;
  tanggal: string;
  metode: string;
  referensi: string;
  user_id: string;
}

export interface HeldOrder {
  id: string;
  label: string;
  data_json: string;
  created_at: string;
}

export interface Settings {
  key: string;
  value: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  aksi: string;
  entitas: string;
  detail: string;
  waktu: string;
}

/* ===== View models (joined) ===== */

export interface ProductView extends Product {
  kategori_nama: string;
  base_unit_nama: string;
  base_unit_simbol: string;
  stok_dasar: number;
}

export interface SaleView extends Sale {
  customer_nama: string;
  kasir_nama: string;
  item_count: number;
}

export interface CartItem {
  key: string;
  product_id: string;
  product_unit_id: string;
  unit_id: string;
  unit_simbol: string;
  allow_decimal: number;
  decimal_places: number;
  konversi: number;
  nama_produk: string;
  sku: string;
  qty: number;
  harga_satuan: number;
  diskon: number;
  subtotal: number;
  stok_dasar: number;
  hpp: number;
}

export interface CartData {
  items: CartItem[];
  customer_id: string | null;
  customer_nama: string;
  diskon: number;
  biaya_kirim: number;
  proyek: string;
  catatan: string;
}
