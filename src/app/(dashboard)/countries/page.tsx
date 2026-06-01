'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Check,
  Save,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Loader2,
  MapPin,
  Landmark,
  Star,
} from 'lucide-react';
import type { CountryPreference } from '@/lib/types';
import { SUPPORTED_COUNTRIES } from '@/lib/types';

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

// ───── Local country option type ─────
interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currency: string;
  custom?: boolean;
}

// ───── Default preference factory ─────
function defaultPreference(config: CountryOption): CountryPreference {
  return {
    id: '',
    user_id: '',
    country_code: config.code,
    country_name: config.name,
    is_active: false,
    is_default: false,
    minimum_salary: null,
    salary_currency: config.currency,
    work_authorisation_status: 'unknown',
    visa_sponsorship_required: 'maybe',
    preferred_cities: [],
    excluded_cities: [],
    remote_preference: true,
    hybrid_preference: true,
    onsite_preference: false,
    willing_to_relocate: 'maybe',
    document_type_label: 'CV',
    spelling_preference: 'british',
    cover_letter_style: 'standard',
    application_language: 'en',
    allowed_sources: [],
    blocked_sources: [],
    country_keywords: [],
    created_at: '',
    updated_at: '',
  };
}

// ───── All available countries ─────
const allCountryOptions: CountryOption[] = [
  ...SUPPORTED_COUNTRIES.map((c) => ({ ...c, currency: 'GBP' })),
  { code: 'XX', name: 'Custom Country', flag: '🌐', currency: 'USD', custom: true },
];

