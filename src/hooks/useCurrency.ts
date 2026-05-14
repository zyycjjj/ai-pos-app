export function useCurrency(currency = 'USD') {
  return (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
}
