import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { markAsApplied } from '@/lib/services/application-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/applications/[id]/apply
 *
 * Mark an application pack as manually applied by the user.
 * This records the timestamp and optional application URL.
 *
 * NOTE: The system NEVER auto‑submits. The user must apply on
 * the employer's platform themselves.
 *
 * Body: { application_url?: string }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let details: { application_url?: string } | undefined;
    try {
      const body = await request.json();
      details = { application_url: body.application_url };
    } catch {
      // Body is optional.
    }

    const pack = await markAsApplied(id, user.id, details);
    return NextResponse.json(pack);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
