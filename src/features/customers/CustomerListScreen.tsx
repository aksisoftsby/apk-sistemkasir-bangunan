import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import { listCustomers, listPriceTiers, listReceivables, payReceivable, saveCustomer } from '../../lib/repo';
import { daysLate, formatRupiah, isLate } from '../../lib/format';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, EmptyState, Field, NumberSheet, Segmented } from '../../components/ui';
import { IconPlus, IconSearch } from '../../components/icons';

export default function CustomerListScreen() {
  const ver = useDbVersion();
  const nav = useNavigate();
  const user = useSession((s) => s.user);
  const [tab, setTab] = useState<'CUSTOMER' | 'PIUTANG'>('CUSTOMER');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [payRow, setPayRow] = useState<{ id: string; sisa: number } | null>(null);

  const customers = useMemo(() => listCustomers(search), [search, ver]);
  const receivables = useMemo(() => listReceivables(), [ver]);
  const tiers = useMemo(() => listPriceTiers(), [ver]);
  const totalPiutang = receivables.reduce((a, r) => a + r.sisa, 0);
  const telat = receivables.filter((r) => isLate(r.jatuh_tempo)).length;

  const [nama, setNama] = useState('');
  const [telp, setTelp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [proyek, setProyek] = useState('');
  const [tier, setTier] = useState('t-eceran');
  const [limit, setLimit] = useState(0);

  function resetForm() {
    setNama('');
    setTelp('');
    setAlamat('');
    setProyek('');
    setTier('t-eceran');
    setLimit(0);
  }

  function submitCustomer() {
    if (!nama.trim()) {
      toast.danger('Nama pelanggan wajib diisi');
      return;
    }
    saveCustomer({
      kode: '',
      nama: nama.trim(),
      telp: telp.trim(),
      alamat: alamat.trim(),
      proyek: proyek.trim(),
      price_tier_id: tier,
      limit_kredit: limit,
      catatan: '',
    });
    toast.success('Pelanggan ditambahkan');
    resetForm();
    setAddOpen(false);
  }

  return (
    <div className="screen">
      <AppBar
        title="Pelanggan"
        subtitle={tab === 'PIUTANG' ? `Total piutang ${formatRupiah(totalPiutang)}` : `${customers.length} pelanggan`}
        hideBack
        right={
          tab === 'CUSTOMER' ? (
            <button className="btn btn-icon btn-ghost" style={{ color: '#fff' }} onClick={() => setAddOpen(true)} aria-label="Tambah">
              <IconPlus size={22} />
            </button>
          ) : undefined
        }
      />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 140 }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'CUSTOMER', label: 'Pelanggan' },
              { value: 'PIUTANG', label: `Piutang (${receivables.length})` },
            ]}
          />

          <div className="search-wrap mt-3">
            <IconSearch size={18} className="search-icon" />
            <input className="search-input" placeholder="Cari pelanggan…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {tab === 'CUSTOMER' ? (
            customers.length === 0 ? (
              <EmptyState
                title="Belum ada pelanggan"
                message="Tambahkan pelanggan untuk transaksi tempo/kasbon."
                action={<button className="btn btn-primary" onClick={() => setAddOpen(true)}>Tambah Pelanggan</button>}
              />
            ) : (
              <div className="list mt-3">
                {customers.map((c) => (
                  <div key={c.id} className="list-row clickable" onClick={() => nav('/customers/' + c.id)}>
                    <div className="avatar">{c.nama.slice(0, 1).toUpperCase()}</div>
                    <div className="grow">
                      <div className="semibold truncate">{c.nama}</div>
                      <div className="small muted">{c.telp || c.alamat || 'Pelanggan'}</div>
                    </div>
                    {c.price_tier_id === 't-grosir' ? <span className="badge badge-neutral">Grosir</span> : c.price_tier_id === 't-kontraktor' ? <span className="badge badge-primary">Kontraktor</span> : null}
                  </div>
                ))}
              </div>
            )
          ) : (
            <>
              {telat > 0 ? (
                <div className="card mt-3" style={{ borderColor: 'var(--danger)', background: 'var(--danger-bg)' }}>
                  <div className="row-between">
                    <span className="semibold" style={{ color: 'var(--danger)' }}>{telat} nota telat jatuh tempo</span>
                    <span className="money money-sm money-danger">{formatRupiah(totalPiutang)}</span>
                  </div>
                </div>
              ) : null}
              {receivables.length === 0 ? (
                <EmptyState title="Tidak ada piutang" message="Semua transaksi sudah lunas." />
              ) : (
                <div className="list mt-3">
                  {receivables.map((r) => (
                    <div key={r.sale_id} className="list-row">
                      <div className="grow" onClick={() => nav('/pos/history/' + r.sale_id)}>
                        <div className="row-between">
                          <span className="semibold truncate">{r.customer_nama}</span>
                          <span className="money money-sm money-danger">{formatRupiah(r.sisa)}</span>
                        </div>
                        <div className="small muted">{r.no_nota}{r.proyek ? ' · ' + r.proyek : ''}</div>
                        <div className="mt-1">
                          {r.jatuh_tempo ? (
                            isLate(r.jatuh_tempo) ? (
                              <span className="badge badge-danger">Telat {daysLate(r.jatuh_tempo)} hari</span>
                            ) : (
                              <span className="badge badge-warning">Jatuh tempo {r.jatuh_tempo}</span>
                            )
                          ) : (
                            <span className="badge badge-neutral">Tempo</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setPayRow({ id: r.sale_id, sisa: r.sisa })}
                      >
                        Bayar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Pelanggan Baru"
        footer={<button className="btn btn-primary btn-lg btn-block" onClick={submitCustomer}>Simpan Pelanggan</button>}
      >
        <div className="col">
          <Field label="Nama *">
            <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama pelanggan / toko" />
          </Field>
          <Field label="No. WA / Telp">
            <input className="input" value={telp} onChange={(e) => setTelp(e.target.value)} placeholder="0812..." inputMode="tel" />
          </Field>
          <Field label="Alamat">
            <input className="input" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Alamat" />
          </Field>
          <Field label="Proyek / Lokasi">
            <input className="input" value={proyek} onChange={(e) => setProyek(e.target.value)} placeholder="Contoh: Renovasi Ruko Jl. Melati" />
          </Field>
          <Field label="Tingkat Harga">
            <div className="select-wrap">
              <select className="select" value={tier} onChange={(e) => setTier(e.target.value)}>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>{t.nama}</option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="Limit Kredit (Rp)">
            <input className="input num" inputMode="numeric" value={limit ? limit.toLocaleString('id-ID') : ''} onChange={(e) => setLimit(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))} placeholder="0 = tanpa limit" />
          </Field>
        </div>
      </BottomSheet>

      <NumberSheet
        open={!!payRow}
        title="Terima Pembayaran"
        value={payRow?.sisa ?? 0}
        prefix="Rp"
        onClose={() => setPayRow(null)}
        onConfirm={(n) => {
          if (payRow) {
            try {
              payReceivable(payRow.id, n, 'TUNAI', user?.id ?? '');
              toast.success('Pembayaran diterima');
            } catch (e) {
              toast.danger(String(e));
            }
          }
          setPayRow(null);
        }}
      />
    </div>
  );
}
