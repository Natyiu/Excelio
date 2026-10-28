export type JoinWaitlistResult =
  | { success: true }
  | { success: false; error: string };
