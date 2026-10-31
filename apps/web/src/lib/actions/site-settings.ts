"use server";

import { invalidateSettingsCache } from "@Batman/auth";
import prisma, { Prisma } from "@Batman/db";

import { requireAdmin } from "@/lib/auth-guards";

/** Public: get site mode settings (countdown, waitlist) - no auth */
export async function getSiteSettings() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: {
        countdownMode: true,
        countdownTarget: true,
        countdownTitle: true,
        countdownHeadline: true,
        countdownDescription: true,
        countdownEndMessage: true,
        waitlistMode: true,
        waitlistTitle: true,
        waitlistHeadline: true,
        waitlistDescription: true,
        waitlistButtonText: true,
        waitlistSuccessMessage: true,
        waitlistShowName: true,
        waitlistShowCompany: true,
        appName: true,
        supportEmail: true,
      },
    });

    if (!settings) return { countdown: null, waitlist: null };

    const countdown =
      settings.countdownMode && settings.countdownTarget
        ? {
          target: settings.countdownTarget.toISOString(),
          title: settings.countdownTitle ?? "Coming soon",
          headline: settings.countdownHeadline ?? "We're launching soon",
          description: settings.countdownDescription ?? "",
          endMessage: settings.countdownEndMessage ?? "We're live! Check back soon.",
          appName: settings.appName ?? "Excelio",
          supportEmail: settings.supportEmail ?? "",
        }
      : null;

    const waitlist = settings.waitlistMode
      ? {
          title: settings.waitlistTitle ?? "Join the waitlist",
          headline: settings.waitlistHeadline ?? "Be the first to know when we launch",
          description: settings.waitlistDescription ?? "",
          buttonText: settings.waitlistButtonText ?? "Join waitlist",
          successMessage: settings.waitlistSuccessMessage ?? "You're on the list!",
          showName: settings.waitlistShowName ?? false,
          showCompany: settings.waitlistShowCompany ?? false,
          appName: settings.appName ?? "Excelio",
          supportEmail: settings.supportEmail ?? "",
        }
      : null;

    return { countdown, waitlist };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return { countdown: null, waitlist: null };
    }
    // Connection errors, missing DB, or schema not pushed — show setup wizard
    return { countdown: null, waitlist: null };
  }
}

export async function toggleOnboarding(enabled: boolean) {
  await requireAdmin();

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: { onboardingEnabled: enabled },
    create: { id: "default", onboardingEnabled: enabled },
  });

  return settings;
}

export async function updateAppSettings(data: {
  onboardingEnabled?: boolean;
  appName?: string;
  appDescription?: string;
  appUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  emailVerificationEnabled?: boolean;
  forgotPasswordEnabled?: boolean;
  socialLoginEnabled?: boolean;
  organizationsEnabled?: boolean;
  invitesEnabled?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  defaultUserRole?: string;
  maxUsersEnabled?: boolean;
  maxUsers?: number;
  supportEmail?: string;
  privacyContent?: string;
  termsContent?: string;
  signupsEnabled?: boolean;
  sessionTimeout?: number;
  waitlistMode?: boolean;
  waitlistTitle?: string;
  waitlistHeadline?: string;
  waitlistDescription?: string;
  waitlistButtonText?: string;
  waitlistSuccessMessage?: string;
  waitlistShowName?: boolean;
  waitlistShowCompany?: boolean;
  countdownMode?: boolean;
  countdownTarget?: Date | null;
  countdownTitle?: string;
  countdownHeadline?: string;
  countdownDescription?: string;
  countdownEndMessage?: string;
}) {
  await requireAdmin();

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  invalidateSettingsCache();

  return settings;
}
