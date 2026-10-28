import type { getAnalytics } from "@/lib/actions/dashboard";

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
