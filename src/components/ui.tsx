import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatNumber, parseRupiahInput } from '../lib/format';
import { useToast } from '../stores/toast';
import { IconBack, IconX } from './icons';

/* ================= AppBar ================= */
export function AppBar({
  title,
  subtitle,
  onBack,
  right,
  light,
  noSticky,
  hideBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  light?: boolean;
  noSticky?: boolean;
  hideBack?: boolean;
}) {
  const nav = useNavigate();
  return (
    <div className={'appbar' + (light ? ' appbar-light' : '')} style={noSticky ? { position: 'relative' } : undefined}>
      <div className="appbar-inner">
        {hideBack ? null : (
          <button
            className="btn btn-icon btn-ghost"
            style={{ color: light ? 'var(--text)' : '#fff', minWidth: 40 }}
            onClick={() => (onBack ? onBack() : nav(-1))}
            aria-label="Kembali"
          >
            <IconBack size={22} />
          </button>
        )}
        <div className="grow">
          <div className="appbar-title">{title}</div>
          {subtitle ? <div className="appbar-sub">{subtitle}</div> : null}
        </div>
        {right}
      </div>
    </div>
  );
}

/* ================= Bottom Sheet ================= */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grabber" />
        {title ? (
          <div className="row-between" style={{ padding: '0 16px 8px' }}>
            <div className="h3">{title}</div>
            <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Tutup">
              <IconX size={20} />
            </button>
          </div>
        ) : null}
        <div className="sheet-body">{children}</div>
        {footer ? <div style={{ padding: 16, borderTop: '1px solid var(--border-light)' }}>{footer}</div> : null}
      </div>
    </>
  );
}

/* ================= Modal ================= */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title ? <div className="h3 mb-3">{title}</div> : null}
        {children}
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya',
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="row">
          <button className="btn btn-ghost grow" onClick={onClose}>
            Batal
          </button>
          <button
            className={'btn grow ' + (danger ? 'btn-danger' : 'btn-primary')}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="muted" style={{ margin: 0 }}>
        {message}
      </p>
    </Modal>
  );
}

/* ================= Numpad ================= */
export function Numpad({
  onDigit,
  onBackspace,
  onClear,
  onDecimal,
  showDecimal,
  onQuick,
  quickLabels,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onDecimal?: () => void;
  showDecimal?: boolean;
  onQuick?: (label: string) => void;
  quickLabels?: string[];
}) {
  return (
    <div>
      {quickLabels && quickLabels.length > 0 ? (
        <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
          {quickLabels.map((q) => (
            <button key={q} className="chip" onClick={() => onQuick?.(q)}>
              {q}
            </button>
          ))}
        </div>
      ) : null}
      <div className="numpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="numpad-key" onClick={() => onDigit(d)}>
            {d}
          </button>
        ))}
        {showDecimal ? (
          <button className="numpad-key" onClick={onDecimal}>
            ,
          </button>
        ) : (
          <button className="numpad-key" onClick={onClear}>
            C
          </button>
        )}
        <button className="numpad-key" onClick={() => onDigit('0')}>
          0
        </button>
        <button className="numpad-key danger" onClick={onBackspace}>
          ⌫
        </button>
      </div>
      {showDecimal ? (
        <button className="text-btn mt-2" onClick={onClear}>
          Hapus semua
        </button>
      ) : null}
    </div>
  );
}

/* ================= Number sheet ================= */
export function NumberSheet({
  open,
  title,
  value,
  allowDecimal,
  quickAmounts,
  prefix,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  value: number;
  allowDecimal?: boolean;
  quickAmounts?: number[];
  prefix?: string;
  onClose: () => void;
  onConfirm: (n: number) => void;
}) {
  const [text, setText] = useState<string>('');
  useEffect(() => {
    if (open) setText(value ? String(value) : '');
  }, [open, value]);

  const display = text === '' ? '0' : text;

  function press(d: string) {
    if (d === ',' ) {
      if (text.includes('.')) return;
      setText((t) => (t === '' ? '0.' : t + '.'));
      return;
    }
    setText((t) => {
      if (t.length > 15) return t;
      return t + d;
    });
  }
  function back() {
    setText((t) => t.slice(0, -1));
  }
  function clear() {
    setText('');
  }
  function confirm() {
    const n = parseFloat(text.replace(',', '.'));
    onConfirm(isFinite(n) ? n : 0);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <button className="btn btn-primary btn-lg btn-block" onClick={confirm}>
          Simpan
        </button>
      }
    >
      <div
        style={{
          textAlign: 'right',
          fontSize: 40,
          fontWeight: 800,
          padding: '8px 4px 16px',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: -1,
        }}
      >
        {prefix ? <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>{prefix} </span> : null}
        {allowDecimal ? display.replace('.', ',') : formatNumber(parseRupiahInput(display))}
      </div>
      <Numpad
        onDigit={press}
        onBackspace={back}
        onClear={clear}
        showDecimal={allowDecimal}
        onDecimal={() => press(',')}
        quickLabels={quickAmounts ? quickAmounts.map((q) => 'Rp ' + formatNumber(q)) : undefined}
        onQuick={(label) => {
          const n = parseRupiahInput(label);
          setText(String(n));
        }}
      />
    </BottomSheet>
  );
}

/* ================= Segmented ================= */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={'seg-item' + (o.value === value ? ' active' : '')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ================= Switch ================= */
export function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      className={'switch' + (on ? ' on' : '')}
      disabled={disabled}
      onClick={() => onChange(!on)}
      aria-checked={on}
      role="switch"
    />
  );
}

/* ================= Field ================= */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

/* ================= Empty state ================= */
export function EmptyState({
  title,
  message,
  action,
  image,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  image?: string;
}) {
  return (
    <div className="empty">
      {image ? <img src={image} alt="" className="empty-img" /> : null}
      <div className="empty-title">{title}</div>
      {message ? <div className="small muted">{message}</div> : null}
      {action}
    </div>
  );
}

/* ================= Toast host ================= */
export function ToastHost() {
  const items = useToast((s) => s.items);
  return (
    <div className="toast-wrap">
      {items.map((t) => {
        const cls =
          t.kind === 'success' ? 'toast-success' : t.kind === 'danger' ? 'toast-danger' : t.kind === 'warning' ? 'toast-warning' : '';
        return (
          <div key={t.id} className={'toast ' + cls}>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

/* ================= Money text ================= */
export function Money({ value, size = 'md', className = '' }: { value: number; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const cls = size === 'sm' ? 'money-sm' : size === 'lg' ? 'money-lg' : size === 'xl' ? 'money-xl' : '';
  return <span className={'money ' + cls + ' ' + className}>{'Rp ' + formatNumber(value)}</span>;
}

/* ================= Banner (hero) ================= */
export function HeroBanner({
  image,
  title,
  subtitle,
  onClick,
}: {
  image: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <div className="hero-banner" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <img src={image} alt="" />
      <div className="hero-banner-content">
        <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
        {subtitle ? <div className="small" style={{ color: '#cbd5e1' }}>{subtitle}</div> : null}
      </div>
    </div>
  );
}
