/**
 * @fileoverview Document type definitions for ApplyPilot AI.
 * Defines the data model for AI-generated documents such as
 * CVs, resumes, cover letters, and supporting statements.
 */

/**
 * All supported document types that can be generated.
 * The appropriate type is selected based on the target country's conventions.
 */
export type DocumentType =
  | 'cv'
  | 'resume'
  | 'cover_letter'
  | 'supporting_statement'
  | 'personal_statement'
  | 'expression_of_interest';

/**
 * Represents an AI-generated document tied to a specific job and country.
 * Documents are versioned and require user approval before submission.
 */
export interface GeneratedDocument {
  /** Unique identifier (UUID) */
  id: string;
  /** Supabase auth user ID — foreign key to auth.users */
  user_id: string;
  /** Job this document is tailored for — foreign key to jobs */
  job_id: string;
  /** Country code this document was generated for */
  country: string;
  /** Type of document */
  document_type: DocumentType;
  /** Document title / filename label */
  title: string;
  /** Full document content (Markdown or plain text) */
  content: string;
  /** Version number — incremented on each regeneration */
  version: number;
  /** Whether the user has approved this version */
  approved: boolean;
  /** URL to the exported file (PDF/DOCX) in storage */
  file_url: string | null;
  /** Warnings or issues flagged during generation */
  warnings: string[];
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}
