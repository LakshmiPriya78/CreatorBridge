import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';
import { dispatchEventToUser } from '../sse.js';

export const paymentRouter = Router();

// Get Creator's Bank Details for Authorized Confirmed Project (Agency only)
paymentRouter.get('/project/:projectId/bank-details', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'agency') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { projectId } = req.params;
  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND agency_id = ?`).get(projectId, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Confirmed project not found or unauthorized.' });
  }

  const bankDetails = db.prepare(`
    SELECT account_holder_name, bank_account_number, ifsc_code, verification_status
    FROM creator_payment_details
    WHERE creator_id = ?
  `).get(project.creator_id) as any;

  if (!bankDetails) {
    return res.status(404).json({
      error: 'The creator has not yet submitted their bank payment details. Please message them to provide bank details.',
    });
  }

  return res.json({
    projectId: project.id,
    projectTitle: project.title,
    agreedAmountInr: project.agreed_price_inr,
    accountHolderName: bankDetails.account_holder_name,
    bankAccountNumber: bankDetails.bank_account_number,
    ifscCode: bankDetails.ifsc_code,
    verificationStatus: bankDetails.verification_status,
  });
});

// Agency records Direct Bank Transfer initiated
paymentRouter.post('/project/:projectId/initiate', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'agency') {
    return res.status(403).json({ error: 'Only the sponsoring agency can record bank transfer initiation.' });
  }

  const { projectId } = req.params;
  const { amountTransferredInr, transferDate, transactionReference, receiptUrl = '', notes = '' } = req.body;

  if (!amountTransferredInr || !transferDate || !transactionReference) {
    return res.status(400).json({ error: 'Amount transferred, transfer date, and transaction reference (UTR) are required.' });
  }

  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND agency_id = ?`).get(projectId, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const now = new Date().toISOString();

  // Update or insert payment record
  db.prepare(`
    UPDATE payment_records
    SET amount_inr = ?, transfer_date = ?, transaction_reference = ?,
        receipt_url = ?, agency_notes = ?, status = 'Payment Initiated', updated_at = ?
    WHERE project_id = ?
  `).run(
    Number(amountTransferredInr),
    transferDate,
    transactionReference.trim(),
    receiptUrl,
    notes.trim(),
    now,
    projectId
  );

  const agency = db.prepare(`SELECT company_brand_name, agency_name FROM agency_profiles WHERE user_id = ?`).get(user.id) as any;
  const agencyName = agency?.company_brand_name || agency?.agency_name || 'Agency';

  // Notify creator to verify and confirm receipt
  dispatchEventToUser(project.creator_id, {
    type: 'PAYMENT_INITIATED',
    title: 'Payment Transfer Recorded',
    message: `${agencyName} has initiated a bank transfer of ₹${Number(amountTransferredInr).toLocaleString('en-IN')} (Ref: ${transactionReference}). Please verify your bank account and confirm receipt.`,
    link: `/creator/payments?projectId=${projectId}`,
    payload: { projectId, amount: amountTransferredInr, transactionReference },
  });

  return res.json({ message: 'Payment recorded as initiated. Awaiting creator confirmation of receipt.' });
});

// Creator Confirms Payment Received
const handleConfirmReceipt = (req: AuthenticatedRequest, res: any) => {
  const user = req.user!;
  if (user.role !== 'creator') {
    return res.status(403).json({ error: 'Only the creator recipient can confirm receipt of payment.' });
  }

  const { projectId } = req.params;

  // 1. Identify the exact payment associated with this request and verify creator ownership
  const paymentRecord = db.prepare(`
    SELECT * FROM payment_records
    WHERE (project_id = ? OR id = ?) AND creator_id = ?
  `).get(projectId, projectId, user.id) as any;

  if (!paymentRecord) {
    return res.status(404).json({ error: 'Payment record not found or not owned by you.' });
  }

  // 2. Identify and verify the associated project
  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND creator_id = ?`).get(paymentRecord.project_id, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Associated project not found or access denied.' });
  }

  // 3. Verify payment is in the correct state for receipt confirmation
  if (paymentRecord.status === 'Payment Completed') {
    return res.json({
      message: 'Payment has already been confirmed as received.',
      paymentRecordId: paymentRecord.id,
      projectId: project.id,
      status: 'Payment Completed',
      confirmationDate: paymentRecord.creator_confirmation_date,
    });
  }

  if (paymentRecord.status !== 'Payment Initiated' && paymentRecord.status !== 'Awaiting Confirmation') {
    return res.status(400).json({
      error: `Cannot confirm receipt. Current payment status is "${paymentRecord.status}". Sponsoring agency must initiate the transfer first.`,
    });
  }

  const now = new Date().toISOString();

  // 4. Atomically persist creator's receipt confirmation with timestamp
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      UPDATE payment_records
      SET status = 'Payment Completed', creator_confirmation_date = ?, updated_at = ?
      WHERE id = ? AND creator_id = ?
    `).run(now, now, paymentRecord.id, user.id);

    // 5. If project is Approved or has approved deliverables, transition project to Completed
    const hasApprovedDeliverable = db.prepare(`
      SELECT id FROM deliverables WHERE project_id = ? AND status = 'Approved' LIMIT 1
    `).get(project.id);

    if (project.status === 'Approved' || hasApprovedDeliverable) {
      db.prepare(`UPDATE projects SET status = 'Completed', updated_at = ? WHERE id = ?`).run(now, project.id);
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Error in confirm receipt transaction:', err);
    return res.status(500).json({ error: 'Failed to persist confirmation in database.' });
  }

  const creator = db.prepare(`SELECT full_name FROM creator_profiles WHERE user_id = ?`).get(user.id) as any;
  const creatorName = creator?.full_name || 'Creator';

  // 6. Notify Agency in real time that payment receipt is confirmed and review section is unlocked
  dispatchEventToUser(project.agency_id, {
    type: 'PAYMENT_COMPLETED',
    title: 'Payment Confirmed & Receipt Verified!',
    message: `${creatorName} has confirmed receipt of the direct bank transfer for "${project.title}". Review and ratings are now unlocked!`,
    link: `/agency/reviews?projectId=${project.id}`,
    payload: {
      projectId: project.id,
      paymentId: paymentRecord.id,
      status: 'Payment Completed',
      confirmedAt: now,
    },
  });

  return res.json({
    message: 'Payment confirmed as received. Direct bank transfer marked completed!',
    paymentRecordId: paymentRecord.id,
    projectId: project.id,
    status: 'Payment Completed',
    confirmationDate: now,
  });
};

