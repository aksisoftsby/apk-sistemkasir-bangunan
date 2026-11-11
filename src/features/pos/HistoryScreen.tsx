import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import { listSales } from '../../lib/repo';
import { formatDateTime, formatRupiah } from '../../lib/format';
import { AppBar, EmptyState, Segmented } from '../../components/ui';
import { IconSearch } from '../../components/icons';

export default function HistoryScreen() {
  const ver = useDbVersion();
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'LUNAS' | 'TEMPO' | 'DP' | 'BATAL'>('ALL');

  const sales = useMemo(
    () => listSales({ search: search || undefined, status: status === 'ALL' ? undefined : status, limit: 200 }),
    [search, status, ver],
  );

  return (
    <div className="screen">
      <AppBar title="Riwayat Transaksi" />
      <div className="screen-body">
        <div className="page">
          <div className="search-wrap">
            <IconSearch size={18} className="search-icon" />
            <input className="search-input" placeholder="Cari no. nota / pelanggan…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="mt-3">
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: 'ALL', label: 'Semua' },
                { value: 'LUNAS', label: 'Lunas' },
                { value: 'TEMPO', label: 'Tempo' },
                { value: 'BATAL', label: 'Batal' },
              ]}
            />
          </div>

          {sales.length === 0 ? (
            <EmptyState title="Belum ada transaksi" message="Transaksi yang tersimpan akan muncul di sini." />
          ) : (
            <div className="list mt-3">
              {sales.map((s) => (
                <div key={s.id} className="list-row clickable" onClick={() => nav('/pos/history/' + s.id)}>
                  <div className="grow">
                    <div className="row-between">
                      <span className="semibold">{s.no_nota}</span>
                      <span className="money money-sm">{formatRupiah(s.total)}</span>
                    </div>
                    <div className="row-between mt-1">
                      <span className="small muted truncate">{s.customer_nama} · {formatDateTime(s.tanggal)}</span>
                      <span
                        className={
                          'badge ' +
                          (s.status === 'LUNAS' ? 'badge-success' : s.status === 'BATAL' ? 'badge-danger' : 'badge-warning')
                        }
                      >
                        {s.status}
                      </span>
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
