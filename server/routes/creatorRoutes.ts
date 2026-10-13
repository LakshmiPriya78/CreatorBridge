import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../auth.js';

export const creatorRouter = Router();

// Helper to calculate profile completion
export function calculateProfileCompletion(profile: any, portfolioCount: number, pricingCount: number) {
  const steps = [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Full name, bio, and location details',
      completed: !!(profile.full_name?.trim() && profile.bio?.trim() && profile.location?.trim()),
    },
    {
      id: 'skills_tools',
      title: 'Skills & AI Tools',
      description: 'At least one skill and AI tool specified',
      completed: (() => {
        try {
          const skills = JSON.parse(profile.skills || '[]');
          const tools = JSON.parse(profile.ai_tools || '[]');
          return skills.length > 0 && tools.length > 0;
        } catch {
          return false;
        }
      })(),
    },
    {
      id: 'portfolio',
      title: 'Previous Work & Portfolio',
      description: 'At least one portfolio showcase item',
      completed: portfolioCount > 0,
    },
    {
      id: 'pricing_categories',
      title: 'Pricing & Categories',
      description: 'At least one category and pricing package',
      completed: (() => {
        try {
          const cats = JSON.parse(profile.categories || '[]');
          return cats.length > 0 && pricingCount > 0;
        } catch {
          return false;
        }
      })(),
    },
    {
      id: 'availability',
      title: 'Availability & Working Preferences',
      description: 'Turnaround time and availability preferences',
      completed: !!(profile.availability && profile.working_preferences && profile.turnaround_days > 0),
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  return {
    percentage,
    steps,
    canPublish: completedCount === steps.length,
  };
}

// Get Creator's own profile
creatorRouter.get('/profile', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const profile = db.prepare(`SELECT * FROM creator_profiles WHERE user_id = ?`).get(userId) as any;

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const portfolioItems = db.prepare(`
    SELECT * FROM portfolio_items WHERE creator_id = ? ORDER BY sort_order ASC, created_at DESC
  `).all(userId) as any[];

  const pricingPackages = db.prepare(`
    SELECT * FROM creator_pricing WHERE creator_id = ? ORDER BY created_at DESC
  `).all(userId) as any[];

  const completion = calculateProfileCompletion(profile, portfolioItems.length, pricingPackages.length);

  return res.json({
    profile: {
      ...profile,
      skills: JSON.parse(profile.skills || '[]'),
      ai_tools: JSON.parse(profile.ai_tools || '[]'),
      categories: JSON.parse(profile.categories || '[]'),
      is_published: !!profile.is_published,
    },
    portfolioItems: portfolioItems.map((p) => ({
      ...p,
      ai_tools: JSON.parse(p.ai_tools || '[]'),
      categories: JSON.parse(p.categories || '[]'),
    })),
    pricingPackages,
    completion,
  });
});

