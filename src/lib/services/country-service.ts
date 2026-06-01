import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CountryPreference } from '@/lib/types';

/**
 * Fetch all country preferences for a user.
 */
export async function getUserCountryPreferences(
  userId: string,
): Promise<CountryPreference[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('country_preferences')
    .select('*')
    .eq('user_id', userId)
    .order('is_active', { ascending: false });

  if (error) throw new Error(`Failed to fetch country preferences: ${error.message}`);
  return (data ?? []) as CountryPreference[];
}

/**
 * Get the user's active country preference.
 * Returns null if none is set as active.
 */
export async function getActiveCountry(
  userId: string,
): Promise<CountryPreference | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('country_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch active country: ${error.message}`);
  }

  return (data as CountryPreference) ?? null;
}

/**
 * Update an existing country preference.
 */
export async function updateCountryPreference(
  userId: string,
  prefId: string,
  data: Partial<CountryPreference>,
): Promise<CountryPreference> {
  const supabase = await createServerSupabaseClient();

  // If setting this preference as active, deactivate all others first.
  if (data.is_active === true) {
    await supabase
      .from('country_preferences')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .neq('id', prefId);
  }

  const { id: _id, user_id: _uid, created_at: _ca, ...safeData } = data as Record<string, unknown>;

  const { data: updated, error } = await supabase
    .from('country_preferences')
    .update({ ...safeData, updated_at: new Date().toISOString() })
    .eq('id', prefId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update country preference: ${error.message}`);
  return updated as CountryPreference;
}

/**
 * Create a new country preference.
 *
 * If this is the first preference, it will be set as active automatically.
 */
export async function createCountryPreference(
  userId: string,
  data: Partial<CountryPreference>,
): Promise<CountryPreference> {
  const supabase = await createServerSupabaseClient();

  // Check how many existing preferences the user has.
  const { count } = await supabase
    .from('country_preferences')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const isFirst = (count ?? 0) === 0;

  // If setting as active, deactivate others.
  if (data.is_active === true || isFirst) {
    await supabase
      .from('country_preferences')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  const { data: created, error } = await supabase
    .from('country_preferences')
    .insert({
      user_id: userId,
      country_name: data.country_name ?? '',
      country_code: data.country_code ?? 'GB',
      is_active: data.is_active ?? isFirst,
      is_default: data.is_default ?? isFirst,
      work_authorisation_status: data.work_authorisation_status ?? 'unknown',
      visa_sponsorship_required: data.visa_sponsorship_required ?? 'maybe',
      minimum_salary: data.minimum_salary ?? null,
      salary_currency: data.salary_currency ?? 'GBP',
      remote_preference: data.remote_preference ?? false,
      hybrid_preference: data.hybrid_preference ?? false,
      onsite_preference: data.onsite_preference ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create country preference: ${error.message}`);
  return created as CountryPreference;
}

/**
 * Delete a country preference.
 */
export async function deleteCountryPreference(
  userId: string,
  prefId: string,
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('country_preferences')
    .delete()
    .eq('id', prefId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete country preference: ${error.message}`);
}
