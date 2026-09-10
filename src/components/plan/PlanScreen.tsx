import React, { useState, useMemo } from 'react';
import { Task, SubjectType } from '../../types';
import { storageService, getTodayDateStr } from '../../services/storageService';
import { SubjectBadge, PriorityBadge, ProgressBar, Modal } from '../common/UIComponents';
import { AddTaskModal } from '../today/AddTaskModal';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Check, 
  Clock, 
  MoveRight, 
  Trash2, 
  BarChart3
} from 'lucide-react';

export const PlanScreen: React.FC = () => {
  const profile = storageService.getProfile();
  const today = getTodayDateStr();

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [tasks, setTasks] = useState<Task[]>(() => storageService.getTasks());
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [movingTask, setMovingTask] = useState<Task | null>(null);
  const [newMoveDate, setNewMoveDate] = useState<string>(today);

  // Generate 14-day horizontal date list around today
  const dateList = useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const base = new Date();
    base.setDate(base.getDate() - 3);

    for (let i = 0; i < 14; i++) {
      const current = new Date(base);
      current.setDate(base.getDate() + i);
      const str = current.toISOString().split('T')[0];
      const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = current.getDate();
      list.push({
        dateStr: str,
        dayName,
        dayNumber,
        isToday: str === today
      });
    }
    return list;
  }, [today]);

  const selectedDayTasks = useMemo(() => {
    return tasks.filter(t => t.date === selectedDate);
  }, [tasks, selectedDate]);

  const completedCount = selectedDayTasks.filter(t => t.completed).length;
  const plannedCount = selectedDayTasks.length;

  const selectedDayMinutes = selectedDayTasks
    .filter(t => t.completed)
    .reduce((acc, t) => acc + (t.duration || 0), 0);
  const completedHoursDisplay = `${Math.floor(selectedDayMinutes / 60)}h ${selectedDayMinutes % 60}m`;
  const goalHoursDisplay = `${profile.daily_study_goal || 6}h`;

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDayTitle = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const handleToggleTask = (taskId: string) => {
    const updated = storageService.toggleTaskComplete(taskId);
    if (updated) {
      setTasks(storageService.getTasks());
    }
  };

  const handleAddTask = (newTaskData: any) => {
    storageService.addTask(newTaskData);
    setTasks(storageService.getTasks());
  };

  const handleDeleteTask = (taskId: string) => {
    storageService.deleteTask(taskId);
    setTasks(storageService.getTasks());
  };

  const handleConfirmMove = () => {
    if (movingTask && newMoveDate) {
      storageService.updateTask(movingTask.id, { date: newMoveDate });
      setTasks(storageService.getTasks());
      setMovingTask(null);
    }
  };

  const currentWeekDays = useMemo(() => {
    const curr = new Date();
    const firstDay = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return days.map((dayName, index) => {
      const d = new Date(curr);
      d.setDate(firstDay + index);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.date === dateStr);
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
  }, [tasks]);

  const totalWeeklyTasks = currentWeekDays.reduce((acc, d) => acc + d.tasksCount, 0);
  const totalWeeklyCompleted = currentWeekDays.reduce((acc, d) => acc + d.completedCount, 0);
  const weeklyProgressPercent = totalWeeklyTasks > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyTasks) * 100) : 0;

  const weeklyStudyHours = Math.round(
    tasks
      .filter(t => t.completed)
      .reduce((acc, t) => acc + (t.duration || 0), 0) / 60
  );

  const weeklyQuestionsSolved = storageService.getTotalQuestionsSolved().total;
  const weeklyStudyTargetHours = (profile.daily_study_goal || 6) * 7;
  const weeklyQuestionTarget = (profile.daily_question_goal || 200) * 7;

  return (
    <div className="space-y-6 pb-28 md:pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Plan</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Schedule tasks, protect study blocks, review weekly progress</p>
        </div>
        <button
          onClick={() => setIsAddTaskOpen(true)}
          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-btn"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Plan Task
        </button>
      </div>

      {/* Horizontal Date Selector (Matching Reference Pill Row) */}
      <div className="dark-card rounded-3xl p-4 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-[#8b5cf6]" />
            Select Day
          </span>
          <button
            onClick={() => setSelectedDate(today)}
            className="text-xs text-primary-light hover:underline font-bold"
          >
            Today
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {dateList.map(item => {
            const isSelected = item.dateStr === selectedDate;
            const tasksOnThisDay = tasks.filter(t => t.date === item.dateStr);

            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-2.5 rounded-2xl border transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-btn'
                    : 'border-white/[0.07] bg-[#222228] text-zinc-400 hover:text-white'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{item.dayName}</span>
                <span className={`text-base font-black my-0.5 ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                  {item.dayNumber}
                </span>
                {item.isToday ? (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#6e3ff5]'}`}></span>
                ) : tasksOnThisDay.length > 0 ? (
                  <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                ) : (
                  <span className="w-1 h-1 opacity-0">.</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Stats Card */}
      <div className="dark-card rounded-3xl p-5 border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.07]">
          <div>
            <span className="text-xs font-bold text-primary-light uppercase tracking-wider">
              {selectedDate === today ? 'Today · ' : ''}{formattedDayTitle}
            </span>
            <div className="text-lg font-black text-white tracking-tight mt-0.5">
              {plannedCount} tasks planned · {completedCount} completed
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-full bg-[#25252c] border border-white/[0.07]">
              <span className="text-zinc-400 text-[10px] mr-1">Study:</span>
              <span className="font-black text-white">{completedHoursDisplay} / {goalHoursDisplay}</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#25252c] border border-white/[0.07]">
              <span className="text-zinc-400 text-[10px] mr-1">Target:</span>
              <span className="font-black text-emerald-400">{profile.daily_question_goal || 200} Qs</span>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2.5">
          {selectedDayTasks.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm font-bold text-white">No tasks scheduled for this day.</p>
              <p className="text-xs text-zinc-400">Plan ahead to maintain your streak and avoid cramming.</p>
              <button
                onClick={() => setIsAddTaskOpen(true)}
                className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Study Task
              </button>
            </div>
          ) : (
            selectedDayTasks.map(task => (
              <div
                key={task.id}
                className={`dark-card rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                  task.completed ? 'border-white/[0.04] opacity-65 bg-[#1a1a20]' : 'border-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition ${
                      task.completed
                        ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white'
                        : 'border-zinc-600 bg-[#18181e]'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <SubjectBadge subject={task.subject_name} size="sm" />
                      <span className="text-xs text-zinc-400 truncate">{task.chapter_name}</span>
                    </div>
                    <p className={`text-sm font-semibold mt-0.5 truncate ${task.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span>{task.duration}m</span>
                      <span>·</span>
                      <span>{task.task_type}</span>
                      <span>·</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMovingTask(task);
                      setNewMoveDate(task.date);
                    }}
                    className="w-8 h-8 rounded-full bg-[#1c1c22] text-zinc-400 hover:text-white flex items-center justify-center transition"
                    title="Move to another date"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="w-8 h-8 rounded-full bg-[#1c1c22] text-zinc-400 hover:text-rose-400 flex items-center justify-center transition"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WEEKLY OVERVIEW (Minimalist Dark Card) */}
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

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        defaultDate={selectedDate}
      />

      {/* Move Task Modal */}
      <Modal
        isOpen={Boolean(movingTask)}
        onClose={() => setMovingTask(null)}
        title="Reschedule Task"
        subtitle={movingTask?.title}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Move to New Date
            </label>
            <input
              type="date"
              value={newMoveDate}
              onChange={e => setNewMoveDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl dark-input text-sm text-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setMovingTask(null)}
              className="flex-1 py-2.5 rounded-full bg-[#25252c] text-xs font-bold text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmMove}
              className="flex-1 py-2.5 rounded-full btn-primary text-xs font-bold"
            >
              Move Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
