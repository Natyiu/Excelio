import type { getOverview } from "@/lib/actions/dashboard";

export type AdminOverview = Awaited<ReturnType<typeof getOverview>>;
