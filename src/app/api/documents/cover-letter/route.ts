import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateCoverLetter } from '@/lib/services/document-service';

/**
 * POST /api/documents/cover-letter
 *
 * Generate a tailored cover letter for a job.
 *
 * Body: { jobId: string, style?: 'short' | 'standard' | 'expression_of_interest' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const document = await generateCoverLetter(body.jobId, user.id, body.style);
    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