paymentRouter.post('/project/:projectId/confirm-receipt', requireAuth, handleConfirmReceipt);
paymentRouter.post('/:projectId/confirm-receipt', requireAuth, handleConfirmReceipt);

// Report Payment Dispute (by Creator or Agency)
paymentRouter.post('/project/:projectId/dispute', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { projectId } = req.params;
  const { disputeReason } = req.body;

  if (!disputeReason || !disputeReason.trim()) {
    return res.status(400).json({ error: 'Reason for dispute is required.' });
  }

  const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND (agency_id = ? OR creator_id = ?)`).get(projectId, user.id, user.id) as any;
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE payment_records
    SET status = 'Payment Disputed', dispute_reason = ?, updated_at = ?
    WHERE project_id = ?
  `).run(disputeReason.trim(), now, projectId);

  const notifyUser = user.role === 'creator' ? project.agency_id : project.creator_id;
  dispatchEventToUser(notifyUser, {
    type: 'PAYMENT_DISPUTED',
    title: 'Payment Disputed',
    message: `A payment dispute was reported on "${project.title}": "${disputeReason}"`,
    link: `/${user.role === 'creator' ? 'agency' : 'creator'}/payments?projectId=${projectId}`,
    payload: { projectId, disputeReason },
  });

  return res.json({ message: 'Dispute recorded. Our support & mediation team has been notified.' });
});

// Agency Payments History & Metrics
paymentRouter.get('/agency/history', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'agency') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const records = db.prepare(`
    SELECT pr.*, p.title as project_title, cp.full_name as creator_name, cp.user_id as creator_user_id
    FROM payment_records pr
    JOIN projects p ON pr.project_id = p.id
    JOIN creator_profiles cp ON pr.creator_id = cp.user_id
    WHERE pr.agency_id = ?
    ORDER BY pr.updated_at DESC
  `).all(user.id) as any[];

  // Real calculations
  let totalPayments = 0;
  let pendingPayments = 0;
  let completedPayments = 0;
  let awaitingReview = 0;

  for (const r of records) {
    if (r.status === 'Payment Completed') {
      completedPayments += r.amount_inr;
    } else if (r.status === 'Payment Due') {
      pendingPayments += r.amount_inr;
    } else if (r.status === 'Payment Initiated' || r.status === 'Awaiting Confirmation') {
      awaitingReview += r.amount_inr;
    }
    totalPayments += r.amount_inr;
  }

  return res.json({
    records,
    metrics: {
      totalPayments,
      pendingPayments,
      completedPayments,
      awaitingReview,
      count: records.length,
    },
  });
});

// Creator Payments & Earnings Metrics
paymentRouter.get('/creator/earnings', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'creator') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const records = db.prepare(`
    SELECT pr.*, p.title as project_title, ap.agency_name, ap.company_brand_name
    FROM payment_records pr
    JOIN projects p ON pr.project_id = p.id
    JOIN agency_profiles ap ON pr.agency_id = ap.user_id
    WHERE pr.creator_id = ?
    ORDER BY pr.updated_at DESC
  `).all(user.id) as any[];

  // Total received MUST include ONLY payments confirmed as received ('Payment Completed')
  let totalReceived = 0;
  let paymentsReceivedCount = 0;
  let pendingPayments = 0;
  let overduePayments = 0;

  const now = new Date();

  for (const r of records) {
    if (r.status === 'Payment Completed') {
      totalReceived += r.amount_inr;
      paymentsReceivedCount += 1;
    } else if (r.status === 'Payment Due' || r.status === 'Payment Initiated' || r.status === 'Awaiting Confirmation') {
      pendingPayments += r.amount_inr;
      if (r.due_date && new Date(r.due_date) < now) {
        overduePayments += r.amount_inr;
      }
    }
  }

  return res.json({
    records,
    metrics: {
      totalReceived,
      paymentsReceivedCount,
      pendingPayments,
      overduePayments,
    },
  });
});
