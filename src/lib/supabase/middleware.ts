/**
 * @fileoverview Supabase middleware helper for ApplyPilot AI.
 * Handles auth session refresh on every request and redirects
 * unauthenticated users to the login page.
 *
 * This follows the official Supabase SSR pattern for Next.js middleware:
 * - Refreshes the auth session by reading/writing cookies
 * - Protects routes by redirecting unauthenticated users
 * - Allows public routes (/, /login, /signup) without auth
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session and enforces authentication.
 * Should be called from the Next.js middleware function.
 *
 * Public routes that do NOT require authentication:
 * - / (landing page)
 * - /login
 * - /signup
 *
 * All other routes redirect to /login if no valid session exists.
 *
 * @param request - The incoming Next.js request
 * @returns The response (either the original or a redirect)
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not use supabase.auth.getSession() — it reads from
  // storage without validating the token. getUser() sends a request to
  // Supabase Auth to revalidate the token every time.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to /login for protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
