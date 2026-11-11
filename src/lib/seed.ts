import type { Category, Customer, PriceTier, Supplier, Unit } from './types';
import { hashPin } from './id';

export const SEED_UNITS: Unit[] = [
  { id: 'u-kg', nama: 'Kilogram', simbol: 'kg', allow_decimal: 1, decimal_places: 3 },
  { id: 'u-sak', nama: 'Sak', simbol: 'sak', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-dus', nama: 'Dus', simbol: 'dus', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-buah', nama: 'Buah', simbol: 'pcs', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-pak', nama: 'Pak', simbol: 'pak', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-m2', nama: 'Meter persegi', simbol: 'm²', allow_decimal: 1, decimal_places: 3 },
  { id: 'u-m', nama: 'Meter', simbol: 'm', allow_decimal: 1, decimal_places: 3 },
  { id: 'u-m3', nama: 'Meter kubik', simbol: 'm³', allow_decimal: 1, decimal_places: 2 },
  { id: 'u-liter', nama: 'Liter', simbol: 'L', allow_decimal: 1, decimal_places: 1 },
  { id: 'u-batang', nama: 'Batang', simbol: 'btg', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-lembar', nama: 'Lembar', simbol: 'lbr', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-roll', nama: 'Roll', simbol: 'roll', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-kaleng', nama: 'Kaleng', simbol: 'klg', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-pail', nama: 'Pail', simbol: 'pail', allow_decimal: 0, decimal_places: 0 },
  { id: 'u-set', nama: 'Set', simbol: 'set', allow_decimal: 0, decimal_places: 0 },
];

export const SEED_CATEGORIES: Category[] = [
  { id: 'c-semen', nama: 'Semen & Beton', warna: '#C2410C' },
  { id: 'c-bata', nama: 'Bata & Batako', warna: '#B91C1C' },
  { id: 'c-keramik', nama: 'Keramik & Lantai', warna: '#1D4ED8' },
  { id: 'c-cat', nama: 'Cat & Finishing', warna: '#7C3AED' },
  { id: 'c-besi', nama: 'Besi & Baja', warna: '#475569' },
  { id: 'c-pipa', nama: 'Pipa & Plumbing', warna: '#0891B2' },
  { id: 'c-listrik', nama: 'Kabel & Listrik', warna: '#CA8A04' },
  { id: 'c-alat', nama: 'Paku & Alat', warna: '#15803D' },
  { id: 'c-agregat', nama: 'Pasir & Agregat', warna: '#A16207' },
  { id: 'c-atap', nama: 'Atap & Genteng', warna: '#9F1239' },
];

export const SEED_PRICE_TIERS: PriceTier[] = [
  { id: 't-eceran', nama: 'Eceran', urutan: 1 },
  { id: 't-grosir', nama: 'Grosir', urutan: 2 },
  { id: 't-kontraktor', nama: 'Kontraktor', urutan: 3 },
];

