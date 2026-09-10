import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { ProfileScreen } from '../profile/ProfileScreen';
import { 
  Sun, 
  Calendar, 
  Award, 
  TrendingUp, 
  LogOut, 
  User
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
  const [profile, setProfile] = useState(() => storageService.getProfile());
  const isDemo = storageService.isDemoMode();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'tests', label: 'Tests', icon: Award },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ] as const;

  const handleTabClick = (tab: 'today' | 'plan' | 'tests' | 'progress') => {
    setIsProfileOpen(false);
    onSelectTab(tab);
  };

  const handleResetToClean = () => {
    if (window.confirm('Are you sure you want to reset all your study records to 0? This will clear tasks, tests, and question logs.')) {
      storageService.clearAllData();
      setProfile(storageService.getProfile());
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
            <img 
              src="/favicon.png" 
              alt="NEET PREP" 
              className="w-10 h-10 rounded-2xl object-cover border border-white/[0.08] shadow-sm shrink-0" 
            />
            <div>
              <span className="font-black text-base tracking-tight text-white block">NEET PREP</span>
              <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase block">
                Command Center
              </span>
            </div>
          </div>

          {/* Student Mini Widget (Clickable -> Opens Profile & Settings) */}
          <div
            onClick={() => setIsProfileOpen(true)}
            className="p-3.5 rounded-2xl bg-[#1a1a20] border border-white/[0.07] hover:border-white/[0.16] space-y-1 cursor-pointer transition group"
            title="Open Profile & Settings"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white truncate max-w-[120px] group-hover:text-primary-light transition">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetToClean();
                  }}
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
              const isActive = !isProfileOpen && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
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
            onClick={() => setIsProfileOpen(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-semibold transition ${
              isProfileOpen
                ? 'bg-[#6e3ff5]/20 text-white border border-[#6e3ff5]/30'
                : 'text-zinc-400 hover:text-white hover:bg-[#1a1a20]'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#8b5cf6]" />
            Profile & Settings
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
          <img 
            src="/favicon.png" 
            alt="NEET PREP" 
            className="w-8 h-8 rounded-xl object-cover border border-white/[0.08] shrink-0" 
          />
          <span className="font-black text-sm tracking-tight text-white">NEET PREP</span>
        </div>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
              Demo
            </span>
          )}
          <button
            onClick={() => setIsProfileOpen(prev => !prev)}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
              isProfileOpen
                ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-btn'
                : 'bg-[#1e1e24] border-white/[0.08] text-zinc-300 hover:text-white'
            }`}
            aria-label="Profile & Settings"
            title="Profile & Settings"
          >
            <User className="w-4 h-4 text-primary-light" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {isProfileOpen ? (
          <ProfileScreen
            onBack={() => setIsProfileOpen(false)}
            onLogout={onLogout}
            onProfileUpdated={() => setProfile(storageService.getProfile())}
          />
        ) : (
          React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                onOpenProfile: () => setIsProfileOpen(true)
              });
            }
            return child;
          })
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION (4 DESTINATIONS ONLY - Styled like reference pill navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121216]/95 backdrop-blur-md border-t border-white/[0.07] px-3 py-2 flex items-center justify-around pb-safe">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = !isProfileOpen && activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
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
    </div>
  );
};