export default function CountriesPage() {
  const [preferences, setPreferences] = useState<Record<string, CountryPreference>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize preferences from supported countries
    const initial: Record<string, CountryPreference> = {};
    allCountryOptions.forEach((c) => {
      initial[c.code] = defaultPreference(c);
    });
    // First country is default
    if (SUPPORTED_COUNTRIES.length > 0) {
      initial[SUPPORTED_COUNTRIES[0].code].is_default = true;
      initial[SUPPORTED_COUNTRIES[0].code].is_active = true;
    }
    setPreferences(initial);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleActive = (code: string) => {
    setPreferences((prev) => ({
      ...prev,
      [code]: { ...prev[code], is_active: !prev[code].is_active },
    }));
  };

  const updatePref = (code: string, field: keyof CountryPreference, value: unknown) => {
    setPreferences((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  };

  const handleSave = async (code: string) => {
    setSaving(code);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(null);
    showToast(`${preferences[code].country_name} settings saved!`);
  };

  const configuredCount = (pref: CountryPreference): number => {
    let count = 0;
    if (pref.minimum_salary) count++;
    if (pref.work_authorisation_status !== 'unknown') count++;
    if (pref.preferred_cities.length > 0) count++;
    if (pref.excluded_cities.length > 0) count++;
    return count;
  };

  return (
    <div className="page-content space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald text-sm font-medium animate-slide-in shadow-lg">
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div
        className={`transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h2 className="text-xl font-bold text-white mb-1">Country Settings</h2>
        <p className="text-muted text-sm">
          Configure your preferences for each target country. Active countries
          will be used when scoring jobs and generating documents.
        </p>
      </div>

      {/* Country Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCountryOptions.map((country, i) => {
          const pref = preferences[country.code];
          if (!pref) return null;

          const isExpanded = expanded === country.code;

          return (
            <div
              key={country.code}
              className={`glass-card overflow-hidden transition-all duration-500 ${
                isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''
              } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${100 + i * 50}ms` }}
            >
              {/* Card Header */}
              <div className="p-5 flex items-center gap-4">
                <span className="text-3xl">{country.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {country.name}
                    </h3>
                    {pref.is_default && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
                        <Star className="w-2.5 h-2.5" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {configuredCount(pref)} settings configured
                  </p>
                </div>

                {/* Active toggle */}
                <button
                  onClick={() => toggleActive(country.code)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    pref.is_active ? 'bg-accent-emerald' : 'bg-navy-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      pref.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Expand button */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : country.code)}
                  className="text-muted hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Expanded Settings Form */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-navy-600/30 animate-fade-in space-y-5">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="input-label">Minimum Salary</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="input-field flex-1"
                          value={pref.minimum_salary ?? ''}
                          onChange={(e) =>
                            updatePref(
                              country.code,
                              'minimum_salary',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          placeholder="e.g., 80000"
                        />
                        <input
                          className="input-field w-20"
                          value={pref.salary_currency ?? ''}
                          onChange={(e) =>
                            updatePref(country.code, 'salary_currency', e.target.value)
                          }
                          placeholder="GBP"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="input-label">Work Authorisation</label>
                      <select
                        className="input-field"
                        value={pref.work_authorisation_status}
                        onChange={(e) =>
                          updatePref(
                            country.code,
                            'work_authorisation_status',
                            e.target.value
                          )
                        }
                      >
                        <option value="authorised">Authorised</option>
                        <option value="requires_visa">Requires Visa</option>
                        <option value="requires_sponsorship">Requires Sponsorship</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Visa Sponsorship</label>
                      <select
                        className="input-field"
                        value={pref.visa_sponsorship_required ?? ''}
                        onChange={(e) =>
                          updatePref(
                            country.code,
                            'visa_sponsorship_required',
                            e.target.value
                          )
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Willing to Relocate</label>
                      <select
                        className="input-field"
                        value={pref.willing_to_relocate ?? ''}
                        onChange={(e) =>
                          updatePref(
                            country.code,
                            'willing_to_relocate',
                            e.target.value
                          )
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Document Type Label</label>
                      <input
                        className="input-field"
                        value={pref.document_type_label ?? ''}
                        onChange={(e) =>
                          updatePref(country.code, 'document_type_label', e.target.value)
                        }
                        placeholder="CV / Resume"
                      />
                    </div>

                    <div>
                      <label className="input-label">Spelling Preference</label>
                      <input
                        className="input-field"
                        value={pref.spelling_preference ?? ''}
                        onChange={(e) =>
                          updatePref(country.code, 'spelling_preference', e.target.value)
                        }
                        placeholder="British / American"
                      />
                    </div>

                    <div>
                      <label className="input-label">Cover Letter Style</label>
                      <input
                        className="input-field"
                        value={pref.cover_letter_style ?? ''}
                        onChange={(e) =>
                          updatePref(country.code, 'cover_letter_style', e.target.value)
                        }
                        placeholder="professional / friendly"
                      />
                    </div>

                    <div>
                      <label className="input-label">Application Language</label>
                      <input
                        className="input-field"
                        value={pref.application_language ?? ''}
                        onChange={(e) =>
                          updatePref(country.code, 'application_language', e.target.value)
                        }
                        placeholder="en / de / nl"
                      />
                    </div>
                  </div>

                  {/* Work mode checkboxes */}
                  <div>
                    <label className="input-label">Work Mode Preferences</label>
                    <div className="flex flex-wrap gap-4 mt-1">
                      {[
                        { key: 'remote_preference' as keyof CountryPreference, label: 'Remote' },
                        { key: 'hybrid_preference' as keyof CountryPreference, label: 'Hybrid' },
                        { key: 'onsite_preference' as keyof CountryPreference, label: 'Onsite' },
                      ].map((mode) => (
                        <label
                          key={mode.key}
                          className="flex items-center gap-2 text-sm text-muted-light cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!pref[mode.key]}
                            onChange={(e) =>
                              updatePref(country.code, mode.key, e.target.checked)
                            }
                            className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-brand focus:ring-brand/50"
                          />
                          {mode.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* City tag inputs */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Preferred Cities
                      </label>
                      <TagInput
                        tags={pref.preferred_cities}
                        onAdd={(tag) =>
                          updatePref(country.code, 'preferred_cities', [
                            ...pref.preferred_cities,
                            tag,
                          ])
                        }
                        onRemove={(i) =>
                          updatePref(
                            country.code,
                            'preferred_cities',
                            pref.preferred_cities.filter((_, j) => j !== i)
                          )
                        }
                        placeholder="Type a city and press Enter"
                      />
                    </div>
                    <div>
                      <label className="input-label flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        Excluded Cities
                      </label>
                      <TagInput
                        tags={pref.excluded_cities}
                        onAdd={(tag) =>
                          updatePref(country.code, 'excluded_cities', [
                            ...pref.excluded_cities,
                            tag,
                          ])
                        }
                        onRemove={(i) =>
                          updatePref(
                            country.code,
                            'excluded_cities',
                            pref.excluded_cities.filter((_, j) => j !== i)
                          )
                        }
                        placeholder="Type a city and press Enter"
                      />
                    </div>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave(country.code)}
                      disabled={saving === country.code}
                      className="btn-primary"
                    >
                      {saving === country.code ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving === country.code ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
