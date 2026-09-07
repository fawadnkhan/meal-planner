import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import appleSignin from 'apple-signin-auth';
import { prisma } from '../lib/prisma';

type SocialProvider = 'google' | 'apple';

async function verifySocialToken(provider: SocialProvider, token: string): Promise<{ id: string; email: string; name: string; avatarUrl?: string }> {
  if (provider === 'google') {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Invalid Google token');
    const payload = await response.json() as { sub?: string; email?: string; name?: string; picture?: string; aud?: string };
    if (!payload.sub || !payload.email || payload.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('Invalid Google token claims');
    return { id: payload.sub, email: payload.email, name: payload.name || payload.email.split('@')[0], avatarUrl: payload.picture };
  }
  if (!process.env.APPLE_CLIENT_ID) throw new Error('Invalid Apple token configuration');
  const claims = await appleSignin.verifyIdToken(token, { audience: process.env.APPLE_CLIENT_ID, ignoreExpiration: false });
  if (!claims.sub || !claims.email) throw new Error('Invalid Apple token claims');
  return { id: claims.sub, email: claims.email, name: claims.email.split('@')[0] };
}

export async function socialLogin(req: Request, res: Response): Promise<void> {
  try {
    const provider = req.body.provider as SocialProvider;
    if (!['google', 'apple'].includes(provider) || typeof req.body.idToken !== 'string') {
      res.status(400).json({ error: 'Provider and idToken are required' });
      return;
    }
    const profile = await verifySocialToken(provider, req.body.idToken);
    const user = await prisma.user.upsert({
      where: { authProvider_providerUserId: { authProvider: provider, providerUserId: profile.id } },
      update: { name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl },
      create: { email: profile.email, name: profile.name, passwordHash: null, authProvider: provider, providerUserId: profile.id, avatarUrl: profile.avatarUrl },
      select: { id: true, email: true, name: true, avatarUrl: true, authProvider: true, createdAt: true },
    });
    const token = generateToken(user.id, user.email);
    res.json({ user, token });
  } catch (err) {
    console.error('Social login error:', err instanceof Error ? err.message : err);
    res.status(401).json({ error: 'Social authentication failed' });
  }
}

export async function linkSocial(req: Request & { userId?: string }, res: Response): Promise<void> {
  try {
    const provider = req.body.provider as SocialProvider;
    if (!['google', 'apple'].includes(provider) || typeof req.body.idToken !== 'string' || !req.userId) {
      res.status(400).json({ error: 'Provider and idToken are required' });
      return;
    }
    const profile = await verifySocialToken(provider, req.body.idToken);
    const collision = await prisma.user.findFirst({ where: { authProvider: provider, providerUserId: profile.id, NOT: { id: req.userId } } });
    if (collision) {
      res.status(409).json({ error: 'This social account is already linked' });
      return;
    }
    const user = await prisma.user.update({ where: { id: req.userId }, data: { authProvider: provider, providerUserId: profile.id, avatarUrl: profile.avatarUrl }, select: { id: true, email: true, name: true, avatarUrl: true, authProvider: true, createdAt: true } });
    res.json({ user });
  } catch (err) {
    console.error('Link social account error:', err instanceof Error ? err.message : err);
    res.status(401).json({ error: 'Could not link social account' });
  }
}

function generateToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId, email }, secret, { expiresIn } as jwt.SignOptions);
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, name, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, authProvider: 'email' },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = generateToken(user.id, user.email);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = user.authProvider === 'email' && user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id, user.email);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function getMe(req: Request & { userId?: string }, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}
