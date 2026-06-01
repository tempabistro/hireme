import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Generate a daily digest summary for the user.
 *
 * Aggregates jobs found/scored today into a quick status snapshot
 * with counts by recommendation and pending action items.
 *
 * @param userId  - The authenticated user.
 * @param country - Optional country code to filter by.
 */
export async function generateDailyDigest(
  userId: string,
  country?: string,
): Promise<{
  summary: string;
  strongMatches: number;
  maybes: number;
  skipped: number;
  packsReady: number;
}> {
  const supabase = await createServerSupabaseClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // ── Fetch today's scores ────────────────────────────────────────
  let scoresQuery = supabase
    .from('job_scores')
    .select('recommendation, job_id')
    .eq('user_id', userId)
    .gte('created_at', todayISO);

  if (country) {
    // Join through jobs to filter by country
    // Since we can't easily do a join filter in Supabase client,
    // we'll fetch job ids for this country first.
    const { data: countryJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('country', country);

    const jobIds = countryJobs?.map((j) => j.id) ?? [];
    if (jobIds.length > 0) {
      scoresQuery = scoresQuery.in('job_id', jobIds);
    } else {
      // No jobs for this country — return empty digest.
      return {
        summary: `No jobs found for ${country} today.`,
        strongMatches: 0,
        maybes: 0,
        skipped: 0,
        packsReady: 0,
      };
    }
  }

  const { data: scores } = await scoresQuery;

  const strongMatches = scores?.filter(
    (s) => s.recommendation === 'strong_match' || s.recommendation === 'good_match',
  ).length ?? 0;

  const maybes = scores?.filter(
    (s) => s.recommendation === 'maybe' || s.recommendation === 'long_shot',
  ).length ?? 0;

  const skipped = scores?.filter(
    (s) => s.recommendation === 'skip',
  ).length ?? 0;

  // ── Fetch packs ready for review ───────────────────────────────
  const { count: packsReady } = await supabase
    .from('application_packs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');

  // ── Build summary text ─────────────────────────────────────────
  const total = (scores?.length ?? 0);
  const parts: string[] = [];

  if (total === 0) {
    parts.push('No new jobs scored today.');
  } else {
    parts.push(`${total} job${total !== 1 ? 's' : ''} scored today.`);
  }

  if (strongMatches > 0) {
    parts.push(`🟢 ${strongMatches} strong/good match${strongMatches !== 1 ? 'es' : ''}.`);
  }
  if (maybes > 0) {
    parts.push(`🟡 ${maybes} maybe/long shot${maybes !== 1 ? 's' : ''}.`);
  }
  if (skipped > 0) {
    parts.push(`🔴 ${skipped} skipped.`);
  }
  if ((packsReady ?? 0) > 0) {
    parts.push(`📦 ${packsReady} application pack${(packsReady ?? 0) !== 1 ? 's' : ''} awaiting review.`);
  }

  return {
    summary: parts.join(' '),
    strongMatches,
    maybes,
    skipped,
    packsReady: packsReady ?? 0,
  };
}
