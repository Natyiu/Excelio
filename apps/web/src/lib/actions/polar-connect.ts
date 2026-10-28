"use server";

/**
 * "Connect with Polar" flow for the setup wizard: given a user-supplied
 * access token, list the organizations it can see and auto-register the
 * app's webhook endpoint so the wizard doesn't need the org ID / webhook
 * secret pasted in by hand.
 *
 * Docs: https://polar.sh/docs/api-reference/introduction
 */

import type { PolarOrgOption } from "@/types/polar-connect";

const SUBSCRIPTION_WEBHOOK_EVENTS = [
  "subscription.created",
  "subscription.active",
  "subscription.updated",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.revoked",
] as const;

function polarBaseUrl(sandbox: boolean) {
  return sandbox ? "https://sandbox-api.polar.sh/v1" : "https://api.polar.sh/v1";
}

async function polarFetch<T>(token: string, sandbox: boolean, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${polarBaseUrl(sandbox)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Polar rejected that token (${res.status}). Make sure it's a valid ${sandbox ? "sandbox" : "production"} token with the right scopes.`
      );
    }
    throw new Error(`Polar API request to ${path} failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchPolarOrganizations(token: string, sandbox: boolean): Promise<PolarOrgOption[]> {
  type RawOrg = { id: string; slug: string; name: string };
  const result = await polarFetch<{ items: RawOrg[] }>(token, sandbox, "/organizations/");
  return result.items.map((o) => ({ id: o.id, slug: o.slug, name: o.name }));
}

export async function connectPolarWebhook(
  token: string,
  sandbox: boolean,
  params: { organizationId: string; url: string }
): Promise<{ webhookSecret: string }> {
  type WebhookEndpoint = { id: string; secret: string };
  const endpoint = await polarFetch<WebhookEndpoint>(token, sandbox, "/webhooks/endpoints", {
    method: "POST",
    body: JSON.stringify({
      url: params.url,
      format: "raw",
      events: SUBSCRIPTION_WEBHOOK_EVENTS,
      organization_id: params.organizationId,
      name: "Batman setup wizard",
    }),
  });

  return { webhookSecret: endpoint.secret };
}
