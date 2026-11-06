import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { classifyVisit, SOURCE_COOKIE } from "@/lib/traffic-source";

const NINETY_DAYS = 60 * 60 * 24 * 90;

/** A full page load in the browser, not an asset, a data fetch or a link prefetch. */
function isPageLoad(request: NextRequest) {
  const { headers, method } = request;
  if (method !== "GET" || headers.has("rsc") || headers.has("next-router-prefetch")) return false;
  const dest = headers.get("sec-fetch-dest");
  return dest ? dest === "document" : Boolean(headers.get("accept")?.includes("text/html"));
}

/** Notes where a visitor first came from, so it can be saved with their account if they sign up. */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (request.cookies.has(SOURCE_COOKIE) || !isPageLoad(request)) return response;

  const visit = classifyVisit({
    referrer: request.headers.get("referer"),
    params: request.nextUrl.searchParams,
    siteHost: request.headers.get("host"),
    landingPath: request.nextUrl.pathname,
  });
  if (visit) {
    response.cookies.set(SOURCE_COOKIE, JSON.stringify(visit), {
      maxAge: NINETY_DAYS,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
