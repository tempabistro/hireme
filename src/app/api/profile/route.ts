import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CandidateProfile } from '@/lib/types';

/**
 * GET /api/profile
 *
 * Fetch the current authenticated user's candidate profile.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile as CandidateProfile);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/profile
 *
 * Update the current user's candidate profile.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Strip ownership fields.
    const { id: _id, user_id: _uid, created_at: _ca, ...updateData } = body;

    // Sanitize: convert empty strings to null for date/numeric/enum columns
    const dateFields = ['availability_date'];
    const numericFields = ['years_experience'];
    const enumFields = ['relocation_willingness'];
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === '') {
        if (dateFields.includes(key) || numericFields.includes(key) || enumFields.includes(key)) {
          updateData[key] = null;
        }
      }
    }

    // Upsert: create if not exists, update if exists.
    const { data: profile, error } = await supabase
      .from('candidate_profiles')
      .upsert(
        {
          user_id: user.id,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profile as CandidateProfile);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
