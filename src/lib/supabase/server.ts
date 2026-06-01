/**
 * @fileoverview Server-side Supabase client for ApplyPilot AI.
 * Uses @supabase/ssr's createServerClient with Next.js App Router cookies.
 * This client is used in Server Components, Server Actions, and Route Handlers.
 *
 * The cookie handling follows the official Supabase SSR pattern:
 * - getAll reads all cookies from the incoming request
 * - setAll writes cookies back (wrapped in try/catch for Server Components
 *   where cookie writing is not allowed)
 *
 * @example
 * ```tsx
 * // In a Server Component or Server Action
 * import { createServerSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = await createServerSupabaseClient();
 *   const { data } = await supabase.from('jobs').select('*');
 *   // ...
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side use (Server Components,
 * Server Actions, Route Handlers).
 *
 * @returns A Supabase server client instance with cookie-based auth
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method may be called from a Server Component
            // where cookies cannot be set. This is expected and safe to ignore
            // because the middleware will handle session refresh.
          }
        },
      },
    }
  );
}
