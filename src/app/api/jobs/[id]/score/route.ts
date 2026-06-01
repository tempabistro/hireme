import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { scoreJob } from '@/lib/services/scorer-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/jobs/[id]/score
 *
 * Score a job against the user's profile and country preferences.
 *
 * Optional body: { countryPreferenceId?: string }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let countryPreferenceId: string | undefined;
    try {
      const body = await request.json();
      countryPreferenceId = body.countryPreferenceId;
    } catch {
      // Body is optional; if missing or invalid JSON, proceed without it.
    }

    const score = await scoreJob(id, user.id, countryPreferenceId);
    return NextResponse.json(score);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('not found') || message.includes('access denied')
      ? 404
      : message.includes('must be parsed')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
