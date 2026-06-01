/**
 * @fileoverview Job-related type definitions for ApplyPilot AI.
 * Defines the job data model, parsed job descriptions, and the
 * full lifecycle status of a job through the pipeline.
 */

/**
 * All possible statuses a job can have in the ApplyPilot pipeline.
 * Jobs progress through these states from discovery to outcome.
 */
export type JobStatus =
  | 'new'
  | 'parsed'
  | 'scored'
  | 'recommended'
  | 'maybe'
  | 'skipped'
  | 'drafted'
  | 'approved'
  | 'applied'
  | 'interview'
  | 'rejected'
  | 'offer'
  | 'withdrawn';

/**
 * Represents a job listing in the system.
 * Contains both raw and parsed data, along with pipeline metadata.
 */
export interface Job {
  /** Unique identifier (UUID) */
  id: string;
  /** Supabase auth user ID — foreign key to auth.users */
  user_id: string;
  /** Job title */
  title: string;
  /** Hiring company name */
  company: string;
  /** Country where the job is located */
  country: string | null;
  /** City where the job is located */
  city: string | null;
  /** Region / state / province */
  region: string | null;
  /** Work arrangement mode */
  work_mode: 'remote' | 'hybrid' | 'onsite' | null;
  /** Minimum salary offered */
  salary_min: number | null;
  /** Maximum salary offered */
  salary_max: number | null;
  /** Currency for salary figures */
  salary_currency: string | null;
  /** Where the job was found (e.g. "LinkedIn", "Indeed") */
  source: string | null;
  /** URL of the original job listing */
  source_url: string | null;
  /** URL to apply for the job */
  application_url: string | null;
  /** Full raw text of the job description */
  raw_description: string;
  /** AI-parsed structured job description */
  parsed_description: ParsedJobDescription | null;
  /** Key responsibilities extracted from the JD */
  responsibilities: string[];
  /** Must-have requirements */
  requirements: string[];
  /** Nice-to-have / preferred qualifications */
  nice_to_have: string[];
  /** Raw text about visa sponsorship from the JD */
  visa_sponsorship_text: string | null;
  /** Raw text about work authorisation from the JD */
  work_authorisation_text: string | null;
  /** Seniority level (e.g. "junior", "mid", "senior", "lead") */
  seniority: string | null;
  /** Industry sector */
  industry: string | null;
  /** Type of employment contract */
  contract_type: 'permanent' | 'contract' | 'freelance' | 'internship' | null;
  /** Application deadline (ISO 8601) */
  deadline: string | null;
  /** Date the job was discovered / imported (ISO 8601) */
  date_found: string;
  /** Current pipeline status */
  status: JobStatus;
  /** Hash for deduplication */
  duplicate_hash: string | null;
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * Structured representation of a job description after AI parsing.
 * Used for scoring, matching, and document generation.
 */
export interface ParsedJobDescription {
  /** Parsed job title */
  title: string;
  /** Parsed company name */
  company: string;
  /** Detected country */
  country: string | null;
  /** Detected city */
  city: string | null;
  /** Detected work mode */
  work_mode: string | null;
  /** Parsed minimum salary */
  salary_min: number | null;
  /** Parsed maximum salary */
  salary_max: number | null;
  /** Parsed salary currency */
  currency: string | null;
  /** List of responsibilities */
  responsibilities: string[];
  /** Must-have skills */
  must_have_skills: string[];
  /** Nice-to-have skills */
  nice_to_have_skills: string[];
  /** Tools and technologies mentioned */
  tools: string[];
  /** Required certifications */
  certifications: string[];
  /** Education requirements (e.g. "Bachelor's degree") */
  education: string | null;
  /** Minimum years of experience required */
  years_experience: number | null;
  /** Visa sponsorship details */
  visa_sponsorship: string | null;
  /** Work authorisation requirements */
  work_authorisation: string | null;
  /** Detected seniority level */
  seniority: string | null;
  /** Detected industry */
  industry: string | null;
  /** Detected contract type */
  contract_type: string | null;
  /** Application deadline */
  deadline: string | null;
  /** Identified risks or red flags */
  risks: string[];
  /** Information missing from the JD */
  missing_information: string[];
}
