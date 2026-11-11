import { useState } from 'react';
import { useDbVersion } from '../../lib/db';
import { deleteUser, listUsers, saveUser } from '../../lib/repo';
import { hashPin } from '../../lib/id';
import { t, useLang } from '../../lib/locale';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, ConfirmDialog, Field } from '../../components/ui';
import { IconPlus, IconTrash } from '../../components/icons';

function roleLabel(role: string): string {
  if (role === 'OWNER') return t('us.ownerRole');
  if (role === 'ADMIN') return t('us.admin');
  return t('us.cashier');
}

export default function UsersScreen() {
  useLang();
  const ver = useDbVersion();
  const users = listUsers();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [role, setRole] = useState('KASIR');
  const [pin, setPin] = useState('');
  const [hapus, setHapus] = useState<string | null>(null);

  void ver;

  function openNew() {
    setEditId(null);
    setNama('');
    setRole('KASIR');
    setPin('');
    setOpen(true);
  }

  function openEdit(id: string) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setEditId(id);
    setNama(u.nama);
    setRole(u.role);
    setPin('');
    setOpen(true);
  }

  function simpan() {
    if (!nama.trim()) {
      toast.danger(t('us.nameReq'));
      return;
    }
    if (!editId && pin.length < 4) {
      toast.danger(t('us.pinMin'));
      return;
    }
    if (editId && pin && pin.length < 4) {
      toast.danger(t('us.pinMin'));
      return;
    }
    saveUser({ id: editId ?? undefined, nama: nama.trim(), pin, role }, hashPin);
    toast.success(t('us.saved'));
    setOpen(false);
  }

  return (
    <div className="screen">
      <AppBar
        title={t('us.title')}
        subtitle={t('us.count', { n: users.length })}
        right={<button className="btn btn-icon btn-ghost" style={{ color: '#fff' }} onClick={openNew} aria-label={t('common.add')}><IconPlus size={22} /></button>}
      />
      <div className="screen-body">
        <div className="page">
          <div className="list">
            {users.map((u) => (
              <div key={u.id} className="list-row">
                <div className="avatar">{u.nama.slice(0, 1).toUpperCase()}</div>
                <div className="grow clickable" onClick={() => openEdit(u.id)}>
                  <div className="semibold">{u.nama}</div>
                  <div className="small muted">{roleLabel(u.role)}</div>
                </div>
                {u.role !== 'OWNER' ? (
                  <button className="btn btn-icon btn-ghost text-btn-danger" onClick={() => setHapus(u.id)} aria-label={t('common.delete')}>
                    <IconTrash size={18} />
                  </button>
                ) : (
                  <span className="badge badge-primary">{t('us.owner')}</span>
                )}
              </div>
            ))}
          </div>
          <div className="small muted mt-3">
            {t('us.hint')}
          </div>
        </div>
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? t('us.edit') : t('us.new')}
        footer={<button className="btn btn-primary btn-lg btn-block" onClick={simpan}>{t('common.save')}</button>}
      >
        <div className="col">
          <Field label={t('us.name')}><input className="input" value={nama} onChange={(e) => setNama(e.target.value)} /></Field>
          <Field label={t('us.role')}>
            <div className="select-wrap">
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="KASIR">{t('us.cashier')}</option>
                <option value="ADMIN">{t('us.admin')}</option>
                <option value="OWNER">{t('us.ownerRole')}</option>
              </select>
            </div>
          </Field>
          <Field label={editId ? t('us.pinNew') : t('us.pinLabel')}>
            <input className="input" type="number" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.slice(0, 6))} placeholder="••••" />
          </Field>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={!!hapus}
        title={t('us.deleteTitle')}
        message={t('us.deleteMsg')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() => {
          if (hapus) {
            deleteUser(hapus);
            toast.success(t('us.deleted'));
          }
        }}
        onClose={() => setHapus(null)}
      />
    </div>
  );
}
