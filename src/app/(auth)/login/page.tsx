'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSupabaseConfigured =
    typeof window !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Preview mode — skip auth
    if (!isSupabaseConfigured) {
      router.push('/dashboard');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Translate common Supabase errors
        if (error.message.includes('Invalid path')) {
          setError('Cannot connect to authentication server. Please check your Supabase URL in Vercel environment variables.');
        } else if (error.message.includes('Invalid login')) {
          setError('Invalid email or password.');
        } else {
          setError(error.message);
        }
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Cannot connect to authentication server. Please verify your Supabase environment variables are correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-muted text-sm">
          Sign in to your ApplyPilot AI account
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm animate-fade-in">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="input-label">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-dark" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="input-label">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-dark" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input-field pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark hover:text-muted transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-brand-light hover:text-brand font-medium transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
