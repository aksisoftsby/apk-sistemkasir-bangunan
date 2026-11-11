import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { formatDateTime, formatQty, formatRupiah } from './format';
import type { Sale, SaleItem } from './types';

export interface ReceiptData {
  store: { nama: string; alamat: string; telp: string; footer_nota: string };
  sale: Sale;
  items: SaleItem[];
  customer_nama: string;
  kasir_nama: string;
  metode: string;
  dibayar: number;
}

function buildPdf(d: ReceiptData, mode: 'nota' | 'surat_jalan'): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: [80, 200], orientation: 'portrait' });
  const w = 80;
  let y = 8;
  const center = (text: string, size: number, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, w / 2, y, { align: 'center' });
  };
  const left = (text: string, size = 9) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    doc.text(text, 6, y);
  };
  const right = (text: string, size = 9, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, w - 6, y, { align: 'right' });
  };

  center(d.store.nama || 'KOKOH', 12, true);
  y += 5;
  if (d.store.alamat) {
    center(d.store.alamat, 7);
    y += 4;
  }
  if (d.store.telp) {
    center('Telp: ' + d.store.telp, 7);
    y += 4;
  }
  y += 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, w - 6, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  if (mode === 'surat_jalan') {
    center('SURAT JALAN', 11, true);
    y += 5;
    left('No.  : ' + d.sale.no_nota.replace('INV', 'SJ'));
    y += 4;
    left('Tgl  : ' + formatDateTime(d.sale.tanggal));
    y += 4;
    left('Kpd  : ' + d.customer_nama);
    y += 4;
    if (d.sale.proyek) {
      left('Proy : ' + d.sale.proyek);
      y += 4;
    }
    if (d.sale.catatan) {
      left('Ket  : ' + d.sale.catatan);
      y += 4;
    }
    y += 2;
    autoTable(doc, {
      startY: y,
      margin: { left: 6, right: 6 },
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fontStyle: 'bold' },
      head: [['Barang', 'Qty', 'Satuan']],
      body: d.items.map((it) => [it.nama_produk, formatQty(it.qty), it.satuan]),
    });
    const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    doc.setFontSize(8);
    doc.text('Penerima,', 6, endY);
    doc.text('Pengirim,', w - 6, endY, { align: 'right' });
    doc.text('(....................)', 6, endY + 16);
    doc.text('(....................)', w - 6, endY + 16, { align: 'right' });
    return doc;
  }

  center('NOTA PENJUALAN', 10, true);
  y += 5;
  left('No.  : ' + d.sale.no_nota);
  y += 4;
  left('Tgl  : ' + formatDateTime(d.sale.tanggal));
  y += 4;
  left('Kasir: ' + d.kasir_nama);
  y += 4;
  left('Kpd  : ' + d.customer_nama);
  y += 4;
  if (d.sale.proyek) {
    left('Proy : ' + d.sale.proyek);
    y += 4;
  }
  y += 1;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, w - 6, y);
  doc.setLineDashPattern([], 0);
  y += 1;

  autoTable(doc, {
    startY: y,
    margin: { left: 6, right: 6 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1 },
    headStyles: { fontStyle: 'bold', fillColor: false, textColor: 0 },
    head: [['Barang', 'Qty', 'Harga', 'Jumlah']],
    body: d.items.map((it) => [
      it.nama_produk,
      formatQty(it.qty) + ' ' + it.satuan,
      formatRupiah(it.harga_satuan),
      formatRupiah(it.subtotal),
    ]),
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 16, halign: 'right' },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 16, halign: 'right' },
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, w - 6, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  left('Subtotal'); right(formatRupiah(d.sale.subtotal)); y += 4;
  if (d.sale.diskon > 0) { left('Diskon'); right('-' + formatRupiah(d.sale.diskon)); y += 4; }
  if (d.sale.ppn > 0) { left('PPN'); right(formatRupiah(d.sale.ppn)); y += 4; }
  if (d.sale.biaya_kirim > 0) { left('Kirim'); right(formatRupiah(d.sale.biaya_kirim)); y += 4; }
  if (d.sale.pembulatan !== 0) { left('Pembulatan'); right(formatRupiah(d.sale.pembulatan)); y += 4; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL', 6, y);
  doc.text(formatRupiah(d.sale.total), w - 6, y, { align: 'right' });
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  left('Bayar (' + d.metode + ')'); right(formatRupiah(d.dibayar)); y += 4;
  if (d.sale.sisa > 0) {
    doc.setFont('helvetica', 'bold');
    left('Sisa (Piutang)'); right(formatRupiah(d.sale.sisa)); y += 4;
    if (d.sale.jatuh_tempo) {
      doc.setFont('helvetica', 'normal');
      left('Jatuh tempo'); right(d.sale.jatuh_tempo); y += 4;
    }
  }
  y += 3;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, w - 6, y);
  doc.setLineDashPattern([], 0);
  y += 5;
  doc.setFontSize(8);
  doc.text(d.store.footer_nota || 'Terima kasih', w / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text('Dicetak via Kokoh', w / 2, y, { align: 'center' });
  return doc;
}

async function saveAndShare(doc: jsPDF, filename: string): Promise<void> {
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1];
  if (Capacitor.isNativePlatform()) {
    const path = 'nota/' + filename;
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    const uri = await Filesystem.getUri({ path, directory: Directory.Cache });
    await Share.share({
      title: filename,
      text: 'Nota dari Kokoh',
      url: uri.uri,
      dialogTitle: 'Bagikan nota',
    });
    return;
  }
  // Web fallback: download
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareReceipt(data: ReceiptData): Promise<void> {
  const doc = buildPdf(data, 'nota');
  await saveAndShare(doc, `nota-${data.sale.no_nota}.pdf`);
}

export async function shareSuratJalan(data: ReceiptData): Promise<void> {
  const doc = buildPdf(data, 'surat_jalan');
  await saveAndShare(doc, `surat-jalan-${data.sale.no_nota}.pdf`);
}

export function buildReceiptDataUri(data: ReceiptData): string {
  return buildPdf(data, 'nota').output('datauristring');
}

export async function shareText(text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title: 'Kokoh', text, dialogTitle: 'Bagikan' });
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      /* ignore */
    }
  }
  await navigator.clipboard.writeText(text);
}

export function whatsappLink(phone: string, text: string): string {
  const clean = phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

/** Buka tautan (WhatsApp) dengan benar di web maupun Android. */
export async function openExternal(url: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
  } catch {
    /* fall through */
  }
  window.open(url, '_blank', 'noopener');
}
