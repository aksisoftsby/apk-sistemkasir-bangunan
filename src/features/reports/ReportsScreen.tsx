import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import { formatNumber, formatRupiah } from '../../lib/format';
import { t, useLang } from '../../lib/locale';
import { cashSummary, dailySummary, rangeFor, salesByDay, stockValue, topProducts } from '../../lib/report';
import { listReceivables } from '../../lib/repo';
import { AppBar, Segmented } from '../../components/ui';
import { IconClock, IconTruck, IconWallet } from '../../components/icons';

type Period = 'today' | 'yesterday' | '7d' | '30d' | 'month';

export default function ReportsScreen() {
  useLang();
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
      <AppBar title={t('rp.title')} subtitle={t('rp.sub')} hideBack />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 140 }}>
          <Segmented
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'today', label: t('rp.today') },
              { value: 'yesterday', label: t('rp.yesterday') },
              { value: '7d', label: t('rp.d7') },
              { value: 'month', label: t('rp.month') },
            ]}
          />

          <div className="card mt-3" style={{ background: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
            <div className="small" style={{ color: '#94a3b8' }}>{t('rp.omzet')}</div>
            <div className="money money-xl" style={{ color: '#fff' }}>{formatRupiah(summary.omzet)}</div>
            <div className="row mt-2" style={{ gap: 16 }}>
              <div>
                <div className="tiny" style={{ color: '#94a3b8' }}>{t('rp.gross')}</div>
                <div className="money money-sm" style={{ color: 'var(--success)' }}>{formatRupiah(summary.laba_kotor)}</div>
              </div>
              <div>
                <div className="tiny" style={{ color: '#94a3b8' }}>{t('rp.trx')}</div>
                <div className="money money-sm" style={{ color: '#fff' }}>{summary.transaksi}</div>
              </div>
              <div>
                <div className="tiny" style={{ color: '#94a3b8' }}>{t('rp.items')}</div>
                <div className="money money-sm" style={{ color: '#fff' }}>{formatNumber(summary.item_terjual)}</div>
              </div>
            </div>
          </div>

          <div className="kpi-grid mt-3">
            <div className="kpi">
              <div className="kpi-label">{t('rp.cashIn')}</div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>{formatRupiah(cash.masuk)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">{t('rp.cashOut')}</div>
              <div className="kpi-value" style={{ color: 'var(--danger)' }}>{formatRupiah(cash.keluar)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">{t('rp.piutang')}</div>
              <div className="kpi-value" style={{ color: 'var(--warning)' }}>{formatRupiah(piutang)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">{t('rp.stockVal')}</div>
              <div className="kpi-value">{formatRupiah(Math.round(stock.total_nilai))}</div>
            </div>
          </div>

          {byDay.length > 0 ? (
            <div className="card mt-3">
              <div className="card-title">{t('rp.daily')}</div>
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
            <div className="card-title">{t('rp.top')}</div>
            {top.length === 0 ? (
              <div className="small muted">{t('rp.noSales')}</div>
            ) : (
              top.map((p, i) => (
                <div key={p.product_id} className="row-between small mb-2">
                  <div className="row grow" style={{ gap: 8 }}>
                    <span className="badge badge-neutral">{i + 1}</span>
                    <span className="truncate">{p.nama_produk}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="money money-sm">{formatRupiah(p.omzet)}</div>
                    <div className="tiny faint">{t('rp.profit', { v: formatRupiah(p.laba) })}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="col mt-3">
            <button className="btn btn-block" onClick={() => nav('/pos/history')}>
              <IconClock size={18} /> {t('rp.allTrx')}
            </button>
            <button className="btn btn-block" onClick={() => nav('/pos/delivery')}>
              <IconTruck size={18} /> {t('rp.delivery')}
            </button>
            <button className="btn btn-block" onClick={() => nav('/shift')}>
              <IconWallet size={18} /> {t('rp.cashShift')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
