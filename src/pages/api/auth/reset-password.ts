import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Simple token-based password reset.
// POST { email } — generates a reset token and returns it (in prod you'd email it).
// POST { token, password } — resets the password.

// In-memory token store (fine for single-instance; use DB/Redis for multi-instance)
const resetTokens = new Map<string, { email: string; expires: number }>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, token, password } = req.body || {};

  // ── Step 1: Request reset token ──
  if (email && !token) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      return res.status(200).json({ success: true, message: 'If that email exists, a reset token has been generated.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    resetTokens.set(resetToken, { email, expires: Date.now() + 1000 * 60 * 30 }); // 30 min
    console.log(`[reset-password] Token for ${email}: ${resetToken}`);
    // In production: send email. For now return token directly so you can use it.
    return res.status(200).json({
      success: true,
      message: 'Reset token generated. Copy the token below and use it on /reset-password.',
      token: resetToken, // Remove this line once email sending is configured
    });
  }

  // ── Step 2: Use token to reset password ──
  if (token && password) {
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const entry = resetTokens.get(token);
    if (!entry || entry.expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { email: entry.email }, data: { passwordHash } });
    resetTokens.delete(token);
    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  }

  return res.status(400).json({ error: 'Provide email to request reset, or token + password to complete reset.' });
}
