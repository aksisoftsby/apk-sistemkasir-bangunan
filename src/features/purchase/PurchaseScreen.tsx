import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import { listPurchases } from '../../lib/repo';
import { formatDateTime, formatRupiah } from '../../lib/format';
import { AppBar, EmptyState } from '../../components/ui';
import { IconPlus, IconTruck } from '../../components/icons';
import { t, useLang } from '../../lib/locale';

export default function PurchaseScreen() {
  useLang();
  const ver = useDbVersion();
  const nav = useNavigate();
  const [showHutang, setShowHutang] = useState(false);

  const rows = useMemo(() => listPurchases(), [ver]);
  const filtered = showHutang ? rows.filter((r) => r.sisa > 0) : rows;
  const totalHutang = rows.reduce((a, r) => a + r.sisa, 0);
  const totalBulan = rows.reduce((a, r) => a + r.total, 0);

  return (
    <div className="screen">
      <AppBar
        title={t('po.title')}
        subtitle={t('po.count', { n: rows.length })}
        right={
          <button className="btn btn-icon btn-ghost" style={{ color: '#fff' }} onClick={() => nav('/purchase/new')} aria-label={t('prod.addProduct')}>
            <IconPlus size={22} />
          </button>
        }
      />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 140 }}>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">{t('po.debt')}</div>
              <div className="kpi-value" style={{ color: totalHutang > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {formatRupiah(totalHutang)}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">{t('po.total')}</div>
              <div className="kpi-value">{formatRupiah(totalBulan)}</div>
            </div>
          </div>

          <div className="row mt-3" style={{ gap: 8 }}>
            <button className={'chip grow' + (!showHutang ? ' active' : '')} onClick={() => setShowHutang(false)} style={{ justifyContent: 'center' }}>
              {t('common.all')}
            </button>
            <button className={'chip grow' + (showHutang ? ' active' : '')} onClick={() => setShowHutang(true)} style={{ justifyContent: 'center' }}>
              {t('po.unpaid')}
            </button>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={t('po.empty')}
              message={t('po.emptySub')}
              action={
                <button className="btn btn-primary" onClick={() => nav('/purchase/new')}>
                  {t('po.record')}
                </button>
              }
            />
          ) : (
            <div className="list mt-3">
              {filtered.map((p) => (
                <div key={p.id} className="list-row">
                  <div className="avatar avatar-navy">
                    <IconTruck size={20} />
                  </div>
                  <div className="grow">
                    <div className="row-between">
                      <span className="semibold">{p.no_po}</span>
                      <span className="money money-sm">{formatRupiah(p.total)}</span>
                    </div>
                    <div className="small muted truncate">{p.supplier_nama}</div>
                    <div className="row-between mt-1">
                      <span className="tiny faint">{formatDateTime(p.tanggal)}</span>
                      <span className={'badge ' + (p.status === 'LUNAS' ? 'badge-success' : p.status === 'BATAL' ? 'badge-danger' : 'badge-warning')}>
                        {p.status === 'TEMPO' ? t('po.debtLabel', { v: formatRupiah(p.sisa) }) : p.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        className="btn btn-primary btn-icon-lg"
        style={{ position: 'fixed', right: 16, bottom: 80, width: 56, height: 56, borderRadius: 16, boxShadow: 'var(--shadow-md)' }}
        onClick={() => nav('/purchase/new')}
        aria-label={t('po.newSub')}
      >
        <IconPlus size={26} />
      </button>
    </div>
  );
}
