import { useMemo } from 'react';
import { useDbVersion } from '../../lib/db';
import { listDeliveries, saveDelivery } from '../../lib/repo';
import { formatDate } from '../../lib/format';
import { AppBar, EmptyState } from '../../components/ui';
import { IconTruck } from '../../components/icons';
import { toast } from '../../stores/toast';

const STATUS = ['BELUM_DIKIRIM', 'DALAM_PERJALANAN', 'DITERIMA'];
const LABEL: Record<string, string> = {
  BELUM_DIKIRIM: 'Belum dikirim',
  DALAM_PERJALANAN: 'Dalam perjalanan',
  DITERIMA: 'Diterima',
};

export default function DeliveryScreen() {
  const ver = useDbVersion();
  const rows = useMemo(() => listDeliveries(), [ver]);

  function next(status: string) {
    const i = STATUS.indexOf(status);
    return STATUS[(i + 1) % STATUS.length];
  }

  return (
    <div className="screen">
      <AppBar title="Surat Jalan" subtitle="Status pengiriman barang" />
      <div className="screen-body">
        <div className="page">
          {rows.length === 0 ? (
            <EmptyState title="Belum ada pengiriman" message="Buat surat jalan dari layar transaksi berhasil." image="./assets/promo-banner.webp" />
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
                    <div className="small faint truncate">{d.alamat_kirim || 'Alamat belum diisi'}{d.sopir ? ' · ' + d.sopir : ''}</div>
                  </div>
                  <button
                    className={'badge ' + (d.status === 'DITERIMA' ? 'badge-success' : d.status === 'DALAM_PERJALANAN' ? 'badge-info' : 'badge-warning')}
                    onClick={() => {
                      saveDelivery({ sale_id: d.sale_id, alamat_kirim: d.alamat_kirim, sopir: d.sopir, status: next(d.status) });
                      toast.success('Status: ' + LABEL[next(d.status)]);
                    }}
                  >
                    {LABEL[d.status] ?? d.status}
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
