'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Briefcase,
  Wrench,
  GraduationCap,
  Target,
  FileText,
  Save,
  Plus,
  X,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { CandidateProfile, Education, WorkHistory } from '@/lib/types';

// ───── Tag Input ─────
function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  };

  return (
    <div className="input-field flex flex-wrap gap-2 min-h-[42px] h-auto py-2">
      {tags.map((tag, i) => (
        <span key={i} className="tag-removable" onClick={() => onRemove(i)}>
          {tag}
          <X className="w-3 h-3" />
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="bg-transparent border-none outline-none text-slate-100 placeholder:text-muted-dark flex-1 min-w-[120px] text-sm p-0"
      />
    </div>
  );
}

// ───── Tab Definitions ─────
const tabs = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'skills', label: 'Skills & Tools', icon: Wrench },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'preferences', label: 'Preferences', icon: Target },
  { id: 'cv', label: 'Master CV', icon: FileText },
];

// ───── Empty defaults ─────
const emptyWorkHistory: WorkHistory = {
  company: '',
  title: '',
  location: '',
  start_date: '',
  end_date: '',
  current: false,
  description: '',
  achievements: [],
};

const emptyEducation: Education = {
  institution: '',
  degree: '',
  field: '',
  start_date: '',
  end_date: '',
  grade: '',
};

