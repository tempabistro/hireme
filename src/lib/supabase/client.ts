/**
 * @fileoverview Browser-side Supabase client for ApplyPilot AI.
 * Uses @supabase/ssr's createBrowserClient for client components.
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser / client components.
 * Cleans the URL to avoid "Invalid path" errors from trailing slashes.
 */
export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createBrowserClient(url, key);
}
