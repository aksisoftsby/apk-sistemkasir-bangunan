import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import {
  createSaleReturn,
  getCustomer,
  getSale,
  getSaleItems,
  getSalePayments,
  getStoreProfile,
  listSaleReturns,
  voidSale,
} from '../../lib/repo';
import { formatDateTime, formatQty, formatRupiah } from '../../lib/format';
import { shareReceipt, shareText, whatsappLink, openExternal } from '../../lib/receipt';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, ConfirmDialog, NumberSheet } from '../../components/ui';
import { IconShare } from '../../components/icons';
import { t, useLang } from '../../lib/locale';

export default function TransactionDetailScreen() {
  useDbVersion();
  const { id } = useParams();
  const nav = useNavigate();
  const user = useSession((s) => s.user);
  const sale = id ? getSale(id) : null;
  const items = useMemo(() => (id ? getSaleItems(id) : []), [id]);
  const payments = useMemo(() => (id ? getSalePayments(id) : []), [id]);
  const returns = useMemo(() => (id ? listSaleReturns(id) : []), [id]);
  const store = getStoreProfile();
  const customer = sale?.customer_id ? getCustomer(sale.customer_id) : null;
  const lang = useLang(); void lang;

  const reasonDefault = t('det.reasonPh');
  const dueLabel = t('det.due');
  const [returOpen, setReturOpen] = useState(false);
  const [returQty, setReturQty] = useState<Record<string, number>>({});
  const [editItem, setEditItem] = useState<string | null>(null);
  const [kompensasi, setKompensasi] = useState('KAS');
  const [alasan, setAlasan] = useState(reasonDefault);
  const [voidOpen, setVoidOpen] = useState(false);

  if (!sale) {
    return (
      <div className="screen">
        <AppBar title={t('det.title')} />
        <div className="page center-text"><div className="h3">{t('det.notFound')}</div></div>
      </div>
    );
  }

  const returTotal = items.reduce((a, it) => a + (returQty[it.id] ?? 0) * it.harga_satuan, 0);

  async function doShare() {
    try {
      await shareReceipt({
        store: {
          nama: store?.nama ?? 'Kokoh',
          alamat: store?.alamat ?? '',
          telp: store?.telp ?? '',
          footer_nota: store?.footer_nota ?? t('ok.thankYou'),
        },
        sale: sale!,
        items,
        customer_nama: customer?.nama ?? t('ok.walkIn'),
        kasir_nama: user?.nama ?? '',
        metode: sale!.status === 'TEMPO' ? 'TEMPO' : 'TUNAI',
        dibayar: sale!.total_bayar,
      });
    } catch (e) {
      toast.danger(t('ok.failed') + String(e));
    }
  }

  function submitRetur() {
    const chosen = items
      .filter((it) => (returQty[it.id] ?? 0) > 0)
      .map((it) => ({
        sale_item_id: it.id,
        qty: returQty[it.id],
        harga_satuan: it.harga_satuan,
        qty_dasar: returQty[it.id] * (it.qty_dasar / it.qty),
        subtotal: Math.round(returQty[it.id] * it.harga_satuan),
      }));
    if (chosen.length === 0) {
      toast.danger(t('det.pickReturn'));
      return;
    }
    try {
      createSaleReturn(sale!.id, chosen, kompensasi, alasan, user?.id ?? '');
      toast.success(t('det.returnSaved'));
      setReturOpen(false);
      setReturQty({});
    } catch (e) {
      toast.danger(t('det.returnFail') + String(e));
    }
  }

  return (
    <div className="screen">
      <AppBar title={sale.no_nota} subtitle={formatDateTime(sale.tanggal)} />
      <div className="screen-body">
        <div className="page">
          <div className="card">
            <div className="row-between">
              <span className="small muted">{t('det.status')}</span>
              <span className={'badge ' + (sale.status === 'LUNAS' ? 'badge-success' : sale.status === 'BATAL' ? 'badge-danger' : 'badge-warning')}>
                {sale.status === 'LUNAS' ? t('hist.lunas') : sale.status === 'BATAL' ? t('hist.void') : sale.status === 'TEMPO' ? t('hist.tempo') : sale.status}
              </span>
            </div>
            <div className="row-between mt-2">
              <span className="small muted">{t('common.customer')}</span>
              <span className="semibold">{customer?.nama ?? t('ok.walkIn')}</span>
            </div>
            {sale.proyek ? (
              <div className="row-between mt-1">
                <span className="small muted">{t('det.project')}</span>
                <span>{sale.proyek}</span>
              </div>
            ) : null}
            {sale.jatuh_tempo ? (
              <div className="row-between mt-1">
                <span className="small muted">{t('det.due')}</span>
                <span>{sale.jatuh_tempo}</span>
              </div>
            ) : null}
          </div>

          <div className="card card-pad-0 mt-3">
            {items.map((it) => (
              <div key={it.id} className="list-row">
                <div className="grow">
                  <div className="semibold" style={{ fontSize: 14 }}>{it.nama_produk}</div>
                  <div className="small muted">
                    {formatQty(it.qty)} {it.satuan} × {formatRupiah(it.harga_satuan)}
                  </div>
                </div>
                <div className="money money-sm">{formatRupiah(it.subtotal)}</div>
              </div>
            ))}
          </div>

          <div className="card mt-3">
            <div className="row-between small"><span>{t('common.subtotal')}</span><span>{formatRupiah(sale.subtotal)}</span></div>
            {sale.diskon > 0 ? <div className="row-between small mt-1"><span>{t('common.discount')}</span><span>-{formatRupiah(sale.diskon)}</span></div> : null}
            {sale.ppn > 0 ? <div className="row-between small mt-1"><span>{t('common.tax')}</span><span>{formatRupiah(sale.ppn)}</span></div> : null}
            {sale.biaya_kirim > 0 ? <div className="row-between small mt-1"><span>{t('common.shipping')}</span><span>{formatRupiah(sale.biaya_kirim)}</span></div> : null}
            {sale.pembulatan !== 0 ? <div className="row-between small mt-1"><span>{t('common.rounding')}</span><span>{formatRupiah(sale.pembulatan)}</span></div> : null}
            <div className="divider" />
            <div className="row-between"><span className="strong">{t('common.total')}</span><span className="money money-lg">{formatRupiah(sale.total)}</span></div>
            <div className="row-between mt-1"><span className="small muted">{t('common.paid')}</span><span className="money money-sm">{formatRupiah(sale.total_bayar)}</span></div>
            {sale.sisa > 0 ? <div className="row-between mt-1"><span className="small" style={{ color: 'var(--danger)' }}>{t('common.remaining')}</span><span className="money money-sm money-danger">{formatRupiah(sale.sisa)}</span></div> : null}
          </div>

          {payments.length > 0 ? (
            <div className="card mt-3">
              <div className="card-title">{t('det.payments')}</div>
              {payments.map((p) => (
                <div key={p.id} className="row-between small mb-1">
                  <span>{p.metode} · {formatDateTime(p.tanggal)}</span>
                  <span className="money money-sm">{formatRupiah(p.jumlah)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {returns.length > 0 ? (
            <div className="card mt-3">
              <div className="card-title">{t('det.returns')}</div>
              {returns.map((r) => (
                <div key={r.id} className="row-between small mb-1">
                  <span>{formatDateTime(r.tanggal)} · {r.kompensasi}</span>
                  <span className="money money-sm money-danger">-{formatRupiah(r.total)}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="col mt-4">
            <button className="btn btn-primary btn-block" onClick={doShare}>
              <IconShare size={18} /> {t('det.sharePdf')}
            </button>
            {customer?.telp ? (
              <button
                className="btn btn-block"
                onClick={() => {
                  const text = t('det.billText', {
                    name: customer.nama,
                    no: sale.no_nota,
                    amount: formatRupiah(sale.sisa > 0 ? sale.sisa : sale.total),
                    due: sale.jatuh_tempo ? ` ${dueLabel}: ${sale.jatuh_tempo}` : '',
                  });
                  void shareText(text);
                  void openExternal(whatsappLink(customer.telp, text));
                }}
              >
                {t('det.sendBill')}
              </button>
            ) : null}
            {sale.status !== 'BATAL' ? (
              <button className="btn btn-block" onClick={() => setReturOpen(true)}>{t('det.returnGoods')}</button>
            ) : null}
            {user?.role === 'OWNER' && sale.status !== 'BATAL' ? (
              <button className="btn btn-danger-soft btn-block" onClick={() => setVoidOpen(true)}>{t('det.voidSale')}</button>
            ) : null}
            <button className="btn btn-ghost btn-block" onClick={() => nav(-1)}>{t('det.back')}</button>
          </div>
        </div>
      </div>

      <BottomSheet
        open={returOpen}
        onClose={() => setReturOpen(false)}
        title={t('det.returnTitle')}
        footer={
          <button className="btn btn-primary btn-lg btn-block" onClick={submitRetur}>
            {t('det.saveReturn')} · {formatRupiah(returTotal)}
          </button>
        }
      >
        <div className="list">
          {items.map((it) => (
            <div key={it.id} className="list-row">
              <div className="grow">
                <div className="semibold" style={{ fontSize: 14 }}>{it.nama_produk}</div>
                <div className="small muted">{formatQty(it.qty)} {it.satuan}</div>
              </div>
              <button className="btn btn-sm" onClick={() => setEditItem(it.id)}>
                {returQty[it.id] ? formatQty(returQty[it.id]) : '0'}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="label mb-2">{t('det.compensation')}</div>
          <div className="row wrap" style={{ gap: 8 }}>
            {[
              { v: 'KAS', l: t('det.cashBack') },
              { v: 'PIUTANG', l: t('det.cutReceivable') },
            ].map((o) => (
              <button key={o.v} className={'chip' + (kompensasi === o.v ? ' active' : '')} onClick={() => setKompensasi(o.v)}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
        <div className="field mt-3">
          <label>{t('det.reason')}</label>
          <input className="input" value={alasan} onChange={(e) => setAlasan(e.target.value)} />
        </div>
      </BottomSheet>

      <NumberSheet
        open={!!editItem}
        title={t('det.qtyReturn')}
        value={editItem ? returQty[editItem] ?? 0 : 0}
        allowDecimal
        onClose={() => setEditItem(null)}
        onConfirm={(n) => {
          if (editItem) {
            const item = items.find((i) => i.id === editItem);
            const max = item?.qty ?? 0;
            setReturQty((r) => ({ ...r, [editItem]: Math.min(n, max) }));
          }
          setEditItem(null);
        }}
      />

      <ConfirmDialog
        open={voidOpen}
        title={t('det.voidTitle')}
        message={t('det.voidMsg')}
        confirmLabel={t('det.voidBtn')}
        danger
        onConfirm={() => {
          try {
            voidSale(sale.id, user?.id ?? '', 'Dibatalkan dari detail');
            toast.success(t('det.voided'));
          } catch (e) {
            toast.danger(String(e));
          }
        }}
        onClose={() => setVoidOpen(false)}
      />
    </div>
  );
}
