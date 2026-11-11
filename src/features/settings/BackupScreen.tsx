import { useRef, useState } from 'react';
import { backupDatabase, restoreDatabaseFromFile } from '../../lib/backup';
import { getSetting, setSetting } from '../../lib/repo';
import { formatDateTime } from '../../lib/format';
import { toast } from '../../stores/toast';
import { AppBar, ConfirmDialog } from '../../components/ui';
import { IconDownload, IconUpload } from '../../components/icons';
import { flushDb } from '../../lib/db';

export default function BackupScreen() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<File | null>(null);
  const last = getSetting('last_backup', '');

  async function doBackup() {
    setBusy(true);
    try {
      await flushDb();
      await backupDatabase();
      const now = new Date().toISOString();
      setSetting('last_backup', now);
      toast.success('Backup dibuat');
    } catch (e) {
      toast.danger('Gagal backup: ' + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doRestore(file: File) {
    setBusy(true);
    try {
      await restoreDatabaseFromFile(file);
      toast.success('Data berhasil dipulihkan');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.danger('Gagal restore: ' + String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <AppBar title="Backup & Restore" />
      <div className="screen-body">
        <div className="page">
          <div className="card">
            <div className="card-title">Backup Data</div>
            <div className="small muted mb-3">
              Simpan salinan database ke file. Simpan file di tempat aman (Google Drive/WhatsApp diri sendiri).
            </div>
            <button className="btn btn-primary btn-block" onClick={doBackup} disabled={busy}>
              <IconDownload size={18} /> {busy ? 'Memproses…' : 'Buat Backup Sekarang'}
            </button>
            <div className="small faint mt-2">
              Backup terakhir: {last ? formatDateTime(last) : 'Belum pernah'}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Restore Data</div>
            <div className="small muted mb-3">
              Pulihkan dari file backup .db. Data saat ini akan diganti.
            </div>
            <button className="btn btn-block" onClick={() => fileRef.current?.click()} disabled={busy}>
              <IconUpload size={18} /> Pilih File Backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".db,application/octet-stream"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setConfirmRestore(f);
                e.target.value = '';
              }}
            />
          </div>

          <div className="card" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)' }}>
            <div className="semibold" style={{ color: 'var(--warning)' }}>Penting</div>
            <div className="small" style={{ color: 'var(--warning)' }}>
              Lakukan backup rutin. Jika HP hilang/rusak tanpa backup, data tidak bisa dikembalikan.
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmRestore}
        title="Restore data?"
        message="Semua data saat ini akan diganti oleh isi file backup."
        confirmLabel="Restore"
        danger
        onConfirm={() => {
          if (confirmRestore) void doRestore(confirmRestore);
        }}
        onClose={() => setConfirmRestore(null)}
      />
    </div>
  );
}
