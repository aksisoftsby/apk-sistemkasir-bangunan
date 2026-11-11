import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import { listCategories, listProducts, toggleFavorit } from '../../lib/repo';
import { formatNumber, formatQty } from '../../lib/format';
import { AppBar, EmptyState } from '../../components/ui';
import { IconPlus, IconSearch, IconStar } from '../../components/icons';
import { t, useLang } from '../../lib/locale';

export default function ProductListScreen() {
  useLang();
  const ver = useDbVersion();
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  const categories = useMemo(() => listCategories(), [ver]);
  const products = useMemo(
    () => listProducts({ search, categoryId: category || undefined, lowStockOnly: lowOnly }),
    [search, category, lowOnly, ver],
  );

  return (
    <div className="screen">
      <AppBar
        title={t('prod.title')}
        subtitle={t('prod.count', { n: products.length })}
        hideBack
        right={
          <button className="btn btn-icon btn-ghost" style={{ color: '#fff' }} onClick={() => nav('/products/new')} aria-label={t('prod.addProduct')}>
            <IconPlus size={22} />
          </button>
        }
      />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 140 }}>
          <div className="search-wrap">
            <IconSearch size={18} className="search-icon" />
            <input className="search-input" placeholder={t('prod.searchPh')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="row no-scrollbar mt-3" style={{ overflowX: 'auto', gap: 8 }}>
            <button className={'chip' + (category === '' ? ' active' : '')} onClick={() => setCategory('')}>{t('common.all')}</button>
            <button className={'chip' + (lowOnly ? ' active' : '')} onClick={() => setLowOnly((v) => !v)}>{t('prod.lowOnly')}</button>
            {categories.map((c) => (
              <button key={c.id} className={'chip' + (category === c.id ? ' active' : '')} onClick={() => setCategory(c.id)}>
                {c.nama}
              </button>
            ))}
          </div>

          <div className="row mt-3" style={{ gap: 8 }}>
            <button className="btn btn-sm grow" onClick={() => nav('/stock')}>{t('prod.manageStock')}</button>
            <button className="btn btn-sm grow" onClick={() => nav('/purchase')}>{t('prod.purchase')}</button>
          </div>

          {products.length === 0 ? (
            <EmptyState
              title={t('prod.empty')}
              message={t('prod.emptySub')}
              action={<button className="btn btn-primary" onClick={() => nav('/products/new')}>{t('prod.addProduct')}</button>}
            />
          ) : (
            <div className="list mt-3">
              {products.map((p) => (
                <div key={p.id} className="list-row clickable" onClick={() => nav('/products/' + p.id)}>
                  <div className="grow">
                    <div className="row-between">
                      <span className="semibold truncate">{p.nama}</span>
                      {p.stok_dasar <= p.stok_min ? <span className="badge badge-danger">{t('prod.low')}</span> : null}
                    </div>
                    <div className="small muted">{p.sku || p.barcode || '-'} · {p.kategori_nama}</div>
                    <div className="row mt-1" style={{ gap: 8 }}>
                      <span className="small">{t('pos.stock')} {formatQty(p.stok_dasar)} {p.base_unit_simbol}</span>
                      <span className="small faint">{t('pf.hpp', { unit: p.base_unit_simbol })} {formatNumber(p.hpp)}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-icon btn-ghost"
                    style={{ color: p.favorit ? 'var(--accent-yellow)' : 'var(--text-faint)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorit(p.id, p.favorit ? 0 : 1);
                    }}
                    aria-label={t('prod.fav')}
                  >
                    <IconStar size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        className="btn btn-primary btn-icon-lg"
        style={{ position: 'fixed', right: 16, bottom: 80, width: 56, height: 56, borderRadius: 16, boxShadow: 'var(--shadow-md)' }}
        onClick={() => nav('/products/new')}
        aria-label={t('prod.addProduct')}
      >
        <IconPlus size={26} />
      </button>
    </div>
  );
}
