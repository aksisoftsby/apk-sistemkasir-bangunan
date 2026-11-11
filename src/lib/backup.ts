import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportDbBytes, importDbBytes } from './db';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function backupDatabase(): Promise<string> {
  const bytes = await exportDbBytes();
  const name = `kokoh-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.db`;
  if (Capacitor.isNativePlatform()) {
    const path = 'backup/' + name;
    await Filesystem.writeFile({
      path,
      data: bytesToBase64(bytes),
      directory: Directory.Documents,
      recursive: true,
    });
    const uri = await Filesystem.getUri({ path, directory: Directory.Documents });
    try {
      await Share.share({
        title: name,
        url: uri.uri,
        dialogTitle: 'Simpan / bagikan backup',
      });
    } catch {
      /* user cancelled share */
    }
    return uri.uri;
  }
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return name;
}

export async function restoreDatabaseFromFile(file: File): Promise<void> {
  const buf = await file.arrayBuffer();
  await importDbBytes(new Uint8Array(buf));
}

export async function readBackupFromBase64(b64: string): Promise<void> {
  await importDbBytes(base64ToBytes(b64));
}
