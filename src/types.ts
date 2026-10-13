export type UserRole = 'creator' | 'agency';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  hasAcceptedTerms: boolean;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  country: string;
  state: string;
  city: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  contact_type: string;
  experience_level: string;
  experience_years: number;
  skills: string[];
  ai_tools: string[];
  profile_image: string;
  categories: string[];
  availability: 'Available' | 'Unavailable';
  turnaround_days: number;
  working_preferences: string;
  working_hours: string;
  communication_schedule: string;
  workload_notes: string;
  is_published: boolean;
  published_at?: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  creator_id: string;
  title: string;
  media_type: 'Video' | 'Poster' | 'Image' | 'Banner' | 'Promotional Graphic' | 'Other';
  media_url: string;
  description: string;
  creative_process: string;
  creator_contribution: string;
  ai_tools: string[];
  categories: string[];
  sort_order: number;
  created_at: string;
}

export interface CreatorPricing {
  id: string;
  creator_id: string;
  category: string;
  deliverable_format: string;
  price_inr: number;
  min_budget_inr?: number;
  max_budget_inr?: number;
  package_details: string;
  included_deliverables: string;
  included_revisions: number;
  pricing_notes: string;
  estimated_turnaround_days: number;
  created_at: string;
}

export interface CreatorPaymentDetails {
  account_holder_name: string;
  bank_account_number: string;
  ifsc_code: string;
  verification_status: string;
  updated_at: string;
}

export interface ProfileCompletion {
  percentage: number;
  steps: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }[];
  canPublish: boolean;
}

export interface AgencyProfile {
  id: string;
  user_id: string;
  agency_name: string;
  contact_person: string;
  account_type: 'Agency' | 'Brand';
  company_brand_name: string;
  country: string;
  state: string;
  city: string;
  locality: string;
  office_location: string;
  filming_location: string;
  verification_status: 'Pending' | 'Verified' | 'Needs Changes';
  verification_notes: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  agency_id: string;
  creator_id: string;
  product_name: string;
  product_description: string;
  project_type: string;
  proposed_budget_inr: number;
  creative_requirements: string;
  deliverables: string;
  attachments: string[];
  target_location: string;
  deadline: string;
  additional_instructions: string;
  affiliate_permission: 'Allowed' | 'Not allowed' | 'To be discussed';
  payment_terms: string;
  usage_licensing_terms: string;
  status:
    | 'Pending Creator Response'
    | 'Changes Proposed'
    | 'Awaiting Agency Response'
    | 'Counterproposal Pending'
    | 'Accepted'
    | 'Project Confirmed'
    | 'Declined'
    | 'Closed';
  created_at: string;
  updated_at: string;
  agency_name?: string;
  company_brand_name?: string;
  contact_person?: string;
  creator_name?: string;
  creator_image?: string;
  creator_location?: string;
}

export interface NegotiationEntry {
  id: string;
  invitation_id: string;
  sender_id: string;
  sender_role: 'creator' | 'agency';
  action_type: 'initial' | 'proposal' | 'counterproposal' | 'accepted' | 'declined' | 'closed';
  proposed_price_inr?: number;
  proposed_deadline?: string;
  proposed_deliverables?: string;
  proposed_affiliate_permission?: string;
  proposed_payment_terms?: string;
  message: string;
  created_at: string;
}

export interface Project {
  id: string;
  invitation_id: string;
  agency_id: string;
  creator_id: string;
  title: string;
  description: string;
  project_type: string;
  agreed_price_inr: number;
  agreed_deliverables: string;
  agreed_deadline: string;
  affiliate_permission: string;
  payment_terms: string;
  usage_licensing_terms: string;
  status:
    | 'Confirmed'
    | 'In Progress'
    | 'Submitted'
    | 'Revision Requested'
    | 'Resubmitted'
    | 'Approved'
    | 'Completed'
    | 'Cancelled';
  created_at: string;
  updated_at: string;
  agency_name?: string;
  company_brand_name?: string;
  creator_name?: string;
  creator_image?: string;
  payment_status?: string;
  deliverable_count?: number;
}

export interface Deliverable {
  id: string;
  project_id: string;
  creator_id: string;
  version_number: number;
  submission_notes: string;
  file_urls: string[];
  status: 'Pending Review' | 'Revision Requested' | 'Approved';
  revision_notes: string;
  created_at: string;
  reviewed_at?: string;
}

export interface PaymentRecord {
  id: string;
  project_id: string;
  agency_id: string;
  creator_id: string;
  amount_inr: number;
  due_date?: string;
  method: string;
  status: 'Payment Due' | 'Payment Initiated' | 'Awaiting Confirmation' | 'Payment Completed' | 'Payment Disputed';
  transfer_date?: string;
  transaction_reference?: string;
  receipt_url?: string;
  agency_notes: string;
  creator_confirmation_date?: string;
  dispute_reason?: string;
  created_at: string;
  updated_at: string;
  project_title?: string;
  creator_name?: string;
  agency_name?: string;
  company_brand_name?: string;
}

export interface Review {
  id: string;
  project_id: string;
  agency_id: string;
  creator_id: string;
  rating: number;
  delivery_rating: number;
  communication_rating: number;
  feedback: string;
  created_at: string;
  is_reported?: boolean;
  agency_name?: string;
  company_brand_name?: string;
  project_title?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string;
  type: string;
  is_read: number;
  created_at: string;
}

export const CATEGORIES_LIST = [
  'Beauty & Cosmetics',
  'Food & Beverages',
  'Agriculture',
  'Healthcare & Hospitals',
  'Fashion & Lifestyle',
  'Education',
  'Technology & Electronics',
  'Travel & Tourism',
  'Real Estate',
  'Fitness & Wellness',
  'Automobiles',
  'E-commerce & Retail',
  'Finance & Banking',
  'Entertainment & Gaming',
  'Home & Furniture',
  'Other',
] as const;

export const DELIVERABLE_FORMATS = [
  'Short-Form Video (Reels/Shorts/TikTok)',
  'Promotional Video Advertisement',
  'Long-Form Video / Explainer',
  'Poster / Social Banner',
  'Static Image / AI Graphic',
  'Carousel Ad Set',
  'Product Advertisement Asset Pack',
  'Other Content Format',
] as const;
