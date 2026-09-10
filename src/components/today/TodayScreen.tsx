import React, { useState, useMemo } from 'react';
import { Task, SubjectType, WeakTopic } from '../../types';
import { storageService, getTodayDateStr } from '../../services/storageService';
import { SubjectBadge, PriorityBadge, CircularProgress, ProgressBar } from '../common/UIComponents';
import { AddTaskModal } from './AddTaskModal';
import { LogQuestionsModal } from './LogQuestionsModal';
import { 
  Plus, 
  Check, 
  Clock, 
  Flame, 
  Target, 
  Sparkles,
  ChevronRight,
  Trash2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface TodayScreenProps {
  onNavigateToTab?: (tab: 'today' | 'plan' | 'tests' | 'progress') => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ onNavigateToTab }) => {
  const profile = storageService.getProfile();
  const todayStr = getTodayDateStr();

  const [tasks, setTasks] = useState<Task[]>(() => storageService.getTasksForDate(todayStr));
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => storageService.getWeakTopics());
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [isLogQuestionsOpen, setIsLogQuestionsOpen] = useState<boolean>(false);

  // Dynamic countdown to exam
  const daysRemaining = useMemo(() => {
    const targetDate = new Date(profile.exam_date || '2027-05-02');
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 245;
  }, [profile.exam_date]);

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const todayProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Study hours
  const studyMinutes = useMemo(() => {
    return tasks
      .filter(t => t.completed)
      .reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [tasks]);
  const studyHoursDisplay = `${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`;

  // Questions solved today
  const todayQuestionLogs = useMemo(() => {
    return storageService.getQuestionLogs().filter(l => l.date === todayStr);
  }, [todayStr, tasks]);
  const todayQuestionsCount = todayQuestionLogs.reduce((acc, l) => acc + (l.total || 0), 0);
  const todayCorrectCount = todayQuestionLogs.reduce((acc, l) => acc + (l.correct || 0), 0);
  const todayAccuracy = todayQuestionsCount > 0 ? Math.round((todayCorrectCount / todayQuestionsCount) * 100) : 0;

  // Streak
  const streakInfo = storageService.calculateStreak();

  // Subject Progress
  const phyProgress = storageService.calculateSubjectProgress('Physics');
  const chemProgress = storageService.calculateSubjectProgress('Chemistry');
  const bioProgress = storageService.calculateSubjectProgress('Biology');

  // Toggle Task Completion
  const handleToggleTask = (taskId: string) => {
    const updated = storageService.toggleTaskComplete(taskId);
    if (updated) {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, completed: updated.completed } : t))
      );
    }
  };

  // Add Task
  const handleAddTask = (newTaskData: any) => {
    const added = storageService.addTask(newTaskData);
    if (added.date === todayStr) {
      setTasks(prev => [added, ...prev]);
    }
  };

  // Delete Task
  const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    storageService.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Save Questions
  const handleSaveQuestions = (entry: any) => {
    storageService.logQuestions({
      subject_name: 'Biology',
      total: entry.total,
      correct: entry.correct,
      incorrect: entry.incorrect
    });
    setTasks([...storageService.getTasksForDate(todayStr)]);
  };

  // Create Revision Task from Weak Topic
  const handleCreateRevisionTask = (topicId: string) => {
    const created = storageService.createRevisionTaskFromWeakTopic(topicId);
    if (created && created.date === todayStr) {
      setTasks(prev => [created, ...prev]);
      setWeakTopics(storageService.getWeakTopics());
    }
  };

  return (
    <div className="space-y-6 pb-28 md:pb-10 max-w-2xl mx-auto">
      {/* HEADER SECTION (Matching reference navigation style) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#202025] border border-white/[0.08] flex items-center justify-center text-primary-light shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {greeting}, {profile.name || 'Aspirant'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Your personal NEET preparation command center</p>
          </div>
        </div>

        {/* Compact Pill Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202025] border border-white/[0.08] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#6e3ff5]"></span>
          <span className="text-zinc-200 font-semibold">{profile.target_exam || 'NEET 2027'}</span>
          <span className="text-zinc-400">· {daysRemaining}d</span>
        </div>
      </div>

      {/* MOBILE TARGET PILL */}
      <div className="sm:hidden flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#202025] border border-white/[0.07] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6e3ff5]"></span>
          <span className="text-white font-semibold">{profile.target_exam || 'NEET 2027'} Target</span>
        </div>
        <span className="text-primary-light font-bold">{daysRemaining} days remaining</span>
      </div>

      {/* 1. TODAY'S PROGRESS CARD (Featured Hero Card - Inspired by Reference 'Defi Pluse Index' card) */}
      <div className="dark-card rounded-3xl p-5 sm:p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Today's Progress
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {completedTasks} of {totalTasks} Tasks
            </div>
            <p className="text-xs text-zinc-400">
              {totalTasks > 0
                ? `${todayProgressPercent}% completed · ${totalTasks - completedTasks} remaining`
                : 'No tasks scheduled yet today'}
            </p>
          </div>

          <div className="shrink-0">
            <CircularProgress percentage={todayProgressPercent} size={76} strokeWidth={7} />
          </div>
        </div>

        {/* Action Buttons: Strong Primary CTA (Bright Purple View Button) + Secondary Pill */}
        <div className="pt-1 flex items-center gap-2.5">
          <button
            onClick={() => setIsAddTaskOpen(true)}
            className="flex-1 py-3 px-4 btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-btn"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Add Task
          </button>

          <button
            onClick={() => setIsLogQuestionsOpen(true)}
            className="py-3 px-4 rounded-full bg-[#27272f] hover:bg-[#2e2e38] text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition active:scale-98"
          >
            <Target className="w-4 h-4 text-[#8b5cf6]" />
            Log MCQs
          </button>
        </div>
      </div>

      {/* 2. TODAY'S STUDY TASKS (Section heading like "Favourites" / "Lists" in reference) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm">⭐</span>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Today's Study Tasks
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-medium">{tasks.length} planned</span>
        </div>

        {tasks.length === 0 ? (
          /* Friendly Empty State with Soft Rounded Corners */
          <div className="dark-card rounded-3xl p-8 text-center border border-white/[0.06] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#27272f] border border-white/[0.08] text-[#8b5cf6] mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-white tracking-tight">Your day is clear.</p>
              <p className="text-xs text-zinc-400 mt-1">Create your first study task to get started.</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsAddTaskOpen(true)}
                className="btn-primary py-2.5 px-6 text-xs font-bold inline-flex items-center gap-2 shadow-btn"
              >
                <Plus className="w-4 h-4" />
                + Add Task
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`group dark-card dark-card-hover rounded-2xl p-4 border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                  task.completed
                    ? 'border-white/[0.04] opacity-65 bg-[#1a1a20]'
                    : 'border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Large Touch-friendly Checkbox */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleToggleTask(task.id);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 border ${
                      task.completed
                        ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-sm'
                        : 'border-zinc-600 hover:border-primary-light bg-[#18181e]'
                    }`}
                    aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Task details */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SubjectBadge subject={task.subject_name} size="sm" />
                      <span className="text-xs text-zinc-400 font-medium truncate">
                        {task.chapter_name || task.subject_name}
                      </span>
                    </div>

                    <p
                      className={`text-sm font-semibold tracking-tight truncate ${
                        task.completed ? 'line-through text-zinc-500' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {task.duration}m
                      </span>
                      <span>·</span>
                      <span className="text-zinc-300 font-medium">{task.task_type}</span>
                      <span>·</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                </div>

                {/* Right action */}
                <div className="flex items-center gap-1 shrink-0">
                  {task.completed && (
                    <span className="hidden sm:inline-block text-[11px] font-semibold text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      Done
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={e => handleDeleteTask(e, task.id)}
                    className="w-8 h-8 rounded-full bg-[#1c1c22] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3, 4, 5. TODAY'S METRICS (Study Hours, Questions, Streak) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-purple-400 text-sm">⚡</span>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Daily Metrics
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="dark-card rounded-2xl p-3.5 border border-white/[0.07] text-center">
            <span className="block text-[11px] text-zinc-400 font-semibold mb-1 uppercase tracking-wider">
              Study Hours
            </span>
            <span className="text-xl font-black text-white tracking-tight">{studyHoursDisplay}</span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">Target: {profile.daily_study_goal || 6}h</span>
          </div>

          <div className="dark-card rounded-2xl p-3.5 border border-white/[0.07] text-center">
            <span className="block text-[11px] text-zinc-400 font-semibold mb-1 uppercase tracking-wider">
              Questions
            </span>
            <span className="text-xl font-black text-primary-light tracking-tight">{todayQuestionsCount}</span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">Target: {profile.daily_question_goal || 200}</span>
          </div>

          <div className="dark-card rounded-2xl p-3.5 border border-white/[0.07] text-center">
            <span className="block text-[11px] text-zinc-400 font-semibold mb-1 uppercase tracking-wider">
              Accuracy
            </span>
            <span className="text-xl font-black text-emerald-400 tracking-tight">
              {todayQuestionsCount > 0 ? `${todayAccuracy}%` : '0%'}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">MCQ practice</span>
          </div>

          <div className="dark-card rounded-2xl p-3.5 border border-white/[0.07] text-center">
            <span className="block text-[11px] text-zinc-400 font-semibold mb-1 uppercase tracking-wider">
              Streak
            </span>
            <span className="text-xl font-black text-amber-400 tracking-tight flex items-center justify-center gap-1">
              {streakInfo.currentStreak > 0 ? (
                `🔥 ${streakInfo.currentStreak}d`
              ) : (
                <span className="text-xs text-zinc-400 font-medium">0 days</span>
              )}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">Consistency</span>
          </div>
        </div>
      </div>

      {/* 6. SUBJECT PROGRESS (Physics, Chemistry, Biology with subtle colored accents) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-blue-400 text-sm">📚</span>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Subject Progress
            </h2>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('progress')}
              className="text-xs text-primary-light font-medium hover:underline flex items-center gap-0.5"
            >
              All Chapters <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Physics */}
          <div className="dark-card rounded-2xl p-3.5 border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
                <span className="text-xs font-bold text-white">Physics</span>
              </div>
              <span className="text-xs font-black text-[#7dd3fc]">{phyProgress}%</span>
            </div>
            <ProgressBar percentage={phyProgress} colorClass="bg-[#38bdf8]" height="h-1.5" />
          </div>

          {/* Chemistry */}
          <div className="dark-card rounded-2xl p-3.5 border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c084fc]"></span>
                <span className="text-xs font-bold text-white">Chemistry</span>
              </div>
              <span className="text-xs font-black text-[#e9d5ff]">{chemProgress}%</span>
            </div>
            <ProgressBar percentage={chemProgress} colorClass="bg-[#c084fc]" height="h-1.5" />
          </div>

          {/* Biology */}
          <div className="dark-card rounded-2xl p-3.5 border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#34d399]"></span>
                <span className="text-xs font-bold text-white">Biology</span>
              </div>
              <span className="text-xs font-black text-[#6ee7b7]">{bioProgress}%</span>
            </div>
            <ProgressBar percentage={bioProgress} colorClass="bg-[#34d399]" height="h-1.5" />
          </div>
        </div>
      </div>

      {/* 7. WEAK TOPICS (Actionable spaced revision list) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Weak Topics Focus
            </h2>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('tests')}
              className="text-xs text-primary-light font-medium hover:underline flex items-center gap-0.5"
            >
              Test Review <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {weakTopics.length === 0 ? (
          <div className="dark-card rounded-2xl p-4 text-center border border-white/[0.06]">
            <p className="text-xs text-zinc-400">
              No weak topics flagged. Add topics you struggle with in mock tests for targeted revision.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {weakTopics.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="dark-card rounded-2xl p-3.5 border border-white/[0.07] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SubjectBadge subject={item.subject_name} size="sm" />
                    <span className="text-[11px] text-zinc-400 truncate">{item.chapter_name}</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{item.topic_name}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRevisionTask(item.id)}
                  className="px-3 py-1.5 rounded-full bg-[#2c2c36] hover:bg-primary hover:text-white text-zinc-200 text-xs font-semibold transition border border-white/[0.08] shrink-0"
                >
                  Revise Today
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Task Button on Mobile */}
      <div className="fixed bottom-20 right-5 md:hidden z-30">
        <button
          onClick={() => setIsAddTaskOpen(true)}
          className="w-14 h-14 rounded-full btn-primary shadow-btn flex items-center justify-center border border-white/20 active:scale-95 transition"
          aria-label="Add Task"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />

      <LogQuestionsModal
        isOpen={isLogQuestionsOpen}
        onClose={() => setIsLogQuestionsOpen(false)}
        onSave={handleSaveQuestions}
      />
    </div>
  );
};
