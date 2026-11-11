import { all, get } from './db';
import { todayIso } from './format';

export interface Summary {
  omzet: number;
  laba_kotor: number;
  transaksi: number;
  item_terjual: number;
  kas_masuk: number;
  piutang_baru: number;
}

export function dailySummary(from: string, to: string): Summary {
  const s = get<{ omzet: number; transaksi: number; piutang: number }>(
    `SELECT COALESCE(SUM(total),0) AS omzet, COUNT(*) AS transaksi, COALESCE(SUM(sisa),0) AS piutang
     FROM sales WHERE deleted_at IS NULL AND status != 'BATAL' AND tanggal >= ? AND tanggal <= ?`,
    [from, to + 'T23:59:59'],
  );
  const item = get<{ n: number }>(
    `SELECT COALESCE(SUM(si.qty),0) AS n FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.deleted_at IS NULL AND s.status != 'BATAL' AND s.tanggal >= ? AND s.tanggal <= ?`,
    [from, to + 'T23:59:59'],
  );
  const laba = get<{ n: number }>(
    `SELECT COALESCE(SUM(si.subtotal - si.hpp_saat_jual * si.qty_dasar),0) AS n
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.deleted_at IS NULL AND s.status != 'BATAL' AND s.tanggal >= ? AND s.tanggal <= ?`,
    [from, to + 'T23:59:59'],
  );
  const kas = get<{ n: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS n FROM cash_transactions
     WHERE tipe = 'MASUK' AND tanggal >= ? AND tanggal <= ?`,
    [from, to + 'T23:59:59'],
  );
  return {
    omzet: s?.omzet ?? 0,
    transaksi: s?.transaksi ?? 0,
    item_terjual: Math.round((item?.n ?? 0) * 100) / 100,
    laba_kotor: laba?.n ?? 0,
    kas_masuk: kas?.n ?? 0,
    piutang_baru: s?.piutang ?? 0,
  };
}

export interface DailyPoint {
  tanggal: string;
  omzet: number;
  transaksi: number;
}

export function salesByDay(from: string, to: string): DailyPoint[] {
  return all<DailyPoint>(
    `SELECT substr(tanggal,1,10) AS tanggal, COALESCE(SUM(total),0) AS omzet, COUNT(*) AS transaksi
     FROM sales WHERE deleted_at IS NULL AND status != 'BATAL' AND tanggal >= ? AND tanggal <= ?
     GROUP BY substr(tanggal,1,10) ORDER BY tanggal`,
    [from, to + 'T23:59:59'],
  );
}

export interface ProductSales {
  product_id: string;
  nama_produk: string;
  qty: number;
  omzet: number;
  laba: number;
}

export function topProducts(from: string, to: string, limit = 20): ProductSales[] {
  return all<ProductSales>(
    `SELECT si.product_id, p.nama AS nama_produk, SUM(si.qty) AS qty,
            SUM(si.subtotal) AS omzet,
            SUM(si.subtotal - si.hpp_saat_jual * si.qty_dasar) AS laba
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN products p ON p.id = si.product_id
     WHERE s.deleted_at IS NULL AND s.status != 'BATAL' AND s.tanggal >= ? AND s.tanggal <= ?
     GROUP BY si.product_id ORDER BY omzet DESC LIMIT ?`,
    [from, to + 'T23:59:59', limit],
  );
}

export function stockValue(): { total_qty: number; total_nilai: number; item_count: number } {
  const r = get<{ q: number; n: number; c: number }>(
    `SELECT COALESCE(SUM(sb.qty_dasar),0) AS q, COALESCE(SUM(sb.qty_dasar * p.hpp),0) AS n, COUNT(*) AS c
     FROM stock_balances sb JOIN products p ON p.id = sb.product_id WHERE p.deleted_at IS NULL`,
  );
  return { total_qty: r?.q ?? 0, total_nilai: r?.n ?? 0, item_count: r?.c ?? 0 };
}

export function lowStockProducts(): { id: string; nama: string; stok: number; min: number; simbol: string }[] {
  return all(
    `SELECT p.id, p.nama, COALESCE(sb.qty_dasar,0) AS stok, p.stok_min AS min, COALESCE(u.simbol,'') AS simbol
     FROM products p LEFT JOIN stock_balances sb ON sb.product_id = p.id
     LEFT JOIN units u ON u.id = p.base_unit_id
     WHERE p.deleted_at IS NULL AND p.aktif = 1 AND COALESCE(sb.qty_dasar,0) <= p.stok_min
     ORDER BY (COALESCE(sb.qty_dasar,0) - p.stok_min)`,
  );
}

export function cashSummary(from: string, to: string): { masuk: number; keluar: number } {
  const m = get<{ n: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS n FROM cash_transactions WHERE tipe='MASUK' AND tanggal >= ? AND tanggal <= ?`,
    [from, to + 'T23:59:59'],
  );
  const k = get<{ n: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS n FROM cash_transactions WHERE tipe='KELUAR' AND tanggal >= ? AND tanggal <= ?`,
    [from, to + 'T23:59:59'],
  );
  return { masuk: m?.n ?? 0, keluar: k?.n ?? 0 };
}

export function stockMutation(productId: string, limit = 50) {
  return all<{ id: string; tanggal: string; tipe: string; qty_dasar: number; catatan: string; ref_id: string }>(
    'SELECT id, tanggal, tipe, qty_dasar, catatan, ref_id FROM stock_movements WHERE product_id = ? ORDER BY tanggal DESC LIMIT ?',
    [productId, limit],
  );
}

export function rangeFor(period: string): { from: string; to: string } {
  const to = todayIso();
  const d = new Date();
  if (period === 'today') return { from: to, to };
  if (period === 'yesterday') {
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    return { from: y, to: y };
  }
  if (period === '7d') {
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to };
  }
  if (period === '30d') {
    d.setDate(d.getDate() - 29);
    return { from: d.toISOString().slice(0, 10), to };
  }
  d.setDate(1);
  return { from: d.toISOString().slice(0, 10), to };
}
