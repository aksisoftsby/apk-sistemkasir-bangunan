import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserByPin, getOpenShift, listUsers } from '../../lib/repo';
import { hashPin } from '../../lib/id';
import { useSession } from '../../stores/session';
import { toast } from '../../stores/toast';
import { formatDate } from '../../lib/format';

export default function LoginScreen() {
  const nav = useNavigate();
  const setUser = useSession((s) => s.setUser);
  const setShift = useSession((s) => s.setShift);
  const users = listUsers();
  const [selected, setSelected] = useState<string>(users[0]?.id ?? '');
  const [pin, setPin] = useState('');

  function press(d: string) {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length >= 4) {
      const found = getUserByPin(hashPin(next));
      if (found && (users.find((u) => u.id === selected) ? found.id === selected : true)) {
        const shift = getOpenShift(found.id);
        setUser({ id: found.id, nama: found.nama, role: found.role as 'OWNER' });
        setShift(shift?.id ?? null);
        toast.success(`Halo, ${found.nama}`);
        nav('/pos', { replace: true });
      } else if (next.length === 6) {
        toast.danger('PIN salah');
        setPin('');
      }
    }
  }

  function back() {
    setPin((p) => p.slice(0, -1));
  }

  const sel = users.find((u) => u.id === selected);

  return (
    <div className="screen" style={{ background: 'var(--secondary)' }}>
      <div className="safe-top" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <img src="./assets/logo.webp" alt="Kokoh" style={{ width: 96, height: 96, borderRadius: 22, margin: '0 auto' }} />
          <div className="h1 mt-3" style={{ color: '#fff' }}>Kokoh</div>
          <div className="small" style={{ color: '#cbd5e1' }}>Kasir Toko Bangunan</div>
          <div className="tiny" style={{ color: '#94a3b8', marginTop: 4 }}>{formatDate(new Date().toISOString())}</div>
        </div>

        {users.length > 1 ? (
          <div className="row wrap mt-4" style={{ justifyContent: 'center', gap: 8 }}>
            {users.map((u) => (
              <button
                key={u.id}
                className={'chip' + (u.id === selected ? ' active' : '')}
                style={u.id === selected ? { background: '#fff', color: 'var(--secondary)', borderColor: '#fff' } : { background: 'transparent', color: '#cbd5e1', borderColor: '#475569' }}
                onClick={() => {
                  setSelected(u.id);
                  setPin('');
                }}
              >
                {u.nama}
              </button>
            ))}
          </div>
        ) : null}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
            {sel ? `Masuk sebagai ${sel.nama}` : 'Masukkan PIN'}
          </div>
        </div>

        <div className="pin-dots">
          {[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, pin.length)).map((i) => (
            <div key={i} className={'pin-dot' + (i < pin.length ? ' filled' : '')} />
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div className="numpad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} className="numpad-key" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)', color: '#fff' }} onClick={() => press(d)}>
                {d}
              </button>
            ))}
            <button className="numpad-key" style={{ background: 'transparent', borderColor: 'transparent', color: '#94a3b8' }} onClick={() => setPin('')}>
              C
            </button>
            <button className="numpad-key" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)', color: '#fff' }} onClick={() => press('0')}>
              0
            </button>
            <button className="numpad-key" style={{ background: 'transparent', borderColor: 'transparent', color: '#fff' }} onClick={back}>
              ⌫
            </button>
          </div>
          <div className="tiny center-text mt-3" style={{ color: '#94a3b8' }}>
            Lupa PIN? Hubungi pemilik untuk reset.
          </div>
        </div>
      </div>
    </div>
  );
}
