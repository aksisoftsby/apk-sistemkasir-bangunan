import { useMemo } from 'react';
import { useDbVersion } from '../../lib/db';
import { listDeliveries, saveDelivery } from '../../lib/repo';
import { formatDate } from '../../lib/format';
import { AppBar, EmptyState } from '../../components/ui';
import { IconTruck } from '../../components/icons';
import { toast } from '../../stores/toast';
import { t, useLang, type LKey } from '../../lib/locale';

const STATUS = ['BELUM_DIKIRIM', 'DALAM_PERJALANAN', 'DITERIMA'] as const;
type DeliveryStatus = (typeof STATUS)[number];
const STATUS_KEY: Record<DeliveryStatus, LKey> = {
  BELUM_DIKIRIM: 'sj.pending',
  DALAM_PERJALANAN: 'sj.onWay',
  DITERIMA: 'sj.received',
};

export default function DeliveryScreen() {
  const ver = useDbVersion();
  const lang = useLang(); void lang;
  const rows = useMemo(() => listDeliveries(), [ver]);

  function next(status: string) {
    const i = STATUS.indexOf(status as DeliveryStatus);
    return STATUS[(i + 1) % STATUS.length];
  }

  return (
    <div className="screen">
      <AppBar title={t('sj.title')} subtitle={t('sj.sub')} />
      <div className="screen-body">
        <div className="page">
          {rows.length === 0 ? (
            <EmptyState title={t('sj.empty')} message={t('sj.emptySub')} image="./assets/promo-banner.webp" />
          ) : (
            <div className="list">
              {rows.map((d) => (
                <div key={d.id} className="list-row">
                  <div className="avatar avatar-navy">
                    <IconTruck size={20} />
                  </div>
                  <div className="grow">
                    <div className="semibold">{d.no_nota}</div>
                    <div className="small muted truncate">{d.customer_nama} · {formatDate(d.tanggal)}</div>
                    <div className="small faint truncate">{d.alamat_kirim || t('sj.noAddress')}{d.sopir ? ' · ' + d.sopir : ''}</div>
                  </div>
                  <button
                    className={'badge ' + (d.status === 'DITERIMA' ? 'badge-success' : d.status === 'DALAM_PERJALANAN' ? 'badge-info' : 'badge-warning')}
                    onClick={() => {
                      const nextStatus = next(d.status);
                      saveDelivery({ sale_id: d.sale_id, alamat_kirim: d.alamat_kirim, sopir: d.sopir, status: nextStatus });
                      toast.success(t('sj.statusChanged', { status: t(STATUS_KEY[nextStatus]) }));
                    }}
                  >
                    {t(STATUS_KEY[d.status as DeliveryStatus])}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
