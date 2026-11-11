import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import { createPurchase, getProductUnits, listProducts, listSuppliers } from '../../lib/repo';
import { daysFromNow, formatNumber, formatQty, parseRupiahInput, roundTo } from '../../lib/format';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, EmptyState, Field, NumberSheet } from '../../components/ui';
import { IconMinus, IconSearch, IconTrash } from '../../components/icons';
import type { ProductView } from '../../lib/types';

interface ItemRow {
  key: string;
  product_id: string;
  product_unit_id: string;
  unit_id: string;
  qty: number;
  konversi: number;
  harga_satuan: number;
  nama_produk: string;
  satuan: string;
}

export default function PurchaseFormScreen() {
  const ver = useDbVersion();
  const nav = useNavigate();
  const user = useSession((s) => s.user);

  const suppliers = useMemo(() => listSuppliers(), [ver]);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editQty, setEditQty] = useState<string | null>(null);
  const [editHarga, setEditHarga] = useState<string | null>(null);
  const [dibayar, setDibayar] = useState(0);
  const [editBayar, setEditBayar] = useState(false);
  const [tempoHari, setTempoHari] = useState(30);
  const [saving, setSaving] = useState(false);

  const products = useMemo(() => listProducts({ search }), [search, ver]);
  const total = items.reduce((a, i) => a + Math.round(i.qty * i.harga_satuan), 0);
  const sisa = Math.max(0, total - Math.min(dibayar, total));

  function addProduct(p: ProductView) {
    const units = getProductUnits(p.id);
    const unit = units.find((u) => u.is_default_beli) ?? units[0];
    if (!unit) {
      toast.danger('Produk belum punya satuan');
      return;
    }
    const key = unit.id + '-' + Date.now();
    setItems((rows) => [
      ...rows,
      {
        key,
        product_id: p.id,
        product_unit_id: unit.id,
        unit_id: unit.unit_id,
        qty: 1,
        konversi: unit.konversi,
        harga_satuan: Math.round(p.hpp * unit.konversi),
        nama_produk: p.nama,
        satuan: unit.unit_simbol,
      },
    ]);
    setPickerOpen(false);
    setSearch('');
  }

  function update(key: string, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function simpan() {
    if (items.length === 0) {
      toast.danger('Tambahkan minimal satu barang');
      return;
    }
    if (!supplierId) {
      toast.danger('Pilih supplier');
      return;
    }
    setSaving(true);
    try {
      createPurchase(
        {
          supplier_id: supplierId,
          total_bayar: Math.min(dibayar, total),
          jatuh_tempo: sisa > 0 ? daysFromNow(tempoHari) : null,
          items: items.map((i) => ({
            product_id: i.product_id,
            product_unit_id: i.product_unit_id,
            unit_id: i.unit_id,
            qty: i.qty,
            konversi: i.konversi,
            harga_satuan: i.harga_satuan,
            nama_produk: i.nama_produk,
            satuan: i.satuan,
          })),
        },
        user?.id ?? '',
      );
      toast.success('Pembelian tersimpan, stok bertambah');
      nav('/purchase', { replace: true });
    } catch (e) {
      toast.danger('Gagal menyimpan: ' + String(e));
    } finally {
      setSaving(false);
    }
  }

  const editRow = items.find((i) => i.key === (editQty ?? editHarga));

  return (
    <div className="screen">
      <AppBar title="Pembelian Baru" subtitle="Barang masuk dari supplier" />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 220 }}>
          <div className="card">
            <Field label="Supplier">
              <div className="select-wrap">
                <select className="select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Pilih supplier…</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama}</option>
                  ))}
                </select>
              </div>
            </Field>
            <button className="btn btn-block mt-2" onClick={() => setPickerOpen(true)}>
              <IconSearch size={18} /> Pilih Barang
            </button>
          </div>

          <div className="card">
            <div className="card-title">Daftar Barang</div>
            {items.length === 0 ? (
              <div className="small muted">Belum ada barang. Tekan “Pilih Barang”.</div>
            ) : (
              <div className="col">
                {items.map((it) => (
                  <div key={it.key} className="cart-row">
                    <div className="grow">
                      <div className="semibold" style={{ fontSize: 14 }}>{it.nama_produk}</div>
                      <button className="text-btn small" onClick={() => setEditHarga(it.key)}>
                        Rp {formatNumber(it.harga_satuan)} / {it.satuan}
                      </button>
                      <div className="row mt-2" style={{ gap: 6 }}>
                        <button className="qty-btn" onClick={() => update(it.key, { qty: roundTo(Math.max(0.001, it.qty - 1), 3) })}>
                          <IconMinus size={14} />
                        </button>
                        <button className="qty-value" style={{ minWidth: 84 }} onClick={() => setEditQty(it.key)}>
                          {formatQty(it.qty)} {it.satuan}
                        </button>
                        <button className="qty-btn" onClick={() => update(it.key, { qty: roundTo(it.qty + 1, 3) })}>
                          +
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="money money-sm">{'Rp ' + formatNumber(it.qty * it.harga_satuan)}</div>
                      <button className="text-btn text-btn-danger" onClick={() => setItems((rows) => rows.filter((r) => r.key !== it.key))} aria-label="Hapus">
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="row-between">
              <span className="strong">Total Pembelian</span>
              <span className="money money-lg">{'Rp ' + formatNumber(total)}</span>
            </div>
            <div className="divider" />
            <div className="row-between small">
              <span className="muted">Dibayar sekarang</span>
              <button className="text-btn" onClick={() => setEditBayar(true)}>Ubah</button>
            </div>
            <div className="money money-md mt-1">{'Rp ' + formatNumber(Math.min(dibayar, total))}</div>
            <div className="row wrap mt-2" style={{ gap: 8 }}>
              <button className="chip" onClick={() => setDibayar(total)}>Lunas</button>
              <button className="chip" onClick={() => setDibayar(0)}>Hutang semua</button>
              <button className="chip" onClick={() => setDibayar(Math.round(total / 2))}>Setengah</button>
            </div>
            {sisa > 0 ? (
              <>
                <div className="divider" />
                <div className="row-between">
                  <span className="strong" style={{ color: 'var(--danger)' }}>Sisa hutang</span>
                  <span className="money money-md money-danger">{'Rp ' + formatNumber(sisa)}</span>
                </div>
                <div className="row wrap mt-2" style={{ gap: 8 }}>
                  {[7, 14, 30, 60].map((d) => (
                    <button key={d} className={'chip' + (tempoHari === d ? ' active' : '')} onClick={() => setTempoHari(d)}>
                      {d} hari
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="sticky-footer">
        <button className="btn btn-primary btn-lg btn-block" onClick={simpan} disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan Pembelian'}
        </button>
      </div>

      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pilih Barang">
        <div className="search-wrap mb-3">
          <IconSearch size={18} className="search-icon" />
          <input
            className="search-input"
            placeholder="Cari nama / SKU produk…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        {products.length === 0 ? (
          <EmptyState title="Produk tidak ditemukan" message="Tambahkan produk terlebih dahulu di menu Produk." />
        ) : (
          <div className="list">
            {products.map((p) => (
              <div key={p.id} className="list-row clickable" onClick={() => addProduct(p)}>
                <div className="grow">
                  <div className="semibold truncate">{p.nama}</div>
                  <div className="small muted">
                    {p.sku || p.barcode || p.kategori_nama} · HPP Rp {formatNumber(p.hpp)}
                  </div>
                </div>
                <span className="badge badge-neutral">{p.base_unit_simbol}</span>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      <NumberSheet
        open={!!editQty}
        title="Jumlah Beli"
        value={editRow?.qty ?? 0}
        allowDecimal
        onClose={() => setEditQty(null)}
        onConfirm={(n) => {
          if (editQty) update(editQty, { qty: n > 0 ? roundTo(n, 3) : 1 });
          setEditQty(null);
        }}
      />
      <NumberSheet
        open={!!editHarga}
        title="Harga Beli Satuan"
        value={editRow?.harga_satuan ?? 0}
        prefix="Rp"
        onClose={() => setEditHarga(null)}
        onConfirm={(n) => {
          if (editHarga) update(editHarga, { harga_satuan: Math.max(0, Math.round(n)) });
          setEditHarga(null);
        }}
      />
      <NumberSheet
        open={editBayar}
        title="Dibayar Sekarang"
        value={dibayar}
        prefix="Rp"
        quickAmounts={[100000, 500000, 1000000, 5000000]}
        onClose={() => setEditBayar(false)}
        onConfirm={(n) => {
          setDibayar(parseRupiahInput(String(n)));
          setEditBayar(false);
        }}
      />
    </div>
  );
}
