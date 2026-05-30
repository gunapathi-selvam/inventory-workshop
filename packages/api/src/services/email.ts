/**
 * Email transport (Nodemailer). Wired now, off by default — flip EMAIL_ENABLED
 * (or the email setting) to true. For localhost testing point SMTP_* at Mailpit
 * (default localhost:1025). All outbound mail flows through sendEmail().
 */
import nodemailer, { type Transporter } from "nodemailer";
import { env, logger } from "@workshop/core";
import { getEmailSettings } from "./settings.js";

let transporter: Transporter | null = null;

function getTransport(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(msg: EmailMessage): Promise<{ sent: boolean }> {
  const settings = await getEmailSettings();
  const enabled = env.EMAIL_ENABLED || settings.enabled;
  if (!enabled) {
    logger.debug("Email disabled — skipping send", { to: msg.to, subject: msg.subject });
    return { sent: false };
  }
  try {
    await getTransport().sendMail({ from: settings.from || env.SMTP_FROM, ...msg });
    return { sent: true };
  } catch (err) {
    logger.error("Email send failed", { error: String(err), to: msg.to });
    return { sent: false };
  }
}
