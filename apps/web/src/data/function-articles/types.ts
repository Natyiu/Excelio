export type FunctionCategory = "Summarize" | "Lookup" | "Dynamic arrays" | "Logic" | "Text" | "Dates" | "Statistics" | "Math";

export type FunctionArticle = {
  name: string;
  slug: string;
  category: FunctionCategory;
  /** Finishes the search title: "Excel SUMIFS Function: <hook>". */
  hook: string;
  /** The direct answer, shown first. */
  answer: string;
  /** Who needs this and the real situation the sample data comes from. */
  story: string;
  syntax: string;
  args: [name: string, meaning: string][];
  /** The sample sheet from A1, header row first. */
  data: (string | number)[][];
  /** Every expected value is checked against the formula engine by the tests. */
  examples: { ask: string; formula: string; expected: string | number; explain: string }[];
  exercise: { task: string; expected: string | number; requires: string[]; hint: string; solution: string };
  mistakes: [problem: string, fix: string][];
  tips: string[];
  versus: { name: string; text: string };
  /** Slugs of sibling articles. */
  related: string[];
  /** The guide chapter that teaches this. */
  chapter: string;
};