// Update Creator's profile
creatorRouter.put('/profile', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const {
    full_name,
    bio,
    country = 'India',
    state = '',
    city = '',
    location = '',
    contact_email = '',
    contact_phone = '',
    contact_type = 'Email',
    experience_level = 'Intermediate',
    experience_years = 1,
    skills = [],
    ai_tools = [],
    profile_image = '',
    categories = [],
    availability = 'Available',
    turnaround_days = 3,
    working_preferences = 'Remote',
    working_hours = '9 AM - 6 PM IST',
    communication_schedule = 'Standard business hours',
    workload_notes = '',
  } = req.body;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE creator_profiles
    SET full_name = ?, bio = ?, country = ?, state = ?, city = ?, location = ?,
        contact_email = ?, contact_phone = ?, contact_type = ?, experience_level = ?,
        experience_years = ?, skills = ?, ai_tools = ?, profile_image = ?,
        categories = ?, availability = ?, turnaround_days = ?, working_preferences = ?,
        working_hours = ?, communication_schedule = ?, workload_notes = ?, updated_at = ?
    WHERE user_id = ?
  `).run(
    full_name || '',
    bio || '',
    country,
    state,
    city,
    location,
    contact_email,
    contact_phone,
    contact_type,
    experience_level,
    Number(experience_years) || 1,
    JSON.stringify(skills || []),
    JSON.stringify(ai_tools || []),
    profile_image || '',
    JSON.stringify(categories || []),
    availability,
    Number(turnaround_days) || 3,
    working_preferences,
    working_hours,
    communication_schedule,
    workload_notes,
    now,
    userId
  );

  return res.json({ message: 'Profile updated successfully.' });
});

// Portfolio item routes
creatorRouter.get('/portfolio', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const items = db.prepare(`
    SELECT * FROM portfolio_items WHERE creator_id = ? ORDER BY sort_order ASC, created_at DESC
  `).all(userId) as any[];

  return res.json(
    items.map((item) => ({
      ...item,
      ai_tools: JSON.parse(item.ai_tools || '[]'),
      categories: JSON.parse(item.categories || '[]'),
    }))
  );
});

creatorRouter.post('/portfolio', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const {
    title,
    media_type,
    media_url,
    description,
    creative_process = '',
    creator_contribution = '',
    ai_tools = [],
    categories = [],
  } = req.body;

  if (!title || !media_type || !media_url || !description) {
    return res.status(400).json({ error: 'Title, media type, media URL, and description are required.' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO portfolio_items (
      id, creator_id, title, media_type, media_url, description,
      creative_process, creator_contribution, ai_tools, categories, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    title.trim(),
    media_type,
    media_url,
    description.trim(),
    creative_process.trim(),
    creator_contribution.trim(),
    JSON.stringify(ai_tools || []),
    JSON.stringify(categories || []),
    now
  );

  return res.status(201).json({ id, message: 'Portfolio item added successfully.' });
});

creatorRouter.put('/portfolio/:id', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const {
    title,
    media_type,
    media_url,
    description,
    creative_process = '',
    creator_contribution = '',
    ai_tools = [],
    categories = [],
  } = req.body;

  const result = db.prepare(`
    UPDATE portfolio_items
    SET title = ?, media_type = ?, media_url = ?, description = ?,
        creative_process = ?, creator_contribution = ?, ai_tools = ?, categories = ?
    WHERE id = ? AND creator_id = ?
  `).run(
    title,
    media_type,
    media_url,
    description,
    creative_process,
    creator_contribution,
    JSON.stringify(ai_tools || []),
    JSON.stringify(categories || []),
    id,
    userId
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Portfolio item not found or not owned by you.' });
  }

  return res.json({ message: 'Portfolio item updated.' });
});

creatorRouter.delete('/portfolio/:id', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = db.prepare(`
    DELETE FROM portfolio_items WHERE id = ? AND creator_id = ?
  `).run(id, userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Portfolio item not found or not owned by you.' });
  }

  return res.json({ message: 'Portfolio item deleted.' });
});

// Pricing routes
creatorRouter.get('/pricing', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const packages = db.prepare(`
    SELECT * FROM creator_pricing WHERE creator_id = ? ORDER BY created_at DESC
  `).all(userId);
  return res.json(packages);
});

creatorRouter.post('/pricing', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const {
    category,
    deliverable_format,
    price_inr,
    min_budget_inr,
    max_budget_inr,
    package_details = '',
    included_deliverables = '',
    included_revisions = 2,
    pricing_notes = '',
    estimated_turnaround_days = 3,
  } = req.body;

  if (!category || !deliverable_format || !price_inr || Number(price_inr) <= 0) {
    return res.status(400).json({ error: 'Category, deliverable format, and valid price in INR are required.' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO creator_pricing (
      id, creator_id, category, deliverable_format, price_inr,
      min_budget_inr, max_budget_inr, package_details, included_deliverables,
      included_revisions, pricing_notes, estimated_turnaround_days, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    category,
    deliverable_format,
    Number(price_inr),
    min_budget_inr ? Number(min_budget_inr) : null,
    max_budget_inr ? Number(max_budget_inr) : null,
    package_details,
    included_deliverables,
    Number(included_revisions) || 2,
    pricing_notes,
    Number(estimated_turnaround_days) || 3,
    now
  );

  return res.status(201).json({ id, message: 'Pricing package added.' });
});

creatorRouter.put('/pricing/:id', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const {
    category,
    deliverable_format,
    price_inr,
    min_budget_inr,
    max_budget_inr,
    package_details = '',
    included_deliverables = '',
    included_revisions = 2,
    pricing_notes = '',
    estimated_turnaround_days = 3,
  } = req.body;

  const result = db.prepare(`
    UPDATE creator_pricing
    SET category = ?, deliverable_format = ?, price_inr = ?, min_budget_inr = ?,
        max_budget_inr = ?, package_details = ?, included_deliverables = ?,
        included_revisions = ?, pricing_notes = ?, estimated_turnaround_days = ?
    WHERE id = ? AND creator_id = ?
  `).run(
    category,
    deliverable_format,
    Number(price_inr),
    min_budget_inr ? Number(min_budget_inr) : null,
    max_budget_inr ? Number(max_budget_inr) : null,
    package_details,
    included_deliverables,
    Number(included_revisions) || 2,
    pricing_notes,
    Number(estimated_turnaround_days) || 3,
    id,
    userId
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Pricing package not found or not owned by you.' });
  }

  return res.json({ message: 'Pricing package updated.' });
});

creatorRouter.delete('/pricing/:id', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = db.prepare(`
    DELETE FROM creator_pricing WHERE id = ? AND creator_id = ?
  `).run(id, userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Pricing package not found or not owned by you.' });
  }

  return res.json({ message: 'Pricing package deleted.' });
});

// Private Payment Details (Protected, creator-only)
creatorRouter.get('/payment-details', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const details = db.prepare(`
    SELECT account_holder_name, bank_account_number, ifsc_code, verification_status, updated_at
    FROM creator_payment_details
    WHERE creator_id = ?
  `).get(userId);

  return res.json(details || null);
});

creatorRouter.put('/payment-details', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { account_holder_name, bank_account_number, ifsc_code } = req.body;

  if (!account_holder_name || !bank_account_number || !ifsc_code) {
    return res.status(400).json({ error: 'Account holder name, bank account number, and IFSC code are required.' });
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO creator_payment_details (id, creator_id, account_holder_name, bank_account_number, ifsc_code, verification_status, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Verified', ?)
    ON CONFLICT(creator_id) DO UPDATE SET
      account_holder_name = excluded.account_holder_name,
      bank_account_number = excluded.bank_account_number,
      ifsc_code = excluded.ifsc_code,
      updated_at = excluded.updated_at
  `).run(id, userId, account_holder_name.trim(), bank_account_number.trim(), ifsc_code.trim().toUpperCase(), now);

  return res.json({ message: 'Bank payment details saved securely.' });
});

