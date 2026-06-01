import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getUserCountryPreferences,
  createCountryPreference,
} from '@/lib/services/country-service';

/**
 * GET /api/countries
 *
 * Fetch all country preferences for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await getUserCountryPreferences(user.id);
    return NextResponse.json(preferences);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/countries
 *
 * Create a new country preference.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.country_code) {
      return NextResponse.json(
        { error: 'country_code is required' },
        { status: 400 },
      );
    }

    const preference = await createCountryPreference(user.id, body);
    return NextResponse.json(preference, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
