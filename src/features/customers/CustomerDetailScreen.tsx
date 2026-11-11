import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDbVersion } from '../../lib/db';
import { getCustomer, listPriceTiers, listSales, listReceivables, payReceivable, saveCustomer } from '../../lib/repo';
import { daysLate, formatDateTime, formatRupiah, isLate } from '../../lib/format';
import { shareText, whatsappLink, openExternal } from '../../lib/receipt';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, Field, NumberSheet, Segmented } from '../../components/ui';
import { t, useLang } from '../../lib/locale';

export default function CustomerDetailScreen() {
  useLang();
  const ver = useDbVersion();
  const { id } = useParams();
  const nav = useNavigate();
  const user = useSession((s) => s.user);
  const customer = id ? getCustomer(id) : null;
  const sales = useMemo(() => (id ? listSales({ customerId: id, limit: 200 }) : []), [id, ver]);
  const receivables = useMemo(() => (id ? listReceivables(id) : []), [id, ver]);
  const tiers = useMemo(() => listPriceTiers(), [ver]);
  const [tab, setTab] = useState<'RIWAYAT' | 'PIUTANG'>('RIWAYAT');
  const [editOpen, setEditOpen] = useState(false);
  const [payRow, setPayRow] = useState<{ id: string; sisa: number } | null>(null);

  const [nama, setNama] = useState(customer?.nama ?? '');
  const [telp, setTelp] = useState(customer?.telp ?? '');
  const [alamat, setAlamat] = useState(customer?.alamat ?? '');
  const [proyek, setProyek] = useState(customer?.proyek ?? '');
  const [tier, setTier] = useState(customer?.price_tier_id ?? 't-eceran');
  const [limit, setLimit] = useState(customer?.limit_kredit ?? 0);

  if (!customer) {
    return (
      <div className="screen">
        <AppBar title={t('cd.notFound')} />
        <div className="page center-text"><div className="h3">{t('cd.notFound')}</div></div>
      </div>
    );
  }

  const totalPiutang = receivables.reduce((a, r) => a + r.sisa, 0);
  const totalBelanja = sales.filter((s) => s.status !== 'BATAL').reduce((a, s) => a + s.total, 0);

  function simpan() {
    saveCustomer({
      id: customer!.id,
      kode: customer!.kode,
      nama: nama.trim(),
      telp: telp.trim(),
      alamat: alamat.trim(),
      proyek: proyek.trim(),
      price_tier_id: tier,
      limit_kredit: limit,
      catatan: customer!.catatan,
    });
    toast.success(t('cd.updated'));
    setEditOpen(false);
  }

  function kirimWa() {
    if (!customer!.telp) {
      toast.warning(t('cd.noWa'));
      return;
    }
    const text = t('cd.reminder', { name: customer!.nama, v: formatRupiah(totalPiutang) });
    void shareText(text);
    void openExternal(whatsappLink(customer!.telp, text));
  }

  return (
    <div className="screen">
      <AppBar title={customer.nama} subtitle={customer.telp || customer.kode || t('common.generalCustomer')} />
      <div className="screen-body">
        <div className="page">
          <div className="card">
            <div className="row-between">
              <div>
                <div className="small muted">{t('cd.totalPiutang')}</div>
                <div className="money money-lg money-danger">{formatRupiah(totalPiutang)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="small muted">{t('cd.totalSpent')}</div>
                <div className="money money-sm">{formatRupiah(totalBelanja)}</div>
              </div>
            </div>
            <div className="divider" />
            <div className="row-between small">
              <span className="muted">{t('cd.project')}</span>
              <span>{customer.proyek || '-'}</span>
            </div>
            <div className="row-between small mt-1">
              <span className="muted">{t('common.address')}</span>
              <span className="truncate" style={{ maxWidth: '60%' }}>{customer.alamat || '-'}</span>
            </div>
            <div className="row-between small mt-1">
              <span className="muted">{t('cd.limit')}</span>
              <span>{customer.limit_kredit ? formatRupiah(customer.limit_kredit) : t('cd.noLimit')}</span>
            </div>
          </div>

          <div className="row mt-3" style={{ gap: 8 }}>
            <button className="btn btn-sm grow" onClick={() => setEditOpen(true)}>{t('cd.editData')}</button>
            <button className="btn btn-sm grow" onClick={kirimWa}>{t('cd.billWa')}</button>
            <button className="btn btn-sm grow" onClick={() => nav('/pos')}>{t('cd.newSale')}</button>
          </div>

          <div className="mt-4">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'RIWAYAT', label: t('cd.history') },
                { value: 'PIUTANG', label: t('cd.piutang', { n: receivables.length }) },
              ]}
            />
          </div>

          {tab === 'RIWAYAT' ? (
            <div className="list mt-3">
              {sales.length === 0 ? (
                <div className="empty"><div className="empty-title">{t('cd.noSale')}</div></div>
              ) : (
                sales.map((s) => (
                  <div key={s.id} className="list-row clickable" onClick={() => nav('/pos/history/' + s.id)}>
                    <div className="grow">
                      <div className="row-between">
                        <span className="semibold">{s.no_nota}</span>
                        <span className="money money-sm">{formatRupiah(s.total)}</span>
                      </div>
                      <div className="row-between mt-1">
                        <span className="small muted">{formatDateTime(s.tanggal)}</span>
                        <span className={'badge ' + (s.status === 'LUNAS' ? 'badge-success' : s.status === 'BATAL' ? 'badge-danger' : 'badge-warning')}>{s.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="list mt-3">
              {receivables.length === 0 ? (
                <div className="empty"><div className="empty-title">{t('cd.noPiutang')}</div></div>
              ) : (
                receivables.map((r) => (
                  <div key={r.sale_id} className="list-row">
                    <div className="grow">
                      <div className="row-between">
                        <span className="semibold">{r.no_nota}</span>
                        <span className="money money-sm money-danger">{formatRupiah(r.sisa)}</span>
                      </div>
                      <div className="small muted">{r.proyek || ''}</div>
                      {r.jatuh_tempo ? (
                        <span className={'badge ' + (isLate(r.jatuh_tempo) ? 'badge-danger' : 'badge-warning')}>
                          {isLate(r.jatuh_tempo) ? t('cus.lateDays', { n: daysLate(r.jatuh_tempo) }) : t('cus.dueOn', { date: r.jatuh_tempo })}
                        </span>
                      ) : null}
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => setPayRow({ id: r.sale_id, sisa: r.sisa })}>{t('cus.pay')}</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title={t('cd.editTitle')} footer={<button className="btn btn-primary btn-lg btn-block" onClick={simpan}>{t('cd.save')}</button>}>
        <div className="col">
          <Field label={t('common.name')}><input className="input" value={nama} onChange={(e) => setNama(e.target.value)} /></Field>
          <Field label={t('cus.waLabel')}><input className="input" value={telp} onChange={(e) => setTelp(e.target.value)} inputMode="tel" /></Field>
          <Field label={t('common.address')}><input className="input" value={alamat} onChange={(e) => setAlamat(e.target.value)} /></Field>
          <Field label={t('cd.project')}><input className="input" value={proyek} onChange={(e) => setProyek(e.target.value)} /></Field>
          <Field label={t('cus.priceLevel')}>
            <div className="select-wrap">
              <select className="select" value={tier} onChange={(e) => setTier(e.target.value)}>
                {tiers.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
              </select>
            </div>
          </Field>
          <Field label={t('cus.creditLimit')}>
            <input className="input num" inputMode="numeric" value={limit ? limit.toLocaleString('id-ID') : ''} onChange={(e) => setLimit(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))} />
          </Field>
        </div>
      </BottomSheet>

      <NumberSheet
        open={!!payRow}
        title={t('cus.acceptPay')}
        value={payRow?.sisa ?? 0}
        prefix="Rp"
        onClose={() => setPayRow(null)}
        onConfirm={(n) => {
          if (payRow) {
            try {
              payReceivable(payRow.id, n, 'TUNAI', user?.id ?? '');
              toast.success(t('cus.payReceived'));
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
