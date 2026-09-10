import React, { useState, useMemo } from 'react';
import { Chapter, SubjectType, Reflection, AppInsight, WeakTopic, RevisionCycle, PriorityLevel } from '../../types';
import { storageService } from '../../services/storageService';
import { SubjectBadge, ProgressBar, Modal, PriorityBadge } from '../common/UIComponents';
import { 
  TrendingUp, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  MessageSquare,
  Flame,
  BarChart3,
  BookOpen,
  AlertTriangle,
  Plus
} from 'lucide-react';

export const ProgressScreen: React.FC = () => {
  const profile = storageService.getProfile();
  const chaptersMap = useMemo(() => storageService.getChapters(), []);
  const insights = useMemo(() => storageService.generateInsights(), []);

  const [selectedSubject, setSelectedSubject] = useState<SubjectType | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'study' | 'questions' | 'scores' | 'prep'>('study');
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState<boolean>(false);
  const [reflectionType, setReflectionType] = useState<'weekly' | 'monthly'>('weekly');

  const [refQ1, setRefQ1] = useState('');
  const [refQ2, setRefQ2] = useState('');
  const [refQ3, setRefQ3] = useState('');
  const [refQ4, setRefQ4] = useState('');
  const [refQ5, setRefQ5] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Weak Topics & Spaced Revision (Moved from Tests tab)
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => storageService.getWeakTopics());
  const [revisions, setRevisions] = useState<RevisionCycle[]>(() => storageService.getRevisions());
  const [isAddWeakTopicOpen, setIsAddWeakTopicOpen] = useState(false);
  const [newWeakSubject, setNewWeakSubject] = useState<SubjectType>('Physics');
  const [newWeakTopicName, setNewWeakTopicName] = useState('');
  const [newWeakChapterName, setNewWeakChapterName] = useState('');
  const [newWeakPriority, setNewWeakPriority] = useState<PriorityLevel>('High');
  const [progressToast, setProgressToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setProgressToast(msg);
    setTimeout(() => setProgressToast(null), 3000);
  };

  const overallPrep = storageService.calculateOverallPreparation();
  const totalStudyMinutes = storageService.getTotalStudyMinutes();
  const totalStudyHours = Math.round(totalStudyMinutes / 60);
  const questionStats = storageService.getTotalQuestionsSolved();
  const streakInfo = storageService.calculateStreak();

  const phyProgress = storageService.calculateSubjectProgress('Physics');
  const chemProgress = storageService.calculateSubjectProgress('Chemistry');
  const bioProgress = storageService.calculateSubjectProgress('Biology');

  const allTasks = storageService.getTasks();
  const allTests = storageService.getTests();
  const completedTasksCount = allTasks.filter(t => t.completed).length;
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const studyHoursTrend = useMemo(() => {
    return [
      { label: 'W1', value: Math.min(totalStudyHours, Math.round(totalStudyHours * 0.2)) },
      { label: 'W2', value: Math.min(totalStudyHours, Math.round(totalStudyHours * 0.4)) },
      { label: 'W3', value: Math.min(totalStudyHours, Math.round(totalStudyHours * 0.7)) },
      { label: 'W4', value: totalStudyHours },
    ];
  }, [totalStudyHours]);

  const questionsTrend = useMemo(() => {
    const totalQ = questionStats.total;
    return [
      { label: 'W1', value: Math.round(totalQ * 0.2) },
      { label: 'W2', value: Math.round(totalQ * 0.45) },
      { label: 'W3', value: Math.round(totalQ * 0.75) },
      { label: 'W4', value: totalQ },
    ];
  }, [questionStats.total]);

  const testScoresTrend = useMemo(() => {
    if (allTests.length === 0) {
      return [
        { label: 'Test 1', value: 0 },
        { label: 'Test 2', value: 0 },
        { label: 'Test 3', value: 0 },
        { label: 'Test 4', value: 0 },
      ];
    }
    return allTests.slice(0, 4).reverse().map((t, idx) => ({
      label: `Test ${idx + 1}`,
      value: t.physics_score + t.chemistry_score + t.biology_score
    }));
  }, [allTests]);

  const prepTrend = useMemo(() => {
    return [
      { label: 'W1', value: Math.round(overallPrep * 0.3) },
      { label: 'W2', value: Math.round(overallPrep * 0.6) },
      { label: 'W3', value: Math.round(overallPrep * 0.85) },
      { label: 'Now', value: overallPrep },
    ];
  }, [overallPrep]);

  // Weekly Overview Data (Moved from Plan tab)
  const currentWeekDays = useMemo(() => {
    const curr = new Date();
    const firstDay = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return days.map((dayName, index) => {
      const d = new Date(curr);
      d.setDate(firstDay + index);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = allTasks.filter(t => t.date === dateStr);
      const dayCompleted = dayTasks.filter(t => t.completed).length;
      const percent = dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0;
      return {
        day: dayName,
        dateStr,
        percent,
        tasksCount: dayTasks.length,
        completedCount: dayCompleted
      };
    });
  }, [allTasks]);

  const totalWeeklyTasks = currentWeekDays.reduce((acc, d) => acc + d.tasksCount, 0);
  const totalWeeklyCompleted = currentWeekDays.reduce((acc, d) => acc + d.completedCount, 0);
  const weeklyProgressPercent = totalWeeklyTasks > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyTasks) * 100) : 0;

  const weeklyStudyHours = Math.round(
    allTasks
      .filter(t => t.completed)
      .reduce((acc, t) => acc + (t.duration || 0), 0) / 60
  );

  const weeklyQuestionsSolved = questionStats.total;
  const weeklyStudyTargetHours = (profile.daily_study_goal || 6) * 7;
  const weeklyQuestionTarget = (profile.daily_question_goal || 200) * 7;

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveReflection({
      type: reflectionType,
      period: reflectionType === 'weekly' ? 'Week 37, Sep 2026' : currentMonthName,
      content: {
        q1: refQ1,
        q2: refQ2,
        q3: refQ3,
        q4: refQ4,
        q5: refQ5 || undefined
      }
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsReflectionModalOpen(false);
    }, 1200);
  };

  const handleCreateRevisionTask = (topicId: string, topicName: string) => {
    const task = storageService.createRevisionTaskFromWeakTopic(topicId);
    if (task) {
      setWeakTopics(storageService.getWeakTopics());
      showToast(`Added revision task for "${topicName}" to Today's Plan!`);
    }
  };

  const handleSaveWeakTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeakTopicName.trim()) return;

    const todayDate = new Date();
    const nextDate = new Date(todayDate);
    nextDate.setDate(todayDate.getDate() + 3);

    storageService.addWeakTopic({
      subject_name: newWeakSubject,
      chapter_name: newWeakChapterName || newWeakSubject,
      topic_name: newWeakTopicName.trim(),
      priority: newWeakPriority,
      status: 'Needs Revision',
      last_studied: todayDate.toISOString().split('T')[0],
      next_revision: nextDate.toISOString().split('T')[0]
    });

    setWeakTopics(storageService.getWeakTopics());
    setNewWeakTopicName('');
    setNewWeakChapterName('');
    setIsAddWeakTopicOpen(false);
    showToast('Weak topic scheduled for revision.');
  };

  const handleToggleRevision = (
    revId: string,
    step: 'initial' | 'rev1' | 'rev2' | 'rev3' | 'rev4'
  ) => {
    storageService.toggleRevisionStep(revId, step);
    setRevisions(storageService.getRevisions());
  };

  return (
    <div className="space-y-6 pb-28 md:pb-10 max-w-2xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Your Progress</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Preparation velocity, syllabus coverage, and growth trends</p>
        </div>

        <button
          onClick={() => setIsReflectionModalOpen(true)}
          className="px-4 py-2 rounded-full bg-[#202025] hover:bg-[#282830] text-xs font-bold text-primary-light border border-white/[0.08] transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#8b5cf6]" />
          Reflection Journal
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="dark-card rounded-2xl p-4 border border-white/[0.07]">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Syllabus
          </span>
          <span className="text-2xl font-black text-primary-light tracking-tight">{overallPrep}%</span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">Syllabus coverage</span>
        </div>

        <div className="dark-card rounded-2xl p-4 border border-white/[0.07]">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Study Time
          </span>
          <span className="text-2xl font-black text-white tracking-tight">{totalStudyHours}h</span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">Completed tasks</span>
        </div>

        <div className="dark-card rounded-2xl p-4 border border-white/[0.07]">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Questions
          </span>
          <span className="text-2xl font-black text-emerald-400 tracking-tight">{questionStats.total}</span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">MCQs solved</span>
        </div>

        <div className="dark-card rounded-2xl p-4 border border-white/[0.07]">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Accuracy
          </span>
          <span className="text-2xl font-black text-amber-400 tracking-tight">
            {questionStats.total > 0 ? `${questionStats.accuracy}%` : '0%'}
          </span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">Practice average</span>
        </div>
      </div>

      {/* 3. SUBJECT PROGRESS WITH DRILLDOWN */}
      <div className="dark-card rounded-3xl p-5 border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-bold text-white">
            Subject Progress
          </h2>
          <span className="text-xs text-zinc-400">Tap to inspect chapters</span>
        </div>

        <div className="space-y-2.5">
          {/* Physics */}
          <div
            onClick={() => setSelectedSubject(selectedSubject === 'Physics' ? null : 'Physics')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedSubject === 'Physics'
                ? 'border-[#38bdf8]/50 bg-[#0369a1]/15'
                : 'border-white/[0.06] bg-[#222228] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
                <span className="text-sm font-bold text-white">Physics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#7dd3fc]">{phyProgress}%</span>
                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${selectedSubject === 'Physics' ? 'rotate-90' : ''}`} />
              </div>
            </div>
            <ProgressBar percentage={phyProgress} colorClass="bg-[#38bdf8]" height="h-1.5" />
          </div>

          {/* Chemistry */}
          <div
            onClick={() => setSelectedSubject(selectedSubject === 'Chemistry' ? null : 'Chemistry')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedSubject === 'Chemistry'
                ? 'border-[#c084fc]/50 bg-[#6d28d9]/15'
                : 'border-white/[0.06] bg-[#222228] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c084fc]"></span>
                <span className="text-sm font-bold text-white">Chemistry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#e9d5ff]">{chemProgress}%</span>
                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${selectedSubject === 'Chemistry' ? 'rotate-90' : ''}`} />
              </div>
            </div>
            <ProgressBar percentage={chemProgress} colorClass="bg-[#c084fc]" height="h-1.5" />
          </div>

          {/* Biology */}
          <div
            onClick={() => setSelectedSubject(selectedSubject === 'Biology' ? null : 'Biology')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedSubject === 'Biology'
                ? 'border-[#34d399]/50 bg-[#047857]/15'
                : 'border-white/[0.06] bg-[#222228] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34d399]"></span>
                <span className="text-sm font-bold text-white">Biology</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#6ee7b7]">{bioProgress}%</span>
                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${selectedSubject === 'Biology' ? 'rotate-90' : ''}`} />
              </div>
            </div>
            <ProgressBar percentage={bioProgress} colorClass="bg-[#34d399]" height="h-1.5" />
          </div>
        </div>

        {/* Chapters drilldown */}
        {selectedSubject && (
          <div className="pt-2 space-y-2 border-t border-white/[0.06] animate-fade-in">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs uppercase font-bold text-white">
                {selectedSubject} Chapters
              </span>
              <span className="text-[11px] text-zinc-400">Tap for details</span>
            </div>

            <div className="space-y-2">
              {chaptersMap[selectedSubject].map(ch => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChapter(ch)}
                  className="p-3.5 rounded-2xl bg-[#222228] hover:bg-[#282830] border border-white/[0.06] cursor-pointer flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{ch.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>{ch.completed_topics} / {ch.total_topics} topics</span>
                      <span>·</span>
                      <span>{ch.questions_solved} MCQs</span>
                      <span>·</span>
                      <span className="text-emerald-400">{ch.accuracy}% acc</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-white">{ch.progress}%</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. WEEKLY OVERVIEW (Moved from Plan tab: performance & completion) */}
      <div className="dark-card rounded-3xl p-5 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#8b5cf6]" />
            <h2 className="text-xs uppercase tracking-wider font-bold text-white">
              Weekly Overview
            </h2>
          </div>
          <span className="text-xs font-black text-primary-light">
            Progress: {weeklyProgressPercent}%
          </span>
        </div>

        {/* Daily Bars */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {currentWeekDays.map(d => (
            <div key={d.day} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 font-bold">{d.day}</span>
              <div className="w-full bg-[#18181e] rounded-full h-16 relative flex flex-col justify-end p-0.5 border border-white/[0.04]">
                <div
                  className="w-full bg-[#6e3ff5] rounded-full transition-all duration-500"
                  style={{ height: `${Math.max(4, d.percent)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-zinc-300">{d.percent}%</span>
            </div>
          ))}
        </div>

        {/* Weekly Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center">
          <div className="p-2.5 rounded-2xl bg-[#25252c]">
            <span className="text-[10px] text-zinc-400 block">Tasks</span>
            <span className="text-sm font-black text-white">
              {totalWeeklyCompleted} / {totalWeeklyTasks}
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#25252c]">
            <span className="text-[10px] text-zinc-400 block">Study</span>
            <span className="text-sm font-black text-primary-light">
              {weeklyStudyHours}h / {weeklyStudyTargetHours}h
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#25252c]">
            <span className="text-[10px] text-zinc-400 block">Questions</span>
            <span className="text-sm font-black text-emerald-400">
              {weeklyQuestionsSolved} / {weeklyQuestionTarget}
            </span>
          </div>
        </div>
      </div>

      {/* 5. WEAK TOPICS FOCUS (Moved from Tests tab) */}
      <div className="dark-card rounded-3xl p-5 border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs uppercase tracking-wider font-bold text-white">
              Weak Topics Focus
            </h2>
          </div>
          <button
            onClick={() => setIsAddWeakTopicOpen(true)}
            className="text-xs text-primary-light hover:underline font-bold"
          >
            + Add Weak Topic
          </button>
        </div>

        {weakTopics.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#222228] text-center border border-white/[0.06]">
            <p className="text-xs text-zinc-400">
              No weak topics added yet. Add difficult topics to schedule targeted revision.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {weakTopics.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#222228] border border-white/[0.07] space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <SubjectBadge subject={item.subject_name} size="sm" />
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{item.topic_name}</h3>
                  <p className="text-xs text-zinc-400 truncate">{item.chapter_name}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRevisionTask(item.id, item.topic_name)}
                  className="w-full py-1.5 px-3 rounded-full bg-[#2c2c36] hover:bg-[#6e3ff5] text-zinc-200 hover:text-white text-xs font-semibold transition border border-white/[0.08] flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
                  Revise Today
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. SPACED REVISION TRACKER (Moved from Tests tab) */}
      <div className="dark-card rounded-3xl p-5 border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs uppercase tracking-wider font-bold text-white">
              Spaced Revision Tracker
            </h2>
          </div>
          <span className="text-xs text-zinc-400">4-Stage Retention</span>
        </div>

        {revisions.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#222228] text-center border border-white/[0.06]">
            <p className="text-xs text-zinc-400">
              No active revision cycles yet. Topics scheduled from weak areas or tasks will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {revisions.map(rev => (
              <div key={rev.id} className="p-3.5 rounded-2xl bg-[#222228] border border-white/[0.07] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <SubjectBadge subject={rev.subject_name} size="sm" />
                      <span className="text-sm font-bold text-white tracking-tight">{rev.topic_name}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{rev.chapter_name}</span>
                  </div>
                  <div className="text-xs text-primary-light font-bold">
                    Next: {rev.next_revision || 'Upcoming'}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
                  {[
                    { key: 'initial', label: 'Initial', done: rev.initial_studied },
                    { key: 'rev1', label: 'Rev 1', done: rev.rev1_completed },
                    { key: 'rev2', label: 'Rev 2', done: rev.rev2_completed },
                    { key: 'rev3', label: 'Rev 3', done: rev.rev3_completed },
                    { key: 'rev4', label: 'Rev 4', done: rev.rev4_completed },
                  ].map(step => (
                    <button
                      key={step.key}
                      onClick={() => handleToggleRevision(rev.id, step.key as any)}
                      className={`p-1.5 rounded-full border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        step.done
                          ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                          : 'border-white/[0.08] bg-[#1a1a20] text-zinc-400'
                      }`}
                    >
                      {step.done && <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />}
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. GROWTH VELOCITY CHARTS */}
      <div className="dark-card rounded-3xl p-5 border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#8b5cf6]" />
            <h2 className="text-xs uppercase tracking-wider font-bold text-white">
              Growth Velocity
            </h2>
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'study', label: 'Study Hours' },
              { id: 'questions', label: 'Questions' },
              { id: 'scores', label: 'Mock Scores' },
              { id: 'prep', label: 'Preparation' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChartTab(tab.id as any)}
                className={`py-1.5 px-3 rounded-full text-xs font-bold border transition ${
                  activeChartTab === tab.id
                    ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                    : 'border-white/[0.08] bg-[#222228] text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Chart Bars */}
        <div className="h-44 w-full pt-4 flex items-end justify-between gap-4 px-3 border-b border-white/[0.06] pb-2">
          {activeChartTab === 'study' &&
            studyHoursTrend.map(item => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-black text-primary-light">{item.value}h</span>
                <div
                  className="w-full max-w-[42px] bg-[#6e3ff5] rounded-t-xl transition-all duration-500 min-h-[4px]"
                  style={{ height: `${Math.max(4, (item.value / 50) * 100)}%` }}
                />
                <span className="text-[11px] text-zinc-400 font-bold">{item.label}</span>
              </div>
            ))}

          {activeChartTab === 'questions' &&
            questionsTrend.map(item => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-black text-emerald-400">{item.value}</span>
                <div
                  className="w-full max-w-[42px] bg-emerald-500 rounded-t-xl transition-all duration-500 min-h-[4px]"
                  style={{ height: `${Math.max(4, (item.value / 1500) * 100)}%` }}
                />
                <span className="text-[11px] text-zinc-400 font-bold">{item.label}</span>
              </div>
            ))}

          {activeChartTab === 'scores' &&
            testScoresTrend.map(item => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-black text-[#c084fc]">
                  {item.value > 0 ? item.value : '--'}
                </span>
                <div
                  className="w-full max-w-[42px] bg-[#a855f7] rounded-t-xl transition-all duration-500 min-h-[4px]"
                  style={{ height: `${Math.max(4, (item.value / 720) * 100)}%` }}
                />
                <span className="text-[11px] text-zinc-400 font-bold">{item.label}</span>
              </div>
            ))}

          {activeChartTab === 'prep' &&
            prepTrend.map(item => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-black text-primary-light">{item.value}%</span>
                <div
                  className="w-full max-w-[42px] bg-[#6e3ff5] rounded-t-xl transition-all duration-500 min-h-[4px]"
                  style={{ height: `${Math.max(4, item.value)}%` }}
                />
                <span className="text-[11px] text-zinc-400 font-bold">{item.label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 5. CONSISTENCY CARD */}
      <div className="dark-card rounded-3xl p-5 border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
            Study Consistency
          </span>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {streakInfo.currentStreak > 0 ? `${streakInfo.currentStreak} Days Active` : 'No streak active'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-[#25252c]">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Current Streak</span>
            <span className="text-lg font-black text-white">{streakInfo.currentStreak} days</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#25252c]">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Longest Streak</span>
            <span className="text-lg font-black text-zinc-300">{streakInfo.longestStreak} days</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#25252c]">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Weekly Rate</span>
            <span className="text-lg font-black text-emerald-400">
              {streakInfo.currentStreak > 0 ? '80%' : '0%'}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-300 text-center font-semibold pt-1">
          "You're building consistency."
        </p>
      </div>

      {/* 6. MONTHLY PROGRESS */}
      <div className="dark-card rounded-3xl p-5 border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {currentMonthName} Summary
          </span>
          <span className="text-xs font-bold text-primary-light bg-[#6e3ff5]/15 px-2.5 py-0.5 rounded-full border border-[#6e3ff5]/30">
            {completedTasksCount > 0 ? `${completedTasksCount} tasks completed` : 'Month in progress'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-2xl bg-[#25252c]">
            <span className="text-zinc-400 block text-[10px]">Overall Prep</span>
            <span className="font-black text-primary-light text-sm">{overallPrep}%</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#25252c]">
            <span className="text-zinc-400 block text-[10px]">Tasks</span>
            <span className="font-black text-white text-sm">{completedTasksCount} / {allTasks.length}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#25252c]">
            <span className="text-zinc-400 block text-[10px]">Study</span>
            <span className="font-black text-white text-sm">{totalStudyHours}h</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#25252c]">
            <span className="text-zinc-400 block text-[10px]">Questions</span>
            <span className="font-black text-emerald-400 text-sm">{questionStats.total}</span>
          </div>
        </div>
      </div>

      {/* 7. AUTOMATIC ACTIONABLE INSIGHTS */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
          <h2 className="text-xs uppercase tracking-wider font-bold text-white">
            Actionable Insights
          </h2>
        </div>

        <div className="space-y-2">
          {insights.map(ins => (
            <div
              key={ins.id}
              className="p-4 rounded-2xl dark-card border border-white/[0.07] flex items-start gap-3"
            >
              <div
                className={`mt-0.5 p-1 rounded-full ${
                  ins.type === 'positive'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : ins.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-[#6e3ff5]/20 text-[#8b5cf6]'
                }`}
              >
                {ins.type === 'positive' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">{ins.message}</p>
                {ins.actionable && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">{ins.actionable}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAPTER DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedChapter)}
        onClose={() => setSelectedChapter(null)}
        title={selectedChapter?.name || 'Chapter Details'}
        subtitle="Syllabus topic breakdown & revision status"
      >
        {selectedChapter && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#222228] flex items-center justify-between border border-white/[0.08]">
              <div>
                <span className="text-xs text-zinc-400 block font-semibold">Chapter Completion</span>
                <span className="text-2xl font-black text-primary-light">{selectedChapter.progress}%</span>
              </div>
              <div className="text-right text-xs text-zinc-400">
                <div>Questions: <span className="font-bold text-white">{selectedChapter.questions_solved}</span></div>
                <div>Accuracy: <span className="font-bold text-emerald-400">{selectedChapter.accuracy}%</span></div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-zinc-400 uppercase tracking-wider block">Key Focus Topics</span>
              <div className="p-3.5 rounded-2xl bg-[#222228] border border-white/[0.06] space-y-1.5 text-zinc-300">
                <p>• {selectedChapter.total_topics} topics mapped to NCERT & NEET PYQs</p>
                <p>• Last studied on <span className="text-primary-light font-bold">{selectedChapter.last_studied || 'Not studied yet'}</span></p>
                <p>• Current revision milestone: <span className="text-[#c084fc] font-bold">{selectedChapter.revision_status || 'Initial study pending'}</span></p>
              </div>
            </div>

            <button
              onClick={() => setSelectedChapter(null)}
              className="w-full py-2.5 rounded-full bg-[#25252c] text-xs font-bold text-zinc-300 hover:text-white transition"
            >
              Close Chapter View
            </button>
          </div>
        )}
      </Modal>

      {/* REFLECTION MODAL */}
      <Modal
        isOpen={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
        title={`${reflectionType === 'weekly' ? 'Weekly' : 'Monthly'} Reflection`}
        subtitle="Calibrate your NEET preparation velocity"
      >
        <form onSubmit={handleSaveReflection} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setReflectionType('weekly')}
              className={`flex-1 py-2 rounded-full text-xs font-bold border transition ${
                reflectionType === 'weekly'
                  ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                  : 'border-white/[0.08] bg-[#222228] text-zinc-400'
              }`}
            >
              Weekly Reflection
            </button>
            <button
              type="button"
              onClick={() => setReflectionType('monthly')}
              className={`flex-1 py-2 rounded-full text-xs font-bold border transition ${
                reflectionType === 'monthly'
                  ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                  : 'border-white/[0.08] bg-[#222228] text-zinc-400'
              }`}
            >
              Monthly Reflection
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {reflectionType === 'weekly' ? 'What went well this week?' : 'What went well this month?'}
            </label>
            <textarea
              value={refQ1}
              onChange={e => setRefQ1(e.target.value)}
              placeholder="e.g. Completed all scheduled Biology MCQs with high accuracy..."
              rows={2}
              className="w-full p-3 text-xs dark-input rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {reflectionType === 'weekly' ? 'What did I struggle with?' : 'What held me back?'}
            </label>
            <textarea
              value={refQ2}
              onChange={e => setRefQ2(e.target.value)}
              placeholder="e.g. Spent too much time on optics numericals..."
              rows={2}
              className="w-full p-3 text-xs dark-input rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {reflectionType === 'weekly' ? 'Which subject needs more attention?' : 'Which subject improved most?'}
            </label>
            <input
              type="text"
              value={refQ3}
              onChange={e => setRefQ3(e.target.value)}
              placeholder="e.g. Physics Ray Optics and formula practice"
              className="w-full px-3.5 py-2 text-xs dark-input rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {reflectionType === 'weekly' ? 'What will I improve next week?' : 'What should I change next month?'}
            </label>
            <textarea
              value={refQ4}
              onChange={e => setRefQ4(e.target.value)}
              placeholder="e.g. Start each morning with a timed 45m physics problem drill..."
              rows={2}
              className="w-full p-3 text-xs dark-input rounded-2xl"
            />
          </div>

          {reflectionType === 'monthly' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Main goal for next month?
              </label>
              <input
                type="text"
                value={refQ5}
                onChange={e => setRefQ5(e.target.value)}
                placeholder="e.g. Cross 600+ benchmark in Full Syllabus Mock Test #5"
                className="w-full px-3.5 py-2 text-xs dark-input rounded-2xl"
              />
            </div>
          )}

          {saveSuccess && (
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
              ✓ Reflection saved successfully!
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-full btn-primary text-xs font-bold transition shadow-btn"
          >
            Save Reflection
          </button>
        </form>
      </Modal>

      {/* ADD WEAK TOPIC MODAL */}
      <Modal
        isOpen={isAddWeakTopicOpen}
        onClose={() => setIsAddWeakTopicOpen(false)}
        title="Add Weak Topic"
        subtitle="Schedule targeted spaced revision"
      >
        <form onSubmit={handleSaveWeakTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Subject
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Physics', 'Chemistry', 'Biology'] as SubjectType[]).map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setNewWeakSubject(sub)}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold border transition ${
                    newWeakSubject === sub
                      ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#222228] text-zinc-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Topic Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kirchhoff's Laws / Aldol Condensation"
              value={newWeakTopicName}
              onChange={e => setNewWeakTopicName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Chapter Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Current Electricity"
              value={newWeakChapterName}
              onChange={e => setNewWeakChapterName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['High', 'Medium', 'Low'] as PriorityLevel[]).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setNewWeakPriority(lvl)}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold border transition ${
                    newWeakPriority === lvl
                      ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#222228] text-zinc-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full btn-primary text-xs font-bold transition shadow-btn"
          >
            Add Weak Topic
          </button>
        </form>
      </Modal>

      {/* Progress Toast */}
      {progressToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#6e3ff5] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-btn animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {progressToast}
        </div>
      )}
    </div>
  );
};
