import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: followUps, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('user_id', user.id)
      .order('follow_up_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch associated job titles
    const jobIds = [...new Set((followUps || []).map((f: Record<string, string>) => f.job_id))];
    let jobs: Record<string, { title: string; company: string }> = {};

    if (jobIds.length > 0) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title, company')
        .in('id', jobIds);

      if (jobData) {
        jobs = Object.fromEntries(
          jobData.map((j: { id: string; title: string; company: string }) => [j.id, { title: j.title, company: j.company }])
        );
      }
    }

    const enriched = (followUps || []).map((f: Record<string, string>) => ({
      ...f,
      job: jobs[f.job_id] || null,
    }));

    return NextResponse.json({ followUps: enriched });
  } catch (err) {
    console.error('Follow-ups GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, follow_up_type = 'post_application' } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Default: 7 days for post-application, 3 days for post-interview
    const daysUntil = follow_up_type === 'post_interview' ? 3 : 7;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysUntil);

    const { data, error } = await supabase
      .from('follow_ups')
      .insert({
        user_id: user.id,
        job_id: jobId,
        follow_up_date: followUpDate.toISOString(),
        follow_up_type,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Follow-ups POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
