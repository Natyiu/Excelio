/**
 * Pro pricing. The landing page and the paywall both read from here, so changing a
 * number here changes it everywhere. Which chapters are free lives in pro-access.ts.
 */

/** Pro's monthly price, in dollars. */
export const PRO_MONTHLY = 15;
/** Yearly Pro works out to this per month, billed once a year. */
export const PRO_YEARLY_MONTHLY_RATE = 8;
/** Pro's yearly price, in dollars: 12 months at the yearly rate. */
export const PRO_YEARLY = PRO_YEARLY_MONTHLY_RATE * 12; // 96

/** Lifetime Pro: one payment, no renewals. */
export const PRO_LIFETIME = 199;

export const PRO_YEARLY_PER_MONTH = Math.round((PRO_YEARLY * 100) / 12) / 100; // 8
export const YEARLY_SAVING_PERCENT = Math.round((1 - PRO_YEARLY / (PRO_MONTHLY * 12)) * 100); // 47

/** "$15" for whole dollars, "$49.99" otherwise. */
export const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export type Billing = "monthly" | "yearly" | "lifetime";
