/**
 * @fileoverview Country-related type definitions for ApplyPilot AI.
 * Defines per-user country preferences and system-level country configurations
 * that control document style, spelling, visa checks, and job source defaults.
 */

/**
 * Represents a user's preferences for a specific target country.
 * Each user can have multiple country preferences (e.g. applying in both UK and US).
 */
export interface CountryPreference {
  /** Unique identifier (UUID) */
  id: string;
  /** Supabase auth user ID — foreign key to auth.users */
  user_id: string;
  /** Human-readable country name */
  country_name: string;
  /** ISO 3166-1 alpha-2 country code (or 'REMOTE' for global remote) */
  country_code: string;
  /** Whether this is the user's default / primary country */
  is_default: boolean;
  /** Whether this country preference is currently active */
  is_active: boolean;
  /** Cities the user prefers to work in */
  preferred_cities: string[];
  /** Cities the user wants to exclude */
  excluded_cities: string[];
  /** Whether the user is open to fully remote roles in this country */
  remote_preference: boolean;
  /** Whether the user is open to hybrid roles in this country */
  hybrid_preference: boolean;
  /** Whether the user is open to fully on-site roles in this country */
  onsite_preference: boolean;
  /** Minimum acceptable salary */
  minimum_salary: number | null;
  /** Currency for salary (e.g. "GBP", "USD", "EUR") */
  salary_currency: string;
  /** User's work authorisation status in this country */
  work_authorisation_status: 'authorised' | 'requires_visa' | 'requires_sponsorship' | 'unknown';
  /** Whether visa sponsorship is required */
  visa_sponsorship_required: 'yes' | 'no' | 'maybe';
  /** Willingness to relocate to this country */
  willing_to_relocate: 'yes' | 'no' | 'maybe';
  /** Primary language for applications in this country */
  application_language: string;
  /** How to label the main document (CV vs Resume vs Lebenslauf) */
  document_type_label: 'CV' | 'Resume' | 'CV / Lebenslauf';
  /** Spelling convention to use in documents */
  spelling_preference: 'british' | 'american' | 'canadian' | 'australian';
  /** Style of cover letter appropriate for this country */
  cover_letter_style: 'standard' | 'short' | 'supporting_statement' | 'expression_of_interest';
  /** Job boards / sources the user wants to use in this country */
  allowed_sources: string[];
  /** Job boards / sources the user wants to exclude */
  blocked_sources: string[];
  /** Keywords specific to job searching in this country */
  country_keywords: string[];
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * System-level configuration for a supported country.
 * These are admin-defined defaults that drive document generation rules,
 * spelling styles, salary formats, and visa-checking behaviour.
 */
export interface CountryConfig {
  /** Unique identifier (UUID) */
  id: string;
  /** Human-readable country name */
  country_name: string;
  /** ISO 3166-1 alpha-2 country code (or 'REMOTE') */
  country_code: string;
  /** Default currency code (e.g. "GBP", "USD") */
  currency: string;
  /** Default document label for this country */
  document_label: string;
  /** Default application language */
  default_language: string;
  /** Default spelling style */
  spelling_style: 'british' | 'american' | 'canadian' | 'australian';
  /** How salaries are typically quoted */
  salary_period: 'annual' | 'monthly' | 'hourly';
  /** Whether visa eligibility should be checked for this country */
  visa_check_required: boolean;
  /** Whether sponsorship availability should be checked */
  sponsorship_check_required: boolean;
  /** Default job board sources for this country */
  default_job_sources: string[];
  /** Country-specific CV/resume formatting rules (JSON) */
  cv_rules_json: Record<string, unknown>;
  /** Country-specific cover letter formatting rules (JSON) */
  cover_letter_rules_json: Record<string, unknown>;
  /** Flag emoji for display */
  flag_emoji: string;
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * List of countries supported by ApplyPilot AI.
 * Used for UI dropdowns, onboarding, and validation.
 */
export const SUPPORTED_COUNTRIES: { name: string; code: string; flag: string }[] = [
  { name: 'United Kingdom', code: 'GB', flag: '\u{1F1EC}\u{1F1E7}' },
  { name: 'United States', code: 'US', flag: '\u{1F1FA}\u{1F1F8}' },
  { name: 'Canada', code: 'CA', flag: '\u{1F1E8}\u{1F1E6}' },
  { name: 'Germany', code: 'DE', flag: '\u{1F1E9}\u{1F1EA}' },
  { name: 'Ireland', code: 'IE', flag: '\u{1F1EE}\u{1F1EA}' },
  { name: 'Netherlands', code: 'NL', flag: '\u{1F1F3}\u{1F1F1}' },
  { name: 'Australia', code: 'AU', flag: '\u{1F1E6}\u{1F1FA}' },
  { name: 'Remote Global', code: 'REMOTE', flag: '\u{1F30D}' },
];
