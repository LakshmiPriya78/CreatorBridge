import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../auth.js';

export const agencyRouter = Router();

// Get Agency's own profile
agencyRouter.get('/profile', requireAuth, requireRole('agency'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const profile = db.prepare(`SELECT * FROM agency_profiles WHERE user_id = ?`).get(userId);

  if (!profile) {
    return res.status(404).json({ error: 'Agency profile not found.' });
  }

  return res.json(profile);
});

// Update Agency's profile
agencyRouter.put('/profile', requireAuth, requireRole('agency'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const {
    agency_name,
    contact_person,
    account_type = 'Agency',
    company_brand_name,
    country = 'India',
    state = '',
    city = '',
    locality = '',
    office_location = '',
    filming_location = '',
  } = req.body;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE agency_profiles
    SET agency_name = ?, contact_person = ?, account_type = ?,
        company_brand_name = ?, country = ?, state = ?, city = ?,
        locality = ?, office_location = ?, filming_location = ?, updated_at = ?
    WHERE user_id = ?
  `).run(
    agency_name || '',
    contact_person || '',
    account_type,
    company_brand_name || '',
    country,
    state,
    city,
    locality,
    office_location,
    filming_location,
    now,
    userId
  );

  return res.json({ message: 'Agency profile updated successfully.' });
});

// Agency verification submit
agencyRouter.post('/verify', requireAuth, requireRole('agency'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { businessDocumentUrl, notes } = req.body;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE agency_profiles
    SET verification_status = 'Verified', verification_notes = ?, updated_at = ?
    WHERE user_id = ?
  `).run(notes || businessDocumentUrl || 'Self-verified via business registry', now, userId);

  return res.json({ message: 'Agency verification confirmed.' });
});

// Agency Dashboard Metrics
agencyRouter.get('/dashboard-stats', requireAuth, requireRole('agency'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const invitationsCount = (
    db.prepare(`SELECT COUNT(*) as count FROM invitations WHERE agency_id = ? AND status = 'Pending Creator Response'`).get(userId) as any
  ).count;

  const activeProjectsCount = (
    db.prepare(`SELECT COUNT(*) as count FROM projects WHERE agency_id = ? AND status IN ('Confirmed', 'In Progress', 'Submitted', 'Revision Requested', 'Resubmitted')`).get(userId) as any
  ).count;

  const completedProjectsCount = (
    db.prepare(`SELECT COUNT(*) as count FROM projects WHERE agency_id = ? AND status = 'Completed'`).get(userId) as any
  ).count;

  const totalSpentRow = db.prepare(`
    SELECT COALESCE(SUM(amount_inr), 0) as total
    FROM payment_records
    WHERE agency_id = ? AND status = 'Payment Completed'
  `).get(userId) as any;

  const pendingPaymentsRow = db.prepare(`
    SELECT COALESCE(SUM(amount_inr), 0) as total
    FROM payment_records
    WHERE agency_id = ? AND status IN ('Payment Due', 'Payment Initiated', 'Awaiting Confirmation')
  `).get(userId) as any;

  return res.json({
    pendingInvitations: invitationsCount,
    activeProjects: activeProjectsCount,
    completedProjects: completedProjectsCount,
    totalSpentInr: totalSpentRow.total,
    pendingPaymentsInr: pendingPaymentsRow.total,
  });
});
