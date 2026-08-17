import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) return res.status(401).json({ error: "Unauthorized" });

  const resumeId = typeof req.body?.resumeId === "string" ? req.body.resumeId : "";
  const version = Number(req.body?.version);
  if (!resumeId || !Number.isInteger(version) || version < 1) return res.status(400).json({ error: "resumeId and version are required" });

  try {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id, tenantId: user.tenantId } });
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    const snapshot = await prisma.resumeHistory.findFirst({ where: { resumeId, version } });
    if (!snapshot) return res.status(404).json({ error: "Version not found" });

    const nextVersion = resume.version + 1;
    const updated = await prisma.$transaction(async (tx: any) => {
      const saved = await tx.resume.update({ where: { id: resumeId }, data: { content: snapshot.content, version: nextVersion } });
      await tx.resumeHistory.create({ data: { resumeId, version: nextVersion, content: snapshot.content } });
      return saved;
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error("[Resume restore API] error:", error);
    return res.status(500).json({ error: "Failed to restore resume version" });
  }
}
