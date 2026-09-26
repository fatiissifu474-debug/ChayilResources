import { Resend } from "resend";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Pluggable email sender (PRD commercial/pilot readiness).
 * - Pilot/prod: set RESEND_API_KEY (+ optional EMAIL_FROM) — sends via Resend free tier.
 * - Local dev: logs to the server console when PASSWORD_RESET_DEV_LOG=true (or non-production).
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const from = process.env.EMAIL_FROM ?? "ChayilResources <noreply@example.com>";
    const { error } = await resend.emails.send({
      from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
    });
    if (error) throw new Error(`Email send failed: ${error.message}`);
    return;
  }
  if (process.env.PASSWORD_RESET_DEV_LOG === "true" || process.env.NODE_ENV !== "production") {
    console.log(`[dev-email] to=${msg.to} subject=${msg.subject}\n${msg.text}`);
    return;
  }
  throw new Error("Email is not configured. Set RESEND_API_KEY (see Docs/RUNBOOK.md).");
}
