import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/lib/ai/factory';
import { buildCVGeneratorPrompt } from '@/lib/ai/prompts/cv-generator';
import { buildCoverLetterPrompt } from '@/lib/ai/prompts/cover-letter';
import { buildSupportingStatementPrompt } from '@/lib/ai/prompts/supporting-statement';
import { getCountryConfig } from '@/lib/config/country-configs';
import type { GeneratedDocument, CandidateProfile, Job, DocumentType } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────

async function fetchJobAndProfile(jobId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const [jobRes, profileRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', jobId).eq('user_id', userId).single(),
    supabase.from('candidate_profiles').select('*').eq('user_id', userId).single(),
  ]);

  if (jobRes.error || !jobRes.data) throw new Error('Job not found or access denied.');
  if (profileRes.error || !profileRes.data) throw new Error('Candidate profile not found.');

  return {
    job: jobRes.data as Job,
    profile: profileRes.data as CandidateProfile,
    supabase,
  };
}

function extractWarnings(content: string): { cleanContent: string; warnings: string[] } {
  const warningMarker = '--- WARNINGS ---';
  const idx = content.indexOf(warningMarker);
  if (idx === -1) return { cleanContent: content.trim(), warnings: [] };

  const cleanContent = content.slice(0, idx).trim();
  const warningBlock = content.slice(idx + warningMarker.length).trim();
  const warnings = warningBlock
    .split('\n')
    .map((l) => l.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

  return { cleanContent, warnings };
}

async function saveDocument(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  jobId: string,
  userId: string,
  documentType: DocumentType,
  content: string,
  warnings: string[],
  country: string,
): Promise<GeneratedDocument> {
  // Determine version number (auto‑increment per job + type).
  const { count } = await supabase
    .from('generated_documents')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .eq('document_type', documentType);

  const version = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from('generated_documents')
    .insert({
      job_id: jobId,
      user_id: userId,
      document_type: documentType,
      title: `${documentType.replace('_', ' ')} v${version}`,
      country,
      content,
      warnings,
      version,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save document: ${error.message}`);

  // Update job status to reflect documents have been generated.
  await supabase
    .from('jobs')
    .update({ status: 'drafted', updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', userId);

  return data as GeneratedDocument;
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Generate a tailored CV / résumé for the given job.
 */
export async function generateCV(
  jobId: string,
  userId: string,
): Promise<GeneratedDocument> {
  const { job, profile, supabase } = await fetchJobAndProfile(jobId, userId);
  const countryConfig = getCountryConfig(job.country ?? 'GB')!;

  const ai = createAIProvider();
  const messages = buildCVGeneratorPrompt(profile, job, countryConfig);
  const raw = await ai.complete({ messages, temperature: 0.4, maxTokens: 4000 });

  const { cleanContent, warnings } = extractWarnings(raw);
  return saveDocument(supabase, jobId, userId, 'cv', cleanContent, warnings, job.country ?? 'GB');
}

/**
 * Generate a tailored cover letter for the given job.
 *
 * @param style - One of `short`, `standard`, or `expression_of_interest`.
 */
export async function generateCoverLetter(
  jobId: string,
  userId: string,
  style?: string,
): Promise<GeneratedDocument> {
  const validStyles = ['short', 'standard', 'expression_of_interest'] as const;
  const resolvedStyle = validStyles.includes(style as (typeof validStyles)[number])
    ? (style as (typeof validStyles)[number])
    : 'standard';

  const { job, profile, supabase } = await fetchJobAndProfile(jobId, userId);
  const countryConfig = getCountryConfig(job.country ?? 'GB')!;

  const ai = createAIProvider();
  const messages = buildCoverLetterPrompt(profile, job, countryConfig, resolvedStyle);
  const raw = await ai.complete({ messages, temperature: 0.5, maxTokens: 2000 });

  const { cleanContent, warnings } = extractWarnings(raw);
  return saveDocument(supabase, jobId, userId, 'cover_letter', cleanContent, warnings, job.country ?? 'GB');
}

/**
 * Generate a UK public‑sector supporting statement for the given job.
 *
 * @param wordCount - Target word count: 500, 750, or 1000 (default 750).
 */
export async function generateSupportingStatement(
  jobId: string,
  userId: string,
  wordCount?: number,
): Promise<GeneratedDocument> {
  const validCounts = [500, 750, 1000] as const;
  const resolvedCount = validCounts.includes(wordCount as (typeof validCounts)[number])
    ? (wordCount as (typeof validCounts)[number])
    : 750;

  const { job, profile, supabase } = await fetchJobAndProfile(jobId, userId);

  const ai = createAIProvider();
  const messages = buildSupportingStatementPrompt(profile, job, resolvedCount);
  const raw = await ai.complete({ messages, temperature: 0.4, maxTokens: 4000 });

  const { cleanContent, warnings } = extractWarnings(raw);
  return saveDocument(supabase, jobId, userId, 'supporting_statement', cleanContent, warnings, job.country ?? 'GB');
}
