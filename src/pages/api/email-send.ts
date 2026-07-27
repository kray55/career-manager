import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

// ──────────────────────────────────────────────
// Validation Schema
// ──────────────────────────────────────────────

const sendEmailSchema = z.object({
  to: z.string().email("Invalid recipient email"),
  subject: z.string().min(1, "Subject is required").max(998),
  html: z.string().min(1, "HTML content is required"),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string().optional(),
        path: z.string().optional(),
        contentType: z.string().optional(),
      })
    )
    .optional(),
});

// ──────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = session.user as any;

  try {
    // Validate input
    const parsed = sendEmailSchema.parse(req.body);

    // Send email
    const result = await sendEmail({
      to: parsed.to,
      subject: parsed.subject,
      html: parsed.html,
      attachments: parsed.attachments,
    });

    // T10-D: Auto-create Contact if 'to' address doesn't exist
    try {
      const existingContact = await prisma.contact.findFirst({
        where: { tenantId: user.tenantId, email: parsed.to },
      });
      if (!existingContact) {
        await prisma.contact.create({
          data: {
            tenantId: user.tenantId,
            email: parsed.to,
            name: parsed.to,
            status: "PROSPECTIVE",
            notes: "Auto-created via email send on " + new Date().toISOString(),
          },
        });
        console.log(`[Email] Auto-created Contact for ${parsed.to}`);
      }
    } catch (err) {
      console.error("[Email] Failed to auto-create contact:", err);
    }

    // Log to database
    await prisma.emailLog.create({
      data: {
        to: parsed.to,
        subject: parsed.subject,
        html: parsed.html,
        status: result.success ? "SENT" : "FAILED",
        errorMsg: result.error || null,
        sentAt: result.success ? new Date() : null,
        tenantId: user.tenantId,
        userId: user.id,
      },
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: "Email sent successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to send email",
      });
    }
  } catch (error: any) {
    // Log failure
    try {
      await prisma.emailLog.create({
        data: {
          to: req.body?.to || "unknown",
          subject: req.body?.subject || "unknown",
          html: req.body?.html || "",
          status: "FAILED",
          errorMsg: error?.message || "Validation error",
          tenantId: user.tenantId,
          userId: user.id,
        },
      });
    } catch {
      // Logging failed silently
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}
