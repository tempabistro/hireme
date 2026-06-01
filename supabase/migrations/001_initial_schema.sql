-- ============================================================================
-- ApplyPilot AI — Initial Database Schema Migration
-- ============================================================================
-- This migration creates the complete database schema for ApplyPilot AI,
-- including all tables, indexes, RLS policies, and seed data.
--
-- Tables created:
--   1. candidate_profiles
--   2. country_configs
--   3. country_preferences
--   4. jobs
--   5. job_scores
--   6. generated_documents
--   7. application_answers
--   8. application_packs
--   9. follow_ups
--  10. (auth.users is managed by Supabase Auth)
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CANDIDATE PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  headline       TEXT,
  summary        TEXT,
  location       TEXT,
  phone          TEXT,
  email          TEXT,
  linkedin_url   TEXT,
  portfolio_url  TEXT,
  years_experience INTEGER,
  current_title  TEXT,
  target_titles  JSONB NOT NULL DEFAULT '[]'::jsonb,
  industries     JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills         JSONB NOT NULL DEFAULT '[]'::jsonb,
  tools          JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  education      JSONB NOT NULL DEFAULT '[]'::jsonb,
  work_history   JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements   JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages      JSONB NOT NULL DEFAULT '[]'::jsonb,
  notice_period  TEXT,
  availability_date DATE,
  relocation_willingness TEXT CHECK (relocation_willingness IN ('yes', 'no', 'maybe')),
  master_cv_text TEXT,
  master_cv_file_url TEXT,
  preferred_industries JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_seniority TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

CREATE INDEX idx_candidate_profiles_user_id ON candidate_profiles(user_id);

