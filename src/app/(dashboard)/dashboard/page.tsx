'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Star,
  FileText,
  CheckCircle2,
  Send,
  Bell,
  ArrowRight,
  Plus,
  Eye,
  Clock,
  TrendingUp,
  Inbox,
} from 'lucide-react';

interface DashboardStats {
  totalJobs: number;
  scored: number;
  applied: number;
  interviews: number;
  drafts: number;
  countries: number;
  pendingPacks: number;
}

function buildStats(s: DashboardStats) {
  return [
    { label: 'Total Jobs', value: s.totalJobs, icon: Briefcase, color: 'text-brand-light', bgColor: 'bg-brand/10' },
    { label: 'Scored', value: s.scored, icon: Star, color: 'text-accent-emerald', bgColor: 'bg-accent-emerald/10' },
    { label: 'Drafted Packs', value: s.drafts, icon: FileText, color: 'text-accent-amber', bgColor: 'bg-accent-amber/10' },
    { label: 'Pending Review', value: s.pendingPacks, icon: CheckCircle2, color: 'text-brand-light', bgColor: 'bg-brand/10' },
    { label: 'Applied', value: s.applied, icon: Send, color: 'text-accent-emerald', bgColor: 'bg-accent-emerald/10' },
    { label: 'Interviews', value: s.interviews, icon: Bell, color: 'text-accent-amber', bgColor: 'bg-accent-amber/10' },
  ];
}

const quickActions = [
  {
    label: 'Import Job',
    description: 'Add a new job posting',
    icon: Plus,
    href: '/jobs',
    color: 'bg-brand/10 text-brand-light border-brand/20',
  },
  {
    label: 'View Recommendations',
    description: 'See scored & ranked jobs',
    icon: Eye,
    href: '/recommendations',
    color: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
  },
  {
    label: 'Check Follow-ups',
    description: 'Review pending follow-ups',
    icon: Clock,
    href: '/follow-ups',
    color: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
  },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [dashStats, setDashStats] = useState<DashboardStats>({
    totalJobs: 0, scored: 0, applied: 0, interviews: 0, drafts: 0, countries: 0, pendingPacks: 0,
  });

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setDashStats(data);
        }
      } catch {}
    };
    fetchStats();
  }, []);

  const stats = buildStats(dashStats);

  return (
    <div className="page-content space-y-8">
      {/* Welcome */}
      <div
        className={`transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h2 className="text-2xl font-bold text-white mb-1">
          Welcome back! 👋
        </h2>
        <p className="text-muted">
          Here&apos;s an overview of your job application pipeline.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`stat-card transition-all duration-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${100 + i * 75}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-muted-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        className={`transition-all duration-500 delay-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`glass-card p-5 flex items-start gap-4 group`}
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} border flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-brand-light transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-muted mt-0.5">{action.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className={`transition-all duration-500 delay-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Activity
        </h3>
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-navy-700/50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-dark" />
          </div>
          <p className="text-white font-medium mb-1">No activity yet</p>
          <p className="text-sm text-muted max-w-sm">
            Start by importing your first job posting. We&apos;ll track your
            entire application pipeline here.
          </p>
          <Link href="/jobs" className="btn-primary mt-6 text-sm">
            Import Your First Job
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
