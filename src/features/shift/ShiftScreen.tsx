import { useMemo, useState } from 'react';
import { useDbVersion } from '../../lib/db';
import {
  closeShift,
  getOpenShift,
  listClosedShifts,
  openShift,
  shiftCashInOut,
  shiftSummary,
} from '../../lib/repo';
import { formatDateTime, formatNumber, formatRupiah } from '../../lib/format';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { AppBar, BottomSheet, ConfirmDialog, Field, Segmented } from '../../components/ui';
import { IconMinus, IconPlus, IconWallet } from '../../components/icons';

type Tipe = 'MASUK' | 'KELUAR';

export default function ShiftScreen() {
  const ver = useDbVersion();
  const user = useSession((s) => s.user);
  const setShift = useSession((s) => s.setShift);

  const shift = user ? getOpenShift(user.id) : null;
  const summary = useMemo(() => (shift ? shiftSummary(shift.id) : null), [shift?.id, ver]);
  const closed = useMemo(() => listClosedShifts(10), [ver]);

  const [openSheet, setOpenSheet] = useState(false);
  const [kasAwal, setKasAwal] = useState(0);
  const [kasSheet, setKasSheet] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [kasFisik, setKasFisik] = useState(0);
  const [tipe, setTipe] = useState<Tipe>('MASUK');
  const [nominal, setNominal] = useState(0);
  const [kategori, setKategori] = useState('Operasional');
  const [catatan, setCatatan] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const selisih = kasFisik - (summary?.sistem ?? 0);

  function bukaKas() {
    if (!user) return;
    const id = openShift(user.id, kasAwal);
    setShift(id);
    setOpenSheet(false);
    toast.success('Kas dibuka');
  }

  function catatKas() {
    if (!user) return;
    if (nominal <= 0) {
      toast.danger('Nominal harus lebih dari 0');
      return;
    }
    shiftCashInOut(shift?.id ?? null, tipe, kategori, nominal, catatan, user.id);
    toast.success('Transaksi kas dicatat');
    setKasSheet(false);
    setNominal(0);
    setCatatan('');
  }

  function tutupKas() {
    if (!shift) return;
    try {
      closeShift(shift.id, kasFisik);
      setShift(null);
      setCloseOpen(false);
      toast.success('Kas ditutup');
    } catch (e) {
      toast.danger(String(e));
    }
  }

  return (
    <div className="screen">
      <AppBar title="Kas & Shift" subtitle={user?.nama} />
      <div className="screen-body">
        <div className="page" style={{ paddingBottom: 140 }}>
          {!shift ? (
            <div className="card">
              <div className="center-text">
                <div className="avatar avatar-navy" style={{ margin: '0 auto', width: 56, height: 56 }}>
                  <IconWallet size={26} />
                </div>
                <div className="h3 mt-3">Kas belum dibuka</div>
                <div className="small muted">Buka kas untuk mencatat uang masuk dan keluar selama shift.</div>
              </div>
              <button className="btn btn-primary btn-lg btn-block mt-4" onClick={() => setOpenSheet(true)}>
                Buka Kas
              </button>
            </div>
          ) : (
            <>
              <div className="card" style={{ background: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
                <div className="small" style={{ color: '#94a3b8' }}>Kas Sistem Saat Ini</div>
                <div className="money money-xl" style={{ color: '#fff' }}>{formatRupiah(summary?.sistem ?? 0)}</div>
                <div className="small mt-1" style={{ color: '#94a3b8' }}>
                  Dibuka {formatDateTime(shift.buka_at)}
                </div>
              </div>

              <div className="kpi-grid mt-3">
                <div className="kpi">
                  <div className="kpi-label">Kas Awal</div>
                  <div className="kpi-value">{formatRupiah(shift.kas_awal)}</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Tunai Penjualan</div>
                  <div className="kpi-value" style={{ color: 'var(--success)' }}>{formatRupiah(summary?.tunai_penjualan ?? 0)}</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Kas Masuk</div>
                  <div className="kpi-value" style={{ color: 'var(--success)' }}>{formatRupiah(summary?.masuk ?? 0)}</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Kas Keluar</div>
                  <div className="kpi-value" style={{ color: 'var(--danger)' }}>{formatRupiah(summary?.keluar ?? 0)}</div>
                </div>
              </div>

              <div className="row mt-3" style={{ gap: 8 }}>
                <button className="btn btn-sm grow" onClick={() => { setTipe('MASUK'); setKategori('Operasional'); setKasSheet(true); }}>
                  <IconPlus size={16} /> Kas Masuk
                </button>
                <button className="btn btn-sm grow" onClick={() => { setTipe('KELUAR'); setKategori('Operasional'); setKasSheet(true); }}>
                  <IconMinus size={16} /> Kas Keluar
                </button>
              </div>

              <button className="btn btn-danger-soft btn-block mt-3" onClick={() => { setKasFisik(summary?.sistem ?? 0); setCloseOpen(true); }}>
                Tutup Kas / Shift
              </button>

              <div className="card mt-3">
                <div className="card-title">Mutasi Kas Shift Ini</div>
                {!summary || summary.transactions.length === 0 ? (
                  <div className="small muted">Belum ada mutasi kas.</div>
                ) : (
                  summary.transactions.map((t) => (
                    <div key={t.id} className="row-between small mb-2">
                      <div className="grow">
                        <div className="semibold" style={{ fontSize: 13 }}>{t.kategori}</div>
                        <div className="tiny faint">{formatDateTime(t.tanggal)}{t.catatan ? ' · ' + t.catatan : ''}</div>
                      </div>
                      <span className={'money money-sm ' + (t.tipe === 'MASUK' ? 'money-success' : 'money-danger')}>
                        {t.tipe === 'MASUK' ? '+' : '-'}{formatRupiah(t.jumlah)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          <div className="card mt-3">
            <div className="card-title">Riwayat Shift</div>
            {closed.length === 0 ? (
              <div className="small muted">Belum ada shift yang ditutup.</div>
            ) : (
              closed.map((s) => (
                <div key={s.id} className="row-between small mb-2">
                  <div>
                    <div>{formatDateTime(s.tutup_at ?? s.buka_at)}</div>
                    <div className="tiny faint">Kas awal {formatRupiah(s.kas_awal)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="money money-sm">{formatRupiah(s.kas_akhir_fisik)}</div>
                    <div className={'tiny ' + (s.selisih === 0 ? 'faint' : s.selisih > 0 ? 'money-success' : 'money-danger')}>
                      {s.selisih === 0 ? 'Pas' : (s.selisih > 0 ? 'Lebih ' : 'Kurang ') + formatNumber(Math.abs(s.selisih))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomSheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        title="Buka Kas"
        footer={<button className="btn btn-primary btn-lg btn-block" onClick={bukaKas}>Buka Kas Sekarang</button>}
      >
        <div className="col">
          <Field label="Kas Awal / Modal Laci (Rp)">
            <input
              className="input num"
              inputMode="numeric"
              value={kasAwal ? formatNumber(kasAwal) : ''}
              onChange={(e) => setKasAwal(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))}
              placeholder="0"
            />
          </Field>
          <div className="row wrap" style={{ gap: 8 }}>
            {[0, 100000, 200000, 500000, 1000000].map((n) => (
              <button key={n} className={'chip' + (kasAwal === n ? ' active' : '')} onClick={() => setKasAwal(n)}>
                {n === 0 ? 'Tanpa modal' : formatNumber(n)}
              </button>
            ))}
          </div>
          <div className="small muted">Kas awal adalah uang tunai di laci saat mulai shift.</div>
        </div>
      </BottomSheet>

      <BottomSheet
        open={kasSheet}
        onClose={() => setKasSheet(false)}
        title={tipe === 'MASUK' ? 'Kas Masuk' : 'Kas Keluar'}
        footer={<button className="btn btn-primary btn-lg btn-block" onClick={catatKas}>Simpan</button>}
      >
        <div className="col">
          <Segmented
            value={tipe}
            onChange={setTipe}
            options={[
              { value: 'MASUK', label: 'Masuk' },
              { value: 'KELUAR', label: 'Keluar' },
            ]}
          />
          <Field label="Nominal (Rp)">
            <input
              className="input num"
              inputMode="numeric"
              value={nominal ? formatNumber(nominal) : ''}
              onChange={(e) => setNominal(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))}
              placeholder="0"
            />
          </Field>
          <Field label="Kategori">
            <div className="select-wrap">
              <select className="select" value={kategori} onChange={(e) => setKategori(e.target.value)}>
                {(tipe === 'MASUK'
                  ? ['Operasional', 'Modal Tambahan', 'Pelunasan Piutang', 'Lainnya']
                  : ['Operasional', 'Bensin / Transport', 'Gaji', 'Beli Perlengkapan', 'Setor Pemilik', 'Lainnya']
                ).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="Catatan">
            <input className="input" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Opsional" />
          </Field>
        </div>
      </BottomSheet>

      <BottomSheet
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Tutup Kas"
        footer={<button className="btn btn-primary btn-lg btn-block" onClick={() => setConfirmClose(true)}>Lanjut Tutup Kas</button>}
      >
        <div className="col">
          <div className="row-between small">
            <span className="muted">Kas menurut sistem</span>
            <span className="money money-sm">{formatRupiah(summary?.sistem ?? 0)}</span>
          </div>
          <Field label="Kas fisik dihitung (Rp)">
            <input
              className="input num"
              inputMode="numeric"
              value={kasFisik ? formatNumber(kasFisik) : ''}
              onChange={(e) => setKasFisik(parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10))}
              placeholder="0"
            />
          </Field>
          <div className="row-between">
            <span className="semibold">Selisih</span>
            <span className={'money money-md ' + (selisih === 0 ? '' : selisih > 0 ? 'money-success' : 'money-danger')}>
              {formatRupiah(selisih)}
            </span>
          </div>
          <div className="small muted">Hitung uang tunai di laci, lalu masukkan jumlahnya.</div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confirmClose}
        title="Tutup shift sekarang?"
        message={`Kas sistem ${formatRupiah(summary?.sistem ?? 0)}, kas fisik ${formatRupiah(kasFisik)}. Shift tidak bisa dibuka kembali.`}
        confirmLabel="Tutup Kas"
        danger
        onConfirm={() => {
          setConfirmClose(false);
          tutupKas();
        }}
        onClose={() => setConfirmClose(false)}
      />
    </div>
  );
}
