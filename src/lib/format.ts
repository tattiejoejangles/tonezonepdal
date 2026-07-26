const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return gbp.format(value);
}

export interface Savings {
  amount: number;
  percent: number;
}

/** Money and percentage saved by buying `alternativePrice` instead of `originalPrice`. */
export function calculateSavings(originalPrice: number, alternativePrice: number): Savings {
  const amount = Math.max(0, originalPrice - alternativePrice);
  const percent = originalPrice > 0 ? Math.round((amount / originalPrice) * 100) : 0;
  return { amount, percent };
}
