export function formatCents(cents) {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError('amount');
  }
  const digits = BigInt(cents < 0 ? -cents : cents);
  return `${cents < 0 ? '-' : ''}${digits / 100n}.${String(digits % 100n).padStart(2, '0')}`;
}
