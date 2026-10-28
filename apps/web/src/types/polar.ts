export type PolarProduct = {
  id: string;
  name: string;
  description: string | null;
  isRecurring: boolean;
  recurringInterval: string | null;
  isArchived: boolean;
  prices: Array<{
    id: string;
    amountType: string;
    priceAmount: number | null;
    priceCurrency: string;
  }>;
  createdAt: string;
};
