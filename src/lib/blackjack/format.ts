export function formatMoney(n: number): string {
  const rounded = Math.round(n * 2) / 2;
  const abs = Math.abs(rounded);
  const body = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  if (rounded < 0) return `-$${body}`;
  return `$${body}`;
}

export function signedMoney(n: number): string {
  if (n > 0) return `+${formatMoney(n)}`;
  return formatMoney(n);
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}
