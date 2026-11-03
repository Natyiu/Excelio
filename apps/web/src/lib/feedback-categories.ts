export const FEEDBACK_CATEGORIES = [
  { value: "feature-request", label: "Feature Request" },
  { value: "bug", label: "Bug Report" },
  { value: "improvement", label: "Improvement" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
] as const;

/** Longest message a learner can send. */
export const FEEDBACK_MAX_LENGTH = 2000;
