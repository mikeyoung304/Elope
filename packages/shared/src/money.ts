/**
 * Money conversion utilities
 */

/**
 * Convert dollars to cents
 * @param amount - Dollar amount as number or string
 * @returns Amount in cents as integer
 */
export function toCents(amount: number | string): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(num * 100);
}

/**
 * Convert cents to dollars with fixed 2 decimal places
 * @param cents - Amount in cents
 * @returns Dollar amount as string with 2 decimal places
 */
export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
