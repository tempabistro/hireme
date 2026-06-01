/**
 * @fileoverview Browser-side Supabase client for ApplyPilot AI.
 * Uses @supabase/ssr's createBrowserClient for client components
 * in Next.js App Router. This client runs in the browser and
 * automatically handles auth token refresh via cookies.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 *
 * export default function MyComponent() {
 *   const supabase = createClient();
 *   // use supabase...
 * }
 * ```
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser / client components.
 * Reads connection details from NEXT_PUBLIC_ environment variables.
 *
 * @returns A Supabase browser client instance
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
