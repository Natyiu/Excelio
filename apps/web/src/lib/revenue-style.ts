import type { Plan } from "@/lib/revenue";

/**
 * Plan colours on the revenue dashboard: validated categorical slots 1–3 (blue, orange,
 * aqua), stepped separately for dark mode. Shared by the server page and the client chart.
 */
export const PLAN_STYLE: Record<Plan, { label: string; swatch: string }> = {
  monthly: { label: "Monthly", swatch: "bg-[#2a78d6] dark:bg-[#3987e5]" },
  yearly: { label: "Yearly", swatch: "bg-[#eb6834] dark:bg-[#d95926]" },
  lifetime: { label: "Lifetime", swatch: "bg-[#1baf7a] dark:bg-[#199e70]" },
};
