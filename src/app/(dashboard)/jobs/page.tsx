'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Link2,
  FileText,
  Search,
  Filter,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Loader2,
  Inbox,
  Globe,
  Wifi,
  Building2,
  Send,
} from 'lucide-react';
import type { Job, JobStatus } from '@/lib/types';
import { SUPPORTED_COUNTRIES } from '@/lib/types';

// ───── Status badge helper ─────
function statusBadge(status: JobStatus) {
  const map: Record<string, { class: string; label: string }> = {
    new: { class: 'status-new', label: 'New' },
    parsed: { class: 'status-active', label: 'Parsed' },
    scored: { class: 'status-active', label: 'Scored' },
    recommended: { class: 'status-warning', label: 'Recommended' },
    maybe: { class: 'status-warning', label: 'Maybe' },
    skipped: { class: 'status-new', label: 'Skipped' },
    drafted: { class: 'status-warning', label: 'Drafted' },
    approved: { class: 'status-success', label: 'Approved' },
    applied: { class: 'status-success', label: 'Applied' },
    interview: { class: 'status-success', label: 'Interview' },
    rejected: { class: 'status-danger', label: 'Rejected' },
    offer: { class: 'status-success', label: 'Offer' },
    withdrawn: { class: 'status-danger', label: 'Withdrawn' },
  };
  return map[status] ?? { class: 'status-new', label: status };
}

function workModeIcon(mode: string | null) {
  switch (mode) {
    case 'remote':
      return <Wifi className="w-3.5 h-3.5" />;
    case 'hybrid':
      return <Building2 className="w-3.5 h-3.5" />;
    case 'onsite':
      return <MapPin className="w-3.5 h-3.5" />;
  }
}

const countryFlag = (code: string) =>
  SUPPORTED_COUNTRIES.find((c) => c.code === code)?.flag ?? '🌐';

