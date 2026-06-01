'use client';

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  SlidersHorizontal,
  Bell,
  User,
  Save,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const [saved, setSaved] = useState(false);

  // AI Settings
  const [aiProvider, setAiProvider] = useState('hermes');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiBaseUrl, setAiBaseUrl] = useState('');

  // Scoring Weights
  const [weights, setWeights] = useState({
    role: 15,
    skills: 25,
    experience: 15,
    industry: 10,
    location: 10,
    salary: 10,
    visa: 10,
    seniority: 5,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    followUpReminders: true,
    dailyDigest: true,
    scoreAlerts: true,
    applicationUpdates: true,
  });

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  function updateWeight(key: keyof typeof weights, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    // In production, save to Supabase or API
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const tabs = [
    { id: 'ai', label: 'AI Provider', icon: Cpu },
    { id: 'scoring', label: 'Scoring Weights', icon: SlidersHorizontal },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-muted">Configure your AI provider, scoring preferences, and account.</p>
        </div>

        <div className="flex gap-6">
          {/* Tab sidebar */}
          <div className="w-48 flex-shrink-0">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left ${
                    activeTab === tab.id ? 'nav-link-active' : 'nav-link'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'ai' && (
              <div className="glass-card p-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-brand" />
                  AI Provider Configuration
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="input-label">Provider</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className="input-field"
                    >
                      <option value="hermes">Hermes</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="custom">Custom (OpenAI-compatible)</option>
                    </select>
                    <p className="text-xs text-muted-dark mt-1">
                      Select your AI provider. The abstraction layer supports swapping at any time.
                    </p>
                  </div>
                  <div>
                    <label className="input-label">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="input-field pr-10"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark hover:text-white transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Model</label>
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="e.g., gpt-4o, claude-3-opus"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">Base URL (optional)</label>
                    <input
                      type="text"
                      value={aiBaseUrl}
                      onChange={(e) => setAiBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="input-field"
                    />
                    <p className="text-xs text-muted-dark mt-1">
                      Override for custom or self-hosted endpoints.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scoring' && (
              <div className="glass-card p-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-brand" />
                  Scoring Weights
                </h2>
                <p className="text-sm text-muted mb-6">
                  Adjust how much each category contributes to the overall job match score.
                  Total must equal 100%.
                </p>
                <div
                  className={`text-sm font-medium mb-4 ${
                    totalWeight === 100 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  Total: {totalWeight}% {totalWeight !== 100 && '(must be 100%)'}
                </div>
                <div className="space-y-4">
                  {Object.entries(weights).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-muted-light capitalize">
                          {key === 'visa' ? 'Visa / Work Auth' : key}
                        </label>
                        <span className="text-sm font-bold text-white">{value}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={value}
                        onChange={(e) =>
                          updateWeight(key as keyof typeof weights, parseInt(e.target.value))
                        }
                        className="w-full h-1.5 bg-navy-700 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:hover:bg-brand-hover [&::-webkit-slider-thumb]:transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="glass-card p-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand" />
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      key: 'followUpReminders' as const,
                      label: 'Follow-up Reminders',
                      desc: 'Get reminded when follow-ups are due',
                    },
                    {
                      key: 'dailyDigest' as const,
                      label: 'Daily Digest',
                      desc: 'Receive a daily summary of job matches',
                    },
                    {
                      key: 'scoreAlerts' as const,
                      label: 'High Score Alerts',
                      desc: 'Get notified when a strong match is found',
                    },
                    {
                      key: 'applicationUpdates' as const,
                      label: 'Application Updates',
                      desc: 'Notifications on application status changes',
                    },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50 border border-navy-600/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="text-xs text-muted">{desc}</p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          notifications[key] ? 'bg-brand' : 'bg-navy-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            notifications[key] ? 'left-[22px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="glass-card p-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-brand" />
                  Account
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-navy-800/50 border border-navy-600/30">
                    <p className="text-xs text-muted mb-1">Signed in as</p>
                    <p className="text-sm font-medium text-white">Loading...</p>
                  </div>
                  <button onClick={handleSignOut} className="btn-danger w-full">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Save button */}
            {activeTab !== 'account' && (
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || (activeTab === 'scoring' && totalWeight !== 100)}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                {saved && (
                  <span className="text-sm text-emerald-400 animate-fade-in">✓ Settings saved</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
