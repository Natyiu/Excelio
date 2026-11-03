import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@Batman/auth";
import { getDashboardStats } from "@/lib/actions/excel-learning";

/**
 * Once-per-request versions of lookups that the dashboard layout and its pages all make.
 * A page and its layout render in the same request, so these share one database round
 * trip instead of repeating it (each getSession is a database query).
 */
export const getSessionCached = cache(async () => auth.api.getSession({ headers: await headers() }));

export const getDashboardStatsCached = cache(() => getDashboardStats());
