import prisma from "@Batman/db";

export interface SessionConfig {
  requireEmailVerification: boolean;
  sessionExpiresIn: number;
  sessionUpdateAge: number;
}

const DEFAULTS: SessionConfig = {
  requireEmailVerification: false,
  sessionExpiresIn: 60 * 60 * 24 * 7, // 7 days
  sessionUpdateAge: 60 * 60 * 24, // 1 day
};

/**
 * Resolved once, at process start: better-auth's `session` and
 * `emailVerification` options are static config, evaluated when `auth` is
 * constructed rather than per request. A later change to the session-timeout
 * or email-verification toggle in Admin > General takes effect on the next
 * restart, not immediately.
 */
export async function resolveSessionConfig(): Promise<SessionConfig> {
  try {
    const s = await prisma.appSettings.findUnique({ where: { id: "default" } });
    const days = s?.sessionTimeout ?? 30;
    const sessionExpiresIn = Math.max(1, Math.min(365, days)) * 24 * 60 * 60;
    return {
      requireEmailVerification: s?.emailVerificationEnabled ?? false,
      sessionExpiresIn,
      sessionUpdateAge: Math.min(sessionExpiresIn / 2, 60 * 60 * 24),
    };
  } catch {
    return DEFAULTS;
  }
}
