export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Simple non-cryptographic hash for local PIN storage. */
export function hashPin(pin: string): string {
  let h = 5381;
  const salt = 'kokoh::';
  const s = salt + pin;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0') + ':' + salt.length;
}

export function verifyPin(pin: string, stored: string): boolean {
  return hashPin(pin) === stored;
}
