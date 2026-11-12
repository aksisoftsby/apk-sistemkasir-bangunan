import { useMemo, useState } from 'react';
import { notifyChange, useDbVersion } from '../../lib/db';
import { applyStockMovement, getProductUnits, listProducts } from '../../lib/repo';
import { formatNumber, formatQty, formatStock, parseQtyInput } from '../../lib/format';
import { lowStockProducts, stockMutation, stockValue } from '../../lib/report';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, EmptyState, Segmented } from '../../components/ui';
import { IconSearch } from '../../components/icons';
import { t, useLang } from '../../lib/locale';

export default function StockScreen() {
  useLang();
  const ver = useDbVersion();
  const user = useSession((s) => s.user);
  const [tab, setTab] = useState<'ALL' | 'LOW'>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [tipe, setTipe] = useState<'MASUK' | 'KELUAR' | 'OPNAME'>('MASUK');
  const [qtyText, setQtyText] = useState('');
  const [catatan, setCatatan] = useState('');

  const products = useMemo(() => listProducts({ search }), [search, ver]);
  const low = useMemo(() => lowStockProducts(), [ver]);
  const nilai = useMemo(() => stockValue(), [ver]);
  const prod = selected ? products.find((p) => p.id === selected) : null;
  const units = useMemo(() => (prod ? getProductUnits(prod.id) : []), [prod]);
  const mutations = useMemo(() => (prod ? stockMutation(prod.id, 20) : []), [prod, ver]);

  const shown = tab === 'LOW' ? products.filter((p) => low.some((l) => l.id === p.id)) : products;

  function simpan() {
    if (!prod) return;
    const qty = parseQtyInput(qtyText);
    if (qty <= 0) {
      toast.danger(t('st.qtyMin'));
      return;
    }
    const base = units.find((u) => u.is_default_beli) ?? units[0];
    const konversi = base?.konversi ?? 1;
    const qtyDasar = qty * konversi;
    const tipeMove = tipe === 'MASUK' ? 'ADJUST_IN' : tipe === 'KELUAR' ? 'ADJUST_OUT' : 'OPNAME';
    applyStockMovement(
      prod.id,
      tipeMove,
      tipe === 'KELUAR' ? -qtyDasar : qtyDasar,
      prod.hpp,
      'ADJUST',
      prod.id,
      catatan || (tipe === 'OPNAME' ? t('st.opnameDefault') : t('st.adjustDefault')),
      user?.id ?? '',
    );
    notifyChange();
    toast.success(t('st.updated'));
    setQtyText('');
    setCatatan('');
    setSelected(null);
  }

  const baseUnit = prod ? units.find((u) => u.is_default_beli) ?? units[0] : null;

  return (
    <div className="screen">
      <AppBar title={t('st.title')} subtitle={t('st.subtitle', { n: nilai.item_count, v: formatNumber(Math.round(nilai.total_nilai)) })} />
      <div className="screen-body">
        <div className="page">
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">{t('st.value')}</div>
              <div className="kpi-value">Rp {formatNumber(Math.round(nilai.total_nilai))}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">{t('st.low')}</div>
              <div className="kpi-value" style={{ color: low.length ? 'var(--danger)' : 'var(--success)' }}>{low.length} {t('prod.low')}</div>
            </div>
          </div>

          <div className="mt-3">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'ALL', label: t('st.allProducts') },
                { value: 'LOW', label: t('st.lowTab', { n: low.length }) },
              ]}
            />
          </div>

          <div className="search-wrap mt-3">
            <IconSearch size={18} className="search-icon" />
            <input className="search-input" placeholder={t('st.searchPh')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {shown.length === 0 ? (
            <EmptyState title={t('st.empty')} message={t('st.emptySub')} />
          ) : (
            <div className="list mt-3">
              {shown.map((p) => (
                <div key={p.id} className="list-row clickable" onClick={() => { setSelected(p.id); setTipe('MASUK'); setQtyText(''); setCatatan(''); }}>
                  <div className="grow">
                    <div className="semibold truncate">{p.nama}</div>
                    <div className="small muted">
                      {formatStock(p)} · {t('st.min')} {formatQty(p.stok_min)} {p.base_unit_simbol}
                    </div>
                  </div>
                  {p.stok_dasar <= p.stok_min ? (
                    <span className={'badge ' + (p.stok_dasar <= 0 ? 'badge-danger' : 'badge-warning')}>
                      {p.stok_dasar <= 0 ? t('pos.noStock') : t('prod.low')}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        open={!!prod}
        onClose={() => setSelected(null)}
        title={prod ? t('st.adjust') : ''}
        footer={
          <button className="btn btn-primary btn-lg btn-block" onClick={simpan}>
            {t('st.saveAdjust')}
          </button>
        }
      >
        {prod ? (
          <div className="col">
            <div className="small muted">
              {t('st.current', { v: formatQty(prod.stok_dasar) + ' ' + prod.base_unit_simbol })}
            </div>
            <Segmented
              value={tipe}
              onChange={setTipe}
              options={[
                { value: 'MASUK', label: t('st.in') },
                { value: 'KELUAR', label: t('st.out') },
                { value: 'OPNAME', label: t('st.opname') },
              ]}
            />
            <div className="field">
              <label>{t('st.amountIn', { unit: baseUnit?.unit_simbol ?? '' })}</label>
              <input className="input num" inputMode="decimal" value={qtyText} onChange={(e) => setQtyText(e.target.value)} placeholder="0" />
            </div>
            {prod.stok_min > 0 ? (
              <div className="row wrap" style={{ gap: 8 }}>
                {[1, 5, 10].map((n) => (
                  <button key={n} className="chip" onClick={() => setQtyText(String(n))}>+{n}</button>
                ))}
              </div>
            ) : null}
            <div className="field">
              <label>{t('st.note')}</label>
              <input className="input" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder={t('st.notePh')} />
            </div>

            <div className="divider" />
            <div className="card-title">{t('st.history')}</div>
            {mutations.length === 0 ? (
              <div className="small muted">{t('st.noMove')}</div>
            ) : (
              <div>
                {mutations.map((m) => (
                  <div key={m.id} className="row-between small mb-1">
                    <span className="truncate grow">
                      {new Date(m.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {m.tipe}
                    </span>
                    <span className={'money money-sm ' + (m.qty_dasar >= 0 ? 'money-success' : 'money-danger')}>
                      {m.qty_dasar >= 0 ? '+' : ''}{formatQty(m.qty_dasar)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
