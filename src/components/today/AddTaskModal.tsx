import React, { useState, useMemo, useEffect } from 'react';
import { SubjectType, TaskType, PriorityLevel } from '../../types';
import { NEET_SYLLABUS } from '../../data/neetSyllabus';
import { getTodayDateStr } from '../../services/storageService';
import { Modal } from '../common/UIComponents';
import { Plus, ChevronDown, ChevronUp, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const DURATION_PRESETS = [30, 45, 60, 90];
const TASK_TYPES: TaskType[] = ['Study', 'MCQs', 'Revision', 'Test', 'Habit', 'Other'];

export interface NewTaskPayload {
  title: string;
  subject_name?: SubjectType | string;
  subject_id?: string;
  chapter_name?: string;
  topic_name?: string;
  task_type?: TaskType;
  duration?: number;
  priority?: PriorityLevel;
  notes?: string;
  date: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: NewTaskPayload) => void;
  defaultDate?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  defaultDate
}) => {
  // 1. Task Name (Core Required)
  const [title, setTitle] = useState('');

  // 2. Optional Subject (None by default)
  const [subject, setSubject] = useState<SubjectType | 'Other' | null>(null);

  // 3. Optional Duration (None by default)
  const [duration, setDuration] = useState<number | null>(null);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState('45');

  // 4. Date (Default Today or defaultDate)
  const [date, setDate] = useState<string>(defaultDate || getTodayDateStr());

  // 5. More Options (Collapsible)
  const [showMore, setShowMore] = useState(false);
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [taskType, setTaskType] = useState<TaskType | null>(null);
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [notes, setNotes] = useState('');

  // Success toast state
  const [toastAdded, setToastAdded] = useState(false);

  // Sync date when defaultDate or isOpen changes
  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    } else {
      setDate(getTodayDateStr());
    }
  }, [defaultDate, isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSubject(null);
      setDuration(null);
      setIsCustomDuration(false);
      setShowMore(false);
      setChapter('');
      setTopic('');
      setTaskType(null);
      setPriority('Medium');
      setNotes('');
      setToastAdded(false);
    }
  }, [isOpen]);

  // Chapters list for NEET subjects
  const syllabusChapters = useMemo(() => {
    if (subject && (subject === 'Physics' || subject === 'Chemistry' || subject === 'Biology')) {
      return NEET_SYLLABUS[subject].chapters.map(c => c.name);
    }
    return [];
  }, [subject]);

  const handleSubjectToggle = (selected: SubjectType | 'Other') => {
    if (subject === selected) {
      // Toggle off to None
      setSubject(null);
      setChapter('');
    } else {
      setSubject(selected);
      // If switching to a NEET subject and chapter was empty, don't force, leave optional
      if (selected !== 'Other') {
        // Keep chapter optional
      }
    }
  };

  const handleDurationPresetClick = (preset: number) => {
    if (duration === preset && !isCustomDuration) {
      // Toggle off to None
      setDuration(null);
    } else {
      setDuration(preset);
      setIsCustomDuration(false);
    }
  };

  const handleCustomDurationToggle = () => {
    if (isCustomDuration) {
      setIsCustomDuration(false);
      setDuration(null);
    } else {
      setIsCustomDuration(true);
      const val = Number(customDurationInput) || 45;
      setDuration(val);
    }
  };

  const handleCustomDurationChange = (valStr: string) => {
    setCustomDurationInput(valStr);
    const num = Number(valStr);
    if (num > 0) {
      setDuration(num);
    } else {
      setDuration(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: NewTaskPayload = {
      title: title.trim(),
      date: date || getTodayDateStr(),
      subject_name: subject || undefined,
      subject_id: subject || undefined,
      chapter_name: chapter.trim() || undefined,
      topic_name: topic.trim() || undefined,
      task_type: taskType || undefined,
      duration: duration !== null && duration > 0 ? duration : undefined,
      priority,
      notes: notes.trim() || undefined
    };

    onAddTask(payload);

    setToastAdded(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const isFormValid = title.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Task"
      subtitle="What do you want to accomplish?"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Subtle Confirmation Banner */}
        {toastAdded && (
          <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Task added ✓
          </div>
        )}

        {/* 1. TASK NAME (Core Required Field) */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
            Task Name <span className="text-primary-light">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What do you want to accomplish?"
            className="w-full px-4 py-3 rounded-2xl dark-input text-sm text-white font-medium focus:ring-2 focus:ring-[#6e3ff5] placeholder:text-zinc-500"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            e.g. Solve 50 Electrostatics MCQs, Revise Thermodynamics, Go for a 30 min walk
          </p>
        </div>

        {/* 2. OPTIONAL SUBJECT */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Subject
            </label>
            <span className="text-[11px] text-zinc-500">Optional</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(['Physics', 'Chemistry', 'Biology', 'Other'] as const).map(sub => {
              const isSelected = subject === sub;
              const activeStyle = {
                Physics: 'bg-[#0369a1] border-[#38bdf8] text-white shadow-sm',
                Chemistry: 'bg-[#6d28d9] border-[#c084fc] text-white shadow-sm',
                Biology: 'bg-[#047857] border-[#34d399] text-white shadow-sm',
                Other: 'bg-[#4b5563] border-[#9ca3af] text-white shadow-sm',
              }[sub];

              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubjectToggle(sub)}
                  className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition active:scale-98 ${
                    isSelected
                      ? activeStyle
                      : 'border-white/[0.08] bg-[#18181f] text-zinc-400 hover:text-white hover:border-white/[0.16]'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. OPTIONAL DURATION */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Duration
            </label>
            <span className="text-[11px] text-zinc-500">Optional</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {DURATION_PRESETS.map(mins => {
              const isSelected = duration === mins && !isCustomDuration;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleDurationPresetClick(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition text-center active:scale-98 ${
                    isSelected
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#18181f] text-zinc-400 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleCustomDurationToggle}
              className={`py-2 rounded-xl text-xs font-bold border transition text-center active:scale-98 ${
                isCustomDuration
                  ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                  : 'border-white/[0.08] bg-[#18181f] text-zinc-400 hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>

          {isCustomDuration && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="360"
                step="5"
                value={customDurationInput}
                onChange={e => handleCustomDurationChange(e.target.value)}
                placeholder="Minutes"
                className="w-28 px-3 py-2 rounded-xl dark-input text-xs text-white"
              />
              <span className="text-xs text-zinc-400">minutes</span>
            </div>
          )}
        </div>

        {/* 4. DATE / SCHEDULING */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl dark-input text-xs sm:text-sm text-white font-medium"
          />
        </div>

        {/* 5. COLLAPSIBLE "MORE OPTIONS" (Chapter, Topic, Task Type, Priority, Notes) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="w-full py-2.5 px-3 rounded-2xl bg-[#141419] hover:bg-[#1a1a20] border border-white/[0.06] flex items-center justify-between text-xs font-bold text-zinc-300 transition"
          >
            <span>More options (Chapter, Topic, Type, Priority, Notes)</span>
            {showMore ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {showMore && (
            <div className="mt-3 p-4 rounded-2xl bg-[#141419] border border-white/[0.06] space-y-3.5 animate-fade-in">
              {/* Optional Chapter */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Chapter / Topic Area
                </label>
                {syllabusChapters.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={chapter}
                      onChange={e => setChapter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white"
                    >
                      <option value="">Select a chapter (Optional)</option>
                      {syllabusChapters.map(ch => (
                        <option key={ch} value={ch} className="bg-[#18181e] text-white">
                          {ch}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={chapter}
                      onChange={e => setChapter(e.target.value)}
                      placeholder="Or type custom chapter name..."
                      className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={chapter}
                    onChange={e => setChapter(e.target.value)}
                    placeholder="e.g. Current Electricity, Morphology, Daily Health"
                    className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white"
                  />
                )}
              </div>

              {/* Optional Topic */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Kirchhoff's Laws, Cell Wall, 5000 Steps"
                  className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white"
                />
              </div>

              {/* Optional Task Type */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Task Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TASK_TYPES.map(type => {
                    const isSelected = taskType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTaskType(isSelected ? null : type)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center ${
                          isSelected
                            ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                            : 'border-white/[0.08] bg-[#1a1a20] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Low', 'Medium', 'High'] as PriorityLevel[]).map(lvl => {
                    const isSelected = priority === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setPriority(lvl)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition text-center ${
                          isSelected
                            ? 'border-white/[0.2] bg-white/[0.1] text-white'
                            : 'border-white/[0.06] bg-[#1a1a20] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Extra reminders, questions numbers, or notes..."
                  className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. PRIMARY CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid || toastAdded}
            className="w-full py-3.5 px-6 rounded-full btn-primary text-sm font-bold transition shadow-btn flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
