import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Modal } from '../common/UIComponents';
import { 
  Sun, 
  Calendar, 
  Award, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Sparkles, 
  Database, 
  Trash2,
  Compass
} from 'lucide-react';

interface AppLayoutProps {
  activeTab: 'today' | 'plan' | 'tests' | 'progress';
  onSelectTab: (tab: 'today' | 'plan' | 'tests' | 'progress') => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  children
}) => {
  const profile = storageService.getProfile();
  const isDemo = storageService.isDemoMode();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings states
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('neet_supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('neet_supabase_anon_key') || '');
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  const navItems = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'tests', label: 'Tests', icon: Award },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ] as const;

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('neet_supabase_url', supabaseUrl.trim());
    localStorage.setItem('neet_supabase_anon_key', supabaseAnonKey.trim());
    setSaveSettingsSuccess(true);
    setTimeout(() => {
      setSaveSettingsSuccess(false);
      window.location.reload();
    }, 1000);
  };

  const handleResetToClean = () => {
    if (window.confirm('Reset app completely to empty state? All tasks, tests, questions, and streaks will be set to 0.')) {
      storageService.clearAllData();
      window.location.reload();
    }
  };

  const handleLoadDemo = () => {
    if (window.confirm('Load demo preview dataset (Aryan · NEET 2027)?')) {
      storageService.loadDemoData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d10] text-zinc-100 flex flex-col md:flex-row">
      {/* DESKTOP COMPACT LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#121216] border-r border-white/[0.07] p-5 h-screen sticky top-0 shrink-0 z-40">
        <div className="space-y-6">
          {/* App Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#202028] border border-white/[0.08] flex items-center justify-center text-primary-light shrink-0">
              <Sparkles className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white block">NEET PREP</span>
              <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase block">
                Command Center
              </span>
            </div>
          </div>

          {/* Student Mini Widget */}
          <div className="p-3.5 rounded-2xl bg-[#1a1a20] border border-white/[0.07] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white truncate max-w-[120px]">
                {profile.name || 'Aspirant'}
              </span>
              <span className="text-[10px] text-primary-light font-bold px-2 py-0.5 rounded-full bg-[#6e3ff5]/15 border border-[#6e3ff5]/30 shrink-0">
                {profile.target_exam || 'NEET 2027'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Goal: {profile.daily_study_goal || 6}h · {profile.daily_question_goal || 200} MCQs
            </p>
            {isDemo && (
              <div className="pt-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25">
                  Demo Preview
                </span>
                <button
                  onClick={handleResetToClean}
                  className="text-[10px] text-zinc-400 hover:text-white underline"
                >
                  Clear to 0
                </button>
              </div>
            )}
          </div>

          {/* 4 PRIMARY NAVIGATION ITEMS ONLY */}
          <nav className="space-y-1.5 pt-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-[#6e3ff5] text-white shadow-btn'
                      : 'text-zinc-400 hover:text-white hover:bg-[#1a1a20]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white stroke-[2.5]' : 'text-zinc-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-white/[0.06] space-y-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-[#1a1a20] transition"
          >
            <Settings className="w-3.5 h-3.5" />
            Backend & Data
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR (Minimalist header) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#121216] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#202028] border border-white/[0.08] flex items-center justify-center text-primary-light">
            <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
          </div>
          <span className="font-black text-sm tracking-tight text-white">NEET PREP</span>
        </div>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
              Demo
            </span>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-full bg-[#1e1e24] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION (4 DESTINATIONS ONLY - Styled like reference pill navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121216]/95 backdrop-blur-md border-t border-white/[0.07] px-3 py-2 flex items-center justify-around pb-safe">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-[#6e3ff5] shadow-btn' : ''}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5] text-white' : 'stroke-2 text-zinc-400'}`} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight mt-0.5 ${isActive ? 'text-primary-light font-black' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* SETTINGS / SUPABASE CONFIG MODAL */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings & Data"
        subtitle="Manage cloud sync or reset user database"
      >
        <div className="space-y-5 text-xs">
          {/* Storage status badge */}
          <div className="p-3.5 rounded-2xl bg-[#222228] border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#8b5cf6]" />
              <div>
                <span className="font-bold text-white block">Persistence Mode</span>
                <span className="text-[11px] text-zinc-400">
                  {isSupabaseConfigured
                    ? 'Connected to Supabase PostgreSQL'
                    : isDemo
                    ? 'Demo Preview Dataset Active'
                    : 'Personal Empty State (User Created Data Only)'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-300' : isDemo ? 'bg-amber-500/20 text-amber-300' : 'bg-[#6e3ff5]/20 text-primary-light'}`}>
              {isSupabaseConfigured ? 'Supabase' : isDemo ? 'Demo Mode' : 'Clean User'}
            </span>
          </div>

          {/* Database Clear / Reset Actions */}
          <div className="space-y-2 pt-1 border-t border-white/[0.06]">
            <span className="font-bold text-zinc-400 uppercase tracking-wider block">User Data Controls</span>
            
            <button
              type="button"
              onClick={handleResetToClean}
              className="w-full py-2.5 px-3 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset All Data to Empty (0 Tasks, 0 Tests, 0%)
            </button>

            {!isDemo && (
              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full py-2 px-3 rounded-full border border-white/[0.08] bg-[#222228] hover:bg-[#2a2a32] text-zinc-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-[#8b5cf6]" />
                Load Sample Demo Preview (For UI Inspection)
              </button>
            )}
          </div>

          {/* Optional Supabase credentials form */}
          <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 pt-2 border-t border-white/[0.06]">
            <span className="font-bold text-zinc-400 uppercase tracking-wider block">Supabase Cloud Sync (Optional)</span>
            <div>
              <label className="block text-zinc-400 font-bold mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2 rounded-2xl dark-input text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-1">
                Supabase Anon Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                className="w-full px-3.5 py-2 rounded-2xl dark-input text-xs"
              />
            </div>

            {saveSettingsSuccess && (
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-center font-bold">
                ✓ Supabase settings saved! Reloading...
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-full btn-primary text-xs font-bold transition shadow-btn"
            >
              Save & Connect Supabase
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
