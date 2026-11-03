import { sendEmail } from "@Batman/email";
import prisma from "@Batman/db";
import { env } from "@Batman/env/server";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization } from "better-auth/plugins";

import { ac, admin, user } from "./permissions";
import { notifyFirstAdmin, notifyPasswordChanged, notifyWelcome } from "./notifications";
import { resolveSessionConfig } from "./session-config";
import { getSettings } from "./settings-cache";

export { ac, admin, user } from "./permissions";
export { getGoogleCredentials } from "./google-credentials";
export { invalidateSettingsCache } from "./settings-cache";

const googleCreds =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : { clientId: "placeholder", clientSecret: "placeholder" };

const sessionConfig = await resolveSessionConfig();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: env.BETTER_AUTH_URL,
  // CORS_ORIGIN may list several origins, comma-separated (e.g. the www and bare domain)
  trustedOrigins: [
    ...new Set(
      [env.BETTER_AUTH_URL, ...env.CORS_ORIGIN.split(",")]
        .map((o) => o.trim().replace(/\/+$/, ""))
        .filter(Boolean),
    ),
  ],

  session: {
    expiresIn: sessionConfig.sessionExpiresIn,
    updateAge: sessionConfig.sessionUpdateAge,
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: sessionConfig.requireEmailVerification,
    async sendResetPassword({ user, url }) {
      const settings = await getSettings();
      const appName = settings?.appName ?? "Batman";
      await sendEmail(
        user.email,
        `Reset your ${appName} password`,
        `<p>Hi ${user.name ?? "there"},</p><p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, ignore this email.</p>`,
      );
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      const settings = await getSettings();
      if (!settings?.emailVerificationEnabled) return;
      const appName = settings.appName ?? "Batman";
      // Redirect to onboarding after verification
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set("callbackURL", "/onboarding");
        url = urlObj.toString();
      } catch {
        // url might be relative, keep as-is
      }
      await sendEmail(
        user.email,
        `Verify your ${appName} email`,
        `<p>Hi ${user.name ?? "there"},</p><p>Click the link below to verify your email:</p><p><a href="${url}">${url}</a></p>`,
      );
    },
  },

  socialProviders: {
    google: googleCreds,
  },

  user: {
    additionalFields: {
      bio: { type: "string", required: false, input: true },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (_user, ctx) => {
          // Allow admin-created users (admin.createUser)
          const session = ctx?.context
            ? (ctx.context as { session?: { user?: { role?: string } } })?.session
            : undefined;
          if (session?.user?.role === "admin") {
            return { data: _user };
          }

          const settings = await getSettings();
          if (!settings?.signupsEnabled) {
            throw new APIError("BAD_REQUEST", {
              message: "Signups are currently disabled.",
            });
          }

          if (settings.maxUsersEnabled && settings.maxUsers > 0) {
            const count = await prisma.user.count();
            if (count >= settings.maxUsers) {
              throw new APIError("BAD_REQUEST", {
                message: "Registration is closed. Maximum user limit reached.",
              });
            }
          }

          return { data: _user };
        },
        after: async (newUser) => {
          const settings = await getSettings();
          const count = await prisma.user.count();
          const isFirstUser = count === 1;

          const role = isFirstUser
            ? "admin"
            : (settings?.defaultUserRole === "admin" ? "admin" : "user");

          await prisma.user.update({
            where: { id: newUser.id },
            data: { role },
          });

          if (isFirstUser) await notifyFirstAdmin(newUser.id);
          else await notifyWelcome(newUser.id);
        },
      },
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const session =
        ctx.context.newSession ??
        ((ctx.context as Record<string, unknown>).session as
          | { user: { id: string; name?: string; email?: string } }
          | undefined);

      if (ctx.path === "/change-password" && session?.user) {
        await notifyPasswordChanged(session.user.id);
      }
      // delete-user: user is gone, no notification needed
    }),
  },

  plugins: [
    nextCookies(),
    adminPlugin({
      ac,
      roles: { admin, user },
    }),
    organization({
      async sendInvitationEmail({ email, organization: org, inviter }) {
        const settings = await getSettings();
        if (!settings?.invitesEnabled) return;
        const appName = settings.appName ?? "Batman";
        const acceptUrl = `${env.BETTER_AUTH_URL}/dashboard/invitations`;
        await sendEmail(
          email,
          `You're invited to ${org.name} on ${appName}`,
          `<p>${inviter.user.name ?? "Someone"} invited you to join <strong>${org.name}</strong> on ${appName}.</p><p><a href="${acceptUrl}">Accept Invitation</a></p>`,
        );
      },
    }),
  ],
});