-- ============================================================================
-- 2. COUNTRY CONFIGS (system-level, not per-user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS country_configs (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name               TEXT NOT NULL,
  country_code               TEXT NOT NULL UNIQUE,
  currency                   TEXT NOT NULL,
  document_label             TEXT NOT NULL,
  default_language           TEXT NOT NULL DEFAULT 'English',
  spelling_style             TEXT NOT NULL CHECK (spelling_style IN ('british', 'american', 'canadian', 'australian')),
  salary_period              TEXT NOT NULL CHECK (salary_period IN ('annual', 'monthly', 'hourly')) DEFAULT 'annual',
  visa_check_required        BOOLEAN NOT NULL DEFAULT true,
  sponsorship_check_required BOOLEAN NOT NULL DEFAULT true,
  default_job_sources        JSONB NOT NULL DEFAULT '[]'::jsonb,
  cv_rules_json              JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_letter_rules_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  flag_emoji                 TEXT NOT NULL DEFAULT '',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_country_configs_code ON country_configs(country_code);

-- ============================================================================
-- 3. COUNTRY PREFERENCES (per-user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS country_preferences (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_name                TEXT NOT NULL,
  country_code                TEXT NOT NULL,
  is_default                  BOOLEAN NOT NULL DEFAULT false,
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  preferred_cities            JSONB NOT NULL DEFAULT '[]'::jsonb,
  excluded_cities             JSONB NOT NULL DEFAULT '[]'::jsonb,
  remote_preference           BOOLEAN NOT NULL DEFAULT true,
  hybrid_preference           BOOLEAN NOT NULL DEFAULT true,
  onsite_preference           BOOLEAN NOT NULL DEFAULT true,
  minimum_salary              NUMERIC,
  salary_currency             TEXT NOT NULL DEFAULT 'USD',
  work_authorisation_status   TEXT NOT NULL DEFAULT 'unknown'
    CHECK (work_authorisation_status IN ('authorised', 'requires_visa', 'requires_sponsorship', 'unknown')),
  visa_sponsorship_required   TEXT NOT NULL DEFAULT 'maybe'
    CHECK (visa_sponsorship_required IN ('yes', 'no', 'maybe')),
  willing_to_relocate         TEXT NOT NULL DEFAULT 'maybe'
    CHECK (willing_to_relocate IN ('yes', 'no', 'maybe')),
  application_language        TEXT NOT NULL DEFAULT 'English',
  document_type_label         TEXT NOT NULL DEFAULT 'CV'
    CHECK (document_type_label IN ('CV', 'Resume', 'CV / Lebenslauf')),
  spelling_preference         TEXT NOT NULL DEFAULT 'british'
    CHECK (spelling_preference IN ('british', 'american', 'canadian', 'australian')),
  cover_letter_style          TEXT NOT NULL DEFAULT 'standard'
    CHECK (cover_letter_style IN ('standard', 'short', 'supporting_statement', 'expression_of_interest')),
  allowed_sources             JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_sources             JSONB NOT NULL DEFAULT '[]'::jsonb,
  country_keywords            JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_country_preferences_user_id ON country_preferences(user_id);
CREATE INDEX idx_country_preferences_country_code ON country_preferences(country_code);

-- ============================================================================
-- 4. JOBS
-- ============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  company                 TEXT NOT NULL,
  country                 TEXT,
  city                    TEXT,
  region                  TEXT,
  work_mode               TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
  salary_min              NUMERIC,
  salary_max              NUMERIC,
  salary_currency         TEXT,
  source                  TEXT,
  source_url              TEXT,
  application_url         TEXT,
  raw_description         TEXT NOT NULL,
  parsed_description      JSONB,
  responsibilities        JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirements            JSONB NOT NULL DEFAULT '[]'::jsonb,
  nice_to_have            JSONB NOT NULL DEFAULT '[]'::jsonb,
  visa_sponsorship_text   TEXT,
  work_authorisation_text TEXT,
  seniority               TEXT,
  industry                TEXT,
  contract_type           TEXT CHECK (contract_type IN ('permanent', 'contract', 'freelance', 'internship')),
  deadline                DATE,
  date_found              DATE NOT NULL DEFAULT CURRENT_DATE,
  status                  TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new', 'parsed', 'scored', 'recommended', 'maybe', 'skipped',
      'drafted', 'approved', 'applied', 'interview', 'rejected', 'offer', 'withdrawn'
    )),
  duplicate_hash          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_duplicate_hash ON jobs(duplicate_hash);

-- ============================================================================
-- 5. JOB SCORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_preference_id   UUID REFERENCES country_preferences(id) ON DELETE SET NULL,
  overall_score           NUMERIC NOT NULL DEFAULT 0,
  role_score              NUMERIC NOT NULL DEFAULT 0,
  skills_score            NUMERIC NOT NULL DEFAULT 0,
  experience_score        NUMERIC NOT NULL DEFAULT 0,
  industry_score          NUMERIC NOT NULL DEFAULT 0,
  location_score          NUMERIC NOT NULL DEFAULT 0,
  salary_score            NUMERIC NOT NULL DEFAULT 0,
  visa_score              NUMERIC NOT NULL DEFAULT 0,
  seniority_score         NUMERIC NOT NULL DEFAULT 0,
  recommendation          TEXT NOT NULL DEFAULT 'manual_review'
    CHECK (recommendation IN ('strong_apply', 'apply', 'maybe', 'skip', 'manual_review')),
  matched_keywords        JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_keywords        JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths               JSONB NOT NULL DEFAULT '[]'::jsonb,
  risks                   JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation             TEXT NOT NULL DEFAULT '',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_scores_job_id ON job_scores(job_id);
CREATE INDEX idx_job_scores_user_id ON job_scores(user_id);

-- ============================================================================
-- 6. GENERATED DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS generated_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  country         TEXT NOT NULL,
  document_type   TEXT NOT NULL
    CHECK (document_type IN ('cv', 'resume', 'cover_letter', 'supporting_statement', 'personal_statement', 'expression_of_interest')),
  title           TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  version         INTEGER NOT NULL DEFAULT 1,
  approved        BOOLEAN NOT NULL DEFAULT false,
  file_url        TEXT,
  warnings        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_documents_user_id ON generated_documents(user_id);
CREATE INDEX idx_generated_documents_job_id ON generated_documents(job_id);

-- ============================================================================
-- 7. APPLICATION ANSWERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS application_answers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id               UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  question             TEXT NOT NULL,
  answer               TEXT NOT NULL DEFAULT '',
  country              TEXT NOT NULL,
  approved             BOOLEAN NOT NULL DEFAULT false,
  sensitive            BOOLEAN NOT NULL DEFAULT false,
  requires_user_input  BOOLEAN NOT NULL DEFAULT false,
  evidence_source      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_application_answers_user_id ON application_answers(user_id);
CREATE INDEX idx_application_answers_job_id ON application_answers(job_id);

-- ============================================================================
-- 8. APPLICATION PACKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS application_packs (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id                     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  country                    TEXT NOT NULL,
  score_id                   UUID REFERENCES job_scores(id) ON DELETE SET NULL,
  cv_document_id             UUID REFERENCES generated_documents(id) ON DELETE SET NULL,
  cover_letter_document_id   UUID REFERENCES generated_documents(id) ON DELETE SET NULL,
  status                     TEXT NOT NULL DEFAULT 'drafted',
  approval_status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'edit_required', 'saved_for_later')),
  approved_at                TIMESTAMPTZ,
  applied_at                 TIMESTAMPTZ,
  application_url            TEXT,
  risks                      JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist                  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_application_packs_user_id ON application_packs(user_id);
CREATE INDEX idx_application_packs_job_id ON application_packs(job_id);
CREATE INDEX idx_application_packs_status ON application_packs(approval_status);

-- ============================================================================
-- 9. FOLLOW-UPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id                UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  application_pack_id   UUID REFERENCES application_packs(id) ON DELETE SET NULL,
  follow_up_date        DATE NOT NULL,
  follow_up_type        TEXT NOT NULL
    CHECK (follow_up_type IN ('post_application', 'post_interview', 'recruiter')),
  status                TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'sent', 'skipped')),
  message_draft         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX idx_follow_ups_job_id ON follow_ups(job_id);
