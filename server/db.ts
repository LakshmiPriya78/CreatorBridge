import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const UPLOADS_DIR = path.resolve(DB_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DB_DIR, 'creatorbridge.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Configure SQLite pragmas
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('creator', 'agency')),
      created_at TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expiry TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS terms_acceptances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      terms_version TEXT NOT NULL,
      accepted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS creator_profiles (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT 'India',
      state TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL DEFAULT '',
      contact_phone TEXT NOT NULL DEFAULT '',
      contact_type TEXT NOT NULL DEFAULT 'Email',
      experience_level TEXT NOT NULL DEFAULT 'Intermediate',
      experience_years INTEGER NOT NULL DEFAULT 1,
      skills TEXT NOT NULL DEFAULT '[]',
      ai_tools TEXT NOT NULL DEFAULT '[]',
      profile_image TEXT NOT NULL DEFAULT '',
      categories TEXT NOT NULL DEFAULT '[]',
      availability TEXT NOT NULL DEFAULT 'Available',
      turnaround_days INTEGER NOT NULL DEFAULT 3,
      working_preferences TEXT NOT NULL DEFAULT 'Remote',
      working_hours TEXT NOT NULL DEFAULT '9 AM - 6 PM IST',
      communication_schedule TEXT NOT NULL DEFAULT 'Standard business hours',
      workload_notes TEXT NOT NULL DEFAULT '',
      is_published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS creator_payment_details (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      account_holder_name TEXT NOT NULL,
      bank_account_number TEXT NOT NULL,
      ifsc_code TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'Verified',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portfolio_items (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      media_type TEXT NOT NULL,
      media_url TEXT NOT NULL,
      description TEXT NOT NULL,
      creative_process TEXT NOT NULL DEFAULT '',
      creator_contribution TEXT NOT NULL DEFAULT '',
      ai_tools TEXT NOT NULL DEFAULT '[]',
      categories TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS creator_pricing (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      deliverable_format TEXT NOT NULL,
      price_inr INTEGER NOT NULL,
      min_budget_inr INTEGER,
      max_budget_inr INTEGER,
      package_details TEXT NOT NULL DEFAULT '',
      included_deliverables TEXT NOT NULL DEFAULT '',
      included_revisions INTEGER NOT NULL DEFAULT 2,
      pricing_notes TEXT NOT NULL DEFAULT '',
      estimated_turnaround_days INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agency_profiles (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      agency_name TEXT NOT NULL DEFAULT '',
      contact_person TEXT NOT NULL DEFAULT '',
      account_type TEXT NOT NULL DEFAULT 'Agency',
      company_brand_name TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT 'India',
      state TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      locality TEXT NOT NULL DEFAULT '',
      office_location TEXT NOT NULL DEFAULT '',
      filming_location TEXT NOT NULL DEFAULT '',
      verification_status TEXT NOT NULL DEFAULT 'Verified',
      verification_notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      agency_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_name TEXT NOT NULL,
      product_description TEXT NOT NULL,
      project_type TEXT NOT NULL,
      proposed_budget_inr INTEGER NOT NULL,
      creative_requirements TEXT NOT NULL,
      deliverables TEXT NOT NULL,
      attachments TEXT NOT NULL DEFAULT '[]',
      target_location TEXT NOT NULL DEFAULT '',
      deadline TEXT NOT NULL,
      additional_instructions TEXT NOT NULL DEFAULT '',
      affiliate_permission TEXT NOT NULL DEFAULT 'To be discussed',
      payment_terms TEXT NOT NULL DEFAULT '100% upon deliverable approval',
      usage_licensing_terms TEXT NOT NULL DEFAULT 'Full commercial digital advertising rights for 1 year',
      status TEXT NOT NULL DEFAULT 'Pending Creator Response',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS negotiations (
      id TEXT PRIMARY KEY,
      invitation_id TEXT NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL,
      action_type TEXT NOT NULL,
      proposed_price_inr INTEGER,
      proposed_deadline TEXT,
      proposed_deliverables TEXT,
      proposed_affiliate_permission TEXT,
      proposed_payment_terms TEXT,
      message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      invitation_id TEXT NOT NULL REFERENCES invitations(id) ON DELETE RESTRICT,
      agency_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      project_type TEXT NOT NULL,
      agreed_price_inr INTEGER NOT NULL,
      agreed_deliverables TEXT NOT NULL,
      agreed_deadline TEXT NOT NULL,
      affiliate_permission TEXT NOT NULL,
      payment_terms TEXT NOT NULL,
      usage_licensing_terms TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL DEFAULT 1,
      submission_notes TEXT NOT NULL,
      file_urls TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'Pending Review',
      revision_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      agency_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      amount_inr INTEGER NOT NULL,
      due_date TEXT,
      method TEXT NOT NULL DEFAULT 'Direct Bank Transfer',
      status TEXT NOT NULL DEFAULT 'Payment Due',
      transfer_date TEXT,
      transaction_reference TEXT,
      receipt_url TEXT,
      agency_notes TEXT NOT NULL DEFAULT '',
      creator_confirmation_date TEXT,
      dispute_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
      agency_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      delivery_rating INTEGER NOT NULL CHECK(delivery_rating >= 1 AND delivery_rating <= 5),
      communication_rating INTEGER NOT NULL CHECK(communication_rating >= 1 AND communication_rating <= 5),
      feedback TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_reported INTEGER NOT NULL DEFAULT 0,
      report_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
}
