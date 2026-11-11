import { useState } from 'react';
import { useDbVersion } from '../../lib/db';
import { deleteUser, listUsers, saveUser } from '../../lib/repo';
import { hashPin } from '../../lib/id';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, ConfirmDialog, Field } from '../../components/ui';
import { IconPlus, IconTrash } from '../../components/icons';

export default function UsersScreen() {
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
      toast.danger('Nama wajib diisi');
      return;
    }
    if (!editId && pin.length < 4) {
      toast.danger('PIN minimal 4 digit');
      return;
    }
    if (editId && pin && pin.length < 4) {
      toast.danger('PIN minimal 4 digit');
      return;
    }
    saveUser({ id: editId ?? undefined, nama: nama.trim(), pin, role }, hashPin);
    toast.success('Pengguna disimpan');
    setOpen(false);
  }

  return (
    <div className="screen">
      <AppBar
        title="Pengguna & PIN"
        subtitle={`${users.length} pengguna`}
        right={<button className="btn btn-icon btn-ghost" style={{ color: '#fff' }} onClick={openNew} aria-label="Tambah"><IconPlus size={22} /></button>}
      />
      <div className="screen-body">
        <div className="page">
          <div className="list">
            {users.map((u) => (
              <div key={u.id} className="list-row">
                <div className="avatar">{u.nama.slice(0, 1).toUpperCase()}</div>
                <div className="grow clickable" onClick={() => openEdit(u.id)}>
                  <div className="semibold">{u.nama}</div>
                  <div className="small muted">{u.role}</div>
                </div>
                {u.role !== 'OWNER' ? (
                  <button className="btn btn-icon btn-ghost text-btn-danger" onClick={() => setHapus(u.id)} aria-label="Hapus">
                    <IconTrash size={18} />
                  </button>
                ) : (
                  <span className="badge badge-primary">Pemilik</span>
                )}
              </div>
            ))}
          </div>
          <div className="small muted mt-3">
            Kasir bisa melakukan transaksi. Admin bisa mengelola produk & stok. Pemilik akses penuh.
          </div>
        </div>
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Ubah Pengguna' : 'Pengguna Baru'}
        footer={<button className="btn btn-primary btn-lg btn-block" onClick={simpan}>Simpan</button>}
      >
        <div className="col">
          <Field label="Nama *"><input className="input" value={nama} onChange={(e) => setNama(e.target.value)} /></Field>
          <Field label="Peran">
            <div className="select-wrap">
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="KASIR">Kasir</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Pemilik</option>
              </select>
            </div>
          </Field>
          <Field label={editId ? 'PIN Baru (kosongkan bila tidak diubah)' : 'PIN (4-6 digit) *'}>
            <input className="input" type="number" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.slice(0, 6))} placeholder="••••" />
          </Field>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={!!hapus}
        title="Hapus pengguna?"
        message="Pengguna tidak akan bisa login lagi. Riwayat tetap tersimpan."
        confirmLabel="Hapus"
        danger
        onConfirm={() => {
          if (hapus) {
            deleteUser(hapus);
            toast.success('Pengguna dihapus');
          }
        }}
        onClose={() => setHapus(null)}
      />
    </div>
  );
}
