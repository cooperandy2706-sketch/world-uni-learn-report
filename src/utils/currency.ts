/**
 * Formats a numeric amount into a localized currency string.
 * @param amount The numeric amount to format
 * @param currencyCode The 3-letter currency code (e.g., 'GHS', 'USD', 'EUR')
 * @returns Formatted string (e.g., 'GHS 1,500.00', '$1,500.00')
 */
export function formatCurrency(amount: number | string, currencyCode: string = 'GHS'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currencyCode} 0.00`;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(num);
  } catch (err) {
    // Fallback if currency code is invalid or not supported by browser
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
