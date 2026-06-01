import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/lib/ai/factory';
import { buildJobParserPrompt } from '@/lib/ai/prompts/job-parser';
import type { ParsedJobDescription } from '@/lib/types';

/**
 * Parse a job's raw description into structured data using AI.
 *
 * 1. Fetches the job from the database.
 * 2. Sends the raw description to the AI provider.
 * 3. Saves parsed data back to the job record.
 * 4. Updates the job status to `parsed`.
 *
 * @param jobId  - The job record to parse.
 * @param userId - The authenticated user (ownership check).
 * @returns The structured {@link ParsedJobDescription}.
 * @throws If the job is not found, has no raw description, or AI call fails.
 */
export async function parseJob(
  jobId: string,
  userId: string,
): Promise<ParsedJobDescription> {
  const supabase = await createServerSupabaseClient();

  // 1. Fetch the job
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !job) {
    throw new Error('Job not found or access denied.');
  }

  if (!job.raw_description) {
    throw new Error('Job has no raw description to parse.');
  }

  // 2. Call AI
  const ai = createAIProvider();
  const messages = buildJobParserPrompt(job.raw_description);
  const parsed = await ai.completeJSON<ParsedJobDescription>({
    messages,
    temperature: 0.1,
    responseFormat: 'json',
  });

  // 3. Merge AI‑extracted fields with any user‑provided overrides
  const mergedTitle = job.title || parsed.title;
  const mergedCompany = job.company || parsed.company;
  const mergedCountry = job.country || parsed.country;

  // 4. Save back to DB
  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      parsed_description: parsed,
      title: mergedTitle,
      company: mergedCompany,
      country: mergedCountry,
      work_mode: job.work_mode || parsed.work_mode,
      salary_min: job.salary_min ?? parsed.salary_min,
      salary_max: job.salary_max ?? parsed.salary_max,
      salary_currency: job.salary_currency || parsed.currency,
      status: 'parsed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to save parsed data: ${updateError.message}`);
  }

  return parsed;
}
