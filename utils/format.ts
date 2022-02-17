export function formatUSD(
  amount: number,
  options?: Intl.NumberFormatOptions | undefined
): string {
  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    ...options,
  }).format(amount);
}
