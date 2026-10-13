import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'creator' | 'agency';
  hasAcceptedTerms: boolean;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculatedHash, 'hex'));
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  // Session valid for 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, token, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, token, createdAt, expiresAt);
  return token;
}

export function getUserByToken(token: string): AuthUser | null {
  const now = new Date().toISOString();
  const sessionRow = db.prepare(`
    SELECT s.user_id, u.email, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now) as { user_id: string; email: string; role: 'creator' | 'agency' } | undefined;

  if (!sessionRow) return null;

  const termsRow = db.prepare(`
    SELECT id FROM terms_acceptances WHERE user_id = ?
  `).get(sessionRow.user_id);

  return {
    id: sessionRow.user_id,
    email: sessionRow.email,
    role: sessionRow.role,
    hasAcceptedTerms: !!termsRow,
  };
}

export function deleteSession(token: string): void {
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7).trim();
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  req.user = user;
  next();
}

export function requireRole(expectedRole: 'creator' | 'agency') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== expectedRole) {
      return res.status(403).json({
        error: `Access denied. This action requires a ${expectedRole} account.`,
      });
    }
    next();
  };
}
