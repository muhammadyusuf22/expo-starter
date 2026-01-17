/**
 * Currency formatting utilities
 */

/**
 * Format number as Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with thousand separators (for input display)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Parse formatted string back to number
 */
export function parseFormattedNumber(formatted: string): number {
  // Remove all non-numeric characters except minus
  const cleaned = formatted.replace(/[^\d-]/g, "");
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format input as currency while typing
 */
export function formatCurrencyInput(text: string): string {
  const numericValue = text.replace(/\D/g, "");
  if (!numericValue) return "";
  return formatNumber(parseInt(numericValue, 10));
}