const defaultProfile: CandidateProfile = {
  full_name: '',
  email: '',
  phone: '',
  location: '',
  linkedin_url: '',
  portfolio_url: '',
  current_title: '',
  years_experience: undefined,
  headline: '',
  summary: '',
  skills: [],
  tools: [],
  certifications: [],
  languages: [],
  education: [],
  work_history: [],
  target_titles: [],
  target_seniority: '',
  preferred_industries: [],
  notice_period: '',
  availability_date: '',
  relocation_willingness: '',
  master_cv_text: '',
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<CandidateProfile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile({ ...defaultProfile, ...data });
        }
      } catch {
        // No profile yet — use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const saved = await res.json();
        setProfile({ ...defaultProfile, ...saved });
        showToast('Profile saved successfully!');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save profile', 'error');
      }
    } catch {
      showToast('Network error — could not save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CandidateProfile, value: unknown) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // ───── Work History helpers ─────
  const addWorkHistory = () => {
    setProfile((prev) => ({
      ...prev,
      work_history: [...prev.work_history, { ...emptyWorkHistory }],
    }));
  };

  const updateWorkHistory = (index: number, field: keyof WorkHistory, value: unknown) => {
    setProfile((prev) => {
      const updated = [...prev.work_history];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, work_history: updated };
    });
  };

  const removeWorkHistory = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      work_history: prev.work_history.filter((_, i) => i !== index),
    }));
  };

  // ───── Education helpers ─────
  const addEducation = () => {
    setProfile((prev) => ({
      ...prev,
      education: [...prev.education, { ...emptyEducation }],
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: unknown) => {
    setProfile((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const removeEducation = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="page-content space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium animate-slide-in shadow-lg ${
          toastType === 'success'
            ? 'bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald'
            : 'bg-accent-red/10 border border-accent-red/30 text-accent-red'
        }`}>
          {toastType === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast}
        </div>
      )}

      {loading && (
        <div className="glass-card p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-light" />
          <span className="ml-3 text-muted">Loading profile...</span>
        </div>
      )}

      {/* Tabs */}
      <div
        className={`flex gap-1 overflow-x-auto pb-1 border-b border-navy-600/30 transition-all duration-500 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap ${
              activeTab === t.id ? 'tab-active' : 'tab'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className={`glass-card p-6 sm:p-8 animate-fade-in transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* ─── Personal Info ─── */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="input-label">Full Name</label>
                <input
                  className="input-field"
                  value={profile.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input
                  className="input-field"
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input
                  className="input-field"
                  value={profile.phone ?? ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+44 7700 900000"
                />
              </div>
              <div>
                <label className="input-label">Location</label>
                <input
                  className="input-field"
                  value={profile.location ?? ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="London, UK"
                />
              </div>
              <div>
                <label className="input-label">LinkedIn URL</label>
                <input
                  className="input-field"
                  value={profile.linkedin_url ?? ''}
                  onChange={(e) => updateField('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
              <div>
                <label className="input-label">Portfolio URL</label>
                <input
                  className="input-field"
                  value={profile.portfolio_url ?? ''}
                  onChange={(e) => updateField('portfolio_url', e.target.value)}
                  placeholder="https://johndoe.dev"
                />
              </div>
              <div>
                <label className="input-label">Current Title</label>
                <input
                  className="input-field"
                  value={profile.current_title ?? ''}
                  onChange={(e) => updateField('current_title', e.target.value)}
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div>
                <label className="input-label">Years of Experience</label>
                <input
                  className="input-field"
                  type="number"
                  value={profile.years_experience ?? ''}
                  onChange={(e) =>
                    updateField('years_experience', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="5"
                />
              </div>
            </div>
            <div>
              <label className="input-label">Headline</label>
              <input
                className="input-field"
                value={profile.headline ?? ''}
                onChange={(e) => updateField('headline', e.target.value)}
                placeholder="A concise professional headline"
              />
            </div>
            <div>
              <label className="input-label">Summary</label>
              <textarea
                className="input-field min-h-[120px] resize-y"
                value={profile.summary ?? ''}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder="A brief summary of your professional background, strengths, and career goals..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* ─── Experience ─── */}
        {activeTab === 'experience' && (
          <div className="space-y-6">
            {profile.work_history.length === 0 && (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 text-muted-dark mx-auto mb-3" />
                <p className="text-muted text-sm">No work experience added yet.</p>
              </div>
            )}

            {profile.work_history.map((wh, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-navy-800/50 border border-navy-600/30 space-y-4 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">
                    Position {i + 1}
                  </h4>
                  <button
                    onClick={() => removeWorkHistory(i)}
                    className="text-muted hover:text-accent-red transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Company</label>
                    <input
                      className="input-field"
                      value={wh.company}
                      onChange={(e) => updateWorkHistory(i, 'company', e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="input-label">Title</label>
                    <input
                      className="input-field"
                      value={wh.title}
                      onChange={(e) => updateWorkHistory(i, 'title', e.target.value)}
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <label className="input-label">Location</label>
                    <input
                      className="input-field"
                      value={wh.location}
                      onChange={(e) => updateWorkHistory(i, 'location', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="input-label">Start Date</label>
                      <input
                        className="input-field"
                        type="date"
                        value={wh.start_date}
                        onChange={(e) => updateWorkHistory(i, 'start_date', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="input-label">End Date</label>
                      <input
                        className="input-field"
                        type="date"
                        value={wh.end_date ?? ''}
                        onChange={(e) => updateWorkHistory(i, 'end_date', e.target.value)}
                        disabled={wh.current}
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-light cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wh.current}
                    onChange={(e) => updateWorkHistory(i, 'current', e.target.checked)}
                    className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-brand focus:ring-brand/50"
                  />
                  I currently work here
                </label>

                <div>
                  <label className="input-label">Description</label>
                  <textarea
                    className="input-field min-h-[80px] resize-y"
                    value={wh.description}
                    onChange={(e) => updateWorkHistory(i, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and impact..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="input-label">Achievements (tags)</label>
                  <TagInput
                    tags={wh.achievements}
                    onAdd={(tag) =>
                      updateWorkHistory(i, 'achievements', [...wh.achievements, tag])
                    }
                    onRemove={(idx) =>
                      updateWorkHistory(
                        i,
                        'achievements',
                        wh.achievements.filter((_, j) => j !== idx)
                      )
                    }
                    placeholder="Type an achievement and press Enter"
                  />
                </div>
              </div>
            ))}

            <button onClick={addWorkHistory} className="btn-secondary w-full">
              <Plus className="w-4 h-4" />
              Add Experience
            </button>
          </div>
        )}

        {/* ─── Skills & Tools ─── */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div>
              <label className="input-label">Skills</label>
              <TagInput
                tags={profile.skills}
                onAdd={(tag) => updateField('skills', [...profile.skills, tag])}
                onRemove={(i) =>
                  updateField('skills', profile.skills.filter((_, j) => j !== i))
                }
                placeholder="Type a skill and press Enter (e.g., React, TypeScript)"
              />
            </div>
            <div>
              <label className="input-label">Tools & Technologies</label>
              <TagInput
                tags={profile.tools}
                onAdd={(tag) => updateField('tools', [...profile.tools, tag])}
                onRemove={(i) =>
                  updateField('tools', profile.tools.filter((_, j) => j !== i))
                }
                placeholder="Type a tool and press Enter (e.g., Docker, AWS)"
              />
            </div>
            <div>
              <label className="input-label">Certifications</label>
              <TagInput
                tags={profile.certifications}
                onAdd={(tag) =>
                  updateField('certifications', [...profile.certifications, tag])
                }
                onRemove={(i) =>
                  updateField(
                    'certifications',
                    profile.certifications.filter((_, j) => j !== i)
                  )
                }
                placeholder="Type a certification and press Enter"
              />
            </div>
            <div>
              <label className="input-label">Languages</label>
              <TagInput
                tags={profile.languages}
                onAdd={(tag) =>
                  updateField('languages', [...profile.languages, tag])
                }
                onRemove={(i) =>
                  updateField(
                    'languages',
                    profile.languages.filter((_, j) => j !== i)
                  )
                }
                placeholder="Type a language and press Enter (e.g., English, French)"
              />
            </div>
          </div>
        )}

        {/* ─── Education ─── */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            {profile.education.length === 0 && (
              <div className="text-center py-8">
                <GraduationCap className="w-10 h-10 text-muted-dark mx-auto mb-3" />
                <p className="text-muted text-sm">No education entries added yet.</p>
              </div>
            )}

            {profile.education.map((edu, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-navy-800/50 border border-navy-600/30 space-y-4 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">
                    Education {i + 1}
                  </h4>
                  <button
                    onClick={() => removeEducation(i)}
                    className="text-muted hover:text-accent-red transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Institution</label>
                    <input
                      className="input-field"
                      value={edu.institution}
                      onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                      placeholder="University name"
                    />
                  </div>
                  <div>
                    <label className="input-label">Degree</label>
                    <input
                      className="input-field"
                      value={edu.degree}
                      onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                      placeholder="BSc, MSc, PhD..."
                    />
                  </div>
                  <div>
                    <label className="input-label">Field of Study</label>
                    <input
                      className="input-field"
                      value={edu.field}
                      onChange={(e) => updateEducation(i, 'field', e.target.value)}
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="input-label">Grade</label>
                    <input
                      className="input-field"
                      value={edu.grade ?? ''}
                      onChange={(e) => updateEducation(i, 'grade', e.target.value)}
                      placeholder="First Class, 3.8 GPA"
                    />
                  </div>
                  <div>
                    <label className="input-label">Start Date</label>
                    <input
                      className="input-field"
                      type="date"
                      value={edu.start_date}
                      onChange={(e) => updateEducation(i, 'start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="input-label">End Date</label>
                    <input
                      className="input-field"
                      type="date"
                      value={edu.end_date ?? ''}
                      onChange={(e) => updateEducation(i, 'end_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addEducation} className="btn-secondary w-full">
              <Plus className="w-4 h-4" />
              Add Education
            </button>
          </div>
        )}

        {/* ─── Preferences ─── */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div>
              <label className="input-label">Target Job Titles</label>
              <TagInput
                tags={profile.target_titles}
                onAdd={(tag) =>
                  updateField('target_titles', [...profile.target_titles, tag])
                }
                onRemove={(i) =>
                  updateField(
                    'target_titles',
                    profile.target_titles.filter((_, j) => j !== i)
                  )
                }
                placeholder="e.g., Senior Software Engineer, Tech Lead"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="input-label">Target Seniority</label>
                <select
                  className="input-field"
                  value={profile.target_seniority ?? ''}
                  onChange={(e) => updateField('target_seniority', e.target.value)}
                >
                  <option value="">Select seniority</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="principal">Principal</option>
                  <option value="director">Director</option>
                  <option value="vp">VP</option>
                  <option value="c-level">C-Level</option>
                </select>
              </div>
              <div>
                <label className="input-label">Notice Period</label>
                <input
                  className="input-field"
                  value={profile.notice_period ?? ''}
                  onChange={(e) => updateField('notice_period', e.target.value)}
                  placeholder="e.g., 1 month"
                />
              </div>
              <div>
                <label className="input-label">Availability Date</label>
                <input
                  className="input-field"
                  type="date"
                  value={profile.availability_date ?? ''}
                  onChange={(e) => updateField('availability_date', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">Relocation Willingness</label>
                <select
                  className="input-field"
                  value={profile.relocation_willingness ?? ''}
                  onChange={(e) =>
                    updateField('relocation_willingness', e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="maybe">Maybe / Depends</option>
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">Preferred Industries</label>
              <TagInput
                tags={profile.preferred_industries}
                onAdd={(tag) =>
                  updateField('preferred_industries', [
                    ...profile.preferred_industries,
                    tag,
                  ])
                }
                onRemove={(i) =>
                  updateField(
                    'preferred_industries',
                    profile.preferred_industries.filter((_, j) => j !== i)
                  )
                }
                placeholder="e.g., FinTech, SaaS, HealthTech"
              />
            </div>
          </div>
        )}

        {/* ─── Master CV ─── */}
        {activeTab === 'cv' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-brand/5 border border-brand/20">
              <AlertCircle className="w-5 h-5 text-brand-light flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Master CV / Resume</p>
                <p className="text-xs text-muted mt-0.5">
                  Paste the full text of your master CV or resume. This serves as the
                  base for all AI-generated, country-specific documents.
                </p>
              </div>
            </div>

            <div>
              <label className="input-label">CV / Resume Text</label>
              <textarea
                className="input-field min-h-[300px] resize-y font-mono text-sm"
                value={profile.master_cv_text ?? ''}
                onChange={(e) => updateField('master_cv_text', e.target.value)}
                placeholder="Paste your full CV / resume text here..."
                rows={15}
              />
            </div>

            <div>
              <label className="input-label">Or Upload a File</label>
              <div className="input-field flex items-center justify-center h-24 border-dashed cursor-pointer hover:border-brand/50 transition-colors">
                <div className="text-center">
                  <FileText className="w-6 h-6 text-muted-dark mx-auto mb-1" />
                  <p className="text-xs text-muted">
                    Click or drag to upload (.pdf, .docx, .txt)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
