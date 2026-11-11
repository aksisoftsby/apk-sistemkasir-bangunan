import { useEffect, useSyncExternalStore } from 'react';
import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';
import {
  DEFAULT_SETTINGS,
  SEED_CATEGORIES,
  SEED_CUSTOMERS,
  SEED_PRICE_TIERS,
  SEED_PRODUCTS,
  SEED_SUPPLIERS,
  SEED_UNITS,
  seedOwner,
} from './seed';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let version = 0;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();
function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function getVersion(): number {
  return version;
}
export function useDbVersion(): number {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}
export function notifyChange(): void {
  version += 1;
  listeners.forEach((fn) => fn());
  scheduleSave();
}

/* =============== Persistence =============== */

const DB_PATH = 'kokoh.db';
const IDB_NAME = 'kokoh-db';
const IDB_STORE = 'files';

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<Uint8Array | null> {
  const d = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve((req.result as Uint8Array) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: Uint8Array): Promise<void> {
  const d = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadBytes(): Promise<Uint8Array | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await Filesystem.readFile({
        path: DB_PATH,
        directory: Directory.Data,
      });
      return base64ToUint8(res.data as string);
    } catch {
      return null;
    }
  }
  return idbGet(DB_PATH);
}

async function saveBytes(bytes: Uint8Array): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: DB_PATH,
      data: uint8ToBase64(bytes),
      directory: Directory.Data,
      recursive: true,
    });
    return;
  }
  await idbSet(DB_PATH, bytes);
}

let saving = false;
let saveAgain = false;

async function persist(): Promise<void> {
  if (!db || saving) {
    saveAgain = true;
    return;
  }
  saving = true;
  try {
    const data = db.export();
    await saveBytes(data);
  } catch (e) {
    console.error('Gagal menyimpan database', e);
  } finally {
    saving = false;
    if (saveAgain) {
      saveAgain = false;
      void persist();
    }
  }
}

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void persist();
  }, 600);
}

/** Force immediate save (dipakai saat app pause / tutup shift / backup). */
export async function flushDb(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await persist();
}

export async function exportDbBytes(): Promise<Uint8Array> {
  if (!db) throw new Error('Database belum siap');
  return db.export();
}

export async function importDbBytes(bytes: Uint8Array): Promise<void> {
  if (db) {
    db.close();
  }
  db = new SQL!.Database(bytes);
  await persist();
  notifyChange();
}

/* =============== Init =============== */

export async function initDb(): Promise<void> {
  if (db) return;
  SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  const bytes = await loadBytes();
  db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  db.run(SCHEMA_SQL);
  const meta = get<{ value: string }>('SELECT value FROM schema_meta WHERE key = ?', ['version']);
  const current = meta ? parseInt(meta.value, 10) : 0;
  if (!meta) {
    run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', ['version', String(SCHEMA_VERSION)]);
  }
  if (current === 0) {
    await seedDb();
  }
  notifyChange();
}

