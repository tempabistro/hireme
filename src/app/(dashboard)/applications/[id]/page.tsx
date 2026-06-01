'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit3,
  Bookmark,
  Send,
  AlertTriangle,
  FileText,
  Award,
  MessageSquare,
  ClipboardCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface PackDetail {
  id: string;
  job_id: string;
  country: string;
  approval_status: string;
  approved_at: string | null;
  applied_at: string | null;
  application_url: string | null;
  risks: string[];
  checklist: { label: string; checked: boolean; required: boolean; warning?: string }[];
  created_at: string;
  job?: {
    title: string;
    company: string;
    country: string;
    city: string;
    work_mode: string;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
  };
  score?: {
    overall_score: number;
    recommendation: string;
    matched_keywords: string[];
    missing_keywords: string[];
    strengths: string[];
    risks: string[];
  };
  cv?: { content: string; warnings: string[] };
  cover_letter?: { content: string; warnings: string[] };
  answers?: { question: string; answer: string; sensitive: boolean; approved: boolean }[];
}

export default function ApplicationPackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pack, setPack] = useState<PackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPack();
  }, []);

  async function fetchPack() {
    try {
      const res = await fetch(`/api/applications/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPack(data);
      }
    } catch (err) {
      console.error('Failed to fetch application pack:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      const endpoint =
        action === 'apply'
          ? `/api/applications/${params.id}/apply`
          : action === 'approve'
          ? `/api/applications/${params.id}/approve`
          : `/api/applications/${params.id}/reject`;

      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        await fetchPack();
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setActionLoading(null);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardCheck },
    { id: 'cv', label: 'CV/Resume', icon: FileText },
    { id: 'cover_letter', label: 'Cover Letter', icon: Edit3 },
    { id: 'answers', label: 'Answers', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="glass-card p-12 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Pack Not Found</h3>
            <Link href="/applications" className="btn-secondary mt-4">
              Back to Packs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Back button */}
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Application Packs
        </Link>

        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {pack.job?.title || 'Application Pack'}
              </h1>
              <p className="text-muted">
                {pack.job?.company} · {pack.job?.city}, {pack.country} ·{' '}
                {pack.job?.work_mode}
              </p>
              {pack.job?.salary_min && (
                <p className="text-sm text-muted-light mt-1">
                  {pack.job.salary_currency}{' '}
                  {pack.job.salary_min?.toLocaleString()}
                  {pack.job.salary_max ? ` - ${pack.job.salary_max.toLocaleString()}` : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {pack.score && (
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold border ${
                    pack.score.overall_score >= 85
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : pack.score.overall_score >= 70
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : pack.score.overall_score >= 55
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-red-500/15 text-red-400 border-red-500/30'
                  }`}
                >
                  {pack.score.overall_score}
                </div>
              )}
              <div
                className={`status-badge ${
                  pack.approval_status === 'approved'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : pack.approval_status === 'rejected'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {pack.approval_status === 'approved' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : pack.approval_status === 'rejected' ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : null}
                {pack.approval_status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
            </div>
          </div>

          {/* Status badges */}
          {pack.approved_at && (
            <div className="mt-3 text-sm text-emerald-400">
              ✓ Approved on {new Date(pack.approved_at).toLocaleDateString()}
            </div>
          )}
          {pack.applied_at && (
            <div className="mt-1 text-sm text-brand-light">
              ✓ Applied on {new Date(pack.applied_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Risks */}
        {pack.risks && pack.risks.length > 0 && (
          <div className="mb-6 space-y-2">
            {pack.risks.map((risk, i) => (
              <div key={i} className="warning-card">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">{risk}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-navy-600 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'tab-active' : 'tab'}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Score Breakdown */}
              {pack.score && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-brand" />
                    Score Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {pack.score.strengths?.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-light">{s}</span>
                      </div>
                    ))}
                  </div>
                  {pack.score.missing_keywords?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted mb-2">Missing Keywords:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pack.score.missing_keywords.map((kw, i) => (
                          <span key={i} className="tag bg-red-500/10 text-red-400 border-red-500/20">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Checklist */}
              {pack.checklist && pack.checklist.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-brand" />
                    Pre-Submission Checklist
                  </h3>
                  <div className="space-y-3">
                    {pack.checklist.map((item, i) => (
                      <label key={i} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          readOnly
                          className="mt-1 w-4 h-4 rounded border-navy-600 bg-navy-800 text-brand focus:ring-brand"
                        />
                        <div>
                          <span className="text-sm text-muted-light group-hover:text-white transition-colors">
                            {item.label}
                          </span>
                          {item.warning && (
                            <p className="text-xs text-amber-400 mt-0.5">{item.warning}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cv' && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                Tailored CV / Resume
              </h3>
              {pack.cv ? (
                <>
                  {pack.cv.warnings?.map((w, i) => (
                    <div key={i} className="warning-card mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="text-sm text-amber-200">{w}</p>
                    </div>
                  ))}
                  <div className="bg-navy-900 rounded-lg p-6 border border-navy-600/30 whitespace-pre-wrap text-sm text-muted-light leading-relaxed">
                    {pack.cv.content}
                  </div>
                </>
              ) : (
                <p className="text-muted text-center py-8">
                  CV has not been generated yet. Generate the application pack first.
                </p>
              )}
            </div>
          )}

          {activeTab === 'cover_letter' && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand" />
                Cover Letter / Supporting Statement
              </h3>
              {pack.cover_letter ? (
                <>
                  {pack.cover_letter.warnings?.map((w, i) => (
                    <div key={i} className="warning-card mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="text-sm text-amber-200">{w}</p>
                    </div>
                  ))}
                  <div className="bg-navy-900 rounded-lg p-6 border border-navy-600/30 whitespace-pre-wrap text-sm text-muted-light leading-relaxed">
                    {pack.cover_letter.content}
                  </div>
                </>
              ) : (
                <p className="text-muted text-center py-8">
                  Cover letter has not been generated yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand" />
                Application Answers
              </h3>
              {pack.answers && pack.answers.length > 0 ? (
                pack.answers.map((a, i) => (
                  <div key={i} className="glass-card p-5">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-white text-sm">{a.question}</p>
                      {a.sensitive && (
                        <span className="status-badge bg-amber-500/15 text-amber-400 border border-amber-500/30 flex-shrink-0 ml-2">
                          <AlertTriangle className="w-3 h-3" />
                          Sensitive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-light whitespace-pre-wrap">{a.answer}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-xs ${
                          a.approved ? 'text-emerald-400' : 'text-muted-dark'
                        }`}
                      >
                        {a.approved ? '✓ Approved' : '○ Not yet approved'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card p-8 text-center">
                  <p className="text-muted">No application answers generated yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {pack.approval_status !== 'approved' && pack.approval_status !== 'rejected' && (
          <div className="glass-card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleAction('approve')}
                disabled={actionLoading !== null}
                className="btn-success"
              >
                {actionLoading === 'approve' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={actionLoading !== null}
                className="btn-danger"
              >
                {actionLoading === 'reject' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
              <button className="btn-secondary">
                <Edit3 className="w-4 h-4" />
                Edit First
              </button>
              <button className="btn-ghost">
                <Bookmark className="w-4 h-4" />
                Save for Later
              </button>
              <button className="btn-secondary">
                <Sparkles className="w-4 h-4" />
                Improve with AI
              </button>
            </div>
          </div>
        )}

        {pack.approval_status === 'approved' && !pack.applied_at && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction('apply')}
                disabled={actionLoading !== null}
                className="btn-primary"
              >
                {actionLoading === 'apply' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Mark as Applied Manually
              </button>
              <p className="text-sm text-muted">
                Only mark as applied after you have submitted your application.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
