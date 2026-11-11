const rupiahFmt = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format integer rupiah -> "1.250.000" */
export function formatNumber(n: number): string {
  if (!isFinite(n)) return '0';
  return rupiahFmt.format(Math.round(n));
}

/** Format integer rupiah -> "Rp 1.250.000" */
export function formatRupiah(n: number): string {
  return 'Rp ' + formatNumber(n);
}

/** Format without "Rp" prefix, for compact display */
export function formatRupiahShort(n: number): string {
  return formatNumber(n);
}

/** Parse input user (boleh "1.250.000", "1250000", "Rp 1.250.000") -> integer */
export function parseRupiahInput(value: string): number {
  const clean = value.replace(/[^0-9]/g, '');
  if (!clean) return 0;
  return parseInt(clean, 10);
}

/** Format qty desimal gaya Indonesia: 2,5 (tanpa nol berlebih) */
export function formatQty(value: number): string {
  if (!isFinite(value)) return '0';
  const s = value.toFixed(3);
  const trimmed = s.replace(/0+$/, '').replace(/[.,]$/, '');
  return trimmed.replace('.', ',');
}

/** Parse qty input Indonesia ("2,5") -> number */
export function parseQtyInput(value: string): number {
  const clean = value.replace(',', '.').replace(/[^0-9.]/g, '');
  if (!clean) return 0;
  const n = parseFloat(clean);
  return isFinite(n) ? n : 0;
}

export function roundTo(value: number, decimals = 3): number {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

/** Format tanggal singkat: 12 Nov 2026 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format tanggal + jam: 12 Nov 2026 14.30 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time.replace(':', '.')}`;
}

/** Format jam saja: 14.30 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isLate(jatuhTempo: string | null): boolean {
  if (!jatuhTempo) return false;
  return jatuhTempo < todayIso();
}

export function daysLate(jatuhTempo: string | null): number {
  if (!jatuhTempo) return 0;
  const a = new Date(todayIso());
  const b = new Date(jatuhTempo);
  const diff = Math.floor((a.getTime() - b.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

/** Initials for avatar */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
