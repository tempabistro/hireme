import { NextResponse } from 'next/server';

/**
 * GET /api/debug/env
 * 
 * Shows masked env vars to diagnose configuration issues.
 * Remove this route before going to production.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '(not set)';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '(not set)';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '(not set)';
  const aiProvider = process.env.AI_PROVIDER || '(not set)';
  const aiBaseUrl = process.env.AI_BASE_URL || '(not set)';

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey.length > 10 
        ? anonKey.slice(0, 10) + '...' + anonKey.slice(-4) 
        : anonKey,
      SUPABASE_SERVICE_ROLE_KEY: serviceKey.length > 10 
        ? serviceKey.slice(0, 10) + '...' + serviceKey.slice(-4) 
        : serviceKey,
      AI_PROVIDER: aiProvider,
      AI_BASE_URL: aiBaseUrl,
    },
    checks: {
      supabaseUrlFormat: supabaseUrl.startsWith('https://') && supabaseUrl.endsWith('.supabase.co') 
        ? '✅ Correct' 
        : `❌ Expected format: https://xxxxx.supabase.co — got: "${supabaseUrl}"`,
      anonKeySet: anonKey !== '(not set)' && anonKey !== 'your_supabase_anon_key_here'
        ? '✅ Set' 
        : '❌ Not set or placeholder',
      trailingSlash: supabaseUrl.endsWith('/') 
        ? '❌ Has trailing slash — remove it' 
        : '✅ No trailing slash',
    }
  });
}
