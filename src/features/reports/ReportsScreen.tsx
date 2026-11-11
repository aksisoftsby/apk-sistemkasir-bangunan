import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import { formatNumber, formatRupiah } from '../../lib/format';
import { cashSummary, dailySummary, rangeFor, salesByDay, stockValue, topProducts } from '../../lib/report';
import { listReceivables } from '../../lib/repo';
import { AppBar, Segmented } from '../../components/ui';
import { IconClock, IconTruck, IconWallet } from '../../components/icons';

type Period = 'today' | 'yesterday' | '7d' | '30d' | 'month';

export default function ReportsScreen() {
  const ver = useDbVersion();
  const nav = useNavigate();
  const [period, setPeriod] = useState<Period>('today');

  const { from, to } = rangeFor(period);
  const summary = useMemo(() => dailySummary(from, to), [from, to, ver]);
  const byDay = useMemo(() => salesByDay(from, to), [from, to, ver]);
  const top = useMemo(() => topProducts(from, to, 10), [from, to, ver]);
  const cash = useMemo(() => cashSummary(from, to), [from, to, ver]);
  const stock = useMemo(() => stockValue(), [ver]);
  const piutang = useMemo(() => listReceivables().reduce((a, r) => a + r.sisa, 0), [ver]);

  const maxOmzet = Math.max(1, ...byDay.map((d) => d.omzet));

  return (
    <div className="screen">
      <AppBar title="Laporan" subtitle="Ringkasan & performa toko" hideBack />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 140 }}>
          <Segmented
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'today', label: 'Hari ini' },
              { value: 'yesterday', label: 'Kemarin' },
              { value: '7d', label: '7 hari' },
              { value: 'month', label: 'Bulan ini' },
            ]}
          />

          <div className="card mt-3" style={{ background: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
            <div className="small" style={{ color: '#94a3b8' }}>Omzet</div>
            <div className="money money-xl" style={{ color: '#fff' }}>{formatRupiah(summary.omzet)}</div>
            <div className="row mt-2" style={{ gap: 16 }}>
              <div>
                <div className="tiny" style={{ color: '#94a3b8' }}>Laba kotor</div>
                <div className="money money-sm" style={{ color: 'var(--success)' }}>{formatRupiah(summary.laba_kotor)}</div>
              </div>
              <div>
                <div className="tiny" style={{ color: '#94a3b8' }}>Transaksi</div>
                <div className="money money-sm" style={{ color: '#fff' }}>{summary.transaksi}</div>
              </div>
              <div>
                <div className="tiny" style={{ color: '#94a3b8' }}>Item terjual</div>
                <div className="money money-sm" style={{ color: '#fff' }}>{formatNumber(summary.item_terjual)}</div>
              </div>
            </div>
          </div>

          <div className="kpi-grid mt-3">
            <div className="kpi">
              <div className="kpi-label">Kas Masuk</div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>{formatRupiah(cash.masuk)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Kas Keluar</div>
              <div className="kpi-value" style={{ color: 'var(--danger)' }}>{formatRupiah(cash.keluar)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Total Piutang</div>
              <div className="kpi-value" style={{ color: 'var(--warning)' }}>{formatRupiah(piutang)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Nilai Stok</div>
              <div className="kpi-value">{formatRupiah(Math.round(stock.total_nilai))}</div>
            </div>
          </div>

          {byDay.length > 0 ? (
            <div className="card mt-3">
              <div className="card-title">Penjualan Harian</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                {byDay.slice(-14).map((d) => (
                  <div key={d.tanggal} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      style={{
                        width: '100%',
                        height: Math.max(4, (d.omzet / maxOmzet) * 100),
                        background: 'var(--primary)',
                        borderRadius: 4,
                      }}
                      title={formatRupiah(d.omzet)}
                    />
                    <div className="tiny faint">{d.tanggal.slice(8)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card mt-3">
            <div className="card-title">Produk Terlaris</div>
            {top.length === 0 ? (
              <div className="small muted">Belum ada penjualan pada periode ini.</div>
            ) : (
              top.map((p, i) => (
                <div key={p.product_id} className="row-between small mb-2">
                  <div className="row grow" style={{ gap: 8 }}>
                    <span className="badge badge-neutral">{i + 1}</span>
                    <span className="truncate">{p.nama_produk}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="money money-sm">{formatRupiah(p.omzet)}</div>
                    <div className="tiny faint">Laba {formatRupiah(p.laba)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="col mt-3">
            <button className="btn btn-block" onClick={() => nav('/pos/history')}>
              <IconClock size={18} /> Semua Transaksi
            </button>
            <button className="btn btn-block" onClick={() => nav('/pos/delivery')}>
              <IconTruck size={18} /> Surat Jalan
            </button>
            <button className="btn btn-block" onClick={() => nav('/shift')}>
              <IconWallet size={18} /> Kas & Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
