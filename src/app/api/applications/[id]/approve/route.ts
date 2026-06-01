import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { approveApplication } from '@/lib/services/application-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/applications/[id]/approve
 *
 * Approve an application pack, marking it ready for manual submission.
 * NOTE: This does NOT auto‑submit the application.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pack = await approveApplication(id, user.id);
    return NextResponse.json(pack);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
