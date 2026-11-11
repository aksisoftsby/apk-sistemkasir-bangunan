import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSale, getCustomer, getOpenShift, getStoreProfile, listCustomers } from '../../lib/repo';
import { daysFromNow, formatNumber, formatRupiah } from '../../lib/format';
import { cartTotals, useCart } from '../../stores/cart';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, Money, NumberSheet, Segmented } from '../../components/ui';
import { IconSearch, IconUser } from '../../components/icons';

type Metode = 'TUNAI' | 'TRANSFER' | 'TEMPO' | 'DP';

export default function PaymentScreen() {
  const nav = useNavigate();
  const cart = useCart();
  const user = useSession((s) => s.user);
  const store = getStoreProfile();
  const totals = cartTotals(cart, store?.ppn_persen ?? 0, store?.pembulatan ?? 0);
  const [metode, setMetode] = useState<Metode>('TUNAI');
  const [dibayar, setDibayar] = useState<number>(totals.total);
  const [tempoHari, setTempoHari] = useState(14);
  const [dpNominal, setDpNominal] = useState(0);
  const [pickCustomer, setPickCustomer] = useState(false);
  const [searchCust, setSearchCust] = useState('');
  const [editDiterima, setEditDiterima] = useState(false);
  const [editDp, setEditDp] = useState(false);
  const [saving, setSaving] = useState(false);

  const customers = useMemo(() => (searchCust ? listCustomers(searchCust) : listCustomers('').slice(0, 30)), [searchCust]);
  const customer = cart.customer_id ? getCustomer(cart.customer_id) : null;

  const perluCustomer = metode === 'TEMPO' || metode === 'DP';
  const bayarNominal =
    metode === 'DP' ? Math.min(dpNominal, totals.total)
      : metode === 'TUNAI' ? dibayar
        : metode === 'TEMPO' ? 0
          : totals.total;
  const kembalian = metode === 'TUNAI' ? Math.max(0, dibayar - totals.total) : 0;
  const kurang = metode === 'TUNAI' ? Math.max(0, totals.total - dibayar) : 0;
  const sisa = Math.max(0, totals.total - bayarNominal);

  function submit() {
    if (cart.items.length === 0) {
      toast.danger('Keranjang kosong');
      return;
    }
    if (perluCustomer && !customer) {
      toast.danger('Pilih pelanggan untuk transaksi tempo/DP');
      return;
    }
    if (metode === 'TUNAI' && dibayar < totals.total) {
      toast.danger('Uang diterima kurang');
      return;
    }
    if (metode === 'DP' && dpNominal <= 0) {
      toast.danger('Nominal DP harus lebih dari 0');
      return;
    }
    if (customer && customer.limit_kredit > 0 && sisa > 0) {
      const sisaLama = 0; // limit check sederhana terhadap transaksi ini
      if (sisa + sisaLama > customer.limit_kredit) {
        toast.warning('Melebihi limit kredit pelanggan');
      }
    }
    setSaving(true);
    try {
      const shift = user ? getOpenShift(user.id) : null;
      const sale = createSale(
        {
          customer_id: cart.customer_id,
          proyek: cart.proyek,
          catatan: cart.catatan,
          diskon: cart.diskon,
          biaya_kirim: cart.biaya_kirim,
          ppn_persen: store?.ppn_persen ?? 0,
          pembulatan: store?.pembulatan ?? 0,
          metode:
            metode === 'TEMPO'
              ? 'TEMPO'
              : metode === 'DP'
                ? 'DP'
                : metode === 'TRANSFER'
                  ? 'TRANSFER'
                  : 'TUNAI',
          dibayar: bayarNominal,
          jatuh_tempo: perluCustomer ? daysFromNow(tempoHari) : null,
          items: cart.items.map((i) => ({
            product_id: i.product_id,
            product_unit_id: i.product_unit_id,
            unit_id: i.unit_id,
            unit_simbol: i.unit_simbol,
            qty: i.qty,
            konversi: i.konversi,
            harga_satuan: i.harga_satuan,
            diskon: i.diskon,
            nama_produk: i.nama_produk,
            hpp: i.hpp,
          })),
        },
        user?.id ?? '',
        shift?.id ?? null,
      );
      cart.clear();
      toast.success('Transaksi tersimpan');
      nav('/pos/success/' + sale.id, { replace: true });
    } catch (e) {
      console.error(e);
      toast.danger('Gagal menyimpan: ' + String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <AppBar title="Pembayaran" subtitle={'Total ' + formatRupiah(totals.total)} />
      <div className="screen-body">
        <div className="page">
          <div className="card center-text">
            <div className="small muted">Total Tagihan</div>
            <div className="money money-xl money-primary mt-1">{formatRupiah(totals.total)}</div>
            <div className="small muted mt-1">{totals.itemCount} item</div>
          </div>

          <div className="mt-4">
            <Segmented<Metode>
              value={metode}
              onChange={(m) => {
                setMetode(m);
                if (m === 'TUNAI') setDibayar(totals.total);
              }}
              options={[
                { value: 'TUNAI', label: 'Tunai' },
                { value: 'TRANSFER', label: 'Transfer' },
                { value: 'TEMPO', label: 'Tempo' },
                { value: 'DP', label: 'DP' },
              ]}
            />
          </div>

          {perluCustomer ? (
            <>
              <button className="btn btn-soft btn-block mt-3" onClick={() => setPickCustomer(true)}>
                <IconUser size={18} />
                {customer ? customer.nama : 'Pilih Pelanggan *'}
              </button>
              <div className="mt-3">
                <div className="label mb-2">Jatuh Tempo</div>
                <div className="row wrap" style={{ gap: 8 }}>
                  {[7, 14, 30, 60].map((d) => (
                    <button key={d} className={'chip' + (tempoHari === d ? ' active' : '')} onClick={() => setTempoHari(d)}>
                      {d} hari
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {metode === 'TUNAI' ? (
            <div className="card mt-3">
              <div className="row-between">
                <span className="small muted">Uang diterima</span>
                <button className="text-btn" onClick={() => setEditDiterima(true)}>Ubah</button>
              </div>
              <div className="money money-lg mt-1">{formatRupiah(dibayar)}</div>
              <div className="row wrap mt-3" style={{ gap: 8 }}>
                <button className="chip" onClick={() => setDibayar(totals.total)}>Pas</button>
                {[50000, 100000, 200000].map((n) => (
                  <button key={n} className="chip" onClick={() => setDibayar(n)}>
                    {'Rp ' + formatNumber(n)}
                  </button>
                ))}
              </div>
              <div className="divider" />
              {kurang > 0 ? (
                <div className="row-between">
                  <span className="strong" style={{ color: 'var(--danger)' }}>Kurang</span>
                  <Money value={kurang} size="lg" className="money-danger" />
                </div>
              ) : (
                <div className="row-between">
                  <span className="strong" style={{ color: 'var(--success)' }}>Kembalian</span>
                  <Money value={kembalian} size="lg" className="money-success" />
                </div>
              )}
            </div>
          ) : null}

          {metode === 'DP' ? (
            <div className="card mt-3">
              <div className="row-between">
                <span className="small muted">DP diterima</span>
                <button className="text-btn" onClick={() => setEditDp(true)}>Ubah</button>
              </div>
              <div className="money money-lg mt-1">{formatRupiah(dpNominal)}</div>
              <div className="row wrap mt-3" style={{ gap: 8 }}>
                {[0.25, 0.5, 0.75].map((p) => (
                  <button key={p} className="chip" onClick={() => setDpNominal(Math.round(totals.total * p))}>
                    {p * 100}%
                  </button>
                ))}
              </div>
              <div className="divider" />
              <div className="row-between">
                <span className="strong" style={{ color: 'var(--warning)' }}>Sisa jadi piutang</span>
                <Money value={sisa} size="lg" className="money-danger" />
              </div>
            </div>
          ) : null}

          {metode === 'TEMPO' ? (
            <div className="card mt-3">
              <div className="row-between">
                <span className="strong" style={{ color: 'var(--warning)' }}>Seluruhnya jadi piutang</span>
                <Money value={sisa} size="lg" className="money-danger" />
              </div>
            </div>
          ) : null}

          {metode === 'TRANSFER' ? (
            <div className="card mt-3">
              <div className="small muted">
                Catat pembayaran transfer secara manual. Pastikan dana sudah masuk sebelum menyimpan.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="sticky-footer">
        <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={saving}>
          {saving ? 'Menyimpan…' : 'Selesai & Simpan'}
        </button>
      </div>

      <BottomSheet open={pickCustomer} onClose={() => setPickCustomer(false)} title="Pilih Pelanggan">
        <div className="search-wrap mb-3">
          <IconSearch size={18} className="search-icon" />
          <input className="search-input" placeholder="Cari pelanggan…" value={searchCust} onChange={(e) => setSearchCust(e.target.value)} />
        </div>
        <div className="list">
          {customers.map((c) => (
            <div
              key={c.id}
              className="list-row clickable"
              onClick={() => {
                cart.setCustomer(c.id, c.nama);
                setPickCustomer(false);
              }}
            >
              <div className="avatar">{c.nama.slice(0, 1).toUpperCase()}</div>
              <div className="grow">
                <div className="semibold truncate">{c.nama}</div>
                <div className="small muted">{c.telp || 'Pelanggan'}</div>
              </div>
              {c.price_tier_id ? <span className="badge badge-neutral">{c.price_tier_id === 't-grosir' ? 'Grosir' : c.price_tier_id === 't-kontraktor' ? 'Kontraktor' : 'Eceran'}</span> : null}
            </div>
          ))}
        </div>
      </BottomSheet>

      <NumberSheet
        open={editDiterima}
        title="Uang Diterima"
        value={dibayar}
        prefix="Rp"
        quickAmounts={[50000, 100000, 200000, 500000]}
        onClose={() => setEditDiterima(false)}
        onConfirm={(n) => {
          setDibayar(n);
          setEditDiterima(false);
        }}
      />
      <NumberSheet
        open={editDp}
        title="Nominal DP"
        value={dpNominal}
        prefix="Rp"
        onClose={() => setEditDp(false)}
        onConfirm={(n) => {
          setDpNominal(n);
          setEditDp(false);
        }}
      />
    </div>
  );
}
