import { create } from 'zustand';

export interface SessionUser {
  id: string;
  nama: string;
  role: 'OWNER' | 'ADMIN' | 'KASIR';
}

interface SessionState {
  user: SessionUser | null;
  shiftId: string | null;
  setUser: (u: SessionUser | null) => void;
  setShift: (id: string | null) => void;
  logout: () => void;
}

const KEY = 'kokoh_session_v1';

function load(): { user: SessionUser | null; shiftId: string | null } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { user: null, shiftId: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, shiftId: null };
  }
}

function persist(user: SessionUser | null, shiftId: string | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ user, shiftId }));
  } catch {
    /* ignore */
  }
}

const init = load();

export const useSession = create<SessionState>((set, get) => ({
  user: init.user,
  shiftId: init.shiftId,
  setUser: (u) => {
    persist(u, get().shiftId);
    set({ user: u });
  },
  setShift: (id) => {
    persist(get().user, id);
    set({ shiftId: id });
  },
  logout: () => {
    persist(null, null);
    set({ user: null, shiftId: null });
  },
}));

export function isOwner(): boolean {
  return useSession.getState().user?.role === 'OWNER';
}

export function canManage(): boolean {
  const r = useSession.getState().user?.role;
  return r === 'OWNER' || r === 'ADMIN';
}
