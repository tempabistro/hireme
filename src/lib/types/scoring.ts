/**
 * @fileoverview Scoring and recommendation type definitions for ApplyPilot AI.
 * Defines the scoring model, score breakdowns, weights, and recommendation
 * logic used to evaluate job-candidate fit.
 */

/**
 * AI recommendation output for a scored job.
 */
export type Recommendation = 'strong_apply' | 'apply' | 'maybe' | 'skip' | 'manual_review';

/**
 * Represents the full scoring result for a job-candidate pairing.
 * Each dimension is scored independently and combined with weights.
 */
export interface JobScore {
  /** Unique identifier (UUID) */
  id: string;
  /** Job being scored — foreign key to jobs */
  job_id: string;
  /** Supabase auth user ID — foreign key to auth.users */
  user_id: string;
  /** Country preference used for this scoring, if applicable */
  country_preference_id: string | null;
  /** Overall weighted score (0–100) */
  overall_score: number;
  /** Role / title match score (0–100) */
  role_score: number;
  /** Skills match score (0–100) */
  skills_score: number;
  /** Experience level match score (0–100) */
  experience_score: number;
  /** Industry match score (0–100) */
  industry_score: number;
  /** Location / geography match score (0–100) */
  location_score: number;
  /** Salary expectations match score (0–100) */
  salary_score: number;
  /** Visa / work authorisation compatibility score (0–100) */
  visa_score: number;
  /** Seniority level match score (0–100) */
  seniority_score: number;
  /** Final recommendation based on score + flags */
  recommendation: Recommendation;
  /** Keywords from the JD that match the candidate's profile */
  matched_keywords: string[];
  /** Keywords from the JD missing from the candidate's profile */
  missing_keywords: string[];
  /** Key strengths of this candidate for this role */
  strengths: string[];
  /** Risks or concerns for this application */
  risks: string[];
  /** Human-readable explanation of the score */
  explanation: string;
  /** ISO 8601 timestamp of when the score was generated */
  created_at: string;
}

/**
 * Breakdown of a single scoring dimension for UI display.
 */
export interface ScoreBreakdown {
  /** Category name (e.g. "Skills", "Location") */
  category: string;
  /** Achieved score in this category */
  score: number;
  /** Maximum possible score in this category */
  maxScore: number;
  /** Weight of this category in the overall score */
  weight: number;
  /** Human-readable details / rationale */
  details: string;
}

/**
 * Weights for each scoring dimension.
 * All weights should sum to 1.0.
 */
export const SCORE_WEIGHTS = {
  role: 0.15,
  skills: 0.25,
  experience: 0.15,
  industry: 0.10,
  location: 0.10,
  salary: 0.10,
  visa: 0.10,
  seniority: 0.05,
} as const;

/**
 * Determines the recommendation based on the overall score and any
 * disqualifying flags. Flags take precedence over raw scores.
 *
 * @param score - Overall weighted score (0–100)
 * @param flags - Disqualifying or caution flags
 * @returns The appropriate recommendation
 */
export function getRecommendation(
  score: number,
  flags: {
    visaConflict?: boolean;
    wrongCountry?: boolean;
    salaryBelow?: boolean;
  }
): Recommendation {
  if (flags.wrongCountry) return 'skip';
  if (flags.visaConflict) return 'manual_review';
  if (flags.salaryBelow) return 'manual_review';
  if (score >= 85) return 'strong_apply';
  if (score >= 70) return 'apply';
  if (score >= 55) return 'maybe';
  return 'skip';
}

/**
 * Returns a human-readable label for a recommendation value.
 *
 * @param rec - The recommendation enum value
 * @returns Display-friendly label string
 */
export function getRecommendationLabel(rec: Recommendation): string {
  const labels: Record<Recommendation, string> = {
    strong_apply: 'Strong Apply',
    apply: 'Apply',
    maybe: 'Maybe',
    skip: 'Skip',
    manual_review: 'Manual Review',
  };
  return labels[rec];
}

/**
 * Returns a Tailwind CSS colour class based on the score value.
 * Used for visual score indicators in the UI.
 *
 * @param score - Score value (0–100)
 * @returns Tailwind text colour class
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-accent-emerald';
  if (score >= 70) return 'text-brand-light';
  if (score >= 55) return 'text-accent-amber';
  return 'text-accent-red';
}
