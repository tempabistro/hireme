'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Globe,
  Filter,
  ArrowUpDown,
  Briefcase,
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface TrackerJob {
  id: string;
  company: string;
  title: string;
  country: string;
  city: string;
  work_mode: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  score: number | null;
  status: string;
  date_applied: string | null;
  follow_up_date: string | null;
  source: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-slate-500/15 text-slate-400',
  parsed: 'bg-indigo-500/15 text-indigo-400',
  scored: 'bg-cyan-500/15 text-cyan-400',
  recommended: 'bg-blue-500/15 text-blue-400',
  maybe: 'bg-amber-500/15 text-amber-400',
  skipped: 'bg-slate-500/15 text-slate-500',
  drafted: 'bg-purple-500/15 text-purple-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  applied: 'bg-brand/15 text-brand-light',
  interview: 'bg-emerald-500/15 text-emerald-300',
  rejected: 'bg-red-500/15 text-red-400',
  offer: 'bg-emerald-600/15 text-emerald-300',
  withdrawn: 'bg-slate-600/15 text-slate-500',
};

type SortKey = keyof TrackerJob;

export default function TrackerPage() {
  const [jobs, setJobs] = useState<TrackerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date_applied');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTrackerData();
  }, []);

  async function fetchTrackerData() {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        const allJobs = Array.isArray(data) ? data : data.jobs || [];
        // Filter for jobs in the tracker pipeline
        const tracked = allJobs
          .filter((j: Record<string, unknown>) =>
            ['applied', 'approved', 'drafted', 'interview', 'rejected', 'offer', 'withdrawn'].includes(j.status as string)
          )
          .map((j: Record<string, unknown>) => ({
            id: j.id,
            company: j.company,
            title: j.title,
            country: j.country || '',
            city: j.city || '',
            work_mode: j.work_mode || '',
            salary_min: j.salary_min,
            salary_max: j.salary_max,
            salary_currency: j.salary_currency || '',
            score: null,
            status: j.status,
            date_applied: j.updated_at,
            follow_up_date: null,
            source: j.source || '',
          } as TrackerJob));
        setJobs(tracked);
      }
    } catch (err) {
      console.error('Failed to fetch tracker data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    if (filterCountry) result = result.filter((j) => j.country === filterCountry);
    if (filterStatus) result = result.filter((j) => j.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [jobs, filterCountry, filterStatus, searchQuery, sortKey, sortDir]);

  // Analytics
  const totalApplied = jobs.filter((j) => ['applied', 'interview', 'offer'].includes(j.status)).length;
  const totalInterviews = jobs.filter((j) => j.status === 'interview').length;
  const totalRejected = jobs.filter((j) => j.status === 'rejected').length;
  const responseRate =
    totalApplied > 0
      ? Math.round(((totalInterviews + totalRejected) / totalApplied) * 100)
      : 0;

  // Top country
  const countryCounts: Record<string, number> = {};
  jobs.forEach((j) => {
    if (j.country) countryCounts[j.country] = (countryCounts[j.country] || 0) + 1;
  });
  const topCountry =
    Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Application Tracker</h1>
          <p className="text-muted">Track all your applications and monitor outcomes.</p>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalApplied}</p>
                <p className="text-xs text-muted">Total Applied</p>
              </div>
            </div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalInterviews}</p>
                <p className="text-xs text-muted">Interviews</p>
              </div>
            </div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{responseRate}%</p>
                <p className="text-xs text-muted">Response Rate</p>
              </div>
            </div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{topCountry}</p>
                <p className="text-xs text-muted">Top Country</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-4 h-4 text-muted" />
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-dark" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="input-field w-auto min-w-[150px]"
            >
              <option value="">All Countries</option>
              <option value="GB">🇬🇧 UK</option>
              <option value="US">🇺🇸 US</option>
              <option value="CA">🇨🇦 Canada</option>
              <option value="DE">🇩🇪 Germany</option>
              <option value="REMOTE">🌍 Remote</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="skeleton h-8 w-full mb-3 rounded"></div>
              <div className="skeleton h-8 w-full mb-3 rounded"></div>
              <div className="skeleton h-8 w-full rounded"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-muted-dark mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Applications Tracked</h3>
              <p className="text-muted max-w-md mx-auto">
                Approve application packs and mark them as applied to start tracking your progress.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      { key: 'company' as SortKey, label: 'Company' },
                      { key: 'title' as SortKey, label: 'Job Title' },
                      { key: 'country' as SortKey, label: 'Country' },
                      { key: 'work_mode' as SortKey, label: 'Mode' },
                      { key: 'score' as SortKey, label: 'Score' },
                      { key: 'status' as SortKey, label: 'Status' },
                      { key: 'date_applied' as SortKey, label: 'Applied' },
                      { key: 'follow_up_date' as SortKey, label: 'Follow-up' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="cursor-pointer hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          <SortIcon column={key} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="font-medium text-white">{job.company}</td>
                      <td>{job.title}</td>
                      <td>{job.country}</td>
                      <td>
                        <span className="tag text-2xs">{job.work_mode || '—'}</span>
                      </td>
                      <td>
                        {job.score !== null ? (
                          <span
                            className={`font-bold ${
                              job.score >= 85
                                ? 'text-emerald-400'
                                : job.score >= 70
                                ? 'text-blue-400'
                                : job.score >= 55
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}
                          >
                            {job.score}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${STATUS_COLORS[job.status] || STATUS_COLORS.new}`}
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </td>
                      <td className="text-xs">
                        {job.date_applied
                          ? new Date(job.date_applied).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="text-xs">
                        {job.follow_up_date
                          ? new Date(job.follow_up_date).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
