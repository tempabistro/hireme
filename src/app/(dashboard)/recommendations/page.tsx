'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  Filter,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Inbox,
  Globe,
  Briefcase,
} from 'lucide-react';
import type { Recommendation } from '@/lib/types';
import { getRecommendationLabel, getScoreColor } from '@/lib/types';
import { SUPPORTED_COUNTRIES } from '@/lib/types';

interface ScoredJob {
  id: string;
  title: string;
  company: string;
  country_code: string;
  score: number;
  recommendation: Recommendation;
  matched_keywords: string[];
  missing_keywords: string[];
  top_risk: string;
}

const countryFlag = (code: string) =>
  SUPPORTED_COUNTRIES.find((c) => c.code === code)?.flag ?? '🌐';

// Score circle (small)
function ScoreCircle({ score }: { score: number }) {
  const color = getScoreColor(score);
  const colorMap: Record<string, string> = {
    emerald: 'text-accent-emerald border-accent-emerald/40 bg-accent-emerald/10',
    blue: 'text-brand-light border-brand/40 bg-brand/10',
    amber: 'text-accent-amber border-accent-amber/40 bg-accent-amber/10',
    red: 'text-accent-red border-accent-red/40 bg-accent-red/10',
  };

  return (
    <div
      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${colorMap[color] || colorMap.blue}`}
    >
      <span className="text-sm font-bold">{score}</span>
    </div>
  );
}

// Demo data for preview
const placeholderJobs: ScoredJob[] = [];

export default function RecommendationsPage() {
  const [jobs, setJobs] = useState<ScoredJob[]>(placeholderJobs);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterRec, setFilterRec] = useState('');
  const [filterScoreMin, setFilterScoreMin] = useState('');
  const [filterScoreMax, setFilterScoreMax] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchScored = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          const allJobs = Array.isArray(data) ? data : data.jobs || [];
          // Filter for scored/recommended jobs and map to ScoredJob format
          const scored = allJobs
            .filter((j: Record<string, unknown>) => ['scored', 'recommended', 'maybe'].includes(j.status as string))
            .map((j: Record<string, unknown>) => ({
              id: j.id as string,
              title: j.title as string,
              company: j.company as string,
              country_code: (j.country as string) || '',
              score: (j.parsed_description as Record<string, unknown>)?.overall_score as number || 0,
              recommendation: (j.status === 'recommended' ? 'apply' : j.status === 'maybe' ? 'maybe' : 'manual_review') as Recommendation,
              matched_keywords: [] as string[],
              missing_keywords: [] as string[],
              top_risk: '',
            }));
          if (scored.length > 0) setJobs(scored);
        }
      } catch {}
    };
    fetchScored();
  }, []);

  const filtered = jobs
    .filter((j) => {
      if (filterCountry && j.country_code !== filterCountry) return false;
      if (filterRec && j.recommendation !== filterRec) return false;
      if (filterScoreMin && j.score < Number(filterScoreMin)) return false;
      if (filterScoreMax && j.score > Number(filterScoreMax)) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="page-content space-y-6">
      <div
        className={`transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h2 className="text-xl font-bold text-white mb-1">Recommendations</h2>
        <p className="text-muted text-sm">
          Jobs scored against your profile, ranked by match quality.
        </p>
      </div>

      {/* Filters */}
      <div
        className={`flex flex-wrap items-center gap-3 transition-all duration-500 delay-100 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex items-center gap-2 text-sm text-muted">
          <Filter className="w-4 h-4" />
          Filters:
        </div>
        <select
          className="input-field w-auto py-1.5 text-sm"
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
        >
          <option value="">All Countries</option>
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <select
          className="input-field w-auto py-1.5 text-sm"
          value={filterRec}
          onChange={(e) => setFilterRec(e.target.value)}
        >
          <option value="">All Recommendations</option>
          <option value="strong_apply">Strong Apply</option>
          <option value="apply">Apply</option>
          <option value="maybe">Maybe</option>
          <option value="skip">Skip</option>
        </select>
        <input
          className="input-field w-20 py-1.5 text-sm"
          type="number"
          value={filterScoreMin}
          onChange={(e) => setFilterScoreMin(e.target.value)}
          placeholder="Min"
        />
        <span className="text-muted text-sm">–</span>
        <input
          className="input-field w-20 py-1.5 text-sm"
          type="number"
          value={filterScoreMax}
          onChange={(e) => setFilterScoreMax(e.target.value)}
          placeholder="Max"
        />
      </div>

      {/* Job Cards */}
      {filtered.length === 0 ? (
        <div
          className={`glass-card p-12 flex flex-col items-center justify-center text-center transition-all duration-500 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-navy-700/50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-dark" />
          </div>
          <p className="text-white font-medium mb-1">No recommendations yet</p>
          <p className="text-sm text-muted max-w-sm">
            Import and score jobs to see AI-powered recommendations ranked by
            match quality.
          </p>
          <Link href="/jobs" className="btn-primary mt-6 text-sm">
            <Briefcase className="w-4 h-4" />
            Go to Jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((job, i) => (
            <div
              key={job.id}
              className={`glass-card p-5 transition-all duration-500 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${200 + i * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <ScoreCircle score={job.score} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-semibold text-white hover:text-brand-light transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">
                        {job.company} · {countryFlag(job.country_code)}{' '}
                        {job.country_code}
                      </p>
                    </div>
                    <span className={`status-badge flex-shrink-0 ${job.score >= 85 ? 'score-strong-apply' : job.score >= 70 ? 'score-apply' : job.score >= 55 ? 'score-maybe' : 'score-skip'}`}>
                      {getRecommendationLabel(job.recommendation)}
                    </span>
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.matched_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {kw}
                      </span>
                    ))}
                    {job.missing_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium bg-accent-red/10 text-accent-red border border-accent-red/20"
                      >
                        <XCircle className="w-2.5 h-2.5" />
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Risk + Generate button */}
                  <div className="flex items-center justify-between mt-3">
                    {job.top_risk && (
                      <div className="flex items-center gap-1.5 text-2xs text-accent-amber">
                        <AlertTriangle className="w-3 h-3" />
                        {job.top_risk}
                      </div>
                    )}
                    <button className="btn-primary text-xs py-1.5 px-3 ml-auto">
                      <Package className="w-3.5 h-3.5" />
                      Generate Pack
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
