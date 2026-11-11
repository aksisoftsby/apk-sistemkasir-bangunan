import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreProfile, getSetting, setSetting } from '../../lib/repo';
import { getLang, setLang, t, useLang } from '../../lib/locale';
import { APP_VERSION } from '../../lib/appversion';
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
  useLang();
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

  const lang = getLang();

  return (
    <div className="screen">
      <AppBar title={t('set.title')} subtitle={user?.nama} hideBack />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 140 }}>
          <div className="card" style={{ background: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
            <div className="row">
              <div className="avatar avatar-navy" style={{ background: 'var(--primary)' }}>{(store?.nama ?? 'K').slice(0, 1).toUpperCase()}</div>
              <div className="grow">
                <div className="semibold" style={{ color: '#fff' }}>{store?.nama ?? t('set.yourStore')}</div>
                <div className="small" style={{ color: '#94a3b8' }}>{store?.alamat || t('set.noAddress')}</div>
              </div>
              <button className="text-btn" style={{ color: 'var(--primary-light)' }} onClick={() => nav('/settings/store')}>
                {t('set.edit')}
              </button>
            </div>
          </div>

          <div className="list mt-4">
            <Row icon={<IconSettings size={20} />} title={t('set.store')} subtitle={t('set.storeSub')} onClick={() => nav('/settings/store')} />
            <Row icon={<IconUsers size={20} />} title={t('set.users')} subtitle={t('set.usersSub')} onClick={() => nav('/settings/users')} />
            <Row icon={<IconDownload size={20} />} title={t('set.backup')} subtitle={t('set.backupSub')} onClick={() => nav('/settings/backup')} />
            <Row icon={<span style={{ fontSize: 18 }}>🗄️</span>} title={t('set.databases')} subtitle={t('set.databasesSub')} onClick={() => nav('/settings/databases')} />
            <Row icon={<IconWallet size={20} />} title={t('set.cashShift')} subtitle={t('set.cashShiftSub')} onClick={() => nav('/shift')} />
          </div>

          <div className="list mt-3">
            <Row icon={<IconBox size={20} />} title={t('set.purchase')} subtitle={t('set.purchaseSub')} onClick={() => nav('/purchase')} />
            <Row icon={<IconTruck size={20} />} title={t('set.delivery')} subtitle={t('set.deliverySub')} onClick={() => nav('/pos/delivery')} />
          </div>

          <div className="list mt-3">
            <Row
              icon={<span style={{ fontSize: 18 }}>🌐</span>}
              title={t('set.language')}
              subtitle={lang === 'id' ? 'Bahasa Indonesia' : 'English'}
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              right={
                <div className="row" style={{ gap: 8 }}>
                  <button
                    className={'chip' + (lang === 'en' ? ' active' : '')}
                    onClick={(e) => { e.stopPropagation(); setLang('en'); }}
                  >
                    EN
                  </button>
                  <button
                    className={'chip' + (lang === 'id' ? ' active' : '')}
                    onClick={(e) => { e.stopPropagation(); setLang('id'); }}
                  >
                    ID
                  </button>
                </div>
              }
            />
            <Row
              icon={<span style={{ fontSize: 18 }}>🔔</span>}
              title={t('set.sound')}
              right={<Switch on={bunyi} onChange={(v) => { setBunyi(v); setSetting('bunyi_scan', v ? '1' : '0'); }} />}
            />
            <Row
              icon={<span style={{ fontSize: 18 }}>📳</span>}
              title={t('set.haptic')}
              right={<Switch on={haptic} onChange={(v) => { setHaptic(v); setSetting('haptic', v ? '1' : '0'); }} />}
            />
            <Row
              icon={<span style={{ fontSize: 18 }}>💾</span>}
              title={t('set.autoBackup')}
              subtitle={t('set.autoBackupSub')}
              right={<Switch on={autoBackup} onChange={(v) => { setAutoBackup(v); setSetting('auto_backup', v ? '1' : '0'); }} />}
            />
          </div>

          <div className="list mt-3">
            <Row icon={<span style={{ fontSize: 18 }}>ℹ️</span>} title={t('set.about')} subtitle={t('set.version', { v: APP_VERSION })} onClick={() => setAboutOpen(true)} />
            <Row
              icon={<IconLogout size={20} />}
              title={t('set.logout')}
              onClick={() => setLogoutOpen(true)}
            />
          </div>

          <div className="small muted center-text mt-4">{t('set.footer', { v: APP_VERSION })}</div>
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title={t('set.logoutTitle')}
        message={t('set.logoutMsg')}
        confirmLabel={t('set.logout')}
        onConfirm={() => {
          logout();
          toast.success(t('set.signedOut'));
          nav('/login', { replace: true });
        }}
        onClose={() => setLogoutOpen(false)}
      />

      <ConfirmDialog
        open={aboutOpen}
        title={t('set.about')}
        message={t('set.aboutMsg', { v: APP_VERSION })}
        confirmLabel={t('app.close')}
        onConfirm={() => setAboutOpen(false)}
        onClose={() => setAboutOpen(false)}
      />
    </div>
  );
}
