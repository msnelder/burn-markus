export function formatUSD(
  amount: number,
  options?: Intl.NumberFormatOptions | undefined
): string {
  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencySign: "accounting",
    ...options,
  }).format(amount);
}
