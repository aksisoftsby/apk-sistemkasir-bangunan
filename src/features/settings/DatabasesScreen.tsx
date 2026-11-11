import { useEffect, useRef, useState } from 'react';
import { useDbVersion } from '../../lib/db';
import {
  deleteSavedDatabase,
  formatBytes,
  listSavedDatabases,
  loadDatabaseFile,
  saveDatabaseAs,
  shareDatabaseFile,
  uploadDatabaseFile,
  type SavedDb,
} from '../../lib/databases';
import { formatDateTime } from '../../lib/format';
import { getLang, setLang, t, useLang } from '../../lib/locale';
import { toast } from '../../stores/toast';
import { AppBar, ConfirmDialog, EmptyState } from '../../components/ui';
import { IconDownload, IconTrash, IconUpload } from '../../components/icons';

export default function DatabasesScreen() {
  useLang();
  const ver = useDbVersion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<SavedDb[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadTarget, setLoadTarget] = useState<string | null>(null);
  const [delTarget, setDelTarget] = useState<string | null>(null);

  async function refresh() {
    try {
      setRows(await listSavedDatabases());
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    void refresh();
  }, [ver]);

  async function doSave() {
    if (!name.trim()) {
      toast.danger(t('db.namePh'));
      return;
    }
    setBusy(true);
    try {
      const saved = await saveDatabaseAs(name.trim());
      setName('');
      await refresh();
      toast.success(t('db.savedAs', { name: saved }));
    } catch (e) {
      toast.danger(t('db.fail') + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doLoad(n: string) {
    setBusy(true);
    try {
      await loadDatabaseFile(n);
      toast.success(t('db.loaded', { name: n }));
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.danger(t('db.fail') + String(e));
    } finally {
      setBusy(false);
      setLoadTarget(null);
    }
  }

  async function doUpload(file: File) {
    setBusy(true);
    try {
      const saved = await uploadDatabaseFile(file);
      await refresh();
      toast.success(t('db.uploaded', { name: saved }));
    } catch (e) {
      toast.danger(t('db.fail') + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(n: string) {
    setBusy(true);
    try {
      await deleteSavedDatabase(n);
      await refresh();
      toast.success(t('db.deleted', { name: n }));
    } catch (e) {
      toast.danger(t('db.fail') + String(e));
    } finally {
      setBusy(false);
      setDelTarget(null);
    }
  }

  async function doShare(n: string) {
    try {
      await shareDatabaseFile(n, t('db.shareTitle'));
      toast.success(t('db.shared'));
    } catch {
      /* user cancelled */
    }
  }

  const lang = getLang();

  return (
    <div className="screen">
      <AppBar title={t('db.title')} subtitle={t('db.sub')} />
      <div className="screen-body">
        <div className="page">
          <div className="card">
            <div className="card-title">{t('db.saveTitle')}</div>
            <div className="small muted mb-3">{t('db.saveSub')}</div>
            <div className="field">
              <label>{t('db.saveTitle')}</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('db.namePh')}
              />
            </div>
            <button className="btn btn-primary btn-block mt-3" onClick={doSave} disabled={busy}>
              <IconDownload size={18} /> {busy ? t('bk.working') : t('db.saveBtn')}
            </button>
          </div>

          <div className="card">
            <div className="card-title">{t('db.listTitle')}</div>
            <div className="small muted mb-3">{t('db.listSub')}</div>
            {rows.length === 0 ? (
              <EmptyState title={t('db.empty')} message={t('db.emptySub')} />
            ) : (
              <div className="list">
                {rows.map((r) => (
                  <div key={r.name} className="list-row">
                    <div className="grow">
                      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                        <span className="semibold truncate">{r.name}</span>
                        {r.active ? <span className="badge badge-success">{t('db.active')}</span> : null}
                      </div>
                      <div className="small muted">
                        {formatBytes(r.size)}
                        {r.modified ? ' · ' + formatDateTime(r.modified) : ''}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => setLoadTarget(r.name)}>
                        {t('db.load')}
                      </button>
                      <button className="btn btn-sm" disabled={busy} onClick={() => void doShare(r.name)}>
                        {t('db.share')}
                      </button>
                      <button
                        className="btn btn-icon btn-ghost text-btn-danger"
                        disabled={busy}
                        onClick={() => setDelTarget(r.name)}
                        aria-label={t('db.delete')}
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">{t('db.uploadTitle')}</div>
            <div className="small muted mb-3">{t('db.uploadSub')}</div>
            <button className="btn btn-block" onClick={() => fileRef.current?.click()} disabled={busy}>
              <IconUpload size={18} /> {t('db.uploadBtn')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".db,application/octet-stream"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void doUpload(f);
                e.target.value = '';
              }}
            />
          </div>

          <div className="card">
            <div className="card-title">{t('set.language')}</div>
            <div className="small muted mb-3">{t('set.languageSub')}</div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className={'chip grow' + (lang === 'en' ? ' active' : '')}
                style={{ justifyContent: 'center' }}
                onClick={() => setLang('en')}
              >
                English
              </button>
              <button
                className={'chip grow' + (lang === 'id' ? ' active' : '')}
                style={{ justifyContent: 'center' }}
                onClick={() => setLang('id')}
              >
                Bahasa Indonesia
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!loadTarget}
        title={t('db.loadTitle')}
        message={loadTarget ? t('db.loadMsg', { name: loadTarget }) : ''}
        confirmLabel={t('db.load')}
        onConfirm={() => {
          if (loadTarget) void doLoad(loadTarget);
        }}
        onClose={() => setLoadTarget(null)}
      />
      <ConfirmDialog
        open={!!delTarget}
        title={t('db.deleteTitle')}
        message={delTarget ? t('db.deleteMsg', { name: delTarget }) : ''}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() => {
          if (delTarget) void doDelete(delTarget);
        }}
        onClose={() => setDelTarget(null)}
      />
    </div>
  );
}
