import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      // No SMTP on a dev laptop: log the link server-side. For pilot, plug in
      // Resend/SMTP here (see Docs/RUNBOOK.md).
      if (process.env.PASSWORD_RESET_DEV_LOG === "true") {
        console.log(`[dev] password reset for ${user.email}: ${url}`);
        return;
      }
      throw new Error(
        "Password reset email is not configured. Set PASSWORD_RESET_DEV_LOG=true for local dev or wire an email provider.",
      );
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

export type AuthSession = typeof auth.$Infer.Session;
