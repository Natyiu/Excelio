import { NextRequest, NextResponse } from "next/server";
import prisma from "@Batman/db";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { revokePolarSubscription } from "@/lib/polar-revoke";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });

    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: { polarWebhookSecret: true },
    });

    // Accept either the admin-panel secret or the env var, so a stale value in one place
    // can't silently block deliveries signed with the other.
    const candidates = [
      { source: "admin settings", secret: settings?.polarWebhookSecret?.trim() },
      { source: "POLAR_WEBHOOK_SECRET env", secret: process.env.POLAR_WEBHOOK_SECRET?.trim() },
    ].filter((c): c is { source: string; secret: string } => !!c.secret);
    if (candidates.length === 0) {
      console.error("[Polar webhook] No webhook secret configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const event = verifyPolarEvent(body, headers, candidates);
    if (!event) {
      console.error(
        "[Polar webhook] Invalid signature. Tried:",
        candidates.map((c) => `${c.source} (${c.secret.length} chars, starts ${c.secret.slice(0, 10)})`).join("; "),
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const type = (event as { type?: string }).type;
    const data = event.data as Record<string, unknown> | undefined;

    if (!data) return NextResponse.json({ received: true });

    // One-time purchases (Lifetime Pro) arrive as orders, not subscriptions.
    if (type === "order.paid" || type === "order.refunded") {
      await handleLifetimeOrder(type, data);
      return NextResponse.json({ received: true });
    }
    if (!type?.startsWith("subscription.")) {
      return NextResponse.json({ received: true });
    }

    // Polar uses snake_case in webhook payloads
    const customer = (data.customer ?? data) as { email?: string } | undefined;
    const email = (customer?.email ?? (data as { email?: string }).email) as string | undefined;
    if (!email?.trim()) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Polar webhook] No customer email in payload:", JSON.stringify(data, null, 2).slice(0, 500));
      }
      return NextResponse.json({ received: true });
    }

    const subId = String(data.id ?? data.subscription_id ?? "");
    const status = String(data.status ?? "active");
    const periodEndRaw = data.current_period_end ?? data.currentPeriodEnd;
    const periodEnd = periodEndRaw ? new Date(periodEndRaw as string) : new Date(0);
    const cancelAtPeriodEnd = Boolean(data.cancel_at_period_end ?? data.cancelAtPeriodEnd);
    const productId = (data.product_id ?? data.productId) as string | undefined;
    const customerId = String(data.customer_id ?? data.customerId ?? "");

    const emailNorm = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
      select: { id: true },
    });

    if (!user || !subId) {
      return NextResponse.json({ received: true });
    }

    // A lifetime purchase outranks any subscription event (e.g. an old plan being cancelled).
    const existing = await prisma.subscription.findUnique({ where: { userId: user.id }, select: { status: true } });
    if (existing?.status === "lifetime") {
      return NextResponse.json({ received: true });
    }

    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        polarSubscriptionId: subId,
        polarCustomerId: customerId,
        productId,
        status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
      },
      update: {
        polarSubscriptionId: subId,
        polarCustomerId: customerId,
        productId,
        status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
      },
    });

    return NextResponse.json({ received: true });
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.error("[Polar webhook]", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 * Returns the event if any secret's signature matches, otherwise null. The SDK verifies the
 * signature first and only then parses the payload against its schemas; if that parsing fails
 * (an event type or API version newer than this SDK knows), the signature was still valid, so
 * fall back to the raw JSON instead of answering 500 and getting the endpoint disabled.
 */
function verifyPolarEvent(
  body: string,
  headers: Record<string, string>,
  candidates: { secret: string }[],
): { type?: string; data?: unknown } | null {
  for (const { secret } of candidates) {
    try {
      return validateEvent(body, headers, secret) as { type?: string; data?: unknown };
    } catch (e) {
      if (e instanceof WebhookVerificationError) continue;
      return JSON.parse(body);
    }
  }
  return null;
}

/** Far-future end date for lifetime access. */
const LIFETIME_END = new Date("2999-12-31T00:00:00Z");

/**
 * Grant (or, on refund, remove) lifetime Pro for a one-time order. Subscription orders
 * (renewals) are ignored here; their subscription events handle them.
 */
async function handleLifetimeOrder(type: string, data: Record<string, unknown>) {
  const reason = String(data.billing_reason ?? data.billingReason ?? "");
  const product = (data.product ?? {}) as { is_recurring?: boolean; isRecurring?: boolean };
  const recurring = product.is_recurring ?? product.isRecurring ?? false;
  if ((reason && reason !== "purchase") || recurring) return;

  const customer = (data.customer ?? {}) as { email?: string };
  const email = customer.email?.toLowerCase().trim();
  const orderId = String(data.id ?? "");
  if (!email || !orderId) return;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;

  if (type === "order.refunded") {
    await prisma.subscription.updateMany({
      where: { userId: user.id, status: "lifetime" },
      data: { status: "refunded", currentPeriodEnd: new Date() },
    });
    return;
  }

  // Buying lifetime replaces a monthly/yearly plan: stop that subscription so it isn't charged again.
  const current = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (current && !current.polarSubscriptionId.startsWith("order_") && (current.status === "active" || current.status === "trialing")) {
    await revokePolarSubscription(current.polarSubscriptionId).catch((e) => console.error("[Polar webhook] couldn't cancel old plan", e));
  }

  const lifetime = {
    polarSubscriptionId: `order_${orderId}`,
    polarCustomerId: String(data.customer_id ?? data.customerId ?? ""),
    productId: (data.product_id ?? data.productId) as string | undefined,
    status: "lifetime",
    currentPeriodEnd: LIFETIME_END,
    cancelAtPeriodEnd: false,
  };
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...lifetime },
    update: lifetime,
  });
}
