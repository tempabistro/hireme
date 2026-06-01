import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectApplication } from '@/lib/services/application-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/applications/[id]/reject
 *
 * Reject an application pack with an optional reason.
 *
 * Body: { reason?: string }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // Body is optional.
    }

    const pack = await rejectApplication(id, user.id, reason);
    return NextResponse.json(pack);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
