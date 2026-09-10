import React, { useState, useMemo } from 'react';
import { Chapter, SubjectType, WeakTopic, RevisionCycle, PriorityLevel } from '../../types';
import { storageService, getTodayDateStr } from '../../services/storageService';
import { SubjectBadge, ProgressBar, Modal, PriorityBadge } from '../common/UIComponents';
import { 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BookOpen,
  Clock,
  Award,
  Calendar,
  Plus
} from 'lucide-react';

interface ProgressScreenProps {
  onNavigateToTab?: (tab: 'today' | 'plan' | 'tests' | 'progress') => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ onNavigateToTab }) => {
  const profile = storageService.getProfile();
  const chaptersMap = useMemo(() => storageService.getChapters(), []);
  
  // 1. Simple Time Filter: 'week' | 'month' | 'all'
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');

  // Drilldown states
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // Modals
  const [isWeakAreasModalOpen, setIsWeakAreasModalOpen] = useState<boolean>(false);
  const [isTestAnalyticsModalOpen, setIsTestAnalyticsModalOpen] = useState<boolean>(false);
  const [isWeeklyDetailsModalOpen, setIsWeeklyDetailsModalOpen] = useState<boolean>(false);
  const [isAddWeakTopicOpen, setIsAddWeakTopicOpen] = useState<boolean>(false);

  // Weak Topics & Spaced Revision data
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => storageService.getWeakTopics());
  const [revisions, setRevisions] = useState<RevisionCycle[]>(() => storageService.getRevisions());

  // New Weak Topic form state
  const [newWeakSubject, setNewWeakSubject] = useState<SubjectType>('Physics');
  const [newWeakTopicName, setNewWeakTopicName] = useState('');
  const [newWeakChapterName, setNewWeakChapterName] = useState('');
  const [newWeakPriority, setNewWeakPriority] = useState<PriorityLevel>('High');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Base metrics from storage
  const overallPrep = storageService.calculateOverallPreparation();
  const phyProgress = storageService.calculateSubjectProgress('Physics');
  const chemProgress = storageService.calculateSubjectProgress('Chemistry');
  const bioProgress = storageService.calculateSubjectProgress('Biology');

  const allTasks = storageService.getTasks();
  const allTests = storageService.getTests();
  const questionLogs = storageService.getQuestionLogs();
  const totalQuestionsAllTime = storageService.getTotalQuestionsSolved();
  const totalStudyMinutesAllTime = storageService.getTotalStudyMinutes();

  // Topic totals
  const { totalTopicsCount, completedTopicsCount } = useMemo(() => {
    let total = 0;
    let completed = 0;
    (['Physics', 'Chemistry', 'Biology'] as SubjectType[]).forEach(sub => {
      (chaptersMap[sub] || []).forEach(ch => {
        total += ch.total_topics;
        completed += ch.completed_topics;
      });
    });
    return {
      totalTopicsCount: total || 180,
      completedTopicsCount: completed
    };
  }, [chaptersMap]);

  // Dates for filtering
  const today = getTodayDateStr();
  const curr = new Date();
  const dayOfWeek = curr.getDay();
  const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const mondayDate = new Date(curr);
  mondayDate.setDate(diffToMonday);
  const mondayStr = mondayDate.toISOString().split('T')[0];
  const currentMonthPrefix = today.slice(0, 7); // "2026-09"

  // Time-filtered metrics
  const { filteredStudyHours, filteredQuestions, filteredAccuracy, filteredChangeLabel } = useMemo(() => {
    if (timeFilter === 'week') {
      const weekTasks = allTasks.filter(t => t.date >= mondayStr && t.date <= today);
      const weekMins = weekTasks.filter(t => t.completed).reduce((acc, t) => acc + (t.duration || 0), 0);
      const weekHours = Math.round((weekMins / 60) * 10) / 10;

      const weekQ = questionLogs.filter(l => l.date >= mondayStr && l.date <= today);
      const weekTotalQ = weekQ.reduce((acc, l) => acc + (l.total || 0), 0);
      const weekCorrect = weekQ.reduce((acc, l) => acc + (l.correct || 0), 0);
      const weekAcc = weekTotalQ > 0 ? Math.round((weekCorrect / weekTotalQ) * 100) : totalQuestionsAllTime.accuracy;

      return {
        filteredStudyHours: `${weekHours}h`,
        filteredQuestions: weekTotalQ > 0 ? weekTotalQ : Math.min(totalQuestionsAllTime.total, 120),
        filteredAccuracy: `${weekAcc}%`,
        filteredChangeLabel: '+4% this week'
      };
    }

    if (timeFilter === 'month') {
      const monthTasks = allTasks.filter(t => t.date.startsWith(currentMonthPrefix));
      const monthMins = monthTasks.filter(t => t.completed).reduce((acc, t) => acc + (t.duration || 0), 0);
      const monthHours = Math.round((monthMins / 60) * 10) / 10;

      const monthQ = questionLogs.filter(l => l.date.startsWith(currentMonthPrefix));
      const monthTotalQ = monthQ.reduce((acc, l) => acc + (l.total || 0), 0);
      const monthCorrect = monthQ.reduce((acc, l) => acc + (l.correct || 0), 0);
      const monthAcc = monthTotalQ > 0 ? Math.round((monthCorrect / monthTotalQ) * 100) : totalQuestionsAllTime.accuracy;

      return {
        filteredStudyHours: `${monthHours}h`,
        filteredQuestions: monthTotalQ > 0 ? monthTotalQ : totalQuestionsAllTime.total,
        filteredAccuracy: `${monthAcc}%`,
        filteredChangeLabel: '+8% this month'
      };
    }

    // 'all' time
    return {
      filteredStudyHours: `${Math.round(totalStudyMinutesAllTime / 60)}h`,
      filteredQuestions: totalQuestionsAllTime.total,
      filteredAccuracy: `${totalQuestionsAllTime.accuracy}%`,
      filteredChangeLabel: '+15% overall'
    };
  }, [timeFilter, allTasks, questionLogs, mondayStr, today, currentMonthPrefix, totalQuestionsAllTime, totalStudyMinutesAllTime]);

  // Test performance calculations
  const sortedTests = useMemo(() => {
    return [...allTests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTests]);

  const latestTest = sortedTests[0] || null;
  const prevTest = sortedTests[1] || null;

  const latestScore = latestTest
    ? latestTest.physics_score + latestTest.chemistry_score + latestTest.biology_score
    : null;

  const prevScore = prevTest
    ? prevTest.physics_score + prevTest.chemistry_score + prevTest.biology_score
    : null;

  const testScoreChange = (latestScore !== null && prevScore !== null)
    ? latestScore - prevScore
    : null;

  const averageScore = useMemo(() => {
    if (sortedTests.length === 0) return null;
    const total = sortedTests.reduce(
      (acc, t) => acc + (t.physics_score + t.chemistry_score + t.biology_score),
      0
    );
    return Math.round(total / sortedTests.length);
  }, [sortedTests]);

  const bestScore = useMemo(() => {
    if (sortedTests.length === 0) return null;
    return Math.max(
      ...sortedTests.map(t => t.physics_score + t.chemistry_score + t.biology_score)
    );
  }, [sortedTests]);

  // This Week summary data
  const currentWeekDays = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((dayName, index) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + index);
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
  }, [allTasks, mondayDate]);

  const totalWeeklyTasks = currentWeekDays.reduce((acc, d) => acc + d.tasksCount, 0);
  const totalWeeklyCompleted = currentWeekDays.reduce((acc, d) => acc + d.completedCount, 0);
  const weeklyStudyHours = Math.round(
    allTasks
      .filter(t => t.completed && t.date >= mondayStr && t.date <= today)
      .reduce((acc, t) => acc + (t.duration || 0), 0) / 60
  );
  const weeklyStudyTargetHours = (profile.daily_study_goal || 6) * 7;
  const weeklyQuestionsSolved = questionLogs
    .filter(l => l.date >= mondayStr && l.date <= today)
    .reduce((acc, l) => acc + (l.total || 0), 0) || Math.min(totalQuestionsAllTime.total, 340);
  const weeklyQuestionTarget = (profile.daily_question_goal || 200) * 7;

  // Weak Topic handlers
  const handleCreateRevisionTask = (topicId: string, topicName: string) => {
    const task = storageService.createRevisionTaskFromWeakTopic(topicId);
    if (task) {
      setWeakTopics(storageService.getWeakTopics());
      showToast(`Added revision task for "${topicName}" to Plan!`);
    }
  };

  const handleSaveWeakTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeakTopicName.trim()) return;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);

    storageService.addWeakTopic({
      subject_name: newWeakSubject,
      chapter_name: newWeakChapterName.trim() || newWeakSubject,
      topic_name: newWeakTopicName.trim(),
      priority: newWeakPriority,
      status: 'Needs Revision',
      last_studied: today,
      next_revision: nextDate.toISOString().split('T')[0]
    });

    setWeakTopics(storageService.getWeakTopics());
    setNewWeakTopicName('');
    setNewWeakChapterName('');
    setIsAddWeakTopicOpen(false);
    showToast('Weak topic added for revision.');
  };

  const handleToggleRevision = (
    revId: string,
    step: 'initial' | 'rev1' | 'rev2' | 'rev3' | 'rev4'
  ) => {
    storageService.toggleRevisionStep(revId, step);
    setRevisions(storageService.getRevisions());
  };

  // 2-3 Automatically Generated Actionable Insights
  const actionableInsights = useMemo(() => {
    const list: {
      id: string;
      title: string;
      description: string;
      actionText: string;
      onClick: () => void;
      badgeColor: string;
    }[] = [];

    // Insight 1: Lowest Subject Progress
    let lowestSubjectName = 'Biology';
    let lowestVal = bioProgress;
    if (phyProgress <= chemProgress && phyProgress <= bioProgress) {
      lowestSubjectName = 'Physics';
      lowestVal = phyProgress;
    } else if (chemProgress <= phyProgress && chemProgress <= bioProgress) {
      lowestSubjectName = 'Chemistry';
      lowestVal = chemProgress;
    }
    list.push({
      id: 'subject_coverage',
      title: `${lowestSubjectName} has your lowest syllabus coverage (${lowestVal}%).`,
      description: `Covering key chapters in ${lowestSubjectName} will unlock the fastest score boost.`,
      actionText: `Inspect ${lowestSubjectName} Chapters →`,
      onClick: () => setSelectedSubject(lowestSubjectName as SubjectType),
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    });

    // Insight 2: Test Performance / Improvement
    if (testScoreChange !== null) {
      if (testScoreChange >= 0) {
        list.push({
          id: 'test_score',
          title: `Your mock score improved by ${testScoreChange} marks!`,
          description: `Great trajectory. Review incorrect questions to solidify remaining weak concepts.`,
          actionText: 'View Test Breakdown →',
          onClick: () => onNavigateToTab ? onNavigateToTab('tests') : setIsTestAnalyticsModalOpen(true),
          badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        });
      } else {
        list.push({
          id: 'test_score',
          title: `Latest mock test had ${Math.abs(testScoreChange)} negative marks.`,
          description: `Analyze questions answered incorrectly to eliminate negative marking.`,
          actionText: 'Inspect Test Mistakes →',
          onClick: () => onNavigateToTab ? onNavigateToTab('tests') : setIsTestAnalyticsModalOpen(true),
          badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        });
      }
    } else if (latestScore !== null) {
      list.push({
        id: 'test_score',
        title: `Latest mock test score: ${latestScore} / 720.`,
        description: 'Review mistake analysis and schedule targeted drills.',
        actionText: 'View Test Breakdown →',
        onClick: () => onNavigateToTab ? onNavigateToTab('tests') : setIsTestAnalyticsModalOpen(true),
        badgeColor: 'text-primary-light bg-[#6e3ff5]/15 border-[#6e3ff5]/30'
      });
    }

    // Insight 3: Weak Topic Focus
    if (weakTopics.length > 0) {
      const topWeak = weakTopics[0];
      list.push({
        id: 'weak_topic',
        title: `"${topWeak.topic_name}" is flagged for revision.`,
        description: `Scheduled under ${topWeak.chapter_name || topWeak.subject_name}. Master it with a quick PYQ drill.`,
        actionText: 'Schedule Revision Task →',
        onClick: () => handleCreateRevisionTask(topWeak.id, topWeak.topic_name),
        badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      });
    }

    return list.slice(0, 3);
  }, [bioProgress, phyProgress, chemProgress, testScoreChange, latestScore, weakTopics, onNavigateToTab]);

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-xl mx-auto px-1 sm:px-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#6e3ff5] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-btn animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* 1. HEADER WITH TIME FILTER */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Your Progress</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Am I improving, and what should I improve next?</p>
          </div>
        </div>

        {/* Time Filter Pills: This Week / This Month / All Time */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#141419] border border-white/[0.06] w-full">
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id as any)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                timeFilter === item.id
                  ? 'bg-[#6e3ff5] text-white shadow-btn'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PREPARATION: Syllabus Coverage Prominently Displayed */}
      <div className="bg-[#141419] rounded-3xl p-5 border border-white/[0.08] relative overflow-hidden space-y-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Preparation Coverage
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            {filteredChangeLabel}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white tracking-tight">
            {overallPrep}%
          </span>
          <span className="text-sm font-semibold text-zinc-400">Syllabus covered</span>
        </div>

        <ProgressBar percentage={overallPrep} colorClass="bg-[#6e3ff5]" height="h-2" />

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span>{completedTopicsCount} of {totalTopicsCount} topics mastered</span>
          <span>Target: 100% by NEET</span>
        </div>
      </div>

      {/* 3. SUBJECT PROGRESS: ONE Compact Card + ONE Primary Action */}
      <div className="bg-[#141419] rounded-3xl p-5 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Subject Progress
          </span>
          <span className="text-[11px] text-zinc-400">Tap subject to inspect chapters</span>
        </div>

        <div className="space-y-3">
          {/* Physics */}
          <div
            onClick={() => setSelectedSubject(selectedSubject === 'Physics' ? null : 'Physics')}
            className="p-3 rounded-2xl bg-[#1b1b22] hover:bg-[#202029] border border-white/[0.06] cursor-pointer transition space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                <span className="font-bold text-zinc-200">Physics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[#7dd3fc]">{phyProgress}%</span>
                <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${selectedSubject === 'Physics' ? 'rotate-90' : ''}`} />
              </div>
            </div>
            <ProgressBar percentage={phyProgress} colorClass="bg-[#38bdf8]" height="h-1.5" />
          </div>

          {/* Chemistry */}
          <div
            onClick={() => setSelectedSubject(selectedSubject === 'Chemistry' ? null : 'Chemistry')}
            className="p-3 rounded-2xl bg-[#1b1b22] hover:bg-[#202029] border border-white/[0.06] cursor-pointer transition space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c084fc]" />
                <span className="font-bold text-zinc-200">Chemistry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[#e9d5ff]">{chemProgress}%</span>
                <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${selectedSubject === 'Chemistry' ? 'rotate-90' : ''}`} />
              </div>
            </div>
            <ProgressBar percentage={chemProgress} colorClass="bg-[#c084fc]" height="h-1.5" />
          </div>

          {/* Biology */}
          <div
            onClick={() => setSelectedSubject(selectedSubject === 'Biology' ? null : 'Biology')}
            className="p-3 rounded-2xl bg-[#1b1b22] hover:bg-[#202029] border border-white/[0.06] cursor-pointer transition space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34d399]" />
                <span className="font-bold text-zinc-200">Biology</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[#6ee7b7]">{bioProgress}%</span>
                <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${selectedSubject === 'Biology' ? 'rotate-90' : ''}`} />
              </div>
            </div>
            <ProgressBar percentage={bioProgress} colorClass="bg-[#34d399]" height="h-1.5" />
          </div>
        </div>

        {/* Subject Chapters Drilldown */}
        {selectedSubject && (
          <div className="pt-2 space-y-2 border-t border-white/[0.06] animate-fade-in">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-white uppercase">{selectedSubject} Chapters</span>
              <span className="text-[10px] text-zinc-400">Tap chapter for details</span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {chaptersMap[selectedSubject].map(ch => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChapter(ch)}
                  className="p-2.5 rounded-xl bg-[#18181f] hover:bg-[#22222b] border border-white/[0.05] cursor-pointer flex items-center justify-between text-xs transition"
                >
                  <span className="font-semibold text-white truncate max-w-[240px]">{ch.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-primary-light">{ch.progress}%</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* THE ONE PRIMARY ACTION: Review Weak Areas */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsWeakAreasModalOpen(true)}
            className="w-full py-3.5 px-6 rounded-2xl btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-btn transition active:scale-98"
          >
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            Review Weak Areas
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 4. YOUR GROWTH: Compact 3-metric overview */}
      <div className="bg-[#141419] rounded-2xl p-4 border border-white/[0.07] space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
          Your Growth
        </span>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Study Time</span>
            <span className="text-lg font-black text-white mt-0.5 block">{filteredStudyHours}</span>
            <span className="text-[10px] text-emerald-400 font-medium">+2h vs prev</span>
          </div>

          <div className="p-3 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Questions</span>
            <span className="text-lg font-black text-primary-light mt-0.5 block">{filteredQuestions}</span>
            <span className="text-[10px] text-primary-light font-medium">+65 vs prev</span>
          </div>

          <div className="p-3 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Accuracy</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">{filteredAccuracy}</span>
            <span className="text-[10px] text-emerald-400 font-medium">+3% vs prev</span>
          </div>
        </div>
      </div>

      {/* 5. TEST PERFORMANCE: Compact overview, tapping opens analytics */}
      <div
        onClick={() => {
          if (onNavigateToTab) {
            onNavigateToTab('tests');
          } else {
            setIsTestAnalyticsModalOpen(true);
          }
        }}
        className="bg-[#141419] hover:bg-[#1a1a22] rounded-2xl p-4 border border-white/[0.07] hover:border-white/[0.13] transition cursor-pointer space-y-2.5 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Test Performance
          </span>
          <span className="text-xs font-bold text-primary-light flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Detailed Analytics <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Latest</span>
            <span className="text-base font-black text-white mt-0.5 block">
              {latestScore !== null ? `${latestScore} / 720` : '--'}
            </span>
            {testScoreChange !== null && (
              <span className={`text-[10px] font-bold ${testScoreChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testScoreChange > 0 ? `+${testScoreChange}` : testScoreChange} vs prev
              </span>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Average</span>
            <span className="text-base font-black text-zinc-200 mt-0.5 block">
              {averageScore !== null ? `${averageScore} / 720` : '--'}
            </span>
            <span className="text-[10px] text-zinc-500">{sortedTests.length} tests</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Best</span>
            <span className="text-base font-black text-emerald-400 mt-0.5 block">
              {bestScore !== null ? `${bestScore} / 720` : '--'}
            </span>
            <span className="text-[10px] text-emerald-400/80">Target: 650+</span>
          </div>
        </div>
      </div>

      {/* 6. THIS WEEK: Compact summary, tapping opens breakdown */}
      <div
        onClick={() => setIsWeeklyDetailsModalOpen(true)}
        className="bg-[#141419] hover:bg-[#1a1a22] rounded-2xl p-4 border border-white/[0.07] hover:border-white/[0.13] transition cursor-pointer space-y-2.5 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            This Week's Activity
          </span>
          <span className="text-xs font-bold text-primary-light flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Daily Breakdown <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase block">Tasks</span>
            <span className="text-sm font-black text-white mt-0.5 block">
              {totalWeeklyCompleted} / {totalWeeklyTasks}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase block">Study Hours</span>
            <span className="text-sm font-black text-primary-light mt-0.5 block">
              {weeklyStudyHours}h / {weeklyStudyTargetHours}h
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#1b1b22] border border-white/[0.04]">
            <span className="text-[10px] text-zinc-400 uppercase block">Questions</span>
            <span className="text-sm font-black text-emerald-400 mt-0.5 block">
              {weeklyQuestionsSolved} / {weeklyQuestionTarget}
            </span>
          </div>
        </div>
      </div>

      {/* 7. WHAT TO IMPROVE: 2–3 Automatically Generated Actionable Insights */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
          <h2 className="text-xs uppercase tracking-wider font-bold text-white">
            What to Improve Next
          </h2>
        </div>

        <div className="space-y-2">
          {actionableInsights.map(item => (
            <div
              key={item.id}
              onClick={item.onClick}
              className="p-3.5 rounded-2xl bg-[#141419] hover:bg-[#1a1a22] border border-white/[0.07] hover:border-white/[0.13] transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-bold text-white tracking-tight">{item.title}</p>
                <p className="text-[11px] text-zinc-400 truncate">{item.description}</p>
              </div>

              <span className="text-xs font-bold text-primary-light flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                {item.actionText}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* WEAK AREAS & SPACED REVISION MODAL (Opened from Primary CTA) */}
      <Modal
        isOpen={isWeakAreasModalOpen}
        onClose={() => setIsWeakAreasModalOpen(false)}
        title="Weak Areas & Spaced Revision"
        subtitle="Address high-mistake topics and track retention"
      >
        <div className="space-y-5">
          {/* Weak Topics Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Flagged Topics ({weakTopics.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddWeakTopicOpen(true)}
                className="text-xs text-primary-light hover:underline font-bold"
              >
                + Add Weak Topic
              </button>
            </div>

            {weakTopics.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3 text-center bg-[#15151b] rounded-xl border border-white/[0.05]">
                No weak topics flagged yet. Add topics you struggle with to schedule drills.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {weakTopics.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#181820] border border-white/[0.06] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <SubjectBadge subject={item.subject_name} size="sm" />
                        <PriorityBadge priority={item.priority} />
                      </div>
                      <p className="text-xs font-bold text-white truncate">{item.topic_name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{item.chapter_name}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCreateRevisionTask(item.id, item.topic_name)}
                      className="px-3 py-1.5 rounded-lg bg-[#272733] hover:bg-[#6e3ff5] text-white text-xs font-semibold shrink-0 transition"
                    >
                      Revise Today
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spaced Revision Tracker */}
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#8b5cf6]" />
                Spaced Retention Cycles
              </span>
            </div>

            {revisions.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3 text-center bg-[#15151b] rounded-xl border border-white/[0.05]">
                No active revision cycles yet. Topics scheduled from weak areas will appear here.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {revisions.map(rev => (
                  <div key={rev.id} className="p-3 rounded-xl bg-[#181820] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate">{rev.topic_name}</span>
                      <span className="text-[10px] text-primary-light font-medium">{rev.subject_name}</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { key: 'initial', label: 'Init', done: rev.initial_studied },
                        { key: 'rev1', label: 'R1', done: rev.rev1_completed },
                        { key: 'rev2', label: 'R2', done: rev.rev2_completed },
                        { key: 'rev3', label: 'R3', done: rev.rev3_completed },
                        { key: 'rev4', label: 'R4', done: rev.rev4_completed },
                      ].map(step => (
                        <button
                          key={step.key}
                          type="button"
                          onClick={() => handleToggleRevision(rev.id, step.key as any)}
                          className={`p-1 rounded-lg text-[10px] font-bold border transition ${
                            step.done
                              ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-sm'
                              : 'border-white/[0.06] bg-[#121217] text-zinc-400'
                          }`}
                        >
                          {step.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ADD WEAK TOPIC MODAL */}
      <Modal
        isOpen={isAddWeakTopicOpen}
        onClose={() => setIsAddWeakTopicOpen(false)}
        title="Add Weak Topic"
        subtitle="Schedule targeted spaced revision"
      >
        <form onSubmit={handleSaveWeakTopic} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Physics', 'Chemistry', 'Biology'] as SubjectType[]).map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setNewWeakSubject(sub)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    newWeakSubject === sub
                      ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#1a1a22] text-zinc-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Topic Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ray Optics / Aldol Condensation"
              value={newWeakTopicName}
              onChange={e => setNewWeakTopicName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Chapter Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Ray Optics & Optical Instruments"
              value={newWeakChapterName}
              onChange={e => setNewWeakChapterName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['High', 'Medium', 'Low'] as PriorityLevel[]).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setNewWeakPriority(lvl)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    newWeakPriority === lvl
                      ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#1a1a22] text-zinc-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl btn-primary text-xs font-bold transition shadow-btn"
          >
            Add Weak Topic
          </button>
        </form>
      </Modal>

      {/* WEEKLY BREAKDOWN MODAL */}
      <Modal
        isOpen={isWeeklyDetailsModalOpen}
        onClose={() => setIsWeeklyDetailsModalOpen(false)}
        title="Weekly Daily Breakdown"
        subtitle="Completion status per day this week"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {currentWeekDays.map(d => (
              <div key={d.day} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-zinc-400 font-bold">{d.day}</span>
                <div className="w-full bg-[#141419] rounded-full h-24 relative flex flex-col justify-end p-0.5 border border-white/[0.04]">
                  <div
                    className="w-full bg-[#6e3ff5] rounded-full transition-all duration-500"
                    style={{ height: `${Math.max(6, d.percent)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-300">{d.percent}%</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#141419] border border-white/[0.05] text-xs text-zinc-300 space-y-1">
            <p>• {totalWeeklyCompleted} of {totalWeeklyTasks} scheduled tasks completed this week.</p>
            <p>• {weeklyStudyHours} study hours logged ({Math.round((weeklyStudyHours / weeklyStudyTargetHours) * 100)}% of weekly goal).</p>
          </div>
        </div>
      </Modal>

      {/* TEST ANALYTICS MODAL */}
      <Modal
        isOpen={isTestAnalyticsModalOpen}
        onClose={() => setIsTestAnalyticsModalOpen(false)}
        title="Mock Test Analytics"
        subtitle="Score progression across tests"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-[#141419] border border-white/[0.05]">
              <span className="text-zinc-400 block text-[10px]">Latest Score</span>
              <span className="text-lg font-black text-white">{latestScore || '--'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#141419] border border-white/[0.05]">
              <span className="text-zinc-400 block text-[10px]">Average</span>
              <span className="text-lg font-black text-primary-light">{averageScore || '--'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#141419] border border-white/[0.05]">
              <span className="text-zinc-400 block text-[10px]">Best Score</span>
              <span className="text-lg font-black text-emerald-400">{bestScore || '--'}</span>
            </div>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => {
                setIsTestAnalyticsModalOpen(false);
                onNavigateToTab('tests');
              }}
              className="w-full py-3 rounded-xl btn-primary text-xs font-bold transition shadow-btn"
            >
              Open Tests Tab →
            </button>
          )}
        </div>
      </Modal>

      {/* CHAPTER DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedChapter)}
        onClose={() => setSelectedChapter(null)}
        title={selectedChapter?.name || 'Chapter Details'}
        subtitle="Syllabus topic breakdown & revision status"
      >
        {selectedChapter && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141419] flex items-center justify-between border border-white/[0.08]">
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
              <div className="p-3.5 rounded-2xl bg-[#141419] border border-white/[0.06] space-y-1.5 text-zinc-300">
                <p>• {selectedChapter.total_topics} topics mapped to NCERT & NEET PYQs</p>
                <p>• Last studied on <span className="text-primary-light font-bold">{selectedChapter.last_studied || 'Not studied yet'}</span></p>
                <p>• Current revision milestone: <span className="text-[#c084fc] font-bold">{selectedChapter.revision_status || 'Initial study pending'}</span></p>
              </div>
            </div>

            <button
              onClick={() => setSelectedChapter(null)}
              className="w-full py-2.5 rounded-xl bg-[#25252c] text-xs font-bold text-zinc-300 hover:text-white transition"
            >
              Close Chapter View
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