export default function JobsPage() {
  const [importTab, setImportTab] = useState<'paste' | 'url' | 'manual'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWorkMode, setFilterWorkMode] = useState('');
  const [mounted, setMounted] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Manual entry state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualCountry, setManualCountry] = useState('GB');
  const [manualWorkMode, setManualWorkMode] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [manualSalary, setManualSalary] = useState('');

  const [toast, setToast] = useState('');

  useEffect(() => {
    setMounted(true);
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          setJobs(Array.isArray(data) ? data : data.jobs || []);
        }
      } catch {} finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      if (importTab === 'url' && pasteUrl.trim()) {
        // URL import — use the scraper endpoint
        const res = await fetch('/api/jobs/import-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: pasteUrl.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.job) {
          setJobs((prev) => [data.job as Job, ...prev]);
          showToast(`✓ Imported "${data.job.title}" from ${data.job.source || 'URL'}`);
          setPasteUrl('');
        } else {
          showToast(`✗ ${data.error || 'Import failed'}`);
        }
      } else if (importTab === 'paste' && pasteText.trim()) {
        // Text paste — send to jobs API
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_description: pasteText.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setJobs((prev) => [data as Job, ...prev]);
          showToast('✓ Job imported and queued for parsing');
          setPasteText('');
        } else {
          showToast(`✗ ${data.error || 'Import failed'}`);
        }
      }
    } catch (err) {
      showToast('✗ Network error — is the server running?');
    } finally {
      setImporting(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualTitle || !manualCompany) return;
    setImporting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle,
          company: manualCompany,
          country: manualCountry,
          work_mode: manualWorkMode,
          salary_min: manualSalary ? Number(manualSalary) : null,
          raw_description: '',
          status: 'new',
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setJobs(prev => [saved, ...prev]);
        showToast('✓ Job added');
        setManualTitle(''); setManualCompany(''); setManualSalary('');
      } else {
        const err = await res.json();
        showToast('✗ ' + (err.error || 'Failed to add job'));
      }
    } catch {
      showToast('✗ Network error');
    } finally {
      setImporting(false);
    }
  };

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    if (filterCountry && job.country !== filterCountry) return false;
    if (filterStatus && job.status !== filterStatus) return false;
    if (filterWorkMode && job.work_mode !== filterWorkMode) return false;
    return true;
  });

  return (
    <div className="page-content space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium animate-slide-in shadow-lg ${
          toast.startsWith('✓') ? 'bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald' : 'bg-accent-red/10 border border-accent-red/30 text-accent-red'
        }`}>
          {toast}
        </div>
      )}
      {/* Import Section */}
      <div
        className={`glass-card p-6 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Import Job</h3>

        {/* Import tabs */}
        <div className="flex gap-1 border-b border-navy-600/30 mb-5">
          {[
            { id: 'paste' as const, label: 'Paste Description', icon: FileText },
            { id: 'url' as const, label: 'Paste URL', icon: Link2 },
            { id: 'manual' as const, label: 'Manual Entry', icon: Plus },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setImportTab(t.id)}
              className={`flex items-center gap-2 ${
                importTab === t.id ? 'tab-active' : 'tab'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {importTab === 'paste' && (
          <div className="space-y-4">
            <textarea
              className="input-field min-h-[120px] resize-y"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the full job description text here..."
              rows={5}
            />
            <button
              onClick={handleImport}
              disabled={importing || !pasteText.trim()}
              className="btn-primary"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Import &amp; Parse
            </button>
          </div>
        )}

        {importTab === 'url' && (
          <div className="space-y-4">
            <input
              className="input-field"
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              placeholder="https://example.com/jobs/senior-engineer"
            />
            <button
              onClick={handleImport}
              disabled={importing || !pasteUrl.trim()}
              className="btn-primary"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Import
            </button>
          </div>
        )}

        {importTab === 'manual' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Job Title</label>
                <input
                  className="input-field"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div>
                <label className="input-label">Company</label>
                <input
                  className="input-field"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="input-label">Country</label>
                <select
                  className="input-field"
                  value={manualCountry}
                  onChange={(e) => setManualCountry(e.target.value)}
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Work Mode</label>
                <select
                  className="input-field"
                  value={manualWorkMode}
                  onChange={(e) =>
                    setManualWorkMode(e.target.value as 'remote' | 'hybrid' | 'onsite')
                  }
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>
              <div>
                <label className="input-label">Salary (Annual)</label>
                <input
                  className="input-field"
                  type="number"
                  value={manualSalary}
                  onChange={(e) => setManualSalary(e.target.value)}
                  placeholder="80000"
                />
              </div>
            </div>
            <button
              onClick={handleManualAdd}
              disabled={importing || !manualTitle || !manualCompany}
              className="btn-primary"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Job
            </button>
          </div>
        )}
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="parsed">Parsed</option>
          <option value="scored">Scored</option>
          <option value="drafted">Drafted</option>
          <option value="approved">Approved</option>
          <option value="applied">Applied</option>
        </select>
        <select
          className="input-field w-auto py-1.5 text-sm"
          value={filterWorkMode}
          onChange={(e) => setFilterWorkMode(e.target.value)}
        >
          <option value="">All Modes</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">Onsite</option>
        </select>
      </div>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <div
          className={`glass-card p-12 flex flex-col items-center justify-center text-center transition-all duration-500 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-navy-700/50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-dark" />
          </div>
          <p className="text-white font-medium mb-1">No jobs yet</p>
          <p className="text-sm text-muted max-w-sm">
            Import your first job posting above by pasting the description, URL,
            or entering details manually.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job, i) => {
            const badge = statusBadge(job.status);
            return (
              <Link
                href={`/jobs/${job.id}`}
                key={job.id}
                className={`glass-card p-5 group transition-all duration-500 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${200 + i * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-brand-light" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-brand-light transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">{job.company}</p>
                      </div>
                      <span className={`status-badge ${badge.class} flex-shrink-0`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        {countryFlag(job.country ?? '')} {job.country}
                      </span>
                      <span className="flex items-center gap-1">
                        {workModeIcon(job.work_mode)}
                        {job.work_mode}
                      </span>
                      {job.salary_min && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {job.salary_min.toLocaleString()}
                          {job.salary_currency ?? ''}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {job.date_found}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
