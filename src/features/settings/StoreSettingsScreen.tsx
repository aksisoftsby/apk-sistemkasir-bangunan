import { useState } from 'react';
import { getStoreProfile, saveStoreProfile } from '../../lib/repo';
import { toast } from '../../stores/toast';
import { AppBar, Field } from '../../components/ui';

export default function StoreSettingsScreen() {
  const store = getStoreProfile();
  const [nama, setNama] = useState(store?.nama ?? '');
  const [alamat, setAlamat] = useState(store?.alamat ?? '');
  const [telp, setTelp] = useState(store?.telp ?? '');
  const [footer, setFooter] = useState(store?.footer_nota ?? 'Terima kasih atas kunjungan Anda');
  const [ppn, setPpn] = useState(store?.ppn_persen ?? 0);
  const [pembulatan, setPembulatan] = useState(store?.pembulatan ?? 0);

  function simpan() {
    if (!nama.trim()) {
      toast.danger('Nama toko wajib diisi');
      return;
    }
    saveStoreProfile({
      id: store?.id,
      nama: nama.trim(),
      alamat: alamat.trim(),
      telp: telp.trim(),
      footer_nota: footer.trim(),
      ppn_persen: ppn,
      pembulatan,
    });
    toast.success('Profil toko disimpan');
  }

  return (
    <div className="screen">
      <AppBar title="Profil Toko" />
      <div className="screen-body">
        <div className="page">
          <div className="card">
            <div className="col">
              <Field label="Nama Toko *"><input className="input" value={nama} onChange={(e) => setNama(e.target.value)} /></Field>
              <Field label="Alamat"><input className="input" value={alamat} onChange={(e) => setAlamat(e.target.value)} /></Field>
              <Field label="Telepon / WA"><input className="input" value={telp} onChange={(e) => setTelp(e.target.value)} inputMode="tel" /></Field>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Nota & Pajak</div>
            <div className="col">
              <Field label="Footer Nota"><textarea className="textarea" value={footer} onChange={(e) => setFooter(e.target.value)} /></Field>
              <Field label="PPN (%)">
                <input className="input num" inputMode="numeric" value={ppn} onChange={(e) => setPpn(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))} />
              </Field>
              <Field label="Pembulatan (Rp)">
                <div className="row wrap" style={{ gap: 8 }}>
                  {[0, 100, 500, 1000].map((n) => (
                    <button key={n} className={'chip' + (pembulatan === n ? ' active' : '')} onClick={() => setPembulatan(n)}>
                      {n === 0 ? 'Tanpa' : n.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-block mt-4" onClick={simpan}>Simpan</button>
        </div>
      </div>
    </div>
  );
}
