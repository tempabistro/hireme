import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: jobs } = await supabase
      .from('jobs')
      .select('status')
      .eq('user_id', user.id);

    const allJobs = jobs || [];
    const totalJobs = allJobs.length;
    const scored = allJobs.filter(j => ['scored', 'recommended'].includes(j.status)).length;
    const applied = allJobs.filter(j => ['applied', 'interview', 'offer'].includes(j.status)).length;
    const interviews = allJobs.filter(j => j.status === 'interview').length;
    const drafts = allJobs.filter(j => j.status === 'drafted').length;

    const { count: countries } = await supabase
      .from('country_preferences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    const { count: pendingPacks } = await supabase
      .from('application_packs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('approval_status', 'pending');

    return NextResponse.json({
      totalJobs,
      scored,
      applied,
      interviews,
      drafts,
      countries: countries || 0,
      pendingPacks: pendingPacks || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
