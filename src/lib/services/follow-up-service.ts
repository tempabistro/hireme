import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/lib/ai/factory';
import { buildFollowUpPrompt } from '@/lib/ai/prompts/follow-up';
import type { FollowUp } from '@/lib/types';

/**
 * Schedule a follow‑up reminder for a submitted application.
 *
 * Defaults to a post‑application follow‑up scheduled 7 days from now.
 */
export async function scheduleFollowUp(
  jobId: string,
  userId: string,
  type?: string,
): Promise<FollowUp> {
  const supabase = await createServerSupabaseClient();

  const resolvedType =
    type === 'post_interview' ? 'post_interview' : 'post_application';

  // Default: 7 days for post_application, 3 days for post_interview.
  const daysOut = resolvedType === 'post_application' ? 7 : 3;
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + daysOut);

  const { data, error } = await supabase
    .from('follow_ups')
    .insert({
      job_id: jobId,
      user_id: userId,
      type: resolvedType,
      status: 'pending',
      scheduled_date: scheduledDate.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to schedule follow‑up: ${error.message}`);
  return data as FollowUp;
}

/**
 * List follow‑ups for a user, optionally filtered by status.
 */
export async function getFollowUps(
  userId: string,
  status?: string,
): Promise<FollowUp[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('follow_ups')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch follow‑ups: ${error.message}`);
  return (data ?? []) as FollowUp[];
}

/**
 * Generate the email content for a scheduled follow‑up using AI.
 *
 * Fetches the related job details to personalise the email.
 */
export async function generateFollowUpEmail(
  followUpId: string,
  userId: string,
): Promise<string> {
  const supabase = await createServerSupabaseClient();

  // Fetch follow‑up
  const { data: followUp, error: fuErr } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('id', followUpId)
    .eq('user_id', userId)
    .single();

  if (fuErr || !followUp) throw new Error('Follow‑up not found or access denied.');

  // Fetch related job
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('title, company')
    .eq('id', followUp.job_id)
    .eq('user_id', userId)
    .single();

  if (jobErr || !job) throw new Error('Related job not found.');

  // Fetch candidate name
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('full_name')
    .eq('user_id', userId)
    .single();

  const candidateName = profile?.full_name ?? 'Candidate';

  // Determine application date from the application pack or follow-up creation
  const { data: pack } = await supabase
    .from('application_packs')
    .select('applied_at, created_at')
    .eq('job_id', followUp.job_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const applicationDate = pack?.applied_at ?? pack?.created_at ?? followUp.created_at ?? new Date().toISOString();

  const ai = createAIProvider();
  const messages = buildFollowUpPrompt(
    candidateName,
    job.title ?? 'the role',
    job.company ?? 'your organisation',
    applicationDate,
    followUp.type as 'post_application' | 'post_interview',
  );

  const emailContent = await ai.complete({ messages, temperature: 0.5, maxTokens: 1000 });

  // Save back to follow‑up record
  await supabase
    .from('follow_ups')
    .update({ email_content: emailContent, updated_at: new Date().toISOString() })
    .eq('id', followUpId)
    .eq('user_id', userId);

  return emailContent;
}

/**
 * Mark a follow‑up as sent and record the timestamp.
 */
export async function markFollowUpSent(
  followUpId: string,
  userId: string,
): Promise<FollowUp> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('follow_ups')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', followUpId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update follow‑up: ${error.message}`);
  return data as FollowUp;
}
