import { useState } from 'react';
import { getStoreProfile } from '../../lib/repo';
import { formatNumber, formatQty, roundTo } from '../../lib/format';
import { cartTotals, useCart } from '../../stores/cart';
import { Money, NumberSheet } from '../../components/ui';
import { IconMinus, IconPlus, IconTrash, IconUser } from '../../components/icons';
import type { CartItem } from '../../lib/types';

export default function CartSheet({
  open,
  onClose,
  onPay,
  onPickCustomer,
}: {
  open: boolean;
  onClose: () => void;
  onPay: () => void;
  onPickCustomer: () => void;
}) {
  const cart = useCart();
  const store = getStoreProfile();
  const totals = cartTotals(cart, store?.ppn_persen ?? 0, store?.pembulatan ?? 0);
  const [edit, setEdit] = useState<{ item: CartItem; mode: 'qty' | 'price' | 'diskon' } | null>(null);
  const [diskonNota, setDiskonNota] = useState(false);
  const [kirim, setKirim] = useState(false);

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '90vh' }}>
        <div className="sheet-grabber" />
        <div className="row-between" style={{ padding: '0 16px 8px' }}>
          <div className="h3">Keranjang</div>
          <button className="text-btn text-btn-danger" onClick={() => cart.clear()}>
            Kosongkan
          </button>
        </div>

        <div className="sheet-body" style={{ paddingTop: 0 }}>
          <button className="btn btn-soft btn-block mb-3" onClick={onPickCustomer}>
            <IconUser size={18} />
            {cart.customer_nama ? cart.customer_nama : 'Pilih Pelanggan (Umum)'}
          </button>

          <div className="list">
            {cart.items.map((it) => (
              <div key={it.key} className="cart-row">
                <div className="grow">
                  <div className="semibold" style={{ fontSize: 14 }}>{it.nama_produk}</div>
                  <div className="small muted">
                    Rp {formatNumber(it.harga_satuan)} / {it.unit_simbol}
                  </div>
                  <div className="row mt-2" style={{ gap: 6 }}>
                    <button className="qty-btn" onClick={() => cart.setQty(it.key, Math.max(0, roundTo(it.qty - (it.allow_decimal ? 0.5 : 1), 3)))}>
                      <IconMinus size={14} />
                    </button>
                    <button className="qty-value" onClick={() => setEdit({ item: it, mode: 'qty' })}>
                      {formatQty(it.qty)} {it.unit_simbol}
                    </button>
                    <button className="qty-btn" onClick={() => cart.setQty(it.key, roundTo(it.qty + (it.allow_decimal ? 0.5 : 1), 3))}>
                      <IconPlus size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="money money-sm">{'Rp ' + formatNumber(it.subtotal)}</div>
                  <button className="text-btn text-btn-danger" onClick={() => cart.remove(it.key)} aria-label="Hapus">
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="row mt-3" style={{ gap: 8 }}>
            <button className="btn btn-sm grow" onClick={() => setDiskonNota(true)}>
              Diskon Nota {cart.diskon > 0 ? '(-' + formatNumber(cart.diskon) + ')' : ''}
            </button>
            <button className="btn btn-sm grow" onClick={() => setKirim(true)}>
              Biaya Kirim {cart.biaya_kirim > 0 ? '(' + formatNumber(cart.biaya_kirim) + ')' : ''}
            </button>
          </div>

          <div className="card mt-3">
            <div className="row-between small">
              <span>Subtotal</span>
              <span className="money money-sm">{'Rp ' + formatNumber(totals.subtotal)}</span>
            </div>
            {totals.diskon > 0 ? (
              <div className="row-between small mt-1">
                <span>Diskon</span>
                <span className="money money-sm money-danger">{'-Rp ' + formatNumber(totals.diskon)}</span>
              </div>
            ) : null}
            {totals.ppn > 0 ? (
              <div className="row-between small mt-1">
                <span>PPN</span>
                <span className="money money-sm">{'Rp ' + formatNumber(totals.ppn)}</span>
              </div>
            ) : null}
            {cart.biaya_kirim > 0 ? (
              <div className="row-between small mt-1">
                <span>Biaya kirim</span>
                <span className="money money-sm">{'Rp ' + formatNumber(cart.biaya_kirim)}</span>
              </div>
            ) : null}
            {totals.pembulatan !== 0 ? (
              <div className="row-between small mt-1">
                <span>Pembulatan</span>
                <span className="money money-sm">{'Rp ' + formatNumber(totals.pembulatan)}</span>
              </div>
            ) : null}
            <div className="divider" />
            <div className="row-between">
              <span className="strong">Total</span>
              <Money value={totals.total} size="lg" className="money-primary" />
            </div>
          </div>
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border-light)' }}>
          <button className="btn btn-primary btn-lg btn-block" onClick={onPay} disabled={cart.items.length === 0}>
            Lanjut Bayar
          </button>
        </div>
      </div>

      <NumberSheet
        open={!!edit && edit.mode === 'qty'}
        title="Ubah Jumlah"
        value={edit?.item.qty ?? 0}
        allowDecimal={!!edit?.item.allow_decimal}
        onClose={() => setEdit(null)}
        onConfirm={(n) => {
          if (edit) cart.setQty(edit.item.key, n);
          setEdit(null);
        }}
      />
      <NumberSheet
        open={!!edit && edit.mode === 'price'}
        title="Ubah Harga Satuan"
        value={edit?.item.harga_satuan ?? 0}
        prefix="Rp"
        onClose={() => setEdit(null)}
        onConfirm={(n) => {
          if (edit) cart.setPrice(edit.item.key, n);
          setEdit(null);
        }}
      />
      <NumberSheet
        open={diskonNota}
        title="Diskon Nota"
        value={cart.diskon}
        prefix="Rp"
        onClose={() => setDiskonNota(false)}
        onConfirm={(n) => {
          cart.setDiskonNota(n);
          setDiskonNota(false);
        }}
      />
      <NumberSheet
        open={kirim}
        title="Biaya Kirim"
        value={cart.biaya_kirim}
        prefix="Rp"
        onClose={() => setKirim(false)}
        onConfirm={(n) => {
          cart.setBiayaKirim(n);
          setKirim(false);
        }}
      />
    </>
  );
}
