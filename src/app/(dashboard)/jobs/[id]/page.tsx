'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  Wifi,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Package,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Job, JobStatus, ParsedJobDescription, JobScore } from '@/lib/types';
import { SUPPORTED_COUNTRIES, getScoreColor, getRecommendationLabel } from '@/lib/types';

const countryFlag = (code: string) =>
  SUPPORTED_COUNTRIES.find((c) => c.code === code)?.flag ?? '🌐';

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  new: { cls: 'bg-slate-500/15 text-slate-400', label: 'New' },
  parsed: { cls: 'bg-indigo-500/15 text-indigo-400', label: 'Parsed' },
  scored: { cls: 'bg-cyan-500/15 text-cyan-400', label: 'Scored' },
  recommended: { cls: 'bg-blue-500/15 text-blue-400', label: 'Recommended' },
  maybe: { cls: 'bg-amber-500/15 text-amber-400', label: 'Maybe' },
  skipped: { cls: 'bg-slate-500/15 text-slate-500', label: 'Skipped' },
  drafted: { cls: 'bg-purple-500/15 text-purple-400', label: 'Drafted' },
  approved: { cls: 'bg-emerald-500/15 text-emerald-400', label: 'Approved' },
  applied: { cls: 'bg-brand/15 text-brand-light', label: 'Applied' },
  interview: { cls: 'bg-emerald-500/15 text-emerald-300', label: 'Interview' },
  rejected: { cls: 'bg-red-500/15 text-red-400', label: 'Rejected' },
  offer: { cls: 'bg-emerald-600/15 text-emerald-300', label: 'Offer' },
  withdrawn: { cls: 'bg-slate-600/15 text-slate-500', label: 'Withdrawn' },
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [score, setScore] = useState<JobScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    fetchJob();
  }, []);

  async function fetchJob() {
    try {
      const res = await fetch(`/api/jobs/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data.job || data);

        // Fetch score if scored
        if (data.job?.status === 'scored' || data.status === 'scored') {
          // Score would be embedded or fetched separately
          setScore(data.score || null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch job:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleParse() {
    if (!job) return;
    setActionLoading('parse');
    try {
      const res = await fetch(`/api/jobs/${params.id}/parse`, { method: 'POST' });
      if (res.ok) await fetchJob();
    } catch (err) {
      console.error('Parse failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleScore() {
    if (!job) return;
    setActionLoading('score');
    try {
      const res = await fetch(`/api/jobs/${params.id}/score`, { method: 'POST' });
      if (res.ok) await fetchJob();
    } catch (err) {
      console.error('Score failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleGeneratePack() {
    if (!job) return;
    setActionLoading('pack');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/applications/${data.id}`);
      }
    } catch (err) {
      console.error('Pack generation failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="page-content flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-content">
        <div className="glass-card p-12 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Job Not Found</h3>
          <Link href="/jobs" className="btn-secondary mt-4">Back to Jobs</Link>
        </div>
      </div>
    );
  }

  const parsed = job.parsed_description;
  const statusInfo = STATUS_STYLES[job.status] || STATUS_STYLES.new;

  return (
    <div className="page-content space-y-6">
      {/* Back */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
            <p className="text-muted">{job.company}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted">
              {job.country && (
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {countryFlag(job.country)} {job.country}
                </span>
              )}
              {job.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.city}
                </span>
              )}
              {job.work_mode && (
                <span className="flex items-center gap-1">
                  {job.work_mode === 'remote' ? <Wifi className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  {job.work_mode}
                </span>
              )}
              {job.salary_min && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {job.salary_currency ?? ''} {job.salary_min.toLocaleString()}
                  {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {job.date_found}
              </span>
            </div>
          </div>
          <span className={`status-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {!parsed && (
          <button onClick={handleParse} disabled={actionLoading !== null} className="btn-primary">
            {actionLoading === 'parse' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Parse Job
          </button>
        )}
        {parsed && !score && (
          <button onClick={handleScore} disabled={actionLoading !== null} className="btn-primary">
            {actionLoading === 'score' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
            Score Job
          </button>
        )}
        {score && (
          <button onClick={handleGeneratePack} disabled={actionLoading !== null} className="btn-success">
            {actionLoading === 'pack' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            Generate Application Pack
          </button>
        )}
      </div>

      {/* Score section */}
      {score && (
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand" />
            Match Score
          </h2>
          <div className="flex items-center gap-6 mb-6">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 ${
                score.overall_score >= 85
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : score.overall_score >= 70
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : score.overall_score >= 55
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              }`}
            >
              {score.overall_score}
            </div>
            <div>
              <span className={`status-badge ${score.overall_score >= 85 ? 'score-strong-apply' : score.overall_score >= 70 ? 'score-apply' : score.overall_score >= 55 ? 'score-maybe' : 'score-skip'}`}>
                {getRecommendationLabel(score.recommendation)}
              </span>
              <p className="text-sm text-muted mt-2">{score.explanation}</p>
            </div>
          </div>

          {/* Score bars */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'Role', score: score.role_score },
              { label: 'Skills', score: score.skills_score },
              { label: 'Experience', score: score.experience_score },
              { label: 'Industry', score: score.industry_score },
              { label: 'Location', score: score.location_score },
              { label: 'Salary', score: score.salary_score },
              { label: 'Visa', score: score.visa_score },
              { label: 'Seniority', score: score.seniority_score },
            ] as { label: string; score: number }[]).map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted">{item.label}</span>
                  <span className="text-xs font-bold text-muted-light">{item.score}</span>
                </div>
                <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.score >= 85 ? 'bg-emerald-400' : item.score >= 70 ? 'bg-blue-400' : item.score >= 55 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Keywords */}
          {score.matched_keywords.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted mb-2">Matched Keywords:</p>
              <div className="flex flex-wrap gap-1.5">
                {score.matched_keywords.map((kw, i) => (
                  <span key={i} className="tag bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {score.missing_keywords.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted mb-2">Missing Keywords:</p>
              <div className="flex flex-wrap gap-1.5">
                {score.missing_keywords.map((kw, i) => (
                  <span key={i} className="tag bg-red-500/10 text-red-400 border-red-500/20">
                    <XCircle className="w-2.5 h-2.5" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {score.risks.length > 0 && (
            <div className="mt-4 space-y-2">
              {score.risks.map((risk, i) => (
                <div key={i} className="warning-card">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-200">{risk}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parsed description */}
      {parsed && (
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Parsed Description</h2>

          {parsed.responsibilities.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-light mb-2">Responsibilities</h3>
              <ul className="space-y-1">
                {parsed.responsibilities.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-muted flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-brand flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.must_have_skills.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-light mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {parsed.must_have_skills.map((s: string, i: number) => (
                  <span key={i} className="tag">{s}</span>
                ))}
              </div>
            </div>
          )}

          {parsed.nice_to_have_skills.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-light mb-2">Nice to Have</h3>
              <div className="flex flex-wrap gap-1.5">
                {parsed.nice_to_have_skills.map((s: string, i: number) => (
                  <span key={i} className="tag bg-navy-700/30 text-muted-light">{s}</span>
                ))}
              </div>
            </div>
          )}

          {parsed.tools.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-light mb-2">Tools</h3>
              <div className="flex flex-wrap gap-1.5">
                {parsed.tools.map((t: string, i: number) => (
                  <span key={i} className="tag">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw description */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="w-full p-5 flex items-center justify-between text-sm text-muted-light hover:text-white transition-colors"
        >
          <span>Raw Job Description</span>
          {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showRaw && (
          <div className="px-5 pb-5">
            <div className="bg-navy-900 rounded-lg p-4 border border-navy-600/30 text-sm text-muted whitespace-pre-wrap max-h-96 overflow-y-auto">
              {job.raw_description || 'No raw description available.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
