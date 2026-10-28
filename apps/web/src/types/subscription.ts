export type SubscriptionStatus = {
  isSubscribed: boolean;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  } | null;
};
