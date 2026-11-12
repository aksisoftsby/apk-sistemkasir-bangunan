import { all, begin, commit, get, notifyChange, rollback, run } from './db';
import { formatNumber } from './format';
import { nowIso, uid } from './id';
import type {
  CashShift,
  Category,
  Customer,
  Delivery,
  HeldOrder,
  PriceTier,
  ProductPrice,
  ProductUnit,
  ProductView,
  Purchase,
  Sale,
  SaleItem, SaleView, Supplier, Unit,
} from './types';

/* ================= Master data ================= */

export function listCategories(): Category[] {
  return all<Category>('SELECT * FROM categories ORDER BY nama');
}

export function listUnits(): Unit[] {
  return all<Unit>('SELECT * FROM units ORDER BY nama');
}

export function listPriceTiers(): PriceTier[] {
  return all<PriceTier>('SELECT * FROM price_tiers ORDER BY urutan');
}

export function listSuppliers(): Supplier[] {
  return all<Supplier>('SELECT * FROM suppliers WHERE deleted_at IS NULL ORDER BY nama');
}

export function getStoreProfile() {
  return get<{
    id: string;
    nama: string;
    alamat: string;
    telp: string;
    logo: string;
    footer_nota: string;
    ppn_persen: number;
    pembulatan: number;
  }>('SELECT * FROM store_profile LIMIT 1');
}

export function saveStoreProfile(p: {
  id?: string;
  nama: string;
  alamat: string;
  telp: string;
  footer_nota: string;
  ppn_persen: number;
  pembulatan: number;
}) {
  const id = p.id || 'store-1';
  run(
    `INSERT INTO store_profile (id, nama, alamat, telp, footer_nota, ppn_persen, pembulatan)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET nama=excluded.nama, alamat=excluded.alamat, telp=excluded.telp,
       footer_nota=excluded.footer_nota, ppn_persen=excluded.ppn_persen, pembulatan=excluded.pembulatan`,
    [id, p.nama, p.alamat, p.telp, p.footer_nota, p.ppn_persen, p.pembulatan],
  );
  notifyChange();
}

/* ================= Products ================= */

export interface ProductListFilters {
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  favoritOnly?: boolean;
  includeInactive?: boolean;
}

export function listProducts(f: ProductListFilters = {}): ProductView[] {
  const where: string[] = ['p.deleted_at IS NULL'];
  const params: unknown[] = [];
  if (!f.includeInactive) where.push('p.aktif = 1');
  if (f.search) {
    where.push('(p.nama LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)');
    const q = `%${f.search}%`;
    params.push(q, q, q);
  }
  if (f.categoryId) {
    where.push('p.category_id = ?');
    params.push(f.categoryId);
  }
  if (f.favoritOnly) where.push('p.favorit = 1');
  const rows = all<ProductView>(
    `SELECT p.*, COALESCE(c.nama, '') AS kategori_nama,
            COALESCE(u.nama, '') AS base_unit_nama, COALESCE(u.simbol, '') AS base_unit_simbol,
            COALESCE((SELECT u2.simbol FROM product_units pu2 JOIN units u2 ON u2.id = pu2.unit_id
                      WHERE pu2.product_id = p.id AND pu2.is_default_jual = 1 LIMIT 1), u.simbol, '') AS sell_unit_simbol,
            COALESCE((SELECT pu2.konversi FROM product_units pu2
                      WHERE pu2.product_id = p.id AND pu2.is_default_jual = 1 LIMIT 1), 1) AS sell_konversi,
            COALESCE(sb.qty_dasar, 0) AS stok_dasar
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN units u ON u.id = p.base_unit_id
     LEFT JOIN stock_balances sb ON sb.product_id = p.id
     WHERE ${where.join(' AND ')}
     ORDER BY p.favorit DESC, p.nama`,
    params,
  );
  if (f.lowStockOnly) {
    return rows.filter((r) => r.stok_dasar <= r.stok_min);
  }
  return rows;
}

