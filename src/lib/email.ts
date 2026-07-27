/**
 * T8-A: SMTP Email Hub Integration
 * Creates a nodemailer transporter using environment variables.
 */

import nodemailer from "nodemailer";

// ──────────────────────────────────────────────
// Transporter Configuration
// ──────────────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromName = process.env.SMTP_FROM_NAME || "Career Manager";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@careermanager.app";

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  return transporter;
}

// ──────────────────────────────────────────────
// Email Sending Function
// ──────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const transport = getTransporter();
    const fromName = process.env.SMTP_FROM_NAME || "Career Manager";
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@careermanager.app";

    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("Email send failed:", error);
    return {
      success: false,
      error: error?.message || "Unknown error sending email",
    };
  }
}

// ──────────────────────────────────────────────
// Verify SMTP Connection
// ──────────────────────────────────────────────

export async function verifyConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch {
    return false;
  }
}
