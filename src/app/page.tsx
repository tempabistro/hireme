'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Cpu,
  FileText,
  Package,
  ShieldCheck,
  BellRing,
  ArrowRight,
  Sparkles,
  Zap,
  ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Country-Aware Matching',
    description:
      'Automatically adapts your applications to each country\'s market norms — CV vs Resume, spelling, salary expectations, and visa requirements.',
  },
  {
    icon: Cpu,
    title: 'AI-Powered Scoring',
    description:
      'Every job is scored against your profile with a transparent breakdown. Know exactly why a role is recommended before you apply.',
  },
  {
    icon: FileText,
    title: 'Tailored Documents',
    description:
      'Generates country-specific CVs, resumes, and cover letters that highlight the right skills and experience for each application.',
  },
  {
    icon: Package,
    title: 'Application Packs',
    description:
      'Complete application packages with documents, pre-answered questions, and checklists — ready for your review and one-click approval.',
  },
  {
    icon: ShieldCheck,
    title: 'Human Approval',
    description:
      'Nothing goes out without your sign-off. Review every document, answer, and detail before the application is submitted.',
  },
  {
    icon: BellRing,
    title: 'Smart Follow-ups',
    description:
      'Automated follow-up reminders with pre-drafted messages timed to each market\'s norms. Never miss a window.',
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-accent-emerald/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand/3 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent-emerald flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">ApplyPilot AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-muted hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-primary text-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
          <div
            className={`transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand-light text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Job Application Agent
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              <span className="gradient-text">Your AI Job</span>
              <br />
              <span className="text-white">Application Agent</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted leading-relaxed mb-10">
              Country-aware, quality-focused AI that tailors your CVs, cover
              letters, and application answers for every market. Review,
              approve, and apply with confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="btn-primary text-base px-8 py-3 group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="btn-secondary text-base px-8 py-3"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div
            className={`mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto transition-all duration-700 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {[
              { value: '9+', label: 'Countries Supported' },
              { value: '100%', label: 'Human Approval' },
              { value: 'AI', label: 'Powered Scoring' },
              { value: '∞', label: 'Applications' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Apply Smarter
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              From scoring to follow-ups, ApplyPilot AI handles the entire
              application pipeline — with you in control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`glass-card p-6 group transition-all duration-500 ${
                  mounted
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${400 + i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-brand-light" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-accent-emerald/5" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Apply Smarter?
              </h2>
              <p className="text-muted text-lg max-w-lg mx-auto mb-8">
                Stop wasting time on generic applications. Let AI tailor every
                detail while you stay in control.
              </p>
              <Link
                href="/login"
                className="btn-primary text-base px-8 py-3 group"
              >
                Start Free
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-navy-600/50 bg-navy-800/50">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand to-accent-emerald flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">
              ApplyPilot AI
            </span>
          </div>
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} ApplyPilot AI. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
