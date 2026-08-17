export function formatPrice(amount: number, currency: 'INR' = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `${amount}`;
}