export interface SeedProduct {
  id: string;
  sku: string;
  barcode: string;
  nama: string;
  category_id: string;
  base_unit_id: string;
  hpp: number;
  stok_min: number;
  favorit: number;
  catatan?: string;
  units: { unit_id: string; konversi: number; is_default_jual?: number; is_default_beli?: number }[];
  prices: { unit_id: string; tier_id: string; harga: number }[];
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 'p-sementigaroda', sku: 'SMN-001', barcode: '8991234500011', nama: 'Semen Tiga Roda 50 kg',
    category_id: 'c-semen', base_unit_id: 'u-kg', hpp: 1160, stok_min: 50, favorit: 1,
    units: [
      { unit_id: 'u-sak', konversi: 50, is_default_jual: 1, is_default_beli: 1 },
      { unit_id: 'u-kg', konversi: 1 },
    ],
    prices: [
      { unit_id: 'u-sak', tier_id: 't-eceran', harga: 68000 },
      { unit_id: 'u-sak', tier_id: 't-grosir', harga: 66000 },
      { unit_id: 'u-sak', tier_id: 't-kontraktor', harga: 65000 },
      { unit_id: 'u-kg', tier_id: 't-eceran', harga: 1400 },
    ],
  },
  {
    id: 'p-semencnb', sku: 'SMN-002', barcode: '8991234500028', nama: 'Semen Holcim 40 kg',
    category_id: 'c-semen', base_unit_id: 'u-kg', hpp: 1200, stok_min: 40, favorit: 0,
    units: [
      { unit_id: 'u-sak', konversi: 40, is_default_jual: 1, is_default_beli: 1 },
      { unit_id: 'u-kg', konversi: 1 },
    ],
    prices: [
      { unit_id: 'u-sak', tier_id: 't-eceran', harga: 58000 },
      { unit_id: 'u-sak', tier_id: 't-grosir', harga: 56500 },
      { unit_id: 'u-kg', tier_id: 't-eceran', harga: 1500 },
    ],
  },
  {
    id: 'p-semenputih', sku: 'SMN-003', barcode: '8991234500035', nama: 'Semen Putih 40 kg',
    category_id: 'c-semen', base_unit_id: 'u-kg', hpp: 2375, stok_min: 20, favorit: 0,
    units: [
      { unit_id: 'u-sak', konversi: 40, is_default_jual: 1, is_default_beli: 1 },
    ],
    prices: [
      { unit_id: 'u-sak', tier_id: 't-eceran', harga: 115000 },
      { unit_id: 'u-sak', tier_id: 't-grosir', harga: 112000 },
    ],
  },
  {
    id: 'p-batamerah', sku: 'BTA-001', barcode: '8991234500103', nama: 'Bata Merah Press',
    category_id: 'c-bata', base_unit_id: 'u-buah', hpp: 600, stok_min: 2000, favorit: 1,
    units: [
      { unit_id: 'u-buah', konversi: 1, is_default_jual: 1 },
      { unit_id: 'u-pak', konversi: 1000, is_default_beli: 1 },
    ],
    prices: [
      { unit_id: 'u-buah', tier_id: 't-eceran', harga: 800 },
      { unit_id: 'u-buah', tier_id: 't-grosir', harga: 720 },
      { unit_id: 'u-pak', tier_id: 't-eceran', harga: 750000 },
      { unit_id: 'u-pak', tier_id: 't-grosir', harga: 700000 },
    ],
  },
  {
    id: 'p-batako', sku: 'BTA-002', barcode: '8991234500110', nama: 'Batako Press Abu',
    category_id: 'c-bata', base_unit_id: 'u-buah', hpp: 2800, stok_min: 500, favorit: 0,
    units: [
      { unit_id: 'u-buah', konversi: 1, is_default_jual: 1 },
      { unit_id: 'u-pak', konversi: 200, is_default_beli: 1 },
    ],
    prices: [
      { unit_id: 'u-buah', tier_id: 't-eceran', harga: 3500 },
      { unit_id: 'u-buah', tier_id: 't-grosir', harga: 3300 },
    ],
  },
  {
    id: 'p-keramik40', sku: 'KRM-001', barcode: '8991234500202', nama: 'Keramik Lantai 40x40',
    category_id: 'c-keramik', base_unit_id: 'u-m2', hpp: 29167, stok_min: 10, favorit: 1,
    units: [
      { unit_id: 'u-dus', konversi: 1.44, is_default_jual: 1, is_default_beli: 1 },
      { unit_id: 'u-m2', konversi: 1 },
    ],
    prices: [
      { unit_id: 'u-dus', tier_id: 't-eceran', harga: 65000 },
      { unit_id: 'u-dus', tier_id: 't-grosir', harga: 62000 },
      { unit_id: 'u-m2', tier_id: 't-eceran', harga: 47000 },
    ],
  },
  {
    id: 'p-granit60', sku: 'KRM-002', barcode: '8991234500219', nama: 'Granit Lantai 60x60',
    category_id: 'c-keramik', base_unit_id: 'u-m2', hpp: 59028, stok_min: 6, favorit: 0,
    units: [
      { unit_id: 'u-dus', konversi: 1.44, is_default_jual: 1, is_default_beli: 1 },
      { unit_id: 'u-m2', konversi: 1 },
    ],
    prices: [
      { unit_id: 'u-dus', tier_id: 't-eceran', harga: 125000 },
      { unit_id: 'u-dus', tier_id: 't-grosir', harga: 120000 },
      { unit_id: 'u-m2', tier_id: 't-eceran', harga: 90000 },
    ],
  },
  {
    id: 'p-cattembok5', sku: 'CAT-001', barcode: '8991234500301', nama: 'Cat Tembok Putih 5 kg',
    category_id: 'c-cat', base_unit_id: 'u-kaleng', hpp: 125000, stok_min: 8, favorit: 1,
    units: [{ unit_id: 'u-kaleng', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [
      { unit_id: 'u-kaleng', tier_id: 't-eceran', harga: 155000 },
      { unit_id: 'u-kaleng', tier_id: 't-grosir', harga: 150000 },
    ],
  },
  {
    id: 'p-cat25', sku: 'CAT-002', barcode: '8991234500318', nama: 'Cat Tembok 25 kg',
    category_id: 'c-cat', base_unit_id: 'u-pail', hpp: 520000, stok_min: 4, favorit: 0,
    units: [{ unit_id: 'u-pail', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [
      { unit_id: 'u-pail', tier_id: 't-eceran', harga: 620000 },
      { unit_id: 'u-pail', tier_id: 't-grosir', harga: 600000 },
    ],
  },
  {
    id: 'p-catminyak', sku: 'CAT-003', barcode: '8991234500325', nama: 'Cat Kayu & Besi 1 kg',
    category_id: 'c-cat', base_unit_id: 'u-kaleng', hpp: 45000, stok_min: 6, favorit: 0,
    units: [{ unit_id: 'u-kaleng', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-kaleng', tier_id: 't-eceran', harga: 60000 }],
  },
  {
    id: 'p-besi8', sku: 'BSI-001', barcode: '8991234500400', nama: 'Besi Beton 8 mm (12 m)',
    category_id: 'c-besi', base_unit_id: 'u-batang', hpp: 55000, stok_min: 10, favorit: 1,
    units: [{ unit_id: 'u-batang', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [
      { unit_id: 'u-batang', tier_id: 't-eceran', harga: 70000 },
      { unit_id: 'u-batang', tier_id: 't-grosir', harga: 68000 },
      { unit_id: 'u-batang', tier_id: 't-kontraktor', harga: 66000 },
    ],
  },
  {
    id: 'p-besi10', sku: 'BSI-002', barcode: '8991234500417', nama: 'Besi Beton 10 mm (12 m)',
    category_id: 'c-besi', base_unit_id: 'u-batang', hpp: 85000, stok_min: 10, favorit: 0,
    units: [{ unit_id: 'u-batang', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [
      { unit_id: 'u-batang', tier_id: 't-eceran', harga: 108000 },
      { unit_id: 'u-batang', tier_id: 't-grosir', harga: 105000 },
    ],
  },
  {
    id: 'p-wirmesh', sku: 'BSI-003', barcode: '8991234500424', nama: 'Wiremesh BWG 8 (2,1x5,4 m)',
    category_id: 'c-besi', base_unit_id: 'u-lembar', hpp: 210000, stok_min: 5, favorit: 0,
    units: [{ unit_id: 'u-lembar', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-lembar', tier_id: 't-eceran', harga: 255000 }],
  },
  {
    id: 'p-pipvca', sku: 'PIP-001', barcode: '8991234500509', nama: 'Pipa PVC 3/4" (4 m)',
    category_id: 'c-pipa', base_unit_id: 'u-batang', hpp: 18000, stok_min: 20, favorit: 1,
    units: [
      { unit_id: 'u-batang', konversi: 1, is_default_jual: 1, is_default_beli: 1 },
      { unit_id: 'u-m', konversi: 0.25 },
    ],
    prices: [
      { unit_id: 'u-batang', tier_id: 't-eceran', harga: 24000 },
      { unit_id: 'u-batang', tier_id: 't-grosir', harga: 23000 },
      { unit_id: 'u-m', tier_id: 't-eceran', harga: 6500 },
    ],
  },
  {
    id: 'p-pipvcb', sku: 'PIP-002', barcode: '8991234500516', nama: 'Pipa PVC 1" (4 m)',
    category_id: 'c-pipa', base_unit_id: 'u-batang', hpp: 32000, stok_min: 15, favorit: 0,
    units: [{ unit_id: 'u-batang', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-batang', tier_id: 't-eceran', harga: 42000 }],
  },
  {
    id: 'p-kabel', sku: 'KLB-001', barcode: '8991234500608', nama: 'Kabel NYM 3x2,5 (50 m)',
    category_id: 'c-listrik', base_unit_id: 'u-roll', hpp: 280000, stok_min: 4, favorit: 1,
    units: [
      { unit_id: 'u-roll', konversi: 1, is_default_jual: 1, is_default_beli: 1 },
      { unit_id: 'u-m', konversi: 0.02 },
    ],
    prices: [
      { unit_id: 'u-roll', tier_id: 't-eceran', harga: 350000 },
      { unit_id: 'u-roll', tier_id: 't-grosir', harga: 340000 },
      { unit_id: 'u-m', tier_id: 't-eceran', harga: 7200 },
    ],
  },
  {
    id: 'p-paku2', sku: 'PKU-001', barcode: '8991234500707', nama: 'Paku 2" (1 kg)',
    category_id: 'c-alat', base_unit_id: 'u-kg', hpp: 14000, stok_min: 5, favorit: 0,
    units: [
      { unit_id: 'u-kg', konversi: 1, is_default_jual: 1 },
      { unit_id: 'u-dus', konversi: 20, is_default_beli: 1 },
    ],
    prices: [
      { unit_id: 'u-kg', tier_id: 't-eceran', harga: 18000 },
      { unit_id: 'u-kg', tier_id: 't-grosir', harga: 17000 },
      { unit_id: 'u-dus', tier_id: 't-eceran', harga: 350000 },
    ],
  },
  {
    id: 'p-paku1', sku: 'PKU-002', barcode: '8991234500714', nama: 'Paku 1" (1 kg)',
    category_id: 'c-alat', base_unit_id: 'u-kg', hpp: 14000, stok_min: 5, favorit: 0,
    units: [{ unit_id: 'u-kg', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-kg', tier_id: 't-eceran', harga: 18000 }],
  },
  {
    id: 'p-cetok', sku: 'ALT-001', barcode: '8991234500806', nama: 'Cetok Batu / Trowel',
    category_id: 'c-alat', base_unit_id: 'u-buah', hpp: 18000, stok_min: 5, favorit: 0,
    units: [{ unit_id: 'u-buah', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-buah', tier_id: 't-eceran', harga: 25000 }],
  },
  {
    id: 'p-kuas', sku: 'ALT-002', barcode: '8991234500813', nama: 'Kuas Cat 4"',
    category_id: 'c-alat', base_unit_id: 'u-buah', hpp: 8000, stok_min: 8, favorit: 0,
    units: [{ unit_id: 'u-buah', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-buah', tier_id: 't-eceran', harga: 12000 }],
  },
  {
    id: 'p-ember', sku: 'ALT-003', barcode: '8991234500820', nama: 'Ember / Baki 25 L',
    category_id: 'c-alat', base_unit_id: 'u-buah', hpp: 22000, stok_min: 4, favorit: 0,
    units: [{ unit_id: 'u-buah', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-buah', tier_id: 't-eceran', harga: 30000 }],
  },
  {
    id: 'p-pasir', sku: 'PSR-001', barcode: '8991234500905', nama: 'Pasir Pasang (per m³)',
    category_id: 'c-agregat', base_unit_id: 'u-m3', hpp: 220000, stok_min: 2, favorit: 1,
    units: [{ unit_id: 'u-m3', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [
      { unit_id: 'u-m3', tier_id: 't-eceran', harga: 280000 },
      { unit_id: 'u-m3', tier_id: 't-grosir', harga: 265000 },
    ],
  },
  {
    id: 'p-kerikil', sku: 'PSR-002', barcode: '8991234500912', nama: 'Kerikil / Split (per m³)',
    category_id: 'c-agregat', base_unit_id: 'u-m3', hpp: 280000, stok_min: 2, favorit: 0,
    units: [{ unit_id: 'u-m3', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [
      { unit_id: 'u-m3', tier_id: 't-eceran', harga: 340000 },
      { unit_id: 'u-m3', tier_id: 't-grosir', harga: 325000 },
    ],
  },
  {
    id: 'p-triplek', sku: 'TPK-001', barcode: '8991234501001', nama: 'Triplek 12 mm (122x244)',
    category_id: 'c-atap', base_unit_id: 'u-lembar', hpp: 105000, stok_min: 10, favorit: 0,
    units: [{ unit_id: 'u-lembar', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [
      { unit_id: 'u-lembar', tier_id: 't-eceran', harga: 130000 },
      { unit_id: 'u-lembar', tier_id: 't-grosir', harga: 126000 },
    ],
  },
  {
    id: 'p-gypsum', sku: 'TPK-002', barcode: '8991234501018', nama: 'Papan Gypsum 9 mm (122x244)',
    category_id: 'c-atap', base_unit_id: 'u-lembar', hpp: 55000, stok_min: 10, favorit: 0,
    units: [{ unit_id: 'u-lembar', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-lembar', tier_id: 't-eceran', harga: 72000 }],
  },
  {
    id: 'p-seng', sku: 'ATP-001', barcode: '8991234501100', nama: 'Atap Seng 0,3 mm (2 m)',
    category_id: 'c-atap', base_unit_id: 'u-lembar', hpp: 48000, stok_min: 10, favorit: 0,
    units: [{ unit_id: 'u-lembar', konversi: 1, is_default_jual: 1, is_default_beli: 1 }],
    prices: [{ unit_id: 'u-lembar', tier_id: 't-eceran', harga: 62000 }],
  },
];

export const SEED_CUSTOMERS: Omit<Customer, 'created_at' | 'deleted_at'>[] = [
  {
    id: 'cus-1', kode: 'C-0001', nama: 'Toko Bangunan Jaya', telp: '081234567890',
    alamat: 'Jl. Raya Pemuda No. 12', proyek: 'Renovasi Toko', price_tier_id: 't-grosir',
    limit_kredit: 5000000, catatan: 'Langganan tetap, bayar tiap akhir bulan',
  },
  {
    id: 'cus-2', kode: 'C-0002', nama: 'Budi Santoso', telp: '081345678901',
    alamat: 'Jl. Kenanga No. 5', proyek: 'Pembangunan Rumah', price_tier_id: 't-kontraktor',
    limit_kredit: 10000000, catatan: 'Kontraktor, sering ambil grosir',
  },
  {
    id: 'cus-3', kode: 'C-0003', nama: 'Siti Rahayu', telp: '081456789012',
    alamat: 'Jl. Melati No. 3', proyek: '', price_tier_id: 't-eceran',
    limit_kredit: 0, catatan: 'Pembeli eceran',
  },
];

export const SEED_SUPPLIERS: Omit<Supplier, 'created_at' | 'deleted_at'>[] = [
  {
    id: 'sup-1', nama: 'CV Semen Nusantara', telp: '031-5551234',
    alamat: 'Jl. Industri No. 88, Surabaya',
  },
  {
    id: 'sup-2', nama: 'Toko Besi Makmur', telp: '031-5555678',
    alamat: 'Jl. Dupak No. 12, Surabaya',
  },
  {
    id: 'sup-3', nama: 'Distributor Cat Pro', telp: '031-5559012',
    alamat: 'Jl. Rungkut No. 45, Surabaya',
  },
];

export function seedOwner(): { id: string; nama: string; pin_hash: string; role: 'OWNER'; aktif: number } {
  return {
    id: 'usr-owner',
    nama: 'Pemilik Toko',
    pin_hash: hashPin('1234'),
    role: 'OWNER',
    aktif: 1,
  };
}

export const DEFAULT_SETTINGS: Record<string, string> = {
  printer_name: '',
  printer_width: '58',
  bunyi_scan: '1',
  haptic: '1',
  default_satuan_terakhir: '1',
  izin_jual_minus: '0',
  auto_backup: '1',
  last_backup: '',
};
