import prisma from "@Batman/db";
import { env } from "@Batman/env/server";
import { Resend } from "resend";

const RESEND_DEFAULT_FROM = "Batman <onboarding@resend.dev>";

async function getEmailSettings() {
  try {
    return await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: { resendApiKey: true, resendFromEmail: true },
    });
  } catch {
    return null;
  }
}

export async function getResendClient(): Promise<Resend | null> {
  const settings = await getEmailSettings();
  const apiKey = settings?.resendApiKey || env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Sends an email via Resend, preferring the admin-configured API key and
 * from-address (Admin > API Keys) over RESEND_API_KEY / RESEND_FROM_EMAIL.
 *
 * Shared by @Batman/auth (password reset, verification, invitations) and the
 * web app (blog, feedback, notifications, billing) — this used to be two
 * separately-maintained copies of the same resolution logic, which meant a
 * fix or a new provider added to one silently never reached the other.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const resend = await getResendClient();
    if (!resend) {
      console.error(
        "[Email] Not sent: no RESEND_API_KEY. Add RESEND_API_KEY to your host env or Admin > API Keys.",
      );
      return false;
    }
    const settings = await getEmailSettings();
    const customFrom = settings?.resendFromEmail?.trim() || env.RESEND_FROM_EMAIL?.trim();
    const from = customFrom && !customFrom.includes("yourdomain.com") ? customFrom : RESEND_DEFAULT_FROM;
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error("[Email] Resend error:", JSON.stringify(error));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}
