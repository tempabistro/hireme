import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/lib/ai/factory';
import { buildJobScorerPrompt } from '@/lib/ai/prompts/job-scorer';
import { getCountryConfig } from '@/lib/config/country-configs';
import { getRecommendation } from '@/lib/types';
import type { JobScore, CandidateProfile, CountryPreference, CountryConfig, ParsedJobDescription } from '@/lib/types';

/**
 * Score a job against the user's profile and country preferences.
 *
 * Flow:
 *  1. Fetch job (must be parsed), profile, and country preference.
 *  2. Call AI with the scorer prompt.
 *  3. Persist the score in `job_scores`.
 *  4. Update job status to `scored`.
 */
export async function scoreJob(
  jobId: string,
  userId: string,
  countryPreferenceId?: string,
): Promise<JobScore> {
  const supabase = await createServerSupabaseClient();

  // 1. Fetch job
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (jobErr || !job) throw new Error('Job not found or access denied.');
  if (!job.parsed_description) throw new Error('Job must be parsed before scoring.');

  // 2. Fetch profile
  const { data: profile, error: profileErr } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileErr || !profile) throw new Error('Candidate profile not found. Please create your profile first.');

  // 3. Fetch country preference
  let cpQuery = supabase
    .from('country_preferences')
    .select('*')
    .eq('user_id', userId);

  if (countryPreferenceId) {
    cpQuery = cpQuery.eq('id', countryPreferenceId);
  } else {
    cpQuery = cpQuery.eq('is_active', true);
  }

  const { data: cpData } = await cpQuery;
  const countryPref = cpData?.[0] ?? {
    id: null,
    country_code: job.country || 'GB',
    country_name: 'Default',
    is_active: true,
    minimum_salary: null,
    salary_currency: 'GBP',
    work_authorisation_status: 'unknown',
    visa_sponsorship_required: 'maybe',
    preferred_cities: [],
    excluded_cities: [],
    remote_preference: true,
    hybrid_preference: true,
    onsite_preference: true,
    willing_to_relocate: 'maybe',
  };

  const countryConfig = getCountryConfig(countryPref.country_code) || getCountryConfig('GB')!;

  // 4. Call AI
  const ai = createAIProvider();
  const messages = buildJobScorerPrompt(
    job.parsed_description as ParsedJobDescription,
    profile as CandidateProfile,
    countryPref as CountryPreference,
    countryConfig as CountryConfig,
  );

  interface AIScoreResult {
    overall_score: number;
    role_score: number;
    skills_score: number;
    experience_score: number;
    industry_score: number;
    location_score: number;
    salary_score: number;
    visa_score: number;
    seniority_score: number;
    recommendation: string;
    matched_keywords: string[];
    missing_keywords: string[];
    strengths: string[];
    risks: string[];
    explanation: string;
  }

  const aiResult = await ai.completeJSON<AIScoreResult>({
    messages,
    temperature: 0.2,
    responseFormat: 'json',
  });

  // Recalculate recommendation server-side for consistency
  const recommendation = getRecommendation(aiResult.overall_score, {});

  // 5. Persist score
  const { data: score, error: insertErr } = await supabase
    .from('job_scores')
    .insert({
      job_id: jobId,
      user_id: userId,
      country_preference_id: countryPref.id || null,
      overall_score: aiResult.overall_score,
      role_score: aiResult.role_score,
      skills_score: aiResult.skills_score,
      experience_score: aiResult.experience_score,
      industry_score: aiResult.industry_score,
      location_score: aiResult.location_score,
      salary_score: aiResult.salary_score,
      visa_score: aiResult.visa_score,
      seniority_score: aiResult.seniority_score,
      recommendation,
      matched_keywords: aiResult.matched_keywords,
      missing_keywords: aiResult.missing_keywords,
      strengths: aiResult.strengths,
      risks: aiResult.risks,
      explanation: aiResult.explanation,
    })
    .select()
    .single();

  if (insertErr) throw new Error(`Failed to save score: ${insertErr.message}`);

  // 6. Update job status
  await supabase
    .from('jobs')
    .update({ status: 'scored', updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', userId);

  return score as JobScore;
}
