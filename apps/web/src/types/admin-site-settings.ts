export type WaitlistFormSettings = {
  waitlistMode: boolean;
  waitlistTitle: string;
  waitlistHeadline: string;
  waitlistDescription: string;
  waitlistButtonText: string;
  waitlistSuccessMessage: string;
  waitlistShowName: boolean;
  waitlistShowCompany: boolean;
};

export type CountdownFormSettings = {
  countdownMode: boolean;
  countdownTarget: string; // YYYY-MM-DDTHH:mm for datetime-local
  countdownTitle: string;
  countdownHeadline: string;
  countdownDescription: string;
  countdownEndMessage: string;
};
