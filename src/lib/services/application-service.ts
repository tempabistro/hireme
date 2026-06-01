import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/lib/ai/factory';
import { buildAnswerPrompt } from '@/lib/ai/prompts/answer-generator';
import { getCountryConfig } from '@/lib/config/country-configs';
import type {
  ApplicationAnswer,
  ApplicationPack,
  ApprovalStatus,
  ChecklistItem,
  CandidateProfile,
  Job,
} from '@/lib/types';

// ── Answers ───────────────────────────────────────────────────────────

/**
 * Generate AI‑assisted answers for a list of application questions.
 *
 * Each answer is scored for confidence and flagged if it requires
 * human review (e.g., sensitive questions or insufficient evidence).
 */
export async function generateApplicationAnswers(
  jobId: string,
  userId: string,
  questions: string[],
): Promise<ApplicationAnswer[]> {
  const supabase = await createServerSupabaseClient();

  // Fetch job and profile
  const [jobRes, profileRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', jobId).eq('user_id', userId).single(),
    supabase.from('candidate_profiles').select('*').eq('user_id', userId).single(),
  ]);

  if (jobRes.error || !jobRes.data) throw new Error('Job not found or access denied.');
  if (profileRes.error || !profileRes.data) throw new Error('Candidate profile not found.');

  const job = jobRes.data as Job;
  const profile = profileRes.data as CandidateProfile;
  const countryConfig = getCountryConfig(job.country ?? 'GB')!;

  const ai = createAIProvider();
  const answers: ApplicationAnswer[] = [];

  // Process questions sequentially to avoid rate limits.
  for (const question of questions) {
    const messages = buildAnswerPrompt(profile, job, question, countryConfig);
    const result = await ai.completeJSON<{
      answer: string;
      confidence: 'high' | 'medium' | 'low';
      requires_review: boolean;
      warnings: string[];
    }>({
      messages,
      temperature: 0.3,
      responseFormat: 'json',
    });

    const { data: savedAnswer, error } = await supabase
      .from('application_answers')
      .insert({
        job_id: jobId,
        user_id: userId,
        question,
        answer: result.answer,
        confidence: result.confidence,
        requires_review: result.requires_review,
        warnings: result.warnings,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save answer: ${error.message}`);
    answers.push(savedAnswer as ApplicationAnswer);
  }

  return answers;
}

// ── Application Pack ──────────────────────────────────────────────────

/**
 * Create a new application pack bundling all generated documents
 * and answers for a specific job.
 */
export async function createApplicationPack(
  jobId: string,
  userId: string,
): Promise<ApplicationPack> {
  const supabase = await createServerSupabaseClient();

  // Verify job exists and belongs to user
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (jobErr || !job) throw new Error('Job not found or access denied.');

  // Gather existing documents for this job
  const { data: documents } = await supabase
    .from('documents')
    .select('id, document_type')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .order('version', { ascending: false });

  // Gather existing answers
  const { data: answerRows } = await supabase
    .from('application_answers')
    .select('id')
    .eq('job_id', jobId)
    .eq('user_id', userId);

  // Build checklist
  const cvDoc = documents?.find((d) => d.document_type === 'cv');
  const clDoc = documents?.find((d) => d.document_type === 'cover_letter');
  const ssDoc = documents?.find((d) => d.document_type === 'supporting_statement');

  const checklist: ChecklistItem[] = [
    { label: 'Tailored CV / Résumé', checked: !!cvDoc, required: true },
    { label: 'Cover Letter', checked: !!clDoc, required: true },
    { label: 'Supporting Statement', checked: !!ssDoc, required: false },
    { label: 'Application Questions Answered', checked: (answerRows?.length ?? 0) > 0, required: false },
    { label: 'Human Review Completed', checked: false, required: true },
  ];

  const { data: pack, error: insertErr } = await supabase
    .from('application_packs')
    .insert({
      job_id: jobId,
      user_id: userId,
      country: job.country ?? '',
      approval_status: 'pending' as ApprovalStatus,
      status: 'drafted',
      checklist,
      cv_document_id: cvDoc?.id ?? null,
      cover_letter_document_id: clDoc?.id ?? null,
    })
    .select()
    .single();

  if (insertErr) throw new Error(`Failed to create application pack: ${insertErr.message}`);

  // Update job status
  await supabase
    .from('jobs')
    .update({ status: 'pack_ready', updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', userId);

  return pack as ApplicationPack;
}

/**
 * Approve an application pack, marking it ready for submission.
 * NOTE: This does NOT auto‑submit — the user must apply manually.
 */
export async function approveApplication(
  packId: string,
  userId: string,
): Promise<ApplicationPack> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('application_packs')
    .update({
      approval_status: 'approved' as ApprovalStatus,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', packId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to approve pack: ${error.message}`);
  return data as ApplicationPack;
}

/**
 * Reject an application pack with an optional reason.
 */
export async function rejectApplication(
  packId: string,
  userId: string,
  reason?: string,
): Promise<ApplicationPack> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('application_packs')
    .update({
      approval_status: 'rejected' as ApprovalStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', packId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to reject pack: ${error.message}`);
  return data as ApplicationPack;
}

/**
 * Mark an application pack as manually applied.
 * Records the timestamp and optional application URL.
 */
export async function markAsApplied(
  packId: string,
  userId: string,
  details?: { application_url?: string },
): Promise<ApplicationPack> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('application_packs')
    .update({
      applied_at: new Date().toISOString(),
      application_url: details?.application_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', packId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to mark as applied: ${error.message}`);

  // Also update the job status
  if (data) {
    await supabase
      .from('jobs')
      .update({ status: 'applied', updated_at: new Date().toISOString() })
      .eq('id', (data as ApplicationPack).job_id)
      .eq('user_id', userId);
  }

  return data as ApplicationPack;
}
