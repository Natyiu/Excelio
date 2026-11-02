import { NextRequest, NextResponse } from "next/server";
import prisma from "@Batman/db";
import { createHmac, timingSafeEqual } from "node:crypto";
import { revokePolarSubscription } from "@/lib/polar-revoke";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });

    // The secret comes only from env; admin settings don't affect payments.
    const candidates = [
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

    const subId = String(data.id ?? data.subscription_id ?? "");
    const status = String(data.status ?? "active");
    const periodEndRaw = data.current_period_end ?? data.currentPeriodEnd;
    const periodEnd = periodEndRaw ? new Date(periodEndRaw as string) : new Date(0);
    const cancelAtPeriodEnd = Boolean(data.cancel_at_period_end ?? data.cancelAtPeriodEnd);
    const productId = (data.product_id ?? data.productId) as string | undefined;
    const customerId = String(data.customer_id ?? data.customerId ?? "");

    const user = await findPayingUser(data);
    if (!user || !subId) {
      console.warn("[Polar webhook] No matching user for", type, subId);
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
    console.error("[Polar webhook]", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/** Seconds a delivery's timestamp may differ from now (Standard Webhooks default). */
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

/**
 * HMAC keys a secret may sign with. Older Polar secrets sign with the secret's UTF-8 bytes
 * (what SDK 0.46's validateEvent assumes); newer `whsec_<base64>` secrets sign with the
 * base64-decoded bytes after the prefix (the Standard Webhooks convention). Try both, as
 * Polar's current SDK does.
 */
function hmacKeys(secret: string): Buffer[] {
  const utf8Key = Buffer.from(secret, "utf-8");
  const keys = [utf8Key];
  const rest = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(rest)) {
    const decoded = Buffer.from(rest, "base64");
    if (decoded.length > 0 && !decoded.equals(utf8Key)) keys.push(decoded);
  }
  return keys;
}

/**
 * Returns the parsed event if any secret's signature matches, otherwise null. Returns the raw
 * JSON (snake_case) rather than the SDK's schema parse, so event types or API versions newer
 * than the installed SDK don't fail with a 500 and get the endpoint disabled.
 */
function verifyPolarEvent(
  body: string,
  headers: Record<string, string>,
  candidates: { secret: string }[],
): { type?: string; data?: unknown } | null {
  const id = headers["webhook-id"];
  const ts = headers["webhook-timestamp"];
  const sigHeader = headers["webhook-signature"];
  if (!id || !ts || !sigHeader) return null;
  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > WEBHOOK_TOLERANCE_SECONDS) {
    console.error("[Polar webhook] Timestamp outside tolerance:", ts);
    return null;
  }
  const signed = `${id}.${Math.floor(timestamp)}.${body}`;
  const signatures = sigHeader
    .split(" ")
    .map((s) => s.split(",", 2))
    .flatMap(([v, s]) => (v === "v1" && s ? [Buffer.from(s, "base64")] : []));

  for (const { secret } of candidates) {
    for (const key of hmacKeys(secret)) {
      const expected = createHmac("sha256", key).update(signed).digest();
      if (signatures.some((s) => s.length === expected.length && timingSafeEqual(s, expected))) {
        return JSON.parse(body);
      }
    }
  }
  return null;
}

/**
 * The app user a subscription or order belongs to. Checkout sets Polar's external customer
 * id to our user id, so match on that first: the buyer can change the email on the checkout
 * page, and an email-only match would then leave them paid but locked out. Email is the
 * fallback for customers created before external ids were set. Handles both Polar's
 * snake_case payload and the SDK's camelCase parse.
 */
async function findPayingUser(data: Record<string, unknown>): Promise<{ id: string } | null> {
  const customer = (data.customer ?? {}) as {
    external_id?: string | null;
    externalId?: string | null;
    email?: string | null;
  };
  const externalId = customer.external_id ?? customer.externalId;
  if (externalId) {
    const byId = await prisma.user.findUnique({ where: { id: externalId }, select: { id: true } });
    if (byId) return byId;
  }
  const email = (customer.email ?? (data.email as string | undefined))?.toLowerCase().trim();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
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

  const orderId = String(data.id ?? "");
  if (!orderId) return;

  const user = await findPayingUser(data);
  if (!user) {
    console.warn("[Polar webhook] No matching user for order", orderId);
    return;
  }

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
