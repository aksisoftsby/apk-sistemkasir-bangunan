import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreProfile, listUsers, saveStoreProfile, saveUser } from '../../lib/repo';
import { hashPin } from '../../lib/id';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { Field } from '../../components/ui';
import { t, useLang } from '../../lib/locale';

export default function SetupScreen() {
  useLang();
  const nav = useNavigate();
  const setUser = useSession((s) => s.setUser);
  const existing = getStoreProfile();
  const [namaToko, setNamaToko] = useState(existing?.nama ?? '');
  const [alamat, setAlamat] = useState(existing?.alamat ?? '');
  const [telp, setTelp] = useState(existing?.telp ?? '');
  const [namaPemilik, setNamaPemilik] = useState(t('auth.ownerDefault'));
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');

  function submit() {
    if (!namaToko.trim()) {
      toast.danger(t('auth.storeRequired'));
      return;
    }
    if (pin.length < 4) {
      toast.danger(t('auth.pinMin'));
      return;
    }
    if (pin !== pin2) {
      toast.danger(t('auth.pinMismatch'));
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
      const nm = namaPemilik.trim() || t('auth.ownerDefault');
      const id = saveUser({ nama: nm, pin, role: 'OWNER' }, hashPin);
      setUser({ id, nama: nm, role: 'OWNER' });
    } else {
      setUser({ id: users[0].id, nama: users[0].nama, role: users[0].role as 'OWNER' });
    }
    toast.success(t('auth.storeReady'));
    nav('/pos', { replace: true });
  }

  return (
    <div className="screen">
      <div className="page" style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <div className="center-text" style={{ padding: '24px 0 8px' }}>
          <img src="./assets/logo.webp" alt="Kokoh" style={{ width: 88, height: 88, borderRadius: 20, margin: '0 auto' }} />
          <div className="h1 mt-3">{t('auth.welcome')}</div>
          <div className="muted mt-1">{t('auth.setupSub')}</div>
        </div>

        <div className="card mt-4">
          <div className="card-title">{t('auth.storeData')}</div>
          <div className="col">
            <Field label={t('auth.storeName')}>
              <input className="input" value={namaToko} onChange={(e) => setNamaToko(e.target.value)} placeholder={t('auth.storeNamePh')} />
            </Field>
            <Field label={t('common.address')}>
              <input className="input" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder={t('auth.addressPh')} />
            </Field>
            <Field label={t('common.phone')}>
              <input className="input" value={telp} onChange={(e) => setTelp(e.target.value)} placeholder={t('auth.phonePh')} inputMode="tel" />
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="card-title">{t('auth.ownerAccount')}</div>
          <div className="col">
            <Field label={t('auth.ownerName')}>
              <input className="input" value={namaPemilik} onChange={(e) => setNamaPemilik(e.target.value)} />
            </Field>
            <Field label={t('auth.pin')}>
              <input className="input" type="number" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.slice(0, 6))} placeholder="••••" />
            </Field>
            <Field label={t('auth.pin2')}>
              <input className="input" type="number" inputMode="numeric" value={pin2} onChange={(e) => setPin2(e.target.value.slice(0, 6))} placeholder="••••" />
            </Field>
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block mt-4" onClick={submit}>
          {t('auth.start')}
        </button>
        <div className="small muted center-text mt-3">
          {t('auth.savedLocal')}
        </div>
      </div>
    </div>
  );
}
