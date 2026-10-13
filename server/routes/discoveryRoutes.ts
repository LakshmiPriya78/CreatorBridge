import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../auth.js';

export const discoveryRouter = Router();

// Discover Published Creators (Agency access)
discoveryRouter.get('/creators', requireAuth, requireRole('agency'), (req: AuthenticatedRequest, res) => {
  const {
    categories, // comma-separated
    minBudget,
    maxBudget,
    availability, // 'Available' | 'Unavailable' | 'All'
    maxTurnaroundDays,
    sortBy = 'default', // 'recommended' | 'price_low' | 'price_high' | 'turnaround' | 'default'
    search = '',
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * pageLimit;

  // Fetch only eligible published creators
  const publishedCreators = db.prepare(`
    SELECT cp.*,
           (SELECT COUNT(*) FROM projects p WHERE p.creator_id = cp.user_id AND p.status = 'Completed') as completed_projects_count,
           (SELECT COUNT(*) FROM reviews r WHERE r.creator_id = cp.user_id) as review_count,
           (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.creator_id = cp.user_id) as avg_rating
    FROM creator_profiles cp
    WHERE cp.is_published = 1
  `).all() as any[];

  // For each creator, get their pricing packages and portfolio items
  let results = publishedCreators.map((creator) => {
    const pricingPackages = db.prepare(`
      SELECT * FROM creator_pricing WHERE creator_id = ? ORDER BY price_inr ASC
    `).all(creator.user_id) as any[];

    const portfolioItems = db.prepare(`
      SELECT * FROM portfolio_items WHERE creator_id = ? ORDER BY sort_order ASC, created_at DESC LIMIT 6
    `).all(creator.user_id) as any[];

    const minPrice = pricingPackages.length > 0
      ? Math.min(...pricingPackages.map((p) => p.price_inr))
      : 0;
    const maxPrice = pricingPackages.length > 0
      ? Math.max(...pricingPackages.map((p) => p.price_inr))
      : 0;

    let parsedCategories: string[] = [];
    let parsedSkills: string[] = [];
    let parsedAiTools: string[] = [];

    try { parsedCategories = JSON.parse(creator.categories || '[]'); } catch {}
    try { parsedSkills = JSON.parse(creator.skills || '[]'); } catch {}
    try { parsedAiTools = JSON.parse(creator.ai_tools || '[]'); } catch {}

    return {
      id: creator.user_id,
      userId: creator.user_id,
      fullName: creator.full_name,
      bio: creator.bio,
      location: creator.location || `${creator.city}, ${creator.state}`,
      city: creator.city,
      state: creator.state,
      country: creator.country,
      profileImage: creator.profile_image,
      experienceLevel: creator.experience_level,
      experienceYears: creator.experience_years,
      skills: parsedSkills,
      aiTools: parsedAiTools,
      categories: parsedCategories,
      availability: creator.availability,
      turnaroundDays: creator.turnaround_days,
      workingPreferences: creator.working_preferences,
      completedProjectsCount: creator.completed_projects_count || 0,
      reviewCount: creator.review_count || 0,
      avgRating: creator.avg_rating || null,
      minPrice,
      maxPrice,
      pricingPackages,
      portfolioItems: portfolioItems.map((p) => ({
        ...p,
        aiTools: JSON.parse(p.ai_tools || '[]'),
        categories: JSON.parse(p.categories || '[]'),
      })),
    };
  });

  // Apply filters
  // 1. Text Search
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.skills.some((s: string) => s.toLowerCase().includes(q)) ||
        c.aiTools.some((t: string) => t.toLowerCase().includes(q))
    );
  }

  // 2. Categories filter
  if (categories && categories.trim()) {
    const selectedCats = categories.split(',').map((c) => c.trim().toLowerCase());
    results = results.filter((c) =>
      c.categories.some((cat: string) => selectedCats.includes(cat.toLowerCase()))
    );
  }

  // 3. Availability filter
  if (availability && availability !== 'All') {
    results = results.filter((c) => c.availability.toLowerCase() === availability.toLowerCase());
  }

  // 4. Budget filter (INR)
  if (minBudget && !isNaN(Number(minBudget))) {
    const min = Number(minBudget);
    results = results.filter((c) => c.minPrice >= min || (c.maxPrice > 0 && c.maxPrice >= min));
  }
  if (maxBudget && !isNaN(Number(maxBudget))) {
    const max = Number(maxBudget);
    results = results.filter((c) => c.minPrice <= max);
  }

  // 5. Max turnaround filter
  if (maxTurnaroundDays && !isNaN(Number(maxTurnaroundDays))) {
    const maxDays = Number(maxTurnaroundDays);
    results = results.filter((c) => c.turnaroundDays <= maxDays);
  }

  // Sorting
  if (sortBy === 'recommended') {
    results.sort((a, b) => {
      // Sort by valid reviews & ratings, then completed projects
      if ((b.avgRating || 0) !== (a.avgRating || 0)) {
        return (b.avgRating || 0) - (a.avgRating || 0);
      }
      return b.completedProjectsCount - a.completedProjectsCount;
    });
  } else if (sortBy === 'price_low') {
    results.sort((a, b) => a.minPrice - b.minPrice);
  } else if (sortBy === 'price_high') {
    results.sort((a, b) => b.minPrice - a.minPrice);
  } else if (sortBy === 'turnaround') {
    results.sort((a, b) => a.turnaroundDays - b.turnaroundDays);
  }

  const total = results.length;
  const paginated = results.slice(offset, offset + pageLimit);

  return res.json({
    creators: paginated,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / pageLimit),
  });
});

// Get Single Creator Portfolio Details (Agency view)
discoveryRouter.get('/creators/:creatorId', requireAuth, requireRole('agency'), (req: AuthenticatedRequest, res) => {
  const { creatorId } = req.params;

  const creator = db.prepare(`
    SELECT cp.*,
           (SELECT COUNT(*) FROM projects p WHERE p.creator_id = cp.user_id AND p.status = 'Completed') as completed_projects_count,
           (SELECT COUNT(*) FROM reviews r WHERE r.creator_id = cp.user_id) as review_count,
           (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.creator_id = cp.user_id) as avg_rating
    FROM creator_profiles cp
    WHERE cp.user_id = ? AND cp.is_published = 1
  `).get(creatorId) as any;

  if (!creator) {
    return res.status(404).json({ error: 'Creator portfolio not found or not currently published.' });
  }

  const portfolioItems = db.prepare(`
    SELECT * FROM portfolio_items WHERE creator_id = ? ORDER BY sort_order ASC, created_at DESC
  `).all(creatorId) as any[];

  const pricingPackages = db.prepare(`
    SELECT * FROM creator_pricing WHERE creator_id = ? ORDER BY price_inr ASC
  `).all(creatorId) as any[];

  const reviews = db.prepare(`
    SELECT r.*, ap.agency_name, ap.company_brand_name
    FROM reviews r
    JOIN agency_profiles ap ON r.agency_id = ap.user_id
    WHERE r.creator_id = ?
    ORDER BY r.created_at DESC
  `).all(creatorId) as any[];

  // Note: Creator's private bank details are NOT queried or exposed here
  return res.json({
    creator: {
      ...creator,
      skills: JSON.parse(creator.skills || '[]'),
      aiTools: JSON.parse(creator.ai_tools || '[]'),
      categories: JSON.parse(creator.categories || '[]'),
    },
    portfolioItems: portfolioItems.map((p) => ({
      ...p,
      aiTools: JSON.parse(p.ai_tools || '[]'),
      categories: JSON.parse(p.categories || '[]'),
    })),
    pricingPackages,
    reviews,
  });
});
