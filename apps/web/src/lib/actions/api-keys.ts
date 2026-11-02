"use server";

import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import prisma from "@Batman/db";

import { requireAdmin } from "@/lib/auth-guards";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../../../.env");

async function readEnvVars(): Promise<Record<string, string>> {
  try {
    const content = await readFile(ENV_PATH, "utf-8");
    const vars: Record<string, string> = {};
    for (const line of content.split("\n").filter((l) => l.trim() && !l.startsWith("#"))) {
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      vars[key] = val;
    }
    return vars;
  } catch {
    return {};
  }
}

function mask(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••" + value.slice(-4);
}

function unmasked(value: string | undefined): boolean {
  if (!value) return true;
  return !value.includes("••••");
}

export async function getApiKeys() {
  await requireAdmin();

  const [settings, env] = await Promise.all([
    prisma.appSettings.findUnique({
      where: { id: "default" },
      select: {
        supabaseUrl: true,
        supabaseAnonKey: true,
        supabaseServiceRoleKey: true,
        resendApiKey: true,
        resendFromEmail: true,
        googleClientId: true,
        googleClientSecret: true,
      },
    }),
    readEnvVars(),
  ]);

  const supabaseUrl =
    settings?.supabaseUrl ?? env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = settings?.supabaseAnonKey ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const supabaseServiceRoleKey =
    settings?.supabaseServiceRoleKey ?? env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const resendApiKey = settings?.resendApiKey ?? env.RESEND_API_KEY ?? "";
  const resendFromEmail =
    settings?.resendFromEmail ?? env.RESEND_FROM_EMAIL ?? "noreply@updates.yourdomain.com";
  const googleClientId = settings?.googleClientId ?? env.GOOGLE_CLIENT_ID ?? "";
  const googleClientSecret = settings?.googleClientSecret ?? env.GOOGLE_CLIENT_SECRET ?? "";

  return {
    supabaseUrl,
    supabaseAnonKey: mask(supabaseAnonKey),
    supabaseServiceRoleKey: mask(supabaseServiceRoleKey),
    resendApiKey: mask(resendApiKey),
    resendFromEmail,
    googleClientId,
    googleClientSecret: mask(googleClientSecret),
  };
}

export async function saveApiKeys(data: {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  googleClientId?: string;
  googleClientSecret?: string;
}) {
  await requireAdmin();

  const current = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: {
      supabaseAnonKey: true,
      supabaseServiceRoleKey: true,
      resendApiKey: true,
      googleClientSecret: true,
    },
  });

  const update: Record<string, string | null | boolean> = {};

  if (data.supabaseUrl !== undefined) {
    update.supabaseUrl = data.supabaseUrl || null;
  }
  if (data.supabaseAnonKey !== undefined) {
    update.supabaseAnonKey = unmasked(data.supabaseAnonKey)
      ? data.supabaseAnonKey || null
      : current?.supabaseAnonKey ?? null;
  }
  if (data.supabaseServiceRoleKey !== undefined) {
    update.supabaseServiceRoleKey = unmasked(data.supabaseServiceRoleKey)
      ? data.supabaseServiceRoleKey || null
      : current?.supabaseServiceRoleKey ?? null;
  }
  if (data.resendApiKey !== undefined) {
    update.resendApiKey = unmasked(data.resendApiKey)
      ? data.resendApiKey || null
      : current?.resendApiKey ?? null;
  }
  if (data.resendFromEmail !== undefined) {
    update.resendFromEmail = data.resendFromEmail || null;
  }
  if (data.googleClientId !== undefined) {
    update.googleClientId = data.googleClientId || null;
  }
  if (data.googleClientSecret !== undefined) {
    update.googleClientSecret = unmasked(data.googleClientSecret)
      ? data.googleClientSecret || null
      : current?.googleClientSecret ?? null;
  }
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update,
    create: { id: "default", ...update },
  });

  return { success: true };
}
