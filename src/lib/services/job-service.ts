import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Job, JobStatus } from '@/lib/types';

/**
 * Import or create a new job record.
 *
 * @param userId - The authenticated user's ID.
 * @param data   - Partial job data (at minimum, raw_description or source_url).
 * @returns The newly created Job row.
 */
export async function importJob(
  userId: string,
  data: {
    raw_description?: string;
    source_url?: string;
    title?: string;
    company?: string;
    country?: string;
    work_mode?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
  },
): Promise<Job> {
  const supabase = await createServerSupabaseClient();

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      raw_description: data.raw_description ?? null,
      source_url: data.source_url ?? null,
      title: data.title ?? null,
      company: data.company ?? null,
      country: data.country ?? null,
      work_mode: data.work_mode ?? null,
      salary_min: data.salary_min ?? null,
      salary_max: data.salary_max ?? null,
      salary_currency: data.salary_currency ?? null,
      status: 'imported' as JobStatus,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to import job: ${error.message}`);
  return job as Job;
}

/**
 * Fetch jobs for a user with optional filters.
 */
export async function getJobs(
  userId: string,
  filters?: { country?: string; status?: JobStatus; work_mode?: string },
): Promise<Job[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.country) {
    query = query.eq('country', filters.country);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.work_mode) {
    query = query.eq('work_mode', filters.work_mode);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch jobs: ${error.message}`);
  return (data ?? []) as Job[];
}

/**
 * Fetch a single job, scoped to the authenticated user.
 */
export async function getJob(
  jobId: string,
  userId: string,
): Promise<Job | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch job: ${error.message}`);
  }
  return (data as Job) ?? null;
}

/**
 * Update an existing job record.
 */
export async function updateJob(
  jobId: string,
  userId: string,
  data: Partial<Job>,
): Promise<Job> {
  const supabase = await createServerSupabaseClient();

  // Prevent overwriting ownership fields.
  const { id: _id, user_id: _uid, created_at: _ca, ...safeData } = data as Record<string, unknown>;

  const { data: job, error } = await supabase
    .from('jobs')
    .update({ ...safeData, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update job: ${error.message}`);
  return job as Job;
}

/**
 * Soft‑delete (or hard‑delete) a job record.
 */
export async function deleteJob(
  jobId: string,
  userId: string,
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete job: ${error.message}`);
}
