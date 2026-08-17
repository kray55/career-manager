import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// One-time setup endpoint — creates the default tenant + admin user.
// Protected by SETUP_SECRET env var. Safe to call multiple times (upsert).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-setup-secret'] || req.body?.secret;
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return res.status(401).json({ error: 'Invalid or missing setup secret' });
  }

  const { name = 'Admin User', email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    // 1. Upsert default tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'default' },
      update: {},
      create: { name: 'Default', slug: 'default', domain: 'localhost:3000' },
    });

    // 2. Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Update password
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({ where: { email }, data: { passwordHash, emailVerified: new Date() } });
      return res.status(200).json({ success: true, message: `Password updated for ${email}` });
    }

    // 3. Create admin user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    return res.status(201).json({ success: true, message: `Admin user created: ${user.email}` });
  } catch (err: any) {
    console.error('Setup error:', err);
    return res.status(500).json({ error: err.message || 'Setup failed' });
  }
}
