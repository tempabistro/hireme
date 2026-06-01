'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  ChevronRight,
  Filter,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface ApplicationPackItem {
  id: string;
  job_id: string;
  country: string;
  approval_status: string;
  created_at: string;
  job?: {
    title: string;
    company: string;
  };
  score?: {
    overall_score: number;
    recommendation: string;
  };
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/30',
  edit_required: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  saved_for_later: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
};

export default function ApplicationsPage() {
  const [packs, setPacks] = useState<ApplicationPackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPacks();
  }, []);

  async function fetchPacks() {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setPacks(Array.isArray(data) ? data : data.packs || []);
      }
    } catch (err) {
      console.error('Failed to fetch application packs:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredPacks = packs.filter((p) => {
    if (filterCountry && p.country !== filterCountry) return false;
    if (filterStatus && p.approval_status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !p.job?.title?.toLowerCase().includes(q) &&
        !p.job?.company?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      edit_required: 'Edit Required',
      saved_for_later: 'Saved for Later',
    };
    return labels[status] || status;
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  }

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Application Packs</h1>
          <p className="text-muted">Review and manage your tailored application packs.</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-muted">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-dark" />
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto min-w-[160px]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="edit_required">Edit Required</option>
              <option value="saved_for_later">Saved for Later</option>
            </select>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="input-field w-auto min-w-[160px]"
            >
              <option value="">All Countries</option>
              <option value="GB">🇬🇧 United Kingdom</option>
              <option value="US">🇺🇸 United States</option>
              <option value="CA">🇨🇦 Canada</option>
              <option value="DE">🇩🇪 Germany</option>
              <option value="IE">🇮🇪 Ireland</option>
              <option value="NL">🇳🇱 Netherlands</option>
              <option value="AU">🇦🇺 Australia</option>
              <option value="REMOTE">🌍 Remote Global</option>
            </select>
          </div>
        </div>

        {/* Pack List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-5 bg-navy-700/50 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-navy-700/50 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredPacks.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="w-16 h-16 text-muted-dark mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Application Packs Yet</h3>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Score a job and click &quot;Generate Application Pack&quot; to create your first tailored application.
            </p>
            <Link href="/recommendations" className="btn-primary">
              View Recommendations
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPacks.map((pack, index) => (
              <Link
                key={pack.id}
                href={`/applications/${pack.id}`}
                className="glass-card p-5 flex items-center justify-between group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-brand transition-colors">
                      {pack.job?.title || 'Untitled Job'}
                    </h3>
                    <p className="text-sm text-muted">
                      {pack.job?.company || 'Unknown Company'} · {pack.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {pack.score && (
                    <div
                      className={`text-sm font-bold ${
                        pack.score.overall_score >= 85
                          ? 'text-emerald-400'
                          : pack.score.overall_score >= 70
                          ? 'text-blue-400'
                          : pack.score.overall_score >= 55
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {pack.score.overall_score}%
                    </div>
                  )}
                  <span
                    className={`status-badge ${STATUS_STYLES[pack.approval_status] || STATUS_STYLES.pending}`}
                  >
                    {getStatusIcon(pack.approval_status)}
                    {getStatusLabel(pack.approval_status)}
                  </span>
                  <span className="text-xs text-muted-dark">
                    {new Date(pack.created_at).toLocaleDateString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-dark group-hover:text-brand transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
