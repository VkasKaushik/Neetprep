import React, { useState, useMemo } from 'react';
import { storageService } from '../../services/storageService';
import { UserProfile } from '../../types';
import { Modal } from '../common/UIComponents';
import {
  ArrowLeft,
  User,
  Sparkles,
  Calendar,
  Clock,
  HelpCircle,
  Bell,
  Sliders,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Database
} from 'lucide-react';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onProfileUpdated?: () => void;
}

type EditModalType = 'name' | 'targetExam' | 'examDate' | 'studyHours' | 'mcqTarget' | 'resetConfirm' | null;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onLogout,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const isDemo = storageService.isDemoMode();

  // Active individual edit modal state
  const [activeModal, setActiveModal] = useState<EditModalType>(null);

  // Temporary edit states for focused modals
  const [editName, setEditName] = useState(profile.name || '');
  const [editTargetExam, setEditTargetExam] = useState(profile.target_exam || 'NEET 2027');
  const [editExamDate, setEditExamDate] = useState(profile.exam_date || '2027-05-02');
  const [editDailyHours, setEditDailyHours] = useState(profile.daily_study_goal || 6);
  const [editDailyQuestions, setEditDailyQuestions] = useState(profile.daily_question_goal || 200);

  // Preferences states (persisted in localStorage)
  const [dailyReminder, setDailyReminder] = useState<boolean>(() => {
    return localStorage.getItem('pref_daily_reminder') !== 'false';
  });
  const [streakAlert, setStreakAlert] = useState<boolean>(() => {
    return localStorage.getItem('pref_streak_alert') !== 'false';
  });
  const [taskAnimation, setTaskAnimation] = useState<boolean>(() => {
    return localStorage.getItem('pref_task_animation') !== 'false';
  });
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('pref_auto_sync') !== 'false';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Preference toggle handlers
  const toggleDailyReminder = () => {
    const val = !dailyReminder;
    setDailyReminder(val);
    localStorage.setItem('pref_daily_reminder', String(val));
    showToast(val ? 'Daily study reminders enabled' : 'Daily reminders paused');
  };

  const toggleStreakAlert = () => {
    const val = !streakAlert;
    setStreakAlert(val);
    localStorage.setItem('pref_streak_alert', String(val));
    showToast(val ? 'Streak protection alert on' : 'Streak protection alert off');
  };

  const toggleTaskAnimation = () => {
    const val = !taskAnimation;
    setTaskAnimation(val);
    localStorage.setItem('pref_task_animation', String(val));
    showToast(val ? 'Micro-interactions enabled' : 'Micro-interactions disabled');
  };

  const toggleAutoSync = () => {
    const val = !autoSync;
    setAutoSync(val);
    localStorage.setItem('pref_auto_sync', String(val));
    showToast(val ? 'Storage auto-sync enabled' : 'Offline caching mode');
  };

  // Days remaining calculation
  const daysRemaining = useMemo(() => {
    const targetDate = new Date(profile.exam_date || '2027-05-02');
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [profile.exam_date]);

  // Formatted exam date
  const formattedExamDate = useMemo(() => {
    if (!profile.exam_date) return 'May 2, 2027';
    try {
      const d = new Date(profile.exam_date + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return profile.exam_date;
    }
  }, [profile.exam_date]);

  // Update profile helper
  const saveProfileField = (updates: Partial<UserProfile>, successMsg: string) => {
    const updated = storageService.updateProfile(updates);
    setProfile(updated);
    setActiveModal(null);
    showToast(successMsg);
    if (onProfileUpdated) onProfileUpdated();
  };

  // Handlers for individual save actions
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    saveProfileField({ name: editName.trim() }, 'Name updated');
  };

  const handleSaveTargetExam = (selectedExam: string) => {
    let suggestedDate = editExamDate;
    if (selectedExam === 'NEET 2026') suggestedDate = '2026-05-03';
    else if (selectedExam === 'NEET 2027') suggestedDate = '2027-05-02';
    else if (selectedExam === 'NEET 2028') suggestedDate = '2028-05-07';
    
    saveProfileField(
      { target_exam: selectedExam, exam_date: suggestedDate },
      `Target set to ${selectedExam}`
    );
  };

  const handleSaveExamDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExamDate) return;
    saveProfileField({ exam_date: editExamDate }, 'Target exam date updated');
  };

  const handleSaveStudyHours = (hours: number) => {
    saveProfileField({ daily_study_goal: hours }, `Daily target set to ${hours} hours`);
  };

  const handleSaveMcqTarget = (mcqs: number) => {
    saveProfileField({ daily_question_goal: mcqs }, `Daily target set to ${mcqs} MCQs`);
  };

  // Reset Progress handler
  const handleConfirmReset = () => {
    storageService.clearAllData();
    setActiveModal(null);
    showToast('Progress reset to 0');
    if (onProfileUpdated) onProfileUpdated();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Demo data handler
  const handleToggleDemo = () => {
    if (isDemo) {
      storageService.clearAllData();
      showToast('Cleared to clean slate');
    } else {
      storageService.loadDemoData();
      showToast('Loaded sample preview data');
    }
    if (onProfileUpdated) onProfileUpdated();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const initials = (profile.name || 'Aspirant')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-2xl mx-auto">
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a20] hover:bg-[#25252c] text-zinc-300 hover:text-white text-xs font-bold border border-white/[0.08] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Profile & Settings
        </span>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#6e3ff5] text-white text-xs font-bold shadow-xl border border-white/20 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {toastMessage}
        </div>
      )}

      {/* 1. PROFILE HEADER CARD */}
      <section className="dark-card rounded-3xl p-5 sm:p-6 border border-white/[0.08] relative overflow-hidden space-y-4 shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#6e3ff5]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-[#6e3ff5] to-[#9065ff] text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg border border-white/20 shrink-0">
            {initials || 'A'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {profile.name || 'Aspirant'}
              </h1>
              <button
                onClick={() => {
                  setEditName(profile.name || '');
                  setActiveModal('name');
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
                aria-label="Edit Name"
                title="Edit Name"
              >
                <Sliders className="w-3.5 h-3.5 text-primary-light" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-light bg-[#6e3ff5]/15 border border-[#6e3ff5]/30 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                {profile.target_exam || 'NEET 2027'}
              </span>
              <span className="text-[11px] font-medium text-zinc-400">
                {daysRemaining} days remaining
              </span>
            </div>

            {profile.email && (
              <p className="text-xs text-zinc-500 truncate mt-1">
                {profile.email}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. MY PREPARATION */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#8b5cf6]">
            My Preparation
          </h2>
          <span className="text-[11px] text-zinc-500 font-medium">Tap any setting to edit</span>
        </div>

        <div className="dark-card rounded-2xl border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {/* Target Exam */}
          <button
            onClick={() => {
              setEditTargetExam(profile.target_exam || 'NEET 2027');
              setActiveModal('targetExam');
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#8b5cf6] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Target Exam</p>
                <p className="text-[11px] text-zinc-400">Target milestone & year</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary-light bg-[#6e3ff5]/15 border border-[#6e3ff5]/25 px-2.5 py-1 rounded-full">
                {profile.target_exam || 'NEET 2027'}
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition" />
            </div>
          </button>

          {/* Target Exam Date */}
          <button
            onClick={() => {
              setEditExamDate(profile.exam_date || '2027-05-02');
              setActiveModal('examDate');
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Target Exam Date</p>
                <p className="text-[11px] text-zinc-400">Powers daily countdown</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {formattedExamDate}
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition" />
            </div>
          </button>

          {/* Daily Study Target */}
          <button
            onClick={() => {
              setEditDailyHours(profile.daily_study_goal || 6);
              setActiveModal('studyHours');
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Daily Study Target</p>
                <p className="text-[11px] text-zinc-400">Used in Today & Plan gauges</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300">
                {profile.daily_study_goal || 6} hours / day
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition" />
            </div>
          </button>

          {/* Daily MCQ Target */}
          <button
            onClick={() => {
              setEditDailyQuestions(profile.daily_question_goal || 200);
              setActiveModal('mcqTarget');
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Daily MCQ Target</p>
                <p className="text-[11px] text-zinc-400">Target questions to solve daily</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">
                {profile.daily_question_goal || 200} MCQs / day
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition" />
            </div>
          </button>
        </div>
      </section>

      {/* 3. PREFERENCES */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#8b5cf6] px-1">
          Preferences
        </h2>

        <div className="dark-card rounded-2xl border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {/* Daily Study Reminder */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Daily Study Reminder</p>
                <p className="text-[11px] text-zinc-400">Morning prompt to start today's plan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDailyReminder}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                dailyReminder ? 'bg-[#6e3ff5]' : 'bg-[#25252c]'
              }`}
              aria-label="Toggle daily reminder"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  dailyReminder ? 'translate-x-5 shadow-sm' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Streak Alert */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Streak Protection</p>
                <p className="text-[11px] text-zinc-400">Alert before midnight if goals are pending</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleStreakAlert}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                streakAlert ? 'bg-[#6e3ff5]' : 'bg-[#25252c]'
              }`}
              aria-label="Toggle streak alert"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  streakAlert ? 'translate-x-5 shadow-sm' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* App Preferences: Micro-interaction */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Task Micro-interactions</p>
                <p className="text-[11px] text-zinc-400">Smooth animation & confirmation on completion</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTaskAnimation}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                taskAnimation ? 'bg-[#6e3ff5]' : 'bg-[#25252c]'
              }`}
              aria-label="Toggle micro-interactions"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  taskAnimation ? 'translate-x-5 shadow-sm' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* App Preferences: Offline Cache */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Offline Cache & Instant Sync</p>
                <p className="text-[11px] text-zinc-400">Keep data responsive in local storage</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleAutoSync}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                autoSync ? 'bg-[#6e3ff5]' : 'bg-[#25252c]'
              }`}
              aria-label="Toggle offline sync"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoSync ? 'translate-x-5 shadow-sm' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 4. DATA & ACCOUNT */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#8b5cf6] px-1">
          Data & Account
        </h2>

        <div className="dark-card rounded-2xl border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {/* Sample Preview Dataset */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {isDemo ? 'Demo Mode Active' : 'Sample Preview Dataset'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {isDemo ? 'You are viewing sample student data' : 'Explore with sample NEET data'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleDemo}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#202028] hover:bg-[#282832] text-zinc-300 hover:text-white border border-white/[0.08] transition"
            >
              {isDemo ? 'Clear to Clean' : 'Load Preview'}
            </button>
          </div>

          {/* Reset Progress (Separated & Danger Zone) */}
          <button
            onClick={() => setActiveModal('resetConfirm')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-rose-500/[0.06] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-400">Reset Progress</p>
                <p className="text-[11px] text-zinc-400">Clear completed tasks, tests & hours to 0</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition" />
          </button>

          {/* Log Out */}
          <button
            onClick={onLogout}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-400 shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200">Log Out</p>
                <p className="text-[11px] text-zinc-400">Sign out of your NEETUp account</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* INDIVIDUAL FOCUSED BOTTOM SHEETS / DIALOGS */}
      {/* ========================================================= */}

      {/* 1. EDIT NAME MODAL */}
      <Modal
        isOpen={activeModal === 'name'}
        onClose={() => setActiveModal(null)}
        title="Edit Your Name"
        subtitle="How should NEETUp greet you on your dashboard?"
      >
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary-light" />
              Your Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="e.g. Aryan Sharma"
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs text-white"
              autoFocus
              required
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="flex-1 py-2.5 rounded-full bg-[#202028] hover:bg-[#282832] text-xs font-bold text-zinc-300 border border-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full btn-primary text-xs font-bold transition shadow-btn"
            >
              Save Name
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. EDIT TARGET EXAM MODAL */}
      <Modal
        isOpen={activeModal === 'targetExam'}
        onClose={() => setActiveModal(null)}
        title="Target Exam"
        subtitle="Select your target NEET milestone year"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: 'NEET 2026', sub: 'Target date: May 3, 2026' },
              { label: 'NEET 2027', sub: 'Target date: May 2, 2027' },
              { label: 'NEET 2028', sub: 'Target date: May 7, 2028' },
              { label: 'NEET Dropper', sub: 'Flexible revision target' }
            ].map(item => {
              const isSelected = editTargetExam === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setEditTargetExam(item.label);
                    handleSaveTargetExam(item.label);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'border-[#6e3ff5] bg-[#6e3ff5]/15 text-white'
                      : 'border-white/[0.08] bg-[#202028] hover:border-white/[0.16] text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{item.sub}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#6e3ff5] flex items-center justify-center text-white shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="w-full py-2.5 rounded-full bg-[#202028] hover:bg-[#282832] text-xs font-bold text-zinc-400 border border-white/[0.08] transition"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* 3. EDIT EXAM DATE MODAL */}
      <Modal
        isOpen={activeModal === 'examDate'}
        onClose={() => setActiveModal(null)}
        title="Target Exam Date"
        subtitle="Set the exact date for the countdown on your Home dashboard"
      >
        <form onSubmit={handleSaveExamDate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-light" />
              Exam Date
            </label>
            <input
              type="date"
              value={editExamDate}
              onChange={e => setEditExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs text-white"
              required
            />
          </div>

          <div className="p-3 rounded-2xl bg-[#202028] border border-white/[0.06] text-[11px] text-zinc-400">
            NEET is typically conducted on the first Sunday of May every year.
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="flex-1 py-2.5 rounded-full bg-[#202028] hover:bg-[#282832] text-xs font-bold text-zinc-300 border border-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full btn-primary text-xs font-bold transition shadow-btn"
            >
              Update Date
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. EDIT DAILY STUDY TARGET MODAL */}
      <Modal
        isOpen={activeModal === 'studyHours'}
        onClose={() => setActiveModal(null)}
        title="Daily Study Target"
        subtitle="How many hours do you plan to study each day?"
      >
        <div className="space-y-5">
          <div className="text-center py-2">
            <span className="text-4xl font-black text-primary-light tracking-tight">
              {editDailyHours}
            </span>
            <span className="text-sm font-bold text-zinc-400 ml-1.5">hours / day</span>
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-5 gap-1.5">
            {[4, 6, 8, 10, 12].map(hrs => (
              <button
                key={hrs}
                type="button"
                onClick={() => setEditDailyHours(hrs)}
                className={`py-2 rounded-xl border text-xs font-bold transition text-center ${
                  editDailyHours === hrs
                    ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                    : 'border-white/[0.08] bg-[#202028] text-zinc-300 hover:border-white/20'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="space-y-1.5">
            <input
              type="range"
              min="2"
              max="14"
              step="1"
              value={editDailyHours}
              onChange={e => setEditDailyHours(Number(e.target.value))}
              className="w-full accent-[#6e3ff5] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
              <span>Light (2h)</span>
              <span>Recommended (6h - 8h)</span>
              <span>Intense (14h)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="flex-1 py-2.5 rounded-full bg-[#202028] hover:bg-[#282832] text-xs font-bold text-zinc-300 border border-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveStudyHours(editDailyHours)}
              className="flex-1 py-2.5 rounded-full btn-primary text-xs font-bold transition shadow-btn"
            >
              Set Target
            </button>
          </div>
        </div>
      </Modal>

      {/* 5. EDIT DAILY MCQ TARGET MODAL */}
      <Modal
        isOpen={activeModal === 'mcqTarget'}
        onClose={() => setActiveModal(null)}
        title="Daily MCQ Target"
        subtitle="How many questions do you aim to practice daily?"
      >
        <div className="space-y-5">
          <div className="text-center py-2">
            <span className="text-4xl font-black text-emerald-400 tracking-tight">
              {editDailyQuestions}
            </span>
            <span className="text-sm font-bold text-zinc-400 ml-1.5">MCQs / day</span>
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-5 gap-1.5">
            {[100, 150, 200, 250, 300].map(mcqs => (
              <button
                key={mcqs}
                type="button"
                onClick={() => setEditDailyQuestions(mcqs)}
                className={`py-2 rounded-xl border text-xs font-bold transition text-center ${
                  editDailyQuestions === mcqs
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-btn'
                    : 'border-white/[0.08] bg-[#202028] text-zinc-300 hover:border-white/20'
                }`}
              >
                {mcqs}
              </button>
            ))}
          </div>

          {/* Number input for custom count */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">
              Custom Question Target
            </label>
            <input
              type="number"
              min="20"
              max="600"
              step="10"
              value={editDailyQuestions}
              onChange={e => setEditDailyQuestions(Math.max(10, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="flex-1 py-2.5 rounded-full bg-[#202028] hover:bg-[#282832] text-xs font-bold text-zinc-300 border border-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveMcqTarget(editDailyQuestions)}
              className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-btn"
            >
              Set Target
            </button>
          </div>
        </div>
      </Modal>

      {/* 6. RESET PROGRESS CONFIRMATION MODAL (Strictly Isolated Danger Zone) */}
      <Modal
        isOpen={activeModal === 'resetConfirm'}
        onClose={() => setActiveModal(null)}
        title="Reset Study Progress?"
        subtitle="This action will reset your study records to a clean slate"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Please read carefully</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-300">
              <li>All completed tasks will be reset to 0.</li>
              <li>Logged study hours and MCQ records will be cleared.</li>
              <li>Mock test logs and scores will be removed.</li>
              <li>Your profile name, target exam, and daily targets will remain intact.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="flex-1 py-2.5 rounded-full bg-[#202028] hover:bg-[#282832] text-xs font-bold text-zinc-300 border border-white/[0.08] transition"
            >
              Keep My Data
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-btn flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Yes, Reset to 0
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
