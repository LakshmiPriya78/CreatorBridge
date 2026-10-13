import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';
import { dispatchEventToUser } from '../sse.js';

export const projectRouter = Router();

// List Projects (for creator or agency)
projectRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let projects: any[] = [];

  if (user.role === 'creator') {
    projects = db.prepare(`
      SELECT p.*,
             ap.agency_name, ap.company_brand_name, ap.contact_person,
             pr.status as payment_status, pr.amount_inr as payment_amount,
             pr.creator_confirmation_date as payment_confirmed_at,
             (SELECT COUNT(*) FROM deliverables d WHERE d.project_id = p.id) as deliverable_count,
             (SELECT COUNT(*) FROM reviews r WHERE r.project_id = p.id) as review_count
      FROM projects p
      JOIN agency_profiles ap ON p.agency_id = ap.user_id
      LEFT JOIN payment_records pr ON pr.project_id = p.id
      WHERE p.creator_id = ?
      ORDER BY p.updated_at DESC
    `).all(user.id) as any[];
  } else {
    projects = db.prepare(`
      SELECT p.*,
             cp.full_name as creator_name, cp.profile_image as creator_image,
             pr.status as payment_status, pr.amount_inr as payment_amount,
             pr.creator_confirmation_date as payment_confirmed_at,
             (SELECT COUNT(*) FROM deliverables d WHERE d.project_id = p.id) as deliverable_count,
             (SELECT COUNT(*) FROM reviews r WHERE r.project_id = p.id) as review_count
      FROM projects p
      JOIN creator_profiles cp ON p.creator_id = cp.user_id
      LEFT JOIN payment_records pr ON pr.project_id = p.id
      WHERE p.agency_id = ?
      ORDER BY p.updated_at DESC
    `).all(user.id) as any[];
  }

  return res.json(projects);
});

// Get Single Project Details with Deliverables and Payment Info
projectRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const project = db.prepare(`
    SELECT p.*,
           ap.agency_name, ap.company_brand_name, ap.contact_person, ap.office_location,
           cp.full_name as creator_name, cp.profile_image as creator_image, cp.location as creator_location
    FROM projects p
    JOIN agency_profiles ap ON p.agency_id = ap.user_id
    JOIN creator_profiles cp ON p.creator_id = cp.user_id
    WHERE p.id = ? AND (p.agency_id = ? OR p.creator_id = ?)
  `).get(id, user.id, user.id) as any;

  if (!project) {
    return res.status(404).json({ error: 'Project not found or unauthorized.' });
  }

  const deliverables = db.prepare(`
    SELECT * FROM deliverables WHERE project_id = ? ORDER BY version_number ASC
  `).all(id) as any[];

  const paymentRecord = db.prepare(`
    SELECT * FROM payment_records WHERE project_id = ?
  `).get(id) as any;

  const review = db.prepare(`
    SELECT * FROM reviews WHERE project_id = ?
  `).get(id) as any;

  return res.json({
    project,
    deliverables: deliverables.map((d) => ({
      ...d,
      file_urls: JSON.parse(d.file_urls || '[]'),
    })),
    paymentRecord: paymentRecord || null,
    review: review || null,
  });
});

// Update Project Status to "In Progress" (Creator starts work)
projectRouter.post('/:id/start', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND creator_id = ?`).get(id, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Project not found or unauthorized.' });
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE projects SET status = 'In Progress', updated_at = ? WHERE id = ?`).run(now, id);

  dispatchEventToUser(project.agency_id, {
    type: 'PROJECT_STATUS_UPDATE',
    title: 'Work Started on Project',
    message: `Creator has begun work on "${project.title}".`,
    link: `/agency/projects?id=${id}`,
    payload: { projectId: id, status: 'In Progress' },
  });

  return res.json({ message: 'Project status updated to In Progress.' });
});

