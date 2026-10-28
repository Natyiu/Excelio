import { FEEDBACK_CATEGORIES } from "@/lib/feedback-categories";

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];

export type FeedbackDialogProps = {
  /** When provided, dialog is controlled and no trigger is rendered (e.g. for dropdown use) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