async function seedDb(): Promise<void> {
  if (!db) return;
  db.run('BEGIN');
  try {
    for (const u of SEED_UNITS) {
      run(
        'INSERT OR IGNORE INTO units (id, nama, simbol, allow_decimal, decimal_places) VALUES (?, ?, ?, ?, ?)',
        [u.id, u.nama, u.simbol, u.allow_decimal, u.decimal_places],
      );
    }
    for (const c of SEED_CATEGORIES) {
      run('INSERT OR IGNORE INTO categories (id, nama, warna) VALUES (?, ?, ?)', [
        c.id,
        c.nama,
        c.warna,
      ]);
    }
    for (const t of SEED_PRICE_TIERS) {
      run('INSERT OR IGNORE INTO price_tiers (id, nama, urutan) VALUES (?, ?, ?)', [
        t.id,
        t.nama,
        t.urutan,
      ]);
    }
    const owner = seedOwner();
    run(
      'INSERT OR IGNORE INTO users (id, nama, pin_hash, role, aktif) VALUES (?, ?, ?, ?, ?)',
      [owner.id, owner.nama, owner.pin_hash, owner.role, owner.aktif],
    );
    for (const c of SEED_CUSTOMERS) {
      run(
        'INSERT OR IGNORE INTO customers (id, kode, nama, telp, alamat, proyek, price_tier_id, limit_kredit, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          c.id,
          c.kode,
          c.nama,
          c.telp,
          c.alamat,
          c.proyek,
          c.price_tier_id,
          c.limit_kredit,
          c.catatan,
        ],
      );
    }
    for (const s of SEED_SUPPLIERS) {
      run('INSERT OR IGNORE INTO suppliers (id, nama, telp, alamat) VALUES (?, ?, ?, ?)', [
        s.id,
        s.nama,
        s.telp,
        s.alamat,
      ]);
    }
    for (const p of SEED_PRODUCTS) {
      const hppDasar = p.hpp;
      run(
        'INSERT OR IGNORE INTO products (id, sku, barcode, nama, category_id, base_unit_id, hpp, stok_min, favorit, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [p.id, p.sku, p.barcode, p.nama, p.category_id, p.base_unit_id, hppDasar, p.stok_min, p.favorit],
      );
      const stokAwal = Math.max(0, p.stok_min) * 4;
      run('INSERT OR IGNORE INTO stock_balances (product_id, qty_dasar) VALUES (?, ?)', [
        p.id,
        stokAwal,
      ]);
      if (stokAwal > 0) {
        run(
          `INSERT INTO stock_movements (id, product_id, tipe, qty_dasar, hpp_unit, ref_type, ref_id, tanggal, user_id, catatan)
           VALUES (?, ?, 'STOK_AWAL', ?, ?, 'PRODUCT', ?, ?, '', 'Stok awal')`,
          ['sm-' + p.id, p.id, stokAwal, hppDasar, p.id, new Date().toISOString()],
        );
      }
      p.units.forEach((u, idx) => {
        run(
          'INSERT OR IGNORE INTO product_units (id, product_id, unit_id, konversi, is_default_jual, is_default_beli, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            `${p.id}-${u.unit_id}`,
            p.id,
            u.unit_id,
            u.konversi,
            u.is_default_jual ?? 0,
            u.is_default_beli ?? 0,
            idx,
          ],
        );
        const puId = `${p.id}-${u.unit_id}`;
        for (const pr of p.prices.filter((x) => x.unit_id === u.unit_id)) {
          run(
            'INSERT OR IGNORE INTO product_prices (id, product_id, product_unit_id, price_tier_id, harga, min_qty) VALUES (?, ?, ?, ?, ?, 0)',
            [pr.tier_id === 't-eceran' ? `${puId}-ecer` : `${puId}-${pr.tier_id}`, p.id, puId, pr.tier_id, pr.harga],
          );
        }
      });
    }
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
  await persist();
}

/* =============== Query helpers =============== */

export function all<T>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error('Database belum diinisialisasi');
  const stmt = db.prepare(sql);
  const rows: T[] = [];
  try {
    stmt.bind(params as never[]);
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
  } finally {
    stmt.free();
  }
  return rows;
}

export function get<T>(sql: string, params: unknown[] = []): T | null {
  const rows = all<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: unknown[] = []): number {
  if (!db) throw new Error('Database belum diinisialisasi');
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params as never[]);
    stmt.step();
    return db.getRowsModified();
  } finally {
    stmt.free();
  }
}

export function exec(sql: string): void {
  if (!db) throw new Error('Database belum diinisialisasi');
  db.run(sql);
}

export function begin(): void {
  exec('BEGIN');
}
export function commit(): void {
  exec('COMMIT');
  notifyChange();
}
export function rollback(): void {
  exec('ROLLBACK');
}

export function isReady(): boolean {
  return db !== null;
}

export async function resetDb(): Promise<void> {
  if (!db || !SQL) return;
  db.close();
  db = new SQL.Database();
  db.run(SCHEMA_SQL);
  run('INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)', [
    'version',
    String(SCHEMA_VERSION),
  ]);
  await seedDb();
  notifyChange();
}

/* =============== Lifecycle =============== */

export function useAutoSaveOnHide(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // Simpan paksa saat app masuk background
    const handler = () => {
      void flushDb();
    };
    window.addEventListener('pagehide', handler);
    return () => window.removeEventListener('pagehide', handler);
  }, []);
}
