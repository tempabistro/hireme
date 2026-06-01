import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parseJob } from '@/lib/services/parser-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/jobs/[id]/parse
 *
 * Parse a job's raw description into structured data using AI.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJob(id, user.id);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('not found') || message.includes('access denied') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
