import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) return res.status(401).json({ error: "Unauthorized" });
  try {
    if (req.method === "GET") {
      const images = await prisma.imageAsset.findMany({ where: { tenantId: user.tenantId, userId: user.id }, orderBy: { createdAt: "desc" } });
      return res.status(200).json({ images });
    }
    if (req.method === "POST") {
      const { id, name, dataUrl, mimeType, width, height } = req.body || {};
      if (typeof name !== "string" || !name.trim() || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return res.status(400).json({ error: "A valid image is required" });
      if (dataUrl.length > 12 * 1024 * 1024) return res.status(413).json({ error: "Image is too large after editing" });
      const data = { name: name.trim().slice(0, 160), dataUrl, mimeType: typeof mimeType === "string" ? mimeType : "image/png", width: Number(width) || 0, height: Number(height) || 0 };
      const image = id ? await prisma.imageAsset.updateMany({ where: { id, tenantId: user.tenantId, userId: user.id }, data }) : null;
      if (id && image && image.count < 1) return res.status(404).json({ error: "Image not found" });
      const saved = id ? await prisma.imageAsset.findFirst({ where: { id, tenantId: user.tenantId, userId: user.id } }) : await prisma.imageAsset.create({ data: { ...data, tenantId: user.tenantId, userId: user.id } });
      return res.status(200).json({ image: saved });
    }
    if (req.method === "DELETE") {
      const id = typeof req.query.id === "string" ? req.query.id : "";
      await prisma.imageAsset.deleteMany({ where: { id, tenantId: user.tenantId, userId: user.id } });
      return res.status(204).end();
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Images API]", error);
    return res.status(500).json({ error: "Image operation failed" });
  }
}
