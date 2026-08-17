import type { NextApiRequest, NextApiResponse } from "next";

import bcrypt from "bcryptjs";

import { z } from "zod";

import prisma from "@/lib/prisma";



const registerSchema = z.object({
  
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  
});



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== "POST") {
    
    res.setHeader("Allow", "POST");
    
    return res.status(405).json({ error: "Method not allowed" });
    
  }
  

  
  const parsed = registerSchema.safeParse(req.body);
  
  if (!parsed.success) {
    
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid registration details" });
    
  }
  

  
  const { name, email, password } = parsed.data;
  

  
  try {
    
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    
    if (existing) {
      
      return res.status(409).json({ error: "An account with this email already exists" });
      
    }
    

    
    const tenant = await prisma.tenant.upsert({
      
      where: { slug: "default" },
      
      update: {},
      
      create: { name: "Default", slug: "default" },
      
      select: { id: true },
      
    });
    

    
    const passwordHash = await bcrypt.hash(password, 12);
    
    await prisma.user.create({
      
      data: { name, email, passwordHash, tenantId: tenant.id, role: "USER" },
      
    });
    

    
    return res.status(201).json({ ok: true });
    
  } catch (error) {
    
    console.error("Registration failed", error);
    
    return res.status(500).json({ error: "Unable to create your account right now" });
    
  }
  
}









































