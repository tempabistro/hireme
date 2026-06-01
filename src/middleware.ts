/**
 * Next.js middleware for ApplyPilot AI.
 *
 * In preview mode (no Supabase env vars), the middleware is a no-op
 * so you can view every page without authentication.
 */

import { NextResponse, type NextRequest } from 'next/server';

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here';

export async function middleware(request: NextRequest) {
  // Preview mode — skip auth entirely
  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  // Production mode — enforce auth
  const { updateSession } = await import('@/lib/supabase/middleware');
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
