import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  requireAuth,
  type AuthenticatedRequest,
} from '../auth.js';

export const authRouter = Router();

// Register
authRouter.post('/register', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (role !== 'creator' && role !== 'agency') {
    return res.status(400).json({ error: "Role must be 'creator' or 'agency'." });
  }

  const cleanEmail = normalizeEmail(email);

  // Check if email already exists across the platform
  const existingUser = db.prepare(`SELECT id, role FROM users WHERE email = ?`).get(cleanEmail) as
    | { id: string; role: 'creator' | 'agency' }
    | undefined;

  if (existingUser) {
    if (existingUser.role !== role) {
      return res.status(409).json({
        error: `This email is already registered as an ${existingUser.role === 'creator' ? 'AI Creator' : 'Agency/Brand'} account. Please log in using the ${existingUser.role === 'creator' ? 'Creator' : 'Agency'} entry point.`,
        existingRole: existingUser.role,
      });
    }
    return res.status(409).json({
      error: 'An account with this email already exists. Please log in or reset your password.',
      existingRole: existingUser.role,
    });
  }

  const userId = crypto.randomUUID();
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  // Insert user
  db.prepare(`
    INSERT INTO users (id, email, password_hash, password_salt, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, cleanEmail, hash, salt, role, now);

  // Idempotently initialize profile
  if (role === 'creator') {
    db.prepare(`
      INSERT OR IGNORE INTO creator_profiles (id, user_id, updated_at)
      VALUES (?, ?, ?)
    `).run(userId, userId, now);
  } else {
    db.prepare(`
      INSERT OR IGNORE INTO agency_profiles (id, user_id, updated_at)
      VALUES (?, ?, ?)
    `).run(userId, userId, now);
  }

  const token = createSession(userId);

  return res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: userId,
      email: cleanEmail,
      role,
      hasAcceptedTerms: false,
    },
  });
});

// Login
authRouter.post('/login', (req, res) => {
  const { email, password, expectedRole } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = normalizeEmail(email);
  const user = db.prepare(`
    SELECT id, email, password_hash, password_salt, role
    FROM users
    WHERE email = ?
  `).get(cleanEmail) as { id: string; email: string; password_hash: string; password_salt: string; role: 'creator' | 'agency' } | undefined;

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // If user attempted login through wrong role portal, warn them clearly
  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({
      error: `This account is registered as a ${user.role === 'creator' ? 'Creator' : 'Agency/Brand'}. Please use the ${user.role === 'creator' ? 'Creator' : 'Agency'} Login page.`,
      correctRole: user.role,
    });
  }

  const valid = verifyPassword(password, user.password_hash, user.password_salt);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Ensure profile exists idempotently (recovery if interrupted)
  const now = new Date().toISOString();
  if (user.role === 'creator') {
    db.prepare(`
      INSERT OR IGNORE INTO creator_profiles (id, user_id, updated_at)
      VALUES (?, ?, ?)
    `).run(user.id, user.id, now);
  } else {
    db.prepare(`
      INSERT OR IGNORE INTO agency_profiles (id, user_id, updated_at)
      VALUES (?, ?, ?)
    `).run(user.id, user.id, now);
  }

  const termsAccepted = !!db.prepare(`SELECT id FROM terms_acceptances WHERE user_id = ?`).get(user.id);
  const token = createSession(user.id);

  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      hasAcceptedTerms: termsAccepted,
    },
  });
});

// Current User State
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let profile = null;

  if (user.role === 'creator') {
    profile = db.prepare(`SELECT * FROM creator_profiles WHERE user_id = ?`).get(user.id);
  } else {
    profile = db.prepare(`SELECT * FROM agency_profiles WHERE user_id = ?`).get(user.id);
  }

  return res.json({
    user,
    profile,
  });
});

// Logout
authRouter.post('/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    deleteSession(token);
  }
  return res.json({ message: 'Successfully logged out.' });
});

// Request Password Reset
authRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  const cleanEmail = normalizeEmail(email);
  const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get(cleanEmail) as { id: string } | undefined;

  if (!user) {
    // For security, still return generic confirmation or explicit message
    return res.json({ message: 'If an account exists with this email, a reset token has been generated.' });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare(`
    UPDATE users
    SET reset_token = ?, reset_token_expiry = ?
    WHERE id = ?
  `).run(resetToken, expiry, user.id);

  return res.json({
    message: 'Password reset token generated.',
    resetToken, // In full production, this would be emailed; returned here so user can reset seamlessly
  });
});

// Reset Password with Token
authRouter.post('/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Valid reset token and password of at least 6 characters are required.' });
  }

  const now = new Date().toISOString();
  const user = db.prepare(`
    SELECT id FROM users
    WHERE reset_token = ? AND reset_token_expiry > ?
  `).get(resetToken, now) as { id: string } | undefined;

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired password reset token.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare(`
    UPDATE users
    SET password_hash = ?, password_salt = ?, reset_token = NULL, reset_token_expiry = NULL
    WHERE id = ?
  `).run(hash, salt, user.id);

  return res.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
});
