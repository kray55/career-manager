import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";

const requestSchema = z.object({
  type: z.enum(["resume", "coverLetter", "summary", "experience"]),
  fields: z.record(z.string().max(8000)).refine((fields) => Object.values(fields).some((value) => value.trim().length > 0), {
    message: "At least one field is required",
  }),
});

const labels: Record<string, string> = {
  resume: "professional resume",
  coverLetter: "tailored cover letter",
  summary: "professional summary",
  experience: "polished resume experience entry",
};

function stripUnsafeHtml(value: string): string {
  return value
    .replace(/<\/?(?:script|style|iframe|object|embed|form|textarea)[^>]*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(?:href|src)\s*=\s*(['\"]?)\s*javascript:[^'\">\s]*\1/gi, "")
    .trim();
}

function extractContent(payload: any): string {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => typeof part === "string" ? part : part?.text || "").join("");
  return "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user?.tenantId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please provide generation details." });

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  const baseUrl = (process.env.OPENAI_API_BASE || process.env.AI_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!apiKey) {
    return res.status(503).json({ error: "AI generation is not configured. Add OPENAI_API_KEY to the Production environment." });
  }

  const { type, fields } = parsed.data;
  const detailLines = Object.entries(fields)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value.trim()}`)
    .join("\\n");

  const systemPrompt = `You are a senior career-writing specialist. Create a ${labels[type]} for a real job seeker. Use only the supplied facts; do not invent employers, dates, degrees, metrics, or contact details. Improve clarity, impact, grammar, and ATS readability. Return only clean HTML using h1, h2, h3, p, ul, ol, li, strong, em, and br tags. Do not use markdown, CSS, JavaScript, links, or code fences.`;
  const userPrompt = `Generate the ${labels[type]} from these details:\n${detailLines}`;

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 1800,
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error("[AI Generate] provider error", upstream.status, errorText.slice(0, 500));
      return res.status(502).json({ error: "The AI provider could not generate content. Please try again." });
    }

    const content = stripUnsafeHtml(extractContent(await upstream.json()).replace(/^```html\\s*/i, "").replace(/\\s*```$/i, ""));
    if (!content) return res.status(502).json({ error: "The AI provider returned empty content. Please try again." });

    return res.status(200).json({ content, type, model: process.env.AI_MODEL || "gpt-5-mini" });
  } catch (error) {
    console.error("[AI Generate] request failed", error);
    return res.status(502).json({ error: "Unable to reach the AI provider. Please try again." });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "64kb" } } };

