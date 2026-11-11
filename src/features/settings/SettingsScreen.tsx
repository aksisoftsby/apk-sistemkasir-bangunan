import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreProfile, getSetting, setSetting } from '../../lib/repo';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { AppBar, ConfirmDialog, Switch } from '../../components/ui';
import {
  IconBox,
  IconDownload,
  IconLogout,
  IconSettings,
  IconTruck,
  IconUsers,
  IconWallet,
} from '../../components/icons';
import { useDbVersion } from '../../lib/db';

function Row({
  icon,
  title,
  subtitle,
  onClick,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="list-row clickable" onClick={onClick}>
      <div className="avatar">{icon}</div>
      <div className="grow">
        <div className="semibold">{title}</div>
        {subtitle ? <div className="small muted">{subtitle}</div> : null}
      </div>
      {right ?? <span style={{ color: 'var(--text-faint)' }}>›</span>}
    </div>
  );
}

export default function SettingsScreen() {
  const ver = useDbVersion();
  const nav = useNavigate();
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const store = getStoreProfile();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [bunyi, setBunyi] = useState(getSetting('bunyi_scan', '1') === '1');
  const [haptic, setHaptic] = useState(getSetting('haptic', '1') === '1');
  const [autoBackup, setAutoBackup] = useState(getSetting('auto_backup', '1') === '1');

  void ver;

  return (
    <div className="screen">
      <AppBar title="Lainnya" subtitle={user?.nama} hideBack />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 140 }}>
          <div className="card" style={{ background: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
            <div className="row">
              <div className="avatar avatar-navy" style={{ background: 'var(--primary)' }}>{(store?.nama ?? 'K').slice(0, 1).toUpperCase()}</div>
              <div className="grow">
                <div className="semibold" style={{ color: '#fff' }}>{store?.nama ?? 'Toko Anda'}</div>
                <div className="small" style={{ color: '#94a3b8' }}>{store?.alamat || 'Alamat belum diisi'}</div>
              </div>
              <button className="text-btn" style={{ color: 'var(--primary-light)' }} onClick={() => nav('/settings/store')}>
                Ubah
              </button>
            </div>
          </div>

          <div className="list mt-4">
            <Row icon={<IconSettings size={20} />} title="Profil Toko" subtitle="Nama, alamat, nota, pajak" onClick={() => nav('/settings/store')} />
            <Row icon={<IconUsers size={20} />} title="Pengguna & PIN" subtitle="Pemilik, admin, kasir" onClick={() => nav('/settings/users')} />
            <Row icon={<IconDownload size={20} />} title="Backup & Restore" subtitle="Simpan cadangan data" onClick={() => nav('/settings/backup')} />
            <Row icon={<IconWallet size={20} />} title="Kas & Shift" subtitle="Buka/tutup kasir" onClick={() => nav('/shift')} />
          </div>

          <div className="list mt-3">
            <Row icon={<IconBox size={20} />} title="Pembelian" subtitle="Barang masuk & hutang supplier" onClick={() => nav('/purchase')} />
            <Row icon={<IconTruck size={20} />} title="Surat Jalan" subtitle="Status pengiriman" onClick={() => nav('/pos/delivery')} />
          </div>

          <div className="list mt-3">
            <Row
              icon={<span style={{ fontSize: 18 }}>🔔</span>}
              title="Bunyi saat scan"
              right={<Switch on={bunyi} onChange={(v) => { setBunyi(v); setSetting('bunyi_scan', v ? '1' : '0'); }} />}
            />
            <Row
              icon={<span style={{ fontSize: 18 }}>📳</span>}
              title="Getar (haptic)"
              right={<Switch on={haptic} onChange={(v) => { setHaptic(v); setSetting('haptic', v ? '1' : '0'); }} />}
            />
            <Row
              icon={<span style={{ fontSize: 18 }}>💾</span>}
              title="Backup otomatis"
              subtitle="Ingatkan backup harian"
              right={<Switch on={autoBackup} onChange={(v) => { setAutoBackup(v); setSetting('auto_backup', v ? '1' : '0'); }} />}
            />
          </div>

          <div className="list mt-3">
            <Row icon={<span style={{ fontSize: 18 }}>ℹ️</span>} title="Tentang Kokoh" subtitle="Versi 1.0.0" onClick={() => setAboutOpen(true)} />
            <Row
              icon={<IconLogout size={20} />}
              title="Keluar"
              onClick={() => setLogoutOpen(true)}
            />
          </div>

          <div className="small muted center-text mt-4">Kokoh · Kasir Toko Bangunan · v1.0.0</div>
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Keluar dari aplikasi?"
        message="Anda perlu memasukkan PIN lagi untuk masuk."
        confirmLabel="Keluar"
        onConfirm={() => {
          logout();
          toast.success('Berhasil keluar');
          nav('/login', { replace: true });
        }}
        onClose={() => setLogoutOpen(false)}
      />

      <ConfirmDialog
        open={aboutOpen}
        title="Tentang Kokoh"
        message="Kokoh adalah aplikasi kasir offline untuk toko bangunan. Data tersimpan lokal di perangkat. Versi 1.0.0."
        confirmLabel="Tutup"
        onConfirm={() => setAboutOpen(false)}
        onClose={() => setAboutOpen(false)}
      />
    </div>
  );
}
