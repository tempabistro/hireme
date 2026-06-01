/**
 * @fileoverview Application-related type definitions for ApplyPilot AI.
 * Defines data models for application answers, application packs,
 * checklists, and follow-up scheduling.
 */

/**
 * Possible approval statuses for an application pack.
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edit_required' | 'saved_for_later';

/**
 * Represents an answer to an application form question.
 * Answers are AI-generated but may require user review,
 * especially for sensitive topics.
 */
export interface ApplicationAnswer {
  /** Unique identifier (UUID) */
  id: string;
  /** Supabase auth user ID — foreign key to auth.users */
  user_id: string;
  /** Job this answer relates to — foreign key to jobs */
  job_id: string;
  /** The original question text */
  question: string;
  /** The generated / user-provided answer */
  answer: string;
  /** Country code for localisation context */
  country: string;
  /** Whether the user has approved this answer */
  approved: boolean;
  /** Whether this question touches a sensitive topic */
  sensitive: boolean;
  /** Whether the AI could not answer and needs user input */
  requires_user_input: boolean;
  /** Source of evidence for this answer (e.g. "work_history", "profile") */
  evidence_source: string | null;
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * Represents a complete application pack — the bundle of documents
 * and metadata ready for submission to a specific job.
 */
export interface ApplicationPack {
  /** Unique identifier (UUID) */
  id: string;
  /** Supabase auth user ID — foreign key to auth.users */
  user_id: string;
  /** Job this pack is for — foreign key to jobs */
  job_id: string;
  /** Country code for localisation context */
  country: string;
  /** Score record — foreign key to job_scores */
  score_id: string | null;
  /** Generated CV/resume document — foreign key to generated_documents */
  cv_document_id: string | null;
  /** Generated cover letter document — foreign key to generated_documents */
  cover_letter_document_id: string | null;
  /** Current pipeline status (mirrors job status) */
  status: string;
  /** User approval status */
  approval_status: ApprovalStatus;
  /** When the user approved this pack (ISO 8601) */
  approved_at: string | null;
  /** When the application was actually submitted (ISO 8601) */
  applied_at: string | null;
  /** URL where the application was / will be submitted */
  application_url: string | null;
  /** Risks or warnings for this application */
  risks: string[];
  /** Pre-submission checklist items */
  checklist: ChecklistItem[];
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * A single item in the pre-submission checklist.
 */
export interface ChecklistItem {
  /** Display label for the checklist item */
  label: string;
  /** Whether this item has been completed */
  checked: boolean;
  /** Whether this item is required before submission */
  required: boolean;
  /** Optional warning message if the item is not checked */
  warning?: string;
}

/**
 * Represents a scheduled follow-up action after an application.
 */
export interface FollowUp {
  /** Unique identifier (UUID) */
  id: string;
  /** Supabase auth user ID — foreign key to auth.users */
  user_id: string;
  /** Job this follow-up relates to — foreign key to jobs */
  job_id: string;
  /** Application pack — foreign key to application_packs */
  application_pack_id: string | null;
  /** Date the follow-up should be sent (ISO 8601) */
  follow_up_date: string;
  /** Type of follow-up */
  follow_up_type: 'post_application' | 'post_interview' | 'recruiter';
  /** Current status of the follow-up */
  status: 'scheduled' | 'sent' | 'skipped';
  /** Draft message for the follow-up */
  message_draft: string | null;
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}