export function getProduct(id: string): ProductView | null {
  return get<ProductView>(
    `SELECT p.*, COALESCE(c.nama, '') AS kategori_nama,
            COALESCE(u.nama, '') AS base_unit_nama, COALESCE(u.simbol, '') AS base_unit_simbol,
            COALESCE((SELECT u2.simbol FROM product_units pu2 JOIN units u2 ON u2.id = pu2.unit_id
                      WHERE pu2.product_id = p.id AND pu2.is_default_jual = 1 LIMIT 1), u.simbol, '') AS sell_unit_simbol,
            COALESCE((SELECT pu2.konversi FROM product_units pu2
                      WHERE pu2.product_id = p.id AND pu2.is_default_jual = 1 LIMIT 1), 1) AS sell_konversi,
            COALESCE(sb.qty_dasar, 0) AS stok_dasar
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN units u ON u.id = p.base_unit_id
     LEFT JOIN stock_balances sb ON sb.product_id = p.id
     WHERE p.id = ?`,
    [id],
  );
}

export function getProductUnits(productId: string): (ProductUnit & { unit_nama: string; unit_simbol: string; allow_decimal: number; decimal_places: number })[] {
  return all(
    `SELECT pu.*, u.nama AS unit_nama, u.simbol AS unit_simbol,
            u.allow_decimal, u.decimal_places
     FROM product_units pu JOIN units u ON u.id = pu.unit_id
     WHERE pu.product_id = ? ORDER BY pu.urutan`,
    [productId],
  );
}

export function getProductPrices(productId: string): ProductPrice[] {
  return all<ProductPrice>('SELECT * FROM product_prices WHERE product_id = ?', [productId]);
}

export function getPriceFor(productUnitId: string, tierId: string): number {
  const exact = get<{ harga: number }>(
    'SELECT harga FROM product_prices WHERE product_unit_id = ? AND price_tier_id = ? LIMIT 1',
    [productUnitId, tierId],
  );
  if (exact) return exact.harga;
  const fallback = get<{ harga: number }>(
    'SELECT harga FROM product_prices WHERE product_unit_id = ? ORDER BY harga DESC LIMIT 1',
    [productUnitId],
  );
  return fallback?.harga ?? 0;
}

export interface ProductInput {
  id?: string;
  sku: string;
  barcode: string;
  nama: string;
  category_id: string;
  base_unit_id: string;
  hpp: number;
  stok_min: number;
  favorit: number;
  aktif: number;
  catatan: string;
  units: { unit_id: string; konversi: number; is_default_jual: number; is_default_beli: number }[];
  prices: { unit_id: string; tier_id: string; harga: number }[];
  stok_awal?: number;
}

