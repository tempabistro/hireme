'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Globe,
  Briefcase,
  Star,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Zap,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { CountryProvider, useCountry } from '@/contexts/CountryContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/countries', label: 'Countries', icon: Globe },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/recommendations', label: 'Recommendations', icon: Star },
  { href: '/applications', label: 'Application Packs', icon: FileText },
  { href: '/tracker', label: 'Tracker', icon: BarChart3 },
  { href: '/follow-ups', label: 'Follow-ups', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function getPageTitle(pathname: string): string {
  const item = navItems.find((n) => pathname.startsWith(n.href));
  return item?.label ?? 'Dashboard';
}

function CountrySelector() {
  const { selectedCountry, setSelectedCountry, countries } = useCountry();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-navy-600/50 hover:border-brand/40 transition-colors text-sm"
      >
        <span className="text-base">{selectedCountry?.flag ?? '🌍'}</span>
        <span className="text-muted-light hidden sm:inline">
          {selectedCountry?.name ?? 'Select Country'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-navy-800 border border-navy-600 rounded-xl shadow-2xl z-50 py-2 animate-fade-in">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  setSelectedCountry(country);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors ${
                  selectedCountry?.code === country.code
                    ? 'text-white bg-brand/10'
                    : 'text-muted-light'
                }`}
              >
                <span className="text-base">{country.flag}</span>
                {country.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-navy-600/30">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent-emerald flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white">ApplyPilot AI</span>
          </Link>
          <button
            className="lg:hidden text-muted hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={isActive ? 'nav-link-active' : 'nav-link'}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-navy-600/30">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-light" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User</p>
              <p className="text-xs text-muted truncate">user@email.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="page-container">
        {/* Top bar */}
        <header className="topbar">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-muted hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {getPageTitle(pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <CountrySelector />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center hover:bg-brand/30 transition-colors"
              >
                <User className="w-4 h-4 text-brand-light" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-navy-800 border border-navy-600 rounded-xl shadow-2xl z-50 py-2 animate-fade-in">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-light hover:bg-surface-hover hover:text-white transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-light hover:bg-surface-hover hover:text-white transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <hr className="my-1 border-navy-600/50" />
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent-red hover:bg-accent-red/10 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CountryProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </CountryProvider>
  );
}
