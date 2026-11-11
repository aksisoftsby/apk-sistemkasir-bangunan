import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreProfile, listUsers, saveStoreProfile, saveUser } from '../../lib/repo';
import { hashPin } from '../../lib/id';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { Field } from '../../components/ui';

export default function SetupScreen() {
  const nav = useNavigate();
  const setUser = useSession((s) => s.setUser);
  const existing = getStoreProfile();
  const [namaToko, setNamaToko] = useState(existing?.nama ?? '');
  const [alamat, setAlamat] = useState(existing?.alamat ?? '');
  const [telp, setTelp] = useState(existing?.telp ?? '');
  const [namaPemilik, setNamaPemilik] = useState('Pemilik Toko');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');

  function submit() {
    if (!namaToko.trim()) {
      toast.danger('Nama toko wajib diisi');
      return;
    }
    if (pin.length < 4) {
      toast.danger('PIN minimal 4 digit');
      return;
    }
    if (pin !== pin2) {
      toast.danger('Konfirmasi PIN tidak sama');
      return;
    }
    saveStoreProfile({
      id: existing?.id,
      nama: namaToko.trim(),
      alamat: alamat.trim(),
      telp: telp.trim(),
      footer_nota: existing?.footer_nota ?? 'Terima kasih atas kunjungan Anda',
      ppn_persen: existing?.ppn_persen ?? 0,
      pembulatan: existing?.pembulatan ?? 0,
    });
    const users = listUsers();
    if (users.length === 0) {
      const id = saveUser({ nama: namaPemilik.trim() || 'Pemilik Toko', pin, role: 'OWNER' }, hashPin);
      setUser({ id, nama: namaPemilik.trim() || 'Pemilik Toko', role: 'OWNER' });
    } else {
      setUser({ id: users[0].id, nama: users[0].nama, role: users[0].role as 'OWNER' });
    }
    toast.success('Toko berhasil disiapkan');
    nav('/pos', { replace: true });
  }

  return (
    <div className="screen">
      <div className="page" style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <div className="center-text" style={{ padding: '24px 0 8px' }}>
          <img src="./assets/logo.webp" alt="Kokoh" style={{ width: 88, height: 88, borderRadius: 20, margin: '0 auto' }} />
          <div className="h1 mt-3">Selamat datang di Kokoh</div>
          <div className="muted mt-1">Siapkan toko Anda untuk mulai berjualan</div>
        </div>

        <div className="card mt-4">
          <div className="card-title">Data Toko</div>
          <div className="col">
            <Field label="Nama Toko *">
              <input className="input" value={namaToko} onChange={(e) => setNamaToko(e.target.value)} placeholder="Contoh: Toko Bangunan Makmur" />
            </Field>
            <Field label="Alamat">
              <input className="input" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Jl. Raya ..." />
            </Field>
            <Field label="No. Telepon / WA">
              <input className="input" value={telp} onChange={(e) => setTelp(e.target.value)} placeholder="0812..." inputMode="tel" />
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Akun Pemilik</div>
          <div className="col">
            <Field label="Nama Pemilik">
              <input className="input" value={namaPemilik} onChange={(e) => setNamaPemilik(e.target.value)} />
            </Field>
            <Field label="PIN (4-6 digit) *">
              <input className="input" type="number" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.slice(0, 6))} placeholder="••••" />
            </Field>
            <Field label="Ulangi PIN *">
              <input className="input" type="number" inputMode="numeric" value={pin2} onChange={(e) => setPin2(e.target.value.slice(0, 6))} placeholder="••••" />
            </Field>
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block mt-4" onClick={submit}>
          Mulai Gunakan Kokoh
        </button>
        <div className="small muted center-text mt-3">
          Data disimpan lokal di perangkat Anda. Lakukan backup rutin.
        </div>
      </div>
    </div>
  );
}
