import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';
import { dispatchEventToUser } from '../sse.js';

export const invitationRouter = Router();

// Send Invitation (Agency)
invitationRouter.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'agency') {
    return res.status(403).json({ error: 'Only registered agencies can send project invitations.' });
  }

  const {
    creatorId,
    productName,
    productDescription,
    projectType,
    proposedBudgetInr,
    creativeRequirements,
    deliverables,
    attachments = [],
    targetLocation = '',
    deadline,
    additionalInstructions = '',
    affiliatePermission = 'To be discussed',
    paymentTerms = '100% upon deliverable approval',
    usageLicensingTerms = 'Full commercial digital advertising rights for 1 year',
  } = req.body;

  if (
    !creatorId ||
    !productName ||
    !productDescription ||
    !projectType ||
    !proposedBudgetInr ||
    Number(proposedBudgetInr) <= 0 ||
    !creativeRequirements ||
    !deliverables ||
    !deadline
  ) {
    return res.status(400).json({ error: 'All essential project brief details and a valid budget in INR are required.' });
  }

  // Verify creator exists and is published
  const creator = db.prepare(`SELECT user_id, full_name FROM creator_profiles WHERE user_id = ? AND is_published = 1`).get(creatorId) as any;
  if (!creator) {
    return res.status(404).json({ error: 'Creator not found or is not currently accepting invitations.' });
  }

  const agency = db.prepare(`SELECT agency_name, company_brand_name FROM agency_profiles WHERE user_id = ?`).get(user.id) as any;
  const agencyName = agency?.company_brand_name || agency?.agency_name || 'An Agency';

  const invitationId = crypto.randomUUID();
  const negotiationId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create Invitation
  db.prepare(`
    INSERT INTO invitations (
      id, agency_id, creator_id, product_name, product_description, project_type,
      proposed_budget_inr, creative_requirements, deliverables, attachments,
      target_location, deadline, additional_instructions, affiliate_permission,
      payment_terms, usage_licensing_terms, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Creator Response', ?, ?)
  `).run(
    invitationId,
    user.id,
    creatorId,
    productName.trim(),
    productDescription.trim(),
    projectType,
    Number(proposedBudgetInr),
    creativeRequirements.trim(),
    deliverables.trim(),
    JSON.stringify(attachments || []),
    targetLocation.trim(),
    deadline,
    additionalInstructions.trim(),
    affiliatePermission,
    paymentTerms,
    usageLicensingTerms,
    now,
    now
  );

  // Record Initial Negotiation history entry
  db.prepare(`
    INSERT INTO negotiations (
      id, invitation_id, sender_id, sender_role, action_type,
      proposed_price_inr, proposed_deadline, proposed_deliverables,
      proposed_affiliate_permission, proposed_payment_terms, message, created_at
    ) VALUES (?, ?, ?, 'agency', 'initial', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    negotiationId,
    invitationId,
    user.id,
    Number(proposedBudgetInr),
    deadline,
    deliverables,
    affiliatePermission,
    paymentTerms,
    `Initial project invitation sent for "${productName}".`,
    now
  );

  // Dispatch persistent notification & real-time SSE to creator
  dispatchEventToUser(creatorId, {
    type: 'INVITATION_RECEIVED',
    title: 'New Project Invitation',
    message: `${agencyName} has sent you a project invitation for "${productName}" with a budget of ₹${Number(proposedBudgetInr).toLocaleString('en-IN')}.`,
    link: `/creator/invitations?id=${invitationId}`,
    payload: { invitationId },
  });

  return res.status(201).json({
    message: 'Invitation sent successfully.',
    invitationId,
  });
});

// List Invitations (For creator or agency)
invitationRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let invitations: any[] = [];

  if (user.role === 'creator') {
    invitations = db.prepare(`
      SELECT i.*, ap.agency_name, ap.company_brand_name, ap.contact_person, ap.office_location
      FROM invitations i
      JOIN agency_profiles ap ON i.agency_id = ap.user_id
      WHERE i.creator_id = ?
      ORDER BY i.updated_at DESC
    `).all(user.id) as any[];
  } else {
    invitations = db.prepare(`
      SELECT i.*, cp.full_name as creator_name, cp.profile_image as creator_image, cp.location as creator_location
      FROM invitations i
      JOIN creator_profiles cp ON i.creator_id = cp.user_id
      WHERE i.agency_id = ?
      ORDER BY i.updated_at DESC
    `).all(user.id) as any[];
  }

  return res.json(
    invitations.map((inv) => ({
      ...inv,
      attachments: JSON.parse(inv.attachments || '[]'),
    }))
  );
});

// Get Single Invitation with full negotiation history
invitationRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const invitation = db.prepare(`
    SELECT i.*,
           ap.agency_name, ap.company_brand_name, ap.contact_person,
           cp.full_name as creator_name, cp.profile_image as creator_image
    FROM invitations i
    JOIN agency_profiles ap ON i.agency_id = ap.user_id
    JOIN creator_profiles cp ON i.creator_id = cp.user_id
    WHERE i.id = ? AND (i.creator_id = ? OR i.agency_id = ?)
  `).get(id, user.id, user.id) as any;

  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found or access denied.' });
  }

  const history = db.prepare(`
    SELECT * FROM negotiations WHERE invitation_id = ? ORDER BY created_at ASC
  `).all(id) as any[];

  return res.json({
    invitation: {
      ...invitation,
      attachments: JSON.parse(invitation.attachments || '[]'),
    },
    negotiationHistory: history,
  });
});

// Creator Action: Accept / Propose Changes / Decline
invitationRouter.post('/:id/creator-response', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'creator') {
    return res.status(403).json({ error: 'Only the invited creator can respond to this invitation.' });
  }

  const { id } = req.params;
  const { action, proposedPriceInr, proposedDeadline, proposedDeliverables, proposedAffiliatePermission, proposedPaymentTerms, message } = req.body;

  const invitation = db.prepare(`SELECT * FROM invitations WHERE id = ? AND creator_id = ?`).get(id, user.id) as any;
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found.' });
  }

  const now = new Date().toISOString();
  const creator = db.prepare(`SELECT full_name FROM creator_profiles WHERE user_id = ?`).get(user.id) as any;
  const creatorName = creator?.full_name || 'Creator';

  if (action === 'accept') {
    // Creator accepts the current proposal terms
    db.prepare(`
      UPDATE invitations
      SET status = 'Accepted', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    db.prepare(`
      INSERT INTO negotiations (
        id, invitation_id, sender_id, sender_role, action_type,
        proposed_price_inr, proposed_deadline, proposed_deliverables,
        proposed_affiliate_permission, proposed_payment_terms, message, created_at
      ) VALUES (?, ?, ?, 'creator', 'accepted', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      id,
      user.id,
      invitation.proposed_budget_inr,
      invitation.deadline,
      invitation.deliverables,
      invitation.affiliate_permission,
      invitation.payment_terms,
      message || `${creatorName} accepted the project proposal.`,
      now
    );

    dispatchEventToUser(invitation.agency_id, {
      type: 'INVITATION_ACCEPTED',
      title: 'Invitation Accepted',
      message: `${creatorName} has accepted your proposal for "${invitation.product_name}". You can now confirm the project to begin work.`,
      link: `/agency/invitations?id=${id}`,
      payload: { invitationId: id },
    });

    return res.json({ message: 'Invitation accepted. Awaiting mutual confirmation.' });
  } else if (action === 'propose_changes') {
    if (!proposedPriceInr || !proposedDeadline || !proposedDeliverables) {
      return res.status(400).json({ error: 'Please provide the counter-offered price, deadline, and deliverables.' });
    }

    db.prepare(`
      UPDATE invitations
      SET proposed_budget_inr = ?, deadline = ?, deliverables = ?,
          affiliate_permission = COALESCE(?, affiliate_permission),
          payment_terms = COALESCE(?, payment_terms),
          status = 'Changes Proposed', updated_at = ?
      WHERE id = ?
    `).run(
      Number(proposedPriceInr),
      proposedDeadline,
      proposedDeliverables,
      proposedAffiliatePermission,
      proposedPaymentTerms,
      now,
      id
    );

    db.prepare(`
      INSERT INTO negotiations (
        id, invitation_id, sender_id, sender_role, action_type,
        proposed_price_inr, proposed_deadline, proposed_deliverables,
        proposed_affiliate_permission, proposed_payment_terms, message, created_at
      ) VALUES (?, ?, ?, 'creator', 'proposal', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      id,
      user.id,
      Number(proposedPriceInr),
      proposedDeadline,
      proposedDeliverables,
      proposedAffiliatePermission,
      proposedPaymentTerms,
      message || `${creatorName} proposed adjusted terms.`,
      now
    );

    dispatchEventToUser(invitation.agency_id, {
      type: 'INVITATION_COUNTER',
      title: 'Changes Proposed on Invitation',
      message: `${creatorName} proposed updated terms (₹${Number(proposedPriceInr).toLocaleString('en-IN')}, Deadline: ${proposedDeadline}) for "${invitation.product_name}".`,
      link: `/agency/invitations?id=${id}`,
      payload: { invitationId: id },
    });

    return res.json({ message: 'Proposed changes sent to the agency.' });
  } else if (action === 'decline') {
    db.prepare(`
      UPDATE invitations
      SET status = 'Declined', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    db.prepare(`
      INSERT INTO negotiations (
        id, invitation_id, sender_id, sender_role, action_type,
        message, created_at
      ) VALUES (?, ?, ?, 'creator', 'declined', ?, ?)
    `).run(
      crypto.randomUUID(),
      id,
      user.id,
      message || `${creatorName} declined this invitation.`,
      now
    );

    dispatchEventToUser(invitation.agency_id, {
      type: 'INVITATION_DECLINED',
      title: 'Invitation Declined',
      message: `${creatorName} declined the invitation for "${invitation.product_name}".`,
      link: `/agency/invitations?id=${id}`,
      payload: { invitationId: id },
    });

    return res.json({ message: 'Invitation declined.' });
  }

  return res.status(400).json({ error: 'Invalid action.' });
});

// Agency Action: Counterproposal / Accept Changes / Close
invitationRouter.post('/:id/agency-response', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'agency') {
    return res.status(403).json({ error: 'Only the sponsoring agency can respond to this invitation.' });
  }

  const { id } = req.params;
  const { action, proposedPriceInr, proposedDeadline, proposedDeliverables, proposedAffiliatePermission, proposedPaymentTerms, message } = req.body;

  const invitation = db.prepare(`SELECT * FROM invitations WHERE id = ? AND agency_id = ?`).get(id, user.id) as any;
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found.' });
  }

  const now = new Date().toISOString();
  const agency = db.prepare(`SELECT company_brand_name, agency_name FROM agency_profiles WHERE user_id = ?`).get(user.id) as any;
  const agencyName = agency?.company_brand_name || agency?.agency_name || 'Agency';

  if (action === 'accept_changes') {
    db.prepare(`
      UPDATE invitations
      SET status = 'Accepted', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    db.prepare(`
      INSERT INTO negotiations (
        id, invitation_id, sender_id, sender_role, action_type,
        proposed_price_inr, proposed_deadline, proposed_deliverables,
        proposed_affiliate_permission, proposed_payment_terms, message, created_at
      ) VALUES (?, ?, ?, 'agency', 'accepted', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      id,
      user.id,
      invitation.proposed_budget_inr,
      invitation.deadline,
      invitation.deliverables,
      invitation.affiliate_permission,
      invitation.payment_terms,
      message || `${agencyName} accepted the creator's proposed terms.`,
      now
    );

    dispatchEventToUser(invitation.creator_id, {
      type: 'AGREEMENT_FINALIZED',
      title: 'Terms Agreed',
      message: `${agencyName} accepted your terms for "${invitation.product_name}". The project can now be confirmed.`,
      link: `/creator/invitations?id=${id}`,
      payload: { invitationId: id },
    });

    return res.json({ message: 'Terms accepted. Mutual agreement finalized.' });
  } else if (action === 'counter') {
    if (!proposedPriceInr || !proposedDeadline) {
      return res.status(400).json({ error: 'Counter-proposed price and deadline are required.' });
    }

    db.prepare(`
      UPDATE invitations
      SET proposed_budget_inr = ?, deadline = ?,
          deliverables = COALESCE(?, deliverables),
          affiliate_permission = COALESCE(?, affiliate_permission),
          payment_terms = COALESCE(?, payment_terms),
          status = 'Counterproposal Pending', updated_at = ?
      WHERE id = ?
    `).run(
      Number(proposedPriceInr),
      proposedDeadline,
      proposedDeliverables,
      proposedAffiliatePermission,
      proposedPaymentTerms,
      now,
      id
    );

    db.prepare(`
      INSERT INTO negotiations (
        id, invitation_id, sender_id, sender_role, action_type,
        proposed_price_inr, proposed_deadline, proposed_deliverables,
        proposed_affiliate_permission, proposed_payment_terms, message, created_at
      ) VALUES (?, ?, ?, 'agency', 'counterproposal', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      id,
      user.id,
      Number(proposedPriceInr),
      proposedDeadline,
      proposedDeliverables || invitation.deliverables,
      proposedAffiliatePermission || invitation.affiliate_permission,
      proposedPaymentTerms || invitation.payment_terms,
      message || `${agencyName} sent a counterproposal.`,
      now
    );

    dispatchEventToUser(invitation.creator_id, {
      type: 'COUNTERPROPOSAL_RECEIVED',
      title: 'Counterproposal Received',
      message: `${agencyName} sent a counterproposal (₹${Number(proposedPriceInr).toLocaleString('en-IN')}) for "${invitation.product_name}".`,
      link: `/creator/invitations?id=${id}`,
      payload: { invitationId: id },
    });

    return res.json({ message: 'Counterproposal submitted.' });
  } else if (action === 'close') {
    db.prepare(`
      UPDATE invitations
      SET status = 'Closed', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    db.prepare(`
      INSERT INTO negotiations (
        id, invitation_id, sender_id, sender_role, action_type,
        message, created_at
      ) VALUES (?, ?, ?, 'agency', 'closed', ?, ?)
    `).run(
      crypto.randomUUID(),
      id,
      user.id,
      message || `${agencyName} closed this invitation.`,
      now
    );

    dispatchEventToUser(invitation.creator_id, {
      type: 'INVITATION_CLOSED',
      title: 'Invitation Closed',
      message: `${agencyName} has closed the negotiation for "${invitation.product_name}".`,
      link: `/creator/invitations?id=${id}`,
      payload: { invitationId: id },
    });

    return res.json({ message: 'Invitation closed.' });
  }

  return res.status(400).json({ error: 'Invalid action.' });
});

// Confirm Project from Mutual Agreement
invitationRouter.post('/:id/confirm-project', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const invitation = db.prepare(`SELECT * FROM invitations WHERE id = ? AND (agency_id = ? OR creator_id = ?)`).get(id, user.id, user.id) as any;
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found or access denied.' });
  }

  if (invitation.status !== 'Accepted') {
    return res.status(400).json({
      error: 'Project cannot be confirmed until both parties have accepted mutual terms (current status: ' + invitation.status + ').',
    });
  }

  // Check if project already created
  const existingProject = db.prepare(`SELECT id FROM projects WHERE invitation_id = ?`).get(id) as any;
  if (existingProject) {
    return res.json({ message: 'Project already confirmed.', projectId: existingProject.id });
  }

  const projectId = crypto.randomUUID();
  const paymentRecordId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create Project
  db.prepare(`
    INSERT INTO projects (
      id, invitation_id, agency_id, creator_id, title, description,
      project_type, agreed_price_inr, agreed_deliverables, agreed_deadline,
      affiliate_permission, payment_terms, usage_licensing_terms, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?)
  `).run(
    projectId,
    id,
    invitation.agency_id,
    invitation.creator_id,
    invitation.product_name,
    invitation.product_description,
    invitation.project_type,
    invitation.proposed_budget_inr,
    invitation.deliverables,
    invitation.deadline,
    invitation.affiliate_permission,
    invitation.payment_terms,
    invitation.usage_licensing_terms,
    now,
    now
  );

  // Initialize Payment Record (status: Payment Due)
  db.prepare(`
    INSERT INTO payment_records (
      id, project_id, agency_id, creator_id, amount_inr, due_date,
      method, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'Direct Bank Transfer', 'Payment Due', ?, ?)
  `).run(
    paymentRecordId,
    projectId,
    invitation.agency_id,
    invitation.creator_id,
    invitation.proposed_budget_inr,
    invitation.deadline,
    now,
    now
  );

  // Update invitation status to Project Confirmed
  db.prepare(`UPDATE invitations SET status = 'Project Confirmed', updated_at = ? WHERE id = ?`).run(now, id);

  // Notify both parties
  const notifyRecipient = user.role === 'agency' ? invitation.creator_id : invitation.agency_id;
  dispatchEventToUser(notifyRecipient, {
    type: 'PROJECT_CONFIRMED',
    title: 'Project Confirmed & Workspace Active',
    message: `Project for "${invitation.product_name}" has been mutually confirmed! You can now manage deliverables and milestones in the workspace.`,
    link: `/${user.role === 'agency' ? 'creator' : 'agency'}/projects?id=${projectId}`,
    payload: { projectId },
  });

  return res.status(201).json({
    message: 'Project confirmed successfully! Project workspace is now active.',
    projectId,
  });
});
