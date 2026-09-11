import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { createDb } from "@kosh-app/db";
import * as schema from "@kosh-app/db/schema/auth";
import { env } from "@kosh-app/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendResetPasswordEmail, sendVerificationEmail } from "./email";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    appName: "Kosh App",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const body = ctx.body as { email?: string; type?: string } | undefined;
        const email = body?.email?.trim().toLowerCase();
        const needsExistingUser =
          ctx.path === "/sign-in/email" ||
          ctx.path === "/email-otp/request-password-reset" ||
          (ctx.path === "/email-otp/send-verification-otp" &&
            body?.type === "email-verification");
        if (email && needsExistingUser) {
          const user = await db.query.user.findFirst({
            where: (users, { eq }) => eq(users.email, email),
          });
          if (!user) {
            throw new APIError("NOT_FOUND", {
              message: "User with this email doesn't exist",
            });
          }
        }
        if (ctx.path === "/sign-up/email" && email) {
          const existing = await db.query.user.findFirst({
            where: (users, { eq }) => eq(users.email, email),
          });
          if (existing) {
            throw new APIError("BAD_REQUEST", {
              message: "User with this email already exists",
            });
          }
        }
      }),
    },
    trustedOrigins: [
      env.CORS_ORIGIN,
      env.BETTER_AUTH_URL,
      "kosh-app://",
      "exp://",
      "exp://*/*",
      "http://localhost:8081",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:8081",
    ],
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    user: {
      additionalFields: {
        // Repurposed: now means "this device has passkey biometric login
        // enabled", not a plain app-level toggle. It is a convenience mirror of
        // a registered passkey — the source of truth for whether biometric
        // login works is the passkey row in the `passkey` table.
        biometricEnabled: {
          type: "boolean",
          defaultValue: false,
          input: true,
        },
      },
      deleteUser: {
        enabled: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 60 * 30, // 30 minutes
      revokeSessionsOnPasswordReset: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }, _request) => {
        await sendResetPasswordEmail({
          to: user.email,
          url,
          name: user.name,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: false, // Handled exclusively by emailOTP plugin on sign-up to prevent duplicate emails
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }, _request) => {
        await sendVerificationEmail({
          to: user.email,
          url,
          name: user.name,
        });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
        strategy: "compact",
      },
    },
    rateLimit: {
      enabled: env.NODE_ENV === "production",
      window: 10,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
        "/request-password-reset": { window: 60, max: 3 },
      },
    },
    advanced: {
      cookiePrefix: "kosh",
      useSecureCookies: env.NODE_ENV === "production",
      defaultCookieAttributes: {
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
    },
    plugins: [
      expo(),
      bearer(),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }, _request) {
          if (type === "email-verification") {
            const callbackUrl = `${env.CORS_ORIGIN}/verify-email?verified=true`;
            const verifyUrl = `${env.BETTER_AUTH_URL}/api/auth/verify-email?token=${otp}&callbackURL=${encodeURIComponent(callbackUrl)}`;
            await sendVerificationEmail({
              to: email,
              otp,
              url: verifyUrl,
            });
          } else if (type === "forget-password") {
            const resetUrl = `${env.CORS_ORIGIN}/reset-password?otp=${otp}&email=${encodeURIComponent(email)}`;
            await sendResetPasswordEmail({
              to: email,
              otp,
              url: resetUrl,
            });
          }
        },
        sendVerificationOnSignUp: true,
        otpLength: 6,
        expiresIn: 600, // 10 minutes
      }),
      passkey({
        rpName: "Kosh App",
        rpID: new URL(env.BETTER_AUTH_URL).hostname,
        origin: [
          env.BETTER_AUTH_URL,
          env.CORS_ORIGIN,
          "kosh-app://",
          // EAS release keystore SHA-256, base64url (no padding) — matches
          // assetlinks.json's sha256_cert_fingerprints entry (that file uses
          // hex-colon format; this is the same bytes, base64url-encoded).
          "android:apk-key-hash:hNOX_ys9e8YrAKG9VPHCWKA4SKMB-WhYuc4ti0EPMtA",
          // Android debug keystore (~/.android/debug.keystore), same encoding.
          // Needed only while testing dev builds via `expo run:android`; remove
          // before release.
          "android:apk-key-hash:-sYXRdwJA3hvue3mKpYrOZ9zSPC7b4mbgzJmdZEDO5w",
        ],
        advanced: {
          webAuthnChallengeCookie: "kosh-passkey",
        },
      }),
      // KNOWN LIMITATION: Passkeys (WebAuthn) require a verifiable HTTPS domain.
      // The Relying Party ID above is derived from BETTER_AUTH_URL, so full
      // end-to-end testing is impossible until the server is deployed to a real,
      // publicly reachable domain that hosts `/.well-known/apple-app-site-association`
      // (iOS) and `/.well-known/assetlinks.json` (Android). Local development can
      // implement and partially test the flow, but final verification happens
      // only post-deploy.
    ],
  });
}

export const auth = createAuth();

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

export async function getSession(req: Request | Headers) {
  const headers = req instanceof Request ? req.headers : req;
  return await auth.api.getSession({
    headers,
  });
}
