import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportDbBytes, flushDb, importDbBytes } from './db';

export interface SavedDb {
  name: string;
  size: number;
  modified: string | null;
  active: boolean;
}

const ACTIVE_KEY = 'kokoh_active_db_v1';
const NATIVE_DIR = 'databases';
const WEB_PREFIX = 'kokoh-savedb:';

export function getActiveDbName(): string {
  try {
    return localStorage.getItem(ACTIVE_KEY) || '';
  } catch {
    return '';
  }
}

function setActiveDbName(n: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, n);
  } catch {
    /* ignore */
  }
}

export function sanitizeDbName(raw: string): string {
  let s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  if (!s) s = 'database-' + new Date().toISOString().slice(0, 10);
  return s.endsWith('.db') ? s : s + '.db';
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ================= Web (IndexedDB) storage ================= */

const IDB_NAME = 'kokoh-db';
const IDB_STORE = 'files';

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

async function idbSet(key: string, value: unknown): Promise<void> {
  const d = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const d = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbDel(key: string): Promise<void> {
  const d = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbKeys(): Promise<string[]> {
  const d = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as string[]).filter((k) => k.startsWith(WEB_PREFIX)));
    req.onerror = () => reject(req.error);
  });
}

interface WebSavedFile {
  bytes: Uint8Array;
  modified: string;
}

/* ================= Public API ================= */

export async function listSavedDatabases(): Promise<SavedDb[]> {
  const active = getActiveDbName();
  if (Capacitor.isNativePlatform()) {
    let files: string[] = [];
    try {
      const res = await Filesystem.readdir({ path: NATIVE_DIR, directory: Directory.Documents });
      files = res.files.map((f) => (typeof f === 'string' ? f : f.name)).filter((n) => n.endsWith('.db'));
    } catch {
      return [];
    }
    const out: SavedDb[] = [];
    for (const name of files.sort().reverse()) {
      let size = 0;
      let modified: string | null = null;
      try {
        const st = await Filesystem.stat({ path: `${NATIVE_DIR}/${name}`, directory: Directory.Documents });
        size = st.size ?? 0;
        modified = st.mtime ? new Date(st.mtime).toISOString() : null;
      } catch {
        /* ignore */
      }
      out.push({ name, size, modified, active: name === active });
    }
    return out;
  }
  const keys = await idbKeys();
  const out: SavedDb[] = [];
  for (const key of keys.sort().reverse()) {
    const rec = await idbGet<WebSavedFile>(key);
    const name = key.slice(WEB_PREFIX.length);
    out.push({
      name,
      size: rec?.bytes?.byteLength ?? 0,
      modified: rec?.modified ?? null,
      active: name === active,
    });
  }
  return out;
}

async function writeSavedFile(name: string, bytes: Uint8Array): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: `${NATIVE_DIR}/${name}`,
      data: uint8ToBase64(bytes),
      directory: Directory.Documents,
      recursive: true,
    });
    return;
  }
  await idbSet(WEB_PREFIX + name, { bytes, modified: new Date().toISOString() } satisfies WebSavedFile);
}

async function readSavedFile(name: string): Promise<Uint8Array> {
  if (Capacitor.isNativePlatform()) {
    const res = await Filesystem.readFile({
      path: `${NATIVE_DIR}/${name}`,
      directory: Directory.Documents,
    });
    return base64ToUint8(res.data as string);
  }
  const rec = await idbGet<WebSavedFile>(WEB_PREFIX + name);
  if (!rec) throw new Error('File not found: ' + name);
  return rec.bytes;
}

/** Save the current working database under a chosen name. */
export async function saveDatabaseAs(rawName: string): Promise<string> {
  await flushDb();
  const name = sanitizeDbName(rawName);
  const bytes = await exportDbBytes();
  await writeSavedFile(name, bytes);
  setActiveDbName(name);
  return name;
}

/** Load a saved file into the working database (safety copy first). */
export async function loadDatabaseFile(name: string): Promise<void> {
  const bytes = await readSavedFile(name);
  await flushDb();
  const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  try {
    const current = await exportDbBytes();
    await writeSavedFile(`auto-backup-${now}.db`, current);
  } catch {
    /* safety copy best-effort */
  }
  await importDbBytes(bytes);
  setActiveDbName(name);
}

/** Store an uploaded .db file so it can be loaded later. */
export async function uploadDatabaseFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const base = file.name.replace(/\.db$/i, '');
  const name = sanitizeDbName(base || 'uploaded');
  await writeSavedFile(name, new Uint8Array(buf));
  return name;
}

export async function deleteSavedDatabase(name: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.deleteFile({ path: `${NATIVE_DIR}/${name}`, directory: Directory.Documents });
  } else {
    await idbDel(WEB_PREFIX + name);
  }
  if (getActiveDbName() === name) setActiveDbName('');
}

/**
 * Share a database file via the system share sheet
 * (Telegram, Drive, Files, WhatsApp...) or download on web.
 */
export async function shareDatabaseFile(name: string, dialogTitle: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const uri = await Filesystem.getUri({
      path: `${NATIVE_DIR}/${name}`,
      directory: Directory.Documents,
    });
    await Share.share({ title: name, url: uri.uri, dialogTitle });
    return;
  }
  const bytes = await readSavedFile(name);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
  const file = new File([blob], name, { type: 'application/octet-stream' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch {
    /* fall through to download */
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatBytes(n: number): string {
  if (!n) return '0 KB';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}
