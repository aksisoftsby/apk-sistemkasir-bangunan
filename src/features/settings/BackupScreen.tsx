import { useRef, useState } from 'react';
import { backupDatabase, restoreDatabaseFromFile } from '../../lib/backup';
import { getSetting, setSetting } from '../../lib/repo';
import { formatDateTime } from '../../lib/format';
import { t, useLang } from '../../lib/locale';
import { toast } from '../../stores/toast';
import { AppBar, ConfirmDialog } from '../../components/ui';
import { IconDownload, IconUpload } from '../../components/icons';
import { flushDb } from '../../lib/db';

export default function BackupScreen() {
  useLang();
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
      toast.success(t('bk.made'));
    } catch (e) {
      toast.danger(t('bk.failBk') + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doRestore(file: File) {
    setBusy(true);
    try {
      await restoreDatabaseFromFile(file);
      toast.success(t('bk.done'));
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.danger(t('bk.failRs') + String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <AppBar title={t('bk.title')} />
      <div className="screen-body">
        <div className="page">
          <div className="card">
            <div className="card-title">{t('bk.dataTitle')}</div>
            <div className="small muted mb-3">
              {t('bk.dataSub')}
            </div>
            <button className="btn btn-primary btn-block" onClick={doBackup} disabled={busy}>
              <IconDownload size={18} /> {busy ? t('bk.working') : t('bk.make')}
            </button>
            <div className="small faint mt-2">
              {t('bk.last', { v: last ? formatDateTime(last) : t('bk.never') })}
            </div>
          </div>

          <div className="card">
            <div className="card-title">{t('bk.restoreTitle')}</div>
            <div className="small muted mb-3">
              {t('bk.restoreSub')}
            </div>
            <button className="btn btn-block" onClick={() => fileRef.current?.click()} disabled={busy}>
              <IconUpload size={18} /> {t('bk.pick')}
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
            <div className="semibold" style={{ color: 'var(--warning)' }}>{t('bk.warnTitle')}</div>
            <div className="small" style={{ color: 'var(--warning)' }}>
              {t('bk.warn')}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmRestore}
        title={t('bk.confirmTitle')}
        message={t('bk.confirmMsg')}
        confirmLabel={t('bk.confirmBtn')}
        danger
        onConfirm={() => {
          if (confirmRestore) void doRestore(confirmRestore);
        }}
        onClose={() => setConfirmRestore(null)}
      />
    </div>
  );
}
