import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartData, CartItem } from '../lib/types';

interface CartState extends CartData {
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  setPrice: (key: string, harga: number) => void;
  setDiskon: (key: string, diskon: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCustomer: (id: string | null, nama: string) => void;
  setDiskonNota: (n: number) => void;
  setBiayaKirim: (n: number) => void;
  setProyek: (s: string) => void;
  setCatatan: (s: string) => void;
  loadCart: (data: CartData) => void;
}

const empty: CartData = {
  items: [],
  customer_id: null,
  customer_nama: '',
  diskon: 0,
  biaya_kirim: 0,
  proyek: '',
  catatan: '',
};

function recalc(item: CartItem): CartItem {
  const subtotal = Math.max(0, Math.round(item.qty * item.harga_satuan - item.diskon));
  return { ...item, subtotal };
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      ...empty,
      add: (item) =>
        set((s) => {
          const idx = s.items.findIndex((i) => i.product_unit_id === item.product_unit_id);
          if (idx >= 0) {
            const items = [...s.items];
            const merged = recalc({
              ...items[idx],
              qty: items[idx].qty + item.qty,
            });
            items[idx] = merged;
            return { items };
          }
          return { items: [...s.items, recalc(item)] };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.key === key ? recalc({ ...i, qty: Math.max(0, qty) }) : i,
          ),
        })),
      setPrice: (key, harga) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.key === key ? recalc({ ...i, harga_satuan: Math.max(0, harga) }) : i,
          ),
        })),
      setDiskon: (key, diskon) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.key === key ? recalc({ ...i, diskon: Math.max(0, diskon) }) : i,
          ),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ ...empty }),
      setCustomer: (id, nama) => set({ customer_id: id, customer_nama: nama }),
      setDiskonNota: (n) => set({ diskon: Math.max(0, n) }),
      setBiayaKirim: (n) => set({ biaya_kirim: Math.max(0, n) }),
      setProyek: (s) => set({ proyek: s }),
      setCatatan: (s) => set({ catatan: s }),
      loadCart: (data) => set({ ...data }),
    }),
    {
      name: 'kokoh_cart_v1',
      partialize: (s) => ({
        items: s.items,
        customer_id: s.customer_id,
        customer_nama: s.customer_nama,
        diskon: s.diskon,
        biaya_kirim: s.biaya_kirim,
        proyek: s.proyek,
        catatan: s.catatan,
      }),
    },
  ),
);

export function cartTotals(s: CartData, ppnPersen: number, pembulatan: number) {
  const subtotal = s.items.reduce((a, i) => a + i.subtotal, 0);
  const diskon = Math.min(s.diskon, subtotal);
  const afterDiskon = subtotal - diskon;
  const ppn = Math.round((afterDiskon * ppnPersen) / 100);
  const kotor = afterDiskon + ppn + s.biaya_kirim;
  let total = kotor;
  let bulat = 0;
  if (pembulatan > 1) {
    const rounded = Math.round(kotor / pembulatan) * pembulatan;
    bulat = rounded - kotor;
    total = rounded;
  }
  return { subtotal, diskon, ppn, total, pembulatan: bulat, itemCount: s.items.length };
}
