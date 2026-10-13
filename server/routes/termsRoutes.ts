import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';

export const termsRouter = Router();

const CURRENT_TERMS_VERSION = 'v1.0';

// Check Terms Acceptance Status
termsRouter.get('/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const row = db.prepare(`
    SELECT terms_version, accepted_at
    FROM terms_acceptances
    WHERE user_id = ?
  `).get(user.id) as { terms_version: string; accepted_at: string } | undefined;

  const isAccepted = !!row && row.terms_version === CURRENT_TERMS_VERSION;

  return res.json({
    hasAccepted: isAccepted,
    acceptedAt: row?.accepted_at || null,
    termsVersion: row?.terms_version || null,
    currentVersion: CURRENT_TERMS_VERSION,
  });
});

// Accept Terms
termsRouter.post('/accept', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { termsVersion = CURRENT_TERMS_VERSION, confirmed } = req.body;

  if (!confirmed) {
    return res.status(400).json({ error: 'You must confirm that you have read and agreed to the terms.' });
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO terms_acceptances (id, user_id, role, terms_version, accepted_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      terms_version = excluded.terms_version,
      accepted_at = excluded.accepted_at
  `).run(id, user.id, user.role, termsVersion, now);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    user.id,
    'ACCEPT_TERMS',
    'terms_acceptance',
    user.id,
    JSON.stringify({ role: user.role, version: termsVersion }),
    now
  );

  return res.json({
    message: 'Terms successfully accepted.',
    acceptedAt: now,
    termsVersion,
  });
});
