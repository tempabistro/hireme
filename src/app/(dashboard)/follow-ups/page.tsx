'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Send,
  SkipForward,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

interface FollowUpItem {
  id: string;
  job_id: string;
  follow_up_date: string;
  follow_up_type: 'post_application' | 'post_interview' | 'recruiter';
  status: 'scheduled' | 'sent' | 'skipped';
  message_draft: string | null;
  job?: {
    title: string;
    company: string;
  };
}

const TYPE_LABELS: Record<string, string> = {
  post_application: 'Post-Application',
  post_interview: 'Post-Interview',
  recruiter: 'Recruiter Follow-up',
};

const TYPE_COLORS: Record<string, string> = {
  post_application: 'bg-brand/15 text-brand-light border border-brand/30',
  post_interview: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  recruiter: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
};

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  async function fetchFollowUps() {
    try {
      const res = await fetch('/api/follow-ups');
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps || []);
      }
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkSent(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/follow-ups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });
      await fetchFollowUps();
    } catch (err) {
      console.error('Failed to update follow-up:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSkip(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/follow-ups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'skipped' }),
      });
      await fetchFollowUps();
    } catch (err) {
      console.error('Failed to skip follow-up:', err);
    } finally {
      setActionLoading(null);
    }
  }

  const now = new Date();
  const scheduled = followUps.filter((f) => f.status === 'scheduled');
  const completed = followUps.filter((f) => f.status !== 'scheduled');

  const overdue = scheduled.filter((f) => new Date(f.follow_up_date) < now);
  const upcoming = scheduled.filter((f) => new Date(f.follow_up_date) >= now);

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Follow-up Reminders</h1>
          <p className="text-muted">
            Stay on top of your applications with timely follow-ups.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{scheduled.length}</p>
                <p className="text-xs text-muted">Scheduled</p>
              </div>
            </div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{overdue.length}</p>
                <p className="text-xs text-muted">Overdue</p>
              </div>
            </div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completed.length}</p>
                <p className="text-xs text-muted">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue */}
        {overdue.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Overdue ({overdue.length})
            </h2>
            <div className="space-y-3">
              {overdue.map((fu) => (
                <FollowUpCard
                  key={fu.id}
                  followUp={fu}
                  isOverdue
                  expanded={expandedId === fu.id}
                  onToggle={() => setExpandedId(expandedId === fu.id ? null : fu.id)}
                  onMarkSent={() => handleMarkSent(fu.id)}
                  onSkip={() => handleSkip(fu.id)}
                  actionLoading={actionLoading === fu.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand" />
            Upcoming ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Bell className="w-16 h-16 text-muted-dark mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Upcoming Follow-ups</h3>
              <p className="text-muted max-w-md mx-auto">
                Follow-ups are automatically scheduled when you mark applications as applied.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((fu) => (
                <FollowUpCard
                  key={fu.id}
                  followUp={fu}
                  expanded={expandedId === fu.id}
                  onToggle={() => setExpandedId(expandedId === fu.id ? null : fu.id)}
                  onMarkSent={() => handleMarkSent(fu.id)}
                  onSkip={() => handleSkip(fu.id)}
                  actionLoading={actionLoading === fu.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-muted mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Completed ({completed.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {completed.map((fu) => (
                <div key={fu.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-muted-dark" />
                    <div>
                      <p className="text-sm font-medium text-muted-light">
                        {fu.job?.title || 'Job'} — {fu.job?.company || 'Company'}
                      </p>
                      <p className="text-xs text-muted-dark">
                        {new Date(fu.follow_up_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`status-badge ${
                      fu.status === 'sent'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-slate-500/15 text-slate-400'
                    }`}
                  >
                    {fu.status === 'sent' ? 'Sent' : 'Skipped'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FollowUpCard({
  followUp,
  isOverdue,
  expanded,
  onToggle,
  onMarkSent,
  onSkip,
  actionLoading,
}: {
  followUp: FollowUpItem;
  isOverdue?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onMarkSent: () => void;
  onSkip: () => void;
  actionLoading: boolean;
}) {
  const daysUntil = Math.ceil(
    (new Date(followUp.follow_up_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={`glass-card overflow-hidden animate-fade-in ${
        isOverdue ? 'border-red-500/30' : ''
      }`}
    >
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isOverdue ? 'bg-red-500/10' : 'bg-brand/10'
            }`}
          >
            <Mail className={`w-5 h-5 ${isOverdue ? 'text-red-400' : 'text-brand'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {followUp.job?.title || 'Job'} — {followUp.job?.company || 'Company'}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className={`status-badge ${TYPE_COLORS[followUp.follow_up_type]}`}>
                {TYPE_LABELS[followUp.follow_up_type]}
              </span>
              <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-muted'}`}>
                <Calendar className="w-3 h-3 inline mr-1" />
                {new Date(followUp.follow_up_date).toLocaleDateString()}
                {isOverdue
                  ? ` (${Math.abs(daysUntil)} days overdue)`
                  : daysUntil === 0
                  ? ' (Today)'
                  : daysUntil === 1
                  ? ' (Tomorrow)'
                  : ` (in ${daysUntil} days)`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkSent}
            disabled={actionLoading}
            className="btn-success text-xs py-1.5 px-3"
          >
            <Send className="w-3.5 h-3.5" />
            Mark Sent
          </button>
          <button
            onClick={onSkip}
            disabled={actionLoading}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip
          </button>
          {followUp.message_draft && (
            <button onClick={onToggle} className="btn-ghost text-xs py-1.5 px-3">
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {expanded ? 'Hide Draft' : 'View Draft'}
            </button>
          )}
        </div>
      </div>

      {expanded && followUp.message_draft && (
        <div className="px-5 pb-5 border-t border-navy-600/30 pt-4">
          <div className="bg-navy-900 rounded-lg p-4 border border-navy-600/30">
            <p className="text-xs text-muted mb-2 font-medium">Draft Follow-up Email:</p>
            <div className="text-sm text-muted-light whitespace-pre-wrap leading-relaxed">
              {followUp.message_draft}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
