import React, { useState, useMemo, useEffect } from 'react';
import { Task, SubjectType, PriorityLevel, TaskType } from '../../types';
import { storageService, getTodayDateStr } from '../../services/storageService';
import { SubjectBadge, Modal } from '../common/UIComponents';
import { AddTaskModal } from '../today/AddTaskModal';
import { 
  Plus, 
  Check, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Trash2,
  Calendar
} from 'lucide-react';

export const PlanScreen: React.FC = () => {
  const profile = storageService.getProfile();
  const today = getTodayDateStr();

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [tasks, setTasks] = useState<Task[]>(() => storageService.getTasks());
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Edit Task Form State
  const [editTitle, setEditTitle] = useState('');
  const [editChapter, setEditChapter] = useState('');
  const [editSubject, setEditSubject] = useState<SubjectType>('Physics');
  const [editTaskType, setEditTaskType] = useState<TaskType>('MCQs');
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editDate, setEditDate] = useState<string>(today);
  const [editPriority, setEditPriority] = useState<PriorityLevel>('Medium');
  const [editCompleted, setEditCompleted] = useState<boolean>(false);

  // Populate edit form when a task is selected
  useEffect(() => {
    if (editingTask) {
      setEditTitle(editingTask.title);
      setEditChapter(editingTask.chapter_name || '');
      setEditSubject(editingTask.subject_name);
      setEditTaskType(editingTask.task_type);
      setEditDuration(editingTask.duration);
      setEditDate(editingTask.date);
      setEditPriority(editingTask.priority);
      setEditCompleted(editingTask.completed);
    }
  }, [editingTask]);

  // Month navigation: title formatted as Month Year
  const monthYearTitle = useMemo(() => {
    return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewDate]);

  // 7-day strip (Monday - Sunday) centered on viewDate
  const weekDays = useMemo(() => {
    const d = new Date(viewDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d);
    monday.setDate(diff);

    const list: {
      dateStr: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
      hasTasks: boolean;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = current.getDate();
      const hasTasks = tasks.some(t => t.date === dateStr);
      list.push({
        dateStr,
        dayName,
        dayNumber,
        isToday: dateStr === today,
        hasTasks
      });
    }
    return list;
  }, [viewDate, tasks, today]);

  // Navigate weeks
  const handlePrevWeek = () => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDate(today);
  };

  // Day calculations
  const selectedDayTasks = useMemo(() => {
    return tasks.filter(t => t.date === selectedDate);
  }, [tasks, selectedDate]);

  const plannedCount = selectedDayTasks.length;
  const completedCount = selectedDayTasks.filter(t => t.completed).length;

  const plannedMinutes = useMemo(() => {
    return selectedDayTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [selectedDayTasks]);

  const plannedHoursDisplay = useMemo(() => {
    const h = Math.floor(plannedMinutes / 60);
    const m = plannedMinutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }, [plannedMinutes]);

  const targetHours = profile.daily_study_goal || 8;
  const plannedHoursNum = Math.round((plannedMinutes / 60) * 10) / 10;
  const overHours = Math.round((plannedHoursNum - targetHours) * 10) / 10;

  // Toggle completion
  const handleToggleTask = (taskId: string) => {
    const updated = storageService.toggleTaskComplete(taskId);
    if (updated) {
      setTasks(storageService.getTasks());
    }
  };

  // Add task
  const handleAddTask = (newTaskData: any) => {
    storageService.addTask(newTaskData);
    setTasks(storageService.getTasks());
  };

  // Save edited task
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    storageService.updateTask(editingTask.id, {
      title: editTitle.trim() || editingTask.title,
      chapter_name: editChapter.trim() || undefined,
      subject_name: editSubject,
      subject_id: editSubject,
      task_type: editTaskType,
      duration: Number(editDuration) || 60,
      date: editDate,
      priority: editPriority,
      completed: editCompleted
    });

    setTasks(storageService.getTasks());
    setEditingTask(null);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Delete this study task?')) {
      storageService.deleteTask(taskId);
      setTasks(storageService.getTasks());
      setEditingTask(null);
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-xl mx-auto px-1 sm:px-0">
      {/* 1. HEADER & ONE PRIMARY ACTION */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Plan</h1>
          <p className="text-xs text-zinc-400 mt-0.5">What am I going to study?</p>
        </div>

        <button
          onClick={() => setIsAddTaskOpen(true)}
          className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-btn transition active:scale-98 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Plan Task
        </button>
      </div>

      {/* 2. COMPACT DATE SELECTOR WITH MONTH NAVIGATION */}
      <div className="bg-[#141419] rounded-2xl p-3 border border-white/[0.07] space-y-2.5">
        {/* Month bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 flex items-center justify-center transition active:scale-95"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white px-1.5">
              {monthYearTitle}
            </span>
            <button
              onClick={handleNextWeek}
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 flex items-center justify-center transition active:scale-95"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedDate !== today && (
            <button
              onClick={handleGoToday}
              className="text-[11px] font-bold text-[#a78bfa] hover:text-white px-2.5 py-1 rounded-full bg-[#6e3ff5]/15 border border-[#6e3ff5]/30 transition active:scale-95"
            >
              Jump to Today
            </button>
          )}
        </div>

        {/* Compact Horizontal Date Strip */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map(item => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#6e3ff5] text-white shadow-btn'
                    : item.isToday
                    ? 'bg-[#202028] text-zinc-200 border border-[#6e3ff5]/40 hover:border-[#6e3ff5]'
                    : 'bg-[#18181f] text-zinc-400 hover:text-white border border-white/[0.03]'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider">{item.dayName}</span>
                <span className={`text-sm sm:text-base font-bold my-0.5 ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                  {item.dayNumber}
                </span>
                {item.isToday ? (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#8b5cf6]'}`} />
                ) : item.hasTasks ? (
                  <span className="w-1 h-1 rounded-full bg-zinc-500" />
                ) : (
                  <span className="w-1 h-1 opacity-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SIMPLIFIED DAILY SUMMARY & WORKLOAD CHECK */}
      <div className="bg-[#141419] rounded-2xl p-3.5 border border-white/[0.07] space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-bold text-white">
            {plannedCount} tasks · {completedCount} completed
          </span>
          <span className="font-medium text-zinc-400">
            {plannedHoursDisplay} planned · {targetHours}h target
          </span>
        </div>

        {/* Subtle Overload Warning if Planned Time Exceeds Target */}
        {overHours > 0 && (
          <div className="flex items-center gap-2 pt-1 text-xs text-amber-300 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>You're planning {overHours}h over your daily target.</span>
          </div>
        )}
      </div>

      {/* 4. TASK LIST — Main Focus */}
      <div className="space-y-2.5">
        {selectedDayTasks.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-3 rounded-2xl bg-[#141419] border border-white/[0.05]">
            <p className="text-sm font-bold text-white">No tasks planned for this day</p>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Keep your NEET prep consistent by scheduling a focused study block.
            </p>
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(true)}
              className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 rounded-xl shadow-btn mt-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              + Plan Task
            </button>
          </div>
        ) : (
          selectedDayTasks.map(task => (
            <div
              key={task.id}
              onClick={() => setEditingTask(task)}
              className={`rounded-2xl p-3.5 border transition cursor-pointer flex items-start gap-3.5 active:scale-[0.99] ${
                task.completed
                  ? 'bg-[#15151a] border-white/[0.04] opacity-60'
                  : 'bg-[#18181f] hover:bg-[#1e1e27] border-white/[0.07] hover:border-white/[0.12]'
              }`}
            >
              {/* [checkbox] One-tap Completion */}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleToggleTask(task.id);
                }}
                className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition shrink-0 border ${
                  task.completed
                    ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-sm'
                    : 'border-zinc-600 hover:border-primary-light bg-[#121216]'
                }`}
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              {/* Task Content */}
              <div className="min-w-0 flex-1 space-y-1">
                {/* Subject and Meaningful Priority (High only) */}
                <div className="flex items-center gap-2">
                  <SubjectBadge subject={task.subject_name} size="sm" />
                  {task.priority === 'High' && !task.completed && (
                    <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                      High
                    </span>
                  )}
                </div>

                {/* Chapter / task name */}
                <div>
                  {task.chapter_name && (
                    <p className="text-xs text-zinc-400 font-medium truncate">
                      {task.chapter_name}
                    </p>
                  )}
                  <h3
                    className={`text-sm font-semibold tracking-tight truncate ${
                      task.completed ? 'line-through text-zinc-500' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h3>
                </div>

                {/* Duration · Task type */}
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 text-zinc-300 font-medium">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {task.duration}m
                  </span>
                  <span>·</span>
                  <span className="text-zinc-300 font-medium">{task.task_type}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. ADD TASK MODAL */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        defaultDate={selectedDate}
      />

      {/* 6. TASK DETAILS / EDIT MODAL (Opened on task tap) */}
      <Modal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Task Details"
        subtitle={editingTask?.chapter_name || editingTask?.subject_name}
      >
        {editingTask && (
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Physics', 'Chemistry', 'Biology'] as SubjectType[]).map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setEditSubject(sub)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      editSubject === sub
                        ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white shadow-sm'
                        : 'bg-[#18181f] border-white/[0.08] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Chapter
              </label>
              <input
                type="text"
                value={editChapter}
                onChange={e => setEditChapter(e.target.value)}
                placeholder="e.g. Current Electricity"
                className="w-full px-3.5 py-2.5 rounded-xl dark-input text-sm text-white"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Task Name
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl dark-input text-sm text-white"
              />
            </div>

            {/* Task Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <select
                  value={editTaskType}
                  onChange={e => setEditTaskType(e.target.value as TaskType)}
                  className="w-full px-3 py-2.5 rounded-xl dark-input text-sm text-white"
                >
                  <option value="MCQs">MCQs</option>
                  <option value="NCERT">NCERT</option>
                  <option value="Notes">Notes</option>
                  <option value="Revision">Revision</option>
                  <option value="Lecture">Lecture</option>
                  <option value="Mock Test">Mock Test</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={e => setEditPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2.5 rounded-xl dark-input text-sm text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Duration & Date (Reschedule) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min="10"
                  max="360"
                  step="5"
                  value={editDuration}
                  onChange={e => setEditDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl dark-input text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl dark-input text-sm text-white"
                />
              </div>
            </div>

            {/* Completion Toggle */}
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#16161c] border border-white/[0.05]">
              <span className="text-xs font-semibold text-zinc-300">Mark as completed</span>
              <button
                type="button"
                onClick={() => setEditCompleted(!editCompleted)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition border ${
                  editCompleted
                    ? 'bg-[#6e3ff5] border-[#6e3ff5] text-white'
                    : 'border-zinc-600 bg-[#121216]'
                }`}
              >
                {editCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
              <button
                type="button"
                onClick={() => handleDeleteTask(editingTask.id)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Task
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-btn transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