CREATE INDEX idx_follow_ups_status ON follow_ups(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all user-facing tables

ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_configs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- candidate_profiles: users can only CRUD their own profile
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON candidate_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON candidate_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON candidate_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON candidate_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- country_preferences: users can only CRUD their own preferences
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own country preferences"
  ON country_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own country preferences"
  ON country_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own country preferences"
  ON country_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own country preferences"
  ON country_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- jobs: users can only CRUD their own jobs
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- job_scores: users can only read/write their own scores
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own job scores"
  ON job_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job scores"
  ON job_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job scores"
  ON job_scores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job scores"
  ON job_scores FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- generated_documents: users can only CRUD their own documents
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own documents"
  ON generated_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON generated_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON generated_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON generated_documents FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- application_answers: users can only CRUD their own answers
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own application answers"
  ON application_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application answers"
  ON application_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own application answers"
  ON application_answers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own application answers"
  ON application_answers FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- application_packs: users can only CRUD their own packs
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own application packs"
  ON application_packs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application packs"
  ON application_packs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own application packs"
  ON application_packs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own application packs"
  ON application_packs FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- follow_ups: users can only CRUD their own follow-ups
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view own follow ups"
  ON follow_ups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follow ups"
  ON follow_ups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow ups"
  ON follow_ups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follow ups"
  ON follow_ups FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- country_configs: readable by all authenticated users (system data)
-- --------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view country configs"
  ON country_configs FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- SEED DATA: Default Country Configurations
-- ============================================================================

INSERT INTO country_configs (country_name, country_code, currency, document_label, default_language, spelling_style, salary_period, visa_check_required, sponsorship_check_required, default_job_sources, cv_rules_json, cover_letter_rules_json, flag_emoji)
VALUES
  (
    'United Kingdom', 'GB', 'GBP', 'CV', 'English', 'british', 'annual', true, true,
    '["LinkedIn", "Indeed", "Reed", "Totaljobs", "Guardian Jobs", "Civil Service Jobs", "NHS Jobs", "Glassdoor"]'::jsonb,
    '{"max_pages": 2, "include_photo": false, "include_date_of_birth": false, "include_nationality": false, "include_marital_status": false, "format": "reverse_chronological", "tone": "professional", "spelling": "british", "address_format": "city_only", "notes": "No personal details beyond name, email, phone, LinkedIn. Use action verbs. Quantify achievements."}'::jsonb,
    '{"style": "standard", "max_words": 400, "tone": "professional_but_warm", "greeting": "Dear Hiring Manager", "sign_off": "Yours sincerely", "paragraphs": 3, "notes": "Reference the specific role and company. Show enthusiasm. Link experience to requirements."}'::jsonb,
    E'\U0001F1EC\U0001F1E7'
  ),
  (
    'United States', 'US', 'USD', 'Resume', 'English', 'american', 'annual', true, true,
    '["LinkedIn", "Indeed", "Glassdoor", "ZipRecruiter", "Monster", "CareerBuilder", "USAJobs", "Dice"]'::jsonb,
    '{"max_pages": 1, "include_photo": false, "include_date_of_birth": false, "include_nationality": false, "include_marital_status": false, "format": "reverse_chronological", "tone": "action_oriented", "spelling": "american", "address_format": "city_state", "notes": "One page strongly preferred. Use strong action verbs. Quantify everything. No references section. ATS-friendly formatting."}'::jsonb,
    '{"style": "standard", "max_words": 350, "tone": "confident_and_direct", "greeting": "Dear Hiring Manager", "sign_off": "Sincerely", "paragraphs": 3, "notes": "Be concise and impactful. Lead with strongest qualification. Show cultural fit."}'::jsonb,
    E'\U0001F1FA\U0001F1F8'
  ),
  (
    'Canada', 'CA', 'CAD', 'Resume', 'English', 'canadian', 'annual', true, true,
    '["LinkedIn", "Indeed", "Glassdoor", "Job Bank", "Workopolis", "Monster", "Eluta", "Canadian Government Jobs"]'::jsonb,
    '{"max_pages": 2, "include_photo": false, "include_date_of_birth": false, "include_nationality": false, "include_marital_status": false, "format": "reverse_chronological", "tone": "professional", "spelling": "canadian", "address_format": "city_province", "notes": "Similar to US resume but can be 2 pages. Canadian spelling (colour, centre). Include LinkedIn URL. Bilingual roles may need French version."}'::jsonb,
    '{"style": "standard", "max_words": 400, "tone": "professional_and_friendly", "greeting": "Dear Hiring Manager", "sign_off": "Sincerely", "paragraphs": 3, "notes": "Reference Canadian experience if applicable. Mention work authorization status if relevant."}'::jsonb,
    E'\U0001F1E8\U0001F1E6'
  ),
  (
    'Germany', 'DE', 'EUR', 'CV / Lebenslauf', 'German', 'british', 'annual', true, true,
    '["LinkedIn", "Indeed", "StepStone", "XING", "Glassdoor", "Arbeitsagentur", "Karriere.de", "Monster"]'::jsonb,
    '{"max_pages": 2, "include_photo": true, "include_date_of_birth": true, "include_nationality": true, "include_marital_status": false, "format": "reverse_chronological", "tone": "formal", "spelling": "british", "address_format": "full_address", "notes": "Professional photo expected. Date of birth is common. Tabular/structured format preferred. Include all education including school. Sign and date the CV. Lebenslauf format for German-language applications."}'::jsonb,
    '{"style": "standard", "max_words": 500, "tone": "formal_and_structured", "greeting": "Sehr geehrte Damen und Herren", "sign_off": "Mit freundlichen Gr\u00FC\u00DFen", "paragraphs": 4, "notes": "Formal tone. Reference the exact position. Include salary expectations and earliest start date. For English roles, use formal British English."}'::jsonb,
    E'\U0001F1E9\U0001F1EA'
  ),
  (
    'Ireland', 'IE', 'EUR', 'CV', 'English', 'british', 'annual', true, true,
    '["LinkedIn", "Indeed", "IrishJobs.ie", "Jobs.ie", "Glassdoor", "PublicJobs.ie", "Monster", "Recruit Ireland"]'::jsonb,
    '{"max_pages": 2, "include_photo": false, "include_date_of_birth": false, "include_nationality": false, "include_marital_status": false, "format": "reverse_chronological", "tone": "professional", "spelling": "british", "address_format": "city_county", "notes": "Follow UK conventions. Irish spelling follows British English. No photo, no personal details. Two pages maximum."}'::jsonb,
    '{"style": "standard", "max_words": 400, "tone": "professional_but_warm", "greeting": "Dear Hiring Manager", "sign_off": "Yours sincerely", "paragraphs": 3, "notes": "Similar to UK style. Reference Irish market knowledge if applicable. Warm but professional tone."}'::jsonb,
    E'\U0001F1EE\U0001F1EA'
  ),
  (
    'Netherlands', 'NL', 'EUR', 'CV', 'English', 'british', 'annual', true, true,
    '["LinkedIn", "Indeed", "Glassdoor", "Nationale Vacaturebank", "Intermediair", "Undutchables", "Together Abroad", "IAmExpat"]'::jsonb,
    '{"max_pages": 2, "include_photo": true, "include_date_of_birth": true, "include_nationality": true, "include_marital_status": false, "format": "reverse_chronological", "tone": "direct_and_factual", "spelling": "british", "address_format": "city_only", "notes": "Photo is common but optional for international roles. Dutch CVs are direct and factual. Include date of birth and nationality. English is widely accepted for international roles."}'::jsonb,
    '{"style": "short", "max_words": 350, "tone": "direct_and_enthusiastic", "greeting": "Dear Hiring Manager", "sign_off": "Kind regards", "paragraphs": 3, "notes": "Dutch prefer directness. Keep it concise. Show genuine interest in the company. English cover letters are acceptable for international roles."}'::jsonb,
    E'\U0001F1F3\U0001F1F1'
  ),
  (
    'Australia', 'AU', 'AUD', 'Resume', 'English', 'australian', 'annual', true, true,
    '["LinkedIn", "Indeed", "Seek", "Glassdoor", "Jora", "CareerOne", "Australian Government Jobs", "Ethical Jobs"]'::jsonb,
    '{"max_pages": 3, "include_photo": false, "include_date_of_birth": false, "include_nationality": false, "include_marital_status": false, "format": "reverse_chronological", "tone": "professional_and_approachable", "spelling": "australian", "address_format": "city_state", "notes": "Up to 3 pages acceptable. Australian spelling (colour, organised). Include key selection criteria responses for government roles. No photo or personal details."}'::jsonb,
    '{"style": "standard", "max_words": 450, "tone": "professional_and_approachable", "greeting": "Dear Hiring Manager", "sign_off": "Kind regards", "paragraphs": 3, "notes": "Address key selection criteria if listed. Government roles may require a separate statement addressing each criterion. Professional but approachable tone."}'::jsonb,
    E'\U0001F1E6\U0001F1FA'
  ),
  (
    'Remote Global', 'REMOTE', 'USD', 'Resume', 'English', 'american', 'annual', false, false,
    '["LinkedIn", "Indeed", "We Work Remotely", "Remote.co", "FlexJobs", "AngelList", "Remotive", "Working Nomads"]'::jsonb,
    '{"max_pages": 2, "include_photo": false, "include_date_of_birth": false, "include_nationality": false, "include_marital_status": false, "format": "reverse_chronological", "tone": "action_oriented", "spelling": "american", "address_format": "timezone_only", "notes": "Focus on remote work experience. Highlight async communication skills. Mention timezone and overlap availability. American English as default for global roles."}'::jsonb,
    '{"style": "short", "max_words": 300, "tone": "confident_and_direct", "greeting": "Hello", "sign_off": "Best regards", "paragraphs": 3, "notes": "Emphasise remote work experience and self-management skills. Mention timezone flexibility. Keep it brief — remote companies value conciseness."}'::jsonb,
    E'\U0001F30D'
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically update the updated_at column on row modification

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_candidate_profiles_updated_at
  BEFORE UPDATE ON candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_country_configs_updated_at
  BEFORE UPDATE ON country_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_country_preferences_updated_at
  BEFORE UPDATE ON country_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_generated_documents_updated_at
  BEFORE UPDATE ON generated_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_application_answers_updated_at
  BEFORE UPDATE ON application_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_application_packs_updated_at
  BEFORE UPDATE ON application_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_follow_ups_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
