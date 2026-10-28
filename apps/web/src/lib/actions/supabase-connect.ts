"use server";

/**
 * "Connect with Supabase" flow for the setup wizard: given a user-supplied
 * Personal Access Token, drive the Supabase Management API to either create
 * a fresh project or attach to an existing one, then assemble the DATABASE_URL /
 * DIRECT_URL / storage credentials the wizard needs — no manual copy-pasting.
 *
 * Docs: https://supabase.com/docs/reference/api/introduction
 */

import type { SupabaseOrgOption, SupabaseProjectOption, AssembledCredentials } from "@/types/supabase-connect";

const MANAGEMENT_API = "https://api.supabase.com/v1";

async function supabaseFetch<T>(pat: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MANAGEMENT_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new Error("Supabase rejected that token. Generate a new Personal Access Token and try again.");
    }
    throw new Error(`Supabase API request to ${path} failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchSupabaseAccount(pat: string): Promise<{
  organizations: SupabaseOrgOption[];
  projects: SupabaseProjectOption[];
}> {
  type RawOrg = { id: string; slug: string; name: string };
  type RawProject = {
    ref: string;
    name: string;
    region: string;
    organization_slug: string;
    status: string;
  };

  const [orgs, projects] = await Promise.all([
    supabaseFetch<RawOrg[]>(pat, "/organizations"),
    supabaseFetch<RawProject[]>(pat, "/projects"),
  ]);

  return {
    organizations: orgs.map((o) => ({ id: o.id, slug: o.slug, name: o.name })),
    projects: projects.map((p) => ({
      ref: p.ref,
      name: p.name,
      region: p.region,
      organizationSlug: p.organization_slug,
      status: p.status,
    })),
  };
}

async function assembleSupabaseCredentials(
  pat: string,
  ref: string,
  password: string
): Promise<AssembledCredentials> {
  type PoolerConfig = {
    db_user: string;
    db_host: string;
    db_port: number;
    db_name: string;
    pool_mode: string;
  };
  type ApiKey = { name: string; api_key: string };

  const [poolerConfigs, apiKeys] = await Promise.all([
    supabaseFetch<PoolerConfig[]>(pat, `/projects/${ref}/config/database/pooler`),
    supabaseFetch<ApiKey[]>(pat, `/projects/${ref}/api-keys?reveal=true`),
  ]);

  const transactionPooler = poolerConfigs.find((c) => c.pool_mode === "transaction") ?? poolerConfigs[0];
  if (!transactionPooler) {
    throw new Error(`Could not read the connection pooler config for project "${ref}".`);
  }

  const encodedPassword = encodeURIComponent(password);
  const databaseUrl = `postgresql://${transactionPooler.db_user}:${encodedPassword}@${transactionPooler.db_host}:${transactionPooler.db_port}/${transactionPooler.db_name}?pgbouncer=true`;
  const directUrl = `postgresql://postgres:${encodedPassword}@db.${ref}.supabase.co:5432/postgres`;

  const anonKey = apiKeys.find((k) => k.name === "anon")?.api_key ?? "";
  const serviceRoleKey = apiKeys.find((k) => k.name === "service_role")?.api_key ?? "";

  return {
    databaseUrl,
    directUrl,
    databasePassword: password,
    supabaseUrl: `https://${ref}.supabase.co`,
    supabaseAnonKey: anonKey,
    supabaseServiceRoleKey: serviceRoleKey,
  };
}

function generatePassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64").replace(/[+/=]/g, "").slice(0, 20);
}

export async function createSupabaseProject(
  pat: string,
  params: { organizationSlug: string; name: string; region: string }
): Promise<{ ref: string } & AssembledCredentials> {
  const password = generatePassword();

  const created = await supabaseFetch<{ ref: string; status: string }>(pat, "/projects", {
    method: "POST",
    body: JSON.stringify({
      organization_slug: params.organizationSlug,
      name: params.name,
      db_pass: password,
      region: params.region,
    }),
  });

  const ref = created.ref;
  let status = created.status ?? "";
  const deadline = Date.now() + 120_000;

  while (!status.toUpperCase().includes("ACTIVE") && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    const projects = await supabaseFetch<{ ref: string; status: string }[]>(pat, "/projects");
    status = projects.find((p) => p.ref === ref)?.status ?? status;
  }

  if (!status.toUpperCase().includes("ACTIVE")) {
    throw new Error(
      `Project "${params.name}" was created but is still provisioning on Supabase's side (status: ${status || "unknown"}). ` +
        `This usually takes 1-2 minutes. Wait a bit, then switch to "Use existing project", pick "${params.name}", ` +
        `and enter this database password: ${password}`
    );
  }

  const credentials = await assembleSupabaseCredentials(pat, ref, password);
  return { ref, ...credentials };
}

export async function connectExistingSupabaseProject(
  pat: string,
  params: { ref: string; password: string }
): Promise<{ ref: string } & AssembledCredentials> {
  const credentials = await assembleSupabaseCredentials(pat, params.ref, params.password);
  return { ref: params.ref, ...credentials };
}
