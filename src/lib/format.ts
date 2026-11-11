import { getLang } from './locale';

function numLocale(): string {
  return getLang() === 'id' ? 'id-ID' : 'en-US';
}

function intFmt(): Intl.NumberFormat {
  return new Intl.NumberFormat(numLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format integer with thousands separator (EN: 1,250,000 · ID: 1.250.000) */
export function formatNumber(n: number): string {
  if (!isFinite(n)) return '0';
  return intFmt().format(Math.round(n));
}

/** Format integer rupiah -> "Rp 1,250,000" (EN) / "Rp 1.250.000" (ID) */
export function formatRupiah(n: number): string {
  return 'Rp ' + formatNumber(n);
}

/** Format without "Rp" prefix, for compact display */
export function formatRupiahShort(n: number): string {
  return formatNumber(n);
}

/** Parse user input ("1,250,000", "1250000", "Rp 1.250.000") -> integer */
export function parseRupiahInput(value: string): number {
  const clean = value.replace(/[^0-9]/g, '');
  if (!clean) return 0;
  return parseInt(clean, 10);
}

/** Format decimal qty (EN: 2.5 · ID: 2,5, no trailing zeros) */
export function formatQty(value: number): string {
  if (!isFinite(value)) return '0';
  const s = value.toFixed(3);
  const trimmed = s.replace(/0+$/, '').replace(/[.,]$/, '');
  return getLang() === 'id' ? trimmed.replace('.', ',') : trimmed;
}

/** Parse qty input ("2,5" or "2.5") -> number */
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

/** Short date (EN: Nov 12, 2026 · ID: 12 Nov 2026) */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(numLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Date + time (EN: Nov 12, 2:30 PM · ID: 12 Nov, 14.30) */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  if (getLang() === 'id') {
    const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time.replace(':', '.')}`;
  }
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Time only (EN: 2:30 PM · ID: 14.30) */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  if (getLang() === 'id') {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  }
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
