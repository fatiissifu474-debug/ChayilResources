import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { db } from "./db";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      // Pilot/prod: set RESEND_API_KEY to email it. Local dev logs the link.
      await sendEmail({
        to: user.email,
        subject: "Reset your ChayilResources password",
        text: `You requested a password reset for your ChayilResources teacher account.\n\nReset it here (link expires in 1 hour):\n${url}\n\nIf you did not request this, ignore this message.`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

export type AuthSession = typeof auth.$Infer.Session;
