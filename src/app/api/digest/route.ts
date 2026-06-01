import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // Get jobs found today
    const { data: todayJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('user_id', user.id)
      .gte('date_found', todayStr);

    if (jobsError) {
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    const jobs = todayJobs || [];
    const totalFound = jobs.length;

    // Get scores for today's jobs
    const jobIds = jobs.map((j: { id: string }) => j.id);
    let strongMatches = 0;
    let maybes = 0;
    let skipped = 0;

    if (jobIds.length > 0) {
      const { data: scores } = await supabase
        .from('job_scores')
        .select('recommendation')
        .in('job_id', jobIds);

      if (scores) {
        scores.forEach((s: { recommendation: string }) => {
          if (s.recommendation === 'strong_apply') strongMatches++;
          else if (s.recommendation === 'apply') strongMatches++;
          else if (s.recommendation === 'maybe') maybes++;
          else skipped++;
        });
      }
    }

    // Get packs ready for review
    const { count: packsReady } = await supabase
      .from('application_packs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('approval_status', 'pending');

    const summary = `Today I found ${totalFound} jobs. ${strongMatches} are strong matches, ${maybes} are maybes, and ${skipped} were skipped. ${packsReady || 0} application packs are ready for your review.`;

    return NextResponse.json({
      summary,
      totalFound,
      strongMatches,
      maybes,
      skipped,
      packsReady: packsReady || 0,
    });
  } catch (err) {
    console.error('Digest GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