export function saveProduct(input: ProductInput): string {
  const id = input.id || uid();
  const existing = input.id ? get<{ id: string }>('SELECT id FROM products WHERE id = ?', [input.id]) : null;
  begin();
  try {
    if (existing) {
      run(
        `UPDATE products SET sku=?, barcode=?, nama=?, category_id=?, base_unit_id=?, hpp=?, stok_min=?,
           favorit=?, aktif=?, catatan=?, updated_at=? WHERE id=?`,
        [
          input.sku, input.barcode, input.nama, input.category_id, input.base_unit_id,
          input.hpp, input.stok_min, input.favorit, input.aktif, input.catatan, nowIso(), id,
        ],
      );
    } else {
      run(
        `INSERT INTO products (id, sku, barcode, nama, category_id, base_unit_id, hpp, stok_min, favorit, aktif, catatan, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, input.sku, input.barcode, input.nama, input.category_id, input.base_unit_id,
          input.hpp, input.stok_min, input.favorit, input.aktif, input.catatan, nowIso(), nowIso(),
        ],
      );
      run('INSERT OR IGNORE INTO stock_balances (product_id, qty_dasar) VALUES (?, 0)', [id]);
    }
    run('DELETE FROM product_units WHERE product_id = ?', [id]);
    for (let i = 0; i < input.units.length; i++) {
      const u = input.units[i];
      const puId = `${id}-${u.unit_id}`;
      run(
        `INSERT INTO product_units (id, product_id, unit_id, konversi, is_default_jual, is_default_beli, urutan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [puId, id, u.unit_id, u.konversi, u.is_default_jual, u.is_default_beli, i],
      );
    }
    run('DELETE FROM product_prices WHERE product_id = ?', [id]);
    for (const p of input.prices) {
      const puId = `${id}-${p.unit_id}`;
      run(
        `INSERT INTO product_prices (id, product_id, product_unit_id, price_tier_id, harga, min_qty)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [uid(), id, puId, p.tier_id, p.harga],
      );
    }
    if (!existing && input.stok_awal && input.stok_awal > 0) {
      applyStockMovement(id, 'STOK_AWAL', input.stok_awal, input.hpp, 'PRODUCT', id, 'Stok awal');
    }
    commit();
  } catch (e) {
    rollback();
    throw e;
  }
  return id;
}

export function deleteProduct(id: string) {
  run('UPDATE products SET deleted_at = ?, aktif = 0 WHERE id = ?', [nowIso(), id]);
  notifyChange();
}

export function toggleFavorit(id: string, value: number) {
  run('UPDATE products SET favorit = ?, updated_at = ? WHERE id = ?', [value, nowIso(), id]);
  notifyChange();
}

export function applyStockMovement(
  productId: string,
  tipe: string,
  qtyDasar: number,
  hppUnit: number,
  refType: string,
  refId: string,
  catatan: string,
  userId = '',
) {
  run(
    `INSERT INTO stock_movements (id, product_id, tipe, qty_dasar, hpp_unit, ref_type, ref_id, tanggal, user_id, catatan)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uid(), productId, tipe, qtyDasar, hppUnit, refType, refId, nowIso(), userId, catatan],
  );
  run(
    `INSERT INTO stock_balances (product_id, qty_dasar) VALUES (?, ?)
     ON CONFLICT(product_id) DO UPDATE SET qty_dasar = qty_dasar + excluded.qty_dasar`,
    [productId, qtyDasar],
  );
}

/* ================= Customers ================= */

export function listCustomers(search?: string): Customer[] {
  const params: unknown[] = [];
  let where = 'deleted_at IS NULL';
  if (search) {
    where += ' AND (nama LIKE ? OR telp LIKE ? OR kode LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  return all<Customer>(`SELECT * FROM customers WHERE ${where} ORDER BY nama`, params);
}

export function getCustomer(id: string): Customer | null {
  return get<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
}

export function saveCustomer(c: Omit<Customer, 'id' | 'created_at' | 'deleted_at'> & { id?: string }): string {
  const id = c.id || uid();
  const exists = c.id ? get<{ id: string }>('SELECT id FROM customers WHERE id = ?', [c.id]) : null;
  if (exists) {
    run(
      `UPDATE customers SET kode=?, nama=?, telp=?, alamat=?, proyek=?, price_tier_id=?, limit_kredit=?, catatan=? WHERE id=?`,
      [c.kode, c.nama, c.telp, c.alamat, c.proyek, c.price_tier_id, c.limit_kredit, c.catatan, id],
    );
  } else {
    run(
      `INSERT INTO customers (id, kode, nama, telp, alamat, proyek, price_tier_id, limit_kredit, catatan, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, c.kode, c.nama, c.telp, c.alamat, c.proyek, c.price_tier_id, c.limit_kredit, c.catatan, nowIso()],
    );
  }
  notifyChange();
  return id;
}

export function deleteCustomer(id: string) {
  run('UPDATE customers SET deleted_at = ? WHERE id = ?', [nowIso(), id]);
  notifyChange();
}

export interface ReceivableRow {
  sale_id: string;
  no_nota: string;
  tanggal: string;
  customer_id: string;
  customer_nama: string;
  customer_telp: string;
  total: number;
  total_bayar: number;
  sisa: number;
  jatuh_tempo: string | null;
  status: string;
  proyek: string;
}

export function listReceivables(customerId?: string): ReceivableRow[] {
  const params: unknown[] = [];
  let where = 's.deleted_at IS NULL AND s.sisa > 0 AND s.status != ?';
  params.push('BATAL');
  if (customerId) {
    where += ' AND s.customer_id = ?';
    params.push(customerId);
  }
  return all<ReceivableRow>(
    `SELECT s.id AS sale_id, s.no_nota, s.tanggal, s.customer_id,
            COALESCE(c.nama, '') AS customer_nama, COALESCE(c.telp, '') AS customer_telp,
            s.total, s.total_bayar, s.sisa, s.jatuh_tempo, s.status, s.proyek
     FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
     WHERE ${where}
     ORDER BY (s.jatuh_tempo IS NULL), s.jatuh_tempo, s.tanggal`,
    params,
  );
}

export function totalReceivable(customerId?: string): number {
  const rows = listReceivables(customerId);
  return rows.reduce((a, r) => a + r.sisa, 0);
}

export function payReceivable(saleId: string, jumlah: number, metode: string, userId: string): void {
  const sale = get<Sale>('SELECT * FROM sales WHERE id = ?', [saleId]);
  if (!sale) throw new Error('Transaksi tidak ditemukan');
  const bayar = Math.min(jumlah, sale.sisa);
  if (bayar <= 0) throw new Error('Jumlah pembayaran tidak valid');
  begin();
  try {
    run(
      'INSERT INTO receivable_payments (id, customer_id, sale_id, jumlah, tanggal, metode, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uid(), sale.customer_id, saleId, bayar, nowIso(), metode, userId],
    );
    const newBayar = sale.total_bayar + bayar;
    const newSisa = sale.total - newBayar;
    run('UPDATE sales SET total_bayar = ?, sisa = ?, status = ?, updated_at = ? WHERE id = ?', [
      newBayar, Math.max(0, newSisa), newSisa <= 0 ? 'LUNAS' : sale.status, nowIso(), saleId,
    ]);
    if (metode === 'TUNAI') {
      run(
        'INSERT INTO cash_transactions (id, shift_id, tipe, kategori, jumlah, catatan, tanggal, user_id) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)',
        [uid(), 'MASUK', 'Pelunasan Piutang', bayar, `Pelunasan ${sale.no_nota}`, nowIso(), userId],
      );
    }
    commit();
  } catch (e) {
    rollback();
    throw e;
  }
}

/* ================= Sales ================= */

export interface SaleInput {
  customer_id: string | null;
  proyek: string;
  catatan: string;
  diskon: number;
  biaya_kirim: number;
  ppn_persen: number;
  pembulatan: number;
  metode: 'TUNAI' | 'TRANSFER' | 'QRIS' | 'TEMPO' | 'DP';
  dibayar: number;
  jatuh_tempo: string | null;
  items: {
    product_id: string;
    product_unit_id: string;
    unit_id: string;
    unit_simbol: string;
    qty: number;
    konversi: number;
    harga_satuan: number;
    diskon: number;
    nama_produk: string;
    hpp: number;
  }[];
}

export function nextNotaNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const row = get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sales WHERE no_nota LIKE ?`,
    [`INV-${ymd}-%`],
  );
  const seq = (row?.n ?? 0) + 1;
  return `INV-${ymd}-${String(seq).padStart(4, '0')}`;
}

export function createSale(input: SaleInput, userId: string, shiftId: string | null): Sale {
  const subtotal = input.items.reduce((a, i) => {
    const raw = i.qty * i.harga_satuan - i.diskon;
    return a + Math.max(0, Math.round(raw));
  }, 0);
  const diskon = Math.min(input.diskon, subtotal);
  const afterDiskon = subtotal - diskon;
  const ppn = Math.round((afterDiskon * input.ppn_persen) / 100);
  const kotor = afterDiskon + ppn + input.biaya_kirim;
  let total = kotor;
  let pembulatan = 0;
  if (input.pembulatan > 1) {
    const rounded = Math.round(kotor / input.pembulatan) * input.pembulatan;
    pembulatan = rounded - kotor;
    total = rounded;
  }
  let dibayar = input.dibayar;
  if (input.metode === 'TUNAI' || input.metode === 'TRANSFER' || input.metode === 'QRIS') {
    dibayar = total;
  }
  const sisa = Math.max(0, total - dibayar);
  const status: Sale['status'] = sisa <= 0 ? 'LUNAS' : input.metode === 'DP' ? 'DP' : 'TEMPO';
  const id = uid();
  const noNota = nextNotaNumber();
  begin();
  try {
    run(
      `INSERT INTO sales (id, no_nota, tanggal, customer_id, user_id, shift_id, subtotal, diskon, ppn, biaya_kirim, pembulatan, total, total_bayar, sisa, status, jatuh_tempo, proyek, catatan, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, noNota, nowIso(), input.customer_id, userId, shiftId, subtotal, diskon, ppn,
        input.biaya_kirim, pembulatan, total, dibayar, sisa, status, input.jatuh_tempo,
        input.proyek, input.catatan, nowIso(), nowIso(),
      ],
    );
    for (const it of input.items) {
      const sub = Math.max(0, Math.round(it.qty * it.harga_satuan - it.diskon));
      const qtyDasar = it.qty * it.konversi;
      run(
        `INSERT INTO sale_items (id, sale_id, product_id, product_unit_id, qty, qty_dasar, harga_satuan, diskon, subtotal, hpp_saat_jual, nama_produk, satuan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid(), id, it.product_id, it.product_unit_id, it.qty, qtyDasar, it.harga_satuan, it.diskon, sub, it.hpp, it.nama_produk, it.unit_simbol],
      );
      applyStockMovement(it.product_id, 'SALE', -qtyDasar, it.hpp, 'SALE', id, `Penjualan ${noNota}`, userId);
    }
    if (dibayar > 0) {
      run(
        'INSERT INTO sale_payments (id, sale_id, metode, jumlah, tanggal, referensi) VALUES (?, ?, ?, ?, ?, ?)',
        [uid(), id, input.metode, dibayar, nowIso(), ''],
      );
      if (input.metode === 'TUNAI') {
        run(
          'INSERT INTO cash_transactions (id, shift_id, tipe, kategori, jumlah, catatan, tanggal, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [uid(), shiftId, 'MASUK', 'Penjualan', dibayar, noNota, nowIso(), userId],
        );
      }
    }
    commit();
  } catch (e) {
    rollback();
    throw e;
  }
  const created = get<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
  if (!created) throw new Error('Gagal membuat transaksi');
  return created;
}

export function listSales(opts: { from?: string; to?: string; search?: string; status?: string; customerId?: string; limit?: number } = {}): SaleView[] {
  const where: string[] = ['s.deleted_at IS NULL'];
  const params: unknown[] = [];
  if (opts.customerId) {
    where.push('s.customer_id = ?');
    params.push(opts.customerId);
  }
  if (opts.from) {
    where.push('s.tanggal >= ?');
    params.push(opts.from);
  }
  if (opts.to) {
    where.push('s.tanggal <= ?');
    params.push(opts.to + 'T23:59:59');
  }
  if (opts.status) {
    where.push('s.status = ?');
    params.push(opts.status);
  }
  if (opts.search) {
    where.push('(s.no_nota LIKE ? OR c.nama LIKE ?)');
    const q = `%${opts.search}%`;
    params.push(q, q);
  }
  params.push(opts.limit ?? 100);
  return all<SaleView>(
    `SELECT s.*, COALESCE(c.nama, '') AS customer_nama, COALESCE(u.nama, '-') AS kasir_nama,
            (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN users u ON u.id = s.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY s.tanggal DESC
     LIMIT ?`,
    params,
  );
}

export function getSale(id: string): Sale | null {
  return get<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
}

export function getSaleItems(saleId: string): SaleItem[] {
  return all<SaleItem>('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
}

export function getSalePayments(saleId: string) {
  return all<{ id: string; metode: string; jumlah: number; tanggal: string }>(
    'SELECT id, metode, jumlah, tanggal FROM sale_payments WHERE sale_id = ?',
    [saleId],
  );
}

export function voidSale(saleId: string, userId: string, alasan: string): void {
  const sale = get<Sale>('SELECT * FROM sales WHERE id = ?', [saleId]);
  if (!sale || sale.status === 'BATAL') throw new Error('Transaksi tidak valid');
  begin();
  try {
    const items = getSaleItems(saleId);
    for (const it of items) {
      applyStockMovement(it.product_id, 'VOID', it.qty_dasar, it.hpp_saat_jual, 'SALE', saleId, `Batal ${sale.no_nota}`, userId);
    }
    run('UPDATE sales SET status = ?, sisa = 0, updated_at = ? WHERE id = ?', ['BATAL', nowIso(), saleId]);
    run('INSERT INTO audit_logs (id, user_id, aksi, entitas, detail, waktu) VALUES (?, ?, ?, ?, ?, ?)', [
      uid(), userId, 'BATAL_NOTA', 'sales', `${sale.no_nota}: ${alasan}`, nowIso(),
    ]);
    commit();
  } catch (e) {
    rollback();
    throw e;
  }
}

/* ================= Returns ================= */

export function createSaleReturn(
  saleId: string,
  items: { sale_item_id: string; qty: number; harga_satuan: number; qty_dasar: number; subtotal: number }[],
  kompensasi: string,
  alasan: string,
  userId: string,
): string {
  const id = uid();
  const total = items.reduce((a, i) => a + i.subtotal, 0);
  begin();
  try {
    run(
      'INSERT INTO sale_returns (id, sale_id, tanggal, total, alasan, kompensasi, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, saleId, nowIso(), total, alasan, kompensasi, userId, nowIso()],
    );
    for (const it of items) {
      run(
        'INSERT INTO sale_return_items (id, return_id, sale_item_id, qty, qty_dasar, harga_satuan, subtotal, masuk_stok) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [uid(), id, it.sale_item_id, it.qty, it.qty_dasar, it.harga_satuan, it.subtotal],
      );
      const item = get<SaleItem>('SELECT * FROM sale_items WHERE id = ?', [it.sale_item_id]);
      if (item) {
        applyStockMovement(item.product_id, 'RETURN_IN', it.qty_dasar, item.hpp_saat_jual, 'RETURN', id, `Retur ${saleId}`, userId);
      }
    }
    const sale = get<Sale>('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (sale) {
      if (kompensasi === 'PIUTANG' && sale.sisa > 0) {
        const newSisa = Math.max(0, sale.sisa - total);
        run('UPDATE sales SET sisa = ?, total_bayar = total_bayar, status = ?, updated_at = ? WHERE id = ?', [
          newSisa, newSisa <= 0 ? 'LUNAS' : sale.status, nowIso(), saleId,
        ]);
      } else {
        run('UPDATE sales SET sisa = MAX(0, sisa - ?), updated_at = ? WHERE id = ?', [total, nowIso(), saleId]);
      }
    }
    commit();
  } catch (e) {
    rollback();
    throw e;
  }
  return id;
}

export function listSaleReturns(saleId: string) {
  return all<{ id: string; tanggal: string; total: number; kompensasi: string; alasan: string }>(
    'SELECT id, tanggal, total, kompensasi, alasan FROM sale_returns WHERE sale_id = ? ORDER BY tanggal DESC',
    [saleId],
  );
}

/* ================= Deliveries ================= */

export function getDelivery(saleId: string): Delivery | null {
  return get<Delivery>('SELECT * FROM deliveries WHERE sale_id = ? ORDER BY created_at DESC LIMIT 1', [saleId]);
}

export function saveDelivery(d: { sale_id: string; alamat_kirim: string; sopir: string; status: string }) {
  const existing = getDelivery(d.sale_id);
  if (existing) {
    run('UPDATE deliveries SET alamat_kirim=?, sopir=?, status=? WHERE id=?', [d.alamat_kirim, d.sopir, d.status, existing.id]);
  } else {
    run(
      'INSERT INTO deliveries (id, sale_id, alamat_kirim, sopir, status, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [uid(), d.sale_id, d.alamat_kirim, d.sopir, d.status, nowIso()],
    );
  }
  notifyChange();
}

export function listDeliveries(): (Delivery & { no_nota: string; customer_nama: string })[] {
  return all(
    `SELECT d.*, s.no_nota, COALESCE(c.nama, '') AS customer_nama
     FROM deliveries d JOIN sales s ON s.id = d.sale_id
     LEFT JOIN customers c ON c.id = s.customer_id
     WHERE s.deleted_at IS NULL ORDER BY d.tanggal DESC`,
  );
}

/* ================= Purchases ================= */

export function listPurchases(): (Purchase & { supplier_nama: string })[] {
  return all(
    `SELECT p.*, COALESCE(s.nama, '-') AS supplier_nama FROM purchases p
     LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.tanggal DESC`,
  );
}

export function createPurchase(input: {
  supplier_id: string | null;
  total_bayar: number;
  jatuh_tempo: string | null;
  items: { product_id: string; product_unit_id: string; unit_id: string; qty: number; konversi: number; harga_satuan: number; nama_produk: string; satuan: string }[];
}, userId: string): string {
  const id = uid();
  const total = input.items.reduce((a, i) => a + Math.round(i.qty * i.harga_satuan), 0);
  const dibayar = Math.min(input.total_bayar, total);
  const sisa = Math.max(0, total - dibayar);
  const status = sisa <= 0 ? 'LUNAS' : 'TEMPO';
  begin();
  try {
    run(
      'INSERT INTO purchases (id, no_po, supplier_id, tanggal, total, total_bayar, sisa, status, jatuh_tempo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, nextPoNumber(), input.supplier_id, nowIso(), total, dibayar, sisa, status, input.jatuh_tempo, nowIso(), nowIso()],
    );
    for (const it of input.items) {
      const sub = Math.round(it.qty * it.harga_satuan);
      const qtyDasar = it.qty * it.konversi;
      run(
        'INSERT INTO purchase_items (id, purchase_id, product_id, product_unit_id, qty, qty_dasar, harga_satuan, subtotal, nama_produk, satuan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uid(), id, it.product_id, it.product_unit_id, it.qty, qtyDasar, it.harga_satuan, sub, it.nama_produk, it.satuan],
      );
      applyStockMovement(it.product_id, 'PURCHASE', qtyDasar, it.harga_satuan, 'PURCHASE', id, 'Pembelian', userId);
      // update HPP (moving average sederhana: pakai harga beli terakhir)
      const prod = get<{ hpp: number }>('SELECT hpp FROM products WHERE id = ?', [it.product_id]);
      if (prod) {
        const hppPerDasar = it.harga_satuan / Math.max(1, it.konversi);
        run('UPDATE products SET hpp = ?, updated_at = ? WHERE id = ?', [Math.round(hppPerDasar), nowIso(), it.product_id]);
      }
    }
    if (dibayar > 0) {
      run('INSERT INTO purchase_payments (id, purchase_id, jumlah, tanggal, metode) VALUES (?, ?, ?, ?, ?)', [uid(), id, dibayar, nowIso(), 'TRANSFER']);
    }
    commit();
  } catch (e) {
    rollback();
    throw e;
  }
  return id;
}

function nextPoNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const row = get<{ n: number }>('SELECT COUNT(*) AS n FROM purchases WHERE no_po LIKE ?', [`PO-${ymd}-%`]);
  return `PO-${ymd}-${String((row?.n ?? 0) + 1).padStart(4, '0')}`;
}

/* ================= Held orders ================= */

export function listHeldOrders(): HeldOrder[] {
  return all<HeldOrder>('SELECT * FROM held_orders ORDER BY created_at DESC');
}

export function saveHeldOrder(label: string, dataJson: string): string {
  const id = uid();
  run('INSERT INTO held_orders (id, label, data_json, created_at) VALUES (?, ?, ?, ?)', [id, label, dataJson, nowIso()]);
  notifyChange();
  return id;
}

export function deleteHeldOrder(id: string) {
  run('DELETE FROM held_orders WHERE id = ?', [id]);
  notifyChange();
}

/* ================= Cash shift ================= */

export function getOpenShift(userId: string): CashShift | null {
  return get<CashShift>('SELECT * FROM cash_shifts WHERE user_id = ? AND tutup_at IS NULL ORDER BY buka_at DESC LIMIT 1', [userId]);
}

export function openShift(userId: string, kasAwal: number): string {
  const existing = getOpenShift(userId);
  if (existing) return existing.id;
  const id = uid();
  run('INSERT INTO cash_shifts (id, user_id, buka_at, kas_awal) VALUES (?, ?, ?, ?)', [id, userId, nowIso(), kasAwal]);
  notifyChange();
  return id;
}

export function shiftCashInOut(shiftId: string | null, tipe: 'MASUK' | 'KELUAR', kategori: string, jumlah: number, catatan: string, userId: string) {
  run(
    'INSERT INTO cash_transactions (id, shift_id, tipe, kategori, jumlah, catatan, tanggal, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [uid(), shiftId, tipe, kategori, jumlah, catatan, nowIso(), userId],
  );
  notifyChange();
}

export interface ShiftSummary {
  shift: CashShift | null;
  masuk: number;
  keluar: number;
  sistem: number;
  tunai_penjualan: number;
  transactions: { id: string; tipe: string; kategori: string; jumlah: number; catatan: string; tanggal: string }[];
}

export function shiftSummary(shiftId: string): ShiftSummary {
  const shift = get<CashShift>('SELECT * FROM cash_shifts WHERE id = ?', [shiftId]);
  const masuk = get<{ n: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS n FROM cash_transactions WHERE shift_id = ? AND tipe = 'MASUK'`,
    [shiftId],
  );
  const keluar = get<{ n: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS n FROM cash_transactions WHERE shift_id = ? AND tipe = 'KELUAR'`,
    [shiftId],
  );
  const tunai = get<{ n: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS n FROM cash_transactions WHERE shift_id = ? AND tipe = 'MASUK' AND kategori = 'Penjualan'`,
    [shiftId],
  );
  const transactions = all<{ id: string; tipe: string; kategori: string; jumlah: number; catatan: string; tanggal: string }>(
    'SELECT id, tipe, kategori, jumlah, catatan, tanggal FROM cash_transactions WHERE shift_id = ? ORDER BY tanggal DESC',
    [shiftId],
  );
  const kasAwal = shift?.kas_awal ?? 0;
  return {
    shift,
    masuk: masuk?.n ?? 0,
    keluar: keluar?.n ?? 0,
    sistem: kasAwal + (masuk?.n ?? 0) - (keluar?.n ?? 0),
    tunai_penjualan: tunai?.n ?? 0,
    transactions,
  };
}

export function listClosedShifts(limit = 20): CashShift[] {
  return all<CashShift>(
    'SELECT * FROM cash_shifts WHERE tutup_at IS NOT NULL ORDER BY tutup_at DESC LIMIT ?',
    [limit],
  );
}

export function closeShift(shiftId: string, kasFisik: number): void {
  const masuk = get<{ n: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS n FROM cash_transactions WHERE shift_id = ? AND tipe = 'MASUK'`,
    [shiftId],
  );
  const keluar = get<{ n: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS n FROM cash_transactions WHERE shift_id = ? AND tipe = 'KELUAR'`,
    [shiftId],
  );
  const shift = get<CashShift>('SELECT * FROM cash_shifts WHERE id = ?', [shiftId]);
  const sistem = (shift?.kas_awal ?? 0) + (masuk?.n ?? 0) - (keluar?.n ?? 0);
  run('UPDATE cash_shifts SET tutup_at = ?, kas_akhir_sistem = ?, kas_akhir_fisik = ?, selisih = ? WHERE id = ?', [
    nowIso(), sistem, kasFisik, kasFisik - sistem, shiftId,
  ]);
  notifyChange();
}

/* ================= Settings ================= */

export function getSetting(key: string, fallback = ''): string {
  const row = get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
  notifyChange();
}

/* ================= Users ================= */

export function listUsers() {
  return all<{ id: string; nama: string; role: string; aktif: number; created_at: string }>(
    'SELECT id, nama, role, aktif, created_at FROM users ORDER BY created_at',
  );
}

export function saveUser(u: { id?: string; nama: string; pin: string; role: string }, hashPin: (p: string) => string): string {
  const id = u.id || uid();
  const exists = u.id ? get<{ id: string }>('SELECT id FROM users WHERE id = ?', [u.id]) : null;
  if (exists) {
    if (u.pin) {
      run('UPDATE users SET nama=?, role=?, pin_hash=? WHERE id=?', [u.nama, u.role, hashPin(u.pin), id]);
    } else {
      run('UPDATE users SET nama=?, role=? WHERE id=?', [u.nama, u.role, id]);
    }
  } else {
    run('INSERT INTO users (id, nama, pin_hash, role, aktif) VALUES (?, ?, ?, ?, 1)', [id, u.nama, hashPin(u.pin), u.role]);
  }
  notifyChange();
  return id;
}

export function deleteUser(id: string) {
  run('DELETE FROM users WHERE id = ? AND role != ?', [id, 'OWNER']);
  notifyChange();
}

export function getUserByPin(pinHash: string) {
  return get<{ id: string; nama: string; role: string; pin_hash: string }>(
    'SELECT id, nama, role, pin_hash FROM users WHERE pin_hash = ? AND aktif = 1',
    [pinHash],
  );
}

/* ================= Utilities ================= */

export function stockLabel(stokDasar: number, konversi: number, simbol: string): string {
  if (konversi <= 1) return `${formatNumber(stokDasar)} ${simbol}`;
  const besar = Math.floor(stokDasar / konversi);
  const sisa = stokDasar - besar * konversi;
  if (sisa <= 0) return `${formatNumber(besar)} ${simbol}`;
  return `${formatNumber(besar)} + ${formatNumber(sisa)} ${simbol}`;
}
