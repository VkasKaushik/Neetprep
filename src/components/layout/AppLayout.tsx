import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { Modal } from '../common/UIComponents';
import { 
  Sun, 
  Calendar, 
  Award, 
  TrendingUp, 
  Sliders, 
  LogOut, 
  Sparkles, 
  Trash2,
  Compass,
  CheckCircle2,
  Clock,
  HelpCircle,
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
  const profile = storageService.getProfile();
  const isDemo = storageService.isDemoMode();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Student Study Goals & Profile states
  const [studentName, setStudentName] = useState(profile.name || '');
  const [targetExam, setTargetExam] = useState(profile.target_exam || 'NEET 2027');
  const [examDate, setExamDate] = useState(profile.exam_date || '2027-05-02');
  const [dailyHours, setDailyHours] = useState(profile.daily_study_goal || 6);
  const [dailyQuestions, setDailyQuestions] = useState(profile.daily_question_goal || 200);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setStudentName(profile.name || '');
    setTargetExam(profile.target_exam || 'NEET 2027');
    setExamDate(profile.exam_date || '2027-05-02');
    setDailyHours(profile.daily_study_goal || 6);
    setDailyQuestions(profile.daily_question_goal || 200);
  }, [isSettingsOpen]);

  const navItems = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'tests', label: 'Tests', icon: Award },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ] as const;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateProfile({
      name: studentName.trim() || 'Aspirant',
      target_exam: targetExam,
      exam_date: examDate,
      daily_study_goal: Number(dailyHours),
      daily_question_goal: Number(dailyQuestions),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSettingsOpen(false);
      window.location.reload();
    }, 800);
  };

  const handleResetToClean = () => {
    if (window.confirm('Are you sure you want to reset all your study records to 0? This will clear tasks, tests, and question logs.')) {
      storageService.clearAllData();
      window.location.reload();
    }
  };

  const handleLoadDemo = () => {
    if (window.confirm('Load sample preview dataset (Aryan · NEET 2027)?')) {
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
            <Sliders className="w-3.5 h-3.5 text-[#8b5cf6]" />
            Study Goals & Profile
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
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-full bg-[#1e1e24] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition"
            aria-label="Study Goals & Profile"
          >
            <Sliders className="w-4 h-4 text-primary-light" />
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

      {/* STUDENT STUDY GOALS & PROFILE MODAL */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Study Goals & Profile"
        subtitle="Personalize your NEET milestone and daily study targets"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block text-zinc-400 font-bold mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary-light" />
              Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="e.g. Aryan"
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs text-white"
              required
            />
          </div>

          {/* Target Exam */}
          <div>
            <label className="block text-zinc-400 font-bold mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-light" />
              Target Exam Milestone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['NEET 2026', 'NEET 2027', 'NEET 2028', 'NEET Dropper'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTargetExam(opt)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                    targetExam === opt
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#202028] text-zinc-300 hover:border-white/[0.16]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Date */}
          <div>
            <label className="block text-zinc-400 font-bold mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-light" />
              Target Exam Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs text-white"
            />
          </div>

          {/* Daily Study Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary-light" />
                Daily Study Target
              </label>
              <span className="font-black text-primary-light text-sm">{dailyHours} hrs</span>
            </div>
            <input
              type="range"
              min="2"
              max="14"
              step="1"
              value={dailyHours}
              onChange={e => setDailyHours(Number(e.target.value))}
              className="w-full accent-[#6e3ff5] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-medium mt-0.5">
              <span>Light (2h)</span>
              <span>Recommended (6h)</span>
              <span>Intense (12h+)</span>
            </div>
          </div>

          {/* Daily MCQs Target */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-400 font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                Daily MCQs Target
              </label>
              <span className="font-black text-emerald-400 text-sm">{dailyQuestions} questions</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[100, 150, 200, 250, 300].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDailyQuestions(q)}
                  className={`py-1.5 rounded-xl border text-[11px] font-bold transition text-center ${
                    dailyQuestions === q
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#202028] text-zinc-300'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {saveSuccess && (
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-center font-bold text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Study goals updated!
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-full btn-primary text-xs font-bold transition shadow-btn"
          >
            Save Changes
          </button>

          {/* Reset Study Records */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <span className="font-bold text-zinc-500 uppercase tracking-wider block text-[10px]">
              Reset Progress
            </span>
            <button
              type="button"
              onClick={handleResetToClean}
              className="w-full py-2 px-3 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset My Study Records to 0
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
