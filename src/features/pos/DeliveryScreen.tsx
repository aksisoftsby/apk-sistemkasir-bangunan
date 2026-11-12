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
                <div key={d.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <div className="avatar avatar-navy">
                    <IconTruck size={20} />
                  </div>
                  <div className="grow">
                    <div className="semibold">{d.no_nota}</div>
                    <div className="small muted">{d.customer_nama || t('common.generalCustomer')} · {formatDate(d.tanggal)}</div>
                    <div className="small faint" style={{ whiteSpace: 'normal' }}>
                      {d.alamat_kirim || t('sj.noAddress')}
                      {d.sopir ? ' · ' + d.sopir : ''}
                    </div>
                    <div className="row wrap mt-2" style={{ gap: 6 }}>
                      {STATUS.map((s) => (
                        <button
                          key={s}
                          className={'chip' + (d.status === s ? ' active' : '')}
                          onClick={() => {
                            if (d.status === s) return;
                            saveDelivery({ sale_id: d.sale_id, alamat_kirim: d.alamat_kirim, sopir: d.sopir, status: s });
                            toast.success(t('sj.statusChanged', { status: t(STATUS_KEY[s]) }));
                          }}
                        >
                          {t(STATUS_KEY[s])}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