// Submit Deliverables (Creator)
projectRouter.post('/:id/submit-deliverable', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'creator') {
    return res.status(403).json({ error: 'Only the assigned creator can submit deliverables.' });
  }

  const { id } = req.params;
  const { submissionNotes, fileUrls = [] } = req.body;

  if (!submissionNotes || fileUrls.length === 0) {
    return res.status(400).json({ error: 'Submission notes and at least one deliverable file or URL are required.' });
  }

  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND creator_id = ?`).get(id, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const existingDeliverablesCount = (
    db.prepare(`SELECT COUNT(*) as count FROM deliverables WHERE project_id = ?`).get(id) as any
  ).count;
  const versionNumber = existingDeliverablesCount + 1;
  const deliverableId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create Deliverable
  db.prepare(`
    INSERT INTO deliverables (
      id, project_id, creator_id, version_number, submission_notes, file_urls, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'Pending Review', ?)
  `).run(
    deliverableId,
    id,
    user.id,
    versionNumber,
    submissionNotes.trim(),
    JSON.stringify(fileUrls),
    now
  );

  const newStatus = versionNumber > 1 ? 'Resubmitted' : 'Submitted';
  db.prepare(`UPDATE projects SET status = ?, updated_at = ? WHERE id = ?`).run(newStatus, now, id);

  // Notify Agency
  dispatchEventToUser(project.agency_id, {
    type: 'DELIVERABLE_SUBMITTED',
    title: `Deliverable ${versionNumber > 1 ? `v${versionNumber} Resubmitted` : 'Submitted'}`,
    message: `New deliverables have been submitted for "${project.title}". Please review and approve or provide revision notes.`,
    link: `/agency/projects?id=${id}`,
    payload: { projectId: id, deliverableId, versionNumber },
  });

  return res.status(201).json({
    message: `Deliverable v${versionNumber} submitted successfully.`,
    deliverableId,
    versionNumber,
  });
});

// Request Revision (Agency)
projectRouter.post('/:id/request-revision', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'agency') {
    return res.status(403).json({ error: 'Only the sponsoring agency can request revisions.' });
  }

  const { id } = req.params;
  const { revisionNotes } = req.body;

  if (!revisionNotes || !revisionNotes.trim()) {
    return res.status(400).json({ error: 'Clear revision instructions are required.' });
  }

  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND agency_id = ?`).get(id, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const latestDeliverable = db.prepare(`
    SELECT * FROM deliverables WHERE project_id = ? ORDER BY version_number DESC LIMIT 1
  `).get(id) as any;

  if (!latestDeliverable) {
    return res.status(400).json({ error: 'No deliverable has been submitted yet to request revisions on.' });
  }

  const now = new Date().toISOString();

  // Update latest deliverable
  db.prepare(`
    UPDATE deliverables
    SET status = 'Revision Requested', revision_notes = ?, reviewed_at = ?
    WHERE id = ?
  `).run(revisionNotes.trim(), now, latestDeliverable.id);

  // Update project status
  db.prepare(`UPDATE projects SET status = 'Revision Requested', updated_at = ? WHERE id = ?`).run(now, id);

  // Notify creator
  dispatchEventToUser(project.creator_id, {
    type: 'REVISION_REQUESTED',
    title: 'Revision Requested on Project',
    message: `The agency requested revisions on "${project.title}": "${revisionNotes.slice(0, 100)}..."`,
    link: `/creator/projects?id=${id}`,
    payload: { projectId: id, revisionNotes },
  });

  return res.json({ message: 'Revision request sent to creator.' });
});

// Approve Deliverable (Agency)
projectRouter.post('/:id/approve', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'agency') {
    return res.status(403).json({ error: 'Only the sponsoring agency can approve deliverables.' });
  }

  const { id } = req.params;
  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND agency_id = ?`).get(id, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const latestDeliverable = db.prepare(`
    SELECT * FROM deliverables WHERE project_id = ? ORDER BY version_number DESC LIMIT 1
  `).get(id) as any;

  const now = new Date().toISOString();

  if (latestDeliverable) {
    db.prepare(`
      UPDATE deliverables
      SET status = 'Approved', reviewed_at = ?
      WHERE id = ?
    `).run(now, latestDeliverable.id);
  }

  // Check if payment is already completed
  const payment = db.prepare(`SELECT status FROM payment_records WHERE project_id = ?`).get(id) as any;
  const nextStatus = payment && payment.status === 'Payment Completed' ? 'Completed' : 'Approved';

  db.prepare(`UPDATE projects SET status = ?, updated_at = ? WHERE id = ?`).run(nextStatus, now, id);

  // Notify creator
  dispatchEventToUser(project.creator_id, {
    type: 'DELIVERABLE_APPROVED',
    title: 'Deliverables Approved!',
    message: `Congratulations! The agency has approved your deliverables for "${project.title}". Direct bank transfer payment is now pending.`,
    link: `/creator/projects?id=${id}`,
    payload: { projectId: id, status: nextStatus },
  });

  return res.json({
    message: 'Deliverable approved! Next step: proceed to Direct Bank Transfer payment.',
    projectStatus: nextStatus,
  });
});