// Publish Portfolio
creatorRouter.post('/publish', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const profile = db.prepare(`SELECT * FROM creator_profiles WHERE user_id = ?`).get(userId) as any;

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const portfolioCount = (
    db.prepare(`SELECT COUNT(*) as count FROM portfolio_items WHERE creator_id = ?`).get(userId) as any
  ).count;
  const pricingCount = (
    db.prepare(`SELECT COUNT(*) as count FROM creator_pricing WHERE creator_id = ?`).get(userId) as any
  ).count;

  const completion = calculateProfileCompletion(profile, portfolioCount, pricingCount);
  if (!completion.canPublish) {
    const missing = completion.steps.filter((s) => !s.completed).map((s) => s.title);
    return res.status(400).json({
      error: `Cannot publish yet. Please complete: ${missing.join(', ')}`,
      missingSteps: missing,
    });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE creator_profiles
    SET is_published = 1, published_at = COALESCE(published_at, ?), updated_at = ?
    WHERE user_id = ?
  `).run(now, now, userId);

  return res.json({ message: 'Portfolio published successfully. Your profile is now discoverable by brands and agencies!' });
});

// Unpublish Portfolio
creatorRouter.post('/unpublish', requireAuth, requireRole('creator'), (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE creator_profiles
    SET is_published = 0, updated_at = ?
    WHERE user_id = ?
  `).run(now, userId);

  return res.json({ message: 'Portfolio unpublished. It will no longer appear in agency discovery.' });
});
