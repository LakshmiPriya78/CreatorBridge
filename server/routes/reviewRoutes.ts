import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';
import { dispatchEventToUser } from '../sse.js';

export const reviewRouter = Router();

// Submit Review (Agency for Completed Project)
reviewRouter.post('/project/:projectId', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'agency') {
    return res.status(403).json({ error: 'Only the sponsoring agency can leave an official project review.' });
  }

  const { projectId } = req.params;
  const { rating, deliveryRating, communicationRating, feedback } = req.body;

  if (
    !rating ||
    !deliveryRating ||
    !communicationRating ||
    !feedback ||
    rating < 1 ||
    rating > 5 ||
    deliveryRating < 1 ||
    deliveryRating > 5 ||
    communicationRating < 1 ||
    communicationRating > 5
  ) {
    return res.status(400).json({ error: 'All rating categories (1-5 stars) and constructive written feedback are required.' });
  }

  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND agency_id = ?`).get(projectId, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Project not found or unauthorized.' });
  }

  // Must not allow reviewing own account
  if (project.creator_id === user.id) {
    return res.status(400).json({ error: 'You cannot review yourself.' });
  }

  // Ensure creator has confirmed receipt of direct bank transfer payment
  const payment = db.prepare(`
    SELECT status, creator_confirmation_date
    FROM payment_records
    WHERE project_id = ? AND agency_id = ?
  `).get(projectId, user.id) as any;

  if (!payment || payment.status !== 'Payment Completed' || !payment.creator_confirmation_date) {
    return res.status(400).json({
      error: 'Review section is locked until the creator has confirmed receipt of the direct bank transfer.',
    });
  }

  // Check if review already exists for this project (exactly one review per project)
  const existing = db.prepare(`SELECT id FROM reviews WHERE project_id = ?`).get(projectId);
  if (existing) {
    return res.status(400).json({ error: 'An official review has already been submitted for this project.' });
  }

  const reviewId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reviews (
      id, project_id, agency_id, creator_id, rating, delivery_rating, communication_rating, feedback, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reviewId,
    projectId,
    user.id,
    project.creator_id,
    Math.round(Number(rating)),
    Math.round(Number(deliveryRating)),
    Math.round(Number(communicationRating)),
    feedback.trim(),
    now
  );

  const agency = db.prepare(`SELECT company_brand_name, agency_name FROM agency_profiles WHERE user_id = ?`).get(user.id) as any;
  const agencyName = agency?.company_brand_name || agency?.agency_name || 'Agency';

  dispatchEventToUser(project.creator_id, {
    type: 'REVIEW_RECEIVED',
    title: 'New Review Received!',
    message: `${agencyName} left a ${rating}-star review on "${project.title}".`,
    link: `/creator/reviews`,
    payload: { reviewId, rating },
  });

  return res.status(201).json({
    message: 'Review submitted successfully. Thank you for your feedback!',
    reviewId,
  });
});

// List Reviews for a creator (Public or Creator View)
reviewRouter.get('/creator/:creatorId', (req, res) => {
  const { creatorId } = req.params;

  const reviews = db.prepare(`
    SELECT r.*, ap.agency_name, ap.company_brand_name, p.title as project_title
    FROM reviews r
    JOIN agency_profiles ap ON r.agency_id = ap.user_id
    JOIN projects p ON r.project_id = p.id
    WHERE r.creator_id = ?
    ORDER BY r.created_at DESC
  `).all(creatorId) as any[];

  const count = reviews.length;
  const avg = count > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1))
    : 0;

  return res.json({
    reviews,
    count,
    averageRating: avg,
  });
});

// Report abusive review (Creator)
reviewRouter.post('/:reviewId/report', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { reviewId } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Please provide a reason for reporting this review.' });
  }

  const review = db.prepare(`SELECT * FROM reviews WHERE id = ? AND creator_id = ?`).get(reviewId, user.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found or unauthorized.' });
  }

  db.prepare(`
    UPDATE reviews
    SET is_reported = 1, report_reason = ?
    WHERE id = ?
  `).run(reason.trim(), reviewId);

  return res.json({ message: 'Review flagged for moderation review by platform integrity team.' });
});
