import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomer, getSale, getSaleItems, getStoreProfile, saveDelivery } from '../../lib/repo';
import { formatDateTime, formatQty, formatRupiah } from '../../lib/format';
import { shareReceipt, shareSuratJalan, shareText, whatsappLink, openExternal } from '../../lib/receipt';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { BottomSheet, Money } from '../../components/ui';
import { IconCheck, IconShare, IconTruck } from '../../components/icons';

export default function SuccessScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const user = useSession((s) => s.user);
  const sale = id ? getSale(id) : null;
  const items = useMemo(() => (id ? getSaleItems(id) : []), [id]);
  const store = getStoreProfile();
  const customer = sale?.customer_id ? getCustomer(sale.customer_id) : null;
  const [sjOpen, setSjOpen] = useState(false);
  const [alamat, setAlamat] = useState(customer?.alamat ?? '');
  const [sopir, setSopir] = useState('');

  if (!sale) {
    return (
      <div className="screen">
        <div className="page center-text">
          <div className="h2">Transaksi tidak ditemukan</div>
          <button className="btn btn-primary mt-4" onClick={() => nav('/pos')}>Kembali ke Kasir</button>
        </div>
      </div>
    );
  }

  const data = {
    store: {
      nama: store?.nama ?? 'Kokoh',
      alamat: store?.alamat ?? '',
      telp: store?.telp ?? '',
      footer_nota: store?.footer_nota ?? 'Terima kasih',
    },
    sale,
    items,
    customer_nama: customer?.nama ?? 'Umum',
    kasir_nama: user?.nama ?? '',
    metode: sale.status === 'TEMPO' ? 'TEMPO' : sale.status === 'DP' ? 'DP (sebagian)' : 'TUNAI',
    dibayar: sale.total_bayar,
  };

  async function doShare() {
    try {
      await shareReceipt(data);
    } catch (e) {
      toast.danger('Gagal membagikan nota: ' + String(e));
    }
  }

  async function doWa() {
    if (!customer?.telp) {
      toast.warning('Pelanggan belum punya nomor WA');
      return;
    }
    const text = `*${store?.nama ?? 'Kokoh'}*\nNota: ${sale!.no_nota}\nTanggal: ${formatDateTime(sale!.tanggal)}\nTotal: ${formatRupiah(sale!.total)}\n${sale!.sisa > 0 ? `Sisa: ${formatRupiah(sale!.sisa)}\n` : ''}Terima kasih.`;
    try {
      await shareText(text);
      await openExternal(whatsappLink(customer.telp, text));
    } catch {
      await openExternal(whatsappLink(customer.telp, text));
    }
  }

  return (
    <div className="screen">
      <div className="safe-top" style={{ background: 'var(--secondary)', padding: '32px 24px', textAlign: 'center', color: '#fff' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <IconCheck size={38} />
        </div>
        <div className="h2 mt-3" style={{ color: '#fff' }}>Transaksi Berhasil</div>
        <div className="small" style={{ color: '#cbd5e1' }}>{sale.no_nota}</div>
        <div className="money money-xl mt-2" style={{ color: '#fff' }}>{formatRupiah(sale.total)}</div>
      </div>

      <div className="page">
        <div className="card">
          {items.map((it) => (
            <div key={it.id} className="row-between small mb-2">
              <span className="truncate grow">
                {it.nama_produk} · {formatQty(it.qty)} {it.satuan}
              </span>
              <span className="money money-sm">{formatRupiah(it.subtotal)}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="row-between">
            <span className="strong">Total</span>
            <Money value={sale.total} size="lg" />
          </div>
          {sale.sisa > 0 ? (
            <div className="row-between mt-2">
              <span className="small" style={{ color: 'var(--warning)' }}>Sisa piutang (jatuh tempo {sale.jatuh_tempo})</span>
              <span className="money money-sm money-danger">{formatRupiah(sale.sisa)}</span>
            </div>
          ) : null}
        </div>

        <div className="col mt-4">
          <button className="btn btn-primary btn-lg btn-block" onClick={() => nav('/pos', { replace: true })}>
            Transaksi Baru
          </button>
          <button className="btn btn-block" onClick={doShare}>
            <IconShare size={18} /> Cetak / Bagikan Nota (PDF)
          </button>
          <button className="btn btn-block" onClick={doWa}>
            <IconShare size={18} /> Kirim ke WhatsApp
          </button>
          <button className="btn btn-block" onClick={() => setSjOpen(true)}>
            <IconTruck size={18} /> Buat Surat Jalan
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => nav('/pos/history/' + sale.id)}>
            Lihat Detail Transaksi
          </button>
        </div>
      </div>

      <BottomSheet
        open={sjOpen}
        onClose={() => setSjOpen(false)}
        title="Surat Jalan"
        footer={
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={async () => {
              try {
                saveDelivery({
                  sale_id: sale.id,
                  alamat_kirim: alamat || customer?.alamat || '',
                  sopir,
                  status: 'BELUM_DIKIRIM',
                });
                await shareSuratJalan({ ...data, sale: { ...sale, catatan: (sale.catatan ? sale.catatan + ' · ' : '') + 'Sopir: ' + (sopir || '-') + ' · Alamat: ' + (alamat || '-') } });
                setSjOpen(false);
                toast.success('Surat jalan dibuat');
              } catch (e) {
                toast.danger('Gagal: ' + String(e));
              }
            }}
          >
            Cetak / Bagikan Surat Jalan
          </button>
        }
      >
        <div className="col">
          <div className="field">
            <label>Alamat Kirim</label>
            <input className="input" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Alamat proyek / rumah" />
          </div>
          <div className="field">
            <label>Nama Sopir</label>
            <input className="input" value={sopir} onChange={(e) => setSopir(e.target.value)} placeholder="Nama sopir" />
          </div>
          <div className="small muted">Surat jalan mencetak daftar barang tanpa harga.</div>
        </div>
      </BottomSheet>
    </div>
  );
}
