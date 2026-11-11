import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import {
  deleteProduct,
  getProduct,
  getProductPrices,
  getProductUnits,
  listCategories,
  listPriceTiers,
  listUnits,
  saveProduct,
} from '../../lib/repo';
import { formatNumber, parseRupiahInput } from '../../lib/format';
import { toast } from '../../stores/toast';
import { AppBar, ConfirmDialog, Field, Switch } from '../../components/ui';
import { IconMinus, IconPlus } from '../../components/icons';
import { t, useLang } from '../../lib/locale';

interface UnitRow {
  unit_id: string;
  konversi: number;
  is_default_jual: number;
  is_default_beli: number;
}

export default function ProductFormScreen() {
  useLang();
  const ver = useDbVersion();
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = !!id;
  const product = id ? getProduct(id) : null;
  const categories = useMemo(() => listCategories(), [ver]);
  const allUnits = useMemo(() => listUnits(), [ver]);
  const tiers = useMemo(() => listPriceTiers(), [ver]);

  const [nama, setNama] = useState(product?.nama ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? '');
  const [baseUnitId, setBaseUnitId] = useState(product?.base_unit_id ?? 'u-buah');
  const [hpp, setHpp] = useState(product?.hpp ?? 0);
  const [stokMin, setStokMin] = useState(product?.stok_min ?? 0);
  const [favorit, setFavorit] = useState(!!product?.favorit);
  const [aktif, setAktif] = useState(product ? !!product.aktif : true);
  const [catatan, setCatatan] = useState(product?.catatan ?? '');
  const [stokAwal, setStokAwal] = useState(0);

  const [unitRows, setUnitRows] = useState<UnitRow[]>(() => {
    if (id) {
      const pus = getProductUnits(id);
      if (pus.length) {
        return pus.map((u) => ({ unit_id: u.unit_id, konversi: u.konversi, is_default_jual: u.is_default_jual, is_default_beli: u.is_default_beli }));
      }
    }
    return [{ unit_id: 'u-buah', konversi: 1, is_default_jual: 1, is_default_beli: 1 }];
  });

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    if (id) {
      for (const p of getProductPrices(id)) {
        const unitId = p.product_unit_id.replace(id + '-', '');
        out[unitId + '|' + p.price_tier_id] = p.harga;
      }
    }
    return out;
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    // pastikan satuan dasar ada di daftar
    setUnitRows((rows) => {
      if (rows.some((r) => r.unit_id === baseUnitId)) return rows;
      return [{ unit_id: baseUnitId, konversi: 1, is_default_jual: 1, is_default_beli: 1 }, ...rows];
    });
  }, [baseUnitId]);

  function addUnit() {
    const next = allUnits.find((u) => !unitRows.some((r) => r.unit_id === u.id));
    if (!next) {
      toast.warning(t('pf.allUnitsAdded'));
      return;
    }
    setUnitRows((r) => [...r, { unit_id: next.id, konversi: 1, is_default_jual: 0, is_default_beli: 0 }]);
  }

  function unitSymbol(unitId: string) {
    return allUnits.find((u) => u.id === unitId)?.simbol ?? unitId;
  }

  function submit() {
    if (!nama.trim()) {
      toast.danger(t('pf.nameReq'));
      return;
    }
    if (unitRows.length === 0) {
      toast.danger(t('pf.minUnit'));
      return;
    }
    const unitPrices = unitRows.flatMap((u) =>
      tiers.map((t) => ({
        unit_id: u.unit_id,
        tier_id: t.id,
        harga: prices[`${u.unit_id}|${t.id}`] ?? 0,
      })),
    );
    try {
      const pid = saveProduct({
        id: product?.id,
        sku: sku.trim(),
        barcode: barcode.trim(),
        nama: nama.trim(),
        category_id: categoryId,
        base_unit_id: baseUnitId,
        hpp,
        stok_min: stokMin,
        favorit: favorit ? 1 : 0,
        aktif: aktif ? 1 : 0,
        catatan: catatan.trim(),
        units: unitRows.map((u) => ({ ...u, konversi: u.unit_id === baseUnitId ? 1 : u.konversi })),
        prices: unitPrices,
        stok_awal: !isEdit ? stokAwal : 0,
      });
      toast.success(isEdit ? t('pf.updated') : t('pf.added'));
      nav('/products/' + pid, { replace: true });
    } catch (e) {
      toast.danger(t('common.failedSave') + String(e));
    }
  }

  return (
    <div className="screen">
      <AppBar title={isEdit ? t('prod.edit') : t('prod.new')} />
      <div className="screen-body">
        <div className="page">
          <div className="card">
            <div className="col">
              <Field label={t('pf.name')}>
                <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} placeholder={t('pf.namePh')} />
              </Field>
              <div className="row" style={{ gap: 12 }}>
                <Field label={t('pf.sku')}>
                  <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder={t('pf.skuPh')} />
                </Field>
                <Field label={t('pf.barcode')}>
                  <input className="input" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder={t('pf.barcodePh')} />
                </Field>
              </div>
              <Field label={t('pf.category')}>
                <div className="select-wrap">
                  <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label={t('pf.baseUnit')}>
                <div className="select-wrap">
                  <select className="select" value={baseUnitId} onChange={(e) => setBaseUnitId(e.target.value)}>
                    {allUnits.map((u) => (
                      <option key={u.id} value={u.id}>{u.nama} ({u.simbol})</option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>
          </div>

          <div className="card">
            <div className="row-between mb-2">
              <div className="card-title" style={{ margin: 0 }}>{t('pf.unitsTitle')}</div>
              <button className="text-btn" onClick={addUnit}>
                <IconPlus size={16} /> {t('pf.addUnit')}
              </button>
            </div>
            <div className="small muted mb-2">{t('pf.unitHint')}</div>
            {unitRows.map((u) => (
              <div key={u.unit_id} className="row mb-2" style={{ gap: 8 }}>
                <span className="chip chip-primary" style={{ minWidth: 64, justifyContent: 'center' }}>{unitSymbol(u.unit_id)}</span>
                <span className="small muted">=</span>
                <input
                  className="input num"
                  style={{ width: 90, minHeight: 40 }}
                  inputMode="decimal"
                  value={u.konversi}
                  disabled={u.unit_id === baseUnitId}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace(',', '.')) || 0;
                    setUnitRows((rows) => rows.map((r) => (r.unit_id === u.unit_id ? { ...r, konversi: v } : r)));
                  }}
                />
                <span className="small muted grow">{unitSymbol(baseUnitId)}</span>
                {u.unit_id !== baseUnitId ? (
                  <button className="btn btn-icon btn-ghost text-btn-danger" onClick={() => setUnitRows((rows) => rows.filter((r) => r.unit_id !== u.unit_id))} aria-label={t('common.delete')}>
                    <IconMinus size={16} />
                  </button>
                ) : (
                  <span className="badge badge-neutral">{t('pf.base')}</span>
                )}
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">{t('pf.sellPrice')}</div>
            {unitRows.map((u) => (
              <div key={u.unit_id} className="mb-3">
                <div className="label mb-1">{t('pf.per', { unit: unitSymbol(u.unit_id) })}</div>
                <div className="row" style={{ gap: 8 }}>
                  {tiers.map((t) => {
                    const key = `${u.unit_id}|${t.id}`;
                    const val = prices[key] ?? 0;
                    return (
                      <div key={t.id} className="grow">
                        <input
                          className="input num"
                          style={{ minHeight: 40, fontSize: 14 }}
                          inputMode="numeric"
                          placeholder={t.nama}
                          value={val ? formatNumber(val) : ''}
                          onChange={(e) => {
                            const n = parseRupiahInput(e.target.value);
                            setPrices((p) => ({ ...p, [key]: n }));
                          }}
                        />
                        <div className="tiny faint center-text mt-1">{t.nama}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">{t('pf.stockCapital')}</div>
            <div className="row" style={{ gap: 12 }}>
              <Field label={t('pf.hpp', { unit: allUnits.find((u) => u.id === baseUnitId)?.simbol ?? t('pf.base') })}>
                <input className="input num" inputMode="numeric" value={formatNumber(hpp)} onChange={(e) => setHpp(parseRupiahInput(e.target.value))} />
              </Field>
              <Field label={t('pf.minStock')}>
                <input className="input num" inputMode="numeric" value={formatNumber(stokMin)} onChange={(e) => setStokMin(parseRupiahInput(e.target.value))} />
              </Field>
            </div>
            {!isEdit ? (
              <Field label={t('pf.openStock')}>
                <input className="input num mt-2" inputMode="numeric" value={formatNumber(stokAwal)} onChange={(e) => setStokAwal(parseRupiahInput(e.target.value))} />
              </Field>
            ) : null}
            <Field label={t('pf.note')}>
              <textarea className="textarea mt-2" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder={t('pf.notePh')} />
            </Field>
            <div className="row-between mt-3">
              <span className="label">{t('pf.fav')}</span>
              <Switch on={favorit} onChange={setFavorit} />
            </div>
            <div className="row-between mt-2">
              <span className="label">{t('pf.active')}</span>
              <Switch on={aktif} onChange={setAktif} />
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-block mt-4" onClick={submit}>
            {isEdit ? t('pf.saveEdit') : t('pf.saveNew')}
          </button>
          {isEdit ? (
            <button className="btn btn-danger-soft btn-block mt-2" onClick={() => setConfirmDelete(true)}>
              {t('pf.deleteProduct')}
            </button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t('pf.deleteTitle')}
        message={t('pf.deleteMsg')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() => {
          if (product) {
            deleteProduct(product.id);
            toast.success(t('pf.deleted'));
            nav('/products', { replace: true });
          }
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
