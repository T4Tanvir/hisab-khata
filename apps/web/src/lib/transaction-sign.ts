/**
 * Money direction for transaction types. Amounts from the API are always
 * positive bigint-paisa strings; the sign is derived from the type.
 * `saving` (goal contribution) leaves the wallet, so it is an outflow,
 * even though it is not counted as an expense.
 */
const OUTFLOW_TYPES = new Set(['expense', 'loan_out', 'saving']);
const INFLOW_TYPES = new Set(['income', 'loan_in']);

export function isOutflowType(type: string): boolean {
  return OUTFLOW_TYPES.has(type);
}

export function isInflowType(type: string): boolean {
  return INFLOW_TYPES.has(type);
}

/**
 * Amount string to render with `showSign`: negated for outflows (so formatMoney
 * prints "-"), unchanged for inflows ("+") and transfers.
 */
export function signedAmount(amount: string | bigint, type: string): string {
  const value = typeof amount === 'bigint' ? amount : BigInt(amount || '0');
  const abs = value < 0n ? -value : value;
  return (isOutflowType(type) ? -abs : abs).toString();
}
