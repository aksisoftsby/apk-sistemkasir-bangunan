import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'danger' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  items: ToastItem[];
  show: (message: string, kind?: ToastKind) => void;
  remove: (id: number) => void;
}

let counter = 0;

export const useToast = create<ToastState>((set) => ({
  items: [],
  show: (message, kind = 'info') => {
    const id = ++counter;
    set((s) => ({ items: [...s.items, { id, message, kind }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, 2600);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = {
  show: (m: string, k?: ToastKind) => useToast.getState().show(m, k),
  success: (m: string) => useToast.getState().show(m, 'success'),
  danger: (m: string) => useToast.getState().show(m, 'danger'),
  warning: (m: string) => useToast.getState().show(m, 'warning'),
};
