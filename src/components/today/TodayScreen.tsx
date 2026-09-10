import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task } from '../../types';
import { storageService, getTodayDateStr } from '../../services/storageService';
import { SubjectBadge, PriorityBadge, ProgressBar } from '../common/UIComponents';
import { AddTaskModal } from './AddTaskModal';
import { 
  Check, 
  Clock, 
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface TodayScreenProps {
  onNavigateToTab?: (tab: 'today' | 'plan' | 'tests' | 'progress') => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ onNavigateToTab }) => {
  const profile = storageService.getProfile();
  const todayStr = getTodayDateStr();

  const [tasks, setTasks] = useState<Task[]>(() => storageService.getTasksForDate(todayStr));
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);

  // Micro-interaction states for smooth task completion transition
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [pinnedTaskId, setPinnedTaskId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const exitTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Dynamic countdown to exam
  const daysRemaining = useMemo(() => {
    const targetDate = new Date(profile.exam_date || '2027-05-02');
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 245;
  }, [profile.exam_date]);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today stats — updates immediately on tap
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const uncompletedTasks = tasks.filter(t => !t.completed);
  const allCompleted = totalTasks > 0 && completedTasks === totalTasks;
  const todayProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Determine currentTask:
  // If a task is pinned during the ~700ms confirmation, keep it visible!
  // Otherwise, show the first uncompleted task (or first task if all are completed).
  const currentTask = useMemo(() => {
    if (pinnedTaskId) {
      const pinned = tasks.find(t => t.id === pinnedTaskId);
      if (pinned) return pinned;
    }
    return uncompletedTasks.length > 0 ? uncompletedTasks[0] : (tasks.length > 0 ? tasks[0] : null);
  }, [pinnedTaskId, tasks, uncompletedTasks]);

  // Study hours calculation
  const studyMinutes = useMemo(() => {
    return tasks
      .filter(t => t.completed)
      .reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [tasks]);
  const studyHoursLogged = Math.round((studyMinutes / 60) * 10) / 10;
  const goalStudyHours = profile.daily_study_goal || 8;

  // Questions solved today
  const todayQuestionLogs = useMemo(() => {
    return storageService.getQuestionLogs().filter(l => l.date === todayStr);
  }, [todayStr]);
  const todayQuestionsCount = todayQuestionLogs.reduce((acc, l) => acc + (l.total || 0), 0);
  const goalQuestions = profile.daily_question_goal || 200;

  // Subject Progress
  const phyProgress = storageService.calculateSubjectProgress('Physics');
  const chemProgress = storageService.calculateSubjectProgress('Chemistry');
  const bioProgress = storageService.calculateSubjectProgress('Biology');

  // Toggle Task Completion with smooth, polished micro-interaction
  const handleToggleTask = (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    // Prevent duplicate triggers while animating exit
    if (isExiting) return;

    if (!targetTask.completed) {
      // 1. Immediately toggle in backend & state -> Progress count & % animate immediately
      const updated = storageService.toggleTaskComplete(taskId);
      if (updated) {
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, completed: true } : t))
        );
      }

      // Check if this was the final task
      const remainingUncompleted = tasks.filter(t => t.id !== taskId && !t.completed);
      const isFinalTask = remainingUncompleted.length === 0;

      // 2. Animate checkbox bounce & keep task visible with strikethrough & "✓ Completed" badge
      setCompletingTaskId(taskId);
      setPinnedTaskId(taskId);

      // 5. If this was the final task, keep completed state visible and show positive message
      if (isFinalTask) {
        return;
      }

      // 4. After ~700ms confirmation, smoothly fade/slide away and reveal the next upcoming task
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      timerRef.current = setTimeout(() => {
        setIsExiting(true);

        exitTimerRef.current = setTimeout(() => {
          setIsExiting(false);
          setCompletingTaskId(null);
          setPinnedTaskId(null);
        }, 260); // duration of smooth slide/fade exit
      }, 680); // keep visible for ~700ms
    } else {
      // Unchecking task
      const updated = storageService.toggleTaskComplete(taskId);
      if (updated) {
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, completed: false } : t))
        );
      }
      setCompletingTaskId(null);
      setPinnedTaskId(null);
      setIsExiting(false);
    }
  };

  // Add task fallback handler
  const handleAddTask = (newTaskData: any) => {
    const added = storageService.addTask(newTaskData);
    if (added.date === todayStr) {
      setTasks(prev => [added, ...prev]);
    }
  };

  // The ONE primary action handler
  const handlePrimaryAction = () => {
    if (totalTasks === 0) {
      if (onNavigateToTab) {
        onNavigateToTab('plan');
      } else {
        setIsAddTaskOpen(true);
      }
    } else {
      if (onNavigateToTab) {
        onNavigateToTab('plan');
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-xl mx-auto px-1 sm:px-0">
      {/* 1. HEADER */}
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {greeting}, {profile.name || 'Aspirant'}
        </h1>
        <p className="text-sm font-medium text-zinc-400">
          {profile.target_exam || 'NEET 2027'} · {daysRemaining} days remaining
        </p>
      </header>

      {/* 2. TODAY'S PLAN — Most prominent section */}
      <section className="dark-card rounded-3xl p-5 sm:p-6 border border-white/[0.08] relative overflow-hidden space-y-5 shadow-lg">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6e3ff5]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8b5cf6]">
            Today's Plan
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-300 transition-all duration-300">
              {completedTasks} / {totalTasks} completed
            </span>
            {totalTasks > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                allCompleted 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-white/[0.06] text-zinc-300 border border-white/[0.08]'
              }`}>
                {todayProgressPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Current / Next Task or Empty State */}
        {totalTasks === 0 ? (
          <div className="py-6 text-center space-y-1.5">
            <p className="text-base font-bold text-white">No tasks scheduled for today</p>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Plan your day to stay on track for your target exam.
            </p>
          </div>
        ) : currentTask ? (
          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider transition-all duration-300">
              {allCompleted ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  All tasks finished for today
                </span>
              ) : currentTask.completed ? (
                <span className="text-purple-300 font-bold">
                  ✓ Task completed
                </span>
              ) : (
                <span className="text-zinc-400">
                  Current task
                </span>
              )}
            </div>

            {/* Task Card with Smooth Animated Transitions */}
            <div
              key={currentTask.id}
              onClick={() => handleToggleTask(currentTask.id)}
              className={`rounded-2xl p-4 border cursor-pointer flex items-start justify-between gap-3.5 transition-all duration-300 ease-out ${
                isExiting
                  ? 'opacity-0 -translate-y-2 scale-[0.98]'
                  : 'opacity-100 translate-y-0 scale-100 animate-task-reveal'
              } ${
                currentTask.completed
                  ? 'bg-[#15151a] border-white/[0.04]'
                  : 'bg-[#18181f] hover:bg-[#1f1f28] border-white/[0.08] hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Checkbox with Immediate Color Fill & Scale/Bounce Animation */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleToggleTask(currentTask.id);
                  }}
                  className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 ${
                    currentTask.completed
                      ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-sm'
                      : 'border-zinc-600 hover:border-primary-light bg-[#121216]'
                  } ${completingTaskId === currentTask.id ? 'animate-check-bounce' : ''}`}
                  aria-label={currentTask.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {currentTask.completed && (
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${completingTaskId === currentTask.id ? 'animate-check-bounce' : ''}`} />
                  )}
                </button>

                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SubjectBadge subject={currentTask.subject_name} size="sm" />
                    <span className="text-xs font-medium text-zinc-400 truncate">
                      {currentTask.chapter_name || currentTask.subject_name}
                    </span>

                    {/* Small "✓ Completed" Confirmation Badge */}
                    {currentTask.completed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 bg-[#6e3ff5]/20 px-2 py-0.5 rounded-full border border-[#6e3ff5]/30 animate-fade-in">
                        ✓ Completed
                      </span>
                    )}
                  </div>

                  {/* Title with Smooth Strikethrough & Muted State */}
                  <h3
                    className={`text-sm sm:text-base font-bold tracking-tight transition-all duration-300 ${
                      currentTask.completed ? 'line-through text-zinc-500' : 'text-white'
                    }`}
                  >
                    {currentTask.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 font-medium text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {currentTask.duration}m
                    </span>
                    <span>·</span>
                    <span className="text-zinc-300 font-medium">{currentTask.task_type}</span>
                    <span>·</span>
                    <PriorityBadge priority={currentTask.priority} />
                  </div>
                </div>
              </div>
            </div>

            {/* Positive Completion Message for Final Task */}
            {allCompleted && totalTasks > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#6e3ff5]/10 border border-[#6e3ff5]/25 text-xs text-purple-200 flex items-center gap-2.5 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-[#6e3ff5]/20 flex items-center justify-center text-[#a78bfa] shrink-0 font-bold">
                  ✓
                </div>
                <span className="font-semibold">
                  All tasks completed for today! Amazing work keeping your NEET prep streak strong.
                </span>
              </div>
            )}

            {/* Remaining Tasks Count */}
            {totalTasks > 1 && !allCompleted && (
              <p className="text-[11px] text-zinc-500 text-center pt-0.5 font-medium transition-all duration-300">
                {totalTasks - completedTasks} {totalTasks - completedTasks === 1 ? 'task' : 'tasks'} remaining today
              </p>
            )}
          </div>
        ) : null}

        {/* The ONE Primary Action */}
        <div className="pt-1">
          {totalTasks === 0 ? (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="w-full py-3.5 px-6 rounded-2xl btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-btn transition active:scale-98"
            >
              Plan My Day
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="w-full py-3.5 px-6 rounded-2xl btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-btn transition active:scale-98"
            >
              Start Today's Plan
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </section>

      {/* 3. TODAY'S GOAL */}
      <section className="dark-card rounded-2xl p-5 border border-white/[0.07] space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 block">
          Today's Goal
        </span>

        <div className="grid grid-cols-2 gap-4">
          {/* Study hours */}
          <div className="space-y-1.5">
            <div className="text-xs text-zinc-400">Study hours:</div>
            <div className="text-base sm:text-lg font-bold text-white tracking-tight">
              {studyHoursLogged}h / {goalStudyHours}h
            </div>
            <ProgressBar
              percentage={Math.min(100, Math.round((studyHoursLogged / goalStudyHours) * 100))}
              colorClass="bg-[#6e3ff5]"
              height="h-1.5"
            />
          </div>

          {/* Questions */}
          <div className="space-y-1.5">
            <div className="text-xs text-zinc-400">Questions:</div>
            <div className="text-base sm:text-lg font-bold text-white tracking-tight">
              {todayQuestionsCount} / {goalQuestions}
            </div>
            <ProgressBar
              percentage={Math.min(100, Math.round((todayQuestionsCount / goalQuestions) * 100))}
              colorClass="bg-[#8b5cf6]"
              height="h-1.5"
            />
          </div>
        </div>
      </section>

      {/* 4. PREPARATION */}
      <section className="dark-card rounded-2xl p-5 border border-white/[0.07] space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 block">
            Preparation
          </span>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('progress')}
              className="text-xs text-primary-light hover:underline font-semibold flex items-center gap-0.5"
            >
              View Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Single compact section showing all three subject progress values */}
        <div className="space-y-3">
          {/* Physics */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                <span className="font-semibold text-zinc-200">Physics</span>
              </div>
              <span className="font-bold text-[#7dd3fc]">{phyProgress}%</span>
            </div>
            <ProgressBar percentage={phyProgress} colorClass="bg-[#38bdf8]" height="h-1.5" />
          </div>

          {/* Chemistry */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c084fc]" />
                <span className="font-semibold text-zinc-200">Chemistry</span>
              </div>
              <span className="font-bold text-[#e9d5ff]">{chemProgress}%</span>
            </div>
            <ProgressBar percentage={chemProgress} colorClass="bg-[#c084fc]" height="h-1.5" />
          </div>

          {/* Biology */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34d399]" />
                <span className="font-semibold text-zinc-200">Biology</span>
              </div>
              <span className="font-bold text-[#6ee7b7]">{bioProgress}%</span>
            </div>
            <ProgressBar percentage={bioProgress} colorClass="bg-[#34d399]" height="h-1.5" />
          </div>
        </div>
      </section>

      {/* Add Task Modal fallback if needed */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
};
