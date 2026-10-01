import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword, verifyPassword } from './db.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'student' | 'admin';
  firebaseUid?: string | null;
  avatarUrl?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function createSession(userId: number): string {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sessionId, userId, expiresAt);

  return sessionId;
}

export function getSessionUser(sessionId: string): AuthenticatedUser | null {
  if (!sessionId) return null;

  const session = db.prepare(`
    SELECT s.user_id, s.expires_at, u.email, u.role, u.firebase_uid, u.avatar_url
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(sessionId) as any;

  if (!session) return null;

  // Check expiration
  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }

  return {
    id: session.user_id,
    email: session.email,
    role: session.role,
    firebaseUid: session.firebase_uid || null,
    avatarUrl: session.avatar_url || null
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let sessionId: string | undefined = req.cookies?.skillpath_session;

  if (!sessionId && req.headers.authorization?.startsWith('Bearer ')) {
    sessionId = req.headers.authorization.split(' ')[1];
  }

  if (sessionId) {
    const user = getSessionUser(sessionId);
    if (user) {
      req.user = user;
    }
  }

  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
  }
  next();
}
