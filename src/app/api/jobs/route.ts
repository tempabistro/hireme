import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getJobs, importJob } from '@/lib/services/job-service';
import type { JobStatus } from '@/lib/types';

/**
 * GET /api/jobs
 *
 * Fetch jobs for the authenticated user with optional query filters.
 *
 * Query params:
 *  - country: ISO country code
 *  - status: JobStatus
 *  - work_mode: remote | hybrid | onsite
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      country: searchParams.get('country') ?? undefined,
      status: (searchParams.get('status') as JobStatus) ?? undefined,
      work_mode: searchParams.get('work_mode') ?? undefined,
    };

    const jobs = await getJobs(user.id, filters);
    return NextResponse.json(jobs);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/jobs
 *
 * Import / create a new job.
 *
 * Body: { raw_description?, source_url?, title?, company?, country?,
 *         work_mode?, salary_min?, salary_max?, salary_currency? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.raw_description && !body.source_url && !body.title) {
      return NextResponse.json(
        { error: 'At least one of raw_description, source_url, or title is required.' },
        { status: 400 },
      );
    }

    const job = await importJob(user.id, body);
    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
